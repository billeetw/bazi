/**
 * S22／S23 格式化輸出快照：防敘事模板被意外改短或改結構
 */
import { describe, it, expect } from "vitest";
import { normalizeChart } from "../src/lifebook/normalize/index.js";
import { getStructureLines, getTransformationFlows } from "../src/lifebook/lifeModel/index.js";
import {
  formatStructureLinesForTechnical,
  formatTransformationFlowsForTechnical,
} from "../src/lifebook/lifeModel/formatTechnicalBlocks.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

describe("S22／S23 narrative snapshots（canonical chart）", () => {
  it("formatStructureLinesForTechnical", () => {
    const chart = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON as Record<string, unknown>);
    const text = formatStructureLinesForTechnical(getStructureLines(chart));
    expect(text).toMatch(/【財福線】/);
    expect(text).toMatch(/「你不是沒錢，是沒有感覺」（參考：/);
    expect(text).toMatch(/人格參考/);
    expect(text).toMatchSnapshot();
  });

  it("formatTransformationFlowsForTechnical", () => {
    const chart = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON as Record<string, unknown>);
    const text = formatTransformationFlowsForTechnical(getTransformationFlows(chart));
    expect(text).toMatch(/【事業 → 收入】/);
    expect(text).toMatch(
      /「你不是不夠拼，是變現的程度，和你付出的努力不成正比」/
    );
    expect(text).toMatch(/這跟你自己的特性有關——你帶一點/);
    expect(text).toMatchSnapshot();
  });
});
