/**
 * 十二宮通用 adapter：讓每一宮都具備與命宮同級的解盤式敘事。
 * Phase 3A：宮位／星曜語意與四化敘事改為經 narrativeFacade 取得，不再直接查 dictionary／matrix。
 */

import { getPalaceSemantic, getStarSemantic } from "./starSemanticDictionary.js";
import { createNarrativeFacade } from "./narrativeFacade.js";
import {
  buildMingGongStarNarrative,
  buildMingGongTransformNarrative,
  buildMingGongAssistantNarrative,
  type MingGongStarMode,
} from "./mingGongAdapters.js";
import { getMingGongSanfangInsight } from "./mingGongSanfangMatrix.js";
import { getSanfangFamilyForPalace } from "../utils/starSanfangFamilies.js";
import { STAR_NAME_ZH_TO_ID } from "./schema.js";
import type { AssembleContentLookup } from "./assembler.js";

/** 宮位 key：命宮、財帛、官祿等（getPalaceKeyForSection 回傳格式） */
function toPalaceDisplayName(palaceKey: string): string {
  const s = (palaceKey ?? "").trim();
  if (!s) return "此宮";
  if (s === "命宮") return "命宮";
  return s.endsWith("宮") ? s : s + "宮";
}

/**
 * 宮位核心定義一句：一律由 getPalaceSemantic 組句，可對應宮位結構。
 */
export function pickPalaceCoreDefinition(palaceKey: string, _seed?: number): string {
  const pal = getPalaceSemantic(palaceKey);
  if (!pal) return "";
  const name = toPalaceDisplayName(palaceKey);
  return `${name}掌管的是${pal.core}。${pal.plain}`;
}

/**
 * 主星四段敘事（上場／優勢／失衡／成熟）：命宮用 mingGongStarMatrix，其餘用 getStarSemantic + meaningInPalace/starBaseCore。
 */
export function buildPalaceStarNarrative(
  starName: string,
  palaceKey: string,
  mode: MingGongStarMode,
  opts?: {
    starBaseCore?: Record<string, string>;
    starPalacesMain?: Record<string, string>;
    starPalacesAux?: Record<string, string>;
  }
): string {
  const name = (starName ?? "").trim();
  if (!name) return "";

  if (palaceKey === "命宮") {
    return buildMingGongStarNarrative(name, mode, { starBaseCore: opts?.starBaseCore });
  }

  const palaceName = toPalaceDisplayName(palaceKey);
  const palaceShort = palaceKey.endsWith("宮") ? palaceKey.replace(/宮$/, "") : palaceKey;
  const shortForPalace = palaceShort === "命" ? "命宮" : palaceShort;
  const meaningInPalace =
    opts?.starPalacesMain?.[`${name}_${palaceName}`] ??
    opts?.starPalacesMain?.[`${name}_${shortForPalace}`] ??
    opts?.starPalacesAux?.[`${name}_${palaceName}`] ??
    opts?.starPalacesAux?.[`${name}_${shortForPalace}`];

  const sem = getStarSemantic(name);
  if (sem) {
    const core = sem.core;
    const themes = sem.themes.slice(0, 3).join("、") || core;
    const firstInPalace = meaningInPalace?.split(/[，。；]/)[0]?.trim();
    switch (mode) {
      case "opening":
        return firstInPalace
          ? `${name}在此宮象徵${firstInPalace}，因此你在${palaceName}帶著與此相應的節奏上場。`
          : `${name}代表${core}，在${palaceName}你帶著與此相應的氣質運作。`;
      case "strength":
        return firstInPalace
          ? `你在${palaceName}的優勢，與「${firstInPalace}」相呼應。`
          : `${name}帶來與「${themes}」相關的優勢，是此宮最自然的強項。`;
      case "tension":
        return sem.risk
          ? `當${sem.risk}，在${palaceName}容易先出現失衡。`
          : `若過度依賴${name}的慣性，此宮容易在壓力下失衡。`;
      case "mature":
        return sem.advice
          ? `成熟的${name}在${palaceName}，是${sem.advice}`
          : `成熟後，可善用此星在${palaceName}所長，並留意節奏與界線。`;
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
        return meaningInPalace
          ? `${meaningInPalace.split(/[，。；]/)[0] ?? firstClause}，因此你在${palaceName}帶著與此相應的節奏。`
          : `此星在命盤象徵${firstClause}，在${palaceName}你帶著與此相應的氣質運作。`;
      case "strength":
        return `你在此宮的優勢，與「${firstClause}」相呼應。`;
      case "tension":
        return `若過度依賴此星慣性，${palaceName}容易在壓力下失衡。`;
      case "mature":
        return `成熟後，可善用此星所長，並在${palaceName}留意節奏與界線。`;
      default:
        return "";
    }
  }

  return "";
}

/**
 * 輔星／煞星整合句：十二宮共用同一套短標籤與句庫邏輯。
 */
export function buildPalaceAssistantNarrative(
  assistantStars: string[],
  shaStars: string[]
): string {
  return buildMingGongAssistantNarrative(assistantStars, shaStars);
}

function toTransformType(type: string): string {
  const t = (type ?? "").trim().toLowerCase();
  if (t === "lu" || t === "祿") return "祿";
  if (t === "quan" || t === "權") return "權";
  if (t === "ke" || t === "科") return "科";
  if (t === "ji" || t === "忌") return "忌";
  return type;
}

/**
 * 四化敘事：經 narrativeFacade.getTransformSemantic 取得 meaning；命宮委託 buildMingGongTransformNarrative。
 */
export function buildPalaceTransformNarrative(
  event: { starName: string; type: string } | null,
  palaceKey: string
): string {
  if (!event?.starName?.trim()) return "";
  const starName = event.starName.trim();
  const type = toTransformType(event.type) as "祿" | "權" | "科" | "忌";
  if (palaceKey === "命宮") return buildMingGongTransformNarrative(event);
  if (type !== "祿" && type !== "權" && type !== "科" && type !== "忌") return "";
  const palaceForMatrix = toPalaceDisplayName(palaceKey);
  const facade = createNarrativeFacade();
  const block = facade.getTransformSemantic(type, starName, palaceForMatrix);
  return block.meaning?.trim() ?? "";
}

/**
 * 三方四正洞察：命宮用 mingGongSanfangMatrix，財帛／官祿用 starSanfangFamilies 的 caiPattern／guanPattern，其餘用 roleSummary 或通用句。
 */
export function getPalaceSanfangInsight(
  palaceKey: string,
  leadMainStarName: string,
  seed: number,
  content: AssembleContentLookup | undefined,
  chartJson: Record<string, unknown> | undefined
): string {
  if (palaceKey === "命宮") {
    return getMingGongSanfangInsight(leadMainStarName, seed, content);
  }
  if (!chartJson || !content?.starSanfangFamilies) {
    return "此宮不會單獨運作，會與三方四正的其他宮位相互牽動，可對照全盤主戰場與能量流向一起理解。";
  }
  const sanfang = getSanfangFamilyForPalace(palaceKey, chartJson, content);
  if (!sanfang) {
    return "此宮不會單獨運作，會與三方四正的其他宮位相互牽動，可對照全盤主戰場與能量流向一起理解。";
  }
  if (palaceKey === "財帛" && sanfang.caiPattern?.trim()) return sanfang.caiPattern.trim();
  if (palaceKey === "官祿" && sanfang.guanPattern?.trim()) return sanfang.guanPattern.trim();
  if (sanfang.roleSummary?.trim()) return sanfang.roleSummary.trim();
  return `你屬於「${sanfang.familyLabel}」，由 ${sanfang.mainStarName} 帶頭，此宮的節奏會與命、財、官、遷三方四正相互牽動。`;
}
