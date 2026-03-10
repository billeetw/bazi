/**
 * 福德宮專用句庫：宮位核心、失衡、成熟。
 */

export const FUDE_CORE = [
  "福德宮描述的是你的內在世界，以及你如何與自己相處。",
  "這一宮反映的是你的情緒底盤：你怎麼休息、怎麼消化壓力、怎麼讓自己恢復能量。",
  "福德宮不是外在成就，而是你內在的穩定感與精神狀態。",
];

export const FUDE_TENSION = [
  "當這一宮失衡時，容易在忙碌與疲憊之間來回擺盪。",
  "若長期忽略內在需求，壓力往往會慢慢累積。",
  "最大的風險通常不是事件本身，而是情緒沒有被好好安放。",
];

export const FUDE_MATURE = [
  "成熟後的福德宮，代表你能找到讓自己恢復能量的方法。",
  "當內在節奏穩定時，很多外在問題會自然變得容易處理。",
  "真正的福氣往往不是外在條件，而是內在的安定與清明。",
];

function pickBySeed<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error("Empty template array");
  if (seed == null || !Number.isFinite(seed)) return arr[0];
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

export function pickFuDeCore(seed?: number): string {
  return pickBySeed(FUDE_CORE, seed);
}

export function pickFuDeTension(seed?: number): string {
  return pickBySeed(FUDE_TENSION, seed);
}

export function pickFuDeMature(seed?: number): string {
  return pickBySeed(FUDE_MATURE, seed);
}
