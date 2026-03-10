/**
 * CL3 spilloverEngine / crossChartRule：規則列與軸線型別。
 */

export type CrossChartTriggerType =
  | "edgeMatch"
  | "samePalaceTransformMix"
  | "groupMatch";

export interface CrossChartRuleRow {
  ruleId: string;
  triggerType: CrossChartTriggerType;
  trigger: Record<string, unknown>;
  diagnosis: string;
  lifePattern: string;
  advice: string;
  sourceLabel?: string;
  targetLabel?: string;
  shockLevel?: number;
}

/** 宮位軸線：一軸可為兩宮或多宮（items 用 fromPalace/toPalace 或 palaces 皆可） */
export interface PalaceAxisLinkRow {
  axis: string;
  palaces?: string[];
  fromPalace?: string;
  toPalace?: string;
  description?: string;
  meaning?: string;
}
