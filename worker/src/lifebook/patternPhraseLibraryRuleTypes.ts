/**
 * 10 個 ruleType 的句庫：message / action / evidence 模板，
 * 供「規則 → 可閱讀句型」渲染層使用。AI 渲染版不含數值、risk、ruleId。
 * 可匯出為 JSON 或對應 DB 表給 Cursor / 前端使用。
 */

import { getPalaceSemantic } from "./starSemanticDictionary.js";

export type RuleTypeId =
  | "lu_overlap_palace"      // 一、同宮祿疊加（資源集中）
  | "ji_overlap_palace"      // 二、同宮忌疊加（高壓區）
  | "lu_ji_same_palace"      // 三、祿忌同宮（機會×壓力）
  | "lu_ji_same_star"        // 四、同星祿忌（人格拉扯）
  | "decade_year_sync"       // 五、十年×流年同步
  | "quan_ji_same_point"     // 六、權忌同點（壓力型責任）
  | "ke_resolve_ji"          // 七、科解忌（修復能力）
  | "lu_into_palace"         // 八、祿入宮（資源流入）
  | "ji_out_palace"          // 九、忌出宮（壓力來源）
  | "multi_palace_link";     // 十、多宮連動（事件鏈）

export interface RuleTypePhraseSet {
  ruleType: RuleTypeId;
  label: string;
  messageTemplates: [string, string, string];
  actionTemplates: [string, string, string];
  evidenceTemplates: [string, string];
}

/** Placeholder 說明：{palace} {palaceA} {palaceB} {fromPalace} {star} {star1} {star2} {layer1} {layer2} */
export const PATTERN_PHRASE_LIBRARY_BY_RULE_TYPE: RuleTypePhraseSet[] = [
  {
    ruleType: "lu_overlap_palace",
    label: "同宮祿疊加（資源集中）",
    messageTemplates: [
      "{palace} 這個領域在你的命盤中被多層資源點亮，代表機會與資源更容易在這裡聚集。",
      "多個祿星同時指向 {palace}，顯示這裡是你容易獲得支持與回報的舞台。",
      "在整體結構中，{palace} 的資源訊號特別明顯，很多機會會從這裡開始展開。",
    ],
    actionTemplates: [
      "若要放大人生槓桿，可以優先把時間與資源投入在 {palace}。",
      "當新的機會出現時，優先評估與 {palace} 相關的方向。",
      "將 {palace} 視為長期經營的核心領域，會更容易累積成果。",
    ],
    evidenceTemplates: [
      "證據：{layer1}{star1}化祿、{layer2}{star2}化祿 同時影響 {palace}",
      "證據：多個祿星飛入 {palace}，顯示資源在此集中",
    ],
  },
  {
    ruleType: "ji_overlap_palace",
    label: "同宮忌疊加（高壓區）",
    messageTemplates: [
      "{palace} 在你的盤中承受較多壓力訊號，很多事件容易在這裡被觸發。",
      "多個忌星集中在 {palace}，代表這個領域容易反覆出現考題。",
      "{palace} 的能量較為緊繃，需要更有意識地管理節奏。",
    ],
    actionTemplates: [
      "面對 {palace} 的議題時，先建立界線與節奏，會比急著解決更有效。",
      "在 {palace} 的決策上保持保守與彈性，可以減少壓力累積。",
      "若 {palace} 出現問題，先從長期調整結構，而不是短期補救。",
    ],
    evidenceTemplates: [
      "證據：{star1}化忌、{star2}化忌 同時影響 {palace}",
      "證據：多層四化壓力訊號集中在 {palace}",
    ],
  },
  {
    ruleType: "lu_ji_same_palace",
    label: "祿忌同宮（機會×壓力）",
    messageTemplates: [
      "{palace} 同時出現機會與壓力訊號，代表很多重要事件會在這裡發生。",
      "在 {palace} 既有資源也有考題，這是一個需要判斷力的領域。",
      "{palace} 的能量呈現「機會與風險並存」，很多與 {palaceCore} 相關的事情，需要更謹慎地評估。",
    ],
    actionTemplates: [
      "在 {palace} 的策略是：先小規模測試，再逐步放大。",
      "面對 {palace} 的機會時，同時要保留調整空間。",
      "只要能控制節奏，{palace} 的機會往往大於風險。",
    ],
    evidenceTemplates: [
      "證據：祿星與忌星同時影響 {palace}",
      "證據：{layer1}{star1}化祿 與 {layer2}{star2}化忌 同時指向 {palace}",
    ],
  },
  {
    ruleType: "lu_ji_same_star",
    label: "同星祿忌（人格拉扯）",
    messageTemplates: [
      "{star}代表『{starCore}』。當它同時承擔資源與壓力時，你在這個主題上容易出現拉扯。",
      "{star}代表『{starCore}』，能量既帶來機會也帶來考題，需要更成熟地運用。",
      "當與『{starThemes}』相關的事情被引動時，往往既想投入又會有所顧慮。",
    ],
    actionTemplates: [
      "當{starThemesLead}被引動時，先建立原則再行動。",
      "讓決策回到長期目標，而不是被情緒帶動。",
      "當{starThemesLead}被引動時，先觀察節奏再做判斷。",
    ],
    evidenceTemplates: [
      "證據：{star} 同時出現化祿與化忌",
      "證據：不同層四化同時點名 {star}",
    ],
  },
  {
    ruleType: "decade_year_sync",
    label: "十年×流年同步",
    messageTemplates: [
      "今年的四化方向與十年大限一致，代表這一年是十年主題的放大點。",
      "流年與大限的能量同步，使得今年的事件更具影響力。",
      "今年的變化往往與整個十年的方向密切相關。",
    ],
    actionTemplates: [
      "今年的決定可能影響未來幾年的節奏，適合放慢思考。",
      "把今年當作調整方向的重要節點。",
      "重大選擇建議從長期結構來評估。",
    ],
    evidenceTemplates: [
      "證據：流年四化與大限四化方向一致",
      "證據：同一組星曜同時出現在大限與流年",
    ],
  },
  {
    ruleType: "quan_ji_same_point",
    label: "權忌同點（壓力型責任）",
    messageTemplates: [
      "在 {palace} 容易同時感受到責任與壓力。",
      "這個領域常會讓你不自覺地扛起更多事情。",
      "{palace} 既需要主導，也容易帶來負擔。",
    ],
    actionTemplates: [
      "適當分配責任，比單純努力更重要。",
      "為 {palace} 設定清楚的邊界與角色。",
      "不要讓所有事情都集中在自己身上。",
    ],
    evidenceTemplates: [
      "證據：權星與忌星同時影響 {palace}",
      "證據：{star1}化權 與 {star2}化忌 指向同一領域",
    ],
  },
  {
    ruleType: "ke_resolve_ji",
    label: "科解忌（修復能力）",
    messageTemplates: [
      "雖然 {palace} 出現壓力訊號，但同時存在修復與調整的力量。",
      "這代表問題往往能透過學習與調整逐步改善。",
      "在 {palace} 的困難，多半可以透過方法優化來解決。",
    ],
    actionTemplates: [
      "將經驗整理成方法，會讓情況逐漸改善。",
      "透過學習或調整流程，可以化解很多壓力。",
      "把重點放在改善系統，而不是責備自己。",
    ],
    evidenceTemplates: [
      "證據：科星與忌星同時影響 {palace}",
      "證據：{star1}化科 與 {star2}化忌 同時出現",
    ],
  },
  {
    ruleType: "lu_into_palace",
    label: "祿入宮（資源流入）",
    messageTemplates: [
      "{star} 化祿進入 {palace}，代表這個領域更容易出現機會。",
      "在 {palace} 往往能得到支持或資源。",
      "很多好機會會與 {palace} 有關。",
    ],
    actionTemplates: [
      "多留意與 {palace} 相關的機會。",
      "適合在 {palace} 的領域長期投入。",
      "保持開放，機會可能從意想不到的地方出現。",
    ],
    evidenceTemplates: [
      "證據：{star}化祿飛入 {palace}",
      "證據：祿星落入 {palace}",
    ],
  },
  {
    ruleType: "ji_out_palace",
    label: "忌出宮（壓力來源）",
    messageTemplates: [
      "{star} 化忌從 {fromPalace} 出發，壓力的根源往往來自這個領域。",
      "很多困擾其實與 {fromPalace} 的議題有關。",
      "當 {fromPalace} 被觸動時，其他領域也容易受到影響。",
    ],
    actionTemplates: [
      "先處理 {fromPalace} 的根本問題，而不是只看表面事件。",
      "重新檢視 {fromPalace} 的習慣或模式。",
      "理解來源，比急著解決結果更重要。",
    ],
    evidenceTemplates: [
      "證據：{star}化忌自 {fromPalace} 出",
      "證據：四化顯示壓力起點在 {fromPalace}",
    ],
  },
  {
    ruleType: "multi_palace_link",
    label: "多宮連動（事件鏈）",
    messageTemplates: [
      "{palaceA} 與 {palaceB} 之間形成連動，很多事情會同時牽動兩者。",
      "在你的命盤中，{palaceA} 與 {palaceB} 的關係特別密切。",
      "這兩個領域常會互相影響。",
    ],
    actionTemplates: [
      "在做決策時，同時考慮 {palaceA} 與 {palaceB} 的影響。",
      "當 {palaceA} 出現變化時，也留意 {palaceB} 的動態。",
      "理解兩個領域的互動，可以避免誤判。",
    ],
    evidenceTemplates: [
      "證據：四化同時牽動 {palaceA} 與 {palaceB}",
      "證據：飛星路徑顯示兩宮互相影響",
    ],
  },
];

export function getPhraseSetByRuleType(ruleType: RuleTypeId): RuleTypePhraseSet | undefined {
  return PATTERN_PHRASE_LIBRARY_BY_RULE_TYPE.find((r) => r.ruleType === ruleType);
}

/** 依 evidence.transform 選祿疊加或忌疊加 */
function transformToOverlapType(evidence: Record<string, unknown>): RuleTypeId {
  const t = evidence.transform as string | undefined;
  if (t === "忌" || t === "忌星") return "ji_overlap_palace";
  return "lu_overlap_palace";
}

/**
 * S00RuleId → RuleTypeId 對應；無對應時回傳 null（renderer 改回用 ruleId 句庫）
 */
export function mapRuleIdToRuleType(
  ruleId: string,
  evidence: Record<string, unknown>
): RuleTypeId | null {
  switch (ruleId) {
    case "R02_SAME_PALACE_OVERLAP":
      return transformToOverlapType(evidence);
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

/** 將 pattern hit evidence 鍵名對齊 10 ruleType 模板的 placeholder（layer1/layer2, star1/star2, palaceA/palaceB, palaceCore） */
export function evidenceToRuleTypePlaceholders(evidence: Record<string, string | number | string[]>): Record<string, string | number | string[]> {
  const layers = evidence.layers;
  const arrLayers = Array.isArray(layers) ? layers as string[] : layers !== undefined ? [String(layers)] : [];
  const palaces = evidence.palaces;
  const arrPalaces = Array.isArray(palaces) ? palaces as string[] : palaces !== undefined ? [String(palaces)] : [];
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
