/**
 * P2: 四化進到這一宮時，經過這顆主星，會長成什麼樣子？
 * 只解釋「飛入該宮」的四化（in-transforms）；不混飛出／對宮／三方／compound。
 */

import type { PalaceStructure, TransformEdge, TransformDisplay } from "../../normalizedChart.js";
import type { PalacePatternFinding } from "../../lifebookFindings.js";
import { resolveLeadMainStar } from "./leadMainStarResolver.js";
import { matchPalacePattern, buildMatrixMap, type PalaceTransformStarPatternRow } from "./palacePatternMatcher.js";
import { buildFallbackPatternFinding, type MainStarInferenceHint } from "./palacePatternFallback.js";

/** 只取飛入該宮的四化 */
function transformsIn(palace: PalaceStructure): TransformEdge[] {
  return [
    ...palace.natalTransformsIn,
    ...palace.decadalTransformsIn,
    ...palace.yearlyTransformsIn,
  ];
}

export interface PalaceInferenceInput {
  matrixMap: Map<string, PalaceTransformStarPatternRow>;
  mainStarHints: MainStarInferenceHint[];
}

function getHintForStar(star: string, hints: MainStarInferenceHint[]): MainStarInferenceHint | undefined {
  return hints.find((h) => h.star === star);
}

function dedupePalacePatternFindings(findings: PalacePatternFinding[]): PalacePatternFinding[] {
  const seen = new Set<string>();
  const result: PalacePatternFinding[] = [];
  for (const item of findings) {
    const key = `${item.palace}__${item.mainStar ?? ""}__${item.transform}__${item.patternName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

/**
 * 單一宮位：產出該宮所有 PalacePatternFinding（每條 in-transform 一筆，同宮多層四化先都保留，最後 dedupe）。
 */
export function buildPalacePatternFindingsForPalace(
  palace: PalaceStructure,
  input: PalaceInferenceInput
): PalacePatternFinding[] {
  const resolution = resolveLeadMainStar(palace.mainStars);

  if (resolution.mode === "none" || !resolution.leadMainStar) {
    return [];
  }

  const transformsInList = transformsIn(palace);
  const findings: PalacePatternFinding[] = [];

  const layerMap = { natal: "natal" as const, decade: "decade" as const, year: "year" as const };
  for (const edge of transformsInList) {
    const transform = edge.transform as TransformDisplay;
    const mainStar = resolution.leadMainStar;
    const layer = layerMap[edge.layer] ?? "natal";

    const row = matchPalacePattern(
      palace.palace,
      mainStar,
      transform,
      input.matrixMap
    );

    if (row) {
      findings.push({
        palace: palace.palace,
        mainStar: row.mainStar,
        transform: row.transform,
        patternName: row.patternName,
        patternType: row.patternType,
        psychology: row.psychology,
        lifePattern: row.lifePattern,
        shockLevel: row.shockLevel,
        advice: row.advice,
        source: "matrix",
        patternId: row.patternId,
        sensoryTags: row.sensoryTags ?? [],
        layer,
      });
      continue;
    }

    const fallback = buildFallbackPatternFinding({
      palace: palace.palace,
      mainStar,
      transform,
      hint: getHintForStar(mainStar, input.mainStarHints),
    });
    findings.push({ ...fallback, layer });
  }

  return dedupePalacePatternFindings(findings);
}

/**
 * 整張盤：所有宮位產出 PalacePatternFinding[]。
 */
export function buildPalacePatternFindings(
  palaces: PalaceStructure[],
  input: PalaceInferenceInput
): PalacePatternFinding[] {
  return palaces.flatMap((palace) =>
    buildPalacePatternFindingsForPalace(palace, input)
  );
}

/** 相容舊 API：接受 patterns 陣列，內部建 Map 後呼叫 buildPalacePatternFindings */
export function runPalaceInferenceEngine(
  palaces: PalaceStructure[],
  matrix: { patterns: PalaceTransformStarPatternRow[]; mainStarHints: MainStarInferenceHint[] }
): PalacePatternFinding[] {
  const matrixMap = buildMatrixMap(matrix.patterns);
  return buildPalacePatternFindings(palaces, {
    matrixMap,
    mainStarHints: matrix.mainStarHints,
  });
}

export function runPalaceInferenceForPalace(
  palace: PalaceStructure,
  matrix: { patterns: PalaceTransformStarPatternRow[]; mainStarHints: MainStarInferenceHint[] }
): PalacePatternFinding[] {
  const matrixMap = buildMatrixMap(matrix.patterns);
  return buildPalacePatternFindingsForPalace(palace, {
    matrixMap,
    mainStarHints: matrix.mainStarHints,
  });
}
