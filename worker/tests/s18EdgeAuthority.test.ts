/**
 * ADR-0001：S18 訊號與 S17 同源 overlay；不讀 overlap 推邊。
 */
import { describe, expect, it } from "vitest";
import { normalizeChart } from "../src/lifebook/normalize/index.js";
import { buildTimeModuleS17S19ReaderSnapshot } from "../src/lifebook/timeModuleS17S19ReaderSnapshot.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

describe("S18 edge authority (flows vs overlap poisoning)", () => {
  it("snapshot.s18EdgeAuthority 反映是否傳入 NormalizedChart", () => {
    const nc = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const withNc = buildTimeModuleS17S19ReaderSnapshot({
      chartJson: LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      normalizedChart: nc,
    });
    const legacy = buildTimeModuleS17S19ReaderSnapshot({
      chartJson: LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      normalizedChart: undefined,
    });
    expect(withNc.s18EdgeAuthority).toBe("normalizedChart_flows");
    expect(legacy.s18EdgeAuthority).toBe("chartJson_overlay_only");
    expect(withNc.s18EdgeAuthority).toBe(withNc.s17EdgeAuthority);
  });

  it("故意污染 overlap.items 時，s18SignalsBlocks 與乾淨盤相同（同一 NormalizedChart）", () => {
    const nc = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const poisonedChart = {
      ...LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      overlapAnalysis: {
        items: [
          {
            tag: "poison-s18",
            palaceName: "官祿宮",
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

    expect(poisonSnap.s18SignalsBlocks).toBe(cleanSnap.s18SignalsBlocks);
    expect(poisonSnap.s18EdgeAuthority).toBe("normalizedChart_flows");
  });
});
