/**
 * P2: 從 chartJson.ziwei 產出 PalaceStructure[]。
 * 宮位一律 canonical 為 X宮；星曜分類為主星／輔星／煞星／雜曜。
 */

import { toPalaceCanonical } from "../canonicalKeys.js";
import { toBrightnessCanonical } from "../normalizedChart.js";
import type { PalaceStructure, StarInPalace, TransformEdge } from "../normalizedChart.js";
import { PALACES } from "../schema.js";
import { STAR_ID_TO_NAME } from "../schema.js";

const CANONICAL_PALACE_ORDER = PALACES.map((p) => toPalaceCanonical(p.name));

/** 14 主星中文名 */
const MAIN_STAR_NAMES = new Set(
  (Object.values(STAR_ID_TO_NAME) as string[]).filter(Boolean)
);

/** 輔星／文星／財星／貴人 */
const ASSISTANT_NAMES = new Set([
  "文昌", "文曲", "左輔", "右弼", "祿存", "天魁", "天鉞", "天馬", "天姚", "咸池",
]);

/** 煞星 */
const SHA_NAMES = new Set([
  "擎羊", "陀羅", "火星", "鈴星", "地空", "地劫", "天刑", "天傷",
]);

function toStarInPalace(name: string, brightness?: string, natalTransform?: string | null): StarInPalace {
  const b = toBrightnessCanonical(brightness);
  return {
    name: name.trim(),
    brightness: b,
    natalTransform: natalTransform as StarInPalace["natalTransform"] ?? undefined,
  };
}

function classifyStars(starNames: string[]): { main: StarInPalace[]; assistant: StarInPalace[]; sha: StarInPalace[]; misc: StarInPalace[] } {
  const main: StarInPalace[] = [];
  const assistant: StarInPalace[] = [];
  const sha: StarInPalace[] = [];
  const misc: StarInPalace[] = [];
  for (const n of starNames) {
    const s = (n ?? "").trim();
    if (!s) continue;
    const star = toStarInPalace(s);
    if (MAIN_STAR_NAMES.has(s)) main.push(star);
    else if (ASSISTANT_NAMES.has(s)) assistant.push(star);
    else if (SHA_NAMES.has(s)) sha.push(star);
    else misc.push(star);
  }
  return { main, assistant, sha, misc };
}

/** 從 chartJson 取出宮位→星曜對應（中文宮名或 id 皆可）。 */
export function getStarByPalaceFromChart(chartJson: Record<string, unknown> | undefined): Map<string, string[]> {
  const map = new Map<string, string[]>();
  if (!chartJson?.ziwei || typeof chartJson.ziwei !== "object") return map;
  const z = chartJson.ziwei as Record<string, unknown>;
  const core = z.core as Record<string, unknown> | undefined;
  const basic = z.basic as Record<string, unknown> | undefined;
  let starByPalace = z.starByPalace ?? core?.starByPalace ?? basic?.starByPalace;
  if (starByPalace && typeof starByPalace === "object" && !Array.isArray(starByPalace)) {
    const raw = starByPalace as Record<string, unknown>;
    for (const [key, val] of Object.entries(raw)) {
      const palaceCanon = toPalaceCanonical(key);
      if (!palaceCanon) continue;
      const list = Array.isArray(val) ? (val as unknown[]).map((s) => typeof s === "string" ? s.trim() : String(s)).filter(Boolean) : [];
      if (list.length > 0) map.set(palaceCanon, list);
    }
  }
  const mainStars = z.mainStars as Record<string, string[] | unknown> | undefined;
  if (mainStars && typeof mainStars === "object" && map.size === 0) {
    for (const [key, val] of Object.entries(mainStars)) {
      const palaceCanon = toPalaceCanonical(key);
      if (!palaceCanon) continue;
      const list = Array.isArray(val) ? (val as string[]).map((s) => (s ?? "").trim()).filter(Boolean) : [];
      if (list.length > 0) map.set(palaceCanon, list);
    }
  }
  return map;
}

function emptyTransforms(): TransformEdge[] {
  return [];
}

/**
 * 產出 12 宮 PalaceStructure[]，順序依 CANONICAL_PALACE_ORDER。
 * 每宮的 transformsIn/Out 由 normalizeChart 事後填入。
 */
export function buildPalaces(
  chartJson: Record<string, unknown> | undefined,
  _options?: { natalTransformsByPalace?: Map<string, { in: TransformEdge[]; out: TransformEdge[] }> }
): PalaceStructure[] {
  const starByPalace = getStarByPalaceFromChart(chartJson);
  return CANONICAL_PALACE_ORDER.map((palace) => {
    const names = starByPalace.get(palace) ?? [];
    const { main, assistant, sha, misc } = classifyStars(names);
    return {
      palace,
      mainStars: main,
      assistantStars: assistant,
      shaStars: sha,
      miscStars: misc,
      natalTransformsIn: emptyTransforms(),
      natalTransformsOut: emptyTransforms(),
      decadalTransformsIn: emptyTransforms(),
      decadalTransformsOut: emptyTransforms(),
      yearlyTransformsIn: emptyTransforms(),
      yearlyTransformsOut: emptyTransforms(),
    };
  });
}
