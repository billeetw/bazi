/**
 * 命宮（s02）星曜敘事 adapter：重用既有 source of truth，不新增句庫。
 * Phase 3A：四化敘事改為經 narrativeFacade.getTransformSemantic 取得，不再直接查 matrix。
 */

import { getStarSemantic } from "./starSemanticDictionary.js";
import { getMingGongStarInsight } from "./mingGongStarMatrix.js";
import { createNarrativeFacade } from "./narrativeFacade.js";
import { STAR_NAME_ZH_TO_ID } from "./schema.js";

export type MingGongStarMode = "opening" | "strength" | "tension" | "mature";

/** 輔星短標籤：有則用於整合句，無則只列星名 */
const ASSISTANT_STAR_SHORT_LABELS: Record<string, string> = {
  祿存: "存祿",
  左輔: "輔助",
  右弼: "輔助",
  文昌: "文采",
  文曲: "文采",
  天魁: "貴人",
  天鉞: "貴人",
  恩光: "貴人",
  天貴: "貴人",
  紅鸞: "姻緣",
  天喜: "喜氣",
  天德: "福德",
  月德: "福德",
  解神: "化解",
  天才: "才華",
  天壽: "壽元",
  天巫: "巫祝",
  台輔: "輔佐",
  封誥: "封賞",
  龍池: "才藝",
  鳳閣: "才藝",
  天馬: "變動",
};

/** 煞星短標籤 */
const SHA_STAR_SHORT_LABELS: Record<string, string> = {
  擎羊: "推動",
  陀羅: "拖延",
  火星: "爆發",
  鈴星: "焦慮",
  地空: "變動",
  地劫: "波動",
  天空: "空靈",
};

function toTransformType(type: string): string {
  const t = (type ?? "").trim().toLowerCase();
  if (t === "lu" || t === "祿") return "祿";
  if (t === "quan" || t === "權") return "權";
  if (t === "ke" || t === "科") return "科";
  if (t === "ji" || t === "忌") return "忌";
  return type;
}

/**
 * 命宮主星敘事：優先 mingGongStarMatrix → getStarSemantic → starBaseCore，組出命書式句子。
 */
export function buildMingGongStarNarrative(
  starName: string,
  mode: MingGongStarMode,
  opts?: { starBaseCore?: Record<string, string> }
): string {
  const name = (starName ?? "").trim();
  if (!name) return "";

  const insight = getMingGongStarInsight(name);
  const fromMatrix = insight?.[mode];
  if (fromMatrix && fromMatrix.trim()) return fromMatrix;

  const sem = getStarSemantic(name);
  if (sem) {
    const core = sem.core;
    const themes = sem.themes.slice(0, 3).join("、") || core;
    switch (mode) {
      case "opening":
        return `${name}代表${core}，因此你帶著與此相應的氣質上場。`;
      case "strength":
        return `${name}帶來與「${themes}」相關的優勢，是你最自然的強項。`;
      case "tension":
        return sem.risk ? `當${sem.risk}` : `若過度依賴${name}的慣性，容易在壓力下失衡。`;
      case "mature":
        return sem.advice ? `成熟的${name}命宮，是${sem.advice}` : `成熟的${name}命宮，是善用其長、補其不足。`;
      default:
        return "";
    }
  }

  const starId = (STAR_NAME_ZH_TO_ID as Record<string, string>)[name];
  const baseText = opts?.starBaseCore?.[starId]?.trim();
  if (baseText) {
    const firstClause = baseText.split(/[，。；]/)[0] ?? baseText;
    switch (mode) {
      case "opening":
        return `命盤中此星象徵${firstClause}，因此你帶著與此相應的氣質上場。`;
      case "strength":
        return `你在此宮的優勢，與「${firstClause}」相呼應。`;
      case "tension":
        return `若過度依賴此星慣性，容易在壓力下失衡。`;
      case "mature":
        return `成熟後，可善用此星所長，並留意節奏與界線。`;
      default:
        return "";
    }
  }

  return "";
}

/**
 * 命宮輔星／煞星整合句：單一結構化模板，可對應星曜列表。不隨機、不輪替。
 */
export function buildMingGongAssistantNarrative(
  assistantStars: string[],
  shaStars: string[]
): string {
  const formatWithLabel = (star: string, labels: Record<string, string>) => {
    const label = labels[star];
    return label ? `${star}（${label}）` : star;
  };
  const assistantSummary =
    assistantStars.length > 0
      ? assistantStars.map((s) => formatWithLabel(s, ASSISTANT_STAR_SHORT_LABELS)).join("、")
      : "";
  const shaSummary =
    shaStars.length > 0
      ? shaStars.map((s) => formatWithLabel(s, SHA_STAR_SHORT_LABELS)).join("、")
      : "";
  if (assistantSummary && shaSummary) return `此宮輔星：${assistantSummary}；煞星：${shaSummary}。`;
  if (assistantSummary) return `此宮輔星：${assistantSummary}。`;
  if (shaSummary) return `此宮煞星：${shaSummary}。`;
  return "此宮無明顯輔星或煞星。";
}

/** 命宮四化敘事 fallback（facade 查無時使用）。 */
const MING_GONG_TRANSFORM_FALLBACK = "命宮的四化會透過本命、大限、流年層級牽動此宮，可對照全盤能量流向理解。";

/**
 * 命宮四化敘事：經 narrativeFacade.getTransformSemantic(transform, starName, "命宮") 取得 meaning／advice，不再直接查 matrix。
 */
export function buildMingGongTransformNarrative(event: {
  starName: string;
  type: string;
} | null): string {
  if (!event?.starName?.trim()) return "";
  const starName = event.starName.trim();
  const type = toTransformType(event.type) as "祿" | "權" | "科" | "忌";
  if (type !== "祿" && type !== "權" && type !== "科" && type !== "忌") return MING_GONG_TRANSFORM_FALLBACK;
  const facade = createNarrativeFacade();
  const block = facade.getTransformSemantic(type, starName, "命宮");
  const text = block.meaning?.trim() ?? block.advice?.trim() ?? "";
  return text || MING_GONG_TRANSFORM_FALLBACK;
}
