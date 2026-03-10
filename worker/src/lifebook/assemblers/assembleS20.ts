/**
 * s20 三盤疊加診斷：只讀 findings + selectors，產出四段診斷 placeholder。
 * 不做命理判斷。
 */

import type { LifebookFindings } from "../lifebookFindings.js";
import type { NormalizedChart } from "../normalizedChart.js";
import {
  selectS20BenmingLine,
  selectS20DecadalLine,
  selectS20YearLine,
  selectS20TopCrossChart,
} from "../findings/findingsSelectors.js";
import { safeLine } from "./assembleHelpers.js";

export function assembleS20(args: {
  chart: NormalizedChart;
  findings: LifebookFindings;
}): Record<string, string> {
  const { chart, findings } = args;

  const benming = selectS20BenmingLine(findings);
  const decadal = selectS20DecadalLine(findings, chart);
  const yearLine = selectS20YearLine(findings, chart);
  const cross = selectS20TopCrossChart(findings);

  const decadePalace = chart.currentDecade?.palace ?? "命宮";
  const yearPalace = chart.yearlyHoroscope?.destinyPalace ?? "流年命宮";

  return {
    s20BenmingLine: safeLine(
      benming.line,
      "本命給你的，是一種會在熟悉主題上反覆出現的處理慣性。"
    ),
    s20DecadalLine: safeLine(
      decadal.line,
      `這十年真正被放大的，是${decadePalace}這條主線。`
    ),
    s20YearLine: safeLine(
      yearLine.line,
      `今年最有感的，會是${yearPalace}這類議題。`
    ),
    s20CrossChartLine: safeLine(
      cross?.synthesis,
      "現在的事件不是突然，而是命盤主線在此刻的交會點。"
    ),
  };
}
