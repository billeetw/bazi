/**
 * P2: chartJson → NormalizedChart。
 * 單一入口，協調 normalizePalaces、normalizeTransforms、resolveCurrentTimeContext。
 */

import { toPalaceCanonical } from "../canonicalKeys.js";
import type { NormalizedChart, BodyPalaceSource, TransformEdge, TransformDisplay } from "../normalizedChart.js";
import { computeFlowYearPalaceFromBranch } from "../../palace-map.js";
import { buildPalaces } from "./normalizePalaces.js";
import { getTransformsByLayer } from "./normalizeTransforms.js";
import {
  resolveCurrentDecade,
  resolveYearlyHoroscope,
  type RawDecadalLimit,
  type RawYearlyHoroscope,
} from "./resolveCurrentTimeContext.js";

function assignEdgesToPalaces(
  palaces: NormalizedChart["palaces"],
  edges: TransformEdge[],
  layer: "natal" | "decade" | "year"
): void {
  const inKey = layer === "natal" ? "natalTransformsIn" : layer === "decade" ? "decadalTransformsIn" : "yearlyTransformsIn";
  const outKey = layer === "natal" ? "natalTransformsOut" : layer === "decade" ? "decadalTransformsOut" : "yearlyTransformsOut";
  for (const e of edges) {
    const toPalace = e.toPalace;
    const fromPalace = e.fromPalace;
    const pTo = palaces.find((p) => p.palace === toPalace);
    const pFrom = palaces.find((p) => p.palace === fromPalace);
    if (pTo) (pTo as Record<string, TransformEdge[]>)[inKey].push(e);
    if (pFrom) (pFrom as Record<string, TransformEdge[]>)[outKey].push(e);
  }
}

/** 依四化類型從 mutagenStars（祿/權/科/忌 或 lu/quan/ke/ji）取星名 */
function starFromMutagen(mutagenStars: Record<string, string> | undefined, transform: TransformDisplay): string | undefined {
  if (!mutagenStars || typeof mutagenStars !== "object") return undefined;
  const t = transform as string;
  return mutagenStars[t] ?? mutagenStars[t === "祿" ? "lu" : t === "權" ? "quan" : t === "科" ? "ke" : "ji"];
}

/** 用該層權威 mutagenStars 覆寫邊的 starName，使四化流向與目前大限／流年四化顯示一致 */
function overwriteEdgeStarNames(edges: TransformEdge[], mutagenStars: Record<string, string> | undefined): void {
  if (!edges?.length || !mutagenStars) return;
  for (const e of edges) {
    const star = starFromMutagen(mutagenStars, e.transform);
    if (star) e.starName = star;
  }
}

function resolveShenGongSource(chartJson: Record<string, unknown>): BodyPalaceSource | undefined {
  if (chartJson.shenGong != null && String(chartJson.shenGong).trim()) return "chart.shenGong";
  if (chartJson.bodyPalace != null && String(chartJson.bodyPalace).trim()) return "chart.bodyPalace";
  return undefined;
}

/**
 * 單一入口：chartJson → NormalizedChart。
 * 解析順序：生年四化 → 大限四化 → 流年四化。禁止 yearlyTransforms = decadalTransforms 作為 fallback。
 */
export function normalizeChart(chartJson: Record<string, unknown> | undefined): NormalizedChart {
  const chartId = (chartJson?.chartId as string) ?? "";
  const locale = (chartJson?.locale as string) ?? "zh-TW";
  const nominalAge = (chartJson?.yearlyHoroscope as RawYearlyHoroscope | undefined)?.nominalAge
    ?? (chartJson?.yearlyHoroscope as RawYearlyHoroscope | undefined)?.age;
  const flowYear = (chartJson?.yearlyHoroscope as RawYearlyHoroscope | undefined)?.year;

  const palaces = buildPalaces(chartJson);
  const { natal: natalTransforms, decade: decadeTransforms, year: yearTransforms } = getTransformsByLayer(chartJson);
  assignEdgesToPalaces(palaces, natalTransforms, "natal");
  assignEdgesToPalaces(palaces, decadeTransforms, "decade");
  assignEdgesToPalaces(palaces, yearTransforms, "year");

  const decadalLimitsRaw = chartJson?.decadalLimits as RawDecadalLimit[] | undefined;
  const decadalLimits = Array.isArray(decadalLimitsRaw)
    ? decadalLimitsRaw.map((lim) => ({
        palace: toPalaceCanonical((lim.palace ?? "").trim()) || "命宮",
        startAge: lim.startAge ?? 0,
        endAge: lim.endAge ?? 9,
        stem: lim.stem,
        mutagenStars: lim.mutagenStars,
      }))
    : [];
  const currentDecade = resolveCurrentDecade(decadalLimitsRaw, nominalAge);
  if (currentDecade) {
    currentDecade.transforms = decadeTransforms;
    currentDecade.transformSource = "overlap.decade";
    overwriteEdgeStarNames(decadeTransforms, currentDecade.mutagenStars);
    currentDecade.flows = [...decadeTransforms];
  }

  const liunian = chartJson?.liunian as { palace?: string; branch?: string } | undefined;
  const ziweiCore = (chartJson?.ziwei as { core?: { minggongBranch?: string } } | undefined)?.core;
  const mingBranch = ziweiCore?.minggongBranch ?? "";
  const computedFlowYearPalace = liunian?.branch && mingBranch ? computeFlowYearPalaceFromBranch(liunian.branch, mingBranch) : null;
  const flowYearDestinyPalace = computedFlowYearPalace
    ? toPalaceCanonical(computedFlowYearPalace)
    : (liunian?.palace ? toPalaceCanonical(liunian.palace) : undefined);
  const yearlyHoroscope = resolveYearlyHoroscope(
    chartJson?.yearlyHoroscope as RawYearlyHoroscope | undefined,
    flowYearDestinyPalace
  );
  if (yearlyHoroscope) {
    yearlyHoroscope.transforms = yearTransforms;
    yearlyHoroscope.transformSource = "liunian.mutagenStars|fourTransformations.liunian|overlap.year";
    overwriteEdgeStarNames(yearTransforms, yearlyHoroscope.mutagenStars);
    yearlyHoroscope.flows = [...yearTransforms];
  }

  const shenGongSource = chartJson ? resolveShenGongSource(chartJson) : undefined;
  let shenGong: string | undefined;
  if (chartJson?.shenGong != null && String(chartJson.shenGong).trim()) {
    shenGong = toPalaceCanonical(String(chartJson.shenGong).trim());
  } else if (chartJson?.bodyPalace != null && String(chartJson.bodyPalace).trim()) {
    shenGong = toPalaceCanonical(String(chartJson.bodyPalace).trim());
  }

  return {
    chartId,
    locale,
    nominalAge,
    flowYear,
    mingGong: toPalaceCanonical("命宮") || "命宮",
    shenGong,
    shenGongSource: shenGong ? shenGongSource : undefined,
    lifeLord: chartJson?.lifeLord as string | undefined,
    bodyLord: chartJson?.bodyLord as string | undefined,
    palaces,
    natalTransforms,
    natal: { birthTransforms: natalTransforms, flows: [...natalTransforms] },
    decadalLimits,
    currentDecade,
    yearlyHoroscope,
  };
}
