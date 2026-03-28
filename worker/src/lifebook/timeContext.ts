/**
 * 命書 API 時間語境：由前端傳 `clientTimeZone` + `clientNowISO`，後端導出 `day_key`（該時區日曆日）。
 * 用於 KV 快取鍵與後續流日／Timeline 契約對齊。
 */

export type ResolvedTimeContext = {
  /** IANA，例如 Asia/Taipei；無效時回落 UTC */
  timeZone: string;
  /** 該時區下之 YYYY-MM-DD（民曆日曆日，見 `day_key_mode`） */
  dayKey: string;
  /** 與請求對齊之 ISO（若 clientNowISO 無效則為伺服器 now） */
  clientNowISO: string;
  /** 有效 `clientTimeZone` → client_iana；缺/無效 → UTC 回落 */
  timezoneSource: "client_iana" | "fallback_utc";
};

/** 與 `day_key` 演算法一致；若未來新增農曆日界等模式再擴充 union */
export type DayKeyMode = "civil_client_tz";

export type TimeContextJson = {
  time_zone: string;
  day_key: string;
  client_now_iso: string;
  /** 民曆日在 client 時區；非出生「晚子時歸次日」、非農曆日界 */
  day_key_mode: DayKeyMode;
  timezone_source: ResolvedTimeContext["timezoneSource"];
};

/** 驗證 IANA：無效則 false */
export function isValidIanaTimeZone(tz: string): boolean {
  if (!tz || typeof tz !== "string" || tz.length > 120) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz.trim() }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/**
 * 將一個「瞬時」轉成指定時區之日曆日 YYYY-MM-DD。
 */
export function formatDayKeyInTimeZone(timeZone: string, instant: Date): string {
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

/**
 * 由請求 body 解析時間語境；缺欄時以 UTC + 伺服器當前瞬時。
 */
export function resolveTimeContextFromBody(body: {
  clientTimeZone?: string;
  clientNowISO?: string;
}): ResolvedTimeContext {
  const rawTz = typeof body.clientTimeZone === "string" ? body.clientTimeZone.trim() : "";
  const tzOk = isValidIanaTimeZone(rawTz);
  const timeZone = tzOk ? rawTz : "UTC";
  const timezoneSource: ResolvedTimeContext["timezoneSource"] = tzOk ? "client_iana" : "fallback_utc";
  const rawIso = typeof body.clientNowISO === "string" ? body.clientNowISO.trim() : "";
  const parsed = rawIso ? new Date(rawIso) : new Date();
  const instant = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return {
    timeZone,
    dayKey: formatDayKeyInTimeZone(timeZone, instant),
    clientNowISO: instant.toISOString(),
    timezoneSource,
  };
}

export function timeContextToJson(tc: ResolvedTimeContext): TimeContextJson {
  return {
    time_zone: tc.timeZone,
    day_key: tc.dayKey,
    client_now_iso: tc.clientNowISO,
    day_key_mode: "civil_client_tz",
    timezone_source: tc.timezoneSource,
  };
}

/** KV segment：僅允許安全字元，避免鍵過長或特殊字元問題 */
export function sanitizeTimeZoneForKvKey(timeZone: string): string {
  return timeZone.replace(/[^a-zA-Z0-9_+/.\-]/g, "_");
}

export function sanitizeDayKeyForKv(dayKey: string): string {
  const s = dayKey.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return "invalid-date";
}
