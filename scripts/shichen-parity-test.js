/**
 * 前後端 fallback 計分一致性測試
 * 同一 answers 輸入，比對 js/calc/shichen-logic 與 functions/utils/shichen-logic 輸出
 * 應得到相同的 branch、top2Branches、delta
 *
 * 用法：node scripts/shichen-parity-test.js
 */

import { estimateHourFromAnswers as estimateFrontend } from '../js/calc/shichen-logic.js';
import { estimateHourFromAnswers as estimateBackend } from '../functions/utils/shichen-logic.js';

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
];

function runTest() {
  let passed = 0;
  let failed = 0;
  for (const tc of TEST_CASES) {
    const fe = estimateFrontend(tc.answers, {});
    const be = estimateBackend(tc.answers, {});

    const branchOk = fe.branch === be.branch;
    const top2Ok =
      JSON.stringify(fe.top2Branches || []) === JSON.stringify(be.top2Branches || []);
    const deltaOk = Math.abs((fe.delta || 0) - (be.delta || 0)) < 0.001;

    if (branchOk && top2Ok && deltaOk) {
      console.log('✅', tc.name, '| branch:', fe.branch, '| top2:', fe.top2Branches, '| delta:', fe.delta?.toFixed(2));
      passed++;
    } else {
      console.error('❌', tc.name);
      if (!branchOk) console.error('   branch:', fe.branch, '!=', be.branch);
      if (!top2Ok) console.error('   top2:', fe.top2Branches, '!=', be.top2Branches);
      if (!deltaOk) console.error('   delta:', fe.delta, '!=', be.delta);
      failed++;
    }
  }
  console.log('\n---');
  console.log('Passed:', passed, '/', passed + failed);
  process.exit(failed > 0 ? 1 : 0);
}

runTest();
