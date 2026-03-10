/**
 * 推算時辰邏輯測試（共用模組 shared/shichen-logic.js）
 * 驗證 branch、top2Branches、delta、debug 等輸出
 *
 * 用法：node scripts/shichen-parity-test.js
 */

import { estimateHourFromAnswers } from '../shared/shichen-logic.js';

const TEST_CASES = [
  {
    name: '早型 + 金',
    answers: {
      q1: ['A'],
      q2: ['B'],
      q3: 'A',
      q4: 'A',
      q5: 'A',
      q6: 'A',
      q7: 'A',
      q8: 'A',
      q9: 'A',
      q10: 'A',
      q11: 'A',
      q12: 'A',
      q13: 'A',
      q14: 'A',
      q15: 'A',
      q16: 'A',
      q17: 'A',
      q18: 'A',
      q19: 'A',
    },
  },
  {
    name: '夜型 + 水',
    answers: {
      q1: ['E', 'F'],
      q2: ['E'],
      q3: 'E',
      q4: 'C',
      q5: 'C',
      q6: 'C',
      q7: 'C',
      q8: 'C',
      q9: 'B',
      q10: 'B',
      q11: 'B',
      q12: 'B',
      q13: 'B',
      q14: 'A',
      q15: 'C',
      q16: 'C',
      q17: 'C',
      q18: 'B',
      q19: 'B',
    },
  },
  {
    name: '午 C 選項',
    answers: {
      q1: ['C'],
      q2: ['C'],
      q3: 'C',
      q4: 'D',
      q5: 'D',
      q6: 'D',
      q7: 'D',
      q8: 'D',
      q9: 'A',
      q10: 'A',
      q11: 'A',
      q12: 'A',
      q13: 'A',
      q14: 'A',
      q15: 'D',
      q16: 'D',
      q17: 'D',
      q18: 'C',
      q19: 'A',
    },
  },
  {
    name: '混合型-可能 lowConfidence（寅卯辰均分）',
    answers: {
      q1: ['A', 'B'],
      q2: ['A', 'B'],
      q3: 'A',
      q4: 'B',
      q5: 'B',
      q6: 'B',
      q7: 'B',
      q8: 'B',
      q9: 'B',
      q10: 'B',
      q11: 'A',
      q12: 'A',
      q13: 'A',
      q14: 'A',
      q15: 'B',
      q16: 'B',
      q17: 'B',
      q18: 'C',
      q19: 'A',
    },
  },
  {
    name: '作息污染校正 qx1=B qx2=B',
    answers: {
      q1: ['A'],
      q2: ['B'],
      q3: 'A',
      q4: 'A',
      q5: 'A',
      q6: 'A',
      q7: 'A',
      q8: 'A',
      q9: 'A',
      q10: 'A',
      q11: 'A',
      q12: 'A',
      q13: 'A',
      q14: 'A',
      q15: 'A',
      q16: 'A',
      q17: 'A',
      q18: 'A',
      q19: 'A',
      qx1: 'B',
      qx2: 'B',
    },
  },
  {
    name: '夜型混合 E+F',
    answers: {
      q1: ['E', 'F'],
      q2: ['E'],
      q3: 'D',
      q4: 'C',
      q5: 'C',
      q6: 'C',
      q7: 'C',
      q8: 'C',
      q9: 'B',
      q10: 'B',
      q11: 'B',
      q12: 'B',
      q13: 'B',
      q14: 'B',
      q15: 'C',
      q16: 'C',
      q17: 'C',
      q18: 'B',
      q19: 'B',
    },
  },
];

function runTest() {
  let passed = 0;
  let failed = 0;
  let lowConfidenceCount = 0;
  for (const tc of TEST_CASES) {
    const out = estimateHourFromAnswers(tc.answers, {});

    const hasBranch = out.branch && typeof out.branch === 'string';
    const hasTop2 = Array.isArray(out.top2Branches);
    const hasDelta = typeof out.delta === 'number';

    if (hasBranch && hasTop2 && hasDelta) {
      const lc = out.lowConfidence ? ' [lowConfidence]' : '';
      const cand = out.candidates ? ` candidates=${JSON.stringify(out.candidates)}` : '';
      console.log('✅', tc.name, '| branch:', out.branch, '| top2:', out.top2Branches, '| delta:', out.delta?.toFixed(2), lc, cand);
      if (out.lowConfidence) lowConfidenceCount++;
      passed++;
    } else {
      console.error('❌', tc.name, '| missing branch/top2/delta');
      failed++;
    }
  }
  console.log('\n---');
  console.log('Passed:', passed, '/', passed + failed);
  if (lowConfidenceCount > 0) {
    console.log('lowConfidence triggered:', lowConfidenceCount, 'case(s)');
  }

  // 驗證 debug 擴充欄位存在
  const sample = estimateHourFromAnswers(TEST_CASES[0].answers, {});
  const debugOk =
    sample.debug?.scores != null && typeof sample.debug.scores === 'object' &&
    sample.debug.timeSubtotal != null &&
    (sample.debug.timeWeightMultiplier === 1 || sample.debug.timeWeightMultiplier === 0.35) &&
    sample.debug.duelSubtotal != null &&
    sample.debug.chronotypeScore != null &&
    Array.isArray(sample.debug.anchorBranches) &&
    sample.debug.distancePenalty != null &&
    typeof sample.debug.lowConfidence === 'boolean' &&
    Array.isArray(sample.debug.topCandidates);
  if (!debugOk) {
    console.error('❌ debug 擴充欄位不完整');
    process.exit(1);
  }
  console.log('✅ debug 擴充欄位齊全');

  process.exit(failed > 0 ? 1 : 0);
}

runTest();
