/**
 * 十天干 → 祿權科忌星曜（與前端 SI_HUA_MAP 一致，為四化唯一規格）。
 * 本命／大限／流年四化皆由此表 + 該層天干產出，每層必 4 條。
 */

export const SI_HUA_BY_STEM: Record<string, { 祿: string; 權: string; 科: string; 忌: string }> = {
  甲: { 祿: "廉貞", 權: "破軍", 科: "武曲", 忌: "太陽" },
  乙: { 祿: "天機", 權: "天梁", 科: "紫微", 忌: "太陰" },
  丙: { 祿: "天同", 權: "天機", 科: "文昌", 忌: "廉貞" },
  丁: { 祿: "太陰", 權: "天同", 科: "天機", 忌: "巨門" },
  戊: { 祿: "貪狼", 權: "太陰", 科: "右弼", 忌: "天機" },
  己: { 祿: "武曲", 權: "貪狼", 科: "天梁", 忌: "文曲" },
  庚: { 祿: "太陽", 權: "武曲", 科: "太陰", 忌: "天同" },
  辛: { 祿: "巨門", 權: "太陽", 科: "文曲", 忌: "文昌" },
  壬: { 祿: "天梁", 權: "紫微", 科: "左輔", 忌: "武曲" },
  癸: { 祿: "破軍", 權: "巨門", 科: "太陰", 忌: "貪狼" },
};

/**
 * 由天干產出該層四化星名（祿權科忌各一），保證每層 4 條。
 */
export function getMutagenStarsFromStem(stem: string): Record<string, string> | null {
  if (!stem || typeof stem !== "string") return null;
  const row = SI_HUA_BY_STEM[stem.trim()];
  if (!row) return null;
  return { 祿: row.祿, 權: row.權, 科: row.科, 忌: row.忌 };
}
