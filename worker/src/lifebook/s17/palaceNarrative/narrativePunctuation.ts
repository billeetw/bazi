/** 收尾標點：避免「。。」「。，」等排版瑕疵 */

export function normalizeNarrativePunctuation(s: string): string {
  let t = (s ?? "").trim();
  t = t.replace(/。{2,}/g, "。");
  t = t.replace(/，\s*。/g, "。");
  t = t.replace(/：\s*。/g, "。");
  return t;
}
