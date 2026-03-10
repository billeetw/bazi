/**
 * 官祿宮專用句庫：宮位核心、失衡、成熟。
 */

export const GUANLU_CORE = [
  "官祿宮描述的是你在世界上的角色，以及你如何承擔責任與建立位置。",
  "這一宮反映的是你做事的方式：你如何面對任務、制度與外界期待。",
  "官祿宮不是單純的工作，而是你在現實世界中的角色與責任感。",
];

export const GUANLU_TENSION = [
  "當這一宮失衡時，容易把責任全部攬在自己身上，久了反而消耗過多。",
  "若過度把自我價值綁在成就上，壓力會在不知不覺中累積。",
  "最大的挑戰通常不是能力不足，而是角色與邊界沒有被好好劃分。",
];

export const GUANLU_MATURE = [
  "成熟後的官祿宮，代表你能在責任與自由之間找到平衡。",
  "當你開始用策略而不是硬撐面對工作，很多事情會變得更順。",
  "真正的穩定來自清楚自己的角色，而不是不斷承擔更多事情。",
];

function pickBySeed<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error("Empty template array");
  if (seed == null || !Number.isFinite(seed)) return arr[0];
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

export function pickGuanLuCore(seed?: number): string {
  return pickBySeed(GUANLU_CORE, seed);
}

export function pickGuanLuTension(seed?: number): string {
  return pickBySeed(GUANLU_TENSION, seed);
}

export function pickGuanLuMature(seed?: number): string {
  return pickBySeed(GUANLU_MATURE, seed);
}
