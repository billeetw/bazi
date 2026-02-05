/**
 * server/logic/timeEstimator.js
 * 時辰反推加權計分邏輯，問卷權重僅存於後端，不得暴露至前端。
 */

const SHICHEN_LIST = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/** 問卷題目與選項權重（僅後端） */
const BIRTH_TIME_QUESTIONS = [
  { id: "q1", options: [{ key: "A", weights: [{ shichen: "寅", weight: 1 }, { shichen: "卯", weight: 1 }] }, { key: "B", weights: [{ shichen: "申", weight: 1 }, { shichen: "酉", weight: 1 }] }, { key: "C", weights: [{ shichen: "午", weight: 1 }, { shichen: "子", weight: 1 }] }, { key: "D", weights: [{ shichen: "辰", weight: 1 }, { shichen: "戌", weight: 1 }] }] },
  { id: "q2", options: [{ key: "A", weights: [{ shichen: "寅", weight: 1 }, { shichen: "辰", weight: 1 }] }, { key: "B", weights: [{ shichen: "亥", weight: 1 }, { shichen: "子", weight: 1 }] }, { key: "C", weights: [{ shichen: "午", weight: 1 }, { shichen: "未", weight: 1 }] }, { key: "D", weights: [{ shichen: "酉", weight: 1 }, { shichen: "戌", weight: 1 }] }] },
  { id: "q3", options: [{ key: "A", weights: [{ shichen: "寅", weight: 1 }, { shichen: "巳", weight: 1 }, { shichen: "申", weight: 1 }] }, { key: "B", weights: [{ shichen: "子", weight: 1 }, { shichen: "午", weight: 1 }, { shichen: "卯", weight: 1 }] }, { key: "C", weights: [{ shichen: "辰", weight: 1 }, { shichen: "戌", weight: 1 }, { shichen: "丑", weight: 1 }] }] },
  { id: "q4", options: [{ key: "A", weights: [{ shichen: "寅", weight: 1 }, { shichen: "卯", weight: 1 }, { shichen: "辰", weight: 1 }] }, { key: "B", weights: [{ shichen: "巳", weight: 1 }, { shichen: "午", weight: 1 }, { shichen: "未", weight: 1 }] }, { key: "C", weights: [{ shichen: "申", weight: 1 }, { shichen: "酉", weight: 1 }] }, { key: "D", weights: [{ shichen: "戌", weight: 1 }, { shichen: "亥", weight: 1 }, { shichen: "子", weight: 1 }] }] },
  { id: "q5", options: [{ key: "A", weights: [{ shichen: "辰", weight: 1 }, { shichen: "酉", weight: 1 }] }, { key: "B", weights: [{ shichen: "寅", weight: 1 }, { shichen: "巳", weight: 1 }] }, { key: "C", weights: [{ shichen: "未", weight: 1 }, { shichen: "戌", weight: 1 }] }] },
  { id: "q6", options: [{ key: "A", weights: [{ shichen: "辰", weight: 1 }, { shichen: "戌", weight: 1 }] }, { key: "B", weights: [{ shichen: "寅", weight: 1 }, { shichen: "午", weight: 1 }] }, { key: "C", weights: [{ shichen: "子", weight: 1 }, { shichen: "未", weight: 1 }] }] },
  { id: "q7", options: [{ key: "A", weights: [{ shichen: "辰", weight: 1 }, { shichen: "戌", weight: 1 }] }, { key: "B", weights: [{ shichen: "寅", weight: 1 }, { shichen: "午", weight: 1 }] }, { key: "C", weights: [{ shichen: "卯", weight: 1 }, { shichen: "未", weight: 1 }] }] },
];

/**
 * 依問卷答案累加各時辰分數，回傳前三名時辰與可信度
 * @param {Record<string, string>} answers - 題 id → 選項 key，如 { q1: "A", q2: "B", ... }
 * @returns {{ topHours: string[], confidence: number }}
 */
function estimateHour(answers) {
  const scores = {};
  SHICHEN_LIST.forEach((s) => (scores[s] = 0));

  BIRTH_TIME_QUESTIONS.forEach((q) => {
    const chosen = answers[q.id];
    if (!chosen) return;
    const option = q.options.find((o) => o.key === chosen);
    if (!option) return;
    option.weights.forEach((w) => {
      scores[w.shichen] = (scores[w.shichen] || 0) + w.weight;
    });
  });

  const sorted = SHICHEN_LIST.map((s) => ({ shichen: s, score: scores[s] || 0 })).sort((a, b) => b.score - a.score);
  const topThree = sorted.slice(0, 3).map((x) => x.shichen);
  const total = sorted.reduce((sum, x) => sum + x.score, 0);
  const topSum = sorted.slice(0, 3).reduce((sum, x) => sum + x.score, 0);
  const confidenceVal = total > 0 ? Math.min(1, Math.round((topSum / total) * 100) / 100) : 0;

  return { topHours: topThree, confidence: confidenceVal };
}

export { SHICHEN_LIST, estimateHour };
