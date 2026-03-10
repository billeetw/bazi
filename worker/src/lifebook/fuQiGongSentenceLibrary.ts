/**
 * 夫妻宮專用句庫：宮位核心、失衡、成熟。
 */

export const FUQI_CORE = [
  "夫妻宮描述的不只是伴侶關係，也包含你如何面對一對一的互動與合作。",
  "這一宮反映的是你在關係中的位置：你如何靠近他人，也如何保持自己。",
  "夫妻宮其實是一面鏡子，很多你在關係中遇到的事情，往往也在映照你的內在需求。",
];

export const FUQI_TENSION = [
  "當這一宮失衡時，容易在關係裡一邊投入、一邊承受壓力。",
  "若太急著追求結果，原本可以累積的信任反而容易變成負擔。",
  "最大的挑戰通常不是關係本身，而是彼此節奏沒有被理解。",
];

export const FUQI_MATURE = [
  "成熟後的夫妻宮，代表你能在關係中同時保有連結與界線。",
  "當你開始理解彼此的節奏，很多衝突其實會自然減少。",
  "真正穩定的關係，往往來自清楚的期待與長期的信任累積。",
];

function pickBySeed<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error("Empty template array");
  if (seed == null || !Number.isFinite(seed)) return arr[0];
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

export function pickFuQiCore(seed?: number): string {
  return pickBySeed(FUQI_CORE, seed);
}

export function pickFuQiTension(seed?: number): string {
  return pickBySeed(FUQI_TENSION, seed);
}

export function pickFuQiMature(seed?: number): string {
  return pickBySeed(FUQI_MATURE, seed);
}
