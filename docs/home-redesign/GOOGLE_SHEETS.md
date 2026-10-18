# 首頁內容 × Google Sheets 使用說明

用一份 Google 試算表管理首頁的 **Hero 精選卡片**、**互動實驗室作品**、**Solar Star 影片**，不需要改程式碼。

```
Google 試算表 ──(每天 09:00 自動／手動觸發)──▶ GitHub Actions 驗證 ──▶ src/content/home/*.json ──▶ 重新部署網站
```

- 不使用任何帳號憑證：試算表只需設為「知道連結的任何人都可以檢視」，前端網頁完全不會接觸到試算表。
- 每次同步都會先**驗證全部資料**；任何一列有錯就整批不更新，網站維持上一次的正確內容。

---

## 一、第一次設定（約 10 分鐘）

1. **建立試算表**：到 Google 雲端硬碟新增一份試算表（名稱自訂，例如「科學好好聽 首頁內容」）。
2. **建立三個分頁**，名稱必須完全相同（全小寫、底線）：
   - `hero_cards`
   - `labs`
   - `solar_videos`
3. **匯入範本**：repo 的 `docs/home-redesign/sheets/` 有三個 CSV（內容就是目前網站上的資料）。
   在每個分頁選「檔案 → 匯入 → 上傳」，選對應的 CSV，匯入位置選「**取代目前的工作表**」。
4. **分享設定**：右上「共用」→「一般存取權」改成「**知道連結的任何人**」＋「**檢視者**」。
   （要編輯的人另外用 Email 加為「編輯者」即可。）
5. **取得試算表 ID**：網址 `https://docs.google.com/spreadsheets/d/【這一段】/edit` 中間那段就是 ID。
6. **設定 GitHub 變數**：GitHub repo → Settings → Secrets and variables → Actions → **Variables** 分頁 →
   New repository variable：名稱 `HOME_CONTENT_SHEET_ID`，值填上一步的 ID。
   （ID 不是密碼，放在 Variables 即可。）
7. **試跑一次**：GitHub → Actions → **Sync Home Content** → Run workflow。成功後網站會自動更新。

> 第 7 步的流程在這個分支合併到 `main` 之後才會出現在 Actions 清單中。

---

## 二、日常編輯

- 改完試算表後，**不用做任何事**：每天台灣時間 09:00 的「Daily Podcast Sync」會一起同步並部署。
- 想**立刻**更新：GitHub → Actions → **Sync Home Content** → Run workflow（約 3–5 分鐘上線）。
- **要下架**某一列：把 `status` 改成 `draft`，**不要刪除整列**（整個分頁沒有資料會被視為錯誤而中止同步）。
- **排序**：看 `sortOrder` 數字由小到大，不看列的上下順序。
- 第一列是欄位名稱，不要改名；可以在最右邊加自己的備註欄（同步時會忽略不認識的欄位）。
- 每個 `id` 在同一個分頁中不能重複；建議用英文小寫與連字號，例如 `taipei-101`。

---

## 三、欄位說明

連結欄位可填三種格式：`#區塊`（首頁內的區塊，例如 `#podcast`）、`/站內路徑`（例如 `/games`、`/home/labs/taipei-101.webp`）、或 `https://` 開頭的完整網址。

### `hero_cards`（Hero 右側精選卡片，最多顯示 3 張）

| 欄位 | 必填 | 說明 |
|---|---|---|
| id | ✔ | 唯一代號 |
| source | | `manual`（手動填寫，預設）或 `latest-podcast`（自動帶入最新一集 Podcast 的標題、封面、日期） |
| label | ✔ | 圖片左上角的小標籤，例如「互動科學」 |
| title | ✔* | 卡片標題（`latest-podcast` 可留空，自動帶入） |
| description | ✔* | 一到兩句說明（`latest-podcast` 可留空） |
| image | | 圖片網址或站內路徑；留空會顯示 emoji 佔位圖 |
| imageAlt | | 圖片的替代文字（給螢幕閱讀器） |
| emoji | | 沒有圖片時顯示的 emoji |
| href | ✔ | 按鈕連結 |
| ctaLabel | ✔ | 按鈕文字，例如「開始探索」 |
| status | ✔ | `published`（上架）或 `draft`（下架） |
| sortOrder | ✔ | 數字，小的排前面 |

### `labs`（互動實驗室）

| 欄位 | 必填 | 說明 |
|---|---|---|
| id | ✔ | 唯一代號 |
| title | ✔ | 作品名稱 |
| description | ✔ | 一句話介紹 |
| coverImage | | 封面（建議 4:3，1200×900 WebP）；留空會顯示 emoji |
| emoji | | 沒有封面時顯示 |
| url | ✔ | 作品網址（必須是 `https://`） |
| status | ✔ | `published` / `draft` |
| featured | ✔ | 是否放在首頁精選：`TRUE` / `FALSE`（也可填 是／否） |
| sortOrder | ✔ | 數字 |

首頁最多顯示幾個精選作品，由 `src/content/home/labs.json` 的 `maxFeatured`（2–4）決定。

### `solar_videos`（Solar Star 影片；sortOrder 最小的為主影片，其餘列在旁邊切換）

| 欄位 | 必填 | 說明 |
|---|---|---|
| id | ✔ | 唯一代號，例如 `mercury` |
| youtubeId | ✔ | 可直接貼 YouTube 網址（Shorts / 一般影片 / youtu.be 都可以），會自動轉成影片 ID |
| title | ✔ | 影片標題 |
| description | | 影片說明（可留空） |
| status | ✔ | `published` / `draft` |
| sortOrder | ✔ | 數字 |

---

## 四、哪些內容**不在**試算表裡

下列文字較少變動，仍直接編輯 repo 中的 JSON（改完需要 commit）：

- Hero 標語、介紹文字、按鈕、自動輪播秒數：`src/content/home/hero.json`
- 互動實驗室「看全部互動作品」連結、精選上限：`src/content/home/labs.json`
- Solar Star 區塊標題、說明、YouTube 連結、首頁最多顯示幾支（`maxVideos`，目前 5）：`src/content/home/solar-star.json`
- 品牌故事、背書、角色圖：`src/content/home/brand.json`
- Podcast 平台、Footer、社群連結：`src/content/site-links.json`

注意：同步只會覆寫上面三個分頁對應的「清單」，JSON 裡其他欄位不會被動到。

---

## 五、同步失敗怎麼辦

到 GitHub → Actions，點開失敗的那次執行，看「Sync home content from Google Sheets」這一步，訊息會指出分頁與列數，例如：

```
分頁「labs」有資料格式錯誤：
  - labs 第 3 列 url：Invalid URL
  - labs 第 3 列 status：Invalid option: expected one of "published"|"draft"
```

修正試算表後重新執行即可。常見原因：

| 訊息 | 原因 |
|---|---|
| 讀取分頁失敗（HTTP 404 / 401） | 試算表沒有設為「知道連結的任何人都可以檢視」，或 ID 填錯 |
| 缺少必要欄位：url（若分頁名稱打錯…） | 分頁名稱打錯，Google 改回傳了第一個分頁 |
| 沒有任何資料列 | 整個分頁被清空；請改用 `status = draft` 下架 |
| id「…」重複 | 同一分頁有兩列 id 相同 |
| 連結需為 #區塊、/站內路徑 或 https:// 網址 | 連結格式錯誤（例如少了 `https://`） |

> 每日 09:00 的流程中，首頁內容同步失敗**不會**影響 Podcast 更新與部署；只有首頁內容維持舊版。

---

## 六、本機測試（開發者）

```bash
# 把目前的 JSON 匯出成 CSV 範本（docs/home-redesign/sheets/）
npm run export-home-csv

# 用本機 CSV 驗證（不寫檔）
npm run sync-home -- --csv-dir=docs/home-redesign/sheets --dry-run

# 直接讀取試算表
HOME_CONTENT_SHEET_ID=<試算表 ID> npm run sync-home -- --dry-run
```

分頁中同一欄請維持同一種資料型態（例如 `sortOrder` 全部填數字），避免 Google 匯出時把少數不同型態的格子讀成空白。
