/**
 * 流月（S19）時間錨點：以「同一個西曆日」呼叫 iztro horoscope，並用 lunar-typescript 標註節氣換月區間。
 * 預設「現在」= Asia/Taipei 的當日；可選 body.flowMonthSolarDate / horoscopeAsOf（YYYY-MM-DD）覆寫。
 */

import { Lunar, Solar } from "lunar-typescript";

export const FLOW_MONTH_TIMEZONE = "Asia/Taipei";

export function getSolarYmdInTimeZone(date: Date, timeZone: string): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  if (!y || !m || !d) throw new Error("[flowMonth] invalid calendar parts from Intl");
  return { y, m, d };
}

export function parseOptionalYmdString(input: unknown): { y: number; m: number; d: number } | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  const re = /^(\d{4})-(\d{2})-(\d{2})$/;
  const m = re.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

/**
 * 流月錨點西曆日：預設為 timeZone 的「今天」；請求可帶 flowMonthSolarDate 或 horoscopeAsOf。
 */
export function resolveFlowMonthSolarYmd(
  body: Record<string, unknown>,
  now: Date,
  timeZone = FLOW_MONTH_TIMEZONE
): { y: number; m: number; d: number } {
  const fromBody =
    parseOptionalYmdString(body.flowMonthSolarDate) ?? parseOptionalYmdString(body.horoscopeAsOf);
  if (fromBody) return fromBody;
  return getSolarYmdInTimeZone(now, timeZone);
}

/**
 * 傳入 iztro astrolabe.horoscope(anchor) 的單一 Date。
 * 使用台北正午，減少日界與時辰對月柱的邊際影響；第二參數不傳，由 iztro 依錨點推算時柱系統。
 */
export function flowMonthAnchorDateForHoroscope(y: number, m: number, d: number): Date {
  const ys = String(y).padStart(4, "0");
  const ms = String(m).padStart(2, "0");
  const ds = String(d).padStart(2, "0");
  return new Date(`${ys}-${ms}-${ds}T12:00:00+08:00`);
}

/**
 * 以節（jie）為界，標出當前月柱所涵蓋的西曆區間（與 lunar-lite / iztro 月柱「按節換月」一致）。
 */
export function buildFlowMonthSolarTermSpanZh(y: number, m: number, d: number): string {
  try {
    const solar = Solar.fromYmdHms(y, m, d, 12, 0, 0);
    const lunar = solar.getLunar();
    const prev = lunar.getPrevJie(true);
    const next = lunar.getNextJie(true);
    const ps = prev.getSolar().toYmd();
    const ns = next.getSolar().toYmd();
    const pn = prev.getName();
    const nn = next.getName();
    return `節氣換月區間（參考）：自 ${ps}（${pn}）起 ～ ${ns}（${nn}）前（與月柱／流月四化之節氣界線一致；非國曆月初至月底）`;
  } catch {
    return "";
  }
}
