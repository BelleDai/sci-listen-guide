# 本專案操作手冊

內含以下資訊：
1. 伴讀資料更新與上架
2. Podcast 自動同步機制（GitHub Actions）
3. 本地開發與手動執行

---

## 🔄 步驟 1：執行伴讀資料同步

當你準備好新的一集資料後，在終端機執行：

```bash
npm run sync
```

### 腳本會問你的問題：
1. **Enter Folder ID or Local Path**：貼上本地資料夾路徑。
2. **Enter Episode ID**：輸入集數數字（例如 `216`）。
3. **模糊比對**：腳本會自動從 Firestore `podcastEpisodes` 搜尋相似標題，列出前三名供你確認。
4. **Title / Spotify / Apple Link**：若已從 Firstory 比對成功，直接按 Enter 採用，不需手動貼上。

---

## ✏️ 更新/修正已上架的資料

1. 修改電腦裡的 JSON 或 metadata 檔案。
2. 重新執行 `npm run sync`，輸入**相同的集數 ID**。
3. 腳本會自動**完整覆蓋** Firestore 裡的舊資料。
4. 最後記得執行 `npm run build` 和 `npm run deploy:prod` 讓網站更新。

---

## 🏗 步驟 2：建置與發佈 (Deploy)

```bash
# 1. 部署到測試環境（產生臨時預覽網址供確認）
npm run deploy:staging

# 2. 確認無誤後，發佈到正式環境
npm run deploy:prod
```

---

## 🧪 本地預覽

```bash
npm run dev
```

打開瀏覽器造訪：`http://localhost:3000`

---

## 🤖 Podcast 自動同步機制

### 整體流程概覽

每天台灣時間 09:00，GitHub Actions 自動執行以下 5 個步驟：

```
Step 1: 從 Firstory 網頁爬取所有集數 → upsert 到 Firestore
Step 2: 從 Apple Podcasts / Spotify 節目總覽頁批次爬取連結 → 寫回 Firestore
Step 3: 從 Firestore 重新生成 podcast-list.json（含最新連結）
Step 4: npm run build（將 podcast-list.json 打包進靜態頁面）
Step 5: 部署到 Firebase Hosting
```

---

### Step 1：Firstory 網頁爬取

- **腳本**：`scripts/sync-podcast-rss.ts`
- **來源**：`https://open.firstory.me/user/kidsci/episodes`
- **運作原理**：
  - 用 Playwright 無頭瀏覽器開啟 Firstory 網頁
  - 持續點擊「**載入更多**」按鈕，直到所有集數（含 VIP/付費集數）全部載入
  - 解析每一集的標題、日期、時長、Firstory 連結、封面圖
  - Upsert 到 Firestore `podcastEpisodes` 集合（以 guid 為文件 ID）
  - 對尚未取得 Spotify/Apple 連結的新集數，逐集前往 Firstory 單集頁面補充連結（作為 fallback）

> ⚠️ **注意**：集數來源**只使用 Firstory 網頁**，不再使用 RSS Feed。

---

### Step 2：批次補全 Apple Podcasts / Spotify 連結

- **腳本**：`scripts/update-podcast-links.ts`（依序執行 `update-apple-links.ts` 與 `update-spotify-links.ts`）
- **指令**：`npm run update-links`
- **運作原理**：

  **Apple Podcasts**（`scripts/update-apple-links.ts`）：
  - 前往節目總覽頁 `https://podcasts.apple.com/tw/podcast/id1812447277`
  - 點擊「**顯示全部**」載入完整集數列表
  - 持續向下滾動直到所有集數顯示完畢
  - 對 `podcast-list.json` 中的每一集，以標題模糊比對找到對應連結
  - 連結格式縮短為 `https://podcasts.apple.com/tw/podcast/id1812447277?i=<episodeId>`
  - 有更新時，將結果寫回 `podcast-list.json` **並同步 batch update 到 Firestore**

  **Spotify**（`scripts/update-spotify-links.ts`）：
  - 前往節目總覽頁 `https://open.spotify.com/show/1eyISRdcgDTwZqIqrP1qKv`
  - 持續點擊「**載入更多單集**」直到所有集數載入
  - 以標題模糊比對找到對應連結
  - 有更新時，將結果寫回 `podcast-list.json` **並同步 batch update 到 Firestore**

---

### Step 3：重新生成 podcast-list.json

- **腳本**：`scripts/sync-podcast-rss.ts`（以環境變數 `GENERATE_JSON_ONLY=true` 執行）
- 從 Firestore 讀取所有集數（此時已包含 Step 2 寫入的最新連結）
- 輸出 `public/podcast-list.json`，格式：

```json
{
  "updatedAt": "ISO 時間戳",
  "count": 集數總數,
  "episodes": [
    {
      "id": "guid",
      "title": "標題",
      "firstoryLink": "https://open.firstory.me/story/...",
      "pubDate": "RFC 2822 日期",
      "imageUrl": "封面圖 URL",
      "duration": 秒數,
      "spotifyLink": "https://open.spotify.com/episode/...",
      "applePodcastLink": "https://podcasts.apple.com/tw/podcast/id1812447277?i=..."
    }
  ]
}
```

---

### Step 4 & 5：建置 + 部署

- `npm run build` 會將 `public/podcast-list.json` 打包進靜態輸出
- 使用者打開網頁搜尋列時，直接從 CDN 讀取此 JSON 檔案，達成**零 Firestore 讀取費用**

---

### 所需 GitHub Secrets

前往 repo → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`：

| Secret 名稱 | 說明 |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin SDK Service Account JSON（完整內容貼上）|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key（從 `.env.local` 複製）|
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID（選填）|

---

## 🛠 npm 指令一覽

| 指令 | 說明 |
|---|---|
| `npm run dev` | 本地開發伺服器（`http://localhost:3000`）|
| `npm run build` | 建置正式版靜態頁面 |
| `npm run sync` | 手動上架一集伴讀資料（互動式）|
| `npm run sync-rss` | 手動執行 Firstory 網頁爬取 + Firestore 同步 |
| `npm run update-links` | 手動批次補全 Apple Podcasts 與 Spotify 連結 |
| `npm run deploy:staging` | 部署到測試環境（預覽網址）|
| `npm run deploy:prod` | 部署到正式環境 |

---

## 🗂 重要檔案結構

```
scripts/
├── sync-podcast-rss.ts      # Step 1 & 3：Firstory 網頁爬取、Firestore upsert、生成 JSON
├── update-podcast-links.ts  # Step 2 的進入點：同時執行 Apple + Spotify 連結爬取
├── update-apple-links.ts    # Apple Podcasts 節目總覽頁爬取
├── update-spotify-links.ts  # Spotify 節目總覽頁爬取
└── sync-episode.ts          # 手動上架伴讀單元（互動式）

public/
└── podcast-list.json        # 自動生成的集數清單（供前端搜尋列使用）

.github/workflows/
└── sync-podcast.yml         # GitHub Actions 定時自動同步（每日 09:00 台灣時間）
```

---

## 📝 常見問題

- **搜尋列看不到新 Podcast？**
  確認 GitHub Actions 有成功執行（前往 repo 的 `Actions` 頁面查看），或手動執行 `npm run sync-rss`。

- **Apple / Spotify 連結是空的？**
  執行 `npm run update-links`，腳本會前往各平台爬取並補全缺失連結。

- **資料沒更新？**
  記得一定要執行 `npm run build` 才會把最新資料轉成網頁。

- **圖片沒出來？**
  確認 `public/episodes/[集數]/profile.jpg` 存在，或 `sync-podcast-rss.ts` 有成功爬取到封面圖 URL。

- **手動觸發自動同步？**
  前往 repo 的 `Actions` 頁籤 → 左側點選 `Daily Podcast Sync` → 右側點擊 `Run workflow`。
