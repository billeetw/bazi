/**
 * CL3 starCombinationEngine：星曜組合表單筆型別（對應 star-combinations.json 一筆）。
 */

export interface StarCombinationRow {
  comboId: string;
  stars: [string, string] | string[];
  patternType: string;
  patternName: string;
  psychology: string;
  lifePattern: string;
  bodySignals?: string[];
  narrativeHint?: string;
  shockLevel: number;
}
