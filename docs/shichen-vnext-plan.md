# 時辰推算問卷 vNext：置信度與資料過濾 — 實作計畫

## 檔案修改清單

| 檔案 | 變更摘要 |
|------|----------|
| `migrations/0010_estimate_hour_logs_vnext.sql` | 新增 confidence_score, best_score, second_score, delta, top2_branches, flags_json, contributions_json, is_partial_correct, weight_adjustment_suggestion |
| `functions/utils/shichen-logic.js` | 貢獻度追蹤、best/second/delta/top2、circadian_conflict、wuxing_scattered、user_stable、confidence_score、uiHint、contributions debug |
| `functions/api/me/estimate-hour.js` | 取 getRecentPredictions、傳入 estimateHourFromAnswers、寫入新欄位、回傳 uiHint |
| `functions/api/me/estimate-hour/logs/[id].js` | 讀取 log 取得 top2、計算 is_partial_correct、條件產生 weight_adjustment_suggestion、寫入 DB |
| `js/identifyBirthTime.js` | estimateHourLocal 同步 vNext 邏輯 |
| `js/ui/components/birth-time-identifier.js` | 若有 uiHint 則顯示（可選，前端只加字串） |
| `scripts/shichen-report.js` | Node 腳本讀 log 輸出統計 |

## 新增函式（shichen-logic.js）

- `recordContribution(q, adds)` - 記錄每題對各時辰加分
- `computeCircadianConflict(answers)` - early>=2 && late>=2
- `computeWuxingScattered(answers)` - max/total < 0.34
- `computeUserStability(recentPredictions)` - 3 次同組 => stable, 分散 2+ 組 => unstable
- `computeConfidenceScore(flags, delta, userStable)` - 0~4 分
- `computeTopContributingQuestions(contributions, bestBranch)` - Top3 貢獻題

## 介面 getRecentPredictions

```js
// options.recentPredictions = [{ bestBranch }]
// 由 estimate-hour.js 從 DB 查詢最近 3 筆 estimated_branch，傳入
```

## 本機測試

```bash
# 前後端計分一致性
node scripts/shichen-parity-test.js

# 主程式 build
npm run build:main

# 統計報表（需匯出 logs JSON）
node scripts/shichen-report.js < path/to/logs.json
# 或
echo '[{"feedback_correct":1,"delta":5,...}]' | node scripts/shichen-report.js
```

## 部署到 Cloudflare

1. **套用 migration**
   ```bash
   npx wrangler d1 migrations apply consult-db --remote
   ```

2. **部署 Pages + Functions**
   ```bash
   npm run build:main
   # 或使用專案既有的 deploy.sh
   ```
