/**
 * 避免「無效的 section_key」：確保 worker 的 SECTION_ORDER 與 SECTION_TEMPLATES
 * 涵蓋前端模組二＋收束（s15～s21），且 s15 的 placeholder 能正確產出。
 */
import { describe, it, expect } from "vitest";
import { SECTION_ORDER, SECTION_TEMPLATES } from "../src/lifeBookTemplates.js";
import { getPlaceholderMapFromContext, getSectionTechnicalBlocks } from "../src/lifeBookPrompts.js";

/** 前端 lifebook-viewer 模組二＋收束使用的 section_key（須全在 worker 白名單內） */
const TIME_MODULE_SECTION_KEYS = ["s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s21"] as const;

describe("section_key 白名單（避免無效的 section_key）", () => {
  it("SECTION_ORDER 包含所有模組二＋收束 section_key", () => {
    const orderList = SECTION_ORDER as readonly string[];
    for (const key of TIME_MODULE_SECTION_KEYS) {
      expect(orderList).toContain(key);
    }
  });

  it("SECTION_TEMPLATES 為每個模組二＋收束 section_key 提供 template", () => {
    for (const key of TIME_MODULE_SECTION_KEYS) {
      const template = SECTION_TEMPLATES.find((t) => t.section_key === key);
      expect(template, `missing SECTION_TEMPLATES entry for ${key}`).toBeDefined();
      expect(template?.title).toBeTruthy();
    }
  });

  it("SECTION_ORDER 與 SECTION_TEMPLATES 的 section_key 集合一致", () => {
    const orderSet = new Set(SECTION_ORDER);
    const templateKeys = new Set(SECTION_TEMPLATES.map((t) => t.section_key));
    for (const key of orderSet) {
      expect(templateKeys.has(key), `SECTION_ORDER has ${key} but SECTION_TEMPLATES has no entry`).toBe(true);
    }
    for (const key of templateKeys) {
      expect(orderSet.has(key), `SECTION_TEMPLATES has ${key} but SECTION_ORDER does not`).toBe(true);
    }
  });
});

describe("s15 產出驗證", () => {
  it("s15 placeholder map 含 decadalLimitsList、decadalFourTransformBlocks、currentDecadalHomework", () => {
    const chartJson = {
      decadalLimits: [
        { palace: "命宮", startAge: 0, endAge: 14, stem: "甲", mutagenStars: { 祿: "廉貞", 權: "破軍", 科: "武曲", 忌: "太陽" } },
        { palace: "兄弟宮", startAge: 15, endAge: 24, stem: "乙" },
      ],
      ziwei: {
        starByPalace: {
          命宮: ["紫微", "天府"],
          兄弟宮: ["天機", "天梁"],
          官祿宮: ["天同"],
          財帛宮: ["廉貞"],
          福德宮: ["文昌"],
        },
      },
      palaceStemMap: {
        命宮: "甲", 兄弟宮: "乙", 夫妻宮: "丙", 子女宮: "丁", 財帛宮: "戊",
        疾厄宮: "己", 遷移宮: "庚", 僕役宮: "辛", 官祿宮: "壬", 田宅宮: "癸",
        福德宮: "甲", 父母宮: "乙",
      },
      yearlyHoroscope: { nominalAge: 30 },
      overlapAnalysis: { items: [] },
    } as Record<string, unknown>;

    const map = getPlaceholderMapFromContext(null, {
      chartJson,
      sectionKey: "s15",
    });

    expect(map.decadalLimitsList, "decadalLimitsList 應有內容").toBeTruthy();
    expect(String(map.decadalLimitsList)).toMatch(/大限.*命宮|大限命宮/);
    expect(String(map.decadalLimitsList)).toMatch(/\d+～\d+歲|歲/);
    expect(map.currentDecadalHomework, "currentDecadalHomework 應有內容").toBeTruthy();
    // 大限四化飛星：有宮干＋本命星位時由公式產出，應有 4 條或至少標題
    expect(
      map.decadalFourTransformBlocks != null || map.decadalFourTransformSummary != null,
      "大限四化區塊或摘要應存在"
    ).toBe(true);
  });

  it("s15 無 decadalLimits 時 decadalLimitsList 為空字串，其餘 key 仍存在", () => {
    const chartJson = { overlapAnalysis: { items: [] } } as Record<string, unknown>;
    const map = getPlaceholderMapFromContext(null, { chartJson, sectionKey: "s15" });
    expect(map.decadalLimitsList).toBe("");
    expect("currentDecadalHomework" in map).toBe(true);
    expect("decadalFourTransformBlocks" in map).toBe(true);
  });
});

describe("getSectionTechnicalBlocks 時間模組產出 skeleton（避免只出標題、內容全空）", () => {
  it("s15 有 decadalLimits 時 getSectionTechnicalBlocks 回傳非空 structure_analysis", () => {
    const chartJson = {
      decadalLimits: [
        { palace: "命宮", startAge: 0, endAge: 14, stem: "甲" },
        { palace: "兄弟宮", startAge: 15, endAge: 24, stem: "乙" },
      ],
      ziwei: { starByPalace: { 命宮: ["紫微"], 兄弟宮: ["天機"], 官祿宮: ["天同"], 財帛宮: ["廉貞"], 福德宮: ["文昌"] } },
      palaceStemMap: { 命宮: "甲", 兄弟宮: "乙", 夫妻宮: "丙", 子女宮: "丁", 財帛宮: "戊", 疾厄宮: "己", 遷移宮: "庚", 僕役宮: "辛", 官祿宮: "壬", 田宅宮: "癸", 福德宮: "甲", 父母宮: "乙" },
      yearlyHoroscope: { nominalAge: 30 },
      overlapAnalysis: { items: [] },
    } as Record<string, unknown>;
    const content = {
      lifebookSection: {
        s15: {
          structure_analysis: "【大限一覽】\n\n{decadalLimitsList}\n\n【本次大限四化飛星】\n{decadalFourTransformBlocks}\n\n【十年主線與功課】\n{currentDecadalHomework}",
          behavior_pattern: "",
          blind_spots: "",
          strategic_advice: "",
        },
      },
    } as Record<string, unknown>;
    const blocks = getSectionTechnicalBlocks("s15", chartJson, null, content, "zh-TW");
    expect(blocks.resolvedSkeleton).toBeDefined();
    expect(blocks.resolvedSkeleton?.structure_analysis).toBeTruthy();
    expect(blocks.resolvedSkeleton!.structure_analysis).toMatch(/大限|大限一覽|歲|命宮/);
  });

  it("s19 有流月時 getSectionTechnicalBlocks 回傳 S19 卡片內容（非「本章重做中」）", () => {
    const chartJson = {
      features: {
        ziwei: {
          monthlyHoroscope: {
            stem: "甲",
            branch: "寅",
            palace: "疾厄宮",
            mutagenStars: { 祿: "廉貞", 權: "破軍", 科: "武曲", 忌: "太陽" },
          },
        },
      },
      ziwei: {
        starByPalace: {
          命宮: ["紫微", "天梁"],
          兄弟宮: ["廉貞"],
          夫妻宮: ["文昌"],
          子女宮: ["天機", "破軍"],
          財帛宮: ["天同"],
          疾厄宮: [],
          遷移宮: [],
          僕役宮: ["武曲"],
          官祿宮: ["太陽"],
          田宅宮: [],
          福德宮: [],
          父母宮: [],
        },
      },
      yearlyHoroscope: { nominalAge: 44, year: 2025 },
      decadalLimits: [{ palace: "僕役宮", startAge: 44, endAge: 53, stem: "甲" }],
      overlapAnalysis: { items: [] },
    } as Record<string, unknown>;
    const content = {
      lifebookSection: {
        s19: {
          structure_analysis: "本章重做中，敬請期待。",
          behavior_pattern: "",
          blind_spots: "",
          strategic_advice: "",
        },
      },
    } as Record<string, unknown>;
    const blocks = getSectionTechnicalBlocks("s19", chartJson, null, content, "zh-TW");
    expect(blocks.resolvedSkeleton).toBeDefined();
    expect(blocks.resolvedSkeleton?.structure_analysis).toBeTruthy();
    expect(blocks.resolvedSkeleton!.structure_analysis).not.toBe("本章重做中，敬請期待。");
    expect(blocks.resolvedSkeleton!.structure_analysis).toMatch(/【流月引爆點】|本月最有感|本月建議/);
  });
});
