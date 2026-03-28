/**
 * ADR-0001：`buildTransformFlowLines`／`getFlowBlockForPalace` 只讀 NormalizedChart 各層 flows；
 * overlap 毒化不得改變 normalize 產出之邊，故 helpers 輸出不變。
 */
import { describe, expect, it } from "vitest";
import { normalizeChart } from "../src/lifebook/normalize/index.js";
import { buildTransformFlowLines, getFlowBlockForPalace } from "../src/lifebook/transforms/buildTransformFlowLines.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

const POISONED_OVERLAP = {
  overlapAnalysis: {
    items: [
      {
        tag: "poison-flow-helpers",
        palaceName: "財帛宮",
        transformations: [
          { layer: "本命", star: "假星", transform: "祿", fromPalace: "命宮", toPalace: "虛構宮" },
          { layer: "流年", star: "假星", transform: "忌", fromPalace: "官祿宮", toPalace: "火星" },
        ],
      },
    ],
  },
} as const;

describe("buildTransformFlowLines / getFlowBlockForPalace vs overlap poisoning", () => {
  it("毒化 overlap 後 normalize 之 flows 與乾淨盤一致，兩 helpers 輸出相同", () => {
    const poisonedChart = {
      ...LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      ...POISONED_OVERLAP,
    } as Record<string, unknown>;

    const cleanNc = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const poisonedNc = normalizeChart(poisonedChart);

    expect(cleanNc.natal?.flows).toEqual(poisonedNc.natal?.flows);
    expect(cleanNc.currentDecade?.flows).toEqual(poisonedNc.currentDecade?.flows);
    expect(cleanNc.yearlyHoroscope?.flows).toEqual(poisonedNc.yearlyHoroscope?.flows);

    expect(buildTransformFlowLines(cleanNc)).toEqual(buildTransformFlowLines(poisonedNc));

    for (const palace of ["財帛宮", "財帛", "官祿宮", "官祿"] as const) {
      expect(getFlowBlockForPalace(cleanNc, palace)).toBe(getFlowBlockForPalace(poisonedNc, palace));
    }
  });
});
