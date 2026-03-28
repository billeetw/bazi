/**
 * DayContract／UI「語境牆」標籤：**唯一**由 `surface_label_key` 驅動文案，禁止前端自造標題。
 * 與 `docs/lifebook-flow-day-feasibility-audit.md` 一致。
 */
export type SurfaceLabelKey = "zwds_daily" | "bazi_day" | "monthly";

export const SURFACE_LABEL_ZH: Record<SurfaceLabelKey, string> = {
  /** 紫微 horoscope.daily 主線成功 */
  zwds_daily: "今日紫微",
  /** 降級至八字日柱／氣運 */
  bazi_day: "今日氣運（八字）",
  /** 降級至流月 */
  monthly: "本月提醒",
};

export function surfaceLabelZh(key: SurfaceLabelKey): string {
  return SURFACE_LABEL_ZH[key];
}

/** 產品 tier（fallback_tier）與 surface key 對齊；無降級之成功流日用 zwds_daily */
export function surfaceLabelKeyFromFallbackTier(
  tier: "none" | "bazi_day" | "monthly",
  successZwds: boolean
): SurfaceLabelKey {
  if (successZwds) return "zwds_daily";
  if (tier === "bazi_day") return "bazi_day";
  return "monthly";
}
