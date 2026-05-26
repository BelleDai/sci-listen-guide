# 本專案操作手冊

內含以下資訊:
1. 伴讀資料更新與上架
2. 與 Podcast 串流平台自動同步: GitHub Actions

---

## 🔄 步驟 1：執行伴讀資料同步
當你準備好新的一集資料後，在終端機執行：

```bash
npm run sync
```

### 腳本會問你的問題：
1. **Enter Folder ID or Local Path**: 
   - 如果是本地：貼上資料夾路徑。
2. **Enter Episode ID**: 輸入集數數字（例如 `216`）。
3. **模糊比對**：腳本會自動搜尋 Firstory 資料庫，找到相似集數並提示你確認
4. **Title / Spotify / Apple Link**: 若已從 Firstory 比對成功，直接按 Enter 採用，不需手動貼上

---

## ✏️ 更新/修正已上架的資料

如果某一集的資料有錯誤，或你想更新內容，只需要：

1. 修改電腦裡的 JSON 或 metadata 檔案。
2. 重新執行 `npm run sync`，輸入**相同的集數 ID**。
3. 腳本會自動**完整覆蓋** Firestore 裡的舊資料。
4. 最後記得執行 `npm run build` 和 `firebase deploy` 讓網站更新。

---

## 🏗 步驟 2：建置與發佈 (Deploy)
資料同步後，建議先發佈到「測試環境 (Staging)」確認無誤後，再上線：

```bash
# 1. 部署到測試環境 (將會產生一組臨時預覽網址供您檢查)
npm run deploy:staging

# 2. 點開終端機產生的網址，確認一切沒問題後，發佈到正式環境 (Production)
npm run deploy:prod
```

---

## 🧪 本地預覽 (選修)
如果你想在正式發佈前，先在電腦上看看長什麼樣子，可以執行：

```bash
npm run dev
```
然後打開瀏覽器造訪：`http://localhost:3000`

---

## 🤖 Podcast 自動同步與搜尋機制

為了讓網站上的搜尋列能即時反映最新的 Podcast 集數，並減輕手動上架伴讀單元的負擔，本專案實作了自動同步與智慧搜尋機制。

### 1. 更新機制與檔案說明

**A. 每日自動抓取（自動執行）**
- **負責檔案**：`scripts/sync-podcast-rss.ts` 與 `.github/workflows/sync-podcast.yml`
- **運作原理**：每天台灣時間 09:00，GitHub Actions 會自動啟動。它會首先讀取 Firstory 的 RSS Feed 獲取所有集數。對於尚未抓取過的新集數，會透過 **Playwright (無頭瀏覽器)** 自動前往 Firstory 網頁爬取該集對應的 Spotify 與 Apple Podcast 連結。
- **資料儲存**：結果會被寫入 Firestore 的 `podcastEpisodes` 集合（供後台比對使用），同時會在本地生成輕量的 `public/podcast-list.json` 靜態檔案。
- **網站發佈**：GitHub Actions 接著會自動執行 `npm run build` 並將產生的靜態檔部署到 Firebase Hosting。使用者打開網頁搜尋列時，會直接從 CDN 讀取這個 JSON 檔案，達成**零 Firestore 讀取費用**與極速回應。

**B. 伴讀單元智慧配對（手動建立時）**
- **負責檔案**：`scripts/sync-episode.ts`
- **搜尋演算法**：當你手動執行 `npm run sync` 準備建立新伴讀時，腳本內部使用了 **Bigram 字串相似度演算法 (Bigram String Similarity)**。
- **運作原理**：腳本會自動將你輸入的標題，與雲端 `podcastEpisodes` 中的所有標題進行比對。它會列出相似度最高的前三名。
  - 你可以輸入 `1`, `2`, 或 `3` 來選擇正確的集數。
  - 如果前三名都不對，你可以輸入 `/自訂關鍵字` (例如 `/磁力`) 來重新搜尋。
  - 選擇正確集數後，就能自動帶入 Spotify、Apple 連結與 Firstory GUID，完全免除手動複製貼上的麻煩。

### 2. 所需的 GitHub Secrets (設定為 Repository Secrets)

為了讓 GitHub Actions 能成功讀寫 Firebase 與執行部署，你必須將下列變數設定為 **Repository secrets** (注意：不是 Environment secrets)。

前往你的 GitHub repo → `Settings` → `Secrets and variables` → `Actions` → 點擊綠色的 `New repository secret`，依序加入以下變數：

| Secret 名稱 | 說明 |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin SDK 的 Service Account JSON（請將新下載的 JSON 檔案**全文複製貼上**）|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key（可以從本地的 `.env.local` 檔案中複製）|
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID（可選，若有使用 GA 則填入）|

### 3. 手動觸發同步

除了每天定時執行外，如果有緊急的更新，你也可以隨時手動觸發同步：

```bash
# 方法一：透過 GitHub 網頁 (推薦)
# 前往 repo 的 "Actions" 頁籤 → 左側點選 "Daily Podcast Sync" → 點擊右邊的 "Run workflow"

# 方法二：本地終端機執行（需要事先透過 gcloud auth application-default login 授權）
npm run sync-rss
```

---

## 📝 常見問題
- **圖片沒出來？** 檢查同步腳本有沒有報錯，並確認 `public/episodes/[集數]/profile.jpg` 是否存在。
- **資料沒更新？** 記得一定要執行 `npm run build` 才會把最新從資料庫抓到的內容轉成網頁。
- **搜尋列看不到新 Podcast？** 確認 GitHub Actions 有成功執行（Actions 頁面查看），或手動執行 `npm run sync-rss`。

