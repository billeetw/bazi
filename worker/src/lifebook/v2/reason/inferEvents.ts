/**
 * Lifebook V2：rule-based v1 事件推論。
 * 以 timeWindowScores 為主，依 wealth/career/cashflowRisk/pressure/partnership 與 path/stack 極性產出 EventProbability[]。
 */

import type { TransformEdgeV2 } from "../schema/transformEdge.js";
import type { TriggeredPath } from "../schema/triggeredPath.js";
import type { StackSignal } from "../schema/stackSignal.js";
import type { TimeWindowScore } from "../schema/timeWindowScore.js";
import type { EventProbability, EventType } from "../schema/eventProbability.js";

/** v1 門檻：分數高於此視為「高」 */
const THRESHOLD_HIGH = 25;
/** v1 門檻：分數低於此視為「低」 */
const THRESHOLD_LOW = 15;
/** cashflow_stress 專用門檻 */
const THRESHOLD_CASHFLOW_RISK = 20;
/** pressure 用於 major_expense 的門檻 */
const THRESHOLD_PRESSURE = 20;
/** 每個時間視窗最多產出事件數 */
const MAX_EVENTS_PER_WINDOW = 3;
/** v1 固定信心度 */
const CONFIDENCE = 70;

const PARTNERSHIP_PALACES = new Set(["僕役宮", "兄弟宮", "僕役", "兄弟"]);

function isPartnershipPath(p: TriggeredPath): boolean {
  return p.touchedPalaces.some((palace) => PARTNERSHIP_PALACES.has(palace) || PARTNERSHIP_PALACES.has(palace.replace(/宮$/, "")));
}

function isPartnershipStack(s: StackSignal): boolean {
  const p = s.palace?.replace(/宮$/, "") ?? "";
  return p === "僕役" || p === "兄弟";
}

function scoreId(win: TimeWindowScore): string {
  if (win.windowType === "decade" && win.decadeRange)
    return `decade_${win.decadeRange.start}-${win.decadeRange.end}`;
  if (win.windowType === "year" && win.flowYear != null)
    return `year_${win.flowYear}`;
  return "unknown";
}

function buildWindow(win: TimeWindowScore): EventProbability["window"] {
  if (win.windowType === "decade" && win.decadeRange)
    return { type: "decade", decadeRange: win.decadeRange };
  if (win.windowType === "year" && win.flowYear != null)
    return { type: "year", year: win.flowYear };
  return { type: "year" };
}

function makeEvent(
  eventType: EventType,
  probability: number,
  win: TimeWindowScore,
  pathIds: string[],
  stackIds: string[],
  scoreIds: string[]
): EventProbability {
  return {
    eventType,
    probability,
    confidence: CONFIDENCE,
    basedOn: { paths: pathIds, stacks: stackIds, scores: scoreIds },
    window: buildWindow(win),
  };
}

/**
 * Rule-based v1：依 timeWindowScores 與 path/stack 極性，為每個 decade/year 視窗產出最多 3 個事件。
 */
export function inferEvents(
  _edges: TransformEdgeV2[],
  paths: TriggeredPath[],
  stacks: StackSignal[],
  scores: TimeWindowScore[]
): EventProbability[] {
  const out: EventProbability[] = [];
  const sid = scoreId;

  for (const win of scores) {
    const scoreIdRef = sid(win);
    const pathIds = paths.map((p) => p.pathId);
    const stackIds = stacks.map((s) => s.id);
    const candidates: { event: EventProbability; priority: number }[] = [];

    // wealthScore 高 → income_growth
    if (win.wealthScore >= THRESHOLD_HIGH) {
      candidates.push({
        event: makeEvent("income_growth", Math.min(90, 50 + win.wealthScore), win, pathIds, stackIds, [scoreIdRef]),
        priority: win.wealthScore,
      });
    }

    // careerScore 高 → career_breakthrough
    if (win.careerScore >= THRESHOLD_HIGH) {
      candidates.push({
        event: makeEvent("career_breakthrough", Math.min(90, 50 + win.careerScore), win, pathIds, stackIds, [scoreIdRef]),
        priority: win.careerScore,
      });
    }

    // cashflowRiskScore 高 → cashflow_stress
    if (win.cashflowRiskScore >= THRESHOLD_CASHFLOW_RISK) {
      candidates.push({
        event: makeEvent("cashflow_stress", Math.min(85, 40 + win.cashflowRiskScore), win, pathIds, stackIds, [scoreIdRef]),
        priority: win.cashflowRiskScore,
      });
    }

    // pressureScore 高且 wealthScore 低 → major_expense
    if (win.pressureScore >= THRESHOLD_PRESSURE && win.wealthScore < THRESHOLD_LOW) {
      candidates.push({
        event: makeEvent("major_expense", Math.min(80, 35 + win.pressureScore), win, pathIds, stackIds, [scoreIdRef]),
        priority: win.pressureScore,
      });
    }

    // partnershipScore 高且相關 path/stacks 偏正向 → partnership_opportunity
    const partnershipPaths = paths.filter(isPartnershipPath);
    const partnershipStacks = stacks.filter(isPartnershipStack);
    const partnershipPositive = partnershipPaths.every((p) => p.polarity !== "negative") && partnershipStacks.every((s) => s.stackType !== "lu_ji_collision" && s.stackType !== "quan_ji_collision");
    if (win.partnershipScore >= THRESHOLD_HIGH && partnershipPositive) {
      candidates.push({
        event: makeEvent("partnership_opportunity", Math.min(85, 45 + win.partnershipScore), win, partnershipPaths.map((p) => p.pathId), partnershipStacks.map((s) => s.id), [scoreIdRef]),
        priority: win.partnershipScore,
      });
    }

    // partnershipScore 低或相關 path/stacks 偏負向 → partnership_conflict
    const partnershipNegative = partnershipPaths.some((p) => p.polarity === "negative") || partnershipStacks.some((s) => s.stackType === "lu_ji_collision" || s.stackType === "quan_ji_collision");
    if (win.partnershipScore < THRESHOLD_LOW || partnershipNegative) {
      const prob = partnershipNegative ? Math.min(85, 40 + Math.abs(win.partnershipScore)) : Math.min(70, 30 + (THRESHOLD_LOW - win.partnershipScore));
      candidates.push({
        event: makeEvent("partnership_conflict", prob, win, partnershipPaths.map((p) => p.pathId), partnershipStacks.map((s) => s.id), [scoreIdRef]),
        priority: -win.partnershipScore,
      });
    }

    // 依 priority 取前 MAX_EVENTS_PER_WINDOW 個
    candidates.sort((a, b) => b.priority - a.priority);
    for (let i = 0; i < Math.min(MAX_EVENTS_PER_WINDOW, candidates.length); i++) {
      out.push(candidates[i].event);
    }
  }

  return out;
}
