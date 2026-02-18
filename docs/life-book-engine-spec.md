# 命書生成引擎規格

## 流程

```
後台輸入出生年月日時
    ↓
取得命盤 JSON (compute/all + 本地進階計算)
    ↓
點擊「生成命書」
    ↓
weight_analysis() → weight_analysis.json
    ↓
逐章生成 s01~s20（每次 800–1200 字，依 importance 調整）
    ↓
接 API 取得每章 JSON
    ↓
validate JSON → 失敗則 retry 一次
    ↓
renderHTML() → 完整 HTML
    ↓
顯示 / 匯出 PDF
```

## 權重分析公式

```
宮位分數 =
  (化忌數 × 3) +
  (化祿數 × 2) +
  (化權數 × 1.5) +
  (化科數 × 1) +
  (疊宮係數 × 2) +
  (五行失衡係數 × 2)
```

排序後：
- 前 3 名 → `importance = "high"`
- 中間 → `"medium"`
- 最低 3 名 → `"low"`

## 章節順序（嚴格）

| section_key | 標題 |
|-------------|------|
| s01 | [1/20] 命主、身主、身宮、福德：顯意識與潛意識… |
| s02 | [2/20] 命宮三方四正：性格基調、格局高度… |
| s03 | [3/20] 五行氣勢、能量、生剋＋生年四化… |
| s04 | [4/20] 父母宮三方四正… |
| s05 | [5/20] 兄弟宮三方四正… |
| s06 | [6/20] 交友宮三方四正… |
| s07 | [7/20] 官祿宮三方四正… |
| s08 | [8/20] 財帛宮三方四正… |
| s09 | [9/20] 田宅宮三方四正… |
| s10 | [10/20] 福德宮三方四正… |
| s11 | [11/20] 疾厄宮三方四正… |
| s12 | [12/20] 遷移宮三方四正… |
| s13 | [13/20] 夫妻宮三方四正… |
| s14 | [14/20] 子女宮三方四正… |
| s15 | [15/20] 十年大限分析 |
| s16 | [16/20] 2026 流年：小限疊宮飛星… |
| s17 | [17/20] 靈魂使命：此生為何而來… |
| s18 | [18/20] 人生主線任務：把使命落到行動 |
| s19 | [19/20] 業力與未完成課題：化忌與業力宮位… |
| s20 | [20/20] 總和分析：全盤優化建議與避凶指引 |

## 章節 JSON 結構（嚴格）

```json
{
  "section_key": "s01",
  "title": "",
  "importance_level": "high | medium | low",
  "structure_analysis": "",
  "behavior_pattern": "",
  "blind_spots": "",
  "strategic_advice": ""
}
```

## 篇幅控制

| importance_level | 字數 |
|------------------|------|
| high | 1200–1600 |
| medium | 800–1200 |
| low | 500–800 |

## 禁止事項

- ❌ 不得一次生成 20 章
- ❌ 不得讓 AI 自行排整本 HTML
- ❌ 不得跳過權重分析
- ❌ 不得混合章節順序

## Prompt 整合

**System 角色**：`window.LifeBookEngine.SYSTEM_PROMPT`（固定不變，語氣／結構／輸出格式）

**單章生成 User Prompt**：`buildSectionUserPrompt(sectionKey, chartJson, weightAnalysis)`  
→ 替換 SECTION_KEY、IMPORTANCE_LEVEL、SECTION_DESCRIPTION、CHART_JSON、WEIGHT_ANALYSIS_JSON

**權重分析 User Prompt（可選）**：`buildWeightAnalysisUserPrompt(chartJson)`  
→ 若用 AI 計算權重（取代本地 `weightAnalysis()`）時使用

**章節主題**：`SECTION_DESCRIPTIONS` 對照 s01–s20 每章主題說明

## API 使用方式

```javascript
// 1. 權重分析（必須先執行，本地或 AI）
const weight = window.LifeBookEngine.weightAnalysis(chartJson);
// 或：用 buildWeightAnalysisUserPrompt(chartJson) 送 AI 取得 weight

// 2. 建單章 User Prompt（傳給 AI API）
const userPrompt = window.LifeBookEngine.buildSectionUserPrompt("s01", chartJson, weight);
// system: LifeBookEngine.SYSTEM_PROMPT

// 3. 解析 AI 回傳
const section = window.LifeBookEngine.parseSectionOutput(aiResponse, "s01");

// 4. 組裝 HTML
const html = window.LifeBookEngine.renderHTML(weight, sections, chartJson);
```

## 模組分組

- **模組一**：s01, s02, s03, s10, s19
- **模組二**：s07, s08, s09, s05, s15
- **模組三**：s04, s06, s12, s17
- **模組四**：s13, s14, s11
- **模組五**：s16, s18, s20
