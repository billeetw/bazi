/**
 * Ticket 9 & 10：模組二顯示與 s16 輸出
 * 驗收：flowYearMingPalace 優先 liunian.palace，不出現「2026年午位」；s16 含流年命宮／流年四化（小限已移除）
 */
import { describe, it, expect } from "vitest";
import {
  injectTimeModuleDataIntoSection,
  getPlaceholderMapFromContext,
  buildSihuaTimeBlocksFromChart,
} from "../src/lifeBookPrompts.js";
import { buildFlyStarExplanation } from "../src/lifebook/index.js";
import { createEmptyFindings } from "../src/lifebook/index.js";
import type { LifebookFindingsV2 } from "../src/lifebook/v2/schema/findingsV2.js";
import { buildPalaceStarNarrativeBlock } from "../src/lifebook/starNarrativeForPalace.js";

const sectionContent = {} as Parameters<typeof injectTimeModuleDataIntoSection>[3];
const HEADING_STAR_IN_PALACE = "【星曜在本宮表現】";
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

describe("P0.4: 模組二時間真值", () => {
  it("大限四化與流年四化不同時，輸出不可相同", () => {
    const chartJson = {
      decadalLimits: [{ startAge: 33, endAge: 42, palace: "財帛宮", mutagenStars: { lu: "天同", quan: "天機" } }],
      yearlyHoroscope: { year: 2026, nominalAge: 36 },
      liunian: { palace: "遷移宮", branch: "午", mutagenStars: { lu: "廉貞", ji: "破軍" } },
      fourTransformations: {
        decadal: { mutagenStars: { lu: "天同", quan: "天機" } },
        liunian: { mutagenStars: { lu: "廉貞", ji: "破軍" } },
      },
      overlapAnalysis: { items: [] },
    };
    const template = "大限四化：{currentDecadeSihuaLine}\n流年四化：{flowYearSihuaLine}";
    const out = injectTimeModuleDataIntoSection(
      "s16",
      template,
      chartJson as Record<string, unknown>,
      sectionContent,
      config,
      locale,
      undefined
    );
    const lines = out.split("\n");
    const decadalLine = lines.find((l) => l.startsWith("大限四化："));
    const flowLine = lines.find((l) => l.startsWith("流年四化："));
    expect(decadalLine).toBeDefined();
    expect(flowLine).toBeDefined();
    expect(decadalLine).not.toEqual(flowLine);
  });

  it("flowYearMingPalace 必須顯示實際宮位（s20 不出現字面「流年命宮」）", () => {
    const chartJson = {
      decadalLimits: [{ startAge: 33, endAge: 42, palace: "命宮" }],
      yearlyHoroscope: { year: 2026, nominalAge: 36 },
      liunian: { palace: "財帛宮", branch: "午", mutagenStars: { lu: "廉貞" } },
      fourTransformations: { liunian: { mutagenStars: { lu: "廉貞" } } },
      overlapAnalysis: { items: [] },
    };
    const template = "【今年】{s20YearLine}";
    const out = injectTimeModuleDataIntoSection(
      "s20",
      template,
      chartJson as Record<string, unknown>,
      sectionContent,
      config,
      locale,
      undefined
    );
    expect(out).not.toContain("流年命宮");
    expect(out).toContain("財帛宮");
  });

  it("s15 structure_analysis 內不可再出現「小限：」", () => {
    const chartJson = {
      decadalLimits: [{ startAge: 33, endAge: 42, palace: "命宮" }],
      yearlyHoroscope: { year: 2026, nominalAge: 36 },
      liunian: { palace: "財帛宮", branch: "午", mutagenStars: {} },
      fourTransformations: { liunian: { mutagenStars: {} } },
      overlapAnalysis: { items: [] },
    };
    const s15Snippet = "目前大限：\n宮位：{currentDecadalPalace}\n四化：{currentDecadeSihuaLine}\n\n目前流年：\n命宮：{flowYearMingPalace}\n四化：{flowYearSihuaLine}";
    const out = injectTimeModuleDataIntoSection(
      "s15",
      s15Snippet,
      chartJson as Record<string, unknown>,
      sectionContent,
      config,
      locale,
      undefined
    );
    expect(out).not.toContain("小限：");
  });
});

describe("P0.6: s15a key-level fallback", () => {
  it("s15a V2-primary with only scores still fills overlap + shock/mine/wealth", () => {
    const findingsV2: LifebookFindingsV2 = {
      timeWindowScores: [
        { windowType: "decade", decadeRange: { start: 33, end: 42 }, wealthScore: 60, careerScore: 65, assetScore: 50, partnershipScore: 55, cashflowRiskScore: 40, pressureScore: 45 },
      ],
    } as LifebookFindingsV2;
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
      findingsV2,
    });
    expect(map.timeWindowScoresSummary).toBeDefined();
    expect((map.timeWindowScoresSummary ?? "").trim()).not.toBe("");
    expect(map.overlapSummary).toBeDefined();
    expect((map.overlapSummary ?? "").trim()).not.toBe("");
    expect(map.shockCount).toBeDefined();
    expect((map.shockCount ?? "").trim()).not.toBe("");
    expect(map.mineCount).toBeDefined();
    expect((map.mineCount ?? "").trim()).not.toBe("");
    expect(map.wealthCount).toBeDefined();
    expect((map.wealthCount ?? "").trim()).not.toBe("");
  });

  it("s15a V2-primary with only events still fills fallback blocks", () => {
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
      overlapAnalysis: {
        items: [
          { tag: "mine", palaceName: "官祿宮" },
          { tag: "wealth", palaceName: "財帛宮" },
        ],
      },
    };
    const map = getPlaceholderMapFromContext(null, {
      chartJson,
      sectionKey: "s15a",
      findingsV2,
    });
    expect(map.eventProbabilitiesSummary).toBeDefined();
    expect((map.eventProbabilitiesSummary ?? "").trim()).not.toBe("");
    expect(map.shockBlocks).toBeDefined();
    expect(map.mineBlocks).toBeDefined();
    expect(map.wealthBlocks).toBeDefined();
  });

  it("s15a full V2 does not get fallback overwrite", () => {
    const findingsV2: LifebookFindingsV2 = {
      stackSignals: [
        { stackType: "lu_ji_collision", palace: "財帛宮", theme: "祿忌相撞", layers: ["natal", "decade"], transforms: ["祿", "忌"] },
      ],
      timeWindowScores: [
        { windowType: "decade", decadeRange: { start: 33, end: 42 }, wealthScore: 60, careerScore: 65, assetScore: 50, partnershipScore: 55, cashflowRiskScore: 40, pressureScore: 45 },
      ],
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
      overlapAnalysis: { items: [{ tag: "wealth", palaceName: "遷移宮" }] },
    };
    const map = getPlaceholderMapFromContext(null, {
      chartJson,
      sectionKey: "s15a",
      findingsV2,
    });
    expect(map.overlapSummary).toContain("劇烈震盪");
    expect(map.shockCount).toBe("1");
    expect(map.mineCount).toBe("0");
    expect(map.wealthCount).toBe("0");
    expect(map.overlapSummary).toContain("1 個宮位");
    expect(map.overlapSummary).toContain("0 個宮位");
  });
});

/** 產出「時間軸校對總覽」與「四化飛星技術版」實際字串，供人工檢查。執行：npm test -- lifeBookPrompts-module2.test.ts -t "時間軸與四化飛星實際輸出" */
describe("時間軸與四化飛星實際輸出（供檢查）", () => {
  it("logs 時間軸校對總覽 + 四化飛星技術版 for a fixture chart", () => {
    const chartJson = {
      birthInfo: { year: 1972 },
      fourTransformations: {
        benming: { mutagenStars: { 祿: "天梁", 權: "紫微", 科: "左輔", 忌: "武曲" } },
        decadal: { mutagenStars: { 祿: "廉貞", 權: "破軍", 科: "武曲", 忌: "太陽" } },
        liunian: { mutagenStars: { 祿: "天同", 權: "天機", 科: "文昌", 忌: "廉貞" } },
      },
      ziwei: {
        core: { minggongBranch: "亥" },
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
      decadalLimits: [
        { startAge: 44, endAge: 53, palace: "僕役宮", stem: "甲", mutagenStars: { 祿: "廉貞", 權: "破軍", 科: "武曲", 忌: "太陽" } },
      ],
      yearlyHoroscope: { year: 2026, nominalAge: 54, stem: "丙" },
      liunian: { palace: "疾厄宮", branch: "午", mutagenStars: { 祿: "天同", 權: "天機", 科: "文昌", 忌: "廉貞" } },
      overlapAnalysis: {
        items: [
          {
            palaceKey: "siblings",
            palaceName: "兄弟宮",
            transformations: [
              { layerLabel: "大限", starName: "廉貞", typeLabel: "化祿", type: "祿", fromPalaceName: "兄弟宮", toPalaceName: "僕役宮" },
              { layerLabel: "大限", starName: "破軍", typeLabel: "化權", type: "權", fromPalaceName: "兄弟宮", toPalaceName: "官祿宮" },
              { layerLabel: "大限", starName: "武曲", typeLabel: "化科", type: "科", fromPalaceName: "兄弟宮", toPalaceName: "田宅宮" },
              { layerLabel: "大限", starName: "太陽", typeLabel: "化忌", type: "忌", fromPalaceName: "兄弟宮", toPalaceName: "遷移宮" },
              { layerLabel: "流年", starName: "天同", typeLabel: "化祿", type: "祿", fromPalaceName: "疾厄宮", toPalaceName: "財帛宮" },
              { layerLabel: "流年", starName: "天機", typeLabel: "化權", type: "權", fromPalaceName: "疾厄宮", toPalaceName: "子女宮" },
              { layerLabel: "流年", starName: "文昌", typeLabel: "化科", type: "科", fromPalaceName: "疾厄宮", toPalaceName: "夫妻宮" },
              { layerLabel: "流年", starName: "廉貞", typeLabel: "化忌", type: "忌", fromPalaceName: "疾厄宮", toPalaceName: "僕役宮" },
            ],
          },
        ],
      },
    } as Record<string, unknown>;

    const sihuaTime = buildSihuaTimeBlocksFromChart(chartJson);
    const map = getPlaceholderMapFromContext(null, {
      chartJson,
      sectionKey: "s15",
      content: sectionContent,
      config,
      contentLocale: locale,
    });

    const timeAxis = sihuaTime.timeAxis;
    const timelineSnippet = [
      "【時間軸校對總覽】",
      "",
      "生年四化：",
      timeAxis?.birthSihuaLine ?? "",
      "",
      "目前大限：",
      `宮位：${timeAxis?.currentDecadalPalace ?? ""}`,
      `四化：${timeAxis?.currentDecadeSihuaLine ?? ""}`,
      "",
      "目前流年：",
      `命宮：${timeAxis?.flowYearMingPalace ?? ""}`,
      `四化：${timeAxis?.flowYearSihuaLine ?? ""}`,
      timeAxis?.flowYearSihuaNote ?? "",
      timeAxis?.flowYearSihuaFlyBlock ?? "",
    ]
      .filter(Boolean)
      .join("\n");

    const decadalTech = map.decadalFourTransformBlocks ?? "";
    const flowYearFly = timeAxis?.flowYearSihuaFlyBlock ?? "";

    // eslint-disable-next-line no-console
    console.log("\n========== 時間軸校對總覽 ==========\n" + timelineSnippet);
    // eslint-disable-next-line no-console
    console.log("\n========== 四化飛星技術版（大限） ==========\n" + (decadalTech || "（無）"));
    // eslint-disable-next-line no-console
    console.log("\n========== 流年四化飛星（時間軸內，同 timeAxis.flowYearSihuaFlyBlock） ==========\n" + (flowYearFly || "（無）"));

    const sampleExplanation = buildFlyStarExplanation("廉貞", "祿", "兄弟宮", "僕役宮");
    // eslint-disable-next-line no-console
    console.log("\n========== 大限飛星解釋範例（星+四化+路徑組句，廉貞化祿 兄弟→僕役） ==========\n" + (sampleExplanation || "（無）"));

    const decadalExplanations = map.decadalFourTransformExplanations ?? "";
    // eslint-disable-next-line no-console
    console.log("\n========== 大限四條飛星解釋（decadalFourTransformExplanations） ==========\n" + (decadalExplanations || "（無）"));

    expect(timeAxis?.currentDecadeSihuaLine).toContain("廉貞");
    expect(timeAxis?.currentDecadeSihuaLine).toContain("破軍");
    expect(timeAxis?.currentDecadeSihuaLine).toContain("武曲");
    expect(timeAxis?.currentDecadeSihuaLine).toContain("太陽");
    expect(timeAxis?.currentDecadeSihuaLine).not.toEqual(timeAxis?.flowYearSihuaLine);
    expect(decadalTech).toContain("大限");
    expect(decadalTech).toMatch(/自.*宮出.*飛入.*宮/);
    expect(timeAxis?.flowYearSihuaFlyBlock ?? "").toContain("流年");
    // 核心功課必須用大限四化星，不可出現流年星
    const homework = map.currentDecadalHomework ?? "";
    expect(homework).toMatch(/破軍|武曲|太陽|廉貞/);
    expect(homework).not.toMatch(/天同化祿|天機化權|文昌化科/);
    // 四化飛星技術版四條，第一條為廉貞化祿；解釋與技術版一致（第一段為化祿）
    const techLines = (map.decadalFourTransformBlocks ?? "").split("\n").filter((s) => s.trim().startsWith("-"));
    expect(techLines).toHaveLength(4);
    expect(techLines[0]).toContain("廉貞化祿");
    expect(decadalExplanations).toContain("廉貞化祿");
    expect(decadalExplanations).not.toContain("廉貞化科"); // 第一條是化祿不是化科
  });

  it("大限四化 fallback：無 decadalLimits[].mutagenStars 時用 fourTransformations.decadal", () => {
    const chartJson = {
      birthInfo: { year: 1972 },
      fourTransformations: {
        benming: { mutagenStars: { 祿: "天梁", 權: "紫微", 科: "左輔", 忌: "武曲" } },
        decadal: { mutagenStars: { 祿: "廉貞", 權: "破軍", 科: "武曲", 忌: "太陽" } },
        liunian: { mutagenStars: { 祿: "天同", 權: "天機", 科: "文昌", 忌: "廉貞" } },
      },
      decadalLimits: [{ startAge: 44, endAge: 53, palace: "僕役宮" }],
      yearlyHoroscope: { year: 2026, nominalAge: 54 },
      liunian: { palace: "疾厄宮", branch: "午", mutagenStars: { 祿: "天同", 權: "天機", 科: "文昌", 忌: "廉貞" } },
      overlapAnalysis: { items: [] },
    } as Record<string, unknown>;

    const sihuaTime = buildSihuaTimeBlocksFromChart(chartJson);
    const map = getPlaceholderMapFromContext(null, {
      chartJson,
      sectionKey: "s15",
      content: sectionContent,
      config,
      contentLocale: locale,
    });

    expect(sihuaTime.timeAxis?.currentDecadeSihuaLine).toContain("廉貞");
    expect(sihuaTime.timeAxis?.currentDecadeSihuaLine).toContain("破軍");
    expect(sihuaTime.timeAxis?.currentDecadeSihuaLine).not.toEqual(sihuaTime.timeAxis?.flowYearSihuaLine);
    const homework = map.currentDecadalHomework ?? "";
    expect(homework).toMatch(/破軍|武曲|太陽|廉貞/);
    expect(homework).not.toMatch(/天同化祿|文昌化科/);
  });
});

describe("12宮【星曜在本宮表現】只出現一次", () => {
  it("buildPalaceStarNarrativeBlock 輸出不包含標題，標題僅由模板提供一次", () => {
    const ctx = {
      palaceName: "命宮",
      stars: [{ name: "紫微", strength: "廟", baseMeaning: "帝星", meaningInPalace: "在此宮主導方向。", actionAdvice: "" }],
    } as Parameters<typeof buildPalaceStarNarrativeBlock>[0];
    const out = buildPalaceStarNarrativeBlock(ctx);
    const count = (out.match(/【星曜在本宮表現】/g) ?? []).length;
    expect(count).toBe(0);
  });

  it("12宮 placeholder 內容不含標題，組裝後標題僅來自模板一處", () => {
    const chartJson = {
      ziwei: {
        palaces: [
          { name: "命宮", majorStars: [{ name: "紫微" }], minorStars: [] },
        ],
        mainStars: { 命宮: ["紫微"] },
      },
    } as Record<string, unknown>;
    const map = getPlaceholderMapFromContext(null, {
      chartJson,
      sectionKey: "s02",
      content: sectionContent,
      config,
      contentLocale: locale,
    });
    const coreTraits = (map.palaceCoreTraits ?? "").trim();
    const starBehavior = (map.palaceStarBehavior ?? "").trim();
    expect((coreTraits.match(new RegExp(HEADING_STAR_IN_PALACE, "g")) ?? []).length).toBe(0);
    expect((starBehavior.match(new RegExp(HEADING_STAR_IN_PALACE, "g")) ?? []).length).toBe(0);
  });
});
