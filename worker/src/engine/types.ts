/**
 * 四化引擎集中型別：與規格一致，字典使用「祿」「權」「科」「忌」
 */

export type TransformZh = "祿" | "權" | "科" | "忌";
export type Layer = "natal" | "decade" | "year" | "minor";

export interface SiHuaEvent {
  star: string;
  transform: TransformZh;
  fromPalace: string;
  toPalace: string;
  layer: Layer;
  raw?: unknown;
}

export interface SiHuaDiagnostics {
  missingFields: Array<{ eventIndex?: number; fields: string[]; raw?: unknown }>;
  unresolvedPalaceKey: string[];
  unresolvedStarName: string[];
  emptyReason?: string;
}

export interface PatternHit {
  ruleId: string;
  severity: number;
  summary: string;
  evidence: SiHuaEvent[];
  payload: Record<string, unknown>;
}

export interface NormalizeResult {
  events: SiHuaEvent[];
  diagnostics: SiHuaDiagnostics;
}

/** 因果矩陣單條（R11 查表） */
export interface PalaceCausalityRow {
  fromPalace: string;
  toPalace: string;
  transform: TransformZh;
  meaning: string;
  consultation: string;
  advice: string;
  decisionTags?: string[];
}

export type DecisionTag =
  | "career" | "job_change" | "investment" | "entrepreneur"
  | "marriage" | "relationship" | "child"
  | "move" | "health" | "study"
  | "network" | "asset";
