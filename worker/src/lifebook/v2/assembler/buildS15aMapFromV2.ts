/**
 * Lifebook V2：s15a 章節從 findingsV2 產出 placeholder map（Batch 1 優先讀 primary）。
 * 先讀 SECTION_V2_TARGET_MAP.s15a.primary（stackSignals, timeWindowScores, eventProbabilities），
 * 缺則由呼叫端 fallback 至既有 chart/overlap 邏輯。
 */

import type { LifebookFindingsV2 } from "../schema/findingsV2.js";
import type { StackSignal } from "../schema/stackSignal.js";
import type { TimeWindowScore } from "../schema/timeWindowScore.js";
import type { EventProbability } from "../schema/eventProbability.js";
import type { EventType } from "../schema/eventProbability.js";

/** eventType 英文 key → 中文顯示（v1） */
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

export interface S15aMapFromV2Result {
  /** 是否足以覆寫（primary 至少有一類有資料） */
  usable: boolean;
  /** 要寫入 getPlaceholderMapFromContext 的 map 片段 */
  map: Record<string, string>;
}

/** 從 stackSignals 組出 shock/mine/wealth 區塊與計數（v1：依 stackType/theme 粗略對應） */
function blocksFromStackSignals(signals: StackSignal[]): { shockBlocks: string; mineBlocks: string; wealthBlocks: string; shockCount: number; mineCount: number; wealthCount: number } {
  let shockCount = 0;
  let mineCount = 0;
  let wealthCount = 0;
  const shockLines: string[] = [];
  const mineLines: string[] = [];
  const wealthLines: string[] = [];

  for (const s of signals) {
    const line = `${s.palace}：${s.theme}（${s.stackType}）`;
    if (s.stackType === "lu_ji_collision" || s.stackType === "quan_ji_collision" || s.stackType === "triple_stack") {
      shockCount++;
      shockLines.push(line);
    } else if (s.stackType === "self_transform_focus" && s.transforms.includes("忌")) {
      mineCount++;
      mineLines.push(line);
    } else if (s.stackType === "double_stack" && s.transforms.some((t) => t === "祿" || t === "權")) {
      wealthCount++;
      wealthLines.push(line);
    }
  }

  return {
    shockBlocks: shockLines.join("\n"),
    mineBlocks: mineLines.join("\n"),
    wealthBlocks: wealthLines.join("\n"),
    shockCount,
    mineCount,
    wealthCount,
  };
}

/** 從 timeWindowScores 組出簡要時間表（v1：decade + year 各一行） */
function timelineSummaryFromScores(scores: TimeWindowScore[]): string {
  const lines: string[] = [];
  for (const s of scores) {
    if (s.windowType === "decade" && s.decadeRange) {
      lines.push(`大限 ${s.decadeRange.start}～${s.decadeRange.end} 歲：財富${s.wealthScore.toFixed(0)} 事業${s.careerScore.toFixed(0)} 壓力${s.pressureScore.toFixed(0)}`);
    }
    if (s.windowType === "year" && s.flowYear != null) {
      lines.push(`${s.flowYear} 年：財富${s.wealthScore.toFixed(0)} 事業${s.careerScore.toFixed(0)} 壓力${s.pressureScore.toFixed(0)}`);
    }
  }
  return lines.join("\n");
}

/**
 * 僅當 findingsV2 具備 s15a.primary 欄位時產出 map 片段；否則 usable=false，呼叫端走 fallback。
 */
export function buildS15aPlaceholderMapFromV2(findingsV2: LifebookFindingsV2 | undefined): S15aMapFromV2Result {
  const map: Record<string, string> = {};
  const signals = findingsV2?.stackSignals ?? [];
  const scores = findingsV2?.timeWindowScores ?? [];
  const events = findingsV2?.eventProbabilities ?? [];

  const hasStacks = signals.length > 0;
  const hasScores = scores.length > 0;
  const hasEvents = events.length > 0;
  const usable = hasStacks || hasScores || hasEvents;

  if (!usable) return { usable: false, map: {} };

  if (hasStacks) {
    const blocks = blocksFromStackSignals(signals);
    map.shockCount = String(blocks.shockCount);
    map.mineCount = String(blocks.mineCount);
    map.wealthCount = String(blocks.wealthCount);
    map.shockBlocks = blocks.shockBlocks;
    map.mineBlocks = blocks.mineBlocks;
    map.wealthBlocks = blocks.wealthBlocks;
    map.overlapSummary = `劇烈震盪/吉凶並見：${blocks.shockCount} 個宮位；超級地雷區：${blocks.mineCount} 個宮位；大發財機會：${blocks.wealthCount} 個宮位`;
    map.volatileSection = blocks.shockBlocks ? "⚡ 劇烈震盪/吉凶並見（成敗一線間）\n" + blocks.shockBlocks : "";
    map.criticalRisksSection = blocks.mineBlocks ? "⚠️ 超級地雷區（必須絕對避開）\n" + blocks.mineBlocks : "";
    map.opportunitiesSection = blocks.wealthBlocks ? "✨ 大發財機會（建議積極把握）\n" + blocks.wealthBlocks : "";
  }

  if (hasScores) {
    map.timeWindowScoresSummary = timelineSummaryFromScores(scores);
  }

  if (hasEvents) {
    const eventLines = events.slice(0, 10).map((e) => {
      const win = e.window.type === "year" ? `${e.window.year}年` : e.window.decadeRange ? `${e.window.decadeRange.start}～${e.window.decadeRange.end}歲` : "";
      const label = eventTypeToLabel(e.eventType);
      return `${win} ${label} 機率${e.probability}%`;
    });
    map.eventProbabilitiesSummary = eventLines.join("\n");
  }

  map.keyYearsMineLead = "這一年真正危險的，不是表面事件，而是壓力已經累積到會從這個宮位爆出來。";
  map.keyYearsWealthLead = "這一年不是平白幸運，而是既有實力終於有了放大的舞台。";
  map.keyYearsShockLead = "這一年吉凶並見、成敗一線間，關鍵在節奏與選擇，不在命好不好。";

  return { usable, map };
}
