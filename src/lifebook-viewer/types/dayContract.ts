/**
 * 與 Worker `DayContractV1`（`worker/src/lifebook/dailyFlow.ts`）對齊；UI 標題僅能透過 `surface_label_key` → `surfaceLabelZh`。
 */
import type { SurfaceLabelKey } from "@shared/dayContractSurface";

export type DayFlowFallbackReason = "daily_incomplete" | "no_destiny_palace" | "parse_failed" | "monthly_only";

export type DayContractV1 = {
  day_key: string;
  time_zone: string;
  time_index: number;
  palace: string | null;
  flows: unknown[];
  signals: string[];
  anchors: string[];
  surface_label_key: SurfaceLabelKey;
  surface_label: string;
  is_fallback: boolean;
  fallback_tier?: "bazi_day" | "monthly";
  fallback_reason?: DayFlowFallbackReason;
  missing?: string[];
};
