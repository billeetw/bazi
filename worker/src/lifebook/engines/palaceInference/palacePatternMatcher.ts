/**
 * P2: (palace, mainStar, transform) → 矩陣查表。
 * 只負責 key 與 Map 查詢；fallback 由 palacePatternFallback 產出。
 */

import type { TransformDisplay } from "../../normalizedChart.js";

export type PalaceTransformStarPatternRow = {
  patternId: string;
  palace: string;
  mainStar: string;
  transform: "祿" | "權" | "科" | "忌";
  patternType: "growth" | "pressure" | "power" | "correction";
  patternName: string;
  psychology: string;
  lifePattern: string;
  shockLevel: number;
  advice?: string;
  sensoryTags?: string[];
};

/** 矩陣查表 key：宮位__主星__四化 */
export function buildPatternKey(
  palace: string,
  mainStar: string,
  transform: "祿" | "權" | "科" | "忌"
): string {
  return `${palace}__${mainStar}__${transform}`;
}

export function matchPalacePattern(
  palace: string,
  mainStar: string,
  transform: TransformDisplay,
  matrixMap: Map<string, PalaceTransformStarPatternRow>
): PalaceTransformStarPatternRow | null {
  const t = (transform === "祿" ? "祿" : transform === "權" ? "權" : transform === "科" ? "科" : "忌") as "祿" | "權" | "科" | "忌";
  const key = buildPatternKey(palace, mainStar, t);
  return matrixMap.get(key) ?? null;
}

/** 從 patterns 陣列建 Map，key = buildPatternKey(palace, mainStar, transform) */
export function buildMatrixMap(
  patterns: PalaceTransformStarPatternRow[]
): Map<string, PalaceTransformStarPatternRow> {
  const map = new Map<string, PalaceTransformStarPatternRow>();
  for (const row of patterns) {
    const key = buildPatternKey(row.palace, row.mainStar, row.transform);
    if (!map.has(key)) map.set(key, row);
  }
  return map;
}

/** 相容舊介面：用陣列線性查（無 Map 時 fallback） */
export interface MatrixPattern {
  patternId: string;
  palace: string;
  mainStar: string;
  transform: string;
  patternType: "growth" | "pressure" | "power" | "correction";
  patternName: string;
  psychology: string;
  lifePattern: string;
  shockLevel: number;
  advice?: string;
  sensoryTags?: string[];
}

export interface MainStarHint {
  star: string;
  growthMode: string;
  powerMode: string;
  correctionMode: string;
  stressMode: string;
}

export function matchMatrix(
  palace: string,
  mainStar: string,
  transform: TransformDisplay,
  patterns: MatrixPattern[]
): MatrixPattern | undefined {
  const t = transform === "祿" ? "祿" : transform === "權" ? "權" : transform === "科" ? "科" : "忌";
  return patterns.find(
    (p) =>
      (p.palace === palace || p.palace?.replace(/宮$/, "") === palace?.replace(/宮$/, "")) &&
      p.mainStar === mainStar &&
      (p.transform === t || p.transform === transform)
  );
}
