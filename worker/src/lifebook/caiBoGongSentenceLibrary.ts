/**
 * 財帛宮專用句庫：宮位核心、失衡、成熟。
 * 供 s10 財帛宮敘事使用，與命宮句庫同構。
 */

/** 財帛宮 palaceCoreDefinition */
export const CAIBO_CORE = [
  "財帛宮掌管的不只是金錢，而是你如何看待投入、交換與回報。",
  "這一宮反映的是你與資源之間的關係：你怎麼賺、怎麼花，也怎麼衡量付出是否值得。",
  "財帛宮描述的是你的現實感：事情要不要做，往往取決於你覺得它值不值得。",
];

/** 財帛宮 失衡（tension）句庫 */
export const CAIBO_TENSION = [
  "當這一宮失衡時，容易只看得失，而忽略關係與長期成本。",
  "若過度被短期回報牽動，原本可以累積的資源反而容易流失。",
  "最大的風險通常不是沒有機會，而是判斷節奏太急。",
];

/** 財帛宮 成熟（mature）句庫 */
export const CAIBO_MATURE = [
  "成熟後的財帛宮，通常代表你能把資源配置變成長期優勢。",
  "當你開始以配置而不是衝刺看待金錢時，很多壓力會自然下降。",
  "真正的優勢不在於賺得快，而在於你知道什麼值得長期投入。",
];

export function pickCaiBoCore(seed?: number): string {
  const s = Math.abs(seed ?? 0);
  return CAIBO_CORE[s % CAIBO_CORE.length];
}

export function pickCaiBoTension(seed?: number): string {
  const s = Math.abs(seed ?? 0);
  return CAIBO_TENSION[s % CAIBO_TENSION.length];
}

export function pickCaiBoMature(seed?: number): string {
  const s = Math.abs(seed ?? 0);
  return CAIBO_MATURE[s % CAIBO_MATURE.length];
}
