/**
 * 推算時辰純函數（V4：18+1 題）
 * 與前端 identifyBirthTime.js 的 estimateHourLocal 邏輯一致，供後端 API 與前端 fallback 共用。
 * 未來調整題目權重請只改此處。
 *
 * @param {Object} answers - q1,q2 為 string[]（最多 2 項），其餘為 string
 * @returns {{ branch: string, hour_label: string, hour_range: string, half: string }}
 */
export function estimateHourFromAnswers(answers) {
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const TIE_ORDER = BRANCHES.slice();
  const HOUR_RANGES = {
    子: '23:00-01:00', 丑: '01:00-03:00', 寅: '03:00-05:00', 卯: '05:00-07:00',
    辰: '07:00-09:00', 巳: '09:00-11:00', 午: '11:00-13:00', 未: '13:00-15:00',
    申: '15:00-17:00', 酉: '17:00-19:00', 戌: '19:00-21:00', 亥: '21:00-23:00',
  };

  function wuxingToBranches(wx, amount = 1) {
    const out = {};
    BRANCHES.forEach((b) => { out[b] = 0; });
    if (wx === '金') { out['申'] = amount; out['酉'] = amount; }
    else if (wx === '木') { out['寅'] = amount; out['卯'] = amount; }
    else if (wx === '水') { out['亥'] = amount; out['子'] = amount; }
    else if (wx === '火') { out['巳'] = amount; out['午'] = amount; }
    else if (wx === '土') {
      out['辰'] = amount * 0.5; out['戌'] = amount * 0.5;
      out['丑'] = amount * 0.5; out['未'] = amount * 0.5;
    }
    return out;
  }

  function addTo(scores, delta, weight = 1) {
    Object.keys(delta || {}).forEach((b) => {
      if (BRANCHES.includes(b)) scores[b] = (scores[b] || 0) + (delta[b] || 0) * weight;
    });
  }

  const Q1Q2_MAP = { A: ['寅', '卯', '辰'], B: ['卯', '辰', '巳'], C: ['巳', '午', '未'], D: ['申', '酉', '戌'], E: ['亥', '子', '丑'], F: ['子', '丑', '寅'] };
  const Q3_MAP = { A: ['寅', '卯', '辰'], B: ['卯', '辰', '巳'], C: ['巳', '午', '未'], D: ['申', '酉', '戌'], E: ['亥', '子', '丑'] };
  const WUXING_OPTION = { A: '金', B: '木', C: '水', D: '火', E: '土' };
  const Q7_MAP = { A: { 金: 2 }, B: { 金: 1, 火: 1 }, C: { 水: 2 }, D: { 土: 2 }, E: { 木: 1, 水: 1 } };

  function applyQ8(answersObj, scores, weight) {
    const v = answersObj.q8;
    if (!v) return;
    if (v === 'B') {
      ['寅', '申', '巳', '亥'].forEach((b) => { scores[b] = (scores[b] || 0) + 1 * weight; });
      return;
    }
    const wx = WUXING_OPTION[v];
    if (wx) addTo(scores, wuxingToBranches(wx, 2), weight);
  }

  const DUEL_MAP = {
    q9: { A: { 申: 2, 寅: -2 }, B: { 寅: 2, 申: -2 } },
    q10: { A: { 酉: 2, 卯: -2 }, B: { 卯: 2, 酉: -2 } },
    q11: { A: { 辰: 2, 戌: -2 }, B: { 戌: 2, 辰: -2 } },
    q12: { A: { 巳: 2, 亥: -2 }, B: { 亥: 2, 巳: -2 } },
    q13: { A: { 午: 2, 子: -2 }, B: { 子: 2, 午: -2 } },
    q14: { A: { 未: 2, 丑: -2 }, B: { 丑: 2, 未: -2 } },
  };
  const Q18_MAP = { A: ['申', '午'], B: ['子', '亥'], C: ['寅', '辰'], D: ['戌', '丑'], E: ['卯', '未'], F: ['巳', '酉'] };

  const score = {};
  const timeSubtotal = {};
  const duelSubtotal = {};
  BRANCHES.forEach((b) => { score[b] = 0; timeSubtotal[b] = 0; duelSubtotal[b] = 0; });

  const q1Arr = Array.isArray(answers.q1) ? answers.q1.slice(0, 2) : (answers.q1 ? [answers.q1] : []);
  q1Arr.forEach((key) => {
    const arr = Q1Q2_MAP[key];
    if (arr) arr.forEach((b) => { score[b] += 3; timeSubtotal[b] += 3; });
  });
  const q2Arr = Array.isArray(answers.q2) ? answers.q2.slice(0, 2) : (answers.q2 ? [answers.q2] : []);
  q2Arr.forEach((key) => {
    const arr = Q1Q2_MAP[key];
    if (arr) arr.forEach((b) => { score[b] += 3; timeSubtotal[b] += 3; });
  });
  if (answers.q3 && Q3_MAP[answers.q3]) {
    Q3_MAP[answers.q3].forEach((b) => { score[b] += 3; timeSubtotal[b] += 3; });
  }
  [4, 5, 6].forEach((n) => {
    const wx = WUXING_OPTION[answers['q' + n]];
    if (wx) addTo(score, wuxingToBranches(wx, 1), 2);
  });
  if (answers.q7 && Q7_MAP[answers.q7]) {
    Object.keys(Q7_MAP[answers.q7]).forEach((wx) => {
      addTo(score, wuxingToBranches(wx, Q7_MAP[answers.q7][wx]), 2);
    });
  }
  applyQ8(answers, score, 2);
  [9, 10, 11, 12, 13, 14].forEach((n) => {
    const qid = 'q' + n;
    const key = answers[qid];
    const map = DUEL_MAP[qid];
    if (!map || !key || !map[key]) return;
    Object.keys(map[key]).forEach((b) => {
      const v = map[key][b] * 3;
      score[b] += v;
      duelSubtotal[b] += v;
    });
  });
  [15, 16, 17].forEach((n) => {
    const wx = WUXING_OPTION[answers['q' + n]];
    if (wx) addTo(score, wuxingToBranches(wx, 1), 1);
  });
  if (answers.q18 && Q18_MAP[answers.q18]) {
    Q18_MAP[answers.q18].forEach((b) => { score[b] += 1; });
  }

  let maxScore = Math.max(...Object.keys(score).map((b) => score[b]));
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
  const branch = candidates[0] || '子';
  const half = answers.q19 === 'B' ? 'lower' : 'upper';
  return {
    branch,
    hour_label: branch + '時',
    hour_range: HOUR_RANGES[branch] || '',
    half,
  };
}
