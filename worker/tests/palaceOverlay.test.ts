/**
 * 疊宮純資料層 buildPalaceOverlay 驗收：12 宮、本命星曜、大限／流年 incoming/outgoing。
 * S17 疊宮分析：buildPalaceOverlayBlocks 格式與 getPlaceholderMapFromContext(s17) 接線。
 * 執行：npm test -- palaceOverlay.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  buildPalaceOverlay,
  buildPalaceOverlayBlocks,
  formatPalaceOverlayBlock,
  formatOverlayFlow,
  debugPalaceOverlay,
  type PalaceOverlayEntry,
} from "../src/lifebook/palaceOverlay.js";
import { getPlaceholderMapFromContext } from "../src/lifeBookPrompts.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

/** 整庫共用測試命盤（含宮干、生年四化）— 見 `fixtures/lifebookCanonicalTestChart.ts` */
const fixtureChart = LIFEBOOK_CANONICAL_TEST_CHART_JSON;

describe("buildPalaceOverlay", () => {
  it("returns 12 palaces in canonical order", () => {
    const overlay = buildPalaceOverlay(fixtureChart, { currentAge: 54, flowYear: 2026 });
    expect(overlay).toHaveLength(12);
    const palaces = overlay.map((e) => e.palace);
    expect(palaces[0]).toBe("命宮");
    expect(palaces).toContain("僕役宮");
    expect(palaces).toContain("疾厄宮");
  });

  it("each entry has palace, natalStars, decadalIncoming/Outgoing, yearlyIncoming/Outgoing", () => {
    const overlay = buildPalaceOverlay(fixtureChart, { currentAge: 54 });
    for (const entry of overlay) {
      expect(entry).toHaveProperty("palace");
      expect(entry).toHaveProperty("natalStars");
      expect(Array.isArray(entry.natalStars)).toBe(true);
      expect(entry).toHaveProperty("decadalIncoming");
      expect(entry).toHaveProperty("decadalOutgoing");
      expect(entry).toHaveProperty("yearlyIncoming");
      expect(entry).toHaveProperty("yearlyOutgoing");
      expect(Array.isArray(entry.decadalIncoming)).toBe(true);
      expect(Array.isArray(entry.decadalOutgoing)).toBe(true);
      expect(Array.isArray(entry.yearlyIncoming)).toBe(true);
      expect(Array.isArray(entry.yearlyOutgoing)).toBe(true);
    }
  });

  it("decadal: 僕役宮 from stem 甲 → 4 outgoing (廉貞祿→兄弟 破軍權→子女 武曲科→僕役 太陽忌→官祿)", () => {
    const overlay = buildPalaceOverlay(fixtureChart, { currentAge: 54 });
    const puyi = overlay.find((e) => e.palace === "僕役宮") as PalaceOverlayEntry;
    expect(puyi).toBeDefined();
    expect(puyi.decadalOutgoing).toHaveLength(4);
    const toPalaces = puyi.decadalOutgoing.map((f) => f.toPalace);
    expect(toPalaces).toContain("兄弟宮");
    expect(toPalaces).toContain("子女宮");
    expect(toPalaces).toContain("僕役宮");
    expect(toPalaces).toContain("官祿宮");
    expect(puyi.decadalOutgoing.some((f) => f.star === "廉貞" && f.transform === "祿")).toBe(true);
  });

  it("decadal: 兄弟宮 receives 廉貞化祿 (incoming)", () => {
    const overlay = buildPalaceOverlay(fixtureChart, { currentAge: 54 });
    const xiongdi = overlay.find((e) => e.palace === "兄弟宮") as PalaceOverlayEntry;
    expect(xiongdi).toBeDefined();
    expect(xiongdi.decadalIncoming.some((f) => f.star === "廉貞" && f.transform === "祿")).toBe(true);
    expect(xiongdi.natalStars).toContain("廉貞");
  });

  it("yearly: 疾厄宮 from stem 丙 → 4 outgoing; 子女宮 receives 天同化祿（天同坐子女，非財帛）", () => {
    const overlay = buildPalaceOverlay(fixtureChart, { currentAge: 54, flowYear: 2026 });
    const jie = overlay.find((e) => e.palace === "疾厄宮") as PalaceOverlayEntry;
    expect(jie).toBeDefined();
    expect(jie.yearlyOutgoing).toHaveLength(4);
    const zi = overlay.find((e) => e.palace === "子女宮") as PalaceOverlayEntry;
    expect(zi).toBeDefined();
    expect(zi.yearlyIncoming.some((f) => f.star === "天同" && f.transform === "祿")).toBe(true);
  });

  it("calls debugPalaceOverlay without throwing", () => {
    const overlay = buildPalaceOverlay(fixtureChart, { currentAge: 54, flowYear: 2026 });
    expect(() => debugPalaceOverlay(overlay)).not.toThrow();
  });

  it("empty chart returns empty array", () => {
    const overlay = buildPalaceOverlay(undefined);
    expect(overlay).toEqual([]);
    const overlay2 = buildPalaceOverlay({});
    expect(overlay2).toHaveLength(12);
    overlay2.forEach((e) => {
      expect(e.natalStars).toEqual([]);
      expect(e.decadalIncoming).toEqual([]);
      expect(e.decadalOutgoing).toEqual([]);
      expect(e.yearlyIncoming).toEqual([]);
      expect(e.yearlyOutgoing).toEqual([]);
    });
  });
});

describe("S17 疊宮分析 formatter and wiring", () => {
  it("formatOverlayFlow produces full line: 星名化X，自from飛入to", () => {
    const flow = {
      layer: "decade" as const,
      fromPalace: "僕役宮",
      toPalace: "官祿宮",
      star: "太陽",
      transform: "忌" as const,
      triggerStem: "甲",
      sourceOfTruth: "gonggan-fly" as const,
    };
    expect(formatOverlayFlow(flow)).toBe("太陽化忌，自僕役宮飛入官祿宮");
  });

  it("formatPalaceOverlayBlock has 5 fields and empty shows 無 / - 無", () => {
    const overlay = buildPalaceOverlay(fixtureChart, { currentAge: 54, flowYear: 2026 });
    const 命宮 = overlay.find((e) => e.palace === "命宮")!;
    const block = formatPalaceOverlayBlock(命宮);
    expect(block).toContain("【命宮】");
    expect(block).toContain("本命星曜：巨門、天機");
    expect(block).toContain("大限飛入：");
    expect(block).toContain("大限飛出：");
    expect(block).toContain("流年飛入：");
    expect(block).toContain("流年飛出：");
    const 遷移 = overlay.find((e) => e.palace === "遷移宮")!;
    const blockEmpty = formatPalaceOverlayBlock(遷移);
    expect(blockEmpty).toContain("本命星曜：無");
    expect(blockEmpty).toContain("- 無");
  });

  it("buildPalaceOverlayBlocks starts with 【疊宮分析】 and has 12 palace blocks", () => {
    const overlay = buildPalaceOverlay(fixtureChart, { currentAge: 54, flowYear: 2026 });
    const text = buildPalaceOverlayBlocks(overlay);
    expect(text).toMatch(/^【疊宮分析】/);
    expect(text).toContain("【命宮】");
    expect(text).toContain("【兄弟宮】");
    expect(text).toContain("【僕役宮】");
    expect(text).toContain("廉貞化祿，自僕役宮飛入兄弟宮");
    expect(text).toContain("天同化祿，自疾厄宮飛入子女宮");
  });

  it("S17 placeholder map has palaceOverlayBlocks from buildPalaceOverlay only", () => {
    const map = getPlaceholderMapFromContext(null, {
      chartJson: fixtureChart,
      sectionKey: "s17",
      content: {},
      config: null,
      contentLocale: "zh-TW",
    });
    expect(map.palaceOverlayBlocks).toBeDefined();
    expect(String(map.palaceOverlayBlocks)).toMatch(/^【疊宮分析】/);
    expect(map.palaceOverlayBlocks).toContain("【兄弟宮】");
    expect(map.palaceOverlayBlocks).toContain("本命星曜：廉貞");
    expect(map.palaceOverlayBlocks).toContain("廉貞化祿，自僕役宮飛入兄弟宮");
    expect(map.palaceOverlayBlocks).toContain("廉貞化忌，自疾厄宮飛入兄弟宮");
  });

  it("S17 實際輸出範例與 debug 對照：印出 3 宮完整章節 + 原始 overlay", () => {
    const overlay = buildPalaceOverlay(fixtureChart, { currentAge: 54, flowYear: 2026 });
    const fullText = buildPalaceOverlayBlocks(overlay);

    const forLog = overlay.filter((e) => ["命宮", "兄弟宮", "僕役宮"].includes(e.palace));
    // eslint-disable-next-line no-console
    console.log("\n========== S17 實際輸出範例（節錄 3 宮）==========");
    for (const entry of forLog) {
      // eslint-disable-next-line no-console
      console.log(formatPalaceOverlayBlock(entry));
      // eslint-disable-next-line no-console
      console.log("");
    }
    // eslint-disable-next-line no-console
    console.log("========== 對應原始 overlay 資料（3 宮）==========");
    for (const entry of forLog) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        palace: entry.palace,
        natalStars: entry.natalStars,
        decadalIncoming: entry.decadalIncoming.map((f) => ({ star: f.star, transform: f.transform, fromPalace: f.fromPalace, toPalace: f.toPalace })),
        decadalOutgoing: entry.decadalOutgoing.map((f) => ({ star: f.star, transform: f.transform, fromPalace: f.fromPalace, toPalace: f.toPalace })),
        yearlyIncoming: entry.yearlyIncoming.map((f) => ({ star: f.star, transform: f.transform, fromPalace: f.fromPalace, toPalace: f.toPalace })),
        yearlyOutgoing: entry.yearlyOutgoing.map((f) => ({ star: f.star, transform: f.transform, fromPalace: f.fromPalace, toPalace: f.toPalace })),
      }, null, 2));
    }

    expect(fullText).toContain("【命宮】");
    expect(fullText).toContain("【兄弟宮】");
    expect(fullText).toContain("【僕役宮】");
  });
});
