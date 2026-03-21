/**
 * Phase 5B-3: 跑技術版財帛宮(s05)、疾厄宮(s06)，觸發 buildSihuaFlowSummary debug log。
 * 執行: npx vitest run tests/debug-sihua-flow-summary.test.ts
 */
import { describe, it } from "vitest";
import { getSectionTechnicalBlocks, getSihuaPlacementItemsFromChart } from "../src/lifeBookPrompts.js";
import lifebookSectionZhTw from "../content/lifebookSection-zh-TW.json";

const minimalChart = {
  ziwei: {
    core: { minggongBranch: "亥" },
    mainStars: {
      命宮: ["天同"],
      兄弟宮: ["天機"],
      夫妻宮: ["文昌"],
      子女宮: ["廉貞"],
      財帛宮: ["天同"],
      疾厄宮: ["七殺"],
      遷移宮: ["破軍"],
      僕役宮: ["廉貞"],
      官祿宮: ["天梁"],
      田宅宮: ["天機"],
      福德宮: ["天同"],
      父母宮: ["武曲"],
    },
  },
  fourTransformations: {
    benming: {
      mutagenStars: {
        祿: "天同",
        權: "天機",
        科: "文昌",
        忌: "廉貞",
      },
    },
  },
  decadalLimits: [],
  yearlyHoroscope: {},
  overlapAnalysis: { items: [] },
} as Record<string, unknown>;

function buildFindingsForDebug(chart: Record<string, unknown>) {
  const items = getSihuaPlacementItemsFromChart(chart);
  return {
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
    sihuaPlacementItems: items,
    natalFlowItems: [],
  };
}

describe("Phase 5B-3 buildSihuaFlowSummary debug", () => {
  it("run s05 財帛宮 and s06 疾厄宮 technical blocks and capture debug log", () => {
    const findings = buildFindingsForDebug(minimalChart);
    const content = {
      lifebookSection: lifebookSectionZhTw as Record<string, { structure_analysis?: string }>,
      starPalaces: {},
      starPalacesMain: {},
      starPalacesAux: {},
      stars: {},
    };
    const config = { templates: [], starPalaces: {} };

    console.log("\n========== s05 財帛宮 ==========");
    getSectionTechnicalBlocks(
      "s05",
      minimalChart as Record<string, unknown>,
      config as never,
      content as never,
      "zh-TW",
      findings as never
    );

    console.log("\n========== s06 疾厄宮 ==========");
    getSectionTechnicalBlocks(
      "s06",
      minimalChart as Record<string, unknown>,
      config as never,
      content as never,
      "zh-TW",
      findings as never
    );

    console.log("\n========== sihuaPlacementItems from chart (for reference) ==========");
    const items = getSihuaPlacementItemsFromChart(minimalChart);
    console.log("length:", items.length);
    console.log("targets:", items.map((x) => x.targetPalace));
  });
});
