/**
 * Palace theme presets — config + lifeline path families (see `palace-templates/palace-theme-presets.json`).
 * Base template = one shell; differences = tokens + SVG paths + core orb variant (CSS).
 */

import type { PalaceId } from "./palaceVisualTheme";
import raw from "../../../palace-templates/palace-theme-presets.json";

export type LifelineFamily = "balanced" | "sharp" | "wave" | "spiral" | "broken";

export interface PalaceLifelinePaths {
  yangTrunk: string;
  yangFlow: string;
  yinTrunk: string;
  yinFlow: string;
}

export interface PalacePresetRow {
  displayNameZh: string;
  subtitleZh: string;
  lifelineFamily: LifelineFamily;
  /** Same as palace id — drives `[data-palace]` orb skin in CSS. */
  coreOrbVariant: PalaceId;
  symbolGlyph: string;
  lifelineModifiers?: {
    /** 財帛：中段聚合感 — thicker trunk / flow in CSS */
    aggregateMid?: boolean;
  };
}

export interface PalaceThemePresetFile {
  lifelineFamilies: Record<LifelineFamily, PalaceLifelinePaths>;
  palaces: Record<PalaceId, PalacePresetRow>;
}

export const PALACE_THEME_FILE = raw as PalaceThemePresetFile;

export const LIFELINE_FAMILIES = PALACE_THEME_FILE.lifelineFamilies;

export const PALACE_THEME_PRESETS = PALACE_THEME_FILE.palaces;

export function getLifelinePathsForPalace(id: PalaceId): PalaceLifelinePaths {
  const row = PALACE_THEME_PRESETS[id];
  const fam = row.lifelineFamily;
  return LIFELINE_FAMILIES[fam];
}

/** Fallback `ming` if unknown id — keeps UI stable. */
export function resolvePalacePreset(palaceId: string): { palaceId: PalaceId; row: PalacePresetRow } {
  const row = PALACE_THEME_PRESETS[palaceId as PalaceId];
  if (row) return { palaceId: palaceId as PalaceId, row };
  return { palaceId: "ming", row: PALACE_THEME_PRESETS.ming };
}
