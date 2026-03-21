/**
 * Lifebook V2：事件機率。
 * Event Probability Engine 輸出。
 */

export type EventType =
  | "income_growth"
  | "career_breakthrough"
  | "business_expansion"
  | "asset_purchase"
  | "major_expense"
  | "cashflow_stress"
  | "partnership_opportunity"
  | "partnership_conflict"
  | "inner_adjustment";

export interface EventProbability {
  eventType: EventType;
  /** 0–100 */
  probability: number;
  /** 0–100 */
  confidence: number;
  basedOn: {
    paths: string[];
    stacks: string[];
    scores: string[];
  };
  window: {
    type: "year" | "decade";
    year?: number;
    decadeRange?: { start: number; end: number };
  };
}
