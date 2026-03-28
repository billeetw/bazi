/** 收尾標點：避免「。。」「。，」等排版瑕疵 */

/** 移除 Markdown 粗體／斜體殘留（語料或模型偶帶 **），避免正式輸出影響閱讀 */
export function stripMarkdownEmphasis(s: string): string {
  return (s ?? "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1");
}

export function normalizeNarrativePunctuation(s: string): string {
  let t = stripMarkdownEmphasis((s ?? "").trim());
  t = t.replace(/。{2,}/g, "。");
  t = t.replace(/，\s*。/g, "。");
  t = t.replace(/：\s*。/g, "。");
  return t;
}
