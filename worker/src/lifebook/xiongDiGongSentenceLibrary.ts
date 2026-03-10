/**
 * 兄弟宮專用句庫：宮位核心、失衡、成熟。
 */

export const XIONGDI_CORE = [
  "兄弟宮掌管的是你與同儕、手足、合作夥伴之間的互動方式。",
  "這一宮反映的是你怎麼在相近的位置裡比較、協作、分工，也看你怎麼處理平行關係中的距離感。",
  "兄弟宮不只是手足關係，也包含你與同輩、同行、身邊夥伴之間的默契與張力。",
];

export const XIONGDI_TENSION = [
  "當這一宮失衡時，容易在比較與合作之間來回拉扯。",
  "若太在意彼此的位置與分工，原本可以互補的關係，反而會變得敏感。",
  "最大的挑戰通常不是沒有合作對象，而是你還沒找到真正適合的互動節奏。",
];

export const XIONGDI_MATURE = [
  "成熟後的兄弟宮，代表你能在平行關係中既合作也保有自己。",
  "當你開始看懂每個人擅長的不同，很多比較就會慢慢轉成互補。",
  "真正穩定的同儕關係，不是沒有差異，而是差異能被放進同一個節奏裡。",
];

function pickBySeed<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error("Empty template array");
  if (seed == null || !Number.isFinite(seed)) return arr[0];
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

export function pickXiongDiCore(seed?: number): string {
  return pickBySeed(XIONGDI_CORE, seed);
}

export function pickXiongDiTension(seed?: number): string {
  return pickBySeed(XIONGDI_TENSION, seed);
}

export function pickXiongDiMature(seed?: number): string {
  return pickBySeed(XIONGDI_MATURE, seed);
}
