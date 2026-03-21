/**
 * S19 斷語規則引擎：InterpretationRule 與鏈類型
 */

import type { GongGanFlow } from "../../gonggan-flows.js";

/** 流月鏈路標記（內部偵測用） */
export type S19ChainType =
  | "ji_chase_ji"
  | "lu_pressed_by_ji"
  | "ke_turns_ji"
  | "lu_chase_ji"   // 祿追忌：resource>=1 且 month 忌命中同宮
  | "ke_repair_ji"  // 科修忌：structure>=1 且 risk>=1，未達科轉忌
  | "quan_push"     // 權推局：power>=1 且 month 權命中，risk 不高
  | "lu_open";      // 祿啟局：resource>=1 且 month 祿命中，risk 不高

/** primaryChain 優先序：忌追忌 > 祿被忌壓 > 科轉忌 > 祿追忌 > 科修忌 > 權推局 > 祿啟局 */
export const PRIMARY_CHAIN_PRIORITY: string[] = [
  "忌追忌",
  "祿被忌壓",
  "科轉忌",
  "祿追忌",
  "科修忌",
  "權推局",
  "祿啟局",
];

/** 規則套用條件（可選；未填則僅依 star/transform/palace 命中） */
export interface InterpretationRuleConditions {
  /** 需同時具備的鏈類型（本批流月 trigger 宮相關 flows 偵測結果） */
  requireChainsAll?: S19ChainType[];
  /** 需具備其中任一鏈類型 */
  requireChainsAny?: S19ChainType[];
  /** 僅當 S18 對該宮（通常為 toPalace）的歸類符合時套用 */
  requireS18Bias?: "pressure" | "opportunity";
}

/**
 * 單條斷語規則：star × transform × palace → 具體場景與敘事
 * - star / palace 可用 "*" 表示萬用（fallback 階層）
 */
export interface InterpretationRule {
  id: string;
  star: string;
  transform: "祿" | "權" | "科" | "忌";
  palace: string;
  title: string;
  baseWeight: number;
  eventType: string[];
  baseScenarios: string[];
  positiveScenarios: string[];
  negativeScenarios: string[];
  /** 規則主敘事（引擎會再依語氣規範與加權拼接） */
  narrative: string;
  actionHint: string;
  conditions?: InterpretationRuleConditions;
}

export type S18PalaceBias = "pressure" | "opportunity" | "neutral";

export interface S19InterpretationDebug {
  effectiveWeight: number;
  s18Bias: S18PalaceBias;
  chainTypes: string[];
  primaryChain?: string;
  positiveWeight: number;
  negativeWeight: number;
}

/** 單一流月飛星對應的斷語輸出 */
export interface S19InterpretationPerFlow {
  flow: GongGanFlow;
  narrative: string;
  /** 更具體「可能發生」的場景（依 pickScenarios 或 fallback 產出） */
  concretePossibilities: string[];
  /** 條件分支：給讀者「若…則…」式對照 */
  branches: { condition: string; scenarios: string[] }[];
  actionHint: string;
  matchedRuleId: string | null;
  /** 命中層：override > seed > fallback */
  matchedRuleLayer: "override" | "seed" | "fallback";
  usedFallback: boolean;
  /** 規則命中時的前端渲染區塊（title + narrative + scenarios + actionHint） */
  block?: InterpretationBlock;
  debug: S19InterpretationDebug;
}

export interface S19InterpretationEngineOutput {
  triggerPalace: string;
  monthFlowsUsed: GongGanFlow[];
  /** 鏈類型中文標籤（供主文案／加權） */
  chainTypes: string[];
  /** 依優先序取的第一條鏈（主文案用） */
  primaryChain?: string;
  interpretations: S19InterpretationPerFlow[];
}

/** S18 結構脈絡：供 pickScenarios 決定偏正向／負向場景 */
export interface S18Context {
  isOpportunityPalace?: boolean;
  isPressurePalace?: boolean;
  risk?: number;
  pattern?: string;
}

/** S19 流月脈絡：鏈類型與 trigger 四化（pickScenarios 後續用 primaryChain 做主文案、chainTypes 做加權） */
export interface S19Context {
  chainTypes: string[];
  primaryChain?: string;
  triggerTransform?: "祿" | "權" | "科" | "忌";
}

/** 規則命中後輸出的區塊（前端可直接渲染「更具體可能發生」+「提醒」） */
export interface InterpretationBlock {
  title: string;
  narrative: string;
  scenarios: string[];
  actionHint: string;
}

/** S19 單月卡片式輸出（本月引爆點 + 走向 + 具體可能） */
export interface S19MonthlyOutput {
  /** 例：2026年3月｜流月分析（無則不顯示，但 S19 建議有月份） */
  monthDisplay?: string;
  summary: string;
  primary: {
    palace: string;
    palaceTopic: string;
    /** 第一行：星＋宮，例 巨門化忌引動福德宮 */
    triggerTitle: string;
    /** 第二行：chain 語義，必有值（chainTitle 或 fallback） */
    chainTitle: string;
    narrative: string;
    scenarios: string[];
    actionHint: string;
  };
  synthesis?: {
    title: string;
    description: string;
    /** 因果句，例：由於壓力集中在福德宮，這種內在狀態會直接影響… */
    causalSentence?: string;
    scenarios: string[];
    actionHint?: string;
  };
  meta?: {
    triggerSource: "month";
    triggerTransform?: "祿" | "權" | "科" | "忌";
    triggerStar?: string;
    chain?: string;
    confidence?: "low" | "medium" | "high";
  };
}
