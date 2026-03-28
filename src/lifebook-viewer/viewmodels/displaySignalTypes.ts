/**
 * Phase 1：演算法層 → 呈現層的訊號契約（與舊 `ViewSignal` 並存，遷移中）。
 * 統一由 `resolveDisplaySignals` / `resolveSignals().displaySignals` 產出；優先序：findings > time-module > keyword。
 */

/** 演算法／規則層輸出的語意碼 */
export type SignalCode =
  | "career_push"
  | "career_pressure"
  | "wealth_opportunity"
  | "relationship_tension"
  | "health_warning"
  | "inner_drift";

/** 畫面上實際顯示的一則訊號 */
export type DisplaySignal = {
  code: SignalCode;
  label: string;
  severity?: "low" | "medium" | "high";
  source: "findings" | "time-module" | "keyword";
};
