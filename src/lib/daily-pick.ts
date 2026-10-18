/**
 * 「每天固定隨機」挑選：以台北日期當種子，同一天所有訪客看到相同結果，隔天自動換一組。
 * 在瀏覽器端計算，因此不依賴每天重新 build / 部署。
 */

/** 台北時區的日期字串，例如 "2026-10-18" */
export function getTaipeiDateKey(now: Date = new Date()): string {
  const taipei = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return taipei.toISOString().slice(0, 10);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32：小而穩定的種子亂數產生器 */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 依種子打亂後取前 count 個；items 的原始順序需固定（例如依 id 排序） */
export function pickDaily<T>(items: T[], count: number, seedKey: string): T[] {
  const random = createRandom(hashString(seedKey));
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, count);
}
