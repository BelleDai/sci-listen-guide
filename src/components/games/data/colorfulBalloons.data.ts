import { SceneGame } from '../core/SceneGame';
import type { GameScene } from '../core/types';

const BGM_NOTES = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46];

export const COLORFUL_BALLOONS_SCENES: GameScene[] = [
  {
    id: 'cycle',
    name: '水文循環',
    title: '水滴去旅行',
    audioText: '水滴去旅行時，會經過哪些過程呢？',
    description: '找出水文循環會發生的正確過程。',
    knowledge: '水文循環包含蒸發、凝結成雲、降水，最後水又回到河流或海洋，繼續下一趟旅行。',
    items: [
      { id: 'evaporation', label: '蒸發', icon: '☀️' },
      { id: 'cloud', label: '變雲朵', icon: '☁️' },
      { id: 'rain', label: '下雨雪', icon: '🌧️' },
    ],
    decoys: [
      { id: 'stop', label: '不動', icon: '🛑' },
      { id: 'rock', label: '變石頭', icon: '🪨' },
      { id: 'rocket', label: '飛走', icon: '🚀' },
    ],
  },
  {
    id: 'storage',
    name: '水的儲存',
    title: '水躲在哪裡',
    audioText: '地球上的水，大部分都躲在哪裡呢？',
    description: '分辨地球上重要的水資源儲存位置。',
    knowledge: '地球上大部分的水在海洋裡，少部分淡水藏在冰河、地下水、河流和湖泊中。',
    items: [
      { id: 'ocean', label: '海洋', icon: '🌊' },
      { id: 'glacier', label: '冰河', icon: '🏔️' },
      { id: 'groundwater', label: '地下水', icon: '💧' },
    ],
    decoys: [
      { id: 'pool', label: '泳池', icon: '🏊' },
      { id: 'space', label: '太空', icon: '🛸' },
      { id: 'bottle', label: '水瓶', icon: '🥤' },
    ],
  },
  {
    id: 'extremes',
    name: '河流湖泊之最',
    title: '大河與湖泊',
    audioText: '關於世界上的大河和湖泊，哪些是對的呢？',
    description: '認識世界重要河流與湖泊特色。',
    knowledge: '亞馬遜河是世界水量最大的河流，貝加爾湖則儲存了非常多淡水。',
    items: [
      { id: 'amazon', label: '亞馬遜河', icon: '🏞️' },
      { id: 'baikal', label: '貝加爾湖', icon: '🌊' },
      { id: 'freshwater', label: '淡水多', icon: '💧' },
    ],
    decoys: [
      { id: 'nile', label: '尼羅河', icon: '🏜️' },
      { id: 'sun-moon-lake', label: '日月潭', icon: '🇹🇼' },
      { id: 'saltwater-only', label: '皆海水', icon: '🧂' },
    ],
  },
  {
    id: 'time',
    name: '旅行時間',
    title: '水滴要多久',
    audioText: '水滴完成一次旅行，大約要花多少時間？',
    description: '理解水文循環所需時間不固定。',
    knowledge: '水滴完成循環的時間差異很大，快的可能只要幾天，藏在冰河或地下的水可能要等上幾萬年。',
    items: [
      { id: 'nine-days', label: '9天', icon: '⏳' },
      { id: 'many-years', label: '幾萬年', icon: '🏔️' },
      { id: 'varies', label: '不固定', icon: '⏱️' },
    ],
    decoys: [
      { id: 'one-second', label: '1秒', icon: '⚡' },
      { id: 'never-back', label: '不回來', icon: '🛑' },
      { id: 'same-time', label: '都一樣', icon: '👯' },
    ],
  },
  {
    id: 'states',
    name: '水的三態',
    title: '水會變什麼',
    audioText: '水在旅行的時候，會變成什麼樣子呢？',
    description: '辨認水在自然界中的不同形態。',
    knowledge: '水可以變成氣態的水蒸氣、固態的冰雪，也可以保持液態，這些變化推動了水文循環。',
    items: [
      { id: 'gas', label: '氣體', icon: '💨' },
      { id: 'ice', label: '冰雪', icon: '❄️' },
      { id: 'liquid', label: '液體', icon: '💧' },
    ],
    decoys: [
      { id: 'candy', label: '糖果', icon: '🍬' },
      { id: 'iron', label: '鐵塊', icon: '🛡️' },
      { id: 'fire', label: '火焰', icon: '🔥' },
    ],
  },
];

export const colorfulBalloonsGame = new SceneGame({
  id: 'colorful-balloons',
  title: 'Colorful Balloons',
  bgmNotes: BGM_NOTES,
  content: COLORFUL_BALLOONS_SCENES,
});
