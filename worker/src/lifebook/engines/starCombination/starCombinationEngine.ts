/**
 * CL3 starCombinationEngine：同宮星曜兩兩組合 → 查 star-combinations.json → StarCombinationFinding[]。
 * 不寫文章，只輸出結構化診斷；v1 僅做 2-star，不做三星、跨宮、權重。
 */

import type { PalaceStructure } from "../../normalizedChart.js";
import type { StarCombinationFinding } from "../../lifebookFindings.js";
import type { StarCombinationRow } from "./starCombinationTypes.js";
import { matchStarCombination, buildStarCombinationMap } from "./starCombinationMatcher.js";

function collectStarsForCombination(palace: PalaceStructure): string[] {
  const names = [
    ...palace.mainStars.map((s) => s.name?.trim()).filter(Boolean),
    ...palace.assistantStars.map((s) => s.name?.trim()).filter(Boolean),
    ...palace.shaStars.map((s) => s.name?.trim()).filter(Boolean),
    ...palace.miscStars.map((s) => s.name?.trim()).filter(Boolean),
  ];
  return [...new Set(names)];
}

function buildStarPairs(stars: string[]): string[][] {
  const pairs: string[][] = [];
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      if (stars[i] && stars[j]) pairs.push([stars[i], stars[j]]);
    }
  }
  return pairs;
}

function dedupeCombinationFindings(
  findings: StarCombinationFinding[]
): StarCombinationFinding[] {
  const seen = new Set<string>();
  const result: StarCombinationFinding[] = [];
  for (const f of findings) {
    const key = `${f.palace}__${f.comboId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(f);
  }
  return result;
}

/** 排序：shockLevel 高者優先 → 主星有參與的組合優先 → comboId */
function sortCombinationFindings(
  findings: StarCombinationFinding[],
  palaces: PalaceStructure[]
): StarCombinationFinding[] {
  const palaceMainSet = new Map<string, Set<string>>();
  for (const p of palaces) {
    const names = new Set(p.mainStars.map((s) => s.name?.trim()).filter(Boolean));
    palaceMainSet.set(p.palace, names);
  }
  return [...findings].sort((a, b) => {
    if (a.shockLevel !== b.shockLevel) return b.shockLevel - a.shockLevel;
    const mainA = palaceMainSet.get(a.palace);
    const mainB = palaceMainSet.get(b.palace);
    const hasMainA = mainA && a.stars.some((s) => mainA.has(s)) ? 1 : 0;
    const hasMainB = mainB && b.stars.some((s) => mainB.has(s)) ? 1 : 0;
    if (hasMainA !== hasMainB) return hasMainB - hasMainA;
    return (a.comboId ?? "").localeCompare(b.comboId ?? "", "zh-Hant");
  });
}

export function buildStarCombinationFindingsForPalace(
  palace: PalaceStructure,
  combinationMap: Map<string, StarCombinationRow>
): StarCombinationFinding[] {
  const stars = collectStarsForCombination(palace);
  const pairs = buildStarPairs(stars);
  const findings: StarCombinationFinding[] = [];
  const palaceName = palace.palace ?? "";

  for (const pair of pairs) {
    const matched = matchStarCombination(pair, combinationMap);
    if (!matched) continue;
    findings.push({
      comboId: matched.comboId,
      palace: palaceName,
      stars: [...pair],
      patternType: matched.patternType ?? "",
      patternName: matched.patternName,
      psychology: matched.psychology,
      lifePattern: matched.lifePattern,
      shockLevel: typeof matched.shockLevel === "number" ? matched.shockLevel : 1,
      bodySignals: matched.bodySignals ?? [],
      narrativeHint: matched.narrativeHint,
      source: "combination",
    });
  }
  return dedupeCombinationFindings(findings);
}

export function buildStarCombinationFindings(
  palaces: PalaceStructure[],
  combinationMap: Map<string, StarCombinationRow>
): StarCombinationFinding[] {
  const flat = palaces.flatMap((p) =>
    buildStarCombinationFindingsForPalace(p, combinationMap)
  );
  return sortCombinationFindings(flat, palaces);
}

/** 相容舊 API：接受 table（star-combinations.json 形狀），內部建 Map 後產出 findings */
export interface StarCombinationsTable {
  meta?: { canonicalStarOrder?: string[] };
  items: StarCombinationRow[];
}

export function runStarCombinationEngine(
  palaces: PalaceStructure[],
  table: StarCombinationsTable
): StarCombinationFinding[] {
  const map = buildStarCombinationMap(table.items ?? []);
  return buildStarCombinationFindings(palaces, map);
}

export function runStarCombinationForPalace(
  palace: PalaceStructure,
  table: StarCombinationsTable
): StarCombinationFinding[] {
  const map = buildStarCombinationMap(table.items ?? []);
  return buildStarCombinationFindingsForPalace(palace, map);
}
