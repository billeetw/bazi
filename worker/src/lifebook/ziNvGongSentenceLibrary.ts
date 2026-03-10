/**
 * 子女宮專用句庫：宮位核心、失衡、成熟。
 */

export const ZINV_CORE = [
  "子女宮掌管的是你的創造力、延伸成果，以及你如何看待自己產出的東西。",
  "這一宮反映的不只是子女，也包含作品、計畫、表達與那些從你身上延伸出去的成果。",
  "子女宮描述的是你怎麼把內在的東西變成外在的產出，以及你如何面對它被看見之後的反應。",
];

export const ZINV_TENSION = [
  "當這一宮失衡時，容易對自己的產出特別苛刻，明明還在成長，卻先急著否定。",
  "若太想證明成果，原本可以慢慢長出的創造力，反而會先被壓力卡住。",
  "最大的挑戰通常不是沒有能力，而是對產出物過度用力，讓創造變成負擔。",
];

export const ZINV_MATURE = [
  "成熟後的子女宮，代表你能把創造當成累積，而不是每一次都拿來證明自己。",
  "當你開始接受產出需要反覆修正，很多原本的卡點反而會鬆開。",
  "真正穩定的創造力，不是一次做到最好，而是願意讓作品持續長大。",
];

function pickBySeed<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error("Empty template array");
  if (seed == null || !Number.isFinite(seed)) return arr[0];
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

export function pickZiNvCore(seed?: number): string {
  return pickBySeed(ZINV_CORE, seed);
}

export function pickZiNvTension(seed?: number): string {
  return pickBySeed(ZINV_TENSION, seed);
}

export function pickZiNvMature(seed?: number): string {
  return pickBySeed(ZINV_MATURE, seed);
}
