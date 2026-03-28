/**
 * ADR-0001：S19 不直讀 overlap 推四化邊；疊宮邊以 NormalizedChart.*.flows 為權威（經 overlay→S18）。
 * 流月仍由 GongGan + monthlyHoroscope（與 flows 層級不同）。
 */
import { describe, expect, it } from "vitest";
import type { GongGanFlow } from "../src/gonggan-flows.js";
import { buildPalaceOverlayFromNormalizedChart } from "../src/lifebook/palaceOverlay.js";
import { normalizeChart } from "../src/lifebook/normalize/index.js";
import { buildS19MonthlyOutput } from "../src/lifebook/s19/buildS19MonthlyOutput.js";
import { buildEventSignals } from "../src/lifebook/s18/eventSignals.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

function monthFlow(p: Partial<GongGanFlow>): GongGanFlow {
  return {
    layer: "month",
    fromPalace: "疾厄宮",
    triggerStem: "甲",
    star: "天同",
    transform: "祿",
    toPalace: "財帛宮",
    sourceOfTruth: "gonggan-fly",
    ...p,
  };
}

describe("S19 edge authority (flows vs overlap poisoning)", () => {
  it("meta.edgeAuthority 反映是否傳入 NormalizedChart", () => {
    const nc = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const overlay = buildPalaceOverlayFromNormalizedChart(nc);
    const s18 = buildEventSignals(overlay, LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const flows = [monthFlow()];
    const withNc = buildS19MonthlyOutput({
      chartJson: LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      normalizedChart: nc,
      s18Signals: s18,
      monthlyFlowsOverride: flows,
    });
    const withoutNc = buildS19MonthlyOutput({
      chartJson: LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      s18Signals: s18,
      monthlyFlowsOverride: flows,
    });
    expect(withNc.meta?.edgeAuthority).toBe("normalizedChart_plus_month_gonggan");
    expect(withoutNc.meta?.edgeAuthority).toBe("chartJson_overlay_plus_month_gonggan");
  });

  it("故意污染 overlap.items 時，S19 主線輸出與乾淨盤相同（不依賴 overlap 推邊）", () => {
    const nc = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const overlay = buildPalaceOverlayFromNormalizedChart(nc);
    const s18 = buildEventSignals(overlay, LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const flows = [
      monthFlow({
        star: "文昌",
        transform: "忌",
        toPalace: "夫妻宮",
      }),
    ];

    const clean = buildS19MonthlyOutput({
      chartJson: LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      normalizedChart: nc,
      s18Signals: s18,
      monthlyFlowsOverride: flows,
    });

    const poisonedChart = {
      ...LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      overlapAnalysis: {
        items: [
          {
            tag: "poison-test",
            palaceName: "命宮",
            transformations: [
              {
                layer: "流年",
                star: "假星",
                transform: "忌",
                fromPalace: "命宮",
                toPalace: "不存在的宮",
              },
            ],
          },
        ],
      },
    } as Record<string, unknown>;

    const poisoned = buildS19MonthlyOutput({
      chartJson: poisonedChart,
      normalizedChart: nc,
      s18Signals: s18,
      monthlyFlowsOverride: flows,
    });

    expect(poisoned.primary.triggerTitle).toBe(clean.primary.triggerTitle);
    expect(poisoned.primary.chainTitle).toBe(clean.primary.chainTitle);
    expect(poisoned.summary).toBe(clean.summary);
  });
});
