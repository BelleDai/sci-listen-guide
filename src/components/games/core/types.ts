import type { ReactNode } from 'react';

/** 每一個可遊玩的遊戲種類代號，用來區分路由、資料與遊戲實例。 */
export type GameId = 'treasure-hunter' | 'golden-coins' | 'colorful-balloons';

/** 關卡中的一個物件，可以是正確目標、錯誤干擾物，或遊戲中生成的選項。 */
export type GameItem = {
  /** 穩定且唯一的物件代號，用來判斷點擊、計分、比對答案與產生 React key。 */
  id: string;

  /** 顯示給玩家看的圖示，目前多半使用 emoji。 */
  icon: string;

  /** 顯示在物件旁邊、下方或氣球內的簡短名稱。 */
  label: string;

  /** 當這個物件是目前目標時要唸出或顯示的題目，適合尋寶這種依序找目標的玩法。 */
  question?: string;

  /** 玩家答對或接到正確物件後要唸出的補充說明。 */
  audioText?: string;

  /** 物件在場景中的水平位置，以左邊界為 0%、右邊界為 100%。 */
  x?: number;

  /** 物件在場景中的垂直位置，以上邊界為 0%、下邊界為 100%。 */
  y?: number;

  /** 控制物件圖示大小的 Tailwind class，例如 text-5xl、text-6xl。 */
  size?: string;
};

/** 所有遊戲共用的關卡資料格式；不同玩法會用同一份關卡資料做不同互動。 */
export type GameScene = {
  /** 穩定且唯一的關卡代號，用於隨機抽關、切換關卡與查找資料。 */
  id: string;

  /** 關卡名稱，可用於選單、除錯或較短的 UI 顯示。 */
  name: string;

  /** 關卡標題，通常顯示在遊戲上方任務列或過場畫面。 */
  title: string;

  /** 整個關卡的主要題目或指令，適合氣球這種一關一題的玩法。 */
  prompt?: string;

  /** 關卡簡介，說明這關要學什麼或要玩家完成什麼任務。 */
  description?: string;

  /** 關卡背景的 Tailwind class，適合需要自訂場景底色或漸層的遊戲。 */
  bgColor?: string;

  /** 關卡結束後要顯示或唸出的知識總結。 */
  knowledge: string;

  /** 這一關的正確目標或正確答案。 */
  items: GameItem[];

  /** 這一關的錯誤選項、干擾物或不應該點擊的物件。 */
  decoys: GameItem[];

  /** 可選的背景代號，用來對應共用背景 renderer。 */
  backgroundId?: string;

  /** 可選的自訂 React 背景，適合尋寶這類需要特殊視覺場景的關卡。 */
  background?: ReactNode;
};

/** 建立 Game 子類別時使用的基本設定，負責把遊戲資料與共用資訊包在一起。 */
export type GameConfig<TContent> = {
  /** 遊戲種類代號，用來辨識這是哪一個遊戲。 */
  id: GameId;

  /** 遊戲顯示名稱，可用於選單、除錯或統計紀錄。 */
  title: string;

  /** 遊戲背景音樂旋律，會傳給 useGameBgm 播放。 */
  bgmNotes: number[];

  /** 遊戲內容資料，目前主要是 GameScene[]。 */
  content: TContent;
};
