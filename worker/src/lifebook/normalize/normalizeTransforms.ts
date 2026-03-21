/**
 * P2: 從 chartJson 產出正規化四化邊（TransformEdge[]）。
 * 疊宮報廢：不再從 overlapAnalysis.items[].transformations 讀取。
 * 大限／流年邊改由 normalizeChart 內 buildDecadalSihuaFlows / buildYearlySihuaFlows + gongGanFlowsToTransformEdges 產出。
 * 本檔僅保留 groupTransformsByLayer 供需要依 layer 分組的呼叫端使用。
 */

import type { TransformEdge, TransformDisplay } from "../normalizedChart.js";
import { toTransformDisplay } from "../normalizedChart.js";

/** 依 layer 分組，回傳 { natal, decade, year }。 */
export function groupTransformsByLayer(edges: TransformEdge[]): {
  natal: TransformEdge[];
  decade: TransformEdge[];
  year: TransformEdge[];
} {
  const natal: TransformEdge[] = [];
  const decade: TransformEdge[] = [];
  const year: TransformEdge[] = [];
  for (const e of edges) {
    if (e.layer === "natal") natal.push(e);
    else if (e.layer === "decade") decade.push(e);
    else if (e.layer === "year") year.push(e);
  }
  return { natal, decade, year };
}

// Re-export for consumers that need toTransformDisplay
export { toTransformDisplay };
export type { TransformDisplay };
