import { describe, expect, it } from "vitest";
import { enrichTelemetryPayload } from "../src/lifebook-viewer/utils/telemetryContext";

describe("enrichTelemetryPayload time_context", () => {
  it("補齊 time_context 全量欄位", () => {
    const out = enrichTelemetryPayload({ app_surface: "root" });
    expect(out.time_context?.day_key_mode).toBe("civil_client_tz");
    expect(out.time_context?.time_zone).toBeTruthy();
    expect(out.time_context?.client_now_iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(out.time_context?.timezone_source === "client_iana" || out.time_context?.timezone_source === "fallback_utc").toBe(
      true
    );
  });

  it("保留呼叫端傳入的 time_context（例如 API 回應）", () => {
    const api = {
      time_zone: "Asia/Taipei",
      day_key: "2026-03-28",
      client_now_iso: "2026-03-28T12:00:00.000Z",
      day_key_mode: "civil_client_tz" as const,
      timezone_source: "client_iana" as const,
    };
    const out = enrichTelemetryPayload({ time_context: api });
    expect(out.time_context).toEqual(api);
  });
});
