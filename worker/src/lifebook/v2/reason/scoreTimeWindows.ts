/**
 * Lifebook V2：時間視窗分數。
 * 依 TransformEdgeV2[] 按 decade/year 分組，產出 TimeWindowScore[]。
 */

import type { TransformEdgeV2 } from "../schema/transformEdge.js";
import type { TimeWindowScore } from "../schema/timeWindowScore.js";
import { TRANSFORM_SCORE, PALACE_WEIGHT, LAYER_WEIGHT } from "../config/scoreWeights.js";

/** 宮名正規化 */
function normPalace(p: string): string {
  const s = (p ?? "").trim();
  if (!s) return "";
  if (s.endsWith("宮")) return s;
  if (s === "命") return "命宮";
  return s + "宮";
}

/** 邊對各維度的貢獻（v1 簡化：財/官/田宅/合作 依 toPalace；現金流風險=忌落財帛；壓力=忌落任何） */
function scoreFromEdges(edges: TransformEdgeV2[]): Omit<TimeWindowScore, "windowType" | "decadeRange" | "flowYear"> {
  let wealthScore = 0;
  let careerScore = 0;
  let assetScore = 0;
  let partnershipScore = 0;
  let cashflowRiskScore = 0;
  let pressureScore = 0;

  for (const e of edges) {
    const base = TRANSFORM_SCORE[e.transform] ?? 0;
    const layerW = LAYER_WEIGHT[e.layer] ?? 1;
    const toP = normPalace(e.toPalace);
    const palaceW = PALACE_WEIGHT[toP] ?? 1;
    const raw = base * layerW * palaceW;

    if (toP === "財帛宮") {
      wealthScore += raw;
      if (e.transform === "忌") cashflowRiskScore += Math.abs(raw);
    }
    if (toP === "官祿宮") careerScore += raw;
    if (toP === "田宅宮") assetScore += raw;
    if (toP === "僕役宮" || toP === "兄弟宮") partnershipScore += raw;
    if (e.transform === "忌") pressureScore += Math.abs(raw);
  }

  return {
    wealthScore,
    careerScore,
    assetScore,
    partnershipScore,
    cashflowRiskScore,
    pressureScore,
  };
}

/**
 * 依邊的 decadeRange / flowYear 分組，產出每個時間視窗的六維分數。
 * v1：有 decadeRange 的邊歸到該 decade；有 flowYear 的邊歸到該 year。
 */
export function scoreTimeWindows(edges: TransformEdgeV2[]): TimeWindowScore[] {
  const result: TimeWindowScore[] = [];
  const decadeKey = (r: { start: number; end: number }) => `${r.start}-${r.end}`;
  const decadeEdges = new Map<string, TransformEdgeV2[]>();
  const yearEdges = new Map<number, TransformEdgeV2[]>();

  for (const e of edges) {
    if (e.layer === "decade" && e.decadeRange) {
      const key = decadeKey(e.decadeRange);
      const list = decadeEdges.get(key) ?? [];
      list.push(e);
      decadeEdges.set(key, list);
    }
    if (e.layer === "year" && e.flowYear != null) {
      const list = yearEdges.get(e.flowYear) ?? [];
      list.push(e);
      yearEdges.set(e.flowYear, list);
    }
  }

  for (const [key, list] of decadeEdges) {
    const [start, end] = key.split("-").map(Number);
    const scores = scoreFromEdges(list);
    result.push({
      windowType: "decade",
      decadeRange: { start, end },
      ...scores,
    });
  }

  for (const [year, list] of yearEdges) {
    const scores = scoreFromEdges(list);
    result.push({
      windowType: "year",
      flowYear: year,
      ...scores,
    });
  }

  return result;
}
