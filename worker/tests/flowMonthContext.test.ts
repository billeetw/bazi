import { describe, it, expect } from "vitest";
import {
  parseOptionalYmdString,
  resolveFlowMonthSolarYmd,
  flowMonthAnchorDateForHoroscope,
  buildFlowMonthSolarTermSpanZh,
} from "../src/flowMonthContext.js";

describe("flowMonthContext", () => {
  it("parseOptionalYmdString accepts YYYY-MM-DD", () => {
    expect(parseOptionalYmdString("2026-03-07")).toEqual({ y: 2026, m: 3, d: 7 });
    expect(parseOptionalYmdString(" 2026-03-07 ")).toEqual({ y: 2026, m: 3, d: 7 });
    expect(parseOptionalYmdString("bad")).toBeNull();
  });

  it("resolveFlowMonthSolarYmd uses body.flowMonthSolarDate when set", () => {
    const fixed = new Date("2020-01-15T00:00:00Z");
    expect(
      resolveFlowMonthSolarYmd({ flowMonthSolarDate: "2026-08-01" }, fixed, "Asia/Taipei")
    ).toEqual({ y: 2026, m: 8, d: 1 });
  });

  it("flowMonthAnchorDateForHoroscope is noon Taipei", () => {
    const d = flowMonthAnchorDateForHoroscope(2026, 3, 7);
    expect(d.toISOString()).toContain("2026-03-07");
    expect(d.getUTCHours()).toBe(4);
  });

  it("buildFlowMonthSolarTermSpanZh returns Chinese span for mid-year", () => {
    const s = buildFlowMonthSolarTermSpanZh(2026, 6, 15);
    expect(s).toContain("節氣換月區間");
    expect(s).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
