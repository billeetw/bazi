/**
 * 其他星曜（輔＋雜）總結：僅在「足夠可解釋」時產出，不為空區塊硬寫套話。
 */

export type RenderedOtherStarEntry = {
  star: string;
  text: string;
  /** 來自現象型句庫（非純「代表…」語義句） */
  isPhenomenon: boolean;
};

function firstSentence(text: string): string {
  const t = (text ?? "").trim();
  if (!t) return "";
  const i = t.indexOf("。");
  return i >= 0 ? t.slice(0, i + 1) : t;
}

/**
 * 條件：至少 2 顆有可解釋正文；或至少 1 顆為現象型描述。
 * 由實際 render 出的 entries 驅動，不依賴「區塊是否存在」。
 */
export function buildPhenomenaSummary(opts: {
  entries: RenderedOtherStarEntry[];
  palaceShortLabel: string;
}): string | null {
  const ex = opts.entries.filter((e) => e.text.trim().length > 0);
  if (ex.length === 0) return null;
  const phen = ex.filter((e) => e.isPhenomenon);
  if (ex.length < 2 && phen.length === 0) return null;

  const chunks = ex.map((e) => `「${e.star}」${firstSentence(e.text)}`.replace(/。$/, "") + "。");
  return `👉 在「${opts.palaceShortLabel}」上，${chunks.join("")}`;
}
