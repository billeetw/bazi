/**
 * ADR-0001：S17 疊宮區塊只來自 buildPalaceOverlay(FromNormalizedChart)，不讀 overlap 推邊。
 */
import { describe, expect, it } from "vitest";
import { normalizeChart } from "../src/lifebook/normalize/index.js";
import { buildTimeModuleS17S19ReaderSnapshot } from "../src/lifebook/timeModuleS17S19ReaderSnapshot.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

describe("S17 edge authority (flows vs overlap poisoning)", () => {
  it("snapshot.s17EdgeAuthority 反映是否傳入 NormalizedChart", () => {
    const nc = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const withNc = buildTimeModuleS17S19ReaderSnapshot({
      chartJson: LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      normalizedChart: nc,
    });
    const legacy = buildTimeModuleS17S19ReaderSnapshot({
      chartJson: LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      normalizedChart: undefined,
    });
    expect(withNc.s17EdgeAuthority).toBe("normalizedChart_flows");
    expect(legacy.s17EdgeAuthority).toBe("chartJson_overlay_only");
  });

  it("故意污染 overlap.items 時，palaceOverlayBlocks 與乾淨盤相同（同一 NormalizedChart）", () => {
    const nc = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const poisonedChart = {
      ...LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      overlapAnalysis: {
        items: [
          {
            tag: "poison-s17",
            palaceName: "命宮",
            transformations: [
              {
                layer: "流年",
                star: "假星",
                transform: "忌",
                fromPalace: "命宮",
                toPalace: "虛構宮",
              },
            ],
          },
        ],
      },
    } as Record<string, unknown>;

    const cleanSnap = buildTimeModuleS17S19ReaderSnapshot({
      chartJson: LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      normalizedChart: nc,
    });
    const poisonSnap = buildTimeModuleS17S19ReaderSnapshot({
      chartJson: poisonedChart,
      normalizedChart: nc,
    });

    expect(poisonSnap.palaceOverlayBlocks).toBe(cleanSnap.palaceOverlayBlocks);
    expect(poisonSnap.s17EdgeAuthority).toBe("normalizedChart_flows");
  });
});
