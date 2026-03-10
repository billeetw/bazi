/**
 * Ticket 9 & 10：模組二顯示與 s16 輸出
 * 驗收：flowYearMingPalace 優先 liunian.palace，不出現「2026年午位」；s16 含流年命宮／流年四化（小限已移除）
 */
import { describe, it, expect } from "vitest";
import { injectTimeModuleDataIntoSection } from "../src/lifeBookPrompts.js";
import { createEmptyFindings } from "../src/lifebook/index.js";

const sectionContent = {} as Parameters<typeof injectTimeModuleDataIntoSection>[3];
const config = null;
const locale = "zh-TW" as const;

describe("buildTimeModuleDisplayFromChartJson (via inject)", () => {
  it("flowYearMingPalace uses liunian.palace and outputs XX宮, not year+branch", () => {
    const chartJson = {
      yearlyHoroscope: { year: 2026, nominalAge: 55 },
      liunian: { palace: "遷移宮", branch: "午", mutagenStars: { lu: "廉貞" } },
      fourTransformations: { liunian: { mutagenStars: { lu: "廉貞" } } },
      overlapAnalysis: { items: [] },
    };
    const template = "流年命宮：{flowYearMingPalace}\n流年四化：{flowYearSihuaLine}";
    const out = injectTimeModuleDataIntoSection(
      "s16",
      template,
      chartJson as Record<string, unknown>,
      sectionContent,
      config,
      locale,
      { findings: createEmptyFindings() }
    );
    expect(out).toContain("流年命宮：");
    expect(out).toContain("流年四化：");
    expect(out).not.toContain("流年命宮：2026年午位");
    expect(out).toMatch(/流年命宮：.*宮/);
  });
});

describe("s16 output shape (Ticket 10)", () => {
  it("s16 contains 流年命宮／流年四化 placeholders resolved", () => {
    const s16Template = "【今年主線與心理濾鏡】\n\n流年命宮：{flowYearMingPalace}\n\n流年四化：{flowYearSihuaLine}\n\n年度角色：{yearRoleInDecade}\n\n建議：{yearOneLineAdvice}";
    const chartJson = {
      yearlyHoroscope: { year: 2026, nominalAge: 55 },
      liunian: { palace: "遷移宮", mutagenStars: { lu: "廉貞" } },
      fourTransformations: { liunian: { mutagenStars: { lu: "廉貞" } } },
      overlapAnalysis: { items: [] },
    };
    const out = injectTimeModuleDataIntoSection(
      "s16",
      s16Template,
      chartJson as Record<string, unknown>,
      sectionContent,
      config,
      locale,
      { findings: createEmptyFindings(), timeContext: { currentDecadePalace: "僕役宮" } }
    );
    expect(out).toContain("流年命宮：");
    expect(out).toContain("流年四化：");
    expect(out).not.toContain("流年命宮：2026年午位");
  });

  it("flowYearMingPalace from branch+mingBranch: 命宮亥、流年午 → 疾厄宮 (1972-08-02 申時男)", () => {
    const chartJson = {
      ziwei: { core: { minggongBranch: "亥" } },
      yearlyHoroscope: { year: 2026, nominalAge: 54 },
      liunian: { branch: "午", mutagenStars: {} },
      fourTransformations: { liunian: { mutagenStars: {} } },
      overlapAnalysis: { items: [] },
    };
    const template = "流年命宮：{flowYearMingPalace}";
    const out = injectTimeModuleDataIntoSection(
      "s16",
      template,
      chartJson as Record<string, unknown>,
      sectionContent,
      config,
      locale,
      { findings: createEmptyFindings() }
    );
    expect(out).toContain("流年命宮：疾厄宮");
  });
});
