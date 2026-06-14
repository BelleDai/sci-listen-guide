/** 單一答案選項，會被 adapter 轉成各遊戲可以使用的 GameItem。 */
export type QuestionAnswerInput = {
  /** 選項唯一識別碼，同一題內不可重複。 */
  id: string;

  /** 選項在遊戲中顯示的圖示，通常使用 emoji。 */
  icon: string;

  /** 選項名稱，會顯示在遊戲 UI 或語音提示中。 */
  label: string;

  /** 這個答案對應的小題題目；正確答案通常需要填寫。 */
  question?: string;

  /** 答對後朗讀或顯示的簡短解釋。 */
  explanation?: string;
};

/** 統一的問答輸入格式，資料會經由 adapter 轉成各遊戲的 GameScene。 */
export type QuestionInput = {
  /** 題組唯一識別碼，用來建立 GameScene.id 與抽題來源。 */
  id: string;

  /** 題組標題，會用在畫面標題或 GameScene.name 的 fallback。 */
  title: string;

  /** 題組提示文字，通常用來引導玩家這組題目要找什麼。 */
  prompt: string;

  /** 題組補充說明，可用在介紹、列表或未來的複習頁。 */
  description: string;

  /** 題組科普總結，會在每題或結算回饋時顯示與朗讀。 */
  knowledge: string;

  /** 正確答案集合，會轉成 GameScene.items。 */
  correctAnswers: QuestionAnswerInput[];

  /** 錯誤答案集合，會轉成 GameScene.decoys。 */
  wrongAnswers: QuestionAnswerInput[];
};
