/**
 * P2: 從 chartJson 解析當前大限、流年 context。
 * 不做命理判斷，只做年齡對應與欄位正規化。
 */

import { toPalaceCanonical } from "../canonicalKeys.js";
import type { DecadalLimit, YearScope } from "../normalizedChart.js";

export interface RawDecadalLimit {
  palace?: string;
  startAge?: number;
  endAge?: number;
  stem?: string;
  mutagenStars?: Record<string, string>;
  index?: number;
  palaceIndex?: number;
}

export interface RawYearlyHoroscope {
  age?: number;
  nominalAge?: number;
  year?: number;
  palaceNames?: string[];
  yearlyStem?: string;
  mutagenStars?: Record<string, string>;
}

/**
 * 用 nominalAge 對應 decadalLimits 的 startAge <= nominalAge <= endAge，回傳當前大限。
 */
export function resolveCurrentDecade(
  decadalLimits: RawDecadalLimit[] | undefined,
  nominalAge: number | undefined
): DecadalLimit | undefined {
  if (!Array.isArray(decadalLimits) || decadalLimits.length === 0) return undefined;
  if (nominalAge != null && !Number.isNaN(nominalAge)) {
    const limit = decadalLimits.find(
      (lim) =>
        lim.startAge != null &&
        lim.endAge != null &&
        nominalAge >= lim.startAge &&
        nominalAge <= lim.endAge
    );
    if (limit) return rawLimitToDecadalLimit(limit);
  }
  return rawLimitToDecadalLimit(decadalLimits[0]);
}

function rawLimitToDecadalLimit(raw: RawDecadalLimit): DecadalLimit {
  const palace = toPalaceCanonical((raw.palace ?? "").trim()) || "命宮";
  return {
    palace,
    startAge: raw.startAge ?? 0,
    endAge: raw.endAge ?? 9,
    stem: raw.stem,
    mutagenStars: raw.mutagenStars,
  };
}

/**
 * 將 chartJson.yearlyHoroscope 轉成 YearScope。
 * destinyPalace 來自流年命宮（liunian.palace / branch）。
 */
export function resolveYearlyHoroscope(
  yearlyHoroscope: RawYearlyHoroscope | undefined,
  destinyPalace?: string
): YearScope | undefined {
  if (!yearlyHoroscope || typeof yearlyHoroscope !== "object") return undefined;
  const age = yearlyHoroscope.nominalAge ?? yearlyHoroscope.age;
  const palaceName = destinyPalace
    ? toPalaceCanonical(destinyPalace)
    : (yearlyHoroscope.palaceNames?.[0] ? toPalaceCanonical(yearlyHoroscope.palaceNames[0]) : undefined);
  return {
    year: yearlyHoroscope.year,
    nominalAge: age,
    destinyPalace: palaceName ?? undefined,
    palaceNames: palaceName ? [toPalaceCanonical(palaceName)] : undefined,
    mutagenStars: yearlyHoroscope.mutagenStars,
  };
}
