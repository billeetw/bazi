/**
 * 推算時辰純函數（vNext：置信度與資料過濾）
 * 置於 utils 供 estimate-hour API 等模組引用。
 *
 * @param {Object} answers - q1,q2 為 string[]（最多 2 項），其餘為 string
 * @param {Object} [options] - getRecentPredictions: async (userId)=>[{bestBranch}]
 * @returns {{ branch, hour_label, hour_range, half, score, confidence_score, uiHint, top2Branches, bestScore, secondScore, delta, debug }}
 */
export function estimateHourFromAnswers(answers, options = {}) {
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const NIGHT_BRANCHES = ['子', '丑', '亥'];
  const TIE_ORDER = BRANCHES.slice();
  const BRANCH_GROUPS = {
    子: 0, 丑: 0, 亥: 0,
    寅: 1, 卯: 1, 辰: 1,
    巳: 2, 午: 2, 未: 2,
    申: 3, 酉: 3, 戌: 3,
  };
  const HOUR_RANGES = {
    子: '23:00-01:00', 丑: '01:00-03:00', 寅: '03:00-05:00', 卯: '05:00-07:00',
    辰: '07:00-09:00', 巳: '09:00-11:00', 午: '11:00-13:00', 未: '13:00-15:00',
    申: '15:00-17:00', 酉: '17:00-19:00', 戌: '19:00-21:00', 亥: '21:00-23:00',
  };

  const contributions = [];
  function recordContribution(q, adds) {
    const out = {};
    BRANCHES.forEach((b) => { out[b] = (adds[b] || 0); });
    contributions.push({ q, adds: out });
  }

  function wuxingToBranches(wx, amount = 1) {
    const out = {};
    BRANCHES.forEach((b) => { out[b] = 0; });
    if (wx === '金') { out['申'] = amount; out['酉'] = amount; }
    else if (wx === '木') { out['寅'] = amount; out['卯'] = amount; }
    else if (wx === '水') { out['亥'] = amount; out['子'] = amount; }
    else if (wx === '火') { out['巳'] = amount; out['午'] = amount; }
    else if (wx === '土') {
      out['丑'] = amount * 0.9; out['戌'] = amount * 0.6;
      out['辰'] = amount * 0.6; out['未'] = amount * 0.4;
    }
    return out;
  }

  function addTo(scores, delta, weight = 1) {
    Object.keys(delta || {}).forEach((b) => {
      if (BRANCHES.includes(b)) scores[b] = (scores[b] || 0) + (delta[b] || 0) * weight;
    });
  }

  const Q1Q2_MAP = {
    A: ['寅', '卯', '辰'], B: ['卯', '辰', '巳'],
    C: { 午: 1.0, 巳: 0.7, 未: 0.5 },
    D: ['申', '酉', '戌'], E: ['亥', '子', '丑'], F: ['子', '丑', '寅'],
  };
  const Q3_MAP = {
    A: ['寅', '卯', '辰'], B: ['卯', '辰', '巳'],
    C: { 午: 1.0, 巳: 0.7, 未: 0.5 },
    D: ['申', '酉', '戌'], E: ['亥', '子', '丑'],
  };
  const WUXING_OPTION = { A: '金', B: '木', C: '水', D: '火', E: '土' };
  const Q7_MAP = { A: { 金: 2 }, B: { 金: 1, 火: 1 }, C: { 水: 2 }, D: { 土: 2 }, E: { 木: 1, 水: 1 } };

  function applyQ8(answersObj, scores, weight) {
    const v = answersObj.q8;
    if (!v) return;
    if (v === 'B') {
      const adds = { 寅: 1, 申: 1, 巳: 1, 亥: 1 };
      Object.keys(adds).forEach((b) => { scores[b] = (scores[b] || 0) + adds[b] * weight; });
      recordContribution('Q8', adds);
      return;
    }
    const wx = WUXING_OPTION[v];
    if (wx) {
      const delta = wuxingToBranches(wx, 2);
      addTo(scores, delta, weight);
      const adds = {};
      Object.keys(delta).forEach((b) => { adds[b] = (delta[b] || 0) * weight; });
      recordContribution('Q8', adds);
    }
  }

  const NIGHT_REFINE_MAP = { E: { '亥': 1.0, '子': 0.7, '丑': 0.3 }, F: { '丑': 1.0, '子': 0.7, '寅': 0.3 } };
  function applyNightRefineFromQ1toQ3(answersObj, branchScores) {
    const adds = {};
    BRANCHES.forEach((b) => { adds[b] = 0; });
    ['q1', 'q2', 'q3'].forEach((qKey) => {
      const ans = answersObj[qKey];
      if (!ans) return;
      const selected = Array.isArray(ans) ? ans.slice(0, qKey === 'q3' ? 1 : 2) : [ans];
      selected.forEach((option) => {
        const ref = NIGHT_REFINE_MAP[option];
        if (!ref) return;
        Object.entries(ref).forEach(([branch, w]) => {
          const v = 3 * w;
          branchScores[branch] = (branchScores[branch] || 0) + v;
          adds[branch] = (adds[branch] || 0) + v;
        });
      });
    });
    if (Object.values(adds).some((x) => x > 0)) recordContribution('Q1Q2Q3_night', adds);
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

  function addQ1Q2Q3Score(mapVal, scoreObj, timeSubtotalObj, weight, qLabel) {
    if (!mapVal) return;
    const adds = {};
    BRANCHES.forEach((b) => { adds[b] = 0; });
    if (Array.isArray(mapVal)) {
      mapVal.forEach((b) => {
        scoreObj[b] = (scoreObj[b] || 0) + weight;
        timeSubtotalObj[b] = (timeSubtotalObj[b] || 0) + weight;
        adds[b] = weight;
      });
    } else if (typeof mapVal === 'object') {
      Object.entries(mapVal).forEach(([b, w]) => {
        const v = weight * (Number(w) || 1);
        scoreObj[b] = (scoreObj[b] || 0) + v;
        timeSubtotalObj[b] = (timeSubtotalObj[b] || 0) + v;
        adds[b] = v;
      });
    }
    recordContribution(qLabel, adds);
  }

  const q1Arr = Array.isArray(answers.q1) ? answers.q1.slice(0, 2) : (answers.q1 ? [answers.q1] : []);
  q1Arr.forEach((key) => addQ1Q2Q3Score(Q1Q2_MAP[key], score, timeSubtotal, 3, 'Q1'));
  const q2Arr = Array.isArray(answers.q2) ? answers.q2.slice(0, 2) : (answers.q2 ? [answers.q2] : []);
  q2Arr.forEach((key) => addQ1Q2Q3Score(Q1Q2_MAP[key], score, timeSubtotal, 3, 'Q2'));
  if (answers.q3 && Q3_MAP[answers.q3]) addQ1Q2Q3Score(Q3_MAP[answers.q3], score, timeSubtotal, 3, 'Q3');
  applyNightRefineFromQ1toQ3(answers, score);

  [4, 5, 6].forEach((n) => {
    const wx = WUXING_OPTION[answers['q' + n]];
    if (wx) {
      const delta = wuxingToBranches(wx, 1);
      addTo(score, delta, 2);
      const adds = {};
      Object.keys(delta).forEach((b) => { adds[b] = (delta[b] || 0) * 2; });
      recordContribution('Q' + n, adds);
    }
  });
  if (answers.q7 && Q7_MAP[answers.q7]) {
    const adds = {};
    BRANCHES.forEach((b) => { adds[b] = 0; });
    Object.keys(Q7_MAP[answers.q7]).forEach((wx) => {
      const delta = wuxingToBranches(wx, Q7_MAP[answers.q7][wx]);
      addTo(score, delta, 2);
      Object.keys(delta).forEach((b) => { adds[b] = (adds[b] || 0) + (delta[b] || 0) * 2; });
    });
    recordContribution('Q7', adds);
  }
  applyQ8(answers, score, 2);
  [9, 10, 11, 12, 13, 14].forEach((n) => {
    const qid = 'q' + n;
    const key = answers[qid];
    const map = DUEL_MAP[qid];
    if (!map || !key || !map[key]) return;
    const adds = {};
    BRANCHES.forEach((b) => { adds[b] = 0; });
    Object.keys(map[key]).forEach((b) => {
      const v = map[key][b] * 3;
      score[b] += v;
      duelSubtotal[b] += v;
      adds[b] = v;
    });
    recordContribution('Q' + n, adds);
  });
  [15, 16, 17].forEach((n) => {
    const wx = WUXING_OPTION[answers['q' + n]];
    if (wx) {
      const delta = wuxingToBranches(wx, 1);
      addTo(score, delta, 1);
      const adds = {};
      Object.keys(delta).forEach((b) => { adds[b] = (delta[b] || 0) * 1; });
      recordContribution('Q' + n, adds);
    }
  });
  if (answers.q18 && Q18_MAP[answers.q18]) {
    const adds = {};
    BRANCHES.forEach((b) => { adds[b] = 0; });
    Q18_MAP[answers.q18].forEach((b) => {
      score[b] += 1;
      adds[b] = 1;
    });
    recordContribution('Q18', adds);
  }

  function applyRhythmConsistencyCheck(answersObj, branchScores) {
    const earlyVotes = [];
    const lateVotes = [];
    ['q1', 'q2'].forEach((q) => {
      const ans = answersObj[q];
      if (!ans) return;
      const arr = Array.isArray(ans) ? ans : [ans];
      arr.forEach((opt) => {
        if (['A', 'B'].includes(opt)) earlyVotes.push(opt);
        if (['E', 'F', 'D'].includes(opt)) lateVotes.push(opt);
      });
    });
    if (answersObj.q3) {
      if (['A', 'B', 'C'].includes(answersObj.q3)) earlyVotes.push(answersObj.q3);
      if (['D', 'E'].includes(answersObj.q3)) lateVotes.push(answersObj.q3);
    }
    const earlyCount = earlyVotes.length;
    const lateCount = lateVotes.length;
    if (earlyCount >= 2 && lateCount === 0) {
      branchScores['亥'] = (branchScores['亥'] || 0) - 2;
      branchScores['子'] = (branchScores['子'] || 0) - 1;
    }
    if (lateCount >= 2 && earlyCount === 0) {
      branchScores['卯'] = (branchScores['卯'] || 0) - 1;
      branchScores['辰'] = (branchScores['辰'] || 0) - 1;
    }
  }

  function applyZiDampener(branchScores) {
    const sorted = Object.entries(branchScores).sort((a, b) => (b[1] || 0) - (a[1] || 0));
    const best = sorted[0];
    const second = sorted[1];
    if (best && best[0] === '子' && second && (best[1] || 0) - (second[1] || 0) <= 4) {
      branchScores['子'] = ((branchScores['子'] || 0) * 0.9);
    }
  }

  applyRhythmConsistencyCheck(answers, score);
  applyZiDampener(score);

  const rawBranchScores = {};
  BRANCHES.forEach((b) => { rawBranchScores[b] = score[b]; });

  function getBestBranch(scores, restrictTo) {
    const list = restrictTo || BRANCHES;
    let best = list[0];
    list.forEach((b) => {
      if ((scores[b] || 0) > (scores[best] || 0)) best = b;
    });
    return best;
  }
  function getSecondBestBranch(scores, restrictTo) {
    const list = restrictTo || BRANCHES;
    const sorted = list.slice().sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
    return sorted[1] || sorted[0];
  }
  function getSecondBestScore(scores, restrictTo) {
    const list = restrictTo || BRANCHES;
    const sorted = list.slice().sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
    return scores[sorted[1]] || 0;
  }

  let bestBranch = getBestBranch(score);
  let bestScoreVal = score[bestBranch] || 0;
  const secondBranch = getSecondBestBranch(score);
  const secondScoreVal = score[secondBranch] || 0;

  const q1q2q3HasEorF = () => {
    const a1 = Array.isArray(answers.q1) ? answers.q1 : (answers.q1 ? [answers.q1] : []);
    const a2 = Array.isArray(answers.q2) ? answers.q2 : (answers.q2 ? [answers.q2] : []);
    const a3 = answers.q3 ? [answers.q3] : [];
    return a1.some((o) => o === 'E' || o === 'F') || a2.some((o) => o === 'E' || o === 'F') || a3.some((o) => o === 'E' || o === 'F');
  };

  let nightTypeScore = null;
  if (NIGHT_BRANCHES.includes(bestBranch) && (bestScoreVal - secondScoreVal) <= 5 && q1q2q3HasEorF()) {
    nightTypeScore = { '子': 0, '丑': 0, '亥': 0 };
    ['q1', 'q2', 'q3'].forEach((qKey) => {
      const ans = answers[qKey];
      if (!ans) return;
      const selected = Array.isArray(ans) ? ans : [ans];
      selected.forEach((option) => {
        switch (option) {
          case 'E': nightTypeScore['亥'] += 2; nightTypeScore['子'] += 1; break;
          case 'F': nightTypeScore['丑'] += 2; nightTypeScore['子'] += 1; break;
          case 'A': nightTypeScore['丑'] += 0.5; break;
          default: break;
        }
      });
    });
    switch (answers.q3) {
      case 'D': nightTypeScore['亥'] += 1.5; nightTypeScore['子'] += 1; break;
      case 'E': nightTypeScore['子'] += 2; nightTypeScore['亥'] += 1; break;
      case 'A': nightTypeScore['丑'] += 1.5; break;
      default: break;
    }
    const nightBest = getBestBranch(nightTypeScore, NIGHT_BRANCHES);
    const nightBestScore = nightTypeScore[nightBest] || 0;
    const nightSecondScore = getSecondBestScore(nightTypeScore, NIGHT_BRANCHES);
    if (nightBestScore >= nightSecondScore + 1 && (score[nightBest] || 0) >= bestScoreVal - 3) {
      bestBranch = nightBest;
      bestScoreVal = score[nightBest] || 0;
    }
  }

  const winningScore = score[bestBranch] ?? 0;
  let candidates = BRANCHES.filter((b) => (score[b] || 0) === winningScore);
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
  const branch = candidates[0] || bestBranch || '子';
  const half = answers.q19 === 'B' ? 'lower' : 'upper';

  const sorted = Object.entries(score).sort((a, b) => (b[1] || 0) - (a[1] || 0));
  const finalBest = sorted[0]?.[0] || bestBranch;
  const finalSecond = sorted[1]?.[0] || secondBranch;
  const finalBestScore = sorted[0]?.[1] ?? bestScoreVal;
  const finalSecondScore = sorted[1]?.[1] ?? secondScoreVal;
  const delta = finalBestScore - finalSecondScore;
  const top2Branches = [finalBest, finalSecond].filter(Boolean);

  function computeCircadianConflict(ans) {
    let early = 0, late = 0;
    ['q1', 'q2'].forEach((q) => {
      const a = ans[q];
      if (!a) return;
      (Array.isArray(a) ? a : [a]).forEach((opt) => {
        if (['A', 'B'].includes(opt)) early++;
        if (['E', 'F', 'D'].includes(opt)) late++;
      });
    });
    if (ans.q3) {
      if (['A', 'B', 'C'].includes(ans.q3)) early++;
      if (['D', 'E'].includes(ans.q3)) late++;
    }
    return early >= 2 && late >= 2;
  }
  function computeWuxingScattered(ans) {
    const count = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
    let total = 0;
    [4, 5, 6].forEach((n) => {
      const wx = WUXING_OPTION[ans['q' + n]];
      if (wx) { count[wx] = (count[wx] || 0) + 1; total += 1; }
    });
    if (ans.q7 && Q7_MAP[ans.q7]) {
      Object.keys(Q7_MAP[ans.q7]).forEach((w) => {
        const v = Q7_MAP[ans.q7][w] || 0;
        count[w] = (count[w] || 0) + v;
        total += v;
      });
    }
    if (ans.q8 && ans.q8 !== 'B') {
      const wx = WUXING_OPTION[ans.q8];
      if (wx) { count[wx] = (count[wx] || 0) + 1; total += 1; }
    }
    [15, 16, 17].forEach((n) => {
      const wx = WUXING_OPTION[ans['q' + n]];
      if (wx) { count[wx] = (count[wx] || 0) + 1; total += 1; }
    });
    if (total === 0) return false;
    const maxCount = Math.max(...Object.values(count));
    return (maxCount / total) < 0.34;
  }
  function computeUserStability(recent) {
    if (!recent || recent.length < 3) return { user_stable: false, user_unstable: false };
    const groups = recent.slice(0, 3).map((r) => BRANCH_GROUPS[r.bestBranch]).filter((g) => g !== undefined);
    const unique = new Set(groups);
    return {
      user_stable: unique.size === 1,
      user_unstable: unique.size >= 2,
    };
  }

  const circadian_conflict = computeCircadianConflict(answers);
  const wuxing_scattered = computeWuxingScattered(answers);
  const recentPredictions = options.recentPredictions || [];
  const { user_stable, user_unstable } = computeUserStability(recentPredictions);

  const flags = {
    circadian_conflict,
    wuxing_scattered,
    ...(recentPredictions.length >= 3 ? { user_stable, user_unstable } : {}),
  };

  let confidenceScoreBase = 0;
  if (!circadian_conflict) confidenceScoreBase += 1;
  if (!wuxing_scattered) confidenceScoreBase += 1;
  if (user_stable) confidenceScoreBase += 1;
  if (delta >= 6) confidenceScoreBase += 1;

  const uiHint = confidenceScoreBase < 3 ? '建議重測一次（特徵不穩定）' : null;

  function computeTopContributingQuestions(contribs, bestBr) {
    const byQuestion = {};
    contribs.forEach((c) => {
      const add = (c.adds && c.adds[bestBr]) || 0;
      if (add > 0) byQuestion[c.q] = (byQuestion[c.q] || 0) + add;
    });
    return Object.entries(byQuestion)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([q, v]) => ({ q, contribution: v }));
  }
  const topContributing = computeTopContributingQuestions(contributions, finalBest);

  const finalScore = score[branch] ?? 0;
  const debug = {
    rawBranchScores,
    finalBranchScores: { ...score },
    contributions,
    scores_by_branch: { ...score },
    top2: top2Branches,
    best: finalBest,
    second: finalSecond,
    delta,
    confidence_score: confidenceScoreBase,
    flags,
    topContributingQuestions: topContributing,
    ...(nightTypeScore ? { nightTypeScore } : {}),
  };

  return {
    branch,
    hour_label: branch + '時',
    hour_range: HOUR_RANGES[branch] || '',
    half,
    score: finalScore,
    confidence_score: confidenceScoreBase,
    uiHint,
    top2Branches,
    bestScore: finalBestScore,
    secondScore: finalSecondScore,
    delta,
    debug,
    contributions,
    flags,
  };
}
