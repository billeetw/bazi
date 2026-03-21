/**
 * Lifebook V2：擴充 Findings，不取代既有 LifebookFindings。
 * 新增欄位供時序飛星、路徑、疊宮、分數、事件機率使用。
 */

import type { LifebookFindings } from "../../lifebookFindings.js";
import type { TransformEdgeV2 } from "./transformEdge.js";
import type { TriggeredPath } from "./triggeredPath.js";
import type { StackSignal } from "./stackSignal.js";
import type { TimeWindowScore } from "./timeWindowScore.js";
import type { EventProbability } from "./eventProbability.js";

export interface PathNarrative {
  label: string;
  summary: string;
  relatedPathIds: string[];
}

export interface LifebookFindingsV2 extends LifebookFindings {
  /** V2 統一飛星邊（三層 + 宮干） */
  transformEdges?: TransformEdgeV2[];
  /** 路徑辨識結果 */
  triggeredPaths?: TriggeredPath[];
  /** 疊宮／相撞信號 */
  stackSignals?: StackSignal[];
  /** 時間視窗分數 */
  timeWindowScores?: TimeWindowScore[];
  /** 事件機率 */
  eventProbabilities?: EventProbability[];
  /** 財富相關路徑（triggeredPaths 子集） */
  wealthLines?: TriggeredPath[];
  /** 風險相關路徑（triggeredPaths 子集） */
  riskLines?: TriggeredPath[];
  /** 路徑敘事摘要 */
  pathNarratives?: PathNarrative[];
}
