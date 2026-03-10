/**
 * 主星 → 三方星系：依宮位主星取 starSanfangFamilies 的 familyLabel 與 pattern。
 * 僅用 14 主星，依宮位選 mingPattern / caiPattern / guanPattern。
 */

import { buildAssembleInput } from "../lifebook/index.js";
import { PALACE_NAME_ZH_TO_ID, STAR_ID_TO_NAME } from "../lifebook/index.js";
import type { AssembleContentLookup, StarSanfangFamily } from "../lifebook/assembler.js";

const MAIN_STARS = [
  "紫微", "天機", "太陽", "太陰", "武曲", "廉貞", "貪狼", "七殺", "破軍",
  "天同", "天梁", "巨門", "天相", "天府",
] as const;

const MAIN_STARS_SET = new Set<string>(MAIN_STARS);

/**
 * 從 chartJson 取得該宮位星曜列表，回傳第一顆屬於 14 主星的名稱（中文）；無則 null。
 */
export function getMainStarForPalace(
  palaceKey: string,
  chartJson: Record<string, unknown>
): string | null {
  const palaceIdMap = PALACE_NAME_ZH_TO_ID as Record<string, string>;
  const tryKey = palaceKey === "命宮" ? "命宮" : palaceKey.replace(/宮$/, "");
  const palaceId = palaceIdMap[palaceKey] ?? palaceIdMap[tryKey] ?? palaceIdMap[tryKey + "宮"];
  if (!palaceId) return null;

  const assembleInput = buildAssembleInput(chartJson, undefined, "zh-TW");
  const starByPalace = assembleInput?.starByPalace as Partial<Record<string, string[]>> | undefined;
  if (!starByPalace || typeof starByPalace !== "object") return null;

  const starIds = starByPalace[palaceId];
  if (!Array.isArray(starIds)) return null;

  const idToName = STAR_ID_TO_NAME as Record<string, string>;
  for (const id of starIds) {
    const name = idToName[id] ?? String(id);
    if (MAIN_STARS_SET.has(name)) return name;
  }
  return null;
}

export interface SanfangFamilyResult {
  mainStarName: string;
  familyLabel: string;
  mingPattern?: string;
  caiPattern?: string;
  guanPattern?: string;
  roleSummary?: string;
}

/**
 * 依宮位主星從 content.starSanfangFamilies 取出星系標籤與對應 pattern。
 * 命宮 → mingPattern，財帛 → caiPattern，官祿 → guanPattern，其餘 → roleSummary。
 */
export function getSanfangFamilyForPalace(
  palaceKey: string,
  chartJson: Record<string, unknown>,
  content: AssembleContentLookup
): SanfangFamilyResult | null {
  const mainStar = getMainStarForPalace(palaceKey, chartJson);
  if (!mainStar) return null;

  const families = content.starSanfangFamilies;
  if (!families || typeof families !== "object") return null;

  const family = families[mainStar] as StarSanfangFamily | undefined;
  if (!family || !family.familyLabel) return null;

  return {
    mainStarName: mainStar,
    familyLabel: family.familyLabel,
    mingPattern: family.mingPattern,
    caiPattern: family.caiPattern,
    guanPattern: family.guanPattern,
    roleSummary: family.roleSummary,
  };
}
