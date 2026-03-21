/**
 * 12 宮四化／飛化結構除錯：raw data dump。
 * 使用與正式路徑相同的 chart 建立 findings（normalizeChart + getSihuaPlacementItemsFromChart），
 * 呼叫 buildSihuaPlacementBlock / buildSihuaFlowBlock，讓 [結構檢查 - 兄弟宮/夫妻宮] 的 console.log 輸出。
 */
import { describe, it } from "vitest";
import { normalizeChart } from "../src/lifebook/index.js";
import { createEmptyFindings } from "../src/lifebook/lifebookFindings.js";
import type { NatalFlowItem } from "../src/lifebook/lifebookFindings.js";
import {
  getSihuaPlacementItemsFromChart,
  buildSihuaPlacementBlock,
  buildSihuaFlowBlock,
} from "../src/lifeBookPrompts.js";

const CHART_WITH_ZIWEI = {
  ziwei: {
    core: { minggongStem: "辛" },
    starByPalace: {
      命宮: ["紫微", "天府"],
      兄弟宮: ["天機"],
      夫妻宮: ["太陽", "巨門"],
      子女宮: ["武曲", "天相"],
      財帛宮: ["天同", "天梁"],
      疾厄宮: ["七殺"],
      遷移宮: ["破軍"],
      僕役宮: ["廉貞"],
      官祿宮: ["天梁"],
      田宅宮: ["天機", "天梁"],
      福德宮: ["天同"],
      父母宮: ["武曲"],
    },
  },
  overlapAnalysis: { items: [] },
};

describe("sihua structure debug", () => {
  it("dumps raw placement/flow structure for 兄弟宮 and 夫妻宮", () => {
    const chart = normalizeChart(CHART_WITH_ZIWEI as Record<string, unknown>);
    const findings = createEmptyFindings();
    const natalFlows = chart.natal?.flows ?? chart.natal?.birthTransforms ?? [];
    findings.natalFlowItems = (natalFlows as Array<{ fromPalace: string; toPalace: string; starName?: string; transform: string }>).map(
      (e): NatalFlowItem => ({
        fromPalace: e.fromPalace,
        toPalace: e.toPalace,
        starName: e.starName,
        transform: e.transform as "祿" | "權" | "科" | "忌",
      })
    );
    findings.sihuaPlacementItems = getSihuaPlacementItemsFromChart(CHART_WITH_ZIWEI as Record<string, unknown>);

    console.log("\n========== 兄弟宮 ==========");
    buildSihuaPlacementBlock("兄弟宮", findings);
    buildSihuaFlowBlock("兄弟宮", findings);

    console.log("\n========== 夫妻宮 ==========");
    buildSihuaPlacementBlock("夫妻宮", findings);
    buildSihuaFlowBlock("夫妻宮", findings);

    console.log("\n========== dump done ==========\n");
  });
});
