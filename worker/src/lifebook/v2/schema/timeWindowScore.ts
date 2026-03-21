/**
 * Lifebook V2：時間視窗分數。
 * Score Engine 輸出。
 */

export interface TimeWindowScore {
  windowType: "decade" | "year";
  decadeRange?: { start: number; end: number };
  flowYear?: number;
  wealthScore: number;
  careerScore: number;
  assetScore: number;
  partnershipScore: number;
  cashflowRiskScore: number;
  pressureScore: number;
}
