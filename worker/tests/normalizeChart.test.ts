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
});
