/**
 * 產品「語境牆」標籤：**唯一真相** 在 `shared/dayContractSurface.ts`。
 * UI 僅能透過 `surface_label_key` → `surfaceLabelZh(key)` 顯示，禁止自造標題。
 */
export type { SurfaceLabelKey } from "@shared/dayContractSurface";
export {
  SURFACE_LABEL_ZH,
  surfaceLabelZh,
  surfaceLabelKeyFromFallbackTier,
} from "@shared/dayContractSurface";

import type { SurfaceLabelKey } from "@shared/dayContractSurface";
import { surfaceLabelZh } from "@shared/dayContractSurface";

/** @deprecated 請改用 `SurfaceLabelKey` + `surfaceLabelZh` */
export type FlowDaySurfaceKind = "ziwei_daily" | "bazi_day_pillar" | "monthly_reminder";

const LEGACY_TO_KEY: Record<FlowDaySurfaceKind, SurfaceLabelKey> = {
  ziwei_daily: "zwds_daily",
  bazi_day_pillar: "bazi_day",
  monthly_reminder: "monthly",
};

/** @deprecated 請改用 `surfaceLabelZh` */
export function flowDaySurfaceLabel(kind: FlowDaySurfaceKind): string {
  return surfaceLabelZh(LEGACY_TO_KEY[kind]);
}

export const FLOW_DAY_SURFACE_LABEL_ZIWEI_DAILY = surfaceLabelZh("zwds_daily");
export const FLOW_DAY_SURFACE_LABEL_BAZI_DAY = surfaceLabelZh("bazi_day");
export const FLOW_DAY_SURFACE_LABEL_MONTHLY = surfaceLabelZh("monthly");
