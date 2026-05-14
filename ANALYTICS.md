# 📊 科學好好聽 — Google Analytics 4 追蹤說明文件

> **GA4 評估 ID**：`G-JCSL79SFSD`  
> **GA4 後台入口**：https://analytics.google.com/

---

## 一、自動追蹤（GA4 內建，不需設定）

| 追蹤內容 | 說明 | GA4 事件名稱 |
|---|---|---|
| **頁面瀏覽** | 每次進入任何頁面（首頁、`/guide/[id]`）自動記錄 | `page_view` |
| **用戶身份** | 裝置類型、作業系統、瀏覽器、語言、國家 / 城市 | 維度報告 |
| **停留時間** | 使用者在頁面上的參與時間（視窗處於前景的時間） | `user_engagement` |
| **第一次造訪** | 新訪客 vs. 回頭訪客 | `first_visit` |
| **工作階段** | 每次連續瀏覽的時間段 | `session_start` |
| **滾動深度** | 是否滾動至頁面底部 90% | `scroll` |

---

## 二、自訂事件追蹤（程式碼已埋入）

### 🏠 首頁行為

> **回答你的問題**：「到 home 後有沒有進入 `/guide` 頁？」
> → 透過 GA4 **路徑探索**（Funnel Exploration）即可看到從 `/` → `/guide/[id]` 的轉換率。

---

### 📖 EpisodeView 各階段進入（漏斗）

| 事件名稱 | 觸發時機 | 重要參數 |
|---|---|---|
| `episode_landed` | 使用者剛進入單集頁面時自動觸發 | `episode_id`, `episode_title`, `source` ("podcast" 或 "search_or_other") |
| `episode_step_reached` | 使用者按下「下一步」進入各章節 | `step_number` (2~4), `episode_id`, `episode_title` |
| `episode_completed` | 使用者點擊「我是小小科學家，任務達成！」 | `episode_id`, `episode_title` |

**漏斗對應關係**：

```
s1 (Hero + Glossary)  →  step_number: 2  →  s2 (重點整理)
s2 (重點整理)         →  step_number: 3  →  s3 (動動腦)
s3 (動動腦)           →  step_number: 4  →  s4 (親子討論)
s4 完成               →  episode_completed
```

**分析應用**：
- 透過 `episode_landed` 的 `source` 參數可以精準算出「Podcast 聽眾導流」vs「SEO/搜尋新客」的比例。
- 註：若以搜尋進入（無 `?source=podcast`），使用者會自動跳至 `step_number: 2`（看見重點整理）。
- 若 `step_number: 4` 的人多，但 `episode_completed` 很少 → 親子討論後沒按任務達成

---

### 💬 解答展開行為

| 事件名稱 | 觸發時機 | 參數 `section_id` |
|---|---|---|
| `answer_opened` | 展開「聽聽科學隊長怎麼說」 | `audio_question` (動動腦答案) |
| `answer_opened` | 展開「聽聽科學隊長怎麼說」 | `family_discussion` (親子討論答案) |

**分析應用**：
- `answer_opened` 開啟率高 → 使用者對內容有高度好奇心，內容品質佳
- 某集 `answer_opened` 低 → 問題設計可能不吸引人

---

### 🎧 外部平台導流（訂閱意圖）

| 事件名稱 | 觸發時機 | 參數 `platform` | 參數 `source` |
|---|---|---|---|
| `outbound_click` | 點擊 Apple Podcast 按鈕 | `apple_podcasts` | `player_launch` |
| `outbound_click` | 點擊 Spotify 按鈕 | `spotify` | `player_launch` |
| `outbound_click` | 點擊 Apple 浮動按鈕 | `apple_podcasts` | `speed_dial` |
| `outbound_click` | 點擊 Spotify 浮動按鈕 | `spotify` | `speed_dial` |
| `outbound_click` | 點擊 Apple Podcasts 連結 | `apple_podcasts` | `footer` |
| `outbound_click` | 點擊 Facebook 連結 | `facebook` | `footer` |
| `outbound_click` | 點擊其他 Footer 連結 | `科學好好聽.app` 等 | `footer` |

> ⚠️ **技術限制**：我們只能追蹤「點擊跳轉」這個動作。使用者進入 Apple Podcasts / Spotify 之後是否訂閱，屬於第三方 App 內部行為，無法取得。

---

## 三、尚未追蹤（建議未來補強）

| 行為 | 建議方式 |
|---|---|
| 首頁「最新精選」點擊哪一集 | 在 `<Link href="/guide/[id]">` 加 `onClick → trackEvent("home_episode_click", {episode_id})` |
| 語音朗讀（SpeakLine / Glossary）哪些詞被點最多 | `analytics.ts` 已有 `trackGlossarySpeak()` 待埋入 `GlossaryCard.tsx` |
| 搜尋行為：用戶搜尋了什麼關鍵字 | 在 `Header.tsx` 搜尋送出時加 `trackEvent("search", {search_term})` |

---

## 四、在 GA4 後台怎麼看這些數據

### 📍 Step 1：確認事件有在收集

**路徑**：`報告 → 生命週期 → 互動 → 事件`

- 左側選「事件」
- 你應該會看到 `episode_step_reached`、`answer_opened`、`outbound_click` 等自訂事件
- ⏰ **注意**：新事件最多需要 **24~48 小時** 才會出現在報告中

---

### 📍 Step 2：查看訪客基本輪廓（他們是誰？）

**路徑**：`報告 → 用戶 → 使用者人口統計`

你可以看到：
- 國家 / 城市分布
- 年齡與性別（若樣本足夠）
- 裝置類型（手機 vs. 電腦）
- 瀏覽器與作業系統

---

### 📍 Step 3：查看最受歡迎的內容（他們對什麼有興趣？）

**路徑**：`報告 → 生命週期 → 互動 → 網頁和畫面`

- 依「觀看次數」排序
- 你會看到哪些 `/guide/[id]` 集數最多人造訪
- 這就是最受歡迎的主題！

---

### 📍 Step 4：查看停留時間（看多久？）

**路徑**：`報告 → 生命週期 → 互動 → 網頁和畫面`

欄位：
- `平均參與時間` → 真正有在看頁面（非背景）的時間
- `參與的工作階段數` → 多少次有效瀏覽

---

### 📍 Step 5：建立漏斗分析（從哪裡開始離開？）

**路徑**：`探索 → 建立新探索 → 漏斗探索`

設定步驟：
1. 點擊右上角「探索」→「漏斗探索」
2. 設定以下步驟：

| 步驟 | 設定方式 |
|---|---|
| Step 1：進入首頁 | 事件：`page_view`，參數：`page_location` 包含 `/` |
| Step 2：進入單集頁 | 事件：`page_view`，參數：`page_location` 包含 `/guide/` |
| Step 3：進入重點整理 | 事件：`episode_step_reached`，`step_number` = 2 |
| Step 4：進入動動腦 | 事件：`episode_step_reached`，`step_number` = 3 |
| Step 5：進入親子討論 | 事件：`episode_step_reached`，`step_number` = 4 |
| Step 6：完成任務 | 事件：`episode_completed` |

3. 點擊「套用」後，漏斗圖表會顯示每一步的轉換率與流失人數。

---

### 📍 Step 6：查看平台導流效果（Spotify / Apple 點擊）

**路徑**：`探索 → 自由格式探索`

設定方式：
1. 維度：`事件名稱`、`自訂參數 → platform`、`自訂參數 → source`
2. 指標：`事件計數`
3. 篩選器：事件名稱 = `outbound_click`

這樣就能看出哪個平台被點最多次、從哪個地方（player 或 footer）導流過去。

---

### 📍 Step 7：設定「轉換目標」（最重要！）

**路徑**：`管理（齒輪）→ 事件 → 將事件標記為轉換`

建議標記以下事件為「轉換」：
- ✅ `episode_completed`（完課）
- ✅ `outbound_click`（導流訂閱意圖）

這樣 GA4 首頁就會優先顯示這兩個關鍵行為的達成率，讓你一眼看出整體效果。

---

## 五、事件參數查詢（Custom Dimensions 設定）

GA4 預設不會在報告中顯示你的自訂參數（如 `episode_id`、`platform`）。需要先在後台登記：

**路徑**：`管理 → 自訂定義 → 建立自訂維度`

| 維度名稱 | 範圍 | 事件參數名稱 |
|---|---|---|
| Episode ID | 事件 | `episode_id` |
| Episode Title | 事件 | `episode_title` |
| Step Number | 事件 | `step_number` |
| Platform | 事件 | `platform` |
| Source | 事件 | `source` |
| Section ID | 事件 | `section_id` |

> 💡 設定完成後，這些維度就能在「探索」報告中自由使用，做出你想要的任何組合分析！
