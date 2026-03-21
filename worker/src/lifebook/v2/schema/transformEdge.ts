/**
 * Lifebook V2：時序飛星推理引擎 — 統一邊結構。
 * 整合生年四化、大限四化、流年四化、宮干飛化為單一 edge 型別。
 */

export type TransformType = "祿" | "權" | "科" | "忌";
export type TimeLayer = "natal" | "decade" | "year";
export type SourceType = "生年四化" | "大限四化" | "流年四化" | "宮干飛化";

export interface TransformEdgeV2 {
  id: string;
  layer: TimeLayer;
  sourceType: SourceType;
  fromPalace: string;
  toPalace: string;
  transform: TransformType;
  starName: string;
  /** 宮干飛化時：觸發宮之天干 */
  palaceStem?: string;
  /** 大限層：年齡區間 */
  decadeRange?: { start: number; end: number };
  /** 流年層：年份 */
  flowYear?: number;
  /** 自化：fromPalace === toPalace */
  isSelfTransform: boolean;
  metadata?: Record<string, unknown>;
}

export function isSelfTransform(from: string, to: string): boolean {
  const n = (s: string) => (s ?? "").trim().replace(/宮$/, "");
  return n(from) === n(to);
}

export function createEdgeId(layer: TimeLayer, from: string, to: string, transform: TransformType, starName: string, index: number): string {
  return `v2_${layer}_${from}_${to}_${transform}_${(starName || "星").slice(0, 2)}_${index}`;
}
