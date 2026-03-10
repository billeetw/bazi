/**
 * CL3 spilloverEngine：依 fromPalace / toPalace 查軸線語義。
 */

import type { PalaceAxisLinkRow } from "./crossChartRuleTypes.js";

export function findAxisForPalaces(
  fromPalace: string,
  toPalace: string,
  rows: PalaceAxisLinkRow[]
): string | undefined {
  const from = (fromPalace ?? "").trim();
  const to = (toPalace ?? "").trim();
  for (const row of rows) {
    if (row.palaces) {
      const set = new Set(row.palaces.map((p) => (p ?? "").trim()));
      if (set.has(from) && set.has(to)) return row.axis;
    }
    if (row.fromPalace != null && row.toPalace != null) {
      const f = (row.fromPalace as string).trim();
      const t = (row.toPalace as string).trim();
      if ((f === from && t === to) || (f === to && t === from)) return row.axis;
    }
  }
  return undefined;
}
