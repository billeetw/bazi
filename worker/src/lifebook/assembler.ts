/**
 * 組裝器：依命盤特徵匹配 RISK_RULES，產出觸發的神經迴路與高壓 Snippet key。
 * 供命書生成時注入 prompt 或 80% 組裝使用。
 */

import type { PalaceId, MainStarId, TenGodId, WuXingId, NeuralLoopId } from "./schema.js";
import type { TransformId } from "./schema.js";
import {
  RISK_RULES,
  type RiskRuleWhen,
  type WhenStarPalaceTransform,
  type WhenTenGodPalaceExcess,
  type WhenWuxingExtreme,
} from "./rules.js";

/** 命盤特徵輸入：各宮主星、十神、五行強弱、四化 */
export interface AssembleInput {
  /** 各宮位內的主星列表（命盤算出） */
  starByPalace: Partial<Record<PalaceId, MainStarId[]>>;
  /** 各宮位對應的十神（命盤算出） */
  tenGodByPalace: Partial<Record<PalaceId, TenGodId>>;
  /** 五行強弱：strong = 偏強, weak = 偏弱（用於匹配 wuxing_extreme） */
  wuxingStrength?: Partial<Record<WuXingId, "strong" | "weak">>;
  /** 各主星的四化：化祿 lu / 化權 quan / 化科 ke / 化忌 ji（命盤算出） */
  fourTransformations?: Partial<Record<MainStarId, TransformId>>;
}

/** 組裝結果：觸發的神經迴路與高壓 Snippet key */
export interface AssembleResult {
  loops: NeuralLoopId[];
  highPressureKeys: string[];
}

/**
 * 依命盤特徵匹配規則，回傳觸發的 attachLoops 與 hpKey。
 */
export function assembleRiskProfile(input: AssembleInput): AssembleResult {
  const loops: NeuralLoopId[] = [];
  const hp: string[] = [];

  for (const rule of RISK_RULES) {
    if (matchRule(rule.when, input)) {
      loops.push(...rule.attachLoops);
      hp.push(rule.hpKey);
    }
  }

  return {
    loops: Array.from(new Set(loops)),
    highPressureKeys: Array.from(new Set(hp)),
  };
}

/**
 * 單一規則條件是否成立。
 */
function matchRule(when: RiskRuleWhen, input: AssembleInput): boolean {
  switch (when.kind) {
    case "star_palace_transform":
      return matchStarPalaceTransform(when, input);
    case "tengod_palace_excess":
      return matchTenGodPalaceExcess(when, input);
    case "wuxing_extreme":
      return matchWuxingExtreme(when, input);
    default:
      return false;
  }
}

/** 星曜 × 宮位 × 四化：該宮有此星且該星為此四化 */
function matchStarPalaceTransform(
  when: WhenStarPalaceTransform,
  input: AssembleInput
): boolean {
  const starsInPalace = input.starByPalace[when.palaceId];
  if (!starsInPalace?.includes(when.starId)) return false;
  const transform = input.fourTransformations?.[when.starId];
  return transform === when.transform;
}

/** 十神 × 宮位過旺：該宮的十神等於規則指定 */
function matchTenGodPalaceExcess(
  when: WhenTenGodPalaceExcess,
  input: AssembleInput
): boolean {
  return input.tenGodByPalace[when.palaceId] === when.tenGodId;
}

/** 五行極端：strong 對應 high，weak 對應 low */
function matchWuxingExtreme(when: WhenWuxingExtreme, input: AssembleInput): boolean {
  const strength = input.wuxingStrength?.[when.wuxingId];
  if (strength == null) return false;
  if (when.extreme === "high") return strength === "strong";
  if (when.extreme === "low") return strength === "weak";
  return false;
}

/** 原型單筆：label 短稱、title 標題、description 敘事 */
export interface ArchetypeEntry {
  label: string;
  title: string;
  description: string;
}

/** Content 中神經迴路、高壓、星曜、五行、六識、原型的取用介面（與 DbContent 部分欄位對應） */
export interface AssembleContentLookup {
  neuralLoops?: Record<string, string>;
  highPressure?: Record<string, string>;
  consciousPalace?: Record<string, string>;
  starBaseCore?: Record<string, string>;
  starBaseShadow?: Record<string, string>;
  /** 主星成熟段：starId -> 文案（與 starBaseCore / starBaseShadow 並列） */
  starBaseMature?: Record<string, string>;
  wuxingEnergy?: Record<string, string>;
  /** 五行原型（英雄／戰士／看守者／裁判者／神秘者）：key = wuxingId */
  archetypeElement?: Record<string, ArchetypeEntry>;
  /** 星曜原型（王者／智者…）：key = starId */
  archetypeStar?: Record<string, ArchetypeEntry>;
  /** 22 章節骨架（四欄）：有值時當粗稿塞進 prompt，供模型潤飾＋填入底層參數 */
  lifebookSection?: Record<
    string,
    { structure_analysis?: string; behavior_pattern?: string; blind_spots?: string; strategic_advice?: string }
  >;
  /** 星曜×宮位：key = 「星名_宮名」如「紫微_命宮」「天機_福德」，value = 該星在該宮的表現描述 */
  starPalaces?: Record<string, string>;
  /** 14 主星×12 宮顧問口吻戰略解析（優先於 starPalaces） */
  starPalacesMain?: Record<string, string>;
  /** 輔星／煞星／雜曜×宮位：解釋（資源取得方式／風險行為） */
  starPalacesAux?: Record<string, string>;
  /** 輔星／煞星／雜曜×宮位：行動建議（可執行方針） */
  starPalacesAuxAction?: Record<string, string>;
  /** 輔星／煞星／雜曜×宮位：風險等級 1～5（高風險→保守防禦語氣） */
  starPalacesAuxRisk?: Record<string, number>;
  /** 十神×宮位：key = 「十神名_宮名」如「比肩_命宮」，value = 該十神在該宮的角色描述 */
  tenGodPalaces?: Record<string, string>;
  /** 十神×宮位（ontology id）：key = tenGodId.palaceId 如 biJian.ming，value = 角色描述 */
  tenGodPalacesById?: Record<string, string>;
  /** 主星三方星系：星名（紫微、天機…）→ 星系標籤與命/財/官 pattern */
  starSanfangFamilies?: Record<string, StarSanfangFamily>;
  /** Phase 2：星曜權重與基礎風險，供宮位 aggregator */
  starMetadata?: { starNameZhToId: Record<string, string>; stars: Record<string, { name_zh: string; category: string; base_weight: number; base_risk: number }> };
  /** Phase 2：riskLevel 對應的風險總結與行動建議（key = riskLevel_1 … riskLevel_5） */
  palaceRiskSummary?: Record<string, string>;
  palaceActionAdvice?: Record<string, string>;
  /** 輔星／煞星／雜曜 通用一句（星名 → 說明），fallback 敘事用 */
  starBaseMeaning?: Record<string, string>;
  /** 宮位語境短句（宮名 → 如「職涯與社會角色」），fallback 敘事用 */
  palaceContexts?: Record<string, string>;
}

/** 主星對應的三方星系說明（命宮／財帛／官祿專用） */
export interface StarSanfangFamily {
  familyLabel: string;
  coreStars?: string[];
  roleSummary?: string;
  mingPattern?: string;
  caiPattern?: string;
  guanPattern?: string;
}

/**
 * 依組裝結果從 content 取出對應的迴路描述與高壓文案，供 prompt 或章節組裝使用。
 */
export function resolveAssembleSnippets(
  result: AssembleResult,
  content: AssembleContentLookup
): { loopSnippets: string[]; highPressureSnippets: string[] } {
  const loopSnippets = result.loops
    .map((id) => content.neuralLoops?.[id])
    .filter((s): s is string => Boolean(s));
  const highPressureSnippets = result.highPressureKeys
    .map((key) => content.highPressure?.[key])
    .filter((s): s is string => Boolean(s));
  return { loopSnippets, highPressureSnippets };
}
