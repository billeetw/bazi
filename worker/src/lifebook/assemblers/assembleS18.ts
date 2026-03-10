/**
 * s18 主要盲點：只讀 findings + selector，產出三段文案 placeholder。
 * 不做命理判斷。
 */

import type { LifebookFindings } from "../lifebookFindings.js";
import { selectBlindSpotFindingForS18 } from "../findings/findingsSelectors.js";
import { safeLine } from "./assembleHelpers.js";

export function assembleS18(args: {
  findings: LifebookFindings;
}): Record<string, string> {
  const blindSpot = selectBlindSpotFindingForS18(args.findings);

  return {
    s18BlindSpotLine: safeLine(
      blindSpot.titleLine,
      "這段時間最需要留意的，是不要把表面事件誤認成真正的問題。"
    ),
    s18BodyLine: safeLine(
      blindSpot.blindSpotLine,
      "很多時候你在處理的是症狀，而不是源頭。"
    ),
    s18AdviceLine: safeLine(blindSpot.adviceLine),
  };
}
