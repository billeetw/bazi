/**
 * Star name: Chinese (zh-CN/zh-TW) -> en-US key.
 * Built from data/star-registry.json via scripts/build-star-registry.js
 */
import starRegistry from "../content/star-registry.json";

type StarEntry = { zh: string; zhVariants?: string[]; en: string };

function buildZhToEn(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of (starRegistry as { stars: StarEntry[] }).stars) {
    out[s.zh] = s.en;
    if (s.zhVariants) for (const v of s.zhVariants) out[v] = s.en;
  }
  return out;
}

export const ZH_STAR_TO_EN: Record<string, string> = buildZhToEn();

export function toEnStarKey(zhStarName: string, language: string): string {
  if (language === "en-US") {
    return ZH_STAR_TO_EN[zhStarName] ?? zhStarName;
  }
  return zhStarName;
}
