import { afterEach, describe, expect, it, vi } from "vitest";
import starCombinationsTable from "../content/ccl3/star-combinations.json" assert { type: "json" };
import {
  buildLifebookFindings,
  buildLifebookFindingsFromChartAndContent,
} from "../src/lifebook/findings/buildLifebookFindings.js";
import type { LifebookContentLookup } from "../src/lifebook/findings/buildLifebookFindings.js";
import type { StarCombinationsTable } from "../src/lifebook/engines/starCombination/starCombinationEngine.js";
import { normalizeChart } from "../src/lifebook/normalize/index.js";
import * as EdgeValidator from "../src/lifebook/validators/validateTransformEdgeConsistency.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

const MINIMAL_P2_CONTENT = {
  ccl3: {
    starCombinationsTable: starCombinationsTable as unknown as StarCombinationsTable,
    crossChartRules: [],
    palaceAxisLinks: [],
    palaceMatrixPatterns: [],
    mainStarHints: [],
  },
} satisfies LifebookContentLookup;

describe("validateTransformEdgeConsistency", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("canonical test chart：各層邊與星曜落點一致", () => {
    const chart = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const issues = EdgeValidator.validateTransformEdgeConsistency(chart);
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("人為改壞 toPalace 時應回報 E_EDGE_STAR_TO_PALACE_MISMATCH", () => {
    const chart = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const flows = chart.yearlyHoroscope?.flows;
    expect(flows?.length).toBeGreaterThan(0);
    const e0 = flows![0];
    e0.toPalace = "遷移宮";
    const issues = EdgeValidator.validateTransformEdgeConsistency(chart);
    expect(issues.some((i) => i.code === EdgeValidator.E_EDGE_STAR_TO_PALACE_MISMATCH)).toBe(true);
  });

  it("TransformEdgeValidationError 攜帶 issues", () => {
    const chart = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    chart.yearlyHoroscope!.flows![0].toPalace = "遷移宮";
    const err = new EdgeValidator.TransformEdgeValidationError(
      EdgeValidator.validateTransformEdgeConsistency(chart)
    );
    expect(err.issues.length).toBeGreaterThan(0);
    expect(err.name).toBe("TransformEdgeValidationError");
  });

  it("LIFEBOOK_STRICT_TRANSFORM_EDGES=1 且 validate 回報 error 時 buildLifebookFindingsFromChartAndContent 拋 TransformEdgeValidationError", () => {
    const prev = process.env.LIFEBOOK_STRICT_TRANSFORM_EDGES;
    process.env.LIFEBOOK_STRICT_TRANSFORM_EDGES = "1";
    const spy = vi.spyOn(EdgeValidator, "validateTransformEdgeConsistency").mockReturnValue([
      {
        code: EdgeValidator.E_EDGE_STAR_TO_PALACE_MISMATCH,
        message: "stub",
        layer: "year",
        severity: "error",
      },
    ]);
    try {
      expect(() =>
        buildLifebookFindingsFromChartAndContent({
          chartJson: LIFEBOOK_CANONICAL_TEST_CHART_JSON,
          content: MINIMAL_P2_CONTENT,
        })
      ).toThrow(EdgeValidator.TransformEdgeValidationError);
    } finally {
      spy.mockRestore();
      if (prev === undefined) delete process.env.LIFEBOOK_STRICT_TRANSFORM_EDGES;
      else process.env.LIFEBOOK_STRICT_TRANSFORM_EDGES = prev;
    }
  });

  it("buildLifebookFindings（無 overlap）對 canonical chart 不拋錯", () => {
    const chart = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    expect(() =>
      buildLifebookFindings({
        normalizedChart: chart,
        starCombinationsTable: MINIMAL_P2_CONTENT.ccl3.starCombinationsTable,
        crossChartRules: [],
        palaceAxisLinks: [],
        palaceMatrixPatterns: [],
        mainStarHints: [],
      })
    ).not.toThrow();
  });

  it("LIFEBOOK_STRICT_TRANSFORM_EDGES=1 且命盤正常時 buildLifebookFindingsFromChartAndContent 成功", () => {
    const prev = process.env.LIFEBOOK_STRICT_TRANSFORM_EDGES;
    process.env.LIFEBOOK_STRICT_TRANSFORM_EDGES = "1";
    try {
      const r = buildLifebookFindingsFromChartAndContent({
        chartJson: LIFEBOOK_CANONICAL_TEST_CHART_JSON,
        content: MINIMAL_P2_CONTENT,
      });
      expect(r).not.toBeNull();
      expect(r!.transformEdgeValidationIssues?.filter((i) => i.severity === "error") ?? []).toEqual([]);
    } finally {
      if (prev === undefined) delete process.env.LIFEBOOK_STRICT_TRANSFORM_EDGES;
      else process.env.LIFEBOOK_STRICT_TRANSFORM_EDGES = prev;
    }
  });
});
