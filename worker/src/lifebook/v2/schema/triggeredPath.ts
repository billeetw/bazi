/**
 * Lifebook V2：路徑辨識結果。
 * Path Reasoner 將 edge 投影到 path 後的輸出。
 */

import type { TimeLayer } from "./transformEdge.js";
import type { TransformType } from "./transformEdge.js";

export type PathPolarity = "positive" | "mixed" | "negative";

export interface TriggeredPath {
  pathId: string;
  /** 命中的 edge id 列表 */
  matchedEdges: string[];
  touchedPalaces: string[];
  layers: TimeLayer[];
  transforms: TransformType[];
  score: number;
  polarity: PathPolarity;
  summaryTag: string;
}
