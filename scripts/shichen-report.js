#!/usr/bin/env node
/**
 * 時辰推算 vNext 統計報表
 * 讀取 estimate_hour_logs 匯出的 JSON（或貼上 log 陣列），輸出：
 *   - accuracy_top1: 正確率（feedback_correct=1）
 *   - accuracy_top2: top2 命中率（含 is_partial_correct）
 *   - avg_delta_correct / avg_delta_wrong
 *   - 低置信度比例 (confidence_score_base < 3)
 *
 * 用法：
 *   node scripts/shichen-report.js < logs.json
 *   node scripts/shichen-report.js path/to/logs.json
 *   echo '[{...}]' | node scripts/shichen-report.js
 */

import { readFileSync } from 'fs';

function loadLogs(input) {
  let raw;
  if (input) {
    raw = readFileSync(input, 'utf8');
  } else {
    raw = readFileSync(0, 'utf8');
  }
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : (data.logs || []);
}

function runReport(logs) {
  const withFeedback = logs.filter((l) => l.feedback_correct !== undefined && l.feedback_correct !== null);
  const correctTop1 = withFeedback.filter((l) => l.feedback_correct === 1 || l.feedback_correct === true);
  const incorrect = withFeedback.filter((l) => l.feedback_correct === 0 || l.feedback_correct === false);
  const partialCorrect = incorrect.filter((l) => l.is_partial_correct === 1 || l.is_partial_correct === true);

  const getTop2 = (l) => {
    if (l.top2_branches) {
      try {
        return typeof l.top2_branches === 'string' ? JSON.parse(l.top2_branches) : l.top2_branches;
      } catch {
        return l.estimated_branch ? [l.estimated_branch] : [];
      }
    }
    return l.estimated_branch ? [l.estimated_branch] : [];
  };

  const top2Correct = withFeedback.filter((l) => {
    if (l.feedback_correct === 1) return true;
    if (l.is_partial_correct === 1 || l.is_partial_correct === true) return true;
    const actual = l.feedback_actual_branch;
    if (!actual) return false;
    const top2 = getTop2(l);
    return top2 && top2.includes(actual);
  });

  const n = withFeedback.length;
  const accuracy_top1 = n > 0 ? (correctTop1.length / n * 100).toFixed(2) + '%' : 'N/A';
  const accuracy_top2 = n > 0 ? (top2Correct.length / n * 100).toFixed(2) + '%' : 'N/A';

  const deltasCorrect = correctTop1.map((l) => l.delta).filter((d) => d != null && !Number.isNaN(Number(d)));
  const deltasWrong = incorrect.map((l) => l.delta).filter((d) => d != null && !Number.isNaN(Number(d)));
  const avg_delta_correct =
    deltasCorrect.length > 0
      ? (deltasCorrect.reduce((a, b) => a + Number(b), 0) / deltasCorrect.length).toFixed(2)
      : 'N/A';
  const avg_delta_wrong =
    deltasWrong.length > 0
      ? (deltasWrong.reduce((a, b) => a + Number(b), 0) / deltasWrong.length).toFixed(2)
      : 'N/A';

  const allWithConf = logs.filter((l) => l.confidence_score != null);
  const lowConf = allWithConf.filter((l) => Number(l.confidence_score) < 3);
  const lowConfPct =
    allWithConf.length > 0
      ? (lowConf.length / allWithConf.length * 100).toFixed(2) + '%'
      : 'N/A';

  return {
    total: logs.length,
    with_feedback: n,
    accuracy_top1,
    accuracy_top2,
    avg_delta_correct,
    avg_delta_wrong,
    low_confidence_ratio: lowConfPct,
    low_confidence_count: lowConf.length,
    top2_hit_when_wrong: partialCorrect.length,
  };
}

function main() {
  const input = process.argv[2] || null;
  let logs;
  try {
    logs = loadLogs(input);
  } catch (e) {
    console.error('Error loading logs:', e.message);
    process.exit(1);
  }
  const report = runReport(logs);
  console.log(JSON.stringify(report, null, 2));
}

main();
