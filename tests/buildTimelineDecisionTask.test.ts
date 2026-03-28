import { describe, expect, it } from "vitest";
import {
  buildTimelineDecisionTask,
  buildTimelineDecisionTelemetryPayload,
  TIMELINE_DECISION_TASK_SCHEMA_VERSION,
} from "../src/lifebook-viewer/decision/timelineDecisionTask";
import type { LifeBookViewerState } from "../src/lifebook-viewer/types";

function minimalState(overrides: Partial<LifeBookViewerState> = {}): LifeBookViewerState {
  return {
    meta: { schema_version: "test" },
    chart_json: { yearlyHoroscope: { year: 2026 } },
    weight_analysis: null,
    sections: {},
    ...overrides,
  };
}

describe("buildTimelineDecisionTask (flows / findings contract)", () => {
  it("毒化 overlap 不改任務輸出（僅讀 findings.natalFlowItems，不讀 overlap 邊）", () => {
    const findings = {
      natalFlowItems: [{ fromPalace: "命宮", toPalace: "官祿宮", transform: "忌" as const, starName: "天機" }],
    };
    const clean = minimalState({
      chart_json: {
        yearlyHoroscope: { year: 2026 },
        findings,
      },
    });
    const poisoned = minimalState({
      chart_json: {
        yearlyHoroscope: { year: 2026 },
        findings,
        overlapAnalysis: {
          items: [
            {
              tag: "poison",
              palaceName: "財帛宮",
              transformations: [
                { layer: "本命", star: "假", transform: "祿", fromPalace: "命宮", toPalace: "虛構" },
              ],
            },
          ],
        },
      },
    });

    const a = buildTimelineDecisionTask(clean, { timelineNodeId: "y2026" });
    const b = buildTimelineDecisionTask(poisoned, { timelineNodeId: "y2026" });
    expect(a.palaceId).toBe(b.palaceId);
    expect(a.title).toBe(b.title);
    expect(a.urgency).toBe(b.urgency);
    expect(a.palaceId).toBe("guanlu");
    expect(a.urgency).toBe("now");
  });

  it("缺 findings 時仍回傳單一任務（fallback，不讀 overlap）", () => {
    const s = minimalState({
      chart_json: {
        yearlyHoroscope: { year: 2025 },
        overlapAnalysis: {
          items: [{ tag: "noise", palaceName: "命宮", transformations: [{ layer: "流年", star: "假", transform: "祿", fromPalace: "A", toPalace: "B" }] }],
        },
      },
    });
    const t = buildTimelineDecisionTask(s, { timelineNodeId: "y2025" });
    expect(["caibo", "guanlu"]).toContain(t.palaceId);
    expect(t.title.length).toBeGreaterThan(4);
    expect(t.viewerHref).not.toContain("view=viewer");
    expect(t.viewerHref).toMatch(/#palace-(caibo|guanlu)$/);
  });

  it("viewerHref 為同頁 #palace-*（不切完整閱讀）；timelineHref 仍帶 focus", () => {
    const t = buildTimelineDecisionTask(minimalState(), { timelineNodeId: "y2026" });
    expect(t.viewerHref).toMatch(/^[^\s?]*#palace-(caibo|guanlu)$/);
    expect(t.timelineHref).toContain("view=timeline");
    expect(t.timelineHref).toContain("focus=y2026");
  });

  it("buildTimelineDecisionTelemetryPayload 與 DecisionTask 對齊（v1.2 telemetry）", () => {
    const t = buildTimelineDecisionTask(minimalState(), { timelineNodeId: "y2026" });
    const p = buildTimelineDecisionTelemetryPayload(t);
    expect(p.task_schema_version).toBe(TIMELINE_DECISION_TASK_SCHEMA_VERSION);
    expect(p.app_surface).toBe("timeline");
    expect(p.task_id).toBe(t.id);
    expect(p.palace_id).toBe(t.palaceId);
    expect(p.section_key).toBe(t.sectionKey);
    expect(p.urgency).toBe(t.urgency);
    expect(p.timeline_node_id).toBe("y2026");
    expect(p.year).toBe(2026);
    expect(p.destination).toBe("palace_overlay");
  });
});
