/**
 * 命書宇宙敘事 — 單一 design token 來源（與 tokens.css 同步）
 * 用途：inline style、Canvas/SVG、與 CSS var 名稱常數。
 */

export const cssVar = {
  coreVoidBase: "--lb-core-void-base",
  coreSpace: "--lb-core-space",
  coreTextMain: "--lb-core-text-main",
  coreTextBody: "--lb-core-text-body",
  coreTextMuted: "--lb-core-text-muted",
  glowAbyss: "--lb-glow-abyss",
  glowSpore: "--lb-glow-spore",
  glowGold: "--lb-glow-gold",
  glowCyan: "--lb-glow-cyan",
  palaceTrunkCore: "--lb-palace-trunk-core",
  palaceTrunkPulse: "--lb-palace-trunk-pulse",
  gateOpenAccent: "--lb-gate-open-accent",
  gateTeaserAmber: "--lb-gate-teaser-amber",
  gateTeaserBg: "--lb-gate-teaser-bg",
  gateLockedRose: "--lb-gate-locked-rose",
  gateLockedBorder: "--lb-gate-locked-border",
  glassPanel: "--lb-glass-panel",
  glassBorder: "--lb-glass-border",
  glassHighlight: "--lb-glass-highlight",
} as const;

/** 與 :root 預設值一致（動畫／canvas 用；一般 UI 請用 CSS var） */
export const tokens = {
  core: {
    voidBase: "#020408",
    space: "#020617",
    textMain: "#f8fafc",
    textBody: "#cbd5e1",
    textMuted: "#94a3b8",
  },
  glow: {
    abyss: "rgba(12, 38, 50, 0.5)",
    spore: "rgba(212, 175, 55, 0.08)",
    gold: "rgba(245, 158, 11, 0.4)",
    cyan: "rgba(56, 189, 248, 0.35)",
  },
  palace: {
    trunkCore: "#d4af37",
    trunkPulse: "rgba(255, 255, 255, 0.85)",
  },
  gate: {
    openAccent: "#38bdf8",
    teaserAmber: "#f59e0b",
    teaserBg: "rgba(245, 158, 11, 0.12)",
    lockedRose: "#fda4af",
    lockedBorder: "rgba(225, 29, 72, 0.35)",
  },
  glass: {
    panel: "rgba(15, 23, 42, 0.45)",
    border: "rgba(255, 255, 255, 0.06)",
    highlight: "rgba(255, 255, 255, 0.03)",
  },
} as const;

export type TokenNamespace = keyof typeof tokens;
