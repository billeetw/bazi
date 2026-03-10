/**
 * 遷移宮專用句庫：宮位核心、失衡、成熟。
 */

export const QIANYI_CORE = [
  "遷移宮掌管的是你離開熟悉環境之後，如何與世界互動。",
  "這一宮反映的是你面對外部環境、陌生舞台與變動時的反應方式。",
  "遷移宮描述的是：當你走出去之後，這個世界會怎麼回應你，而你又怎麼回應世界。",
];

export const QIANYI_TENSION = [
  "當這一宮失衡時，容易過度受外部評價牽動，讓自己的節奏被環境帶走。",
  "若太急著適應外界，可能會在不知不覺中失去原本的立場。",
  "最大的風險通常不是變動本身，而是你太快把外部訊號當成唯一答案。",
];

export const QIANYI_MATURE = [
  "成熟後的遷移宮，代表你能在面對變化時保留彈性，也保留主體。",
  "當你開始把外部世界當成合作對象，而不是壓力來源，很多路會自然打開。",
  "真正穩定的遷移宮，不是害怕變動，而是知道自己走到哪裡都能重新站穩。",
];

function pickBySeed<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error("Empty template array");
  if (seed == null || !Number.isFinite(seed)) return arr[0];
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

export function pickQianYiCore(seed?: number): string {
  return pickBySeed(QIANYI_CORE, seed);
}

export function pickQianYiTension(seed?: number): string {
  return pickBySeed(QIANYI_TENSION, seed);
}

export function pickQianYiMature(seed?: number): string {
  return pickBySeed(QIANYI_MATURE, seed);
}
