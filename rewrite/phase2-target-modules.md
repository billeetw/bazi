# Phase 2 Target Modules

Second wave of brand rewrite. Deeper product content, dashboard modules.

---

## 1. i18n — ziwei

**Files:** `data/i18n/*.json`

**Keys:**
- `ziwei.boardTitle`, `ziwei.boardSubtitle`
- `ziwei.strategyPanelTitle`, `ziwei.strategyPanelSub`
- `ziwei.palaceStrengthTitle`, `ziwei.palaceStrengthDesc` (12 palaces)
- `ziwei.fivePhaseRatioTitle`, `ziwei.phaseProfileLabel`, `ziwei.bestStrategyLabel`, `ziwei.systemRiskLabel`, `ziwei.thisYearAdviceLabel`
- `ziwei.subjectiveFocusHint`
- `ziwei.palaceDisplay` (12 keys)
- `ziwei.palaceDatabaseTitle`, `ziwei.starDatabaseTitle`
- `ziwei.emptyPalaceNote`, `ziwei.clickPalaceHint`, `ziwei.dataUnavailable`
- `ziwei.minorLimitLabel`, `ziwei.majorLimitLabel`, `ziwei.destinyCore`, `ziwei.lifeMaster`, `ziwei.bodyMaster`
- `ziwei.fourTransformations`, `ziwei.fivePhaseJu`, `ziwei.huaLu`, `ziwei.huaQuan`, `ziwei.huaKe`, `ziwei.huaJi`

**Rationale:** Core Ziwei dashboard. Palace strength, strategy panel, five-phase ratio.

---

## 2. i18n — bazi, flow, strategic

**Files:** `data/i18n/*.json`

**Keys:**
- `bazi.*` — section titles, surface/strategic labels, canggan
- `flow.*` — yearly nav, monthly titles, consult CTA
- `strategic.*` — action/taboo checklists, section titles, ten-god mode, capture placeholder, saved status

**Rationale:** Bazi section, flow navigation, strategic panel. Product depth.

---

## 3. i18n — wuxing, strategy, chartLangMismatch

**Files:** `data/i18n/*.json`

**Keys:**
- `wuxing.title`, `wuxing.section1`–`section5`, `wuxing.sectionTitle`, `wuxing.consultButton`, `wuxing.placeholder`, `wuxing.noReport`
- `wuxing.wood`, `fire`, `earth`, `metal`, `water`, `fallbackStrongWeak`, `strongest`, `weakest`
- `strategy.tacticalTitle`, `tacticalDesc`, `tacticalNote`
- `chartLangMismatch.bannerEn`, `bannerZh`, `recalcEn`, `recalcZh`

**Rationale:** Five-phase report, tactical tips, language mismatch banner.

---

## 4. constants.js — Palace & energy

**File:** `js/calc/constants.js`

**Items:**
- `PALACE_ONE_LINERS` (12 palaces)
- `ENERGY_LABEL` (低頻, 平穩, 強健, 過旺)
- `ELEMENT_CORE_MEANING_SURFACE`, `ELEMENT_CORE_MEANING_STRATEGIC` + EN variants
- `GENERATION_POST_STYLE`, `OVERCOMING_POST_STYLE` + EN variants
- `POYEN_CONVERSION_ONE_*`, `POYEN_RISK_ONE_*`, `POYEN_PUSH_*` + EN variants
- `ELEMENT_TYPE`, `ELEMENT_TYPE_EN`
- `STRATEGIC_ADVICE_BY_STARS`, `STRATEGIC_ADVICE_BY_STARS_EN`

**Rationale:** Hardcoded content. Powers palace strength, five-phase diagnosis, PoYen board.

---

## 5. helpers.js — Five-element & PoYen

**File:** `js/calc/helpers.js`

**Items:**
- `generateFiveElementDiagnosis` — title templates, labels (五行狀態, 能量路徑, 相生亮點, 深度路徑警訊, 制衡提醒, 短板, 缺)
- `getPoYenBoard` — 本局屬性, 最優路徑, 系統風險, 伯彥助推
- `relationBadge` fallback (強弱, 弱強, 強強, 弱弱)
- `tenGodFromStems` — 十神 names (比肩, 劫財, 偏印, 正印, 食神, 傷官, 偏財, 正財, 七殺, 正官)

**Rationale:** Dynamic diagnosis text. Consider moving to i18n or constants.

---

## 6. wuxingFlowPipeline.js — Flow report

**File:** `js/calc/wuxingFlowPipeline.js`

**Items:**
- `GEN_DISPLAY`, `BOTTLENECK_DISPLAY`, `CONTROL_DISPLAY` + EN variants
- Report section labels (一、氣勢 … 五、下一步我們能為你做什麼？)
- `momentumText`, `genPositiveText`, `bottleneckText`, `controlText`, `predictionText`

**Rationale:** Full five-phase flow report. Long-form content.

---

## 7. config.js, ziweiOutput.js — Status & level notes

**Files:** `js/config.js`, `js/calc/ziweiOutput.js`

**Items:**
- `config.js` — `getStatusLabels` fallback (極佳, 強勁, 平穩, 穩健, 基礎)
- `ziweiOutput.js` — level notes fallback, `generateMonthStrategyTag` (天干/地支戰略屬性)

**Rationale:** Status labels, palace strength level notes. Fallbacks when i18n unavailable.

---

## 8. estimateHour & ceremony (i18n)

**Files:** `data/i18n/*.json`

**Keys:**
- `estimateHour.modalTitle`, `modalSubtitle`, `progressTemplate`, `prevBtn`, `nextBtn`, `submitBtn`, `closeBtn`, `uiHintLowConfidence`
- `estimateHour.q1`–`q19` (text + options)
- `ceremony.resultTemplate`, `systemLabel`, `feedbackQuestion`, `feedbackCorrect`, `feedbackIncorrect`, `feedbackActualHint`, `feedbackSubmit`, `confirmBtn`
- `ceremony.子`–`亥` (12 shichen descriptions)

**Rationale:** Estimate-hour quiz, ceremony result. Long-form questionnaire content.

---

## 9. my-charts-service.js, birth-time-identifier.js

**Files:** `js/ui/services/my-charts-service.js`, `js/ui/components/birth-time-identifier.js`

**Strings:**
- my-charts: 未命名, 點我載入, 刪除, 確定要刪除…, 儲存失敗…, 刪除失敗…
- birth-time-identifier: 請先登入以使用推算時辰功能。

**Rationale:** Chart management, estimate-hour gate.

---

## 10. data-renderer.js, ui.js, wuxing-panel.js

**Files:** `js/ui/services/data-renderer.js`, `js/ui.js`, `js/ui/components/wuxing-panel.js`

**Strings:**
- 紫微暫不可用, 後端 iztro 可能出錯…
- 系統載入失敗…, 流月组件未加载…
- （五行解釋暫不可用）
- （資料庫尚未填入「…」的十神指令…）

**Rationale:** Error states, fallbacks. Lower frequency but still user-facing.

---

## Summary

| Module | Scope | Priority |
|--------|-------|----------|
| i18n ziwei | Ziwei dashboard | P0 |
| i18n bazi/flow/strategic | Bazi, flow, strategic panel | P0 |
| i18n wuxing/strategy/chartLangMismatch | Five-phase, tactics, lang banner | P1 |
| constants.js | Palace, energy, PoYen, strategic advice | P0 |
| helpers.js | Diagnosis, PoYen, ten-god | P1 |
| wuxingFlowPipeline.js | Flow report full text | P1 |
| config.js, ziweiOutput.js | Status labels, level notes | P2 |
| estimateHour & ceremony | Quiz, ceremony | P1 |
| my-charts, birth-time-identifier | Chart mgmt, login gate | P2 |
| data-renderer, ui, wuxing-panel | Errors, fallbacks | P2 |
