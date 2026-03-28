import { describe, expect, it } from "vitest";
import { canonicalizeChartJsonForLifebook } from "../src/lifebook/canonicalizeChartJsonForLifebook.js";

const fakeDecadal = [{ palace: "命宮", startAge: 0, endAge: 9, stem: "甲" }];

describe("canonicalizeChartJsonForLifebook", () => {
  it("promotes features.ziwei to root ziwei and bazi", () => {
    const z = { core: { minggongBranch: "子" } };
    const out = canonicalizeChartJsonForLifebook({
      features: { ziwei: z, bazi: { year: 1990 } },
    })!;
    expect(out.ziwei).toBe(z);
    expect(out.bazi).toEqual({ year: 1990 });
  });

  it("aliases monthly → monthlyHoroscope on ziwei when horoscope missing", () => {
    const monthly = { stem: "甲", branch: "寅", palace: "命宮" };
    const out = canonicalizeChartJsonForLifebook({
      ziwei: { monthly },
    })!;
    const zw = out.ziwei as Record<string, unknown>;
    expect(zw.monthlyHoroscope).toEqual(monthly);
    expect(zw.monthly).toBe(monthly);
  });

  it("does not overwrite existing monthlyHoroscope", () => {
    const a = { stem: "甲" };
    const b = { stem: "乙" };
    const out = canonicalizeChartJsonForLifebook({
      ziwei: { monthlyHoroscope: a, monthly: b },
    })!;
    expect((out.ziwei as Record<string, unknown>).monthlyHoroscope).toBe(a);
  });

  it("promotes yearlyHoroscope and liunian from ziwei to root", () => {
    const y = { year: 2026, nominalAge: 35 };
    const l = { stem: "丙", branch: "午" };
    const out = canonicalizeChartJsonForLifebook({
      ziwei: { yearlyHoroscope: y, liunian: l },
    })!;
    expect(out.yearlyHoroscope).toBe(y);
    expect(out.liunian).toBe(l);
  });

  it("syncs iztro decadalLimits to root and ziwei", () => {
    const out = canonicalizeChartJsonForLifebook({
      features: { ziwei: { decadalLimits: fakeDecadal } },
    })!;
    expect(out.decadalLimits).toBe(fakeDecadal);
    expect((out.ziwei as Record<string, unknown>).decadalLimits).toBe(fakeDecadal);
  });

  it("default: keeps root decadal when no iztro but root non-empty", () => {
    const rootDl = [{ palace: "遷移宮", startAge: 10, endAge: 19 }];
    const out = canonicalizeChartJsonForLifebook({
      decadalLimits: rootDl,
      ziwei: { core: {} },
    })!;
    expect(out.decadalLimits).toBe(rootDl);
    expect((out.ziwei as Record<string, unknown>).decadalLimits).toBe(rootDl);
  });

  it("default: does not force [] when no decadal anywhere", () => {
    const out = canonicalizeChartJsonForLifebook({
      ziwei: { core: {} },
    })!;
    expect(out.decadalLimits).toBeUndefined();
  });

  it("emptyDecadalLimitsWhenNoIztro: forces [] when no iztro", () => {
    const out = canonicalizeChartJsonForLifebook(
      {
        ziwei: { core: {} },
        decadalLimits: [{ palace: "命宮", startAge: 0, endAge: 9 }],
      },
      { emptyDecadalLimitsWhenNoIztro: true }
    )!;
    expect(out.decadalLimits).toEqual([]);
    expect((out.ziwei as Record<string, unknown>).decadalLimits).toEqual([]);
  });

  it("emptyDecadalLimitsWhenNoIztro: still uses iztro when present", () => {
    const out = canonicalizeChartJsonForLifebook(
      {
        features: { ziwei: { decadalLimits: fakeDecadal } },
      },
      { emptyDecadalLimitsWhenNoIztro: true }
    )!;
    expect(out.decadalLimits).toBe(fakeDecadal);
  });
});
