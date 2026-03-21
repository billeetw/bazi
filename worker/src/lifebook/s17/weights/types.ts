import type { PalaceRawInput } from "../palaceNarrative/palaceNarrativeTypes.js";

export type WeightLayer = "core" | "decision" | "phenomenon" | "pitfall";

export type StarClass = "main" | "supportive" | "minor" | "malefic";

export type BrightnessKey = "廟" | "旺" | "得" | "平" | "陷";

export type StarPalaceWeight = {
  core: number;
  decision: number;
  phenomenon: number;
  pitfall: number;
};

export type RiskBias = {
  pitfallBoost: number;
  phenomenonBoost: number;
  corePenalty?: number;
};

export type StarBaseProfile = {
  tags?: string[];
  tendencies?: Record<string, number>;
};

export type WeightedStarItem = {
  star: string;
  starClass: StarClass;
  brightness?: BrightnessKey;
  weights?: StarPalaceWeight;
  finalScores: StarPalaceWeight;
};

export type WeightedPalaceContext = {
  palaceCanonical: string;
  palaceDisplay: string;
  stars: WeightedStarItem[];
  raw: PalaceRawInput;
};
