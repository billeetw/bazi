/**
 * 穿透式診斷引擎共用型別。
 * 與既有四化結構對齊：TransformType = lu|quan|ke|ji；layer 對應本命／大限／流年／小限。
 */

export type TransformType = "lu" | "quan" | "ke" | "ji";

export type DiagnosticLayer = "birth" | "decade" | "year" | "minor";

/** 單條四化飛星邊：從 A 宮飛往 B 宮，類型與層級。 */
export interface DiagnosticEdge {
  fromPalace: string;
  toPalace: string;
  transformType: TransformType;
  layer: DiagnosticLayer;
  starName?: string;
  edgeScore?: number;
}

/** 單一宮位的四化與星曜訊號（供張力／根因引擎使用）。 */
export interface PalaceSignal {
  palace: string;
  inTransforms: TransformType[];
  outTransforms: TransformType[];
  hasMainStar?: boolean;
  mainStars?: string[];
  auxStars?: string[];
  shaStars?: string[];
  tags?: string[];
}

export type TensionSeverity = "low" | "medium" | "high";

/** 張力發現：規則化標籤、嚴重度、證據與敘事／成本／建議。 */
export interface TensionFinding {
  id: string;
  label: string;
  severity: TensionSeverity;
  palaces: string[];
  stars?: string[];
  layers?: string[];
  evidence: string[];
  narrative: string;
  cost: string;
  advice: string;
}

export type RootCauseType =
  | "overflow"
  | "translation"
  | "overcompensation"
  | "relationship_displacement";

/** 根因發現：壓力源 A、症狀宮 B、證據與敘事／建議。 */
export interface RootCauseFinding {
  id: string;
  type: RootCauseType;
  sourcePalace: string;
  symptomPalace: string;
  transformType?: TransformType;
  evidence: string[];
  narrative: string;
  advice: string;
}

/** 顧問式改寫詞條（命理語 → 顧問語）。 */
export interface ReframedPhrase {
  key: string;
  rawLabel: string;
  professionalLabel: string;
  narrative: string;
}

/** 診斷聚合結果：供 s00／s03／12 宮／模組二取用。 */
export interface DiagnosticBundle {
  tensions: TensionFinding[];
  rootCauses: RootCauseFinding[];
  reframes: ReframedPhrase[];
}
