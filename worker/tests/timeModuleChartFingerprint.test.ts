import { describe, expect, it } from "vitest";
import {
  buildTimeModuleChartFingerprint,
  isTimeModuleS17S19ReaderSnapshotStale,
} from "../src/lifebook/timeModuleChartFingerprint.js";
import { mergeInjectP2TimeModuleS17S19Snapshot } from "../src/lifebook/timeModuleS17S19ReaderSnapshot.js";

describe("buildTimeModuleChartFingerprint", () => {
  it("is stable for the same chart", () => {
    const chart = {
      chartId: "a1",
      ziwei: {
        monthlyHoroscope: { solarYear: 2026, solarMonth: 3, stem: "甲", branch: "寅", palace: "命宮" },
      },
      yearlyHoroscope: { year: 2026, nominalAge: 40 },
      decadalLimits: [{ palace: "命宮", startAge: 0, endAge: 9, stem: "甲" }],
    } as Record<string, unknown>;
    expect(buildTimeModuleChartFingerprint(chart)).toBe(buildTimeModuleChartFingerprint(chart));
  });

  it("changes when monthlyHoroscope stem changes", () => {
    const base = {
      ziwei: { monthlyHoroscope: { stem: "甲", branch: "寅", palace: "命宮" } },
    } as Record<string, unknown>;
    const other = {
      ziwei: { monthlyHoroscope: { stem: "乙", branch: "寅", palace: "命宮" } },
    } as Record<string, unknown>;
    expect(buildTimeModuleChartFingerprint(base)).not.toBe(buildTimeModuleChartFingerprint(other));
  });
});

describe("isTimeModuleS17S19ReaderSnapshotStale", () => {
  it("false when snapshot has no fingerprint (legacy)", () => {
    expect(
      isTimeModuleS17S19ReaderSnapshotStale(
        { palaceOverlayBlocks: "x", s18SignalsBlocks: "", s19MonthlyBlocks: "" },
        { chartId: "z" }
      )
    ).toBe(false);
  });

  it("false when fingerprint matches", () => {
    const chart = { ziwei: { monthlyHoroscope: { stem: "丙" } } } as Record<string, unknown>;
    const fp = buildTimeModuleChartFingerprint(chart);
    expect(
      isTimeModuleS17S19ReaderSnapshotStale(
        {
          palaceOverlayBlocks: "",
          s18SignalsBlocks: "",
          s19MonthlyBlocks: "",
          chartInputFingerprint: fp,
        },
        chart
      )
    ).toBe(false);
  });

  it("true when fingerprint mismatches", () => {
    const chart = { ziwei: { monthlyHoroscope: { stem: "丙" } } } as Record<string, unknown>;
    expect(
      isTimeModuleS17S19ReaderSnapshotStale(
        {
          palaceOverlayBlocks: "",
          s18SignalsBlocks: "",
          s19MonthlyBlocks: "",
          chartInputFingerprint: "deadbeef",
        },
        chart
      )
    ).toBe(true);
  });
});

describe("mergeInjectP2TimeModuleS17S19Snapshot fingerprint", () => {
  it("skips inject when chartJson mismatches fingerprint", () => {
    const chart = { ziwei: { monthlyHoroscope: { stem: "甲" } } } as Record<string, unknown>;
    const map: Record<string, string> = {};
    mergeInjectP2TimeModuleS17S19Snapshot(
      map,
      {
        palaceOverlayBlocks: "OVERLAY",
        s18SignalsBlocks: "",
        s19MonthlyBlocks: "",
        chartInputFingerprint: "wrong",
      },
      "s17",
      chart
    );
    expect(map.palaceOverlayBlocks).toBeUndefined();
  });

  it("injects when fingerprint matches", () => {
    const chart = { ziwei: { monthlyHoroscope: { stem: "甲" } } } as Record<string, unknown>;
    const fp = buildTimeModuleChartFingerprint(chart);
    const map: Record<string, string> = {};
    mergeInjectP2TimeModuleS17S19Snapshot(
      map,
      {
        palaceOverlayBlocks: "OVERLAY",
        s18SignalsBlocks: "",
        s19MonthlyBlocks: "",
        chartInputFingerprint: fp,
      },
      "s17",
      chart
    );
    expect(map.palaceOverlayBlocks).toBe("OVERLAY");
  });
});
