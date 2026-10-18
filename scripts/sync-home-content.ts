/**
 * sync-home-content.ts
 *
 * 把 Google Sheets 的首頁內容同步成 src/content/home/*.json。
 * 試算表需設為「知道連結的任何人都可以檢視」；不使用任何憑證，前端也不會接觸到試算表。
 *
 * 分頁（名稱需完全相同）：
 *   hero_cards   → src/content/home/hero.json        的 cards
 *   labs         → src/content/home/labs.json        的 items
 *   solar_videos → src/content/home/solar-star.json  的 videos
 *
 * 用法：
 *   HOME_CONTENT_SHEET_ID=<試算表 ID> npx tsx scripts/sync-home-content.ts
 *   npx tsx scripts/sync-home-content.ts --csv-dir=<資料夾>      # 改讀本機 CSV（測試用）
 *   npx tsx scripts/sync-home-content.ts --export-csv=<資料夾>   # 把目前的 JSON 匯出成 CSV 範本
 *   加上 --dry-run 只驗證、不寫檔
 *
 * 任何一列驗證失敗就整批中止、不寫入任何檔案，網站維持上一次的正確內容。
 */

import fs from "fs";
import path from "path";
import { z } from "zod";
import {
  heroContentSchema,
  labsContentSchema,
  solarStarContentSchema,
} from "../src/lib/home-content-schema";

type ColumnType = "string" | "number" | "boolean" | "youtubeId" | "heroSource";

interface TabConfig {
  tab: string;
  file: string;
  listKey: string;
  schema: z.ZodType;
  columns: Record<string, ColumnType>;
  /** 這個分頁特有的欄位：用來發現分頁名稱打錯（Google 會默默回傳第一個分頁） */
  signatureColumn: string;
}

const CONTENT_DIR = path.resolve(process.cwd(), "src", "content", "home");

const TABS: TabConfig[] = [
  {
    tab: "hero_cards",
    file: path.join(CONTENT_DIR, "hero.json"),
    listKey: "cards",
    schema: heroContentSchema,
    signatureColumn: "href",
    columns: {
      id: "string",
      source: "heroSource",
      label: "string",
      title: "string",
      description: "string",
      image: "string",
      imageAlt: "string",
      emoji: "string",
      href: "string",
      ctaLabel: "string",
      status: "string",
      sortOrder: "number",
    },
  },
  {
    tab: "labs",
    file: path.join(CONTENT_DIR, "labs.json"),
    listKey: "items",
    schema: labsContentSchema,
    signatureColumn: "url",
    columns: {
      id: "string",
      title: "string",
      description: "string",
      coverImage: "string",
      emoji: "string",
      url: "string",
      status: "string",
      featured: "boolean",
      sortOrder: "number",
    },
  },
  {
    tab: "solar_videos",
    file: path.join(CONTENT_DIR, "solar-star.json"),
    listKey: "videos",
    schema: solarStarContentSchema,
    signatureColumn: "youtubeId",
    columns: {
      id: "string",
      youtubeId: "youtubeId",
      title: "string",
      description: "string",
      status: "string",
      sortOrder: "number",
    },
  },
];

// ─── CSV ─────────────────────────────────────────────────────────────────────

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const input = text.replace(/^﻿/, "");

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toCsv(rows: string[][]): string {
  const escape = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  return rows.map((row) => row.map(escape).join(",")).join("\n") + "\n";
}

// ─── 欄位轉換 ─────────────────────────────────────────────────────────────────

/** 接受 11 碼 ID 或完整 YouTube 網址（watch / shorts / youtu.be） */
export function extractYoutubeId(value: string): string {
  const match = value.match(/(?:youtu\.be\/|shorts\/|[?&]v=|embed\/)([\w-]{11})/);
  return match ? match[1] : value;
}

function convertCell(raw: string, type: ColumnType): unknown {
  const value = raw.trim();
  if (value === "") return undefined;
  switch (type) {
    case "number": {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value; // 非數字交給 schema 回報
    }
    case "boolean": {
      const normalized = value.toLowerCase();
      if (["true", "1", "yes", "y", "是", "v", "✓"].includes(normalized)) return true;
      if (["false", "0", "no", "n", "否", ""].includes(normalized)) return false;
      return value;
    }
    case "youtubeId":
      return extractYoutubeId(value);
    case "heroSource":
      return value === "manual" ? undefined : value;
    default:
      return value;
  }
}

function rowsToItems(config: TabConfig, table: string[][]): Record<string, unknown>[] {
  const [header, ...body] = table;
  if (!header) throw new Error(`分頁「${config.tab}」是空的（第一列需為欄位名稱）`);
  const names = header.map((name) => name.trim());

  // 其他欄位缺漏時由 schema 逐列回報；這三欄缺少代表分頁結構本身有誤
  const missing = ["id", "status", "sortOrder", config.signatureColumn].filter((column) => !names.includes(column));
  if (missing.length > 0) {
    throw new Error(
      `分頁「${config.tab}」缺少必要欄位：${missing.join(", ")}（若分頁名稱打錯，Google 會改回傳第一個分頁）`
    );
  }

  const items: Record<string, unknown>[] = [];
  for (const cells of body) {
    if (cells.every((cell) => cell.trim() === "")) continue; // 略過空白列
    const item: Record<string, unknown> = {};
    names.forEach((name, index) => {
      const type = config.columns[name];
      if (!type) return; // 忽略不認識的欄位（例如備註欄）
      const value = convertCell(cells[index] ?? "", type);
      if (value !== undefined) item[name] = value;
    });
    items.push(item);
  }
  return items;
}

// ─── 資料來源 ─────────────────────────────────────────────────────────────────

async function fetchSheetCsv(sheetId: string, tab: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url);
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || contentType.includes("text/html")) {
    throw new Error(
      `讀取分頁「${tab}」失敗（HTTP ${res.status}）。請確認試算表已設為「知道連結的任何人都可以檢視」，且分頁名稱正確。`
    );
  }
  return res.text();
}

function readLocalCsv(dir: string, tab: string): string {
  const file = path.resolve(dir, `${tab}.csv`);
  if (!fs.existsSync(file)) throw new Error(`找不到 ${file}`);
  return fs.readFileSync(file, "utf-8");
}

function formatIssues(config: TabConfig, error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const [first, index, ...rest] = issue.path;
      if (first === config.listKey && typeof index === "number") {
        // +2：第 1 列是欄位名稱，資料從第 2 列開始（不含已略過的空白列）
        return `  - ${config.tab} 第 ${index + 2} 列 ${rest.join(".") || ""}：${issue.message}`;
      }
      return `  - ${config.tab} ${issue.path.join(".")}：${issue.message}`;
    })
    .join("\n");
}

// ─── 主程式 ───────────────────────────────────────────────────────────────────

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function exportCsv(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
  for (const config of TABS) {
    const json = JSON.parse(fs.readFileSync(config.file, "utf-8"));
    const columns = Object.keys(config.columns);
    const rows = (json[config.listKey] as Record<string, unknown>[]).map((item) =>
      columns.map((column) => {
        const value = item[column];
        if (column === "source" && value === undefined) return "manual";
        return value === undefined ? "" : String(value);
      })
    );
    const file = path.resolve(dir, `${config.tab}.csv`);
    fs.writeFileSync(file, toCsv([columns, ...rows]));
    console.log(`📝 已匯出 ${file}`);
  }
}

async function main() {
  const exportDir = getArg("export-csv");
  if (exportDir) {
    exportCsv(exportDir);
    return;
  }

  const csvDir = getArg("csv-dir");
  const sheetId = process.env.HOME_CONTENT_SHEET_ID?.trim();
  const dryRun = process.argv.includes("--dry-run");
  if (!csvDir && !sheetId) {
    throw new Error("請設定環境變數 HOME_CONTENT_SHEET_ID，或使用 --csv-dir=<資料夾> 讀取本機 CSV。");
  }

  const results: { config: TabConfig; next: string; changed: boolean; count: number }[] = [];
  const errors: string[] = [];

  for (const config of TABS) {
    try {
      const text = csvDir ? readLocalCsv(csvDir, config.tab) : await fetchSheetCsv(sheetId!, config.tab);
      const items = rowsToItems(config, parseCsv(text));
      if (items.length === 0) {
        throw new Error(`分頁「${config.tab}」沒有任何資料列。若要暫時隱藏內容，請把 status 改成 draft，而不是刪除整列。`);
      }

      const current = fs.readFileSync(config.file, "utf-8");
      const content = { ...JSON.parse(current), [config.listKey]: items };
      const parsed = config.schema.safeParse(content);
      if (!parsed.success) {
        errors.push(`分頁「${config.tab}」有資料格式錯誤：\n${formatIssues(config, parsed.error)}`);
        continue;
      }

      const next = JSON.stringify(content, null, 2) + "\n";
      results.push({ config, next, changed: next.replace(/\r\n/g, "\n") !== current.replace(/\r\n/g, "\n"), count: items.length });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length > 0) {
    console.error("❌ 同步中止，未寫入任何檔案：\n" + errors.join("\n"));
    process.exit(1);
  }

  for (const { config, next, changed, count } of results) {
    const name = path.relative(process.cwd(), config.file);
    if (!changed) {
      console.log(`✓ ${config.tab}：${count} 列，無變更（${name}）`);
    } else if (dryRun) {
      console.log(`• ${config.tab}：${count} 列，有變更（--dry-run 未寫入 ${name}）`);
    } else {
      fs.writeFileSync(config.file, next);
      console.log(`✅ ${config.tab}：${count} 列，已更新 ${name}`);
    }
  }
}

main().catch((error) => {
  console.error("❌", error instanceof Error ? error.message : error);
  process.exit(1);
});
