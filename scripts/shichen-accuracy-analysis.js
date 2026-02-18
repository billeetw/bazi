#!/usr/bin/env node
/**
 * 時辰推算離線分析腳本
 * 讀取 CSV（含 answers + trueBranch），計算 accuracy、lowConfidence 子集 accuracy、混淆矩陣
 *
 * 用法：node scripts/shichen-accuracy-analysis.js <path-to-data.csv>
 *
 * CSV 格式（表頭）：
 *   answers_json,true_branch
 * 或
 *   true_branch,answers_json
 *
 * answers_json 為 JSON 字串，例如 {"q1":["A"],"q2":["B"],"q3":"A",...}
 * true_branch 為真實時辰，如 "子"、"丑"、"寅"...
 */

import { readFileSync } from 'fs';
import { estimateHourFromAnswers } from '../functions/utils/shichen-logic.js';

function parseCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return { rows: [], headers: [] };
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, j) => {
      let v = values[j] !== undefined ? values[j] : '';
      if (typeof v === 'string' && v.includes('""')) {
        v = v.replace(/""/g, '"');
      }
      obj[h] = String(v).trim();
    });
    rows.push(obj);
  }
  return { headers, rows };
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else if (c !== '"' || inQuotes) {
      current += c;
    }
  }
  result.push(current);
  return result;
}

function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('用法：node scripts/shichen-accuracy-analysis.js <path-to-data.csv>');
    console.error('CSV 需有 answers_json 與 true_branch 欄位');
    process.exit(1);
  }

  let content;
  try {
    content = readFileSync(csvPath, 'utf-8');
  } catch (e) {
    console.error('無法讀取檔案:', csvPath, e.message);
    process.exit(1);
  }

  const { headers, rows } = parseCsv(content);
  const answersKey = headers.find((h) => h.toLowerCase().includes('answers'));
  const trueBranchKey = headers.find((h) => h.toLowerCase().includes('true') && h.toLowerCase().includes('branch'))
    || headers.find((h) => h === 'true_branch')
    || headers.find((h) => h === 'trueBranch');
  if (!answersKey || !trueBranchKey) {
    console.error('CSV 需包含 answers_json（或含 answers 的欄位）與 true_branch（或 trueBranch）');
    console.error('目前表頭:', headers.join(', '));
    process.exit(1);
  }

  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const results = [];
  let correct = 0;
  let total = 0;
  let lowConfTotal = 0;
  let lowConfCorrect = 0;
  const confusion = {};
  BRANCHES.forEach((a) => {
    confusion[a] = {};
    BRANCHES.forEach((b) => { confusion[a][b] = 0; });
  });

  for (const row of rows) {
    const trueBranch = String(row[trueBranchKey] || '').trim();
    if (!BRANCHES.includes(trueBranch)) continue;

    let answers;
    try {
      answers = JSON.parse(row[answersKey] || '{}');
    } catch (_) {
      continue;
    }
    if (!answers || typeof answers !== 'object') continue;

    const out = estimateHourFromAnswers(answers, {});
    const pred = out.branch || '子';
    const isCorrect = pred === trueBranch;
    if (isCorrect) correct++;
    total++;

    confusion[trueBranch][pred] = (confusion[trueBranch][pred] || 0) + 1;

    if (out.debug?.lowConfidence) {
      lowConfTotal++;
      if (isCorrect) lowConfCorrect++;
    }

    results.push({ trueBranch, pred, isCorrect, lowConfidence: out.debug?.lowConfidence });
  }

  const accuracy = total > 0 ? (correct / total * 100).toFixed(2) : '0';
  const lowConfAccuracy = lowConfTotal > 0 ? (lowConfCorrect / lowConfTotal * 100).toFixed(2) : 'N/A';

  console.log('=== 時辰推算準確率分析 ===');
  console.log('資料筆數:', total);
  console.log('整體準確率:', accuracy + '%', '(' + correct + '/' + total + ')');
  console.log('lowConfidence 子集筆數:', lowConfTotal);
  console.log('lowConfidence 子集準確率:', lowConfAccuracy, lowConfTotal > 0 ? '(' + lowConfCorrect + '/' + lowConfTotal + ')' : '');
  console.log('');

  console.log('=== 混淆矩陣（列=真實，行=預測）===');
  const headerRow = '      ' + BRANCHES.map((b) => b.padStart(4)).join('');
  console.log(headerRow);
  for (const trueB of BRANCHES) {
    const counts = BRANCHES.map((b) => String(confusion[trueB][b] || 0).padStart(4));
    console.log(trueB + '  |' + counts.join(''));
  }
  console.log('');

  console.log('=== 常見誤判（預測≠真實，按次數排序）===');
  const mispairs = [];
  for (const trueB of BRANCHES) {
    for (const predB of BRANCHES) {
      if (trueB === predB) continue;
      const n = confusion[trueB][predB] || 0;
      if (n > 0) mispairs.push({ true: trueB, pred: predB, count: n });
    }
  }
  mispairs.sort((a, b) => b.count - a.count);
  mispairs.slice(0, 15).forEach((p) => {
    console.log('  真實 ' + p.true + ' → 預測 ' + p.pred + ': ' + p.count + ' 次');
  });
}

main();
