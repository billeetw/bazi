/** 與 Worker `resolveTimeContextFromBody` / `timeContextToJson` 對齊（telemetry 與 API 欄位一致）。 */

import type { TimeContextTelemetryPayload } from "../components/home/types";

function isValidIanaTimeZone(tz: string): boolean {
  if (!tz || typeof tz !== "string" || tz.length > 120) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz.trim() }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function formatDayKeyInTimeZone(timeZone: string, instant: Date): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (y && m && d) return `${y}-${m}-${d}`;
  const s = dtf.format(instant);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return instant.toISOString().slice(0, 10);
}

export function getClientTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function getClientNowISO(): string {
  return new Date().toISOString();
}

export function clientTimeContextPayload(): { clientTimeZone: string; clientNowISO: string } {
  return { clientTimeZone: getClientTimeZone(), clientNowISO: getClientNowISO() };
}

/** 與 Worker `time_context` JSON 同形；供 Viewer telemetry 固定附帶。 */
export function buildClientTimeContextTelemetry(instant: Date = new Date()): TimeContextTelemetryPayload {
  const rawTz = getClientTimeZone();
  const tzOk = isValidIanaTimeZone(rawTz);
  const timeZone = tzOk ? rawTz : "UTC";
  const timezoneSource: TimeContextTelemetryPayload["timezone_source"] = tzOk ? "client_iana" : "fallback_utc";
  return {
    time_zone: timeZone,
    day_key: formatDayKeyInTimeZone(timeZone, instant),
    client_now_iso: instant.toISOString(),
    day_key_mode: "civil_client_tz",
    timezone_source: timezoneSource,
  };
}
