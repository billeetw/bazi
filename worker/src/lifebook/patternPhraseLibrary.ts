/**
 * Pattern Phrase Library：依 ruleId 提供可輪替的 message / action / evidence 模板，
 * 供 patternHitRenderer 產出可閱讀命書句型。Placeholder 與 evidence 鍵名對齊。
 */

import type { S00RuleId } from "./s00FourTransformRules.js";

export interface RulePhraseSet {
  messageTemplates: string[];
  actionTemplates: string[];
  evidenceTemplates: string[];
}

/** 支援的 placeholder：palace, palaceA, palaceB, fromPalace, toPalace, star, star1, star2, layer1, layer2, layers, transform, target, count, palaces, evidenceText */
const LIB: Record<S00RuleId, RulePhraseSet> = {
  R01_SAME_STAR_OVERLAP: {
    messageTemplates: [
      "{star}代表『{starCore}』，在 {layers} 重複被點名，是這局的核心槓桿。",
      "{star}代表『{starCore}』，被多層四化同時點亮，這個主題會反覆出現。",
      "依四化結構，{star}（{starCore}）是整張盤的關鍵：{layers} 都指向它。",
    ],
    actionTemplates: [
      "當涉及『{starThemes}』相關的事情時，先做「主動設計」而不是反射應對。",
      "在與『{starThemes}』相關的選擇上，預留彈性與備案。",
      "把與『{starCore}』相關的領域當成槓桿支點：用好放大、用錯放大。",
    ],
    evidenceTemplates: [
      "證據：{layers} 四化皆涉及 {star}。",
      "（{layers} 層級同時命中 {star}）",
    ],
  },
  R02_SAME_PALACE_OVERLAP: {
    messageTemplates: [
      "{palace} 被 {layers} 同時點亮 → 這裡是事件主舞台。",
      "多層四化匯聚在 {palace}，此宮是當前能量焦點。",
      "{palace} 在 {layers} 皆被點名，代表主戰場在此。",
    ],
    actionTemplates: [
      "重大決策先檢查 {palace}：資源/責任是否在此集中？",
      "在 {palace} 主題上，寧可提前布局、不要被動反應。",
      "把 {palace} 當成今年與十年的主舞台來經營。",
    ],
    evidenceTemplates: [
      "證據：{layers} 四化皆入 {palace}。",
      "（{layers} 同時飛入 {palace}）",
    ],
  },
  R03_SAME_TRANSFORM_OVERLAP: {
    messageTemplates: [
      "{transform} 在 {palace} 疊加 → {palace} 的 {transform} 性質被放大。",
      "{palace} 同時收到多層 {transform}，此宮的 {transform} 力道很強。",
      "依四化，{palace} 是 {transform} 疊加的焦點。",
    ],
    actionTemplates: [
      "在 {palace} 善用 {transform} 的性質，但避免單點過度依賴。",
      "{palace} 主題上：祿→多投資、權→主導、科→學習、忌→看清楚。",
      "把 {palace} 的 {transform} 當成可操作變數，不是命運定數。",
    ],
    evidenceTemplates: [
      "證據：{layers} 的 {transform} 皆落 {palace}。",
      "（{transform} 多層入 {palace}）",
    ],
  },
  R04_SAME_STAR_LU_JI: {
    messageTemplates: [
      "{star}代表『{starCore}』，同時是祿與忌，「想要更多」與「怕出事」會拉扯在同一題上。",
      "{star}代表『{starCore}』，既化祿又化忌，代表你對與此相關的議題又愛又怕。",
      "{star}（{starCore}）祿忌同星：機會與地雷綁在同一個主題上。",
    ],
    actionTemplates: [
      "當{starThemesLead}被引動時：先訂規則與界線，再加碼投入。",
      "在與『{starThemes}』相關的選擇上，先區分「可控制的」與「需設停損的」。",
      "把與『{starCore}』相關的領域當成「有上限的槓桿」，不要 All-in。",
    ],
    evidenceTemplates: [
      "證據：{star} 同時化祿與化忌（多層或同層）。",
      "（{star} 祿忌同星）",
    ],
  },
  R05_SAME_PALACE_LU_JI: {
    messageTemplates: [
      "{palace} 同時有祿與忌 → 機會與地雷在同一區域。",
      "祿與忌同時進入 {palace}，此宮既有資源又有壓力。",
      "{palace} 是祿忌交會點：順風與逆風都在這裡。",
    ],
    actionTemplates: [
      "{palace} 的策略：先小步試錯→再放大，不要一次 All-in。",
      "在 {palace} 主題上，用「試點→驗證→再放大」取代一次押滿。",
      "把 {palace} 當成需要邊做邊調的戰場，不是一戰定生死。",
    ],
    evidenceTemplates: [
      "證據：祿與忌皆入 {palace}（多層或同層）。",
      "（{palace} 祿忌同宮）",
    ],
  },
  R06_QUAN_JI_SAME_POINT: {
    messageTemplates: [
      "{target} 同時權＋忌 →「想掌控」又「怕失控」，很容易硬撐。",
      "權與忌落在同一點（{target}），代表既想主導又怕搞砸。",
      "{target} 權忌同點：責任感與不安感疊加。",
    ],
    actionTemplates: [
      "先降負荷：拆責任、拆目標、拆時間。",
      "在 {target} 上，區分「必須扛的」與「可以委派的」。",
      "把「掌控」改成「有界線的主導」，不要無限擴大。",
    ],
    evidenceTemplates: [
      "證據：權星與忌星皆指向 {target}。",
      "（{target} 權忌同點）",
    ],
  },
  R07_KE_JI_SAME_POINT: {
    messageTemplates: [
      "{target} 科＋忌 → 你會想靠「更完美」來消除不安。",
      "科與忌同點（{target}），容易用過度準備來掩蓋焦慮。",
      "{target} 科忌同宮：修正欲與不安全感綁在一起。",
    ],
    actionTemplates: [
      "把「修正」改成 SOP，而不是無限優化。",
      "在 {target} 設「夠好就出手」的門檻，避免永遠在準備。",
      "科是方法論，忌是警訊；兩者同點時先設停損再精進。",
    ],
    evidenceTemplates: [
      "證據：科星與忌星皆指向 {target}。",
      "（{target} 科忌同點）",
    ],
  },
  R08_DECADE_YEAR_SYNC: {
    messageTemplates: [
      "今年四化與大限同步 → 今年是十年主題的放大版，不是短期波動。",
      "大限與流年四化方向一致，代表今年是十年主線的濃縮。",
      "今年與十年層級同步，重大選擇會影響長期節奏。",
    ],
    actionTemplates: [
      "今年做的選擇會「定型」十年節奏：寧可慢、不要亂。",
      "把今年當成十年佈局的一年，不做一次性賭注。",
      "重大決策以「十年視野」來檢視，不要被單年情緒帶著走。",
    ],
    evidenceTemplates: [
      "證據：大限與流年四化結構高度重疊（多組同星或同宮）。",
      "（十年×流年同步）",
    ],
  },
  R09_DECADE_YEAR_SAME_JI: {
    messageTemplates: [
      "忌在十年＋今年同時加壓 → 這是必考題，不處理會反覆。",
      "大限忌與流年忌疊加，代表同一類壓力會重複出現。",
      "忌星在十年與今年同時發力，此題需要正面處理。",
    ],
    actionTemplates: [
      "把這題當專案：列風險→設停損→設回顧點。",
      "忌疊加時不要逃：訂出最小可行處理方案，逐步執行。",
      "用「專案管理」取代「情緒反應」：拆解、排程、檢討。",
    ],
    evidenceTemplates: [
      "證據：大限忌與流年忌同星或同宮（{evidenceText}）。",
      "（十年忌＋流年忌疊加）",
    ],
  },
  R10_DECADE_YEAR_SAME_LU: {
    messageTemplates: [
      "祿在十年＋今年同時加碼 → 難得的順風窗口。",
      "大限祿與流年祿疊加，代表這幾年有明顯的資源與機會。",
      "祿星在十年與今年同時發力，適合建立可複利的東西。",
    ],
    actionTemplates: [
      "今年適合「建立可複利的東西」：客戶池/資產/技能/系統。",
      "祿疊加時主動投資：時間、金錢、關係都值得加碼。",
      "把順風當成佈局期，不要只消費不累積。",
    ],
    evidenceTemplates: [
      "證據：大限祿與流年祿同星或同宮（{evidenceText}）。",
      "（十年祿＋流年祿疊加）",
    ],
  },
  R11_JI_FROM_A_TO_B: {
    messageTemplates: [
      "{star}化忌：壓力源頭在 {fromPalace}，但事件會在 {toPalace} 爆出來。",
      "忌自 {fromPalace} 飛入 {toPalace}，根因在 {fromPalace}、表象在 {toPalace}。",
      "{star} 化忌由 {fromPalace}→{toPalace}，處理時要回到 {fromPalace}。",
    ],
    actionTemplates: [
      "先處理 {fromPalace} 的根因（心態/關係/責任），不要只救 {toPalace} 的表面。",
      "在 {toPalace} 出問題時，回頭檢查 {fromPalace} 的狀態。",
      "忌的流動：從 {fromPalace} 對症下藥，而不是在 {toPalace} 滅火。",
    ],
    evidenceTemplates: [
      "證據：{star} 化忌自 {fromPalace} 飛入 {toPalace}。",
      "（忌：{fromPalace} → {toPalace}）",
    ],
  },
  R12_LU_INTO_PALACE: {
    messageTemplates: [
      "{star}化祿飛入 {toPalace} → 資源、人脈、機會更容易在 {toPalace} 聚集。",
      "祿星入 {toPalace}，此宮是當前值得投資的領域。",
      "{star} 化祿入 {toPalace}，把主動投資放在這裡效果最好。",
    ],
    actionTemplates: [
      "把主動投資放在 {toPalace}，效果最好。",
      "在 {toPalace} 主題上多投入時間與資源，容易有回報。",
      "祿入 {toPalace}：此宮適合加碼、不適合忽略。",
    ],
    evidenceTemplates: [
      "證據：{star} 化祿飛入 {toPalace}。",
      "（祿入 {toPalace}）",
    ],
  },
  R13_QUAN_INTO_PALACE: {
    messageTemplates: [
      "{star}化權飛入 {toPalace} → 你會在 {toPalace} 被推上前台或想主導。",
      "權星入 {toPalace}，此宮需要你負責任、拿主導權。",
      "{toPalace} 有權星進入，代表你會在此想說了算。",
    ],
    actionTemplates: [
      "權不是硬扛：先談清楚權責範圍。",
      "在 {toPalace} 主動爭取主導權，但界定清楚邊界。",
      "把「想掌控」轉成「有範圍的負責」，不要無限擴大。",
    ],
    evidenceTemplates: [
      "證據：{star} 化權飛入 {toPalace}。",
      "（權入 {toPalace}）",
    ],
  },
  R14_KE_INTO_PALACE: {
    messageTemplates: [
      "{star}化科飛入 {toPalace} → 用「學習/整理/證照/SOP」能在 {toPalace} 過關。",
      "科星入 {toPalace}，此宮適合用方法論與精進來加分。",
      "{toPalace} 有科星，代表透過學習與修正可以升級。",
    ],
    actionTemplates: [
      "把 {toPalace} 的做法寫成方法論，你會越做越省力。",
      "在 {toPalace} 主題上投資學習與流程，報酬率高。",
      "科入 {toPalace}：用「升級方法」取代「硬碰硬」。",
    ],
    evidenceTemplates: [
      "證據：{star} 化科飛入 {toPalace}。",
      "（科入 {toPalace}）",
    ],
  },
  R15_LU_CONCENTRATED: {
    messageTemplates: [
      "祿高度集中在 {palaces} → 你容易把所有希望都押在同一條路。",
      "多顆祿星集中少數宮位（{palaces}），代表資源與機會偏食。",
      "祿集中於 {palaces}，單點依賴度高。",
    ],
    actionTemplates: [
      "把第二資源線拉起來，避免單點失效。",
      "在 {palaces} 之外，刻意經營一個備援主題。",
      "祿集中時要分散：不要所有雞蛋放同一籃。",
    ],
    evidenceTemplates: [
      "證據：祿星飛入宮位高度集中（{palaces}）。",
      "（祿集中）",
    ],
  },
  R16_JI_DISPERSED: {
    messageTemplates: [
      "忌分散 → 壓力來源多線並進，容易覺得哪裡都要顧。",
      "忌星分散多宮，代表壓力點多、容易疲於奔命。",
      "忌分散時，容易產生「到處都是地雷」的焦慮。",
    ],
    actionTemplates: [
      "用優先序：先處理「最高頻」那一宮。",
      "忌分散時不要全救：選一兩個主戰場先穩住。",
      "把「到處救火」改成「先救最常爆的那一處」。",
    ],
    evidenceTemplates: [
      "證據：忌星分散飛入多宮（四宮以上）。",
      "（忌分散）",
    ],
  },
  R17_QUAN_STRONG_KE_WEAK: {
    messageTemplates: [
      "權強科弱 → 容易靠意志力推進，但缺少方法整理。",
      "盤面權多科少，代表敢衝但方法論不足。",
      "權強科弱：主導欲強，但流程與學習較少。",
    ],
    actionTemplates: [
      "補科：建立流程、指標、回顧機制。",
      "在衝刺之餘，把做法寫成可複製的 SOP。",
      "權強時要刻意補「方法」：學習、整理、沉澱。",
    ],
    evidenceTemplates: [
      "證據：四化中權星明顯、科星較少或未凸顯。",
      "（權強科弱）",
    ],
  },
  R18_KE_STRONG_QUAN_WEAK: {
    messageTemplates: [
      "科強權弱 → 你會準備很好，但不一定敢主動拿位置。",
      "盤面科多權少，代表善於準備、較少主動爭取。",
      "科強權弱：方法論足，主導與扛責較少。",
    ],
    actionTemplates: [
      "補權：設定清楚目標與主導權。",
      "在準備夠了之後，主動爭取發言權與決策權。",
      "科強時要補「敢要」：明確目標、主動表態。",
    ],
    evidenceTemplates: [
      "證據：四化中科星明顯、權星較少或未凸顯。",
      "（科強權弱）",
    ],
  },
  R19_ONLY_LU_JI: {
    messageTemplates: [
      "只看祿忌會變成「順/衰」二選一，其實你少用兩個工具：權與科。",
      "盤面祿忌明顯、權科較不凸顯，代表容易在「加碼/避險」兩端擺盪。",
      "祿忌主導時，容易忽略「主導」與「學習」的操作空間。",
    ],
    actionTemplates: [
      "遇到忌：先用科修正，再用權決策，而不是直接放棄。",
      "在順境多用權（主導）、在逆境多用科（方法），不要只靠祿忌。",
      "把權與科當成祿忌之外的兩個槓桿，刻意使用。",
    ],
    evidenceTemplates: [
      "證據：本局四化以祿與忌為主，權科較少入關鍵宮位。",
      "（僅祿忌明顯）",
    ],
  },
  R20_SAME_PALACE_SAME_TRANSFORM_STACK: {
    messageTemplates: [
      "{palace} {transform} 疊加（{count}重）→ 事件強度大，不會小。",
      "{palace} 收到多層 {transform}（共 {count} 次），此宮的 {transform} 力道很強。",
      "{transform} 在 {palace} 疊層（{count}），代表此宮是 {transform} 的主戰場。",
    ],
    actionTemplates: [
      "疊加忌：守；疊加祿：攻，但要可控。",
      "{palace} 的 {transform} 疊加時，設好界線與目標再動。",
      "多層 {transform} 入 {palace}：強度大，要有策略、不要反射。",
    ],
    evidenceTemplates: [
      "證據：{transform} 在 {palace} 疊加（{count} 層）。",
      "（{palace} {transform} 疊層）",
    ],
  },
};

export function getPhraseSet(ruleId: S00RuleId): RulePhraseSet {
  return LIB[ruleId] ?? {
    messageTemplates: ["（此規則命中，詳見四化結構。）"],
    actionTemplates: ["依四化與宮位調整策略。"],
    evidenceTemplates: ["（見上方四化配置）"],
  };
}

/** Deterministic 輪替：同 ruleId 永遠選同一個模板 index */
export function pickTemplateIndex(ruleId: string, templateCount: number): number {
  if (templateCount <= 0) return 0;
  let h = 0;
  for (let i = 0; i < ruleId.length; i++) h = ((h << 5) - h + ruleId.charCodeAt(i)) | 0;
  return ((h % templateCount) + templateCount) % templateCount;
}
