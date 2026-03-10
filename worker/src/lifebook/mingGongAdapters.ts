/**
 * 命宮（s02）星曜敘事 adapter：重用既有 source of truth，不新增句庫。
 * - 主星一句／主題：starSemanticDictionary
 * - 主星通用句：starBaseCore
 * - 命宮專用四段：mingGongStarMatrix
 * - 四化：mingGongTransformMatrix → starPalaceTransformMatrix（命宮）
 * - 輔煞：短標籤字典 + mingGongSentenceLibrary.getMingGongAssistantNarrative
 */

import { getStarSemantic } from "./starSemanticDictionary.js";
import { getMingGongStarInsight } from "./mingGongStarMatrix.js";
import { getMingGongTransformMeaning } from "./mingGongTransformMatrix.js";
import { findStarPalaceTransformMeaning } from "./starPalaceTransformMatrix.js";
import { getMingGongAssistantNarrative } from "./mingGongSentenceLibrary.js";
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
 * 命宮輔星／煞星整合句：用短標籤字典組 summary，再交給 getMingGongAssistantNarrative 產出一段整合句，不逐顆卡片。
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
  return getMingGongAssistantNarrative(
    assistantStars.length > 0,
    shaStars.length > 0,
    assistantSummary,
    shaSummary
  );
}

/** 命宮四化敘事 fallback 順序：(1) mingGongTransformMatrix (2) findStarPalaceTransformMeaning(star, "命宮", transform) (3) 通用句，不可空白。 */
const MING_GONG_TRANSFORM_FALLBACK = "命宮的四化會透過本命、大限、流年層級牽動此宮，可對照全盤能量流向理解。";

/**
 * 命宮四化敘事：優先 mingGongTransformMatrix → starPalaceTransformMatrix（星×命宮×四化）→ 通用 fallback（不可空白）。
 */
export function buildMingGongTransformNarrative(event: {
  starName: string;
  type: string;
} | null): string {
  if (!event?.starName?.trim()) return "";
  const starName = event.starName.trim();
  const type = toTransformType(event.type);
  const typeKey = type === "祿" ? "lu" : type === "權" ? "quan" : type === "科" ? "ke" : "ji";
  const fromMing = getMingGongTransformMeaning(starName, typeKey);
  if (fromMing?.trim()) return fromMing;
  const fromMatrix = findStarPalaceTransformMeaning(starName, "命宮", type);
  if (fromMatrix?.trim()) return fromMatrix;
  return MING_GONG_TRANSFORM_FALLBACK;
}
