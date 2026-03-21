/**
 * 四化流向生成器：僅依 NormalizedChart 各層 transforms 產出敘事，禁止使用 overlapAnalysis.summary。
 * 正確順序：先各層獨立拿 transforms → 各層獨立算 from/to → 再篩選哪些 flows 命中該宮位 → 顯示。
 */

import type { NormalizedChart, TransformEdge } from "../normalizedChart.js";
import { toPalaceCanonical } from "../normalizedChart.js";

const LAYER_PREFIX: Record<TransformEdge["layer"], string> = {
  natal: "本命",
  decade: "大限",
  year: "流年",
};

/**
 * 單層四化邊 → 多行「星名化X：從XX宮出，入XX宮」
 */
export function buildLayerFlows(edges: TransformEdge[] | undefined): string[] {
  if (!edges?.length) return [];
  return edges.map((e) => {
    const star = e.starName ?? "星";
    const line = `${star}化${e.transform}：從${e.fromPalace}出，入${e.toPalace}`;
    return line;
  });
}

/**
 * 單層四化邊 → 單一區塊字串（換行連接，每行前加層名）
 */
export function buildLayerFlowBlock(edges: TransformEdge[] | undefined, layer: TransformEdge["layer"]): string {
  const lines = buildLayerFlows(edges);
  if (lines.length === 0) return "";
  const prefix = LAYER_PREFIX[layer];
  return lines.map((l) => `${prefix}${l}`).join("\n");
}

export interface TransformFlowLines {
  natal: string[];
  decade: string[];
  year: string[];
}

/**
 * 依 chart 三層 flows 產出流向敘事。模組二一律只讀 NormalizedChart.*.flows。
 */
export function buildTransformFlowLines(chart: NormalizedChart): TransformFlowLines {
  return {
    natal: buildLayerFlows(chart.natal?.flows ?? chart.natal?.birthTransforms ?? chart.natalTransforms),
    decade: buildLayerFlows(chart.currentDecade?.flows),
    year: buildLayerFlows(chart.yearlyHoroscope?.flows),
  };
}

/**
 * 產出模組二可用的「本命宮干飛化」區塊字串（僅 natal 有 flows；大限／流年為四化落宮，不產 from→to）
 */
export function formatTransformFlowBlocks(chart: NormalizedChart): string {
  const flows = buildTransformFlowLines(chart);
  const parts: string[] = [];
  if (flows.natal.length) parts.push(flows.natal.map((l) => `本命${l}`).join("\n"));
  if (flows.decade.length) parts.push(flows.decade.map((l) => `大限${l}`).join("\n"));
  if (flows.year.length) parts.push(flows.year.map((l) => `流年${l}`).join("\n"));
  return parts.join("\n\n");
}

function filterEdgesByPalace(edges: TransformEdge[] | undefined, palaceCanon: string): TransformEdge[] {
  if (!edges?.length || !palaceCanon) return [];
  return edges.filter((e) => e.fromPalace === palaceCanon || e.toPalace === palaceCanon);
}

/**
 * 依「先分層算 flow，再按宮位篩選」產出單一宮位的【四化流向】區塊。
 * 模組二一律只讀 NormalizedChart.*.flows。用於：12 宮 sihuaFlowSummary、關鍵年份區塊、三盤疊加診斷。
 */
export function getFlowBlockForPalace(chart: NormalizedChart, palaceNameOrKey: string): string {
  const palaceCanon = toPalaceCanonical((palaceNameOrKey ?? "").trim());
  if (!palaceCanon) return "";

  const natalEdges = chart.natal?.flows ?? chart.natal?.birthTransforms ?? chart.natalTransforms;
  const natal = filterEdgesByPalace(natalEdges, palaceCanon);
  const decade = filterEdgesByPalace(chart.currentDecade?.flows, palaceCanon);
  const year = filterEdgesByPalace(chart.yearlyHoroscope?.flows, palaceCanon);

  const parts: string[] = [];
  if (natal.length) parts.push(buildLayerFlowBlock(natal, "natal"));
  if (decade.length) parts.push(buildLayerFlowBlock(decade, "decade"));
  if (year.length) parts.push(buildLayerFlowBlock(year, "year"));
  return parts.join("\n\n");
}

export interface FlowDebugEntry {
  layer: TransformEdge["layer"];
  star: string;
  star_palace: string;
  fromPalace: string;
  toPalace: string;
  transform: string;
}

/**
 * 產出 FLOW_DEBUG 結構化陣列（每條四化邊一筆），供技術版／除錯用。
 */
export function buildFlowDebugEntries(chart: NormalizedChart): FlowDebugEntry[] {
  const out: FlowDebugEntry[] = [];
  const layers: Array<{ layer: TransformEdge["layer"]; edges: TransformEdge[] | undefined }> = [
    { layer: "natal", edges: chart.natal?.flows ?? chart.natal?.birthTransforms ?? chart.natalTransforms },
    { layer: "decade", edges: chart.currentDecade?.flows },
    { layer: "year", edges: chart.yearlyHoroscope?.flows },
  ];
  for (const { layer, edges } of layers) {
    if (!edges?.length) continue;
    for (const e of edges) {
      out.push({
        layer,
        star: e.starName ?? "星",
        star_palace: e.fromPalace,
        fromPalace: e.fromPalace,
        toPalace: e.toPalace,
        transform: e.transform,
      });
    }
  }
  return out;
}
