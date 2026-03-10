# 模組二完整組裝指令（核對用）

本文描述命書「模組二」章節（s15、s15a、s16、s17、s18、s19、s20、s21）從輸入到最終輸出的完整組裝流程，供核對流年宮位、流年四化、小限宮位、小限四化是否分開且正確。

---

## 一、入口與輸入

| 項目 | 來源 | 說明 |
|------|------|------|
| **chartJson** | 前端 / API 請求 | 含 `yearlyHoroscope`、`liunian`、`decadalLimits`、`overlapAnalysis`、`fourTransformations`、`ziwei` 等 |
| **content** | P2_CONTENT（lifebook content lookup） | 含 ccl3 表、decisionMatrix 等 |
| **sectionKey** | 路由 / 請求 | 為 `s15` | `s15a` | `s16` | `s17` | `s18` | `s19` | `s20` | `s21` |

---

## 二、組裝流程（依序）

### Step 1：normalizeChart(chartJson) → NormalizedChart

**檔案**：`worker/src/lifebook/normalize/normalizeChart.ts`

- 解析順序：**生年四化 → 大限四化 → 流年四化 → 小限宮位**。
- **禁止**：`yearlyTransforms = decadalTransforms`（流年四化不可用大限四化當 fallback）。
- 產出：
  - `natal.birthTransforms`、`natalTransforms`：本命（生年）四化邊。
  - `currentDecade`：當前大限（含 `palace`、`transforms`）；`transforms` 僅來自 overlap 的 **decade** 層。
  - `yearlyHoroscope`：流年；`destinyPalace` 來自 `chartJson.liunian.palace`（流年命宮）；`transforms` 僅來自 overlap 的 **year** 層。
  - `xiaoXian`：小限；`palace` 僅由 **nominalAge + 固定順序** 算出（`resolveXiaoXianPalaceByAge`），順序：命→兄弟→夫妻→子女→財帛→疾厄→遷移→僕役→官祿→田宅→福德→父母。

### Step 2：validateTimelineConsistency(chart)

**檔案**：`worker/src/lifebook/validators/validateTimelineConsistency.ts`

- 檢查：E_NATAL_TRANSFORMS_MISSING、E_DECADE_LIMIT_RESOLUTION_FAILED、**E_YEAR_TRANSFORMS_FALLBACK_TO_DECADE**、E_XIAOXIAN_PALACE_SEQUENCE_MISMATCH、E_FLOW_YEAR_DESTINY_PALACE_MISSING。
- 若有 **error**：log，且後續 inject 時會把「流年四化／小限四化」改為「（時間軸驗證未通過，暫不顯示…）」。

### Step 3：buildLifebookFindings(input) → LifebookFindings

**檔案**：`worker/src/lifebook/findings/buildLifebookFindings.ts`

- 使用 `normalizedChart` 跑四引擎，產出 findings（宮位、時間、行動、收束等）。

### Step 4：timeContext（給 assembler 與顯示用）

**檔案**：`worker/src/lifebook/findings/buildLifebookFindings.ts`（buildLifebookFindingsFromChartAndContent 回傳）

- `currentDecadePalace` = `chart.currentDecade?.palace`
- `xiaoXianPalace` = `chart.xiaoXian?.palace ?? chart.xiaoXian?.activeLimitPalaceName`（**僅小限宮位**，不可用流年或大限覆寫）
- `shenGong`、`year`、`nominalAge`

### Step 5：injectTimeModuleDataIntoSection(...)

**檔案**：`worker/src/lifeBookPrompts.ts`

當 **options.findings** 存在（P2 路徑）時：

1. **map 來自 findings**
   - `assembleTimeModuleFromFindings(findings, options.timeContext)` →
     - 合併 `assembleS15`、`assembleS18`、`assembleS20` 的輸出；
     - 填 s19、s21、yearOneLineAdvice；
     - **今年心理濾鏡**（xiaoXianPalaceName）僅來自 `timeContext.xiaoXianPalace`（即 normalizedChart.xiaoXian.palace）。

2. **流年宮位／流年四化／小限四化（與大限分開）**
   - `buildTimeModuleDisplayFromChartJson(chartJson)` 產出並 **Object.assign(map, ...)**：
     - **flowYearMingPalace**：優先 `chartJson.liunian.palace`（流年命宮宮名），否則 `year + liunian.branch`，否則「（無流年命宮資料）」。
     - **flowYearSihuaLine**：**僅**來自 `chartJson.liunian.mutagenStars` 或 `fourTransformations.liunian.mutagenStars`；缺時由 overlap 中 **transformations.liunian** 組「流年X化Y」。
     - **xiaoXianSihuaLine**：**僅**來自 `chartJson.yearlyHoroscope.mutagenStars` 或 `fourTransformations.xiaoxian.mutagenStars`；缺時由 overlap 中 **transformations.xiaoxian** 組「小限X化Y」。

3. **時間軸驗證有 error 時**
   - 強制 `map.flowYearSihuaLine`、`map.xiaoXianSihuaLine` 為「（時間軸驗證未通過，暫不顯示…）」。

當 **無 options.findings**（非 P2）時：  
- `map = getPlaceholderMapFromContext(null, { chartJson, sectionKey, content, config, contentLocale })`，其中同樣由 chartJson 依 **流年／小限分開** 組出 flowYearMingPalace、flowYearSihuaLine、xiaoXianSihuaLine。

### Step 6：resolveSkeletonPlaceholders(structureAnalysis, map)

- 將模板中的 `{flowYearMingPalace}`、`{flowYearSihuaLine}`、`{xiaoXianPalaceName}`、`{xiaoXianSihuaLine}` 等替換為 map 內對應字串。

---

## 三、模組二各章 placeholder 來源總表（核對用）

| Placeholder | 來源（P2 路徑） | 說明 |
|-------------|------------------|------|
| **flowYearMingPalace** | buildTimeModuleDisplayFromChartJson(chartJson) | 流年命宮：liunian.palace 或 year+liunian.branch |
| **flowYearSihuaLine** | 同上 | **僅流年**四化（liunian / overlap.liunian），與大限、小限分開 |
| **xiaoXianPalaceName** | timeContext.xiaoXianPalace → assembleS15/S20 | 小限宮位（normalizedChart.xiaoXian.palace，由 nominalAge+順序算出） |
| **xiaoXianSihuaLine** | buildTimeModuleDisplayFromChartJson(chartJson) | **僅小限**四化（xiaoxian / overlap.xiaoxian），與大限、流年分開 |
| yearRoleInDecade, yearOneLineAdvice | assembleTimeModuleFromFindings（findings + timeContext） | 年度角色、一句建議 |
| s15* / s18* / s20* | 各 assembler（selectors + findings + minimal chart） | 見 assembleS15 / assembleS18 / assembleS20 |

---

## 四、四化分層約定（不可混用）

| 層 | 資料來源 | 顯示用 key | 禁止 |
|----|----------|------------|------|
| 本命 | overlap 層 `natal` / 生年天干 | （s00 等） | 不可用大限／流年／小限填 |
| 大限 | overlap 層 `decade`、currentDecade.transforms | 大限相關敘事 | 不可當流年 fallback |
| **流年** | overlap 層 `year`、liunian.mutagenStars、overlap.liunian | **flowYearSihuaLine** | 不可用大限或小限填 |
| **小限** | overlap 層 `minor`、xiaoxian.mutagenStars、overlap.xiaoxian | **xiaoXianSihuaLine** | 不可用大限或流年填 |

---

## 五、s16 模板結構（lifebookSection-zh-TW.json）

```
流年命宮：{flowYearMingPalace}
流年四化：{flowYearSihuaLine}
小限宮位：{xiaoXianPalaceName}
小限四化：{xiaoXianSihuaLine}
年度角色：{yearRoleInDecade}
建議：{yearOneLineAdvice}
```

核對時請確認：  
1. **flowYearMingPalace** 有值（流年宮位／命宮）。  
2. **flowYearSihuaLine** 僅為當年流年四化，不含大限／小限。  
3. **xiaoXianSihuaLine** 僅為小限四化，不含大限／流年。

---

## 六、相關檔案一覽

| 步驟 | 檔案 |
|------|------|
| 正規化 | `worker/src/lifebook/normalize/normalizeChart.ts`、`resolveCurrentTimeContext.ts` |
| 時間驗證 | `worker/src/lifebook/validators/validateTimelineConsistency.ts` |
| Findings | `worker/src/lifebook/findings/buildLifebookFindings.ts` |
| 時間 context | 同上（timeContext 回傳） |
| 組裝 | `worker/src/lifebook/findings/assembleTimeModuleFromFindings.ts`、`assemblers/assembleS15.ts`、`assembleS18.ts`、`assembleS20.ts` |
| 流年／小限顯示 | `worker/src/lifeBookPrompts.ts`：`buildTimeModuleDisplayFromChartJson`、`injectTimeModuleDataIntoSection` |
| 模板 | `worker/content/lifebookSection-zh-TW.json`（s15、s16、s18、s20 等） |
