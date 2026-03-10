/**
 * 田宅宮專用句庫：宮位核心、失衡、成熟。
 */

export const TIANZHAI_CORE = [
  "田宅宮掌管的是你的安全感、生活根基與可安放自己的地方。",
  "這一宮反映的是你怎麼建立穩定感：包括居所、歸屬感，以及你是否覺得自己有地方可以落下來。",
  "田宅宮不只是房子或資產，更是你內在對『我有沒有根』這件事的感受。",
];

export const TIANZHAI_TENSION = [
  "當這一宮失衡時，容易把安全感焦慮轉成控制感，想先把外在的一切抓穩。",
  "若太害怕失去穩定，很多本來可以流動的機會，反而會被自己先關掉。",
  "最大的壓力通常不是外在條件不夠，而是你太早把不安放大成了風險。",
];

export const TIANZHAI_MATURE = [
  "成熟後的田宅宮，代表你能把穩定感建立在結構上，而不是只靠情緒撐著。",
  "當你開始分清楚什麼是真正的根基，很多焦慮就不再需要用控制來處理。",
  "真正穩的田宅宮，不只是守住，而是知道什麼值得留下、什麼可以鬆開。",
];

function pickBySeed<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error("Empty template array");
  if (seed == null || !Number.isFinite(seed)) return arr[0];
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

export function pickTianZhaiCore(seed?: number): string {
  return pickBySeed(TIANZHAI_CORE, seed);
}

export function pickTianZhaiTension(seed?: number): string {
  return pickBySeed(TIANZHAI_TENSION, seed);
}

export function pickTianZhaiMature(seed?: number): string {
  return pickBySeed(TIANZHAI_MATURE, seed);
}
