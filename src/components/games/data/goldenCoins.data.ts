import { SceneGame } from '../core/SceneGame';
import type { GameScene } from '../core/types';

const BGM_NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66];

export const GOLDEN_COINS_SCENES: GameScene[] = [
  {
    "id": "cycle",
    "name": "水文循環",
    "title": "水滴變身旅行記",
    "description": "尋找水循環的關鍵動力與過程。",
    "bgColor": "bg-gradient-to-b from-sky-300 via-blue-200 to-blue-400",
    "knowledge": "水文循環就是水在地球上不停地變身，從海裡蒸發飛上天，變成雲再下雨回地面的過程。",
    "items": [
      { "id": "sun", "icon": "☀️", "label": "太陽", "question": "水文循環的動力主要來自誰的熱情幫忙？", "audioText": "答對了！太陽就像超級加熱器，提供能量讓海水蒸發！" },
      { "id": "evap", "icon": "💨", "label": "蒸發", "question": "水變成水蒸氣飛上天的過程叫做什麼？", "audioText": "沒錯！蒸發讓液態水變成看不見的氣體飛上天！" },
      { "id": "cloud", "icon": "☁️", "label": "小水滴", "question": "天上的雲朵主要是由什麼物質結伴組成的？", "audioText": "答對了！水蒸氣到高空遇冷，就會凝結成小水滴或冰晶變成雲喔！" },
      { "id": "rain", "icon": "🌧️", "label": "降水", "question": "水從雲掉下來變成雨或雪的過程叫什麼？", "audioText": "太棒了！當雲太重了，就會變成雨或雪「降水」到地面上。" },
      { "id": "ocean", "icon": "🌊", "label": "海洋", "question": "陸地上的河流經過漫長的流動後，最終大多會匯集到哪裡？", "audioText": "對極了！地表的雨水匯集成河流，最後又會流回海洋的懷抱。" }
    ],
    "decoys": [
      { "id": "d1", "icon": "🌙", "label": "月亮" },
      { "id": "d2", "icon": "🏊", "label": "游泳" },
      { "id": "d3", "icon": "🌪️", "label": "龍捲風" },
      { "id": "d4", "icon": "🦆", "label": "鴨子" },
      { "id": "d5", "icon": "🏜️", "label": "沙漠" }
    ]
  },
  {
    "id": "storage",
    "name": "水的儲存",
    "title": "找出地球上的水",
    "description": "地球上的水藏在哪裡？一起找找看！",
    "bgColor": "bg-gradient-to-b from-indigo-300 to-blue-700",
    "knowledge": "地球上97%的水都藏在海洋裡，其他的則在冰河、地下水、河流和湖泊中。",
    "items": [
      { "id": "earth", "icon": "🌍", "label": "70%面積", "question": "地球表面大約有多少面積被水覆蓋？", "audioText": "答對了！地球有超過百分之七十的面積被水覆蓋，是一顆藍色星球！" },
      { "id": "whale", "icon": "🐳", "label": "97%海水", "question": "地球上絕大部分的水（約97%）都藏在哪裡？", "audioText": "沒錯！地球上百分之九十七的水都是鹹鹹的海水，海洋是最大的水庫！" },
      { "id": "iceberg", "icon": "🧊", "label": "冰河", "question": "高山上的雪堆積久了，會變成什麼大型淡水庫？", "audioText": "答對了！冰河與冰蓋就像巨大的冷凍庫，儲存了非常多的淡水喔！" },
      { "id": "rock", "icon": "🪨", "label": "岩石縫隙", "question": "隱藏在我們腳底下的地下水，通常是在哪裡流動的？", "audioText": "太棒了！地下水其實是藏在土壤與岩石的縫隙中，不是一條地底大河喔！" },
      { "id": "glass", "icon": "🥛", "label": "地下水", "question": "我們平常喝的水，除了來自河流湖泊，還可能來自哪裡？", "audioText": "完全正確！我們能使用的淡水非常稀少，地下水是很重要的飲用水源！" }
    ],
    "decoys": [
      { "id": "d6", "icon": "🎢", "label": "遊樂園" },
      { "id": "d7", "icon": "🛸", "label": "飛碟" },
      { "id": "d8", "icon": "🌵", "label": "仙人掌" },
      { "id": "d9", "icon": "🌋", "label": "海底火山" },
      { "id": "d10", "icon": "💧", "label": "純水" }
    ]
  },
  {
    "id": "extremes",
    "name": "河流湖泊之最",
    "title": "千奇百怪的水域",
    "description": "探索世界之最與各種奇特的湖泊。",
    "bgColor": "bg-gradient-to-b from-teal-200 to-emerald-800",
    "knowledge": "亞馬遜河水量最大，貝加爾湖淡水最多。湖泊還有火口湖、冰斗湖等各種有趣的地形喔！",
    "items": [
      { "id": "amazon", "icon": "🏞️", "label": "亞馬遜河", "question": "全世界流量最大的河流是哪一條？", "audioText": "答對了！亞馬遜河是水量最大的河，佔了全球五分之一的河水！" },
      { "id": "baikal", "icon": "🌊", "label": "貝加爾湖", "question": "全球淡水儲存量第一名的湖泊稱為什麼？", "audioText": "沒錯！俄羅斯的貝加爾湖是最深、淡水儲存量最多的內陸湖泊！" },
      { "id": "volcano", "icon": "🌋", "label": "火口湖", "question": "火山噴發後留下的火山口積水形成的湖叫做什麼？", "audioText": "答對了！火山噴發後的凹洞積水，就會變成圓圓的破火山口湖。" },
      { "id": "ice_lake", "icon": "🥣", "label": "冰斗湖", "question": "冰河侵蝕挖出的坑洞積水，通常是怎麼形成的湖？", "audioText": "太棒了！冰河融化後的凹洞積水，會形成像碗一樣的冰斗湖喔！" },
      { "id": "sun_moon", "icon": "🛶", "label": "人工擴建", "question": "台灣著名的「日月潭」是什麼類型的湖泊？", "audioText": "完全正確！日月潭原本是天然湖泊，後來經過人工擴建才變成現在的樣子。" }
    ],
    "decoys": [
      { "id": "d11", "icon": "🐊", "label": "尼羅河" },
      { "id": "d12", "icon": "🌲", "label": "森林" },
      { "id": "d13", "icon": "☄️", "label": "隕石坑" },
      { "id": "d14", "icon": "🏕️", "label": "人工湖" },
      { "id": "d15", "icon": "🌊", "label": "斷層湖" }
    ]
  },
  {
    "id": "time",
    "name": "時間與影響",
    "title": "水滴的奇妙旅程",
    "description": "水滴的旅行要花多久？對地球有什麼影響？",
    "bgColor": "bg-gradient-to-b from-purple-300 to-slate-800",
    "knowledge": "水滴旅行有的只要9天，有的要花4萬年。水的三態變化能調節氣候，孕育地球生命。",
    "items": [
      { "id": "lightning", "icon": "⚡", "label": "9天", "question": "如果水滴運氣好，最快幾天可以完成一次循環？", "audioText": "答對了！水滴在天空變成雨降下來，最快只要九天左右就能完成旅行！" },
      { "id": "dino", "icon": "🦕", "label": "4萬年", "question": "藏在地底深處或冰河裡的水滴，完成一次循環可能要花多久？", "audioText": "沒錯！有的水滴躲在地下或冰河裡，要花上四萬年才出得來呢！" },
      { "id": "states", "icon": "♻️", "label": "固液氣態", "question": "在自然環境中，水通常以哪三種形態同時存在？", "audioText": "答對了！水有固態的冰、液態的水，還有氣態的水蒸氣三種變化喔！" },
      { "id": "earth_heart", "icon": "💚", "label": "調節氣候", "question": "除了喝水，水文循環對地球有什麼重要功能？", "audioText": "太棒了！水文循環可以調節氣候與孕育生命，對整個地球超級重要！" },
      { "id": "tree", "icon": "🌳", "label": "愛護資源", "question": "為了維護水文循環，我們應該具備什麼樣的態度或行動？", "audioText": "完全正確！多種樹木、愛惜水資源，才能幫助水文循環更健康！" }
    ],
    "decoys": [
      { "id": "d16", "icon": "🦇", "label": "1小時" },
      { "id": "d17", "icon": "⏱️", "label": "100年" },
      { "id": "d18", "icon": "🧂", "label": "酸鹼性" },
      { "id": "d19", "icon": "🌍", "label": "增加重量" },
      { "id": "d20", "icon": "🏭", "label": "排放廢水" }
    ]
  }
];

export const goldenCoinsGame = new SceneGame({
  id: 'golden-coins',
  title: 'Golden Coins',
  bgmNotes: BGM_NOTES,
  content: GOLDEN_COINS_SCENES,
});
