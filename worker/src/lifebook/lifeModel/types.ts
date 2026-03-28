/**
 * S22 結構線 / S23 轉化流 — 型別（見 docs/lifebook-s22-s23-spec.md）
 */

export type PalaceScoreVersion = "v1";

export interface PalaceScoreResult {
  /** 1–5，供 UI / s22 平衡判斷 */
  score: number;
  /** 合成後、四捨五入前之線性分（可 <1，供 s23 轉化分母與「源頭極弱」判斷） */
  raw: number;
  scoreVersion: PalaceScoreVersion;
  /** mainStars 為空（策略 A：不借星） */
  isEmptyPalace: boolean;
}

export type StructureLineId = "wealth_happiness" | "asset_storage" | "career_relationship";
export type StructureBalanceType = "balanced" | "biased" | "weak";

export interface StructureLine {
  id: StructureLineId;
  title: string;
  subtitle: string;
  palaceA: string;
  palaceB: string;
  scoreA: number;
  scoreB: number;
  totalScore: number;
  gapScore: number;
  balanceType: StructureBalanceType;
  summary: string;
  insight: string;
  /** 命中一句（給排版／摘要用） */
  hitLine?: string;
  tags?: string[];
}

export type TransformationFlowId = "career_to_money" | "money_to_asset" | "mind_to_opportunity";
export type TransformationFlowType = "smooth" | "stuck" | "leaking" | "blocked";

export interface TransformationFlow {
  id: TransformationFlowId;
  title: string;
  subtitle: string;
  from: string;
  to: string;
  sourceScore: number;
  targetScore: number;
  sourceRaw: number;
  targetRaw: number;
  /** 0–1，已含阻力修正並 clamp */
  conversionRate: number;
  flowType: TransformationFlowType;
  /** 整數分上 target > source（承接面顯強於來源面） */
  isOverperforming: boolean;
  summary: string;
  advice: string;
  hitLine?: string;
  tags?: string[];
}
