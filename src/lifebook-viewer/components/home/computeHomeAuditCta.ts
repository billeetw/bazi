import type { LifeBookViewerState } from "../../types";
import { resolvePalacePreset } from "../../themes/palaceThemePresets";
import type { HomeAuditCta, HomeOracleTextForCta } from "./types";
import { computeFocus } from "./computeFocus";

export type { HomeOracleTextForCta } from "./types";

/**
 * Step 1：從命書 state + Home oracle 文案 → 推薦單一宮位 → 產生 CTA（`#palace-*`，於 Home 開宮位閱讀層）。
 * 與 Matrix / Timeline 共用 `computeFocus`。
 */
export function computeHomeAuditCta(state: LifeBookViewerState, homeText: HomeOracleTextForCta): HomeAuditCta | null {
  const focus = computeFocus(state, { oracleTexts: homeText });
  if (!focus) return null;

  const { row } = resolvePalacePreset(focus.primaryPalaceId);
  const display = row.displayNameZh;

  return {
    palaceId: focus.primaryPalaceId,
    leadLine: `現在最該優先調整的面向：${display}`,
    reasonLine: focus.reasonLine,
    ctaLabel: `查看${display} →`,
    href: `#palace-${focus.primaryPalaceId}`,
  };
}
