/**
 * CL3 starCombinationEngine：組合表 Map 建表與查表。
 */

import { buildStarCombinationKey } from "./starCombinationKey.js";
import type { StarCombinationRow } from "./starCombinationTypes.js";

export function buildStarCombinationMap(
  rows: StarCombinationRow[]
): Map<string, StarCombinationRow> {
  const map = new Map<string, StarCombinationRow>();
  for (const row of rows) {
    const stars = Array.isArray(row.stars) ? row.stars : [];
    const key = buildStarCombinationKey(stars);
    if (key && !map.has(key)) map.set(key, row);
  }
  return map;
}

export function matchStarCombination(
  stars: string[],
  map: Map<string, StarCombinationRow>
): StarCombinationRow | null {
  const key = buildStarCombinationKey(stars);
  return map.get(key) ?? null;
}
