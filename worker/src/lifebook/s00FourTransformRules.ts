/**
 * s00 四化判讀規則庫：20 條高價值規則
 * 分為疊加、衝突、同步、引爆、結構偏態五類。
 * when 條件在 s00PatternEngine 中以函式實作。
 */

export type S00RuleId =
  | "R01_SAME_STAR_OVERLAP"
  | "R02_SAME_PALACE_OVERLAP"
  | "R03_SAME_TRANSFORM_OVERLAP"
  | "R04_SAME_STAR_LU_JI"
  | "R05_SAME_PALACE_LU_JI"
  | "R06_QUAN_JI_SAME_POINT"
  | "R07_KE_JI_SAME_POINT"
  | "R08_DECADE_YEAR_SYNC"
  | "R09_DECADE_YEAR_SAME_JI"
  | "R10_DECADE_YEAR_SAME_LU"
  | "R11_JI_FROM_A_TO_B"
  | "R12_LU_INTO_PALACE"
  | "R13_QUAN_INTO_PALACE"
  | "R14_KE_INTO_PALACE"
  | "R15_LU_CONCENTRATED"
  | "R16_JI_DISPERSED"
  | "R17_QUAN_STRONG_KE_WEAK"
  | "R18_KE_STRONG_QUAN_WEAK"
  | "R19_ONLY_LU_JI"
  | "R20_SAME_PALACE_SAME_TRANSFORM_STACK";

export interface S00RuleDef {
  id: S00RuleId;
  priority: number;
  messageTemplate: string;
  actionTemplate: string;
}

/** 20 條規則定義（priority 越大越先講） */
export const S00_FOUR_TRANSFORM_RULES: S00RuleDef[] = [
  // A) 疊加類
  {
    id: "R01_SAME_STAR_OVERLAP",
    priority: 95,
    messageTemplate: "{star} 在 {layers} 重複被點名 → 這顆星是你這局的核心槓桿。",
    actionTemplate: "遇到 {star} 類議題，先做「主動設計」而不是反射應對。",
  },
  {
    id: "R02_SAME_PALACE_OVERLAP",
    priority: 94,
    messageTemplate: "{palace} 被 {layers} 同時點亮 → 這裡是事件主舞台。",
    actionTemplate: "重大決策先檢查 {palace}：資源/責任/風險是否在此集中？",
  },
  {
    id: "R03_SAME_TRANSFORM_OVERLAP",
    priority: 88,
    messageTemplate: "{transform} 在 {palace} 疊加 → {palace} 的 {transform} 性質被放大。",
    actionTemplate: "在 {palace} 善用 {transform} 的性質，但避免單點過度依賴。",
  },
  // B) 衝突類
  {
    id: "R04_SAME_STAR_LU_JI",
    priority: 98,
    messageTemplate: "{star} 同時是祿與忌 →「想要更多」與「怕出事」會拉扯在同一題上。",
    actionTemplate: "對 {star} 類事件：先訂規則/界線，再加碼投入。",
  },
  {
    id: "R05_SAME_PALACE_LU_JI",
    priority: 97,
    messageTemplate: "{palace} 同時有祿與忌 → 機會與地雷在同一區域。",
    actionTemplate: "{palace} 的策略：先小步試錯→再放大，不要一次 All-in。",
  },
  {
    id: "R06_QUAN_JI_SAME_POINT",
    priority: 92,
    messageTemplate: "{target} 同時權＋忌 →「想掌控」又「怕失控」，很容易硬撐。",
    actionTemplate: "先降負荷：拆責任、拆目標、拆時間。",
  },
  {
    id: "R07_KE_JI_SAME_POINT",
    priority: 90,
    messageTemplate: "{target} 科＋忌 → 你會想靠「更完美」來消除不安。",
    actionTemplate: "把「修正」改成 SOP，而不是無限優化。",
  },
  // C) 同步類
  {
    id: "R08_DECADE_YEAR_SYNC",
    priority: 96,
    messageTemplate: "今年四化與大限同步 → 今年是十年主題的放大版，不是短期波動。",
    actionTemplate: "今年做的選擇會「定型」十年節奏：寧可慢、不要亂。",
  },
  {
    id: "R09_DECADE_YEAR_SAME_JI",
    priority: 93,
    messageTemplate: "忌在十年＋今年同時加壓 → 這是必考題，不處理會反覆。",
    actionTemplate: "把這題當專案：列風險→設停損→設回顧點。",
  },
  {
    id: "R10_DECADE_YEAR_SAME_LU",
    priority: 91,
    messageTemplate: "祿在十年＋今年同時加碼 → 難得的順風窗口。",
    actionTemplate: "今年適合「建立可複利的東西」：客戶池/資產/技能/系統。",
  },
  // D) 引爆類
  {
    id: "R11_JI_FROM_A_TO_B",
    priority: 89,
    messageTemplate: "{star}化忌：壓力源頭在 {fromPalace}，但事件會在 {toPalace} 爆出來。",
    actionTemplate: "先處理 {fromPalace} 的根因（心態/關係/責任），不要只救 {toPalace} 的表面。",
  },
  {
    id: "R12_LU_INTO_PALACE",
    priority: 85,
    messageTemplate: "{star}化祿飛入 {toPalace} → 資源、人脈、機會更容易在 {toPalace} 聚集。",
    actionTemplate: "把主動投資放在 {toPalace}，效果最好。",
  },
  {
    id: "R13_QUAN_INTO_PALACE",
    priority: 84,
    messageTemplate: "{star}化權飛入 {toPalace} → 你會在 {toPalace} 被推上前台或想主導。",
    actionTemplate: "權不是硬扛：先談清楚權責範圍。",
  },
  {
    id: "R14_KE_INTO_PALACE",
    priority: 83,
    messageTemplate: "{star}化科飛入 {toPalace} → 用「學習/整理/證照/SOP」能在 {toPalace} 過關。",
    actionTemplate: "把 {toPalace} 的做法寫成方法論，你會越做越省力。",
  },
  // E) 結構偏態類
  {
    id: "R15_LU_CONCENTRATED",
    priority: 82,
    messageTemplate: "祿高度集中在 {palaces} → 你容易把所有希望都押在同一條路。",
    actionTemplate: "把第二資源線拉起來，避免單點失效。",
  },
  {
    id: "R16_JI_DISPERSED",
    priority: 81,
    messageTemplate: "忌分散 → 壓力來源多線並進，容易覺得哪裡都要顧。",
    actionTemplate: "用優先序：先處理「最高頻」那一宮。",
  },
  {
    id: "R17_QUAN_STRONG_KE_WEAK",
    priority: 80,
    messageTemplate: "權強科弱 → 容易靠意志力推進，但缺少方法整理。",
    actionTemplate: "補科：建立流程、指標、回顧機制。",
  },
  {
    id: "R18_KE_STRONG_QUAN_WEAK",
    priority: 79,
    messageTemplate: "科強權弱 → 你會準備很好，但不一定敢主動拿位置。",
    actionTemplate: "補權：設定清楚目標與主導權。",
  },
  {
    id: "R19_ONLY_LU_JI",
    priority: 78,
    messageTemplate: "只看祿忌會變成「順/衰」二選一，其實你少用兩個工具：權與科。",
    actionTemplate: "遇到忌：先用科修正，再用權決策，而不是直接放棄。",
  },
  {
    id: "R20_SAME_PALACE_SAME_TRANSFORM_STACK",
    priority: 87,
    messageTemplate: "{palace} {transform} 疊加（{count}重）→ 事件強度大，不會小。",
    actionTemplate: "疊加忌：守；疊加祿：攻，但要可控。",
  },
];
