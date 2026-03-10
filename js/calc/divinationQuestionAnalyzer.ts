/**
 * divinationQuestionAnalyzer.ts
 * 問題分類與意圖分析模組
 * 不影響卦演算，僅在解卦前增加問題解析層
 *
 * 流程：使用者問題 → 問題解析層 → 產卦 → 解卦 → 語氣適配層 → 輸出
 */

export type QuestionCategory = "career" | "wealth" | "love" | "health" | "general";
export type QuestionIntent = "yesno" | "timing" | "strategy" | "trend";

export interface QuestionAnalysis {
  category: QuestionCategory;
  intent: QuestionIntent;
  /** 是否題目過短或過於口語（建議補問） */
  needsClarification: boolean;
  /** 建議補問的類型（供 UI 顯示） */
  suggestedFollowUp?: string;
}

/** 分類關鍵字：category → 關鍵字陣列 */
const CATEGORY_KEYWORDS: Record<QuestionCategory, string[]> = {
  career: [
    "工作", "事業", "職涯", "轉職", "升遷", "創業", "面試", "離職",
    "同事", "主管", "客戶", "業績", "專案", "公司",
  ],
  wealth: [
    "投資", "理財", "股票", "基金", "房產", "買房", "賣房",
    "財運", "賺錢", "收入", "支出", "存款", "貸款", "債務",
    "標的", "風險", "回撤", "買大",
  ],
  love: [
    "感情", "愛情", "婚姻", "交往", "分手", "復合",
    "對象", "桃花", "單身", "結婚", "離婚",
  ],
  health: [
    "健康", "身體", "生病", "症狀", "就醫", "治療",
    "睡眠", "飲食", "運動", "心理",
  ],
  general: [],
};

/** 意圖關鍵字：intent → 關鍵字陣列（優先匹配） */
const INTENT_KEYWORDS: Record<QuestionIntent, string[]> = {
  yesno: ["是否", "能不能", "會不會", "可不可以", "有沒有", "對不對", "會不會成"],
  timing: ["何時", "多久", "幾月", "什麼時候", "何時出現", "何時會", "幾時", "哪個月"],
  strategy: ["怎麼", "如何", "建議", "方法", "怎麼做", "如何做", "怎麼辦", "怎麼比較快"],
  trend: [],
};

/** 過短/口語題目長度閾值 */
const MIN_MEANINGFUL_LENGTH = 4;

/** 高頻模糊題目（需補問） */
const AMBIGUOUS_PATTERNS = [
  /^測試$/,
  /^買大$/,
  /^身體$/,
  /^感情$/,
  /^財運$/,
  /^事業$/,
  /^投資$/,
];

/**
 * 分析使用者問題：分類 + 意圖
 */
export function analyzeQuestion(input: string): QuestionAnalysis {
  const trimmed = (input || "").trim();
  const needsClarification = checkNeedsClarification(trimmed);
  const category = detectCategory(trimmed);
  const intent = detectIntent(trimmed);
  const suggestedFollowUp = needsClarification ? getSuggestedFollowUp(category, intent) : undefined;

  return {
    category,
    intent,
    needsClarification,
    suggestedFollowUp,
  };
}

function checkNeedsClarification(text: string): boolean {
  if (!text || text.length < MIN_MEANINGFUL_LENGTH) return true;
  return AMBIGUOUS_PATTERNS.some((re) => re.test(text));
}

function detectCategory(text: string): QuestionCategory {
  if (!text) return "general";

  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [QuestionCategory, string[]][]) {
    if (cat === "general") continue;
    if (keywords.some((kw) => text.includes(kw) || lower.includes(kw))) {
      return cat;
    }
  }
  return "general";
}

function detectIntent(text: string): QuestionIntent {
  if (!text) return "trend";

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [QuestionIntent, string[]][]) {
    if (intent === "trend") continue;
    if (keywords.some((kw) => text.includes(kw))) {
      return intent;
    }
  }
  return "trend";
}

function getSuggestedFollowUp(category: QuestionCategory, intent: QuestionIntent): string {
  const followUps: Record<QuestionCategory, Partial<Record<QuestionIntent, string>>> = {
    love: {
      timing: "想看「半年／一年」？重點是「何時出現」還是「怎麼做比較快」？",
      strategy: "重點是「何時出現」還是「怎麼做比較快」？",
      default: "想看「半年／一年」？重點是「何時出現」還是「怎麼做比較快」？",
    },
    wealth: {
      default: "期限（3／6／12 月）？風險偏好（保守／平衡／積極）？",
    },
    career: {
      default: "目前階段（想法／試營運／已營運）？最大瓶頸（客源／人力／資金／產品）？",
    },
    health: {
      default: "已就醫？目前最擔心的症狀是什麼？（若有疑慮請就醫）",
    },
    general: {},
  };

  const catMap = followUps[category];
  if (!catMap) return "";
  return (
    (catMap[intent] as string) ||
    (catMap.default as string) ||
    ""
  );
}

// --- 回應模板選擇器 ---

export interface HexagramDataForResponse {
  primaryIndex: number;
  primaryName?: string;
  changingLines: number[];
  /** 月分數陣列 { month, score, isChanging } */
  monthlyScores?: Array<{ month: number; score: number; isChanging: boolean }>;
  /** 卦宮五行 */
  wuxing?: string;
  /** 整體趨勢描述 */
  totalTrend?: string;
  /** 問事時間範圍：6months | 1year | 6years | stages */
  timePeriod?: string;
}

export interface CoreResponseTemplate {
  /** 開場：你問的是什麼（1 句重述） */
  opening: string;
  /** 語氣類型，供後續區塊選用 */
  tone: QuestionIntent;
  /** 建議強調的區塊 */
  emphasizeSections: ("trend" | "timing" | "strategy" | "risks")[];
}

/** 依 timePeriod 將爻索引轉為時間標籤 */
function formatTimeLabel(lineIndex: number, timePeriod?: string): string {
  const STAGES = ["起步", "開始有聲譽", "多變動", "戒慎恐懼", "如日中天", "逐步引退或局外觀察"];
  const MONTHS_1YEAR = [2, 4, 6, 8, 10, 12];
  switch (timePeriod) {
    case "1year":
      return `${MONTHS_1YEAR[lineIndex] ?? lineIndex + 1}月`;
    case "6years":
      return `第 ${lineIndex + 1} 年`;
    case "stages":
      return STAGES[lineIndex] ?? `階段${lineIndex + 1}`;
    case "6months":
    default:
      return `第 ${lineIndex + 1} 月`;
  }
}

/**
 * 根據意圖與卦象資料，產生核心回應模板
 * 供解卦輸出時選用開場語氣與強調區塊
 */
export function generateCoreResponse(
  hexagramData: HexagramDataForResponse,
  analysis: QuestionAnalysis
): CoreResponseTemplate {
  const { intent, category } = analysis;
  const { primaryName, monthlyScores, totalTrend, timePeriod } = hexagramData;

  const categoryLabel: Record<QuestionCategory, string> = {
    career: "事業",
    wealth: "財運",
    love: "感情",
    health: "健康",
    general: "整體",
  };
  const ctxLabel = categoryLabel[category];

  let opening = "";
  const emphasizeSections: CoreResponseTemplate["emphasizeSections"] = [];

  switch (intent) {
    case "yesno": {
      opening = `你問的是【${ctxLabel}】方向的傾向。`;
      emphasizeSections.push("trend", "risks");
      const bestMonth = findBestMonth(monthlyScores);
      if (bestMonth >= 0) {
        const timeLabel = formatTimeLabel(bestMonth, timePeriod);
        opening += `卦象顯示，${timeLabel}前後較有明確傾向。`;
      }
      break;
    }
    case "timing": {
      const bestMonth = findBestMonth(monthlyScores);
      if (bestMonth >= 0) {
        const timeLabel = formatTimeLabel(bestMonth, timePeriod);
        opening = `你問的是【時機】。卦象顯示，${timeLabel}前後是較值得留意的區段。`;
        emphasizeSections.push("timing", "trend");
      } else {
        opening = `你問的是【時機】。${totalTrend || "卦象整體趨勢如下。"}`;
        emphasizeSections.push("timing", "trend");
      }
      break;
    }
    case "strategy": {
      opening = `你問的是【怎麼做】。${primaryName || "本卦"}卦指向行動建議，以下三點可優先考慮。`;
      emphasizeSections.push("strategy", "trend");
      break;
    }
    case "trend":
    default: {
      opening = `你問的是【${ctxLabel}】的整體趨勢。`;
      if (totalTrend) {
        opening += ` ${totalTrend}`;
      }
      emphasizeSections.push("trend", "risks");
      break;
    }
  }

  return {
    opening,
    tone: intent,
    emphasizeSections,
  };
}

/** 找出分數最高的月份（0-based） */
function findBestMonth(
  monthlyScores?: Array<{ month: number; score: number; isChanging: boolean }>
): number {
  if (!monthlyScores || monthlyScores.length === 0) return -1;
  let bestIdx = 0;
  let bestScore = monthlyScores[0]?.score ?? -999;
  monthlyScores.forEach((m, i) => {
    if ((m.score ?? -999) > bestScore) {
      bestScore = m.score;
      bestIdx = i;
    }
  });
  return bestIdx;
}
