# AI Prompt 生成器完成報告

## ✅ 功能概述

已成功實現 **Phase 4: AI Prompt 模板設計**，整合所有計算結果（四化系統、疊宮分析、好命指數、五行健康預警等）生成高品質的 AI Prompt，供後台管理界面使用。

## 📁 新增文件

### `js/calc/aiPromptGenerator.js`
AI Prompt 生成模組，提供以下核心功能：

1. **`generateStrategicTags(structuredData)`**
   - 基於好命指數、最強宮位、五行狀態、疊宮分析、健康預警、四化系統生成戰略標籤
   - 返回格式：`["#極佳命盤", "#命宮優勢", "#木氣主導", ...]`

2. **`generateCoreDataSummary(structuredData)`**
   - 生成核心數據摘要（好命指數、最強宮位、五行狀態、疊宮摘要、健康預警摘要）

3. **`generateFourTransformationsDetail(structuredData)`**
   - 生成四化系統詳細說明（本命、大限、流年、小限）

4. **`generateOverlapAnalysisDetail(structuredData)`**
   - 生成疊宮分析詳細說明（超級地雷區、大發財機會、疊宮評論）

5. **`generateHealthWarningDetail(structuredData)`**
   - 生成健康預警詳細說明（嚴重風險、一般警告、健康建議）

6. **`generateAIPrompt(structuredData, options)`**
   - 生成完整的 AI Prompt（#深度貼文風格）
   - 選項：
     - `targetLength`: 目標字數（預設1500字）
     - `includeDetails`: 是否包含詳細數據（預設true）

7. **`collectStructuredData(options)`**
   - 從全局狀態收集所有結構化數據
   - 自動整合：好命指數、宮位分數、四化系統、疊宮分析、五行數據、健康預警、流月數據

## 🔗 整合點

### `js/calc.js`
在 `computeAllPalaceScores` 函數的最後，自動生成 AI Prompt：

```javascript
// 生成 AI Prompt（供後台管理界面使用）
if (window.AIPromptGenerator) {
  const structuredData = window.AIPromptGenerator.collectStructuredData({
    currentYear: currentYear,
    age: age
  });
  
  // 補充四化系統數據
  if (fourTransformations) {
    structuredData.fourTransformations = fourTransformations;
    window.fourTransformations = fourTransformations;
  }
  
  const aiPrompt = window.AIPromptGenerator.generateAIPrompt(structuredData, {
    targetLength: 1500,
    includeDetails: true
  });
  
  // 存儲到全局狀態
  window.aiPrompt = aiPrompt;
  window.structuredData = structuredData;
}
```

### `js/calc/adminExport.js`
在 `exportCalculationResults` 函數中，自動包含 AI Prompt 和結構化數據：

```javascript
// AI Prompt（如果存在）
if (window.aiPrompt) {
  results.aiPrompt = window.aiPrompt;
}

// 結構化數據（如果存在）
if (window.structuredData) {
  results.structuredData = window.structuredData;
}
```

### `functions/api/admin/calculation-results.js`
更新 API 端點的數據結構說明，包含 `aiPrompt` 和 `structuredData` 欄位。

## 📊 Prompt 結構

生成的 AI Prompt 包含以下部分：

1. **標題與風格說明**
   - 目標字數：1500字
   - 風格：#深度貼文風格（語氣冷靜、中性、具備系統思維與商務決策直覺）

2. **命主特徵標籤**
   - 基於所有計算結果自動生成的標籤陣列

3. **核心數據**
   - 好命指數
   - 最強宮位
   - 五行狀態
   - 疊宮分析摘要
   - 健康預警摘要

4. **詳細數據**（如果 `includeDetails: true`）
   - 四化系統詳細說明
   - 疊宮分析詳細說明
   - 健康預警詳細說明

5. **深度分析要求**
   - 命主核心特質與優勢領域
   - 十年大限導航建議
   - 流年關鍵風險與機會
   - 健康管理建議
   - 戰略行動建議

6. **寫作要求**
   - 語氣、風格、結構、內容、字數要求

## 🎯 使用範例

### 在後台管理界面中使用

```javascript
// 方法1：直接從全局狀態獲取（計算完成後自動生成）
const aiPrompt = window.aiPrompt;
const structuredData = window.structuredData;

// 方法2：手動生成（如果需要自訂選項）
if (window.AIPromptGenerator) {
  const structuredData = window.AIPromptGenerator.collectStructuredData({
    currentYear: 2026,
    age: 30
  });
  
  const aiPrompt = window.AIPromptGenerator.generateAIPrompt(structuredData, {
    targetLength: 2000,  // 自訂字數
    includeDetails: true
  });
}

// 方法3：通過後端 API 獲取
// POST /api/admin/calculation-results
// 返回的 JSON 中包含 aiPrompt 和 structuredData
```

### 戰略標籤生成範例

```javascript
const tags = window.AIPromptGenerator.generateStrategicTags(structuredData);
// 輸出範例：
// ["#極佳命盤", "#命宮優勢", "#財帛宮優勢", "#木氣主導", "#金氣需補強", 
//  "#財帛宮大機會", "#健康需注意", "#本命武曲化祿", "#大限在財帛", "#流年在事業"]
```

## 📝 數據結構

### `structuredData` 結構

```javascript
{
  currentYear: 2026,
  age: 30,
  
  // 好命指數
  luckIndex: {
    luckIndex: 85,
    brightnessScore: 82,
    auspiciousRatio: 0.75,
    mainStarCombo: 90,
    description: "優秀命盤"
  },
  
  // 宮位分數和元數據
  palaceScores: { "命宮": 95, "財帛": 88, ... },
  palaceMetadata: { ... },
  topPalaces: ["命宮", "財帛", "事業"],
  
  // 四化系統
  fourTransformations: {
    benming: { stem: "甲", mutagenStars: { 祿: "廉貞", ... } },
    dalimit: { palace: "財帛", stem: "乙", ... },
    liunian: { palace: "事業", stem: "丙", branch: "寅", ... },
    xiaoxian: { ... }
  },
  
  // 疊宮分析
  overlapAnalysis: {
    criticalRisks: [...],
    maxOpportunities: [...],
    comments: [...],
    summary: { ... }
  },
  
  // 五行數據
  fiveElements: {
    strongestElement: "木",
    weakestElement: "金",
    raw: { ... }
  },
  
  // 健康預警
  healthWarning: {
    riskLevel: "warning",
    warnings: [...],
    recommendations: [...]
  },
  
  // 流月數據
  liuyue: { ... }
}
```

## 🔒 安全考慮

- **僅供後台管理界面使用**：AI Prompt 生成功能不會暴露在前端用戶界面
- **需要 Basic Auth**：後端 API 端點需要 Basic Auth 認證
- **數據完整性**：所有計算結果都會被整合到 Prompt 中，確保命書生成的準確性

## ✅ 測試建議

1. **計算完成後檢查全局狀態**
   ```javascript
   console.log('AI Prompt:', window.aiPrompt);
   console.log('Structured Data:', window.structuredData);
   ```

2. **驗證 Prompt 結構**
   - 檢查是否包含所有必要部分
   - 檢查戰略標籤是否正確生成
   - 檢查數據摘要是否準確

3. **測試後端 API**
   ```bash
   curl -X POST https://your-domain.com/api/admin/calculation-results \
     -u admin:password \
     -H "Content-Type: application/json" \
     -d '{"chartId": "test-123"}'
   ```

4. **驗證 Prompt 質量**
   - 將生成的 Prompt 輸入到 AI 模型
   - 檢查生成的命書是否符合 #深度貼文風格
   - 驗證命書內容是否基於數據分析

## 🚀 下一步

根據項目計劃，下一步可以：

1. **Phase 2: 15題專家問卷數據採集**
   - 實現問卷表單
   - 整合問卷數據到計算流程

2. **Phase 3.2: 戰略標籤優化**
   - 優化戰略標籤生成邏輯
   - 增加更多標籤類型

3. **後台管理界面開發**
   - 創建管理界面 UI
   - 實現一鍵生成命書功能
   - 整合 AI Prompt 到命書生成流程

4. **數據庫整合**
   - 創建 migration 保存計算結果
   - 實現歷史記錄查詢功能

## 📚 相關文檔

- `EXPERT_ADMIN_EDITION_ANALYSIS.md` - 項目整體分析
- `BACKEND_DATA_EXPORT_GUIDE.md` - 後端數據導出指南
- `OVERLAP_IMPLEMENTATION_COMPLETE.md` - 疊宮分析實現文檔
- `PHASE1_2_LUCK_INDEX_COMPLETE.md` - 好命指數實現文檔
- `HEALTH_ANALYSIS_ENHANCED_COMPLETE.md` - 五行健康預警實現文檔

---

**完成時間**：2026-02-05  
**狀態**：✅ 已完成並整合到計算流程
