/**
 * TimeCalculator.ts
 * 依 questions_weight.json 的權重，接收答案與時段，回傳前三名時辰名稱。
 * 無 UI，僅 console.log 測試。
 */

export type OptionWeight = { shichen: string; weight: number };
export type QuestionOption = { key: string; text: string; weights: OptionWeight[] };
export type QuestionItem = { id: string; text: string; options: QuestionOption[] };
export type PeriodKey = "morning" | "midday" | "afternoon" | "night" | "pastMidnight";

export interface QuestionsWeightData {
  questions: QuestionItem[];
  periodToShichen: Record<PeriodKey, string[]>;
}

export class TimeCalculator {
  constructor(private data: QuestionsWeightData) {}

  /**
   * 依答案累加各時辰分數（僅用前 13 題標準問卷）
   */
  private accumulateScores(answers: Record<string, string>): Record<string, number> {
    const scores: Record<string, number> = {};
    const shichenList = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    shichenList.forEach((s) => (scores[s] = 0));

    const standardQuestions = this.data.questions.slice(0, 13);
    for (const q of standardQuestions) {
      const chosen = answers[q.id];
      if (!chosen) continue;
      const option = q.options.find((o) => o.key === chosen);
      if (!option) continue;
      for (const { shichen, weight } of option.weights) {
        scores[shichen] = (scores[shichen] ?? 0) + weight;
      }
    }
    return scores;
  }

  /**
   * 在給定時段內取分數最高的前 N 個時辰（預設 3）
   */
  getTopThree(
    answers: Record<string, string>,
    period: PeriodKey,
    n: number = 3
  ): string[] {
    const scores = this.accumulateScores(answers);
    const allowed = this.data.periodToShichen[period];
    if (!allowed || allowed.length === 0) return [];

    const withScores = allowed.map((s) => ({ shichen: s, score: scores[s] ?? 0 }));
    withScores.sort((a, b) => b.score - a.score);
    return withScores.slice(0, n).map((x) => x.shichen);
  }
}

// ========== 測試：讀取 JSON 並 console.log 結果 ==========

function runTest(): void {
  const path = require("path");
  const fs = require("fs");
  const jsonPath = path.join(process.cwd(), "questions_weight.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data: QuestionsWeightData = JSON.parse(raw);

  const calculator = new TimeCalculator(data);

  const testAnswers: Record<string, string> = {
    q1: "A",
    q2: "A",
    q3: "A",
    q4: "B",
    q5: "A",
    q6: "A",
    q7: "A",
    q8: "A",
    q9: "A",
    q10: "A",
    q11: "A",
    q12: "A",
    q13: "A",
  };

  const period: PeriodKey = "midday";
  const topThree = calculator.getTopThree(testAnswers, period);

  console.log("[TimeCalculator] 測試答案（13 題皆選 A，時段：midday）");
  console.log("[TimeCalculator] 前三名時辰：", topThree);
}

if (require.main === module) {
  runTest();
}
