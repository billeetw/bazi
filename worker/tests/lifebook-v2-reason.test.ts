/**
 * Lifebook V2 reason 最小單元測試：reasonFromChart、matchPaths、detectStacks、scoreTimeWindows、buildS15aPlaceholderMapFromV2、s15a 接線。
 */
import { describe, it, expect } from "vitest";
import { reasonFromChart } from "../src/lifebook/v2/reason/reasonFromChart.js";
import { inferEvents } from "../src/lifebook/v2/reason/inferEvents.js";
import { matchPaths } from "../src/lifebook/v2/reason/matchPaths.js";
import { detectStacks } from "../src/lifebook/v2/reason/detectStacks.js";
import { scoreTimeWindows } from "../src/lifebook/v2/reason/scoreTimeWindows.js";
import { buildS15aPlaceholderMapFromV2 } from "../src/lifebook/v2/assembler/buildS15aMapFromV2.js";
import { buildS16PlaceholderMapFromV2 } from "../src/lifebook/v2/assembler/buildS16MapFromV2.js";
import { getPlaceholderMapFromContext } from "../src/lifeBookPrompts.js";
import type { NormalizedChart } from "../src/lifebook/normalizedChart.js";
import type { TransformEdgeV2 } from "../src/lifebook/v2/schema/transformEdge.js";
import type { LifebookFindingsV2 } from "../src/lifebook/v2/schema/findingsV2.js";

/** 最小空 chart，無任何四化邊 */
function minimalEmptyChart(): NormalizedChart {
  return {
    chartId: "test-empty",
    locale: "zh-TW",
    mingGong: "命宮",
    palaces: [],
    natalTransforms: [],
    decadalLimits: [],
  };
}

function makeEdge(overrides: Partial<TransformEdgeV2> & { fromPalace: string; toPalace: string; transform: TransformEdgeV2["transform"] }): TransformEdgeV2 {
  const { fromPalace, toPalace, transform, ...rest } = overrides;
  return {
    id: rest.id ?? `e_${Math.random().toString(36).slice(2, 9)}`,
    layer: rest.layer ?? "natal",
    sourceType: rest.sourceType ?? "生年四化",
    fromPalace,
    toPalace,
    transform,
    starName: rest.starName ?? "星",
    isSelfTransform: fromPalace === toPalace,
    ...rest,
  };
}

describe("reasonFromChart", () => {
  it("chains buildTransformEdges → matchPaths → detectStacks → scoreTimeWindows and returns all four outputs", () => {
    const chart = minimalEmptyChart();
    const result = reasonFromChart(chart);
    expect(result).toHaveProperty("transformEdges");
    expect(result).toHaveProperty("triggeredPaths");
    expect(result).toHaveProperty("stackSignals");
    expect(result).toHaveProperty("timeWindowScores");
    expect(result).toHaveProperty("eventProbabilities");
    expect(Array.isArray(result.transformEdges)).toBe(true);
    expect(Array.isArray(result.triggeredPaths)).toBe(true);
    expect(Array.isArray(result.stackSignals)).toBe(true);
    expect(Array.isArray(result.timeWindowScores)).toBe(true);
    expect(Array.isArray(result.eventProbabilities)).toBe(true);
  });

  it("does not throw for empty chart and returns empty arrays", () => {
    const chart = minimalEmptyChart();
    expect(() => reasonFromChart(chart)).not.toThrow();
    const result = reasonFromChart(chart);
    expect(result.transformEdges).toEqual([]);
    expect(result.triggeredPaths).toEqual([]);
    expect(result.stackSignals).toEqual([]);
    expect(result.timeWindowScores).toEqual([]);
    expect(result.eventProbabilities).toEqual([]);
  });

  it("produces transformEdges and triggeredPaths when chart has natal edge", () => {
    const chart: NormalizedChart = {
      ...minimalEmptyChart(),
      natalTransforms: [
        { fromPalace: "官祿宮", toPalace: "財帛宮", transform: "祿", layer: "natal", starName: "天同" },
      ],
    };
    const result = reasonFromChart(chart);
    expect(result.transformEdges.length).toBeGreaterThan(0);
    expect(result.transformEdges.some((e) => e.layer === "natal" && e.fromPalace === "官祿宮")).toBe(true);
    expect(result.triggeredPaths.length).toBeGreaterThan(0);
    const careerWealth = result.triggeredPaths.find((p) => p.pathId === "career_wealth_line");
    expect(careerWealth).toBeDefined();
  });

  it("produces timeWindowScores for decade and year when chart has decade and year edges", () => {
    const chart: NormalizedChart = {
      ...minimalEmptyChart(),
      currentDecade: {
        palace: "財帛宮",
        startAge: 33,
        endAge: 42,
        transforms: [{ fromPalace: "命宮", toPalace: "財帛宮", transform: "祿", layer: "decade", starName: "天同" }],
      },
      yearlyHoroscope: {
        year: 2027,
        transforms: [{ fromPalace: "官祿宮", toPalace: "財帛宮", transform: "權", layer: "year", starName: "天機" }],
      },
    };
    const result = reasonFromChart(chart);
    expect(result.transformEdges.some((e) => e.layer === "decade")).toBe(true);
    expect(result.transformEdges.some((e) => e.layer === "year")).toBe(true);
    expect(result.timeWindowScores.length).toBeGreaterThan(0);
    const decadeScore = result.timeWindowScores.find((s) => s.windowType === "decade" && s.decadeRange?.start === 33);
    const yearScore = result.timeWindowScores.find((s) => s.windowType === "year" && s.flowYear === 2027);
    expect(decadeScore).toBeDefined();
    expect(yearScore).toBeDefined();
  });
});

describe("inferEvents", () => {
  it("returns empty eventProbabilities for empty input", () => {
    const result = inferEvents([], [], [], []);
    expect(result).toEqual([]);
  });

  it("produces income_growth when wealthScore is high", () => {
    const scores = [
      {
        windowType: "decade" as const,
        decadeRange: { start: 33, end: 42 },
        wealthScore: 50,
        careerScore: 10,
        assetScore: 5,
        partnershipScore: 5,
        cashflowRiskScore: 5,
        pressureScore: 5,
      },
    ];
    const result = inferEvents([], [], [], scores);
    const income = result.find((e) => e.eventType === "income_growth");
    expect(income).toBeDefined();
    expect(income!.window.type).toBe("decade");
    expect(income!.basedOn.scores).toContain("decade_33-42");
  });

  it("produces cashflow_stress when cashflowRiskScore is high", () => {
    const scores = [
      {
        windowType: "year" as const,
        flowYear: 2028,
        wealthScore: 5,
        careerScore: 5,
        assetScore: 0,
        partnershipScore: 0,
        cashflowRiskScore: 35,
        pressureScore: 10,
      },
    ];
    const result = inferEvents([], [], [], scores);
    const stress = result.find((e) => e.eventType === "cashflow_stress");
    expect(stress).toBeDefined();
    expect(stress!.window.type).toBe("year");
    expect(stress!.window.year).toBe(2028);
  });
});

describe("matchPaths", () => {
  it("returns empty when no edges", () => {
    expect(matchPaths([])).toEqual([]);
  });

  it("matches edge on path segment and returns TriggeredPath", () => {
    const edges: TransformEdgeV2[] = [
      makeEdge({ id: "e1", fromPalace: "官祿宮", toPalace: "財帛宮", transform: "祿", layer: "natal" }),
    ];
    const result = matchPaths(edges);
    expect(result.length).toBeGreaterThan(0);
    const careerWealth = result.find((r) => r.pathId === "career_wealth_line");
    expect(careerWealth).toBeDefined();
    expect(careerWealth!.matchedEdges).toContain("e1");
    expect(careerWealth!.touchedPalaces).toContain("官祿宮");
    expect(careerWealth!.touchedPalaces).toContain("財帛宮");
    expect(careerWealth!.polarity).toBe("positive");
  });

  it("normalizes palace without 宮 suffix", () => {
    const edges: TransformEdgeV2[] = [
      makeEdge({ id: "e2", fromPalace: "官祿", toPalace: "財帛", transform: "權", layer: "year", flowYear: 2027 }),
    ];
    const result = matchPaths(edges);
    const careerWealth = result.find((r) => r.pathId === "career_wealth_line");
    expect(careerWealth).toBeDefined();
    expect(careerWealth!.matchedEdges).toContain("e2");
  });
});

describe("detectStacks", () => {
  it("returns empty when no edges", () => {
    expect(detectStacks([])).toEqual([]);
  });

  it("detects double_stack when two edges land on same palace and have 2 different layers", () => {
    const edges: TransformEdgeV2[] = [
      makeEdge({ id: "a", fromPalace: "命宮", toPalace: "財帛宮", transform: "祿", layer: "natal" }),
      makeEdge({ id: "b", fromPalace: "官祿宮", toPalace: "財帛宮", transform: "科", layer: "decade" }),
    ];
    const result = detectStacks(edges);
    const double = result.find((s) => s.stackType === "double_stack" && s.palace === "財帛宮");
    expect(double).toBeDefined();
    expect(double!.theme).toBe("二疊宮");
    expect(double!.layers.length).toBe(2);
  });

  it("does not detect double_stack when two edges are same layer (no false stack)", () => {
    const edges: TransformEdgeV2[] = [
      makeEdge({ id: "a", fromPalace: "命宮", toPalace: "財帛宮", transform: "祿", layer: "natal" }),
      makeEdge({ id: "b", fromPalace: "官祿宮", toPalace: "財帛宮", transform: "科", layer: "natal" }),
    ];
    const result = detectStacks(edges);
    const double = result.find((s) => s.stackType === "double_stack" && s.palace === "財帛宮");
    expect(double).toBeUndefined();
  });

  it("detects triple_stack only when same palace has 3+ edges and 3 different layers", () => {
    const edges: TransformEdgeV2[] = [
      makeEdge({ id: "a", fromPalace: "命宮", toPalace: "財帛宮", transform: "祿", layer: "natal" }),
      makeEdge({ id: "b", fromPalace: "兄弟宮", toPalace: "財帛宮", transform: "科", layer: "decade" }),
      makeEdge({ id: "c", fromPalace: "官祿宮", toPalace: "財帛宮", transform: "權", layer: "year" }),
    ];
    const result = detectStacks(edges);
    const triple = result.find((s) => s.stackType === "triple_stack" && s.palace === "財帛宮");
    expect(triple).toBeDefined();
    expect(triple!.layers.length).toBe(3);
  });

  it("does not detect triple_stack when 3 edges but only 2 layers", () => {
    const edges: TransformEdgeV2[] = [
      makeEdge({ id: "a", fromPalace: "命宮", toPalace: "財帛宮", transform: "祿", layer: "natal" }),
      makeEdge({ id: "b", fromPalace: "兄弟宮", toPalace: "財帛宮", transform: "科", layer: "natal" }),
      makeEdge({ id: "c", fromPalace: "官祿宮", toPalace: "財帛宮", transform: "權", layer: "decade" }),
    ];
    const result = detectStacks(edges);
    const triple = result.find((s) => s.stackType === "triple_stack" && s.palace === "財帛宮");
    expect(triple).toBeUndefined();
  });

  it("detects lu_ji_collision when 祿 and 忌 land on same palace with 2 different layers", () => {
    const edges: TransformEdgeV2[] = [
      makeEdge({ id: "lu", fromPalace: "命宮", toPalace: "財帛宮", transform: "祿", layer: "natal" }),
      makeEdge({ id: "ji", fromPalace: "兄弟宮", toPalace: "財帛宮", transform: "忌", layer: "year" }),
    ];
    const result = detectStacks(edges);
    const collision = result.find((s) => s.stackType === "lu_ji_collision");
    expect(collision).toBeDefined();
    expect(collision!.palace).toBe("財帛宮");
    expect(collision!.layers.length).toBe(2);
  });

  it("detects self_transform_focus for self-edge", () => {
    const edges: TransformEdgeV2[] = [
      makeEdge({ id: "s", fromPalace: "財帛宮", toPalace: "財帛宮", transform: "忌", isSelfTransform: true }),
    ];
    const result = detectStacks(edges);
    const self = result.find((s) => s.stackType === "self_transform_focus");
    expect(self).toBeDefined();
    expect(self!.palace).toBe("財帛宮");
  });
});

describe("scoreTimeWindows", () => {
  it("returns empty when no edges have decade or year", () => {
    const edges: TransformEdgeV2[] = [
      makeEdge({ fromPalace: "命宮", toPalace: "財帛宮", transform: "祿", layer: "natal" }),
    ];
    expect(scoreTimeWindows(edges)).toEqual([]);
  });

  it("produces one decade window when edges have decadeRange", () => {
    const edges: TransformEdgeV2[] = [
      makeEdge({
        id: "d1",
        fromPalace: "官祿宮",
        toPalace: "財帛宮",
        transform: "祿",
        layer: "decade",
        decadeRange: { start: 33, end: 42 },
      }),
    ];
    const result = scoreTimeWindows(edges);
    expect(result.length).toBe(1);
    expect(result[0].windowType).toBe("decade");
    expect(result[0].decadeRange).toEqual({ start: 33, end: 42 });
    expect(result[0].wealthScore).toBeGreaterThan(0);
  });

  it("produces one year window when edges have flowYear: 忌 on 財帛 → cashflowRiskScore > 0, 忌 → pressureScore > 0", () => {
    const edges: TransformEdgeV2[] = [
      makeEdge({
        id: "y1",
        fromPalace: "命宮",
        toPalace: "財帛宮",
        transform: "忌",
        layer: "year",
        flowYear: 2027,
      }),
    ];
    const result = scoreTimeWindows(edges);
    expect(result.length).toBe(1);
    expect(result[0].windowType).toBe("year");
    expect(result[0].flowYear).toBe(2027);
    expect(result[0].cashflowRiskScore).toBeGreaterThan(0);
    expect(result[0].pressureScore).toBeGreaterThan(0);
  });
});

describe("matchPaths touchedPalaces order", () => {
  it("touchedPalaces follows path.palaces order, not edge scan order", () => {
    const edges: TransformEdgeV2[] = [
      makeEdge({ id: "e1", fromPalace: "財帛宮", toPalace: "官祿宮", transform: "祿", layer: "natal" }),
      makeEdge({ id: "e2", fromPalace: "命宮", toPalace: "財帛宮", transform: "權", layer: "decade" }),
    ];
    const result = matchPaths(edges);
    const mainWealth = result.find((r) => r.pathId === "main_wealth_line");
    expect(mainWealth).toBeDefined();
    expect(mainWealth!.touchedPalaces).toEqual(["命宮", "財帛宮", "官祿宮"]);
  });
});

describe("buildS15aPlaceholderMapFromV2 eventType 中文映射", () => {
  it("eventProbabilitiesSummary uses Chinese labels for known eventType", () => {
    const findingsV2 = {
      mainBattlefields: [],
      pressureOutlets: [],
      spilloverFindings: [],
      crossChartFindings: [],
      yearSignals: [],
      keyYears: [],
      lifeLessons: [],
      actionItems: [],
      starCombinations: [],
      palacePatterns: [],
      eventProbabilities: [
        {
          eventType: "income_growth",
          probability: 70,
          confidence: 80,
          basedOn: { paths: [], stacks: [], scores: [] },
          window: { type: "year", year: 2027 },
        },
        {
          eventType: "cashflow_stress",
          probability: 40,
          confidence: 60,
          basedOn: { paths: [], stacks: [], scores: [] },
          window: { type: "decade", decadeRange: { start: 33, end: 42 } },
        },
      ],
    } as LifebookFindingsV2;
    const result = buildS15aPlaceholderMapFromV2(findingsV2);
    expect(result.usable).toBe(true);
    expect(result.map.eventProbabilitiesSummary).toContain("收入成長");
    expect(result.map.eventProbabilitiesSummary).toContain("現金流壓力");
    expect(result.map.eventProbabilitiesSummary).not.toContain("income_growth");
    expect(result.map.eventProbabilitiesSummary).not.toContain("cashflow_stress");
  });
});

describe("s15a wiring: getPlaceholderMapFromContext V2-primary and fallback", () => {
  it("uses V2 map when findingsV2 has stackSignals (s15a V2-primary)", () => {
    const findingsV2: LifebookFindingsV2 = {
      stackSignals: [
        { stackType: "lu_ji_collision", palace: "財帛宮", theme: "祿忌相撞", layers: ["natal", "decade"], transforms: ["祿", "忌"] },
      ],
    } as LifebookFindingsV2;
    const map = getPlaceholderMapFromContext(null, {
      chartJson: {},
      sectionKey: "s15a",
      findingsV2,
    });
    expect(map.overlapSummary).toBeDefined();
    expect(map.overlapSummary).toContain("劇烈震盪");
    expect(map.keyYearsShockLead).toBeDefined();
  });

  it("falls back to overlap when findingsV2 is undefined (s15a)", () => {
    const chartJson = {
      overlapAnalysis: {
        items: [
          { tag: "shock", palaceName: "命宮" },
          { tag: "wealth", palaceName: "財帛宮" },
        ],
      },
    };
    const map = getPlaceholderMapFromContext(null, {
      chartJson,
      sectionKey: "s15a",
    });
    expect(map.shockCount).toBe("1");
    expect(map.wealthCount).toBe("1");
    expect(map.overlapSummary).toContain("劇烈震盪");
  });

  it("falls back when findingsV2 is empty (no stackSignals/scores/events)", () => {
    const findingsV2 = {} as LifebookFindingsV2;
    const chartJson = {
      overlapAnalysis: { items: [{ tag: "mine", palaceName: "官祿宮" }] },
    };
    const map = getPlaceholderMapFromContext(null, {
      chartJson,
      sectionKey: "s15a",
      findingsV2,
    });
    expect(map.mineCount).toBe("1");
    expect(map.overlapSummary).toContain("超級地雷區");
  });
});

describe("s16 wiring: getPlaceholderMapFromContext V2-primary and fallback", () => {
  it("uses V2 map when findingsV2 has year eventProbabilities (s16 V2-primary)", () => {
    const findingsV2: LifebookFindingsV2 = {
      eventProbabilities: [
        {
          eventType: "income_growth",
          probability: 70,
          confidence: 80,
          basedOn: { paths: [], stacks: [], scores: [] },
          window: { type: "year", year: 2027 },
        },
      ],
    } as LifebookFindingsV2;
    const map = getPlaceholderMapFromContext(null, {
      chartJson: {},
      sectionKey: "s16",
      findingsV2,
    });
    expect(map.yearEventProbabilitiesSummary).toBeDefined();
    expect(map.yearEventProbabilitiesSummary).toContain("2027年");
    expect(map.yearEventProbabilitiesSummary).toContain("收入成長");
  });

  it("uses V2 map when findingsV2 has year timeWindowScores (s16 V2-primary)", () => {
    const findingsV2: LifebookFindingsV2 = {
      timeWindowScores: [
        { windowType: "year", flowYear: 2028, wealthScore: 65, careerScore: 70, assetScore: 50, partnershipScore: 55, cashflowRiskScore: 40, pressureScore: 45 },
      ],
    } as LifebookFindingsV2;
    const map = getPlaceholderMapFromContext(null, {
      chartJson: {},
      sectionKey: "s16",
      findingsV2,
    });
    expect(map.yearTimeWindowScoresSummary).toBeDefined();
    expect(map.yearTimeWindowScoresSummary).toContain("2028");
  });

  it("uses V2 map when findingsV2 has year transformEdges (s16 V2-primary)", () => {
    const findingsV2: LifebookFindingsV2 = {
      transformEdges: [
        {
          id: "e1",
          layer: "year",
          sourceType: "流年四化",
          fromPalace: "命宮",
          toPalace: "財帛宮",
          transform: "祿",
          starName: "天同",
          isSelfTransform: false,
          flowYear: 2029,
        } as import("../src/lifebook/v2/schema/transformEdge.js").TransformEdgeV2,
      ],
    } as LifebookFindingsV2;
    const map = getPlaceholderMapFromContext(null, {
      chartJson: {},
      sectionKey: "s16",
      findingsV2,
    });
    expect(map.yearlyFourTransformBlocks).toBeDefined();
    expect(map.yearlyFourTransformBlocks).toContain("流年四化");
    expect(map.yearlyFourTransformBlocks).toContain("命宮");
    expect(map.yearlyFourTransformSummary).toContain("2029年");
  });

  it("falls back when findingsV2 has no year data (s16)", () => {
    const findingsV2: LifebookFindingsV2 = {
      eventProbabilities: [
        {
          eventType: "income_growth",
          probability: 70,
          confidence: 80,
          basedOn: { paths: [], stacks: [], scores: [] },
          window: { type: "decade", decadeRange: { start: 33, end: 42 } },
        },
      ],
    } as LifebookFindingsV2;
    const chartJson = {
      yearlyHoroscope: { year: 2030, palaceNames: ["財帛宮"] },
      liunian: { mutagenStars: { 祿: "天同", 權: "天機" } },
    };
    const map = getPlaceholderMapFromContext(null, {
      chartJson,
      sectionKey: "s16",
      findingsV2,
    });
    expect(map.flowYear).toBe("2030");
    expect(map.flowYearSihuaLine).toBeDefined();
  });

  it("other sections unchanged when s16 has V2", () => {
    const findingsV2: LifebookFindingsV2 = {
      timeWindowScores: [{ windowType: "year", flowYear: 2031, wealthScore: 60, careerScore: 65, assetScore: 50, partnershipScore: 55, cashflowRiskScore: 40, pressureScore: 50 }],
    } as LifebookFindingsV2;
    const mapS15a = getPlaceholderMapFromContext(null, { chartJson: {}, sectionKey: "s15a", findingsV2 });
    const mapS16 = getPlaceholderMapFromContext(null, { chartJson: {}, sectionKey: "s16", findingsV2 });
    expect(mapS15a.yearTimeWindowScoresSummary).toBeUndefined();
    expect(mapS16.yearTimeWindowScoresSummary).toBeDefined();
  });
});
