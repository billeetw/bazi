/**
 * Findings Orchestrator v1：排序 helpers。
 */

import type {
  PalacePatternFinding,
  StarCombinationFinding,
  SpilloverFinding,
  YearSignal,
} from "../lifebookFindings.js";

const TRANSFORM_ORDER: Record<string, number> = { 忌: 0, 權: 1, 科: 2, 祿: 3 };

export function rankPalacePatterns(findings: PalacePatternFinding[]): PalacePatternFinding[] {
  return [...findings].sort((a, b) => {
    if (a.shockLevel !== b.shockLevel) return b.shockLevel - a.shockLevel;
    const srcA = a.source === "matrix" ? 1 : 0;
    const srcB = b.source === "matrix" ? 1 : 0;
    if (srcA !== srcB) return srcB - srcA;
    const tA = TRANSFORM_ORDER[a.transform] ?? 4;
    const tB = TRANSFORM_ORDER[b.transform] ?? 4;
    return tA - tB;
  });
}

export function rankStarCombinations(
  findings: StarCombinationFinding[],
  mainStarSet: Set<string>
): StarCombinationFinding[] {
  return [...findings].sort((a, b) => {
    if (a.shockLevel !== b.shockLevel) return b.shockLevel - a.shockLevel;
    const mainA = a.stars.some((s) => mainStarSet.has(s)) ? 1 : 0;
    const mainB = b.stars.some((s) => mainStarSet.has(s)) ? 1 : 0;
    return mainB - mainA;
  });
}

/** 同宮最多保留前 N 條 starCombinations */
export function takeTopStarCombinationsPerPalace(
  findings: StarCombinationFinding[],
  limit: number
): StarCombinationFinding[] {
  const byPalace = new Map<string, StarCombinationFinding[]>();
  for (const f of findings) {
    const list = byPalace.get(f.palace) ?? [];
    list.push(f);
    byPalace.set(f.palace, list);
  }
  const out: StarCombinationFinding[] = [];
  for (const list of byPalace.values()) {
    out.push(...list.slice(0, limit));
  }
  return out;
}

/** 同一 target 宮最多保留前 N 條 spillovers */
export function takeTopSpilloversPerTarget(
  findings: SpilloverFinding[],
  limit: number
): SpilloverFinding[] {
  const byTarget = new Map<string, SpilloverFinding[]>();
  for (const f of findings) {
    const list = byTarget.get(f.toPalace) ?? [];
    list.push(f);
    byTarget.set(f.toPalace, list);
  }
  const out: SpilloverFinding[] = [];
  for (const list of byTarget.values()) {
    out.push(...list.slice(0, limit));
  }
  return out;
}

const COLOR_ORDER: Record<string, number> = { red: 0, yellow: 1, green: 2 };

export function rankYearSignals(signals: YearSignal[]): YearSignal[] {
  return [...signals].sort((a, b) => {
    const cA = COLOR_ORDER[a.color] ?? 3;
    const cB = COLOR_ORDER[b.color] ?? 3;
    if (cA !== cB) return cA - cB;
    const sA = a.shockLevel ?? 0;
    const sB = b.shockLevel ?? 0;
    return sB - sA;
  });
}
