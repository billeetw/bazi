/**
 * Timeline 單一決策任務：最小端到端鏈
 * 資料乾淨（findings）→ 理由含時間模組「此刻」句 → CTA URL 可解析 → 與 buildHomeSummaryFromDocument 一致。
 */
import { describe, expect, it } from "vitest";
import { buildTimelineDecisionTask, pickMomentSentenceFromTimeModules } from "../src/lifebook-viewer/decision/timelineDecisionTask";
import { buildHomeSummaryFromDocument } from "../src/lifebook-viewer/components/home/buildHomeSummaryFromDocument";
import { buildHomePalaceReadUrl } from "../src/lifebook-viewer/routing/buildQuantumUrls";
import type { LifeBookUserSection, LifeBookViewerState } from "../src/lifebook-viewer/types";

function sec(
  key: string,
  structure: string,
  strategic = "",
  behavior = "",
  blind = ""
): LifeBookUserSection {
  return {
    section_key: key,
    title: `章 ${key}`,
    importance_level: "high",
    structure_analysis: structure,
    behavior_pattern: behavior,
    blind_spots: blind,
    strategic_advice: strategic,
  };
}

describe("Timeline decision chain (e2e)", () => {
  it("完整鏈：findings + S17–S19 → 理由含此刻句、CTA 與 summary 一致、毒化 overlap 無效", () => {
    const findings = {
      natalFlowItems: [{ fromPalace: "命宮", toPalace: "官祿宮", transform: "忌" as const, starName: "天機" }],
    };
    const baseChart = {
      yearlyHoroscope: { year: 2026 },
      findings,
    };

    const sections: LifeBookViewerState["sections"] = {
      s02: sec("s02", "命宮綜合敘述。"),
      s17: sec("s17", "疊宮結構參考。"),
      s18: sec("s18", "流年訊號：今年職場壓力與機會並存。"),
      s19: sec(
        "s19",
        "這段時間先把官祿宮的交付節奏壓縮，再談擴張。",
        "其餘細節見上方時間模組。"
      ),
    };

    const clean: LifeBookViewerState = {
      meta: { schema_version: "e2e" },
      chart_json: baseChart,
      weight_analysis: null,
      sections,
    };

    const poisoned: LifeBookViewerState = {
      ...clean,
      chart_json: {
        ...baseChart,
        overlapAnalysis: {
          items: [
            {
              tag: "poison-e2e",
              palaceName: "財帛宮",
              transformations: [{ layer: "本命", star: "假", transform: "祿", fromPalace: "X", toPalace: "Y" }],
            },
          ],
        },
      },
    };

    const task = buildTimelineDecisionTask(clean, { timelineNodeId: "y2026" });
    const summary = buildHomeSummaryFromDocument(clean);

    expect(task.palaceId).toBe("guanlu");
    expect(buildTimelineDecisionTask(poisoned, { timelineNodeId: "y2026" })).toEqual(task);

    expect(task.rationale).toContain("官祿");
    expect(task.rationale).toContain("這段時間");
    expect(task.rationale).toContain("交付");

    const expectedHref = buildHomePalaceReadUrl("guanlu");
    expect(task.viewerHref).toBe(expectedHref);
    expect(summary.decisionTask).toEqual(task);

    const moment = pickMomentSentenceFromTimeModules(clean, "guanlu");
    expect(moment).toBeTruthy();
    expect(task.rationale).toContain(moment!);
  });

  it("財帛線：S19 含現金流語感時，與 caibo 任務對齊", () => {
    const state: LifeBookViewerState = {
      meta: { schema_version: "e2e" },
      chart_json: {
        yearlyHoroscope: { year: 2027 },
        findings: {
          natalFlowItems: [{ fromPalace: "財帛宮", toPalace: "福德宮", transform: "祿" as const, starName: "武曲" }],
        },
      },
      weight_analysis: null,
      sections: {
        s02: sec("s02", "命宮。"),
        s19: sec("s19", "近日財帛宮現金流反覆，宜先對帳再談投資。"),
      },
    };
    const t = buildTimelineDecisionTask(state, { timelineNodeId: "y2027" });
    expect(t.palaceId).toBe("caibo");
    expect(t.rationale).toMatch(/近期|近日|財帛|現金流|資源|金錢|理財|帳/);
    expect(t.viewerHref).toContain("#palace-caibo");
  });
});
