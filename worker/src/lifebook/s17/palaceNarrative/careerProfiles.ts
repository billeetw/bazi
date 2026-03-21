export type CareerProfile = {
  careerFit: string;
  forbiddenDecisions: [string, string];
  riskAlert: string;
};

/**
 * 官祿宮專用：星曜/四化的職涯解讀正規化資料。
 * 來源為使用者提供語料，統一為可渲染的三段欄位。
 */
export const CAREER_PROFILE_BY_KEY: Record<string, CareerProfile> = {
  紫微: {
    careerFit: "高管、決策層、大型組織領導",
    forbiddenDecisions: ["不在位卻過度指揮", "為面子接下不該扛的責任"],
    riskAlert: "權責不對等時，會被架空或反噬。",
  },
  天機: {
    careerFit: "策略、企劃、顧問",
    forbiddenDecisions: ["想太多卻不落地", "頻繁轉向缺乏主線"],
    riskAlert: "過度思考會拖垮執行力。",
  },
  太陽: {
    careerFit: "公眾角色、管理、服務型領導",
    forbiddenDecisions: ["過度付出不計回報", "為人情犧牲資源配置"],
    riskAlert: "燃燒自己但未必換到實質成果。",
  },
  武曲: {
    careerFit: "金融、管理、營運、技術執行",
    forbiddenDecisions: ["過度硬推不留彈性", "只看結果忽略關係成本"],
    riskAlert: "過於強硬會造成合作斷裂。",
  },
  天同: {
    careerFit: "服務業、內容、創意、自由職",
    forbiddenDecisions: ["選擇太安逸放棄成長", "避開壓力導致停滯"],
    riskAlert: "舒適區會變成長期停滯區。",
  },
  廉貞: {
    careerFit: "設計、科技、制度內權力位置",
    forbiddenDecisions: ["情緒介入決策", "權力操作過度"],
    riskAlert: "權力與情緒混用會翻車。",
  },
  天府: {
    careerFit: "穩定體系、管理、資源控管",
    forbiddenDecisions: ["過度保守錯失機會", "資源配置過慢"],
    riskAlert: "穩過頭會失去競爭力。",
  },
  太陰: {
    careerFit: "不動產、金融、內勤管理、女性市場",
    forbiddenDecisions: ["情緒影響財務判斷", "過度保守不敢擴張"],
    riskAlert: "安全感不足時會錯判機會。",
  },
  貪狼: {
    careerFit: "業務、娛樂、行銷、公關",
    forbiddenDecisions: ["過度追逐機會分散資源", "依賴人脈而非實力"],
    riskAlert: "機會多但容易失焦。",
  },
  巨門: {
    careerFit: "法律、顧問、溝通、內容",
    forbiddenDecisions: ["過度爭辯破壞合作", "陷入懷疑不行動"],
    riskAlert: "是非與內耗會拖慢進展。",
  },
  天相: {
    careerFit: "行政、顧問、法務、協調角色",
    forbiddenDecisions: ["過度顧全他人", "不敢做關鍵決斷"],
    riskAlert: "太平衡會失去主導權。",
  },
  七殺: {
    careerFit: "創業、開創型產業、高壓環境",
    forbiddenDecisions: ["衝動決策", "不計風險直接開幹"],
    riskAlert: "一錯就是大起大落。",
  },
  破軍: {
    careerFit: "改革、創新、破局型工作",
    forbiddenDecisions: ["一直推翻重來", "無結構冒進"],
    riskAlert: "破太多會沒有可用成果。",
  },
  天梁: {
    careerFit: "顧問、醫療、教育、監督角色",
    forbiddenDecisions: ["過度指導他人", "固守舊觀念"],
    riskAlert: "變成只會講不會做。",
  },
  擎羊: {
    careerFit: "軍警、技術、執行",
    forbiddenDecisions: ["情緒性衝突", "硬碰硬"],
    riskAlert: "衝突會直接破局。",
  },
  陀羅: {
    careerFit: "研究、精算、長期專案",
    forbiddenDecisions: ["拖延決策", "卡在細節"],
    riskAlert: "拖到機會消失。",
  },
  火星: {
    careerFit: "高壓、快節奏產業",
    forbiddenDecisions: ["衝動出手", "無計畫行動"],
    riskAlert: "快進快出也快爆。",
  },
  鈴星: {
    careerFit: "分析、內控、風險判讀",
    forbiddenDecisions: ["過度懷疑", "不信任團隊"],
    riskAlert: "內耗比外敵更傷。",
  },
  地劫: {
    careerFit: "風控、資源重整、危機處理",
    forbiddenDecisions: ["高槓桿操作", "低估風險"],
    riskAlert: "一次錯誤會直接傷到根本。",
  },
  地空: {
    careerFit: "創意、研發、精神領域",
    forbiddenDecisions: ["空想不落地", "忽略現實條件"],
    riskAlert: "想很多但做不出來。",
  },
  天刑: {
    careerFit: "法律、醫療、規範系統",
    forbiddenDecisions: ["走灰色地帶", "忽略制度"],
    riskAlert: "一踩線就是硬傷。",
  },
  左輔: {
    careerFit: "輔助管理、專案支援",
    forbiddenDecisions: ["過度依賴他人", "不主動承擔"],
    riskAlert: "永遠當副手上不去。",
  },
  右弼: {
    careerFit: "協調、服務、團隊支援",
    forbiddenDecisions: ["過度迎合", "情感決策"],
    riskAlert: "被人情綁住資源。",
  },
  天魁: {
    careerFit: "高階資源、升遷路線",
    forbiddenDecisions: ["依賴貴人", "不自建能力"],
    riskAlert: "沒有貴人就卡住。",
  },
  天鉞: {
    careerFit: "女性市場、精緻產業、人脈",
    forbiddenDecisions: ["過度靠關係", "忽略實力"],
    riskAlert: "人脈不等於實力。",
  },
  文曲: {
    careerFit: "創意、內容、行銷",
    forbiddenDecisions: ["情緒導向決策", "過度感性"],
    riskAlert: "好看但不賺錢。",
  },
  文昌: {
    careerFit: "專業、法務、制度工作",
    forbiddenDecisions: ["過度理論", "缺乏彈性"],
    riskAlert: "太死板會失去機會。",
  },
  天喜: {
    careerFit: "娛樂、活動、社交產業",
    forbiddenDecisions: ["貪玩影響工作", "情緒優先"],
    riskAlert: "熱鬧不等於產值。",
  },
  祿存: {
    careerFit: "財務、穩定職位、資產管理",
    forbiddenDecisions: ["過度保守", "不敢投資"],
    riskAlert: "守住但不會長大。",
  },
  紅鸞: {
    careerFit: "美學、人際、品牌",
    forbiddenDecisions: ["過度重外表", "感情影響工作"],
    riskAlert: "情感干擾專業。",
  },
  天姚: {
    careerFit: "魅力產業、公關、娛樂",
    forbiddenDecisions: ["過度依賴吸引力", "捲入複雜關係"],
    riskAlert: "人際反噬事業。",
  },
  化權: {
    careerFit: "管理、帶人、推動專案",
    forbiddenDecisions: ["過度控制", "不授權"],
    riskAlert: "權力集中導致反彈。",
  },
  化科: {
    careerFit: "專業職、顧問、品牌建立",
    forbiddenDecisions: ["過度修正不行動", "過度追求完美"],
    riskAlert: "優化過頭導致停滯。",
  },
  化祿: {
    careerFit: "資源整合、商業變現",
    forbiddenDecisions: ["過度依賴順風", "無風控擴張"],
    riskAlert: "順的時候容易過度放大。",
  },
  化忌: {
    careerFit: "風控、問題解決、修復角色",
    forbiddenDecisions: ["逃避問題", "情緒決策"],
    riskAlert: "壓力會集中爆發。",
  },
};

export function getCareerProfile(key: string): CareerProfile | null {
  const k = (key ?? "").trim();
  if (!k) return null;
  return CAREER_PROFILE_BY_KEY[k] ?? null;
}
