/**
 * Findings Orchestrator v1：時間層組裝。
 * 產出 crossChartFindings, yearSignals, keyYears。
 */

import type {
  CrossChartFinding,
  YearSignal,
  KeyYearFinding,
} from "../lifebookFindings.js";
import type { NormalizedChart } from "../normalizedChart.js";
import { dedupeCrossChartFindings } from "./findingsDedupe.js";
import { rankYearSignals } from "./findingsRanker.js";
import { runSignalsFromOverlap } from "../engines/signals/signalsEngine.js";
import type { OverlapInput } from "../engines/signals/signalsEngine.js";
import { runKeyYearFromMinorFortune } from "../engines/signals/keyYearEngine.js";

export interface BuildTimeFindingsInput {
  chart: NormalizedChart;
  crossChartFindings: CrossChartFinding[];
  yearSignalsFromCrossChart: YearSignal[];
  overlap?: OverlapInput;
  minorFortuneByPalace?: Array<{ palace: string; year?: number | null; nominalAge?: number | null; note?: string | null }>;
  birthYear?: number;
}

export interface BuildTimeFindingsResult {
  crossChartFindings: CrossChartFinding[];
  yearSignals: YearSignal[];
  keyYears: KeyYearFinding[];
}

export function buildTimeFindings(input: BuildTimeFindingsInput): BuildTimeFindingsResult {
  const crossChartFindings = dedupeCrossChartFindings(input.crossChartFindings);

  const year = input.chart.flowYear ?? input.chart.yearlyHoroscope?.year ?? new Date().getFullYear();
  const overlapSignals = runSignalsFromOverlap(input.overlap, year);
  const merged = [...overlapSignals, ...input.yearSignalsFromCrossChart];
  const yearSignals = rankYearSignals(merged);

  const keyYears = runKeyYearFromMinorFortune(
    input.minorFortuneByPalace,
    input.birthYear
  );

  return {
    crossChartFindings,
    yearSignals,
    keyYears,
  };
}
