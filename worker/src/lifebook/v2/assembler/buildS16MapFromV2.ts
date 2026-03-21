/**
 * Lifebook V2：s16 章節從 findingsV2 產出 placeholder map（Batch 1 年度為主）。
 * 優先讀取：eventProbabilities（年度）、timeWindowScores（year）、triggeredPaths（layers 含 year）、transformEdges（layer === "year"）。
 * 無足夠 primary 資料時回傳 usable: false，呼叫端走既有 chart/liunian 邏輯。
 */

import type { LifebookFindingsV2 } from "../schema/findingsV2.js";
import type { TransformEdgeV2 } from "../schema/transformEdge.js";
import type { TriggeredPath } from "../schema/triggeredPath.js";
import type { TimeWindowScore } from "../schema/timeWindowScore.js";
import type { EventProbability } from "../schema/eventProbability.js";
import type { EventType } from "../schema/eventProbability.js";

const EVENT_TYPE_ZH: Record<EventType, string> = {
  income_growth: "收入成長",
  career_breakthrough: "事業突破",
  business_expansion: "擴張機會",
  asset_purchase: "資產累積",
  major_expense: "大額支出",
  cashflow_stress: "現金流壓力",
  partnership_opportunity: "合作機會",
  partnership_conflict: "合作衝突",
  inner_adjustment: "內在調整",
};

function eventTypeToLabel(key: string): string {
  return EVENT_TYPE_ZH[key as EventType] ?? key;
}

export interface S16MapFromV2Result {
  usable: boolean;
  map: Record<string, string>;
}

function yearEventsSummary(events: EventProbability[]): string {
  const lines = events
    .filter((e) => e.window?.type === "year" && e.window.year != null)
    .slice(0, 15)
    .map((e) => {
      const y = e.window!.year!;
      const label = eventTypeToLabel(e.eventType);
      return `${y}年 ${label} 機率${e.probability}%`;
    });
  return lines.join("\n");
}

function yearScoresSummary(scores: TimeWindowScore[]): string {
  const yearScores = scores.filter((s) => s.windowType === "year" && s.flowYear != null);
  return yearScores
    .map((s) => `${s.flowYear} 年：財富${s.wealthScore.toFixed(0)} 事業${s.careerScore.toFixed(0)} 壓力${s.pressureScore.toFixed(0)}`)
    .join("\n");
}

function yearPathsSummary(paths: TriggeredPath[]): string {
  const withYear = paths.filter((p) => p.layers?.includes("year"));
  return withYear
    .slice(0, 10)
    .map((p) => `${p.pathId}（${p.summaryTag ?? ""}）${p.touchedPalaces?.length ? " " + p.touchedPalaces.join("→") : ""}`)
    .join("\n");
}

function yearEdgesSummary(edges: TransformEdgeV2[]): string {
  const yearEdges = edges.filter((e) => e.layer === "year");
  const lines = yearEdges.slice(0, 20).map((e) => {
    const from = e.fromPalace ?? "";
    const to = e.toPalace ?? "";
    const y = e.flowYear != null ? `${e.flowYear}年 ` : "";
    return `${y}${from}→${to} ${e.starName}${e.transform}`;
  });
  return lines.join("\n");
}

function yearEdgesBlocks(edges: TransformEdgeV2[]): string {
  const yearEdges = edges.filter((e) => e.layer === "year");
  if (yearEdges.length === 0) return "";
  const lines = yearEdges.map((e) => {
    const from = e.fromPalace ?? "";
    const to = e.toPalace ?? "";
    const y = e.flowYear != null ? `流年${e.flowYear} ` : "";
    return `${y}${from} → ${to}：${e.starName}化${e.transform}`;
  });
  return "【流年四化飛星】\n" + lines.join("\n");
}

/**
 * 僅當 findingsV2 具備 s16.primary（年度維度）至少一類資料時產出 map；否則 usable=false。
 */
export function buildS16PlaceholderMapFromV2(findingsV2: LifebookFindingsV2 | undefined): S16MapFromV2Result {
  const map: Record<string, string> = {};
  const events = findingsV2?.eventProbabilities ?? [];
  const scores = findingsV2?.timeWindowScores ?? [];
  const paths = findingsV2?.triggeredPaths ?? [];
  const edges = findingsV2?.transformEdges ?? [];

  const yearEvents = events.filter((e) => e.window?.type === "year");
  const yearScores = scores.filter((s) => s.windowType === "year");
  const yearPaths = paths.filter((p) => p.layers?.includes("year"));
  const yearEdges = edges.filter((e) => e.layer === "year");

  const hasYearEvents = yearEvents.length > 0;
  const hasYearScores = yearScores.length > 0;
  const hasYearPaths = yearPaths.length > 0;
  const hasYearEdges = yearEdges.length > 0;
  const usable = hasYearEvents || hasYearScores || hasYearPaths || hasYearEdges;

  if (!usable) return { usable: false, map: {} };

  if (hasYearEvents) {
    map.yearEventProbabilitiesSummary = yearEventsSummary(events);
  }
  if (hasYearScores) {
    map.yearTimeWindowScoresSummary = yearScoresSummary(scores);
  }
  if (hasYearPaths) {
    map.yearPathsSummary = yearPathsSummary(paths);
  }
  if (hasYearEdges) {
    map.yearlyFourTransformSummary = yearEdgesSummary(edges);
    map.yearlyFourTransformBlocks = yearEdgesBlocks(edges);
  }

  return { usable, map };
}
