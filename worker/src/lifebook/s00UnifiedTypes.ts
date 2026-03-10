/**
 * 四化論斷統一 pipeline 型別（normalize → detect → render）
 * 不改既有 SiHuaEvent 來源，僅做一層 normalize 與 PatternHitV2 輸出。
 */

export type SiHuaLayerNormalized = "natal" | "decade" | "year";

export type SiHuaTransformKey = "lu" | "quan" | "ke" | "ji";

/** 宮位 key：遵守既有正規化（命宮、兄弟…父母，或 id） */
export type PalaceKey = string;

/**
 * 正規化後的四化事件（共同輸入）
 * transform 內部用 lu/quan/ke/ji，渲染時對應 祿/權/科/忌
 */
export interface NormalizedSiHuaEvent {
  layer: SiHuaLayerNormalized;
  transform: SiHuaTransformKey;
  /** 至少一個有值 */
  starId?: string;
  starNameZh?: string;
  fromPalace: PalaceKey | null;
  toPalace: PalaceKey | null;
  /** 保留來源片段，供 diagnostics */
  raw?: unknown;
}

export const TRANSFORM_LABEL: Record<SiHuaTransformKey, string> = {
  lu: "祿",
  quan: "權",
  ke: "科",
  ji: "忌",
};

export const LAYER_LABEL: Record<SiHuaLayerNormalized, string> = {
  natal: "本命",
  decade: "大限",
  year: "流年",
};

export interface SiHuaDiagnostics {
  missingFields: Array<{ eventIndex?: number; fields: string[]; raw?: unknown }>;
  unresolvedPalaceKey: string[];
  unresolvedStarName: string[];
  /** hits 為空時說明原因 */
  emptyReason?: string;
}

export type RuleIdV2 = "R01" | "R02_LU" | "R02_JI" | "R30" | "R03" | "R11";

export type Severity = "high" | "medium" | "low";

/**
 * 共同輸出：每個 detector 回傳的 hit
 * evidence 只給 debug，主文只用 summary
 */
export interface PatternHitV2 {
  ruleId: RuleIdV2;
  title: string;
  severity: Severity;
  summary: string;
  evidence: NormalizedSiHuaEvent[];
  /** canonical key 的來源資料 */
  payload: Record<string, unknown>;
}

/** 命盤主戰場偵測輸出 */
export interface DominantPalace {
  palace: PalaceKey;
  score: number;
  tags: string[];
  evidence: unknown[];
}
