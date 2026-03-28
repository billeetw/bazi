/**
 * P2: chartJson → NormalizedChart。
 * 單一入口，協調 normalizePalaces、normalizeTransforms、resolveCurrentTimeContext。
 */

import { toPalaceCanonical } from "../canonicalKeys.js";
import type { NormalizedChart, BodyPalaceSource, TransformEdge } from "../normalizedChart.js";
import { buildPalaceByBranch, getFlowYearPalace } from "../../palace-map.js";
import {
  buildPalaceStemMap,
  buildGongGanFlows,
  gongGanFlowsToTransformEdges,
  buildDecadalSihuaFlows,
  buildYearlySihuaFlows,
} from "../../gonggan-flows.js";
import { buildPalaces, getStarByPalaceFromChart, readZiweiSoulBranch } from "./normalizePalaces.js";
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

/**
 * 注意：不得以客戶端 mutagenStars 覆寫已依「宮干／流年干 + 十干四化表」算出的邊之 starName。
 * 若 mutagen 與實際用來建邊的干支不一致，覆寫會造成「飛入宮仍按星 A 定位，文案卻變成星 B」，
 * 與命書 s15/s16（純公式）及 S18 敘事互相矛盾。
 */

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
  const palaceStemMap = buildPalaceStemMap(chartJson);
  const starsByPalace = getStarByPalaceFromChart(chartJson);
  const natalFlowEdges = gongGanFlowsToTransformEdges(
    buildGongGanFlows({ layer: "natal", palaceStemMap, starsByPalace })
  );
  assignEdgesToPalaces(palaces, natalFlowEdges, "natal");

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
  const decadalPalace = currentDecade?.palace ? toPalaceCanonical(String(currentDecade.palace).trim()) : "";
  const decadalStem = currentDecade?.stem?.trim();
  const hasDecadal = decadalPalace && (decadalStem || (palaceStemMap[decadalPalace] ?? "").trim());
  const decadeFlowEdges = hasDecadal
    ? gongGanFlowsToTransformEdges(
        buildDecadalSihuaFlows({ palaceStemMap, starsByPalace, decadalPalace, decadalStem: decadalStem ?? undefined })
      )
    : [];
  assignEdgesToPalaces(palaces, decadeFlowEdges, "decade");
  if (currentDecade) {
    currentDecade.transforms = decadeFlowEdges;
    currentDecade.transformSource = "gonggan-formula";
    currentDecade.flows = decadeFlowEdges;
  }

  const liunian = chartJson?.liunian as { palace?: string; branch?: string; stem?: string } | undefined;
  const ziweiCore = (chartJson?.ziwei as { core?: { minggongBranch?: string } } | undefined)?.core;
  const mingBranch = (ziweiCore?.minggongBranch ?? "").trim() || readZiweiSoulBranch(chartJson as Record<string, unknown>);
  const mingSoulBranch = mingBranch.trim() || undefined;
  const palaceByBranch = mingBranch ? buildPalaceByBranch(mingBranch) : undefined;
  const flowYearPalaceLookup = liunian?.branch && palaceByBranch ? getFlowYearPalace(liunian.branch, palaceByBranch) : null;
  const flowYearDestinyPalace = flowYearPalaceLookup
    ? toPalaceCanonical(flowYearPalaceLookup)
    : (liunian?.palace ? toPalaceCanonical(liunian.palace) : undefined);
  const yearlyHoroscope = resolveYearlyHoroscope(
    chartJson?.yearlyHoroscope as RawYearlyHoroscope | undefined,
    flowYearDestinyPalace
  );
  const flowYearPalace = flowYearDestinyPalace ?? "";
  const yearStem =
    (yearlyHoroscope as { stem?: string } | undefined)?.stem?.trim() ??
    (liunian?.stem ?? (chartJson?.yearlyHoroscope as { stem?: string } | undefined)?.stem ?? "").trim();
  const hasYearly = flowYearPalace && yearStem;
  const yearFlowEdges = hasYearly
    ? gongGanFlowsToTransformEdges(buildYearlySihuaFlows({ yearStem, flowYearPalace, starsByPalace }))
    : [];
  assignEdgesToPalaces(palaces, yearFlowEdges, "year");
  if (yearlyHoroscope) {
    yearlyHoroscope.transforms = yearFlowEdges;
    yearlyHoroscope.transformSource = "gonggan-formula";
    yearlyHoroscope.flows = yearFlowEdges;
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
    mingSoulBranch,
    palaceByBranch,
    palaceStemMap: Object.keys(palaceStemMap).length > 0 ? palaceStemMap : undefined,
    palaces,
    natalTransforms: natalFlowEdges,
    natal: { birthTransforms: natalFlowEdges, flows: natalFlowEdges },
    decadalLimits,
    currentDecade,
    yearlyHoroscope,
  };
}
