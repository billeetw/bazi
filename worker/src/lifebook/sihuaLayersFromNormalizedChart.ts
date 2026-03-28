/**
 * 四化「顯示層」與 normalizeChart 收斂：mutagenStars 仍來自 chartJson 權威，
 * 星曜**落宮**一律由 NormalizedChart.palaces 推導，不再經 assembleInput.starByPalace（雙軌）。
 */

import type { BuiltSiHuaLayer, BuiltSiHuaStar } from "./builtSiHuaTypes.js";
import { toPalaceCanonical } from "./canonicalKeys.js";
import type { NormalizedChart } from "./normalizedChart.js";

export type MutagenStarsRecord = Record<string, string>;

const FALLBACK_PALACE = "落宮待核";

/** 由 NormalizedChart 建「星中文名 → 宮位名（含宮）」；與宮干飛化 findPalaceByStar 同源盤面。 */
export function buildStarNameToPalaceFromNormalizedChart(chart: NormalizedChart): Record<string, string> {
  const m: Record<string, string> = {};
  for (const p of chart.palaces) {
    const names = [
      ...p.mainStars.map((s) => s.name),
      ...p.assistantStars.map((s) => s.name),
      ...p.shaStars.map((s) => s.name),
      ...p.miscStars.map((s) => s.name),
    ];
    for (const n of names) {
      const t = (n ?? "").trim();
      if (t) m[t] = toPalaceCanonical(p.palace);
    }
  }
  return m;
}

/**
 * 以 mutagenStars + 本命盤星曜落點組一層 BuiltSiHuaLayer（舊 layerFromMutagen 的星曜定位改為只吃 NormalizedChart）。
 */
export function layerFromMutagenWithStarMap(
  mutagen: MutagenStarsRecord | undefined,
  starNameToPalace: Record<string, string>
): BuiltSiHuaLayer | null {
  if (!mutagen || typeof mutagen !== "object") return null;

  const toStar = (key: "祿" | "權" | "科" | "忌", type: BuiltSiHuaStar["transformType"]): BuiltSiHuaStar | null => {
    const starName = mutagen[key];
    if (!starName || typeof starName !== "string") return null;
    const rawPalace = starNameToPalace[starName.trim()];
    if (rawPalace && rawPalace.trim() && rawPalace !== FALLBACK_PALACE) {
      const palaceKey = toPalaceCanonical(rawPalace.trim());
      const palaceName = palaceKey.endsWith("宮") ? palaceKey : palaceKey + "宮";
      return { starName, palaceKey, palaceName, transformType: type };
    }
    return { starName, palaceKey: FALLBACK_PALACE, palaceName: FALLBACK_PALACE, transformType: type };
  };

  const lu = toStar("祿", "lu");
  const quan = toStar("權", "quan");
  const ke = toStar("科", "ke");
  const ji = toStar("忌", "ji");
  if (!lu && !quan && !ke && !ji) return null;
  return { lu: lu ?? null, quan: quan ?? null, ke: ke ?? null, ji: ji ?? null };
}

/** @deprecated Use BuiltSiHuaStar */
export type SiHuaStarResolved = BuiltSiHuaStar;
/** @deprecated Use BuiltSiHuaLayer */
export type SiHuaLayerResolved = BuiltSiHuaLayer;

/** 大限四化：優先 currentDecade（與 nominalAge 對齊），避免誤用 decadalLimits[0]。 */
export function resolveDecadalMutagenStars(
  chartJson: Record<string, unknown>,
  chart?: NormalizedChart
): MutagenStarsRecord | undefined {
  if (chart?.currentDecade?.mutagenStars && typeof chart.currentDecade.mutagenStars === "object") {
    return chart.currentDecade.mutagenStars as MutagenStarsRecord;
  }
  const ft = chartJson.fourTransformations as {
    dalimit?: { mutagenStars?: MutagenStarsRecord };
    decadal?: { mutagenStars?: MutagenStarsRecord };
  } | undefined;
  const decadalLimits = chartJson.decadalLimits as Array<{ mutagenStars?: MutagenStarsRecord }> | undefined;
  return ft?.dalimit?.mutagenStars ?? ft?.decadal?.mutagenStars ?? decadalLimits?.[0]?.mutagenStars;
}

/** 流年四化：優先 yearlyHoroscope / liunian，與 normalizeChart 一致。 */
export function resolveYearlyMutagenStars(
  chartJson: Record<string, unknown>,
  chart?: NormalizedChart
): MutagenStarsRecord | undefined {
  if (chart?.yearlyHoroscope?.mutagenStars && typeof chart.yearlyHoroscope.mutagenStars === "object") {
    return chart.yearlyHoroscope.mutagenStars as MutagenStarsRecord;
  }
  const ft = chartJson.fourTransformations as {
    liunian?: { mutagenStars?: MutagenStarsRecord };
    yearly?: { mutagenStars?: MutagenStarsRecord };
  } | undefined;
  const yearlyHoroscope = chartJson.yearlyHoroscope as { mutagenStars?: MutagenStarsRecord } | undefined;
  const liunian = chartJson.liunian as { mutagenStars?: MutagenStarsRecord } | undefined;
  return ft?.liunian?.mutagenStars ?? ft?.yearly?.mutagenStars ?? yearlyHoroscope?.mutagenStars ?? liunian?.mutagenStars;
}
