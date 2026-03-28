/**
 * S22 結構線 / S23 轉化流 + getPalaceScore（v1）
 */
import { describe, it, expect } from "vitest";
import type { PalaceStructure, TransformEdge } from "../src/lifebook/normalizedChart.js";
import {
  getPalaceScore,
  getStructureLines,
  getTransformationFlows,
  classifyStructureBalance,
  classifyFlowType,
} from "../src/lifebook/lifeModel/index.js";
import type { NormalizedChart } from "../src/lifebook/normalizedChart.js";

function edge(
  toPalace: string,
  transform: "祿" | "權" | "科" | "忌",
  layer: "natal" | "decade" | "year" = "natal"
): TransformEdge {
  return { fromPalace: "命宮", toPalace, transform, layer };
}

function minimalChart(palaces: PalaceStructure[]): NormalizedChart {
  return {
    chartId: "test",
    locale: "zh-TW",
    mingGong: "命宮",
    palaces,
    natalTransforms: [],
  };
}

function palace(
  name: string,
  partial: Partial<Pick<PalaceStructure, "mainStars" | "assistantStars" | "shaStars" | "natalTransformsIn">>
): PalaceStructure {
  return {
    palace: name,
    mainStars: partial.mainStars ?? [],
    assistantStars: partial.assistantStars ?? [],
    shaStars: partial.shaStars ?? [],
    miscStars: [],
    natalTransformsIn: partial.natalTransformsIn ?? [],
    natalTransformsOut: [],
    decadalTransformsIn: [],
    decadalTransformsOut: [],
    yearlyTransformsIn: [],
    yearlyTransformsOut: [],
  };
}

describe("getPalaceScore v1", () => {
  it("空宮策略 A：baseMain 約 0.75，score 落在 1–5", () => {
    const p = palace("財帛宮", {});
    const r = getPalaceScore(p);
    expect(r.isEmptyPalace).toBe(true);
    expect(r.raw).toBeCloseTo(0.75, 5);
    expect(r.score).toBe(1);
    expect(r.scoreVersion).toBe("v1");
  });

  it("廟旺主星＋吉星拉高 raw 與 score", () => {
    const p = palace("命宮", {
      mainStars: [{ name: "紫微", brightness: "廟" }],
      assistantStars: [{ name: "左輔" }, { name: "右弼" }, { name: "文昌" }, { name: "文曲" }],
    });
    const r = getPalaceScore(p);
    expect(r.isEmptyPalace).toBe(false);
    expect(r.raw).toBeGreaterThanOrEqual(1.75);
    expect(r.score).toBeGreaterThanOrEqual(2);
  });

  it("化忌飛入本命：扣 0.5（只計 natal layer）", () => {
    const p = palace("財帛宮", {
      mainStars: [{ name: "武曲", brightness: "廟" }],
      natalTransformsIn: [edge("財帛宮", "忌")],
    });
    const noJi = palace("財帛宮", {
      mainStars: [{ name: "武曲", brightness: "廟" }],
    });
    expect(getPalaceScore(p).raw).toBeCloseTo(getPalaceScore(noJi).raw - 0.5, 5);
  });

  it("大限層 in 不影響本命分", () => {
    const p = palace("財帛宮", {
      mainStars: [{ name: "武曲", brightness: "廟" }],
      natalTransformsIn: [{ fromPalace: "命宮", toPalace: "財帛宮", transform: "忌", layer: "decade" }],
    });
    const base = getPalaceScore(
      palace("財帛宮", { mainStars: [{ name: "武曲", brightness: "廟" }] })
    );
    expect(getPalaceScore(p).raw).toBeCloseTo(base.raw, 5);
  });

  it("多煞扣分有上限", () => {
    const manySha = palace("疾厄宮", {
      mainStars: [{ name: "天同", brightness: "平" }],
      shaStars: [
        { name: "擎羊" },
        { name: "陀羅" },
        { name: "火星" },
        { name: "鈴星" },
      ],
    });
    const r = getPalaceScore(manySha);
    expect(r.raw).toBeGreaterThan(-2);
    expect(r.score).toBeGreaterThanOrEqual(1);
  });
});

describe("classifyStructureBalance / s22", () => {
  it("雙強且 gap 小 → balanced", () => {
    expect(classifyStructureBalance(4, 4)).toBe("balanced");
  });

  it("雙弱 → weak", () => {
    expect(classifyStructureBalance(2, 2)).toBe("weak");
  });

  it("單強 → biased", () => {
    expect(classifyStructureBalance(4, 3)).toBe("biased");
  });

  it("getStructureLines 產出三條且不含轉化欄位", () => {
    const chart = minimalChart([
      palace("財帛宮", { mainStars: [{ name: "武曲", brightness: "廟" }] }),
      palace("福德宮", { mainStars: [{ name: "天同", brightness: "廟" }] }),
      palace("子女宮", { mainStars: [{ name: "天機", brightness: "陷" }] }),
      palace("田宅宮", { mainStars: [{ name: "天梁", brightness: "陷" }] }),
      palace("官祿宮", { mainStars: [{ name: "廉貞", brightness: "廟" }] }),
      palace("夫妻宮", { mainStars: [{ name: "破軍", brightness: "陷" }] }),
    ]);
    const lines = getStructureLines(chart);
    expect(lines).toHaveLength(3);
    expect(lines.map((l) => l.id).sort()).toEqual(
      ["asset_storage", "career_relationship", "wealth_happiness"].sort()
    );
    const w = lines.find((l) => l.id === "wealth_happiness")!;
    expect(w.balanceType).toBeDefined();
    expect("conversionRate" in w).toBe(false);
  });
});

describe("getTransformationFlows / s23", () => {
  it("sourceRaw < 1 → conversionRate 經修正後仍可能為 0", () => {
    const chart = minimalChart([
      palace("官祿宮", { mainStars: [] }),
      palace("財帛宮", {
        mainStars: [{ name: "天府", brightness: "廟" }],
      }),
    ]);
    const flows = getTransformationFlows(chart);
    const cm = flows.find((f) => f.id === "career_to_money")!;
    expect(cm.sourceRaw).toBeLessThan(1);
    expect(cm.conversionRate).toBe(0);
    expect(cm.flowType).toBe("blocked");
  });

  it("承接宮整數分高於來源宮時 isOverperforming === true", () => {
    const chart = minimalChart([
      palace("官祿宮", { mainStars: [{ name: "天機", brightness: "陷" }] }),
      palace("財帛宮", {
        mainStars: [{ name: "武曲", brightness: "廟" }],
        assistantStars: [
          { name: "左輔" },
          { name: "右弼" },
          { name: "文昌" },
          { name: "文曲" },
        ],
      }),
    ]);
    const cm = getTransformationFlows(chart).find((f) => f.id === "career_to_money")!;
    expect(cm.targetScore).toBeGreaterThan(cm.sourceScore);
    expect(cm.isOverperforming).toBe(true);
  });

  it("田宅化忌拉低 money_to_asset", () => {
    const chart = minimalChart([
      palace("財帛宮", {
        mainStars: [{ name: "武曲", brightness: "廟" }],
      }),
      palace("田宅宮", {
        mainStars: [{ name: "天同", brightness: "平" }],
        natalTransformsIn: [edge("田宅宮", "忌")],
      }),
    ]);
    const ma = getTransformationFlows(chart).find((f) => f.id === "money_to_asset")!;
    expect(ma.flowType === "leaking" || ma.flowType === "blocked" || ma.flowType === "stuck").toBe(true);
  });

  it("classifyFlowType 區間符合 spec", () => {
    expect(classifyFlowType(0.85)).toBe("smooth");
    expect(classifyFlowType(0.6)).toBe("stuck");
    expect(classifyFlowType(0.35)).toBe("leaking");
    expect(classifyFlowType(0.1)).toBe("blocked");
  });

  it("輸出不含 balanced/biased/weak", () => {
    const chart = minimalChart([
      palace("官祿宮", { mainStars: [{ name: "紫微", brightness: "廟" }] }),
      palace("財帛宮", { mainStars: [{ name: "天府", brightness: "廟" }] }),
      palace("田宅宮", { mainStars: [{ name: "太陰", brightness: "廟" }] }),
      palace("福德宮", { mainStars: [{ name: "天梁", brightness: "廟" }] }),
      palace("遷移宮", { mainStars: [{ name: "七殺", brightness: "廟" }] }),
    ]);
    const json = JSON.stringify(getTransformationFlows(chart));
    expect(json).not.toMatch(/\bbalanced\b|\bbiased\b|\bweak\b/);
  });
});
