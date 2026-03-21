/**
 * 10 個 ruleType 的單一模板：message / action / evidence，
 * 可對應宮位／星曜／四化／from→to。不允許多句輪替。
 */

import { getPalaceSemantic } from "./starSemanticDictionary.js";

export type RuleTypeId =
  | "lu_overlap_palace"
  | "ji_overlap_palace"
  | "lu_ji_same_palace"
  | "lu_ji_same_star"
  | "decade_year_sync"
  | "quan_ji_same_point"
  | "ke_resolve_ji"
  | "lu_into_palace"
  | "ji_out_palace"
  | "multi_palace_link";

export interface RuleTypePhraseSet {
  ruleType: RuleTypeId;
  label: string;
  messageTemplate: string;
  actionTemplate: string;
  evidenceTemplate: string;
}

export const PATTERN_PHRASE_LIBRARY_BY_RULE_TYPE: RuleTypePhraseSet[] = [
  {
    ruleType: "lu_overlap_palace",
    label: "同宮祿疊加（資源集中）",
    messageTemplate: "{palace} 被多層祿星點亮，機會與資源更容易在這裡聚集。",
    actionTemplate: "優先把時間與資源投入在 {palace}。",
    evidenceTemplate: "證據：{layer1}{star1}化祿、{layer2}{star2}化祿 同時影響 {palace}",
  },
  {
    ruleType: "ji_overlap_palace",
    label: "同宮忌疊加（高壓區）",
    messageTemplate: "{palace} 承受較多忌星壓力，事件容易在這裡被觸發。",
    actionTemplate: "面對 {palace} 時先建立界線與節奏。",
    evidenceTemplate: "證據：{star1}化忌、{star2}化忌 同時影響 {palace}",
  },
  {
    ruleType: "lu_ji_same_palace",
    label: "祿忌同宮（機會×壓力）",
    messageTemplate: "{palace} 同時有祿與忌，重要事件會在這裡發生。",
    actionTemplate: "在 {palace} 先小規模測試，再逐步放大。",
    evidenceTemplate: "證據：祿星與忌星同時影響 {palace}",
  },
  {
    ruleType: "lu_ji_same_star",
    label: "同星祿忌（人格拉扯）",
    messageTemplate: "{star}代表『{starCore}』，同時承擔資源與壓力，容易出現拉扯。",
    actionTemplate: "當{starThemesLead}被引動時，先建立原則再行動。",
    evidenceTemplate: "證據：{star} 同時化祿與化忌",
  },
  {
    ruleType: "decade_year_sync",
    label: "十年×流年同步",
    messageTemplate: "今年四化與大限一致，今年是十年主題的放大點。",
    actionTemplate: "今年決定以十年視野檢視，不放一次性賭注。",
    evidenceTemplate: "證據：流年四化與大限四化方向一致",
  },
  {
    ruleType: "quan_ji_same_point",
    label: "權忌同點（壓力型責任）",
    messageTemplate: "{palace} 權星與忌星同點，責任與壓力疊加。",
    actionTemplate: "為 {palace} 設定清楚邊界與角色。",
    evidenceTemplate: "證據：權星與忌星同時影響 {palace}",
  },
  {
    ruleType: "ke_resolve_ji",
    label: "科解忌（修復能力）",
    messageTemplate: "{palace} 有科星與忌星，可透過學習與調整改善。",
    actionTemplate: "將經驗整理成方法，會讓情況逐漸改善。",
    evidenceTemplate: "證據：科星與忌星同時影響 {palace}",
  },
  {
    ruleType: "lu_into_palace",
    label: "祿入宮（資源流入）",
    messageTemplate: "{star} 化祿進入 {palace}，此領域更容易出現機會。",
    actionTemplate: "多留意與 {palace} 相關的機會，適合長期投入。",
    evidenceTemplate: "證據：{star}化祿飛入 {palace}",
  },
  {
    ruleType: "ji_out_palace",
    label: "忌出宮（壓力來源）",
    messageTemplate: "{star} 化忌從 {fromPalace} 出，壓力根源在 {fromPalace}。",
    actionTemplate: "先處理 {fromPalace} 的根本問題，而不是只看表面事件。",
    evidenceTemplate: "證據：{star}化忌自 {fromPalace} 出",
  },
  {
    ruleType: "multi_palace_link",
    label: "多宮連動（事件鏈）",
    messageTemplate: "{palaceA} 與 {palaceB} 形成連動，會同時牽動。",
    actionTemplate: "決策時同時考慮 {palaceA} 與 {palaceB} 的影響。",
    evidenceTemplate: "證據：四化同時牽動 {palaceA} 與 {palaceB}",
  },
];

export function getPhraseSetByRuleType(ruleType: RuleTypeId): RuleTypePhraseSet | undefined {
  return PATTERN_PHRASE_LIBRARY_BY_RULE_TYPE.find((r) => r.ruleType === ruleType);
}

function transformToOverlapType(evidence: Record<string, unknown>): RuleTypeId {
  const t = evidence.transform as string | undefined;
  if (t === "忌" || t === "忌星") return "ji_overlap_palace";
  return "lu_overlap_palace";
}

export function mapRuleIdToRuleType(
  ruleId: string,
  evidence: Record<string, unknown>
): RuleTypeId | null {
  switch (ruleId) {
    case "R02_SAME_PALACE_OVERLAP":
    case "R03_SAME_TRANSFORM_OVERLAP":
      return transformToOverlapType(evidence);
    case "R04_SAME_STAR_LU_JI":
      return "lu_ji_same_star";
    case "R05_SAME_PALACE_LU_JI":
      return "lu_ji_same_palace";
    case "R06_QUAN_JI_SAME_POINT":
      return "quan_ji_same_point";
    case "R07_KE_JI_SAME_POINT":
      return "ke_resolve_ji";
    case "R08_DECADE_YEAR_SYNC":
      return "decade_year_sync";
    case "R09_DECADE_YEAR_SAME_JI":
      return "ji_overlap_palace";
    case "R10_DECADE_YEAR_SAME_LU":
      return "lu_overlap_palace";
    case "R11_JI_FROM_A_TO_B":
      return "ji_out_palace";
    case "R12_LU_INTO_PALACE":
      return "lu_into_palace";
    case "R15_LU_CONCENTRATED":
    case "R16_JI_DISPERSED":
      return "multi_palace_link";
    case "R20_SAME_PALACE_SAME_TRANSFORM_STACK":
      return transformToOverlapType(evidence);
    default:
      return null;
  }
}

export function evidenceToRuleTypePlaceholders(evidence: Record<string, string | number | string[]>): Record<string, string | number | string[]> {
  const layers = evidence.layers;
  const arrLayers = Array.isArray(layers) ? (layers as string[]) : layers !== undefined ? [String(layers)] : [];
  const palaces = evidence.palaces;
  const arrPalaces = Array.isArray(palaces) ? (palaces as string[]) : palaces !== undefined ? [String(palaces)] : [];
  const palaceRef = String(evidence.palace ?? evidence.toPalace ?? evidence.palaceA ?? arrPalaces[0] ?? "").trim();
  const palaceCore = palaceRef ? (getPalaceSemantic(palaceRef)?.core ?? "該領域") : "該領域";
  return {
    ...evidence,
    layer1: arrLayers[0] ?? evidence.layer1 ?? "",
    layer2: arrLayers[1] ?? evidence.layer2 ?? "",
    star1: evidence.star1 ?? evidence.star ?? "",
    star2: evidence.star2 ?? evidence.star ?? "",
    palaceA: evidence.palaceA ?? arrPalaces[0] ?? evidence.palace ?? "",
    palaceB: evidence.palaceB ?? arrPalaces[1] ?? evidence.toPalace ?? "",
    palaceCore,
  };
}
