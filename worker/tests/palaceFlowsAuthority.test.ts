/**
 * 財帛（s05）／官祿（s09）等宮位章節：findings.natalFlowItems 來自 NormalizedChart.natal.flows，
 * 不依 overlap.items 推四化邊（ADR-0001）。
 */
import { describe, expect, it } from "vitest";
import starCombinationsTable from "../content/ccl3/star-combinations.json" assert { type: "json" };
import { buildLifebookFindingsFromChartAndContent } from "../src/lifebook/findings/buildLifebookFindings.js";
import type { LifebookContentLookup } from "../src/lifebook/findings/buildLifebookFindings.js";
import type { StarCombinationsTable } from "../src/lifebook/engines/starCombination/starCombinationEngine.js";
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

describe("Palace chapters (s05/s09) natal flows vs overlap poisoning", () => {
  it("natalFlowItems 在 overlap 毒化時與乾淨盤一致（normalize 不採 overlap 邊）", () => {
    const poisonedChart = {
      ...LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      overlapAnalysis: {
        items: [
          {
            tag: "poison-palace",
            palaceName: "財帛宮",
            transformations: [
              { layer: "本命", star: "假星", transform: "祿", fromPalace: "命宮", toPalace: "火星" },
            ],
          },
        ],
      },
    } as Record<string, unknown>;

    const clean = buildLifebookFindingsFromChartAndContent({
      chartJson: LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      content: MINIMAL_P2_CONTENT,
    });
    const poisoned = buildLifebookFindingsFromChartAndContent({
      chartJson: poisonedChart,
      content: MINIMAL_P2_CONTENT,
    });

    expect(clean).not.toBeNull();
    expect(poisoned).not.toBeNull();
    expect(JSON.stringify(clean!.findings.natalFlowItems)).toBe(JSON.stringify(poisoned!.findings.natalFlowItems));
  });
});
