/**
 * S22／S23：自本命盤計算結構線／轉化流，寫入 placeholder map（技術版骨架、inject 共用）。
 */

import { normalizeChart } from "../normalize/index.js";
import type { NormalizedChart } from "../normalizedChart.js";
import {
  getStructureLines,
  getTransformationFlows,
  formatStructureLinesForTechnical,
  formatTransformationFlowsForTechnical,
} from "../lifeModel/index.js";

export type S22S23MergeErrorMode = "overwrite" | "fill-empty";

/**
 * 若 section 為 s22 或 s23 且具 chartJson，則填入 structureLinesBlock、transformationFlowsBlock。
 */
export function mergeS22S23BlocksIntoMap(
  map: Record<string, string>,
  sectionKey: string | undefined,
  chartJson: Record<string, unknown> | undefined,
  opts?: {
    normalizedChart?: NormalizedChart;
    onComputeError?: S22S23MergeErrorMode;
  }
): void {
  if ((sectionKey !== "s22" && sectionKey !== "s23") || !chartJson) return;
  const onErr = opts?.onComputeError ?? "overwrite";
  try {
    const norm = opts?.normalizedChart ?? normalizeChart(chartJson);
    map.structureLinesBlock = formatStructureLinesForTechnical(getStructureLines(norm));
    map.transformationFlowsBlock = formatTransformationFlowsForTechnical(getTransformationFlows(norm));
  } catch {
    if (onErr === "fill-empty") {
      map.structureLinesBlock = map.structureLinesBlock ?? "（結構線計算暫不可用）";
      map.transformationFlowsBlock = map.transformationFlowsBlock ?? "（轉化流計算暫不可用）";
    } else {
      map.structureLinesBlock = "（結構線計算暫不可用）";
      map.transformationFlowsBlock = "（轉化流計算暫不可用）";
    }
  }
}
