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

/** En key or zh variant -> canonical zh (for starPalaces key building to match content-zh-TW). */
function buildToCanonicalZh(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of (starRegistry as { stars: StarEntry[] }).stars) {
    out[s.en] = s.zh;
    out[s.zh] = s.zh;
    if (s.zhVariants) for (const v of s.zhVariants) out[v] = s.zh;
  }
  return out;
}

export const ZH_STAR_TO_EN: Record<string, string> = buildZhToEn();
export const STAR_TO_CANONICAL_ZH: Record<string, string> = buildToCanonicalZh();

export function toEnStarKey(zhStarName: string, language: string): string {
  if (language === "en-US") {
    return ZH_STAR_TO_EN[zhStarName] ?? zhStarName;
  }
  return zhStarName;
}

/** Normalize star name to canonical zh (for building content-zh-TW starPalaces keys). */
export function toZhStarKey(rawName: string): string {
  const t = rawName?.trim();
  return (t && STAR_TO_CANONICAL_ZH[t]) ?? t ?? "";
}
