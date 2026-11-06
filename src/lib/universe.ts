/**
 * 宇宙群島（play.kidsci.app）的島嶼清單，build 時讀取線上資料，
 * 讓官網的主題一覽跟著宇宙群島自動更新；讀取失敗時改用 repo 內的快照，不讓 build 失敗。
 * 分島規則與 play.kidsci.app/islands.js 的 assign() 相同：沒有任何一集的島不顯示。
 *
 * 快照 src/content/home/universe-snapshot.json 只在線上讀取失敗時使用；
 * 島嶼大幅調整後，可把 buildUniverseGroups() 的結果覆寫進快照，讓備援內容不會太舊。
 */
import "server-only";
import { z } from "zod";
import snapshot from "@/content/home/universe-snapshot.json";

export const UNIVERSE_URL = "https://play.kidsci.app/";

const islandsSchema = z.object({
  start: z.string(),
  groups: z.array(z.object({ id: z.string(), name: z.string(), emoji: z.string() })),
  islands: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      emoji: z.string(),
      group: z.string().optional(),
      sources: z.array(z.string()),
    })
  ),
});

const catalogSchema = z.object({
  // 整個主題（lane:、era:）的集數 zone 為 null
  episodes: z.array(z.object({ home: z.string(), zone: z.string().nullish() })),
});

const universeSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    emoji: z.string(),
    islands: z.array(z.object({ id: z.string(), name: z.string(), emoji: z.string(), episodes: z.number() })),
  })
);

export type UniverseGroup = z.infer<typeof universeSchema>[number];

function matches(source: string, episode: { home: string; zone?: string | null }) {
  if (source.startsWith("era:") || source.startsWith("lane:") || !source.includes(":")) return episode.home === source;
  const i = source.indexOf(":");
  return episode.home === source.slice(0, i) && episode.zone === source.slice(i + 1);
}

/** 依群島分組、附集數；只保留有集數且屬於群島的島（母島不列） */
export function buildUniverseGroups(
  islandsData: z.infer<typeof islandsSchema>,
  catalog: z.infer<typeof catalogSchema>
): UniverseGroup[] {
  const counts = new Map<string, number>();
  for (const episode of catalog.episodes) {
    const island = islandsData.islands.find((isle) => isle.sources.some((src) => matches(src, episode)));
    const id = island?.id ?? islandsData.start;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return islandsData.groups
    .map((group) => ({
      ...group,
      islands: islandsData.islands
        .filter((isle) => isle.group === group.id && (counts.get(isle.id) ?? 0) > 0)
        .map((isle) => ({ id: isle.id, name: isle.name, emoji: isle.emoji, episodes: counts.get(isle.id) ?? 0 })),
    }))
    .filter((group) => group.islands.length > 0);
}

async function fetchJson(path: string) {
  const res = await fetch(new URL(path, UNIVERSE_URL), { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
  return res.json();
}

export async function getUniverseGroups(): Promise<UniverseGroup[]> {
  try {
    const [islandsData, catalog] = await Promise.all([fetchJson("data/islands.json"), fetchJson("data/catalog.json")]);
    const groups = buildUniverseGroups(islandsSchema.parse(islandsData), catalogSchema.parse(catalog));
    if (groups.length > 0) return groups;
    throw new Error("沒有任何群島");
  } catch (error) {
    console.warn("[universe] 讀取宇宙群島資料失敗，改用快照：", error instanceof Error ? error.message : error);
    return universeSchema.parse(snapshot);
  }
}

/** 宇宙群島連結；島不存在或參數改名時，宇宙群島會從母島出發，不會壞掉 */
export function universeLink(isleId?: string) {
  const url = new URL(UNIVERSE_URL);
  if (isleId) url.searchParams.set("isle", isleId);
  url.searchParams.set("utm_source", "kidsci_home");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "universe_section");
  return url.toString();
}
