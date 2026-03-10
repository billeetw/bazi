/**
 * 疾厄宮專用句庫：宮位核心、失衡、成熟。
 */

export const JIE_CORE = [
  "疾厄宮掌管的是你的身心壓力、耗損方式與修復節奏。",
  "這一宮反映的是你在高壓之下怎麼撐、怎麼累，以及怎麼讓自己慢慢恢復。",
  "疾厄宮不是只看健康問題，而是看你如何承受壓力，又如何把自己修回來。",
];

export const JIE_TENSION = [
  "當這一宮失衡時，容易先撐住表面，卻讓疲憊慢慢往內堆積。",
  "若太習慣忍耐，很多壓力不會立刻爆開，而是變成長期耗損。",
  "最大的風險通常不是一次性的事件，而是你太晚承認自己其實已經累了。",
];

export const JIE_MATURE = [
  "成熟後的疾厄宮，代表你知道什麼時候該撐，什麼時候該修復。",
  "當你開始把恢復力當成能力的一部分，很多壓力就不再只是消耗。",
  "真正穩定的身心節奏，不是永遠不累，而是累了之後知道怎麼回來。",
];

function pickBySeed<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error("Empty template array");
  if (seed == null || !Number.isFinite(seed)) return arr[0];
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

export function pickJiECore(seed?: number): string {
  return pickBySeed(JIE_CORE, seed);
}

export function pickJiETension(seed?: number): string {
  return pickBySeed(JIE_TENSION, seed);
}

export function pickJiEMature(seed?: number): string {
  return pickBySeed(JIE_MATURE, seed);
}
