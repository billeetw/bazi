/**
 * Pattern Phrase Library：依 ruleId 提供單一 message / action / evidence 模板，
 * 可對應宮位／星曜／四化／from→to。不允許多句輪替或隨機選句。
 */

import type { S00RuleId } from "./s00FourTransformRules.js";

export interface RulePhraseSet {
  messageTemplate: string;
  actionTemplate: string;
  evidenceTemplate: string;
}

/** 支援的 placeholder：palace, fromPalace, toPalace, star, layers, transform, target, count, palaces, evidenceText, starCore, starThemes, starThemesLead */
const LIB: Record<S00RuleId, RulePhraseSet> = {
  R01_SAME_STAR_OVERLAP: {
    messageTemplate: "{star}代表『{starCore}』，在 {layers} 重複被點名，是這局的核心槓桿。",
    actionTemplate: "當涉及『{starThemes}』相關的事情時，先做主動設計而不是反射應對。",
    evidenceTemplate: "證據：{layers} 四化皆涉及 {star}。",
  },
  R02_SAME_PALACE_OVERLAP: {
    messageTemplate: "{palace} 被 {layers} 同時點亮，此宮是當前焦點。",
    actionTemplate: "重大決策先檢查 {palace}：資源/責任是否在此集中。",
    evidenceTemplate: "證據：{layers} 四化皆入 {palace}。",
  },
  R03_SAME_TRANSFORM_OVERLAP: {
    messageTemplate: "{transform} 在 {palace} 疊加，此宮的 {transform} 性質被放大。",
    actionTemplate: "在 {palace} 善用 {transform} 的性質，但避免單點過度依賴。",
    evidenceTemplate: "證據：{layers} 的 {transform} 皆落 {palace}。",
  },
  R04_SAME_STAR_LU_JI: {
    messageTemplate: "{star}代表『{starCore}』，同時是祿與忌，機會與地雷綁在同一主題上。",
    actionTemplate: "當{starThemesLead}被引動時：先訂規則與界線，再加碼投入。",
    evidenceTemplate: "證據：{star} 同時化祿與化忌（多層或同層）。",
  },
  R05_SAME_PALACE_LU_JI: {
    messageTemplate: "{palace} 同時有祿與忌，機會與地雷在同一區域。",
    actionTemplate: "{palace} 的策略：先小步試錯再放大，不要一次 All-in。",
    evidenceTemplate: "證據：祿與忌皆入 {palace}（多層或同層）。",
  },
  R06_QUAN_JI_SAME_POINT: {
    messageTemplate: "{target} 同時權與忌，責任感與不安感疊加。",
    actionTemplate: "在 {target} 上，區分必須扛的與可以委派的。",
    evidenceTemplate: "證據：權星與忌星皆指向 {target}。",
  },
  R07_KE_JI_SAME_POINT: {
    messageTemplate: "{target} 科與忌同點，修正欲與不安全感綁在一起。",
    actionTemplate: "在 {target} 設夠好就出手的門檻，避免永遠在準備。",
    evidenceTemplate: "證據：科星與忌星皆指向 {target}。",
  },
  R08_DECADE_YEAR_SYNC: {
    messageTemplate: "今年四化與大限同步，今年是十年主題的放大版。",
    actionTemplate: "今年做的選擇會定型十年節奏：寧可慢、不要亂。",
    evidenceTemplate: "證據：大限與流年四化結構高度重疊（多組同星或同宮）。",
  },
  R09_DECADE_YEAR_SAME_JI: {
    messageTemplate: "忌在十年與今年同時加壓，此題需要正面處理。",
    actionTemplate: "把這題當專案：列風險、設停損、設回顧點。",
    evidenceTemplate: "證據：大限忌與流年忌同星或同宮（{evidenceText}）。",
  },
  R10_DECADE_YEAR_SAME_LU: {
    messageTemplate: "祿在十年與今年同時加碼，適合建立可複利的東西。",
    actionTemplate: "祿疊加時主動投資：時間、金錢、關係都值得加碼。",
    evidenceTemplate: "證據：大限祿與流年祿同星或同宮（{evidenceText}）。",
  },
  R11_JI_FROM_A_TO_B: {
    messageTemplate: "{star}化忌：壓力源頭在 {fromPalace}，但事件會在 {toPalace} 爆出來。",
    actionTemplate: "先處理 {fromPalace} 的根因，不要只救 {toPalace} 的表面。",
    evidenceTemplate: "證據：{star} 化忌自 {fromPalace} 飛入 {toPalace}。",
  },
  R12_LU_INTO_PALACE: {
    messageTemplate: "{star}化祿飛入 {toPalace}，資源、人脈、機會更容易在 {toPalace} 聚集。",
    actionTemplate: "把主動投資放在 {toPalace}，效果最好。",
    evidenceTemplate: "證據：{star} 化祿飛入 {toPalace}。",
  },
  R13_QUAN_INTO_PALACE: {
    messageTemplate: "{star}化權飛入 {toPalace}，會在 {toPalace} 被推上前台或想主導。",
    actionTemplate: "在 {toPalace} 主動爭取主導權，但界定清楚邊界。",
    evidenceTemplate: "證據：{star} 化權飛入 {toPalace}。",
  },
  R14_KE_INTO_PALACE: {
    messageTemplate: "{star}化科飛入 {toPalace}，用學習/整理/SOP 能在 {toPalace} 過關。",
    actionTemplate: "把 {toPalace} 的做法寫成方法論，會越做越省力。",
    evidenceTemplate: "證據：{star} 化科飛入 {toPalace}。",
  },
  R15_LU_CONCENTRATED: {
    messageTemplate: "祿高度集中在 {palaces}，單點依賴度高。",
    actionTemplate: "在 {palaces} 之外，刻意經營一個備援主題。",
    evidenceTemplate: "證據：祿星飛入宮位高度集中（{palaces}）。",
  },
  R16_JI_DISPERSED: {
    messageTemplate: "忌分散多宮，壓力點多、容易疲於奔命。",
    actionTemplate: "忌分散時選一兩個主戰場先穩住。",
    evidenceTemplate: "證據：忌星分散飛入多宮（四宮以上）。",
  },
  R17_QUAN_STRONG_KE_WEAK: {
    messageTemplate: "權強科弱，主導欲強、流程與學習較少。",
    actionTemplate: "補科：建立流程、指標、回顧機制。",
    evidenceTemplate: "證據：四化中權星明顯、科星較少或未凸顯。",
  },
  R18_KE_STRONG_QUAN_WEAK: {
    messageTemplate: "科強權弱，方法論足、主導與扛責較少。",
    actionTemplate: "補權：設定清楚目標與主導權。",
    evidenceTemplate: "證據：四化中科星明顯、權星較少或未凸顯。",
  },
  R19_ONLY_LU_JI: {
    messageTemplate: "盤面祿忌明顯、權科較不凸顯，容易在加碼與避險兩端擺盪。",
    actionTemplate: "把權與科當成祿忌之外的兩個槓桿，刻意使用。",
    evidenceTemplate: "證據：本局四化以祿與忌為主，權科較少入關鍵宮位。",
  },
  R20_SAME_PALACE_SAME_TRANSFORM_STACK: {
    messageTemplate: "{palace} {transform} 疊加（{count}重），事件強度大。",
    actionTemplate: "{palace} 的 {transform} 疊加時，設好界線與目標再動。",
    evidenceTemplate: "證據：{transform} 在 {palace} 疊加（{count} 層）。",
  },
};

const FALLBACK: RulePhraseSet = {
  messageTemplate: "（此規則命中，詳見四化結構。）",
  actionTemplate: "依四化與宮位調整策略。",
  evidenceTemplate: "（見上方四化配置）",
};

export function getPhraseSet(ruleId: S00RuleId): RulePhraseSet {
  return LIB[ruleId] ?? FALLBACK;
}
