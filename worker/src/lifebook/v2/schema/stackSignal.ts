/**
 * Lifebook V2：疊宮／相撞／會合信號。
 * Stacking Engine 輸出。
 */

import type { TimeLayer } from "./transformEdge.js";
import type { TransformType } from "./transformEdge.js";

export type StackType =
  | "double_stack"
  | "triple_stack"
  | "lu_ji_collision"
  | "quan_ji_collision"
  | "self_transform_focus"
  | "path_cluster";

export interface StackSignal {
  id: string;
  palace: string;
  stackType: StackType;
  layers: TimeLayer[];
  transforms: TransformType[];
  stars: string[];
  severity: number;
  theme: string;
  interpretationKey: string;
}
