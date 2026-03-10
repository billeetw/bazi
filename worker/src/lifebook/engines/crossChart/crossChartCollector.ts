/**
 * CL3 crossChartEngine：按宮位與時間層分桶，產出 PalaceTimelineContext[]。
 */

import type { NormalizedChart } from "../../normalizedChart.js";
import type { PalacePatternFinding, SpilloverFinding, StarCombinationFinding } from "../../lifebookFindings.js";
import type { PalaceTimelineContext } from "./crossChartTypes.js";

export function collectPalaceTimelineContexts(args: {
  chart: NormalizedChart;
  palacePatterns: PalacePatternFinding[];
  spillovers: SpilloverFinding[];
  starCombinations: StarCombinationFinding[];
}): PalaceTimelineContext[] {
  const palaceNames = args.chart.palaces.map((p) => p.palace);

  return palaceNames.map((palace) => ({
    palace,
    natalPatterns: args.palacePatterns.filter((p) => p.palace === palace && p.layer === "natal"),
    decadalPatterns: args.palacePatterns.filter((p) => p.palace === palace && p.layer === "decade"),
    yearlyPatterns: args.palacePatterns.filter((p) => p.palace === palace && p.layer === "year"),
    spilloversIn: args.spillovers.filter((s) => s.toPalace === palace),
    combinations: args.starCombinations.filter((c) => c.palace === palace),
  }));
}
