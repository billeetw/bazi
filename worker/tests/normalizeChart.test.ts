/**
 * Ticket 9: normalizeChart unit tests
 */
import { describe, it, expect } from "vitest";
import { normalizeChart } from "../src/lifebook/normalize/index.js";

const decadalLimits55InPuyi = [
  { palace: "命宮", startAge: 0, endAge: 5 },
  { palace: "僕役宮", startAge: 54, endAge: 63 },
];

describe("normalizeChart", () => {
  it("resolves currentDecade.palace to 僕役宮 when nominalAge=55", () => {
    const chart = normalizeChart({
      yearlyHoroscope: { year: 2026, nominalAge: 55 },
      decadalLimits: decadalLimits55InPuyi,
      overlapAnalysis: { items: [] },
      ziwei: {},
    });
    expect(chart.currentDecade?.palace).toBe("僕役宮");
  });

  it("sets yearlyHoroscope.destinyPalace when liunian.palace provided", () => {
    const chart = normalizeChart({
      yearlyHoroscope: { year: 2026, nominalAge: 55 },
      liunian: { palace: "遷移宮", branch: "午" },
      decadalLimits: decadalLimits55InPuyi,
      overlapAnalysis: { items: [] },
      ziwei: {},
    });
    expect(chart.yearlyHoroscope?.destinyPalace).toBeDefined();
    expect(chart.yearlyHoroscope?.destinyPalace).toBe("遷移宮");
  });

  it("year and decade transforms are not same reference", () => {
    const chart = normalizeChart({
      yearlyHoroscope: { year: 2026, nominalAge: 55 },
      liunian: { palace: "遷移宮" },
      decadalLimits: decadalLimits55InPuyi,
      overlapAnalysis: { items: [] },
      ziwei: {},
    });
    expect(chart.yearlyHoroscope?.transforms).not.toBe(chart.currentDecade?.transforms);
  });

  it("natal.flows are 宮干飛化 (from palaceStemMap + starsByPalace), decade/year flows empty", () => {
    const chart = normalizeChart({
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
    });
    expect(chart.natal?.flows).toBeDefined();
    expect(Array.isArray(chart.natal?.flows)).toBe(true);
    if (chart.natal?.flows && chart.natal.flows.length > 0) {
      const e = chart.natal.flows[0];
      expect(e.fromPalace).toBeTruthy();
      expect(e.toPalace).toBeTruthy();
      expect(e.transform).toMatch(/^(祿|權|科|忌)$/);
      expect(e.starName).toBeTruthy();
    }
    if (chart.currentDecade) expect(chart.currentDecade.flows).toEqual([]);
    if (chart.yearlyHoroscope) expect(chart.yearlyHoroscope.flows).toEqual([]);
  });
});
