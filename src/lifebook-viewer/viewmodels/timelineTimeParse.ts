/** 曆法日 YYYY-MM-DD → 年分（Hero / Rail / telemetry 共用） */
export function parseYearFromDayKey(dayKey: string): number | null {
  const m = /^(\d{4})-\d{2}-\d{2}$/.exec(dayKey.trim());
  if (!m) return null;
  const y = Number(m[1]);
  return Number.isFinite(y) ? y : null;
}
