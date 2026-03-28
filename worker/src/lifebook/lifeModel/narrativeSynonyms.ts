/**
 * 敘事同義替換：用穩定 seed 選詞，避免同一篇反覆「累積／結構／後天設計」。
 */

const POOL: Record<string, readonly string[]> = {
  累積: ["留住", "堆成結果", "留下可見的堆疊"],
  結構: ["方法", "系統", "規則"],
  調整: ["微調", "轉向", "收斂"],
  設計: ["安排", "配置", "刻意選擇"],
  支撐: ["打底", "承接", "托住"],
  系統: ["制度", "流程", "SOP"],
};

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 以 seed 決定性選同義詞；無池則回原字 */
export function pickSynonym(lemma: string, seed: string): string {
  const options = POOL[lemma];
  if (!options?.length) return lemma;
  return options[hashSeed(seed) % options.length]!;
}
