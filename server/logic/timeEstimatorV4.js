/**
 * server/logic/timeEstimatorV4.js
 * 推算時辰 V4：18+1 題問卷，權重與計分僅後端，輸出唯一地支 + 上半/下半。
 */

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const TIE_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const HOUR_RANGES = {
  子: "23:00-01:00", 丑: "01:00-03:00", 寅: "03:00-05:00", 卯: "05:00-07:00",
  辰: "07:00-09:00", 巳: "09:00-11:00", 午: "11:00-13:00", 未: "13:00-15:00",
  申: "15:00-17:00", 酉: "17:00-19:00", 戌: "19:00-21:00", 亥: "21:00-23:00",
};

// 五行 → 地支（土為辰戌丑未各 0.5）
function wuxingToBranches(wx, amount = 1) {
  const out = {};
  BRANCHES.forEach((b) => (out[b] = 0));
  if (wx === "金") { out["申"] = amount; out["酉"] = amount; }
  else if (wx === "木") { out["寅"] = amount; out["卯"] = amount; }
  else if (wx === "水") { out["亥"] = amount; out["子"] = amount; }
  else if (wx === "火") { out["巳"] = amount; out["午"] = amount; }
  else if (wx === "土") { out["辰"] = amount * 0.5; out["戌"] = amount * 0.5; out["丑"] = amount * 0.5; out["未"] = amount * 0.5; }
  return out;
}

function addTo(scores, delta, weight = 1) {
  Object.keys(delta).forEach((b) => {
    if (BRANCHES.includes(b)) scores[b] = (scores[b] || 0) + (delta[b] || 0) * weight;
  });
}

// Q1、Q2 選項 → 三地支
const Q1Q2_MAP = {
  A: ["寅", "卯", "辰"],   // 清晨
  B: ["卯", "辰", "巳"],   // 上午
  C: ["巳", "午", "未"],   // 下午
  D: ["申", "酉", "戌"],   // 傍晚
  E: ["亥", "子", "丑"],   // 深夜
  F: ["子", "丑", "寅"],   // 凌晨
};

// Q3 選項 → 三地支
const Q3_MAP = {
  A: ["寅", "卯", "辰"],   // 早上自然精神好
  B: ["卯", "辰", "巳"],   // 早餐後才有狀態
  C: ["巳", "午", "未"],   // 上午暖機、下午更強
  D: ["申", "酉", "戌"],   // 晚上精神最好
  E: ["亥", "子", "丑"],   // 半夜最有靈感
};

// Q4–Q6、Q15–Q17 選項 → 五行
const WUXING_OPTION = { A: "金", B: "木", C: "水", D: "火", E: "土" };

// Q7 選項 → 五行+量
const Q7_MAP = {
  A: { 金: 2 },
  B: { 金: 1, 火: 1 },
  C: { 水: 2 },
  D: { 土: 2 },
  E: { 木: 1, 水: 1 },
};

// Q8 選項：A/C/D/E 五行；B 驛馬組
function applyQ8(answers, scores, weight) {
  const v = answers.q8;
  if (!v) return;
  if (v === "B") {
    ["寅", "申", "巳", "亥"].forEach((b) => { scores[b] = (scores[b] || 0) + 1 * weight; });
    return;
  }
  const wx = WUXING_OPTION[v];
  if (wx) addTo(scores, wuxingToBranches(wx, 2), weight);
}

// Q9–Q14 對戰：A/B → ±2×權重3
const DUEL_MAP = {
  q9:  { A: { 申: 2, 寅: -2 }, B: { 寅: 2, 申: -2 } },
  q10: { A: { 酉: 2, 卯: -2 }, B: { 卯: 2, 酉: -2 } },
  q11: { A: { 辰: 2, 戌: -2 }, B: { 戌: 2, 辰: -2 } },
  q12: { A: { 巳: 2, 亥: -2 }, B: { 亥: 2, 巳: -2 } },
  q13: { A: { 午: 2, 子: -2 }, B: { 子: 2, 午: -2 } },
  q14: { A: { 未: 2, 丑: -2 }, B: { 丑: 2, 未: -2 } },
};

// Q18 選項 → 地支組 +1 each
const Q18_MAP = {
  A: ["申", "午"],   // 執行型
  B: ["子", "亥"],   // 軍師型
  C: ["寅", "辰"],   // 領導型
  D: ["戌", "丑"],   // 穩定可靠型
  E: ["卯", "未"],   // 連結協調型
  F: ["巳", "酉"],   // 改變與創新型
};

/**
 * 依 18+1 題答案計算唯一地支與上半/下半
 * @param {Object} answers - q1,q2 為陣列(最多2項)，其餘字串；q19 為 "A"|"B" 偏早/偏晚
 * @returns {{ branch: string, hour_label: string, hour_range: string, half: "upper"|"lower" }}
 */
function estimateHourV4(answers) {
  const score = {};
  const timeSubtotal = {};
  const duelSubtotal = {};
  BRANCHES.forEach((b) => {
    score[b] = 0;
    timeSubtotal[b] = 0;
    duelSubtotal[b] = 0;
  });

  // Q1 可複選最多 2，每項 → 三地支 +1×3
  const q1Arr = Array.isArray(answers.q1) ? answers.q1.slice(0, 2) : (answers.q1 ? [answers.q1] : []);
  q1Arr.forEach((key) => {
    const arr = Q1Q2_MAP[key];
    if (arr) arr.forEach((b) => {
      score[b] += 1 * 3;
      timeSubtotal[b] += 1 * 3;
    });
  });

  // Q2 同上
  const q2Arr = Array.isArray(answers.q2) ? answers.q2.slice(0, 2) : (answers.q2 ? [answers.q2] : []);
  q2Arr.forEach((key) => {
    const arr = Q1Q2_MAP[key];
    if (arr) arr.forEach((b) => {
      score[b] += 1 * 3;
      timeSubtotal[b] += 1 * 3;
    });
  });

  // Q3 單選，權重 3
  const q3Key = answers.q3;
  if (q3Key && Q3_MAP[q3Key]) {
    Q3_MAP[q3Key].forEach((b) => {
      score[b] += 1 * 3;
      timeSubtotal[b] += 1 * 3;
    });
  }

  // Q4–Q6 五行題，權重 2
  [4, 5, 6].forEach((n) => {
    const key = answers["q" + n];
    const wx = WUXING_OPTION[key];
    if (wx) addTo(score, wuxingToBranches(wx, 1), 2);
  });

  // Q7 特殊
  const q7Key = answers.q7;
  if (q7Key && Q7_MAP[q7Key]) {
    Object.entries(Q7_MAP[q7Key]).forEach(([wx, amt]) => {
      addTo(score, wuxingToBranches(wx, amt), 2);
    });
  }

  // Q8
  applyQ8(answers, score, 2);

  // Q9–Q14 對戰 ±2×3
  [9, 10, 11, 12, 13, 14].forEach((n) => {
    const qid = "q" + n;
    const key = answers[qid];
    const map = DUEL_MAP[qid];
    if (!map || !key || !map[key]) return;
    Object.entries(map[key]).forEach(([b, delta]) => {
      const v = delta * 3;
      score[b] += v;
      duelSubtotal[b] += v;
    });
  });

  // Q15–Q17 五行題，權重 1
  [15, 16, 17].forEach((n) => {
    const key = answers["q" + n];
    const wx = WUXING_OPTION[key];
    if (wx) addTo(score, wuxingToBranches(wx, 1), 1);
  });

  // Q18
  const q18Key = answers.q18;
  if (q18Key && Q18_MAP[q18Key]) {
    Q18_MAP[q18Key].forEach((b) => { score[b] += 1 * 1; });
  }

  // 決勝：最高分 → timeSubtotal → duelSubtotal → 固定順序
  const maxScore = Math.max(...Object.values(score));
  let candidates = BRANCHES.filter((b) => score[b] === maxScore);

  if (candidates.length > 1) {
    const maxTime = Math.max(...candidates.map((b) => timeSubtotal[b]));
    candidates = candidates.filter((b) => timeSubtotal[b] === maxTime);
  }
  if (candidates.length > 1) {
    const maxDuel = Math.max(...candidates.map((b) => duelSubtotal[b]));
    candidates = candidates.filter((b) => duelSubtotal[b] === maxDuel);
  }
  if (candidates.length > 1) {
    const first = TIE_ORDER.find((b) => candidates.includes(b));
    candidates = first ? [first] : [candidates[0]];
  }
  const branch = candidates[0] || "子";

  // Q19 偏早/偏晚 → 上半/下半
  const q19 = answers.q19;
  const half = q19 === "B" ? "lower" : "upper";

  return {
    branch,
    hour_label: branch + "時",
    hour_range: HOUR_RANGES[branch] || "",
    half,
  };
}

export { BRANCHES, HOUR_RANGES, estimateHourV4 };
