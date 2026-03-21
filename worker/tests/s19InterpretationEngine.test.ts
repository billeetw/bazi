import { describe, expect, it } from "vitest";
import type { GongGanFlow } from "../src/gonggan-flows.js";
import {
  detectS19ChainTypes,
  getMonthlyFlowsForTriggerPalace,
  getS18PalaceBias,
  pickInterpretationRule,
  runS19InterpretationEngine,
  sanitizeS19Tone,
} from "../src/lifebook/s19/interpretationEngine.js";
import { runSynthesis } from "../src/lifebook/s19/synthesisRules.js";
import { INTERPRETATION_RULES_SEED } from "../src/lifebook/s19/interpretationRulesSeed.js";
import type { S18Signals } from "../src/lifebook/s18/eventSignals.js";

function monthFlow(p: Partial<GongGanFlow>): GongGanFlow {
  return {
    layer: "month",
    fromPalace: "命宮",
    triggerStem: "甲",
    star: "太陽",
    transform: "祿",
    toPalace: "財帛宮",
    sourceOfTruth: "gonggan-fly",
    ...p,
  };
}

describe("sanitizeS19Tone", () => {
  it("replaces absolute wording", () => {
    expect(sanitizeS19Tone("你一定會成功")).toContain("較容易");
    expect(sanitizeS19Tone("必然發生")).toContain("很可能");
    expect(sanitizeS19Tone("注定如此")).toContain("傾向");
  });
});

describe("pickInterpretationRule", () => {
  it("prefers exact star+palace over wildcard", () => {
    const ctx = { s18Bias: "neutral" as const, chainTypes: [] as const };
    const r = pickInterpretationRule(INTERPRETATION_RULES_SEED, "武曲", "忌", "財帛宮", ctx);
    expect(r?.id).toBe("wq-ji-caibo");
  });

  it("falls back to transform wildcard rule", () => {
    const ctx = { s18Bias: "neutral" as const, chainTypes: [] as const };
    const r = pickInterpretationRule(INTERPRETATION_RULES_SEED, "破軍", "祿", "田宅宮", ctx);
    expect(r?.id).toBe("wild-lu-any");
  });
});

describe("detectS19ChainTypes", () => {
  it("detects ji_chase_ji when two 忌", () => {
    const flows = [
      monthFlow({ transform: "忌", star: "A", toPalace: "夫妻宮" }),
      monthFlow({ transform: "忌", star: "B", toPalace: "官祿宮" }),
    ];
    expect(detectS19ChainTypes(flows)).toContain("ji_chase_ji");
  });

  it("detects lu_pressed_by_ji on same toPalace", () => {
    const flows = [
      monthFlow({ transform: "祿", toPalace: "財帛宮" }),
      monthFlow({ transform: "忌", toPalace: "財帛宮" }),
    ];
    expect(detectS19ChainTypes(flows)).toContain("lu_pressed_by_ji");
  });

  it("detects ke_turns_ji on same toPalace", () => {
    const flows = [
      monthFlow({ transform: "科", toPalace: "子女宮" }),
      monthFlow({ transform: "忌", toPalace: "子女宮" }),
    ];
    expect(detectS19ChainTypes(flows)).toContain("ke_turns_ji");
  });

  it("detects lu_chase_ji when resource>=1 and month 忌 present with s18", () => {
    const flows = [
      monthFlow({ transform: "祿", toPalace: "財帛宮" }),
      monthFlow({ transform: "忌", toPalace: "夫妻宮" }),
    ];
    const s18: S18Signals = {
      palaces: [
        {
          palace: "命宮",
          flows: [],
          resource: 1.2,
          power: 0,
          structure: 0,
          risk: 0,
          score: 0,
          fortuneLevel: "平",
          statusIcon: "🍵",
          energyLevel: "低",
          pattern: { id: "none", icon: "", label: "", description: "", summary: "" },
        },
      ],
      keyPalaces: { strongestOpportunity: [], strongestPressure: [] },
      mainTheme: { palace: "命宮", text: "" },
      challenge: { palace: "命宮", text: "" },
    };
    const out = detectS19ChainTypes(flows, { triggerPalace: "命宮", s18 });
    expect(out).toContain("lu_chase_ji");
  });

  it("detects quan_push when power>=1, month 權, risk low with s18", () => {
    const flows = [monthFlow({ transform: "權", toPalace: "官祿宮" })];
    const s18: S18Signals = {
      palaces: [
        {
          palace: "命宮",
          flows: [],
          resource: 0,
          power: 1.5,
          structure: 0,
          risk: 0,
          score: 0,
          fortuneLevel: "平",
          statusIcon: "🍵",
          energyLevel: "低",
          pattern: { id: "none", icon: "", label: "", description: "", summary: "" },
        },
      ],
      keyPalaces: { strongestOpportunity: [], strongestPressure: [] },
      mainTheme: { palace: "命宮", text: "" },
      challenge: { palace: "命宮", text: "" },
    };
    const out = detectS19ChainTypes(flows, { triggerPalace: "命宮", s18 });
    expect(out).toContain("quan_push");
  });

  it("detects lu_open when resource>=1, month 祿, risk low with s18", () => {
    const flows = [monthFlow({ transform: "祿", toPalace: "財帛宮" })];
    const s18: S18Signals = {
      palaces: [
        {
          palace: "命宮",
          flows: [],
          resource: 1.2,
          power: 0,
          structure: 0,
          risk: 0,
          score: 0,
          fortuneLevel: "平",
          statusIcon: "🍵",
          energyLevel: "低",
          pattern: { id: "none", icon: "", label: "", description: "", summary: "" },
        },
      ],
      keyPalaces: { strongestOpportunity: [], strongestPressure: [] },
      mainTheme: { palace: "命宮", text: "" },
      challenge: { palace: "命宮", text: "" },
    };
    const out = detectS19ChainTypes(flows, { triggerPalace: "命宮", s18 });
    expect(out).toContain("lu_open");
  });
});

describe("getMonthlyFlowsForTriggerPalace", () => {
  it("filters by fromPalace", () => {
    const flows = [
      monthFlow({ fromPalace: "命宮", toPalace: "財帛宮" }),
      monthFlow({ fromPalace: "夫妻宮", toPalace: "官祿宮" }),
    ];
    const sub = getMonthlyFlowsForTriggerPalace(flows, "命宮");
    expect(sub).toHaveLength(1);
    expect(sub[0].toPalace).toBe("財帛宮");
  });
});

describe("getS18PalaceBias", () => {
  const s18: S18Signals = {
    palaces: [],
    keyPalaces: { strongestOpportunity: ["財帛宮"], strongestPressure: ["官祿宮"] },
    mainTheme: { palace: "命宮", text: "" },
    challenge: { palace: "命宮", text: "" },
  };
  it("returns opportunity", () => {
    expect(getS18PalaceBias(s18, "財帛宮")).toBe("opportunity");
  });
  it("returns pressure", () => {
    expect(getS18PalaceBias(s18, "官祿宮")).toBe("pressure");
  });
});

describe("runS19InterpretationEngine", () => {
  it("returns interpretations for monthly flows", () => {
    const monthly: GongGanFlow[] = [
      {
        layer: "month",
        fromPalace: "命宮",
        triggerStem: "丙",
        star: "文昌",
        transform: "忌",
        toPalace: "夫妻宮",
        sourceOfTruth: "gonggan-fly",
      },
    ];
    const s18: S18Signals = {
      palaces: [],
      keyPalaces: { strongestOpportunity: [], strongestPressure: ["夫妻宮"] },
      mainTheme: { palace: "命宮", text: "" },
      challenge: { palace: "命宮", text: "" },
    };
    const out = runS19InterpretationEngine({
      triggerPalace: "命宮",
      monthlyFlowsOverride: monthly,
      s18Signals: s18,
    });
    expect(out.monthFlowsUsed).toHaveLength(1);
    expect(out.interpretations).toHaveLength(1);
    const first = out.interpretations[0];
    expect(first.matchedRuleId).toBe("wenchang-ji-spouse");
    expect(first.matchedRuleLayer).toBe("override");
    expect(first.usedFallback).toBe(false);
    expect(first.narrative.length).toBeGreaterThan(10);
    expect(first.branches.length).toBeGreaterThan(0);
    expect(first.concretePossibilities.length).toBeGreaterThan(0);
    expect(/一定|必然|注定/.test(first.narrative + first.actionHint)).toBe(false);
    expect(first.block).toBeDefined();
    expect(first.block?.title).toBe("關係溝通卡點");
    expect(first.block?.scenarios.length).toBeGreaterThan(0);
    expect(first.block?.actionHint).toContain("釐清");
    expect(Array.isArray(out.chainTypes)).toBe(true);
    expect(typeof out.primaryChain === "string" || out.primaryChain === undefined).toBe(true);
  });

  it("uses fallback when no rule matches", () => {
    const monthly: GongGanFlow[] = [
      {
        layer: "month",
        fromPalace: "命宮",
        triggerStem: "戊",
        star: "某某未知星",
        transform: "權",
        toPalace: "命宮",
        sourceOfTruth: "gonggan-fly",
      },
    ];
    const out = runS19InterpretationEngine({
      triggerPalace: "命宮",
      monthlyFlowsOverride: monthly,
    });
    expect(out.interpretations[0].usedFallback).toBe(true);
    expect(out.interpretations[0].matchedRuleLayer).toBe("fallback");
    expect(out.interpretations[0].matchedRuleId).toBeNull();
    expect(out.interpretations[0].narrative).toContain("流月");
  });
});

describe("runSynthesis", () => {
  it("returns undefined when fewer than 2 palaces (no cross-palace)", () => {
    expect(runSynthesis(["夫妻宮"])).toBeUndefined();
    expect(runSynthesis([])).toBeUndefined();
  });

  it("returns one synthesis when 夫妻宮 and 兄弟宮 triggered", () => {
    const r = runSynthesis(["夫妻宮", "兄弟宮"]);
    expect(r).toBeDefined();
    expect(r!.rule.id).toBe("relationship_affected_by_social");
    expect(r!.result.title).toBe("關係受外部影響");
    expect(r!.result.scenarios.length).toBeGreaterThan(0);
    expect(r!.result.actionHint).toContain("外部");
  });

  it("returns highest priority when multiple rules match", () => {
    const r = runSynthesis(["夫妻宮", "兄弟宮", "官祿宮", "財帛宮"]);
    expect(r).toBeDefined();
    expect(r!.rule.priority).toBe(10);
    expect(r!.rule.id).toBe("relationship_affected_by_social");
  });

  it("returns 福德宮 × 任一 when 福德宮 + another palace triggered", () => {
    const r = runSynthesis(["福德宮", "命宮"]);
    expect(r).toBeDefined();
    expect(r!.rule.id).toBe("mental_affects_all");
    expect(r!.result.title).toBe("內在狀態影響整體");
  });
});
