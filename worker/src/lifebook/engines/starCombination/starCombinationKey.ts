/**
 * CL3 starCombinationEngine：星曜組合 canonical key。
 * ["紫微","鈴星"] 與 ["鈴星","紫微"] 視為同一組，去重、trim、按字串排序後用 __ 串接。
 */

export function buildStarCombinationKey(stars: string[]): string {
  return [...new Set(stars.map((s) => (s ?? "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "zh-Hant"))
    .join("__");
}
