/**
 * S19 斷語規則種子庫（可擴充／日後改由 JSON 載入）
 */

import type { InterpretationRule } from "./interpretationRuleTypes.js";

export const INTERPRETATION_RULES_SEED: InterpretationRule[] = [
  {
    id: "wq-ji-caibo",
    star: "武曲",
    transform: "忌",
    palace: "財帛宮",
    title: "武曲化忌入財帛｜現金流與得失感",
    baseWeight: 1.2,
    eventType: ["finance", "resource", "stress"],
    baseScenarios: ["現金流需要盯緊，避免臨時大額支出", "對「值不值得」會變得敏感"],
    positiveScenarios: ["反而可能逼你把預算表做清楚，長期更穩"],
    negativeScenarios: ["容易在報價、分潤、借貸話題上卡住", "可能出現拖延付款或計算錯誤的小狀況"],
    narrative:
      "流月把「資源與執行」的壓力帶進財帛宮，這個月比較容易在金錢節奏、回報感或資源配置上反覆琢磨。",
    actionHint: "先把固定支出與緩衝金寫成可檢查的版本；重大金錢決定盡量拉長確認時間。",
  },
  {
    id: "wc-ji-fuqi",
    star: "文昌",
    transform: "忌",
    palace: "夫妻宮",
    title: "文昌化忌入夫妻｜溝通與約定",
    baseWeight: 1.15,
    eventType: ["relationship", "communication"],
    baseScenarios: ["一對一約定、文字訊息或合約細節需要多確認一次"],
    positiveScenarios: ["適合把話說清楚，反而能減少後續誤會"],
    negativeScenarios: ["容易因語氣、解讀不同而卡住", "舊帳或承諾細節被拿出來討論"],
    narrative:
      "流月把「規則與表達」的摩擦點帶進夫妻宮，關係裡比較容易圍繞溝通、承諾或文字約定出現緊繃感。",
    actionHint: "重要約定改書面摘要；情緒上頭時先約定晚一點再談。",
  },
  {
    id: "tm-quan-guanlu",
    star: "天機",
    transform: "權",
    palace: "官祿宮",
    title: "天機化權入官祿｜策略與職責",
    baseWeight: 1.1,
    eventType: ["career", "decision"],
    baseScenarios: ["工作流程需要你做取捨與排序", "專案方向可能臨時調整"],
    positiveScenarios: ["適合推進方案評估、分工表與里程碑"],
    negativeScenarios: ["可能同時來太多選項，導致決策疲勞"],
    narrative:
      "流月把「判斷與變動」的主導感帶進官祿宮，職場上比較容易需要你拍板、調整順序或重新排程。",
    actionHint: "先鎖定一個主線目標，再決定哪些任務可以延後或外包。",
  },
  {
    id: "wild-lu-any",
    star: "*",
    transform: "祿",
    palace: "*",
    title: "化祿（通用）｜資源感較明顯",
    baseWeight: 0.55,
    eventType: ["resource", "opportunity"],
    baseScenarios: ["比較容易看見可用的資源、助力或小利多"],
    positiveScenarios: ["適合談合作條件、申請資源、把累積變現一點點"],
    negativeScenarios: ["也可能只想輕鬆拿好處，忽略後續責任"],
    narrative:
      "流月化祿飛入此宮，代表這個主題比較容易出現機會感、助力感或小幅度的順流。",
    actionHint: "有機會就先做「小步驗證」，再決定要不要加碼。",
  },
  {
    id: "wild-ji-any",
    star: "*",
    transform: "忌",
    palace: "*",
    title: "化忌（通用）｜壓力與修正點",
    baseWeight: 0.55,
    eventType: ["stress", "repair"],
    baseScenarios: ["比較容易感到卡、慢、反覆或需要收尾"],
    positiveScenarios: ["適合處理舊問題、補洞、降低風險"],
    negativeScenarios: ["情緒上可能放大小挫折"],
    narrative:
      "流月化忌飛入此宮，這個主題比較容易成為當月的壓力點或需要修補的環節。",
    actionHint: "把問題拆小、先求可執行，不要一次扛完全部責任。",
  },
];
