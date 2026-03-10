/**
 * 父母宮專用句庫：宮位核心、失衡、成熟。
 */

export const FUMU_CORE = [
  "父母宮掌管的是你面對權威、規範、期待與支持系統的方式。",
  "這一宮反映的是你怎麼理解『應該』、怎麼看待外在標準，也怎麼接受來自上位者的影響。",
  "父母宮不只是父母本身，也包含你與規則、價值框架、支撐力量之間的關係。",
];

export const FUMU_TENSION = [
  "當這一宮失衡時，容易把外在期待內化成壓力，久了忘記自己真正想要什麼。",
  "若太習慣迎合權威或標準，很多選擇會看似正確，卻未必貼近你自己。",
  "最大的挑戰通常不是沒有支持，而是你太早把別人的聲音當成自己的答案。",
];

export const FUMU_MATURE = [
  "成熟後的父母宮，代表你能在尊重規則的同時，保留自己的判斷。",
  "當你開始分清楚哪些期待值得承接、哪些需要鬆開，很多壓力會自然減少。",
  "真正穩定的價值框架，不是照單全收，而是經過消化後仍願意認同。",
];

function pickBySeed<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error("Empty template array");
  if (seed == null || !Number.isFinite(seed)) return arr[0];
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

export function pickFuMuCore(seed?: number): string {
  return pickBySeed(FUMU_CORE, seed);
}

export function pickFuMuTension(seed?: number): string {
  return pickBySeed(FUMU_TENSION, seed);
}

export function pickFuMuMature(seed?: number): string {
  return pickBySeed(FUMU_MATURE, seed);
}
