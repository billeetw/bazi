/**
 * P2: 從 chartJson 產出正規化四化邊（TransformEdge[]）。
 * 來源：overlapAnalysis.items[].transformations；若有 sihuaLayers 可擴充。
 * 最小推理單位：transform + targetPalace + leadMainStar（由 palaceInference 使用）。
 */

import { toPalaceCanonical } from "../canonicalKeys.js";
import type { TransformEdge, TransformDisplay } from "../normalizedChart.js";
import { toTransformDisplay } from "../normalizedChart.js";

const LAYER_LABEL_TO_LAYER: Record<string, TransformEdge["layer"]> = {
  本命: "natal",
  大限: "decade",
  流年: "year",
};

const TYPE_TO_DISPLAY: Record<string, TransformDisplay> = {
  lu: "祿",
  quan: "權",
  ke: "科",
  ji: "忌",
  祿: "祿",
  權: "權",
  科: "科",
  忌: "忌",
};

export interface RawTransformationEntry {
  layerLabel?: string;
  layer?: string;
  starName?: string;
  type?: string;
  typeLabel?: string;
  fromPalaceKey?: string;
  fromPalaceName?: string;
  toPalaceKey?: string;
  toPalaceName?: string;
}

function toLayer(label: string | undefined): TransformEdge["layer"] {
  if (!label) return "natal";
  const key = LAYER_LABEL_TO_LAYER[label.trim()];
  return key ?? "natal";
}

function toTransform(type: string | undefined): TransformDisplay {
  if (!type) return "忌";
  const t = (type as string).trim();
  const display = TYPE_TO_DISPLAY[t] ?? toTransformDisplay(t);
  return (display as TransformDisplay) ?? "忌";
}

function normPalace(from: string | undefined, to: string | undefined): { from: string; to: string } {
  const fromStr = (from ?? "").trim();
  const toStr = (to ?? "").trim();
  return {
    from: fromStr ? toPalaceCanonical(fromStr) : "",
    to: toStr ? toPalaceCanonical(toStr) : "",
  };
}

/**
 * 從 overlapAnalysis.items[].transformations 產出各層 TransformEdge[]。
 */
export function buildTransformEdgesFromOverlap(chartJson: Record<string, unknown> | undefined): TransformEdge[] {
  const out: TransformEdge[] = [];
  if (!chartJson) return out;
  const overlap = (chartJson.overlapAnalysis ?? chartJson.overlap) as { items?: Array<{ transformations?: RawTransformationEntry[] }> } | undefined;
  const items = Array.isArray(overlap?.items) ? overlap.items : [];
  for (const it of items) {
    const list = it.transformations ?? [];
    for (const t of list) {
      const rawLayer = (t.layerLabel ?? t.layer ?? "").toString().trim();
      if (rawLayer === "小限" || rawLayer === "minor") continue;
      const fromName = t.fromPalaceName ?? t.fromPalaceKey ?? "";
      const toName = t.toPalaceName ?? t.toPalaceKey ?? "";
      const { from, to } = normPalace(fromName, toName);
      if (!from || !to) continue;
      const layer = toLayer(t.layerLabel ?? t.layer);
      const transform = toTransform(t.type ?? t.typeLabel);
      const resolvedLayer: TransformEdge["layer"] = layer === "decade" ? "decade" : layer === "year" ? "year" : "natal";
      out.push({
        fromPalace: from,
        toPalace: to,
        transform,
        layer: resolvedLayer,
        starName: t.starName?.trim(),
      });
    }
  }
  return out;
}

/**
 * 依 layer 分組，回傳 { natal, decade, year }。小限層邊不產出。
 */
export function groupTransformsByLayer(edges: TransformEdge[]): {
  natal: TransformEdge[];
  decade: TransformEdge[];
  year: TransformEdge[];
} {
  const natal: TransformEdge[] = [];
  const decade: TransformEdge[] = [];
  const year: TransformEdge[] = [];
  for (const e of edges) {
    if (e.layer === "natal") natal.push(e);
    else if (e.layer === "decade") decade.push(e);
    else if (e.layer === "year") year.push(e);
  }
  return { natal, decade, year };
}

/**
 * 三層四化拆開解析，禁止互相 fallback；回傳各自獨立的 TransformEdge[]。
 */
export function getTransformsByLayer(chartJson: Record<string, unknown> | undefined): {
  natal: TransformEdge[];
  decade: TransformEdge[];
  year: TransformEdge[];
} {
  const all = buildTransformEdgesFromOverlap(chartJson);
  return groupTransformsByLayer(all);
}
