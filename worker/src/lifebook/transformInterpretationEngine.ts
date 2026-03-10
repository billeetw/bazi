/**
 * 四化飛宮解釋共用引擎：大限／流年／小限／12宮共用同一套資料與優先順序。
 * 優先順序：星+宮+四化矩陣 > 星+四化 > 四化+宮 > fallback 語義組句。
 */

import { findStarPalaceTransformMeaning } from "./starPalaceTransformMatrix.js";
import {
  getStarSemantic,
  getPalaceSemantic,
  getTransformSemantic,
} from "./starSemanticDictionary.js";

// 靜態載入：若 bundler 未把 JSON 打進 lifebook，可改由 index 注入 contentOpts
import starTransformMeaningsData from "../../content/starTransformMeanings.json";
import transformIntoPalaceData from "../../content/transformIntoPalaceMeanings.json";
import decadalThemesData from "../../content/decadalPalaceThemes.json";

type TransformKey = "lu" | "quan" | "ke" | "ji";

const starTransformMeanings: Record<string, { text: string }> =
  starTransformMeaningsData as Record<string, { text: string }>;
const transformIntoPalaceMeanings: Record<string, string> =
  transformIntoPalaceData as Record<string, string>;
const decadalPalaceThemes: Record<
  string,
  { theme: string; narrative: string }
> = (decadalThemesData as { decadalPalaceThemes: Record<string, { theme: string; narrative: string }> })
  .decadalPalaceThemes;

function toTransformKey(t: string): TransformKey | "" {
  const x = (t ?? "").trim().toLowerCase();
  if (x === "lu" || x === "祿") return "lu";
  if (x === "quan" || x === "權") return "quan";
  if (x === "ke" || x === "科") return "ke";
  if (x === "ji" || x === "忌") return "ji";
  return "";
}

function toPalaceCanon(p: string): string {
  const s = (p ?? "").trim();
  if (!s) return "";
  return s.endsWith("宮") ? s : s + "宮";
}

/**
 * 星 × 四化：取 starTransformMeanings 解釋。
 */
export function getStarTransformMeaning(
  star: string,
  transform: string
): string | null {
  const s = (star ?? "").trim();
  const t = toTransformKey(transform);
  if (!s || !t) return null;
  const key = `${s}_${t}`;
  const entry = starTransformMeanings[key];
  return entry?.text ?? null;
}

/**
 * 大限落某宮的十年主題（供 s15 currentDecadalTheme / 主線任務用）。
 * 回傳 decadalPalaceThemes 的 theme（短標）與 narrative（一段敘事）。
 */
export function getDecadalPalaceTheme(palace: string): { theme: string; narrative: string } | null {
  const pal = toPalaceCanon(palace ?? "");
  if (!pal) return null;
  const entry = decadalPalaceThemes[pal];
  return entry ? { theme: entry.theme, narrative: entry.narrative } : null;
}

/**
 * 四化 × 宮位：取 transformIntoPalaceMeanings 解釋。
 */
export function getTransformIntoPalaceMeaning(
  transform: string,
  palace: string
): string | null {
  const t = toTransformKey(transform);
  const pal = toPalaceCanon(palace ?? "");
  if (!t || !pal) return null;
  const key = `${t}_${pal}`;
  return transformIntoPalaceMeanings[key] ?? null;
}

/**
 * 飛宮邊（星從某宮飛入某宮之四化）解釋。
 * 優先順序：1) 星+宮+四化矩陣 2) 星+四化 3) 四化+宮 4) fallback 語義組句。
 */
export function getTransformEdgeMeaning(
  star: string,
  _fromPalace: string,
  toPalace: string,
  transform: string
): string {
  const s = (star ?? "").trim();
  const toPal = toPalaceCanon(toPalace ?? "");
  const t = toTransformKey(transform);
  if (!s || !toPal || !t) return "";

  const matrixMeaning = findStarPalaceTransformMeaning(star, toPal, transform);
  if (matrixMeaning) return matrixMeaning;

  const starTransform = getStarTransformMeaning(star, transform);
  if (starTransform) return starTransform;

  const transformPalace = getTransformIntoPalaceMeaning(transform, toPal);
  if (transformPalace) return transformPalace;

  const starSem = getStarSemantic(star);
  const palSem = getPalaceSemantic(toPal);
  const trSem = getTransformSemantic(t);
  const starPart = starSem?.core ?? star;
  const palPart = palSem?.short ?? palSem?.core ?? toPal;
  const trPart = trSem?.plain ?? trSem?.core ?? t;
  return `${starPart}在此十年與「${palPart}」交會，${trPart}。`;
}

export interface DecadalTransformEdge {
  star: string;
  type: TransformKey;
  toPalace: string;
}

export interface DecadalLimitInput {
  /** 大限命宮宮位名，如 官祿宮 */
  palace: string;
  /** 大限起訖年齡（可選，僅用於顯示） */
  startAge?: number;
  endAge?: number;
  /** 祿權科忌對應的星名（大限天干化出的四化星） */
  luStar?: string;
  quanStar?: string;
  keStar?: string;
  jiStar?: string;
  /** 四化飛入宮位（若無則只出四化底色，不產「飛入哪宮」段落） */
  transforms?: DecadalTransformEdge[];
}

export interface DecadalNarrative {
  /** 1. 十年主線（大限宮位主題） */
  mainline: string;
  /** 2. 四化底色（四化星的解釋） */
  transformBaseline: string[];
  /** 3. 最容易出現的事件／課題（飛宮解釋） */
  eventThemes: string[];
  /** 4. 十年建議（收束） */
  suggestion: string;
}

/**
 * 組出單一大限的四段敘事：十年主線、四化底色、飛宮事件感、十年建議。
 */
export function buildDecadalNarrative(limit: DecadalLimitInput): DecadalNarrative {
  const palace = toPalaceCanon(limit.palace ?? "");
  const themeEntry = palace ? decadalPalaceThemes[palace] : null;
  const mainline =
    themeEntry?.narrative ??
    `這十年大限落在${palace || "某宮"}，該宮主題將成為這段時間的主軸。`;

  const baseline: string[] = [];
  const slots: { star?: string; type: TransformKey }[] = [
    { star: limit.luStar, type: "lu" },
    { star: limit.quanStar, type: "quan" },
    { star: limit.keStar, type: "ke" },
    { star: limit.jiStar, type: "ji" },
  ];
  for (const { star, type } of slots) {
    if (!star) continue;
    const text = getStarTransformMeaning(star, type);
    if (text) baseline.push(text);
  }
  const transformBaseline = baseline.length > 0 ? baseline : ["此大限四化星資訊不足，可依本命與流年疊加再解讀。"];

  const eventThemes: string[] = [];
  if (limit.transforms?.length) {
    for (const edge of limit.transforms) {
      const meaning = getTransformEdgeMeaning(
        edge.star,
        limit.palace,
        edge.toPalace,
        edge.type
      );
      if (meaning) eventThemes.push(meaning);
    }
  }
  if (eventThemes.length === 0) {
    eventThemes.push("可依四化底色，對照該十年實際發生的事業、財帛、感情、健康等面向，觀察哪些領域最常出現機會或壓力。");
  }

  const suggestion =
    themeEntry?.theme != null
      ? `這十年主題是「${themeEntry.theme}」。建議先穩住主線，再依四化落在的宮位，有意識地分配精力：祿權科處可多投入，忌處則留意界線與修復節奏。`
      : "建議依大限宮位主題與四化落點，區分「可多投入」與「需留意界線」的領域，有意識地分配精力與修復時間。";

  return {
    mainline,
    transformBaseline,
    eventThemes,
    suggestion,
  };
}
