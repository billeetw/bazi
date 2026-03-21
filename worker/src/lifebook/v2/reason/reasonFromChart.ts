/**
 * Lifebook V2：統一 reasoning 入口（V2 truth layer）。
 * 輸入 NormalizedChart，依序執行 buildTransformEdges → matchPaths → detectStacks → scoreTimeWindows → inferEvents，
 * 產出 transformEdges、triggeredPaths、stackSignals、timeWindowScores、eventProbabilities。
 */

import type { NormalizedChart } from "../../normalizedChart.js";
import { buildTransformEdges } from "./buildTransformEdges.js";
import { matchPaths } from "./matchPaths.js";
import { detectStacks } from "./detectStacks.js";
import { scoreTimeWindows } from "./scoreTimeWindows.js";
import { inferEvents } from "./inferEvents.js";
import type { TransformEdgeV2 } from "../schema/transformEdge.js";
import type { TriggeredPath } from "../schema/triggeredPath.js";
import type { StackSignal } from "../schema/stackSignal.js";
import type { TimeWindowScore } from "../schema/timeWindowScore.js";
import type { EventProbability } from "../schema/eventProbability.js";

/** 統一 reasoning 輸出。 */
export interface ReasonFromChartV2Result {
  transformEdges: TransformEdgeV2[];
  triggeredPaths: TriggeredPath[];
  stackSignals: StackSignal[];
  timeWindowScores: TimeWindowScore[];
  eventProbabilities: EventProbability[];
}

/** 相容別名（與 ReasonFromChartV2Result 相同） */
export type ReasonFromChartResult = ReasonFromChartV2Result;

/**
 * 統一 reasoning 入口：僅接受 NormalizedChart，依序執行四步並回傳結果。
 * 呼叫端若有 chartJson，請先 normalizeChart(chartJson) 再傳入。
 */
export function reasonFromChart(chart: NormalizedChart): ReasonFromChartV2Result {
  const transformEdges = buildTransformEdges(chart);
  const triggeredPaths = matchPaths(transformEdges);
  const stackSignals = detectStacks(transformEdges, triggeredPaths);
  const timeWindowScores = scoreTimeWindows(transformEdges);
  const eventProbabilities = inferEvents(transformEdges, triggeredPaths, stackSignals, timeWindowScores);

  return {
    transformEdges,
    triggeredPaths,
    stackSignals,
    timeWindowScores,
    eventProbabilities,
  };
}
