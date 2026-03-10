/**
 * 去重：同 ruleId + 同 canonicalKey 只留一筆；R11 可依「有無因果矩陣命中」優先保留
 */

import type { PatternHit } from "./types.js";

function getCanonicalKey(h: PatternHit): string {
  const k = h.payload?.canonicalKey as string | undefined;
  return k ?? `${h.ruleId}:${JSON.stringify(h.payload)}`;
}

/**
 * 去重；若提供 isCausalityMatch，R11 會先依「有命中」排序，再 dedupe，故保留有命中的那筆
 */
export function mergePatternHits(
  hits: PatternHit[],
  isCausalityMatch?: (from: string, to: string, transform: string) => boolean
): PatternHit[] {
  let list = [...hits];
  if (isCausalityMatch && list.some((h) => h.ruleId === "R11")) {
    const r11 = list.filter((h) => h.ruleId === "R11");
    const rest = list.filter((h) => h.ruleId !== "R11");
    const from = (h: PatternHit) => (h.payload?.fromPalace as string) ?? "";
    const to = (h: PatternHit) => (h.payload?.toPalace as string) ?? "";
    const t = (h: PatternHit) => (h.payload?.transform as string) ?? "";
    r11.sort((a, b) => {
      const am = isCausalityMatch(from(a), to(a), t(a)) ? 1 : 0;
      const bm = isCausalityMatch(from(b), to(b), t(b)) ? 1 : 0;
      return bm - am;
    });
    list = [...rest, ...r11];
  }

  const seen = new Map<string, PatternHit>();
  for (const h of list) {
    const key = `${h.ruleId}:${getCanonicalKey(h)}`;
    if (seen.has(key)) continue;
    seen.set(key, h);
  }
  const order = ["R01", "R02", "R03", "R30", "R11"];
  return [...seen.values()].sort((a, b) => order.indexOf(a.ruleId) - order.indexOf(b.ruleId));
}
