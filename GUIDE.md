## 🔑 步驟 0：設定 Google Drive 權限 (初次使用)
由於你的組織可能禁止建立金鑰，我們改用「個人帳號授權」方式：

1. **安裝 gcloud CLI**：請確保你的電腦已安裝 [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)。
2. **登入授權**：在終端機執行以下指令：
   ```bash
   gcloud auth application-default login
   ```
   這會開啟瀏覽器請你登入 Google 帳號，登入後腳本就能直接讀取你的 Drive 資料。

---

## 🔄 步驟 1：執行資料同步
當你準備好新的一集資料後，在終端機執行：

```bash
npm run sync
```

### 腳本會問你的問題：
1. **Enter Folder ID or Local Path**: 
   - 如果是本地：貼上資料夾路徑。
   - 如果是雲端：貼上 Google Drive 資料夾的 **ID** (網址最後那串亂碼)。
2. **Enter Episode ID**: 輸入集數數字（例如 `216`）。
3. **Spotify / Apple Link**: 貼上該集的 Podcast 連結（沒有的話直接按 Enter 略過）。

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

## 📝 常見問題
- **圖片沒出來？** 檢查同步腳本有沒有報錯，並確認 `public/episodes/[集數]/profile.jpg` 是否存在。
- **資料沒更新？** 記得一定要執行 `npm run build` 才會把最新從資料庫抓到的內容轉成網頁。

祝你經營順利！如果有任何問題，隨時問我。 🦅✨
