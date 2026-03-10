/**
 * 僕役宮專用句庫：宮位核心、失衡、成熟。
 */

export const PUYI_CORE = [
  "僕役宮掌管的是你在團隊、人脈與合作網絡中的位置。",
  "這一宮反映的是你怎麼與人協作、分工，也顯示你在群體裡最自然的互動方式。",
  "僕役宮不只是朋友多不多，而是你如何進入一個系統、與人配合，並在關係中交換資源。",
];

export const PUYI_TENSION = [
  "當這一宮失衡時，容易在人際互動裡一邊得到支持、一邊承受壓力。",
  "若太在意關係裡的氣氛與評價，原本可以互相成就的合作，反而容易變成內耗。",
  "最大的挑戰通常不是沒有人脈，而是你沒有先分清楚哪些關係值得長期投入。",
];

export const PUYI_MATURE = [
  "成熟後的僕役宮，代表你能分辨什麼是資源、什麼只是熱鬧。",
  "當你開始用節奏與邊界經營關係，很多合作反而會更穩。",
  "真正有力量的人脈，不是誰都靠近，而是知道哪些連結值得養大。",
];

function pickBySeed<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error("Empty template array");
  if (seed == null || !Number.isFinite(seed)) return arr[0];
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

export function pickPuYiCore(seed?: number): string {
  return pickBySeed(PUYI_CORE, seed);
}

export function pickPuYiTension(seed?: number): string {
  return pickBySeed(PUYI_TENSION, seed);
}

export function pickPuYiMature(seed?: number): string {
  return pickBySeed(PUYI_MATURE, seed);
}
