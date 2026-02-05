/**
 * BirthTimeEngine.ts
 * 依 15 題問卷 + 西洋時段選擇，推估出生時辰可信區間（最多 3 個時辰）供紫微排盤使用。
 */

// ========== 資料定義 ==========

/** 12 時辰（子至亥） */
export const SHICHEN_LIST = [
  "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
] as const;

export type Shichen = (typeof SHICHEN_LIST)[number];

/** 初始分值：12 時辰皆為 0 */
export function createInitialScores(): Record<Shichen, number> {
  return SHICHEN_LIST.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<Shichen, number>
  );
}

/** 單一選項的時辰權重 */
export type OptionWeight = { shichen: Shichen; weight: number };

/** 問卷選項（多數為 A/B/C，q14–q15 為反向驗證可有 D） */
export type AnswerKey = "A" | "B" | "C" | "D";

export type QuestionOption = {
  key: AnswerKey;
  text: string;
  weights: OptionWeight[];
};

/** 單題問卷 */
export type Question = {
  id: string;
  text: string;
  options: QuestionOption[];
};

/** 西洋時段（對應「你一天哪個時間段最清醒？」） */
export type PeriodKey =
  | "morning"      // 6–10 → 寅、卯、辰
  | "midday"       // 10–14 → 巳、午、未
  | "afternoon"    // 14–18 → 申、酉
  | "night"        // 18–24 → 戌、亥、子
  | "pastMidnight"; // 00–06 → 子、丑

/** 時段過濾器：西洋時間段 → 候選時辰 */
export const PERIOD_TO_SHICHEN: Record<PeriodKey, Shichen[]> = {
  morning: ["寅", "卯", "辰"],       // 6–10
  midday: ["巳", "午", "未"],        // 10–14
  afternoon: ["申", "酉"],           // 14–18
  night: ["戌", "亥", "子"],         // 18–24
  pastMidnight: ["子", "丑"],        // 00–06
};

// ========== 15 題問卷權重對照表 ==========

export const BIRTH_TIME_QUESTIONNAIRE: Question[] = [
  {
    id: "q1",
    text: "你在壓力大的時候傾向怎麼反應？",
    options: [
      { key: "A", text: "先整理資訊、做計畫", weights: [{ shichen: "辰", weight: 1 }, { shichen: "戌", weight: 1 }] },
      { key: "B", text: "直覺行動、先做再說", weights: [{ shichen: "寅", weight: 1 }, { shichen: "巳", weight: 1 }] },
      { key: "C", text: "退後、觀察、等情緒平穩", weights: [{ shichen: "子", weight: 1 }, { shichen: "未", weight: 1 }] },
    ],
  },
  {
    id: "q2",
    text: "做重大決定時，你更依賴？",
    options: [
      { key: "A", text: "數據與邏輯", weights: [{ shichen: "辰", weight: 1 }, { shichen: "酉", weight: 1 }] },
      { key: "B", text: "直覺與感受", weights: [{ shichen: "子", weight: 1 }, { shichen: "午", weight: 1 }] },
      { key: "C", text: "他人意見與共識", weights: [{ shichen: "未", weight: 1 }, { shichen: "戌", weight: 1 }] },
    ],
  },
  {
    id: "q3",
    text: "與人衝突時，你通常？",
    options: [
      { key: "A", text: "講道理、訂規則", weights: [{ shichen: "酉", weight: 1 }, { shichen: "辰", weight: 1 }] },
      { key: "B", text: "直接表達、速戰速決", weights: [{ shichen: "寅", weight: 1 }, { shichen: "午", weight: 1 }] },
      { key: "C", text: "先避開、再找時機溝通", weights: [{ shichen: "亥", weight: 1 }, { shichen: "未", weight: 1 }] },
    ],
  },
  {
    id: "q4",
    text: "你認為自己較像？",
    options: [
      { key: "A", text: "早起型，早上思路最清晰", weights: [{ shichen: "寅", weight: 1 }, { shichen: "卯", weight: 1 }] },
      { key: "B", text: "中午前後最有精神", weights: [{ shichen: "巳", weight: 1 }, { shichen: "午", weight: 1 }] },
      { key: "C", text: "晚上或深夜才進入狀態", weights: [{ shichen: "戌", weight: 1 }, { shichen: "亥", weight: 1 }] },
    ],
  },
  {
    id: "q5",
    text: "面對不確定性，你的第一反應是？",
    options: [
      { key: "A", text: "先蒐集更多資訊再動", weights: [{ shichen: "辰", weight: 1 }, { shichen: "申", weight: 1 }] },
      { key: "B", text: "先試一點再說", weights: [{ shichen: "巳", weight: 1 }, { shichen: "寅", weight: 1 }] },
      { key: "C", text: "先觀望、等局勢明朗", weights: [{ shichen: "子", weight: 1 }, { shichen: "丑", weight: 1 }] },
    ],
  },
  {
    id: "q6",
    text: "你較常被說？",
    options: [
      { key: "A", text: "有責任感、說到做到", weights: [{ shichen: "戌", weight: 1 }, { shichen: "辰", weight: 1 }] },
      { key: "B", text: "行動力強、衝勁足", weights: [{ shichen: "寅", weight: 1 }, { shichen: "午", weight: 1 }] },
      { key: "C", text: "善於傾聽、能安撫人", weights: [{ shichen: "未", weight: 1 }, { shichen: "亥", weight: 1 }] },
    ],
  },
  {
    id: "q7",
    text: "完成一件大事後，你傾向？",
    options: [
      { key: "A", text: "立刻規劃下一步", weights: [{ shichen: "辰", weight: 1 }, { shichen: "申", weight: 1 }] },
      { key: "B", text: "先慶祝或休息一下", weights: [{ shichen: "午", weight: 1 }, { shichen: "未", weight: 1 }] },
      { key: "C", text: "獨處沉澱、回顧", weights: [{ shichen: "亥", weight: 1 }, { shichen: "子", weight: 1 }] },
    ],
  },
  {
    id: "q8",
    text: "在團隊中，你通常扮演？",
    options: [
      { key: "A", text: "定規則、分工的人", weights: [{ shichen: "酉", weight: 1 }, { shichen: "戌", weight: 1 }] },
      { key: "B", text: "衝第一、帶頭做的人", weights: [{ shichen: "寅", weight: 1 }, { shichen: "巳", weight: 1 }] },
      { key: "C", text: "協調、照顧大家的人", weights: [{ shichen: "未", weight: 1 }, { shichen: "卯", weight: 1 }] },
    ],
  },
  {
    id: "q9",
    text: "你對「時間」的態度較接近？",
    options: [
      { key: "A", text: "守時、有節奏感", weights: [{ shichen: "辰", weight: 1 }, { shichen: "酉", weight: 1 }] },
      { key: "B", text: "彈性、看狀況", weights: [{ shichen: "巳", weight: 1 }, { shichen: "午", weight: 1 }] },
      { key: "C", text: "重當下感受大於準點", weights: [{ shichen: "亥", weight: 1 }, { shichen: "子", weight: 1 }] },
    ],
  },
  {
    id: "q10",
    text: "遇到挫折時，你較常？",
    options: [
      { key: "A", text: "分析原因、改流程", weights: [{ shichen: "申", weight: 1 }, { shichen: "辰", weight: 1 }] },
      { key: "B", text: "再試一次、換方法衝", weights: [{ shichen: "寅", weight: 1 }, { shichen: "午", weight: 1 }] },
      { key: "C", text: "先休息、找信任的人聊", weights: [{ shichen: "未", weight: 1 }, { shichen: "亥", weight: 1 }] },
    ],
  },
  {
    id: "q11",
    text: "你較喜歡的學習方式？",
    options: [
      { key: "A", text: "有架構、按步驟", weights: [{ shichen: "辰", weight: 1 }, { shichen: "酉", weight: 1 }] },
      { key: "B", text: "動手做、實戰中學", weights: [{ shichen: "巳", weight: 1 }, { shichen: "寅", weight: 1 }] },
      { key: "C", text: "觀察、反思、內化", weights: [{ shichen: "子", weight: 1 }, { shichen: "未", weight: 1 }] },
    ],
  },
  {
    id: "q12",
    text: "金錢或資源運用上，你較像？",
    options: [
      { key: "A", text: "有預算、有規劃", weights: [{ shichen: "戌", weight: 1 }, { shichen: "辰", weight: 1 }] },
      { key: "B", text: "敢投資、敢衝", weights: [{ shichen: "寅", weight: 1 }, { shichen: "午", weight: 1 }] },
      { key: "C", text: "隨緣、夠用就好", weights: [{ shichen: "亥", weight: 1 }, { shichen: "未", weight: 1 }] },
    ],
  },
  {
    id: "q13",
    text: "別人對你的第一印象通常是？",
    options: [
      { key: "A", text: "穩重、可靠", weights: [{ shichen: "辰", weight: 1 }, { shichen: "戌", weight: 1 }] },
      { key: "B", text: "有活力、有主見", weights: [{ shichen: "午", weight: 1 }, { shichen: "寅", weight: 1 }] },
      { key: "C", text: "溫和、好相處", weights: [{ shichen: "卯", weight: 1 }, { shichen: "未", weight: 1 }] },
    ],
  },
  {
    id: "q14",
    text: "你人生中最大的事件或課題，通常出現在？",
    options: [
      { key: "A", text: "家庭、長輩、根基", weights: [{ shichen: "丑", weight: 1 }, { shichen: "未", weight: 1 }] },
      { key: "B", text: "金錢、事業、成就", weights: [{ shichen: "辰", weight: 1 }, { shichen: "戌", weight: 1 }] },
      { key: "C", text: "感情、人際、合作", weights: [{ shichen: "午", weight: 1 }, { shichen: "子", weight: 1 }] },
      { key: "D", text: "健康、作息、身體", weights: [{ shichen: "寅", weight: 1 }, { shichen: "申", weight: 1 }] },
    ],
  },
  {
    id: "q15",
    text: "你 16–22 歲時，人生最明顯的轉折與什麼最相關？",
    options: [
      { key: "A", text: "學業、考試、方向選擇", weights: [{ shichen: "寅", weight: 1 }, { shichen: "申", weight: 1 }] },
      { key: "B", text: "感情、人際、自我認同", weights: [{ shichen: "午", weight: 1 }, { shichen: "子", weight: 1 }] },
      { key: "C", text: "家庭變動、搬家、長輩", weights: [{ shichen: "丑", weight: 1 }, { shichen: "未", weight: 1 }] },
      { key: "D", text: "健康、體能、作息改變", weights: [{ shichen: "卯", weight: 1 }, { shichen: "酉", weight: 1 }] },
    ],
  },
];

// 題目 14、15 為「反向驗證」題，選項為 4 個，型別上允許 key 為 D
export type AnswerKey = "A" | "B" | "C" | "D";

/** 用戶答案：題 id → 選項 key */
export type QuestionnaireAnswers = Partial<Record<string, AnswerKey>>;

// ========== 核心：累積分數 + 時段過濾 ==========

/**
 * 依問卷答案累加各時辰分數（僅處理前 13 題標準三選，14–15 題可選用於反向驗證）
 */
function accumulateScores(answers: QuestionnaireAnswers): Record<Shichen, number> {
  const scores = createInitialScores();
  const standardQuestions = BIRTH_TIME_QUESTIONNAIRE.slice(0, 13);

  for (const q of standardQuestions) {
    const chosen = answers[q.id] as "A" | "B" | "C" | undefined;
    if (!chosen) continue;
    const option = q.options.find((o) => o.key === chosen);
    if (!option) continue;
    for (const { shichen, weight } of option.weights) {
      scores[shichen] = (scores[shichen] || 0) + weight;
    }
  }

  return scores;
}

/**
 * 在給定時段內，取分數最高的前 N 個時辰（預設 3）
 */
function topShichenInPeriod(
  scores: Record<Shichen, number>,
  period: PeriodKey,
  n: number = 3
): Shichen[] {
  const allowed = PERIOD_TO_SHICHEN[period];
  const withScores = allowed.map((s) => ({ shichen: s, score: scores[s] ?? 0 }));
  withScores.sort((a, b) => b.score - a.score);
  return withScores.slice(0, n).map((x) => x.shichen);
}

/**
 * 計算「前幾名」分數佔該時段內總分的比例，作為可信度（0–1）
 */
function confidenceInPeriod(
  scores: Record<Shichen, number>,
  period: PeriodKey,
  topList: Shichen[]
): number {
  const allowed = PERIOD_TO_SHICHEN[period];
  const total = allowed.reduce((sum, s) => sum + (scores[s] ?? 0), 0);
  if (total <= 0) return 0;
  const topSum = topList.reduce((sum, s) => sum + (scores[s] ?? 0), 0);
  return Math.min(1, Math.round((topSum / total) * 100) / 100);
}

// ========== 主函數 ==========

export interface EstimateHourResult {
  /** 可信區間：最多 3 個時辰 */
  topHours: Shichen[];
  /** 可信度 0–1（前幾名在該時段內佔比） */
  confidence: number;
  /** 該時段內各時辰原始分數（除錯／前端顯示用） */
  scoresInPeriod?: Record<Shichen, number>;
}

/**
 * 依 15 題答案 + 西洋時段，推估出生時辰可信區間（前 3 高），供紫微排盤用。
 * 實際計分僅用前 13 題；14–15 題可留作反向驗證（未來擴充）。
 */
export function estimateHour(
  answers: QuestionnaireAnswers,
  period: PeriodKey
): EstimateHourResult {
  const scores = accumulateScores(answers);
  const topHours = topShichenInPeriod(scores, period, 3);
  const confidence = confidenceInPeriod(scores, period, topHours);

  const allowed = PERIOD_TO_SHICHEN[period];
  const scoresInPeriod = allowed.reduce(
    (acc, s) => ({ ...acc, [s]: scores[s] ?? 0 }),
    {} as Record<Shichen, number>
  );

  return {
    topHours,
    confidence,
    scoresInPeriod,
  };
}

// ========== 反向驗證（加分）：宮位／小限 ==========

/** 人生重大事件常見宮位對應時辰（用於排除或加權）— 簡化版 */
export const LIFE_EVENT_PALACE_TO_SHICHEN: Record<string, Shichen[]> = {
  family: ["丑", "未"],
  money: ["辰", "戌"],
  career: ["辰", "戌", "寅", "申"],
  relationship: ["午", "子", "卯", "酉"],
  health: ["寅", "申", "卯", "酉"],
};

/**
 * 依 q14「人生最大事件出現在哪類」可縮小或加權時辰（可選實作）
 */
export function refineByLifeEvent(
  currentTop: Shichen[],
  lifeEventKey: "family" | "money" | "career" | "relationship" | "health"
): Shichen[] {
  const preferred = LIFE_EVENT_PALACE_TO_SHICHEN[lifeEventKey] ?? [];
  const overlap = currentTop.filter((s) => preferred.includes(s));
  return overlap.length >= 2 ? overlap : currentTop;
}

// ========== Test Case ==========

export function runBirthTimeEngineTest(): EstimateHourResult {
  const testAnswers: QuestionnaireAnswers = {
    q1: "A",  // 辰+戌
    q2: "A",  // 辰+酉
    q3: "A",  // 酉+辰
    q4: "B",  // 巳+午
    q5: "A",  // 辰+申
    q6: "A",  // 戌+辰
    q7: "A",  // 辰+申
    q8: "A",  // 酉+戌
    q9: "A",  // 辰+酉
    q10: "A", // 申+辰
    q11: "A", // 辰+酉
    q12: "A", // 戌+辰
    q13: "A", // 辰+戌
  };

  const period: PeriodKey = "midday"; // 巳、午、未
  const result = estimateHour(testAnswers, period);

  console.log("[BirthTimeEngine] Test result:", JSON.stringify(result, null, 2));
  console.log(
    "[BirthTimeEngine] 你的時辰最有可能是：",
    result.topHours.join(" / "),
    "（可信度",
    Math.round(result.confidence * 100) + "%）"
  );

  return result;
}

// 若直接執行此檔（node 或 ts-node）
if (typeof process !== "undefined" && process.env?.RUN_BIRTH_TIME_TEST === "1") {
  runBirthTimeEngineTest();
}
