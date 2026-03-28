import { describe, expect, it } from "vitest";
import { formatDayKeyInTimeZone, resolveTimeContextFromBody, timeContextToJson } from "../src/lifebook/timeContext";

describe("resolveTimeContextFromBody", () => {
  it("uses Asia/Taipei and derives day_key from clientNowISO", () => {
    const tc = resolveTimeContextFromBody({
      clientTimeZone: "Asia/Taipei",
      clientNowISO: "2026-03-27T16:00:00.000Z",
    });
    expect(tc.timeZone).toBe("Asia/Taipei");
    expect(tc.dayKey).toBe("2026-03-28");
    expect(tc.timezoneSource).toBe("client_iana");
  });

  it("falls back to UTC for invalid timezone", () => {
    const tc = resolveTimeContextFromBody({
      clientTimeZone: "Not/AZone",
      clientNowISO: "2026-03-28T12:00:00.000Z",
    });
    expect(tc.timeZone).toBe("UTC");
    expect(tc.dayKey).toBe("2026-03-28");
    expect(tc.timezoneSource).toBe("fallback_utc");
  });
});

describe("timeContextToJson", () => {
  it("exposes contract labels for cache and UX", () => {
    const tc = resolveTimeContextFromBody({
      clientTimeZone: "Asia/Taipei",
      clientNowISO: "2026-03-28T00:00:00.000Z",
    });
    const j = timeContextToJson(tc);
    expect(j.day_key_mode).toBe("civil_client_tz");
    expect(j.timezone_source).toBe("client_iana");
  });
});

describe("formatDayKeyInTimeZone", () => {
  it("matches en-CA calendar day in TZ", () => {
    const dk = formatDayKeyInTimeZone("America/Los_Angeles", new Date("2026-03-28T12:00:00.000Z"));
    expect(dk).toBe("2026-03-28");
  });
});
