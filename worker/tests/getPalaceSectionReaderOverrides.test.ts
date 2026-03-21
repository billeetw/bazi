/**
 * 逐宮讀者敘事：getPalaceSectionReaderOverrides 應以 NormalizedChart 新模板覆寫 structure_analysis。
 */
import { describe, expect, it } from "vitest";
import { getPalaceSectionReaderOverrides } from "../src/lifeBookPrompts.js";
import { normalizeChart } from "../src/lifebook/normalize/index.js";
import type { AssembleContentLookup } from "../src/lifeBookTemplates.js";

const minimalContent = {
  stars: {},
  starPalacesMain: {},
  starPalacesAux: {},
  starPalacesAuxAction: {},
  lifebookSection: {
    s02: {
      structure_analysis: "舊骨架 {{palaceName}}",
      behavior_pattern: "行為 {{palaceName}}",
      blind_spots: "盲點",
      strategic_advice: "建議",
    },
  },
} as unknown as AssembleContentLookup;

const chartJson = {
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
  palaceStemMap: {
    命宮: "壬", 兄弟宮: "癸", 夫妻宮: "甲", 子女宮: "乙", 財帛宮: "丙", 疾厄宮: "丁",
    遷移宮: "戊", 僕役宮: "己", 官祿宮: "庚", 田宅宮: "辛", 福德宮: "壬", 父母宮: "癸",
  },
} as Record<string, unknown>;

describe("getPalaceSectionReaderOverrides", () => {
  it("s02 命宮 uses new palace narrative template in resolvedStructureAnalysis", () => {
    const norm = normalizeChart(chartJson);
    const out = getPalaceSectionReaderOverrides(
      "s02",
      chartJson,
      null,
      minimalContent,
      "zh-TW",
      undefined,
      norm
    );
    expect(out).not.toBeNull();
    expect(out!.resolvedStructureAnalysis).toBeDefined();
    expect(out!.resolvedStructureAnalysis!.length).toBeGreaterThan(100);
    expect(out!.resolvedStructureAnalysis).toContain("【星曜結構解析】");
    expect(out!.resolvedStructureAnalysis).toContain("命宮");
    expect(out!.resolvedStructureAnalysis).not.toContain("舊骨架");
    expect(out!.behavior_pattern.length).toBeGreaterThan(0);
  });

  it("s02 命宮：starByPalace 鍵為「命」時仍應命中新模板（宮名正規化）", () => {
    const chartAlt = {
      ziwei: {
        starByPalace: {
          命: ["太陰", "祿存", "恩光", "天才"],
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
      palaceStemMap: {
        命宮: "壬",
        兄弟宮: "癸",
        夫妻宮: "甲",
        子女宮: "乙",
        財帛宮: "丙",
        疾厄宮: "丁",
        遷移宮: "戊",
        僕役宮: "己",
        官祿宮: "庚",
        田宅宮: "辛",
        福德宮: "壬",
        父母宮: "癸",
      },
    } as Record<string, unknown>;
    const norm = normalizeChart(chartAlt);
    const out = getPalaceSectionReaderOverrides(
      "s02",
      chartAlt,
      null,
      minimalContent,
      "zh-TW",
      undefined,
      norm
    );
    expect(out?.resolvedStructureAnalysis).toContain("【星曜結構解析】");
    expect(out?.resolvedStructureAnalysis).toContain("你是怎麼一路走到現在的（命宮）");
    expect(out?.resolvedStructureAnalysis).not.toContain("【這一宮正在發生什麼】");
  });
});
