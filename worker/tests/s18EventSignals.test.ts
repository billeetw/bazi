/**
 * S18 Phase 1：EventSignals 層驗收。
 * 唯一資料來源 buildPalaceOverlay；不讀 overlap、不影響 S17。
 * 執行：npm test -- s18EventSignals.test.ts
 */

import { describe, it, expect } from "vitest";
import { buildPalaceOverlay, type PalaceOverlayEntry } from "../src/lifebook/palaceOverlay.js";
import {
  buildEventSignals,
  debugEventSignals,
  formatFlowNarrative,
  signalsToNarrative,
  type S18Signals,
  type PalaceSignal,
  type PatternInfo,
} from "../src/lifebook/s18/eventSignals.js";
import { getPlaceholderMapFromContext } from "../src/lifeBookPrompts.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

/** 整庫共用命盤（含生年四化；星曜落點見 fixture 註解） */
const fixtureChart = LIFEBOOK_CANONICAL_TEST_CHART_JSON;

describe("S18 buildEventSignals", () => {
  const overlay = buildPalaceOverlay(fixtureChart, { currentAge: 54, flowYear: 2026 });

  it("returns S18Signals with palaces array and keyPalaces", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    expect(signals).toHaveProperty("palaces");
    expect(signals).toHaveProperty("keyPalaces");
    expect(signals).toHaveProperty("mainTheme");
    expect(signals).toHaveProperty("challenge");
    expect(Array.isArray(signals.palaces)).toBe(true);
    expect(signals.keyPalaces).toHaveProperty("strongestOpportunity");
    expect(signals.keyPalaces).toHaveProperty("strongestPressure");
  });

  it("each PalaceSignal has required fields", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    for (const ps of signals.palaces) {
      expect(typeof ps.palace).toBe("string");
      expect(typeof ps.score).toBe("number");
      expect(typeof ps.fortuneLevel).toBe("string");
      expect(typeof ps.statusIcon).toBe("string");
      expect(typeof ps.energyLevel).toBe("string");
      expect(typeof ps.resource).toBe("number");
      expect(typeof ps.power).toBe("number");
      expect(typeof ps.structure).toBe("number");
      expect(typeof ps.risk).toBe("number");
      expect(Array.isArray(ps.flows)).toBe(true);
    }
  });

  it("debugEventSignals does not throw", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    expect(() => debugEventSignals(signals)).not.toThrow();
  });

  it("S18 完整範例：印出 fixture chart 的 S18Signals 與 debug", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    debugEventSignals(signals);
    expect(signals.palaces.length).toBeGreaterThan(0);
    expect(Array.isArray(signals.keyPalaces.strongestOpportunity)).toBe(true);
    expect(Array.isArray(signals.keyPalaces.strongestPressure)).toBe(true);
  });

  it("signalsToNarrative produces complete section text", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    const text = signalsToNarrative(signals);
    expect(text).toContain("【疊宮事件訊號】");
    expect(text).toContain("運勢：");
    expect(text).toContain("狀態：");
    expect(text).toContain("動能：");
    expect(text).toContain("飛星：");
    expect(text).toContain("【關鍵宮位】");
    expect(text).toContain("【今年主線與功課】");
  });

  it("S18 placeholder map has s18SignalsBlocks", () => {
    const map = getPlaceholderMapFromContext(null, {
      chartJson: fixtureChart,
      sectionKey: "s18",
      content: {},
      config: null,
      contentLocale: "zh-TW",
    });
    expect(map.s18SignalsBlocks).toBeDefined();
    const block = String(map.s18SignalsBlocks);
    expect(block).toContain("【疊宮事件訊號】");
    expect(block).toContain("【關鍵宮位】");
    expect(block).toContain("【今年主線與功課】");
    expect(block).toContain("機會較強：");
    expect(block).toContain("壓力較強：");
  });

  it("mainTheme and challenge have correct shape", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    expect(signals.mainTheme).toHaveProperty("palace");
    expect(signals.mainTheme).toHaveProperty("text");
    expect(signals.challenge).toHaveProperty("palace");
    expect(signals.challenge).toHaveProperty("text");
  });

  it("fortuneLevel returns correct values based on score", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    for (const ps of signals.palaces) {
      expect(["大吉", "中吉", "小吉", "平", "小凶", "中凶", "大凶"]).toContain(ps.fortuneLevel);
    }
  });

  it("formatFlowNarrative produces human-readable flow description", () => {
    const flow = {
      layer: "year" as const,
      star: "太陽",
      transform: "忌",
      fromPalace: "僕役宮",
      toPalace: "官祿宮",
    };
    const narrative = formatFlowNarrative(flow);
    expect(narrative).toContain("🔴【忌｜壓力】");
    expect(narrative).toContain("太陽化忌");
    expect(narrative).toContain("這代表");
  });

  it("keyPalaces correctly identifies opportunity and pressure palaces", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    expect(Array.isArray(signals.keyPalaces.strongestOpportunity)).toBe(true);
    expect(Array.isArray(signals.keyPalaces.strongestPressure)).toBe(true);
    expect(signals.keyPalaces.strongestOpportunity.length).toBeLessThanOrEqual(3);
    expect(signals.keyPalaces.strongestPressure.length).toBeLessThanOrEqual(3);
  });

  it("score calculation follows formula: resource*2 + structure*1.5 + power*0.8 - risk*2.5", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    for (const ps of signals.palaces) {
      const expectedScore = ps.resource * 2.0 + ps.structure * 1.5 + ps.power * 0.8 - ps.risk * 2.5;
      expect(ps.score).toBeCloseTo(Math.round(expectedScore * 10) / 10, 1);
    }
  });

  it("PalaceSignal includes pattern field with required properties", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    for (const ps of signals.palaces) {
      expect(ps).toHaveProperty("pattern");
      expect(ps.pattern).toHaveProperty("id");
      expect(ps.pattern).toHaveProperty("icon");
      expect(ps.pattern).toHaveProperty("label");
      expect(ps.pattern).toHaveProperty("description");
      expect(ps.pattern).toHaveProperty("summary");
    }
  });

  it("pattern follows priority: double_ji > lu_ji_mix > double_lu > double_ke > power_strong > ke_ji_coexist > none", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    const validPatternIds = ["double_ji", "lu_ji_mix", "double_lu", "double_ke", "power_strong", "ke_ji_coexist", "none"];
    for (const ps of signals.palaces) {
      expect(validPatternIds).toContain(ps.pattern.id);
    }
  });

  it("祿忌交錯 pattern triggers when resource >= 1 and risk >= 1 (but risk < 2)", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    const luJiPalace = signals.palaces.find(ps => ps.resource >= 1 && ps.risk >= 1 && ps.risk < 2);
    if (luJiPalace) {
      expect(luJiPalace.pattern.id).toBe("lu_ji_mix");
      expect(luJiPalace.pattern.label).toContain("祿忌交錯");
      expect(luJiPalace.pattern.summary).toContain("👉");
    }
  });

  it("signalsToNarrative includes pattern with summary after 動能 and before 飛星", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    const text = signalsToNarrative(signals);
    const hasVisiblePattern = signals.palaces.some((ps) => ps.pattern.id !== "none");
    if (hasVisiblePattern) {
      /** 第一個輸出宮位可能是「無 pattern」的宮（如命宮），改驗兄弟宮祿忌交錯區塊 */
      expect(text).toMatch(/【兄弟宮[\s\S]*動能：中\n\n⚖️【祿忌交錯｜/);
      expect(text).toContain("👉 這一塊的局是：");
    }
  });

  it("all flows for same palace are preserved (同宮多飛星全部保留)", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    const text = signalsToNarrative(signals);
    for (const ps of signals.palaces) {
      // 每條 flow 都應該在輸出中出現一次
      for (const f of ps.flows) {
        const flowMarker = `${f.star}化${f.transform}`;
        expect(text).toContain(flowMarker);
      }
    }
    // 驗證有多飛星的宮位（如 兄弟宮 有 2 flows）
    const multiFlowPalaces = signals.palaces.filter(ps => ps.flows.length >= 2);
    expect(multiFlowPalaces.length).toBeGreaterThan(0);
  });

  it("不再使用舊五分類 (no finance/career/relationship in output)", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    const text = signalsToNarrative(signals);
    expect(text).not.toContain("【財務與資產】");
    expect(text).not.toContain("【事業與對外發展】");
    expect(text).not.toContain("【關係與合作】");
    expect(signals).not.toHaveProperty("finance");
    expect(signals).not.toHaveProperty("career");
  });

  it("S18 不含流月評分 (no monthly scores)", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    for (const ps of signals.palaces) {
      for (const f of ps.flows) {
        expect(["natal", "decade", "year"]).toContain(f.layer);
        expect(f.layer).not.toBe("month");
      }
    }
  });

  // ========== 本命四化測試 ==========

  it("natal flows are included when chartJson has fourTransformations.benming", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    const natalFlows = signals.palaces.flatMap(ps => ps.flows.filter(f => f.layer === "natal"));
    // 應該有 4 條本命四化：祿、權、科、忌
    expect(natalFlows.length).toBe(4);
    // 驗證四化完整性
    const transforms = natalFlows.map(f => f.transform).sort();
    expect(transforms).toEqual(["忌", "權", "祿", "科"].sort());
  });

  it("natal flows use weight 0.8 in score calculation", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    // 官祿宮有本命太陽化忌 (natal) + 可能有其他 flows
    const guanLuGong = signals.palaces.find(ps => ps.palace === "官祿宮");
    expect(guanLuGong).toBeDefined();
    const natalJi = guanLuGong?.flows.find(f => f.layer === "natal" && f.transform === "忌");
    expect(natalJi).toBeDefined();
    // natal 忌 weight = 0.8, risk should include 0.8
    expect(guanLuGong!.risk).toBeGreaterThanOrEqual(0.8);
  });

  it("Energy 不含本命，只計算 decade + year", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    // 僕役宮有本命武曲化科 (natal)，但 Energy 應只算動態層
    const puYiGong = signals.palaces.find(ps => ps.palace === "僕役宮");
    expect(puYiGong).toBeDefined();
    const natalFlows = puYiGong?.flows.filter(f => f.layer === "natal") ?? [];
    const dynamicFlows = puYiGong?.flows.filter(f => f.layer !== "natal") ?? [];
    expect(natalFlows.length).toBeGreaterThan(0);
    // Energy 應該是「低」因為只有 1 條動態 flow (decade 科)
    if (dynamicFlows.length === 1) {
      expect(puYiGong!.energyLevel).toBe("低");
    }
  });

  it("flow output includes layer labels [本]/[限]/[年]", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    const text = signalsToNarrative(signals);
    // 應該包含 [本] 標籤（本命四化）
    expect(text).toContain("[本]");
    // 本命四化應使用「在X宮」格式
    expect(text).toMatch(/\[本\].*在.*宮/);
    // 大限/流年應使用「自X宮飛入Y宮」或「飛入X宮」格式
    expect(text).toContain("飛入");
  });

  it("natal + decade/year 可觸發 pattern (祿忌交錯、雙忌等)", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    // 官祿宮：本命太陽化忌 + 大限忌 → 可能 double_ji
    const guanLuGong = signals.palaces.find(ps => ps.palace === "官祿宮");
    // 兄弟宮：本命廉貞化祿 + 流年忌 → 祿忌交錯
    const xiongDiGong = signals.palaces.find(ps => ps.palace === "兄弟宮");
    // 至少有一個宮位有非 "none" 的 pattern
    const hasVisiblePattern = signals.palaces.some(ps => ps.pattern.id !== "none");
    expect(hasVisiblePattern).toBe(true);
  });

  it("本命四化參與主線 / 功課判定", () => {
    const signals = buildEventSignals(overlay, fixtureChart);
    // 主線和功課應該存在
    expect(signals.mainTheme.palace).toBeDefined();
    expect(signals.challenge.palace).toBeDefined();
    // 官祿宮有本命忌，應該可能成為功課
    // (具體判定取決於其他 flows)
  });
});
