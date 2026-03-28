/**
 * Contract for palace section “shell” visuals (static HTML demos + future SectionPalaceTemplate variants).
 * CSS tokens live in `palace-templates/palace-section-shell.css`; this file is the typed mirror for 12-palace differentiation.
 */

/** Canonical 12 palaces (紫微斗數宮位). */
export type PalaceId =
  | "ming"
  | "xiongdi"
  | "fuqi"
  | "zinv"
  | "caibo"
  | "jie"
  | "qianyi"
  | "nuppu"
  | "guanlu"
  | "tianzhai"
  | "fude"
  | "fumu";

/** 紫微盤十二宮順序（與 Home 矩陣一致）；供 hash / 校驗用 */
export const PALACE_ID_ORDER: readonly PalaceId[] = [
  "ming",
  "xiongdi",
  "fuqi",
  "zinv",
  "caibo",
  "jie",
  "qianyi",
  "nuppu",
  "guanlu",
  "tianzhai",
  "fude",
  "fumu",
];

/** Core orb / “藍星” presentation (maps to --core-blue* in shell CSS). */
export interface PalaceCoreOrbTheme {
  /** Primary fill / glow hue, e.g. sky blue for 命宮 baseline. */
  coreColor: string;
  dimGlow: string;
  /** Optional label for devtools / future CMS (not necessarily shown in UI). */
  label?: string;
}

/** SVG path strings for dual lifelines (yang trunk + flow, yin trunk + flow). */
export interface PalaceLifelinePaths {
  yangTrunk: string;
  yangFlow: string;
  yinTrunk: string;
  yinFlow: string;
}

/** Warm/cool accent for gradients and micro-ornaments per palace. */
export interface PalaceTemperatureTokens {
  /** 0 = cool, 1 = warm (semantic; rendering maps to gradients). */
  warmth: number;
  /** Optional accent for arc / highlights. */
  accent?: string;
}

/** Full per-palace theme row — extend when wiring React; static demos may only use a subset. */
export interface PalaceVisualTheme {
  palaceId: PalaceId;
  coreOrb: PalaceCoreOrbTheme;
  /** When omitted, shell default paths (命宮) apply. */
  lifelines?: Partial<PalaceLifelinePaths>;
  temperature?: PalaceTemperatureTokens;
}

/** Baseline 命宮 theme — matches current `palace-section-shell.css` defaults. */
export const PALACE_VISUAL_BASELINE_MING: PalaceVisualTheme = {
  palaceId: "ming",
  coreOrb: {
    coreColor: "#38bdf8",
    dimGlow: "rgba(56, 189, 248, 0.38)",
    label: "命宮 · baseline",
  },
  temperature: { warmth: 0.35, accent: "#d4af37" },
};

export type { LifelineFamily, PalacePresetRow, PalaceThemePresetFile } from "./palaceThemePresets";
export {
  getLifelinePathsForPalace,
  LIFELINE_FAMILIES,
  PALACE_THEME_FILE,
  PALACE_THEME_PRESETS,
  resolvePalacePreset,
} from "./palaceThemePresets";
