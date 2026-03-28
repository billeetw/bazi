import { describe, expect, it } from "vitest";
import { formatDayKeyInTimeZone } from "../src/lifebook/timeContext.js";
import {
  anchorDateForDayKeyInTimeZone,
  buildDailyFlowResult,
  validateDayContractV1,
} from "../src/lifebook/dailyFlow.js";
import { getSolarYmdInTimeZone } from "../src/flowMonthContext.js";

describe("anchorDateForDayKeyInTimeZone", () => {
  it("Asia/Taipei：錨點日與該時區日曆日一致", () => {
    const d = anchorDateForDayKeyInTimeZone("2026-03-28", "Asia/Taipei");
    const ymd = getSolarYmdInTimeZone(d, "Asia/Taipei");
    expect(ymd).toEqual({ y: 2026, m: 3, d: 28 });
  });

  it("Asia/Taipei：跨日邊界 — UTC 仍為前一日時，day_key 應為台北次日", () => {
    const instant = new Date("2026-03-27T16:00:00.000Z");
    const dk = formatDayKeyInTimeZone("Asia/Taipei", instant);
    expect(dk).toBe("2026-03-28");
    const anchor = anchorDateForDayKeyInTimeZone(dk, "Asia/Taipei");
    expect(getSolarYmdInTimeZone(anchor, "Asia/Taipei")).toEqual({ y: 2026, m: 3, d: 28 });
  });

  it("America/Los_Angeles：DST 切換日（2026-03-08 入夏令）錨點仍對齊當日曆日", () => {
    const dayKey = "2026-03-08";
    const d = anchorDateForDayKeyInTimeZone(dayKey, "America/Los_Angeles");
    expect(getSolarYmdInTimeZone(d, "America/Los_Angeles")).toEqual({ y: 2026, m: 3, d: 8 });
  });

  it("同一 UTC 瞬時在不同 timeZone 下 day_key 可不同", () => {
    const instant = new Date("2026-07-14T16:00:00.000Z");
    const tp = formatDayKeyInTimeZone("Asia/Taipei", instant);
    const la = formatDayKeyInTimeZone("America/Los_Angeles", instant);
    expect(tp).toBe("2026-07-15");
    expect(la).toBe("2026-07-14");
  });
});

describe("buildDailyFlowResult", () => {
  it("produces valid DayContractV1（surface_label 與 key 綁定）", () => {
    const chart: Record<string, unknown> = {
      gender: "M",
      birthInfo: { year: 1990, month: 5, day: 15, hour: 10, minute: 0 },
    };
    const out = buildDailyFlowResult({
      chart_json: chart,
      day_key: "2026-03-28",
      timeIndex: 5,
      time_zone: "Asia/Taipei",
    });
    const v = validateDayContractV1(out);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.value.surface_label_key).toBeDefined();
      expect(["zwds_daily", "bazi_day", "monthly"]).toContain(v.value.surface_label_key);
    }
  });
});
