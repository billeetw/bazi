/**
 * Findings Orchestrator v1：去重 helpers。
 */

import type {
  PalacePatternFinding,
  StarCombinationFinding,
  SpilloverFinding,
  CrossChartFinding,
} from "../lifebookFindings.js";

export function dedupePalacePatterns(findings: PalacePatternFinding[]): PalacePatternFinding[] {
  const seen = new Set<string>();
  const out: PalacePatternFinding[] = [];
  for (const f of findings) {
    const key = `${f.palace}__${f.mainStar ?? ""}__${f.transform}__${f.patternName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

export function dedupeStarCombinations(findings: StarCombinationFinding[]): StarCombinationFinding[] {
  const seen = new Set<string>();
  const out: StarCombinationFinding[] = [];
  for (const f of findings) {
    const key = `${f.palace}__${f.comboId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

export function dedupeSpilloverFindings(findings: SpilloverFinding[]): SpilloverFinding[] {
  const seen = new Set<string>();
  const out: SpilloverFinding[] = [];
  for (const f of findings) {
    const key = `${f.ruleId}__${f.fromPalace}__${f.toPalace}__${f.transform ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

export function dedupeCrossChartFindings(findings: CrossChartFinding[]): CrossChartFinding[] {
  const seen = new Set<string>();
  const out: CrossChartFinding[] = [];
  for (const f of findings) {
    const key = `${f.palace}__${f.synthesis}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}
