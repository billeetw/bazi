/**
 * 模組二決策快照：與 overlap tag 同源，placeholder 不重讀 overlap。
 */
import { describe, it, expect } from "vitest";
import { buildTimeModuleDecisionSnapshotFromChart } from "../src/lifebook/timeModuleDecisionSnapshot.js";
import type { DiagnosticBundle } from "../src/lifebook/diagnosticTypes.js";
import { getPlaceholderMapFromContext } from "../src/lifeBookPrompts.js";
import type { DecisionMatrixConfig } from "../src/lifebook/timeDecisionEngine.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

const miniMatrix: DecisionMatrixConfig = {
  palaceEventWeights: {
    命宮: { rest_and_reset: 4, invest: 1 },
    財帛宮: { invest: 4, rest_and_reset: 2 },
  },
  eventLabels: { rest_and_reset: "休養", invest: "投資" },
  palaceThemes: { 命宮: "自我節奏", 財帛宮: "資源配置" },
};

describe("buildTimeModuleDecisionSnapshotFromChart", () => {
  it("產出 keyYearsDecisionTimeline 與 yearDecisionSummaryBlock，tag 只來自 palaceOverlapTags", () => {
    const chartJson = {
      minorFortuneByPalace: [{ palace: "財帛宮", year: 2025, nominalAge: 40, stem: "乙" }],
      yearlyHoroscope: { year: 2025, palaceNames: ["財帛宮"] },
      overlapAnalysis: { items: [{ tag: "mine", palaceName: "財帛宮" }] },
    };
    const snap = buildTimeModuleDecisionSnapshotFromChart({
      chartJson,
      decisionMatrix: miniMatrix,
      palaceOverlapTags: { 財帛: "mine" },
    });
    expect(snap.keyYearsDecisionTimeline).toContain("2025");
    expect(snap.keyYearsDecisionTimeline).toContain("財帛");
    expect(snap.yearDecisionSummaryBlock).toContain("今年適合的行動");
  });

  it("改變 chart overlap 不影響輸出（若 palaceOverlapTags 固定）", () => {
    const chartA = {
      minorFortuneByPalace: [{ palace: "命宮", year: 2026, nominalAge: 41 }],
      yearlyHoroscope: { year: 2026 },
      overlapAnalysis: { items: [{ tag: "wealth", palaceName: "命宮" }] },
    };
    const chartB = {
      ...chartA,
      overlapAnalysis: { items: [{ tag: "mine", palaceName: "命宮" }] },
    };
    const tags = { 命宮: "wealth" as const };
    const s1 = buildTimeModuleDecisionSnapshotFromChart({
      chartJson: chartA,
      decisionMatrix: miniMatrix,
      palaceOverlapTags: tags,
    });
    const s2 = buildTimeModuleDecisionSnapshotFromChart({
      chartJson: chartB,
      decisionMatrix: miniMatrix,
      palaceOverlapTags: tags,
    });
    expect(s1.keyYearsDecisionTimeline).toEqual(s2.keyYearsDecisionTimeline);
  });
});

describe("getPlaceholderMapFromContext + findings.timeModuleDecision", () => {
  it("有 findings.timeModuleDecision 時不因 chartJson.overlap 改變而改變 keyYearsDecisionTimeline", () => {
    const chartJson = {
      minorFortuneByPalace: [{ palace: "命宮", year: 2027, nominalAge: 42 }],
      yearlyHoroscope: { year: 2027 },
      overlapAnalysis: { items: [{ tag: "shock", palaceName: "命宮" }] },
    };
    const fromSnap = buildTimeModuleDecisionSnapshotFromChart({
      chartJson,
      decisionMatrix: miniMatrix,
      palaceOverlapTags: { 命宮: "wealth" },
    });
    const findingsLike = {
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
      timeModuleDecision: fromSnap,
    };
    const chartTampered = {
      ...chartJson,
      overlapAnalysis: { items: [{ tag: "mine", palaceName: "命宮" }] },
    };
    const mapA = getPlaceholderMapFromContext(null, {
      chartJson,
      sectionKey: "s15",
      content: { decisionMatrix: miniMatrix } as never,
      findings: findingsLike as never,
    });
    const mapB = getPlaceholderMapFromContext(null, {
      chartJson: chartTampered,
      sectionKey: "s15",
      content: { decisionMatrix: miniMatrix } as never,
      findings: findingsLike as never,
    });
    expect(mapA.keyYearsDecisionTimeline).toEqual(mapB.keyYearsDecisionTimeline);
  });
});

describe("getPlaceholderMapFromContext + findings.piercingDiagnosticBundle", () => {
  const fixedBundle: DiagnosticBundle = {
    tensions: [],
    reframes: [],
    rootCauses: [
      {
        id: "rc-snapshot-test",
        type: "overflow",
        sourcePalace: "測試源宮",
        symptomPalace: "測試症狀宮",
        evidence: [],
        narrative: "snapshot",
        advice: "",
      },
    ],
  };

  const emptyFindingsBase = {
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
  };

  it("有 findings.piercingDiagnosticBundle 時 blindSpotsDecadalNarrative 不因 chart 竄改而變（s18）", () => {
    const chartA = LIFEBOOK_CANONICAL_TEST_CHART_JSON as Record<string, unknown>;
    const chartB = { ...chartA, ziwei: { ...(chartA.ziwei as object), mainStars: { 命宮: ["虛構星"] } } };
    const findingsLike = {
      ...emptyFindingsBase,
      piercingDiagnosticBundle: fixedBundle,
    };
    const mapA = getPlaceholderMapFromContext(null, {
      chartJson: chartA,
      sectionKey: "s18",
      content: {},
      findings: findingsLike as never,
    });
    const mapB = getPlaceholderMapFromContext(null, {
      chartJson: chartB,
      sectionKey: "s18",
      content: {},
      findings: findingsLike as never,
    });
    expect(mapA.blindSpotsDecadalNarrative).toEqual(mapB.blindSpotsDecadalNarrative);
    expect(mapA.blindSpotsDecadalNarrative).toContain("測試源宮");
    expect(mapA.blindSpotsDecadalNarrative).toContain("測試症狀宮");
  });

  it("s19：s19ActionNow／s19LongTerm／s19Avoid 與 actionNowLayers 同源（不靠字串二次切分）", () => {
    const chartJson = LIFEBOOK_CANONICAL_TEST_CHART_JSON as Record<string, unknown>;
    const map = getPlaceholderMapFromContext(null, {
      chartJson,
      sectionKey: "s19",
      content: {},
      config: null,
    });
    const layers = map.actionNowLayers ?? "";
    expect(layers.length).toBeGreaterThan(20);
    expect(layers).toContain(map.s19ActionNow ?? "");
    expect(layers).toContain(map.s19LongTerm ?? "");
    expect(layers).toContain(map.s19Avoid ?? "");
  });
});
