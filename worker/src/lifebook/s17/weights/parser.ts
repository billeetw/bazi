import type { PalaceRawInput } from "../palaceNarrative/palaceNarrativeTypes.js";
import { BRIGHTNESS_MODIFIER, MALEFIC_BIAS_MODERATE, STAR_CLASS_MULTIPLIER } from "./config.js";
import { STAR_PALACE_WEIGHTS } from "./registry.js";
import { toCanonicalPalaceName, toDisplayPalaceName } from "./alias.js";
import type { BrightnessKey, StarClass, StarPalaceWeight, WeightedPalaceContext } from "./types.js";

function emptyWeight(): StarPalaceWeight {
  return { core: 0, decision: 0, phenomenon: 0, pitfall: 0 };
}

function starClassOf(star: string, raw: PalaceRawInput): StarClass {
  if (raw.mainStars.includes(star)) return "main";
  if (raw.minorStars.includes(star)) return "supportive";
  // 本版先將 misc 視為 minor；若命中煞星偏置則升為 malefic
  if (MALEFIC_BIAS_MODERATE[star]) return "malefic";
  return "minor";
}

function normalizeB(v: PalaceRawInput["brightness"], star: string): BrightnessKey | undefined {
  const b = v?.[star];
  if (!b) return undefined;
  return b;
}

function applyScore(base: StarPalaceWeight, cls: StarClass, b?: BrightnessKey, star?: string): StarPalaceWeight {
  const classMul = STAR_CLASS_MULTIPLIER[cls];
  const brightnessMul = b ? BRIGHTNESS_MODIFIER[b] ?? 1 : 1;
  const out: StarPalaceWeight = {
    core: base.core * classMul * brightnessMul,
    decision: base.decision * classMul * brightnessMul,
    phenomenon: base.phenomenon * classMul * brightnessMul,
    pitfall: base.pitfall * classMul * brightnessMul,
  };
  if (star && MALEFIC_BIAS_MODERATE[star]) {
    const bias = MALEFIC_BIAS_MODERATE[star];
    out.phenomenon *= bias.phenomenonBoost;
    out.pitfall *= bias.pitfallBoost;
    if (bias.corePenalty) out.core *= bias.corePenalty;
  }
  return out;
}

export function buildWeightedPalaceContext(raw: PalaceRawInput): WeightedPalaceContext {
  const palaceCanonical = toCanonicalPalaceName(raw.palace);
  const palaceDisplay = toDisplayPalaceName(palaceCanonical);
  const all = [...raw.mainStars, ...raw.minorStars, ...raw.miscStars].filter(Boolean);
  const uniq = [...new Set(all.map((s) => s.trim()).filter(Boolean))];
  const stars = uniq.map((star) => {
    const starClass = starClassOf(star, raw);
    const brightness = normalizeB(raw.brightness, star);
    const byPalace = STAR_PALACE_WEIGHTS[star] ?? {};
    const base = byPalace[palaceCanonical] ?? byPalace[palaceDisplay] ?? emptyWeight();
    return {
      star,
      starClass,
      brightness,
      weights: byPalace[palaceCanonical] ?? byPalace[palaceDisplay],
      finalScores: applyScore(base, starClass, brightness, star),
    };
  });
  return { palaceCanonical, palaceDisplay, stars, raw };
}
