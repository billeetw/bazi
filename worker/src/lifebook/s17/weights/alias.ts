const PALACE_ALIAS_TO_CANONICAL: Record<string, string> = {
  交友宮: "僕役宮",
  交友: "僕役宮",
  僕役: "僕役宮",
  事業宮: "官祿宮",
  事業: "官祿宮",
  官祿: "官祿宮",
};

export function toCanonicalPalaceName(raw: string): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  const withSuffix = v.endsWith("宮") ? v : `${v}宮`;
  return PALACE_ALIAS_TO_CANONICAL[v] ?? PALACE_ALIAS_TO_CANONICAL[withSuffix] ?? withSuffix;
}

/** 對使用者顯示：內部僕役宮，外顯交友宮 */
export function toDisplayPalaceName(canonical: string): string {
  const p = toCanonicalPalaceName(canonical);
  if (p === "僕役宮") return "交友宮";
  return p;
}
