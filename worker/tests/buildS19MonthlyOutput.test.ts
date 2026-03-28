import { describe, expect, it } from "vitest";
import type { GongGanFlow } from "../src/gonggan-flows.js";
import { buildS19MonthlyOutput } from "../src/lifebook/s19/buildS19MonthlyOutput.js";
import type { S18Signals } from "../src/lifebook/s18/eventSignals.js";

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

describe("buildS19MonthlyOutput", () => {
  it("returns empty-state when no month flows", () => {
    const out = buildS19MonthlyOutput({ monthlyFlowsOverride: [] });
    expect(out.primary.palace).toBe("—");
    expect(out.meta?.confidence).toBe("low");
  });

  it("monthDisplay uses flowMonthSolarDate + 西曆 when monthly lacks solar (no 斗數月序/舊版)", () => {
    const chartJson = {
      flowMonthSolarDate: "2025-03-15",
      features: {
        ziwei: {
          monthlyHoroscope: {
            year: 2025,
            month: 10,
            branch: "亥",
          },
        },
      },
    } as Record<string, unknown>;
    const out = buildS19MonthlyOutput({
      chartJson,
      monthlyFlowsOverride: [monthFlow()],
    });
    expect(out.monthDisplay).toContain("2025年3月（西曆）");
    expect(out.monthDisplay).not.toMatch(/斗數月序/);
    expect(out.monthDisplay).not.toContain("舊版");
  });

  it("caps scenarios at 3 and single-line actionHint", () => {
    const monthly: GongGanFlow[] = [
      monthFlow({
        star: "文昌",
        transform: "忌",
        toPalace: "夫妻宮",
      }),
      monthFlow({ star: "廉貞", transform: "忌", toPalace: "兄弟宮" }),
      monthFlow({ star: "天同", transform: "祿", toPalace: "財帛宮" }),
      monthFlow({ star: "天機", transform: "權", toPalace: "子女宮" }),
    ];
    const s18: S18Signals = {
      palaces: [
        {
          palace: "夫妻宮",
          flows: [],
          resource: 0,
          power: 0,
          structure: 1.2,
          risk: 0,
          score: 1.8,
          fortuneLevel: "小吉",
          statusIcon: "🍵",
          energyLevel: "低",
          pattern: { id: "none", icon: "", label: "", description: "", summary: "" },
        },
        {
          palace: "兄弟宮",
          flows: [],
          resource: 1.8,
          power: 0,
          structure: 0,
          risk: 1.2,
          score: 0.6,
          fortuneLevel: "平",
          statusIcon: "⚖️",
          energyLevel: "中",
          pattern: { id: "lu_ji_mix", icon: "", label: "", description: "", summary: "" },
        },
      ],
      keyPalaces: {
        strongestPressure: ["兄弟宮", "官祿宮"],
        strongestOpportunity: ["財帛宮"],
      },
      mainTheme: { palace: "命宮", text: "" },
      challenge: { palace: "命宮", text: "" },
    };
    const out = buildS19MonthlyOutput({ monthlyFlowsOverride: monthly, s18Signals: s18 });
    expect(out.primary.scenarios.length).toBeLessThanOrEqual(3);
    expect(out.summary.length).toBeGreaterThan(5);
    expect(out.primary.triggerTitle).toMatch(/化忌引動兄弟宮/);
    expect(out.primary.actionHint).toMatch(/。$/);
    expect(out.synthesis?.title).toBe("關係受外部影響");
    expect(out.meta?.triggerSource).toBe("month");
    expect(out.meta?.confidence).toMatch(/^(low|medium|high)$/);
  });
});
