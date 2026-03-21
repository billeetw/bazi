import type { BrightnessKey, RiskBias, StarClass } from "./types.js";

export const STAR_CLASS_MULTIPLIER: Record<StarClass, number> = {
  main: 1.0,
  supportive: 0.72,
  minor: 0.58,
  malefic: 0.9,
};

export const BRIGHTNESS_MODIFIER: Record<BrightnessKey, number> = {
  廟: 1.2,
  旺: 1.1,
  得: 1.0,
  平: 0.92,
  陷: 0.78,
};

/** 中等語氣版本：拉動敘事但不恐嚇 */
export const MALEFIC_BIAS_MODERATE: Record<string, RiskBias> = {
  地劫: { pitfallBoost: 1.35, phenomenonBoost: 1.2, corePenalty: 0.9 },
  擎羊: { pitfallBoost: 1.3, phenomenonBoost: 1.18, corePenalty: 0.92 },
  陀羅: { pitfallBoost: 1.22, phenomenonBoost: 1.15, corePenalty: 0.95 },
  火星: { pitfallBoost: 1.28, phenomenonBoost: 1.18, corePenalty: 0.9 },
  鈴星: { pitfallBoost: 1.24, phenomenonBoost: 1.16, corePenalty: 0.94 },
  大耗: { pitfallBoost: 1.32, phenomenonBoost: 1.2, corePenalty: 0.88 },
  地空: { pitfallBoost: 1.2, phenomenonBoost: 1.15, corePenalty: 0.95 },
};

export const DEFAULT_DRIVE_THRESHOLD = 2.8;
