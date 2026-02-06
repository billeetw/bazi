# 戰略標籤優化完成報告

## ✅ 功能概述

已成功實現 **Phase 3.2: 戰略標籤優化**，增強現有戰略標籤生成系統，整合專家問卷、經緯度等新數據源，優化標籤分類和權重系統，生成詳細的戰略標籤描述和建議。

## 📁 修改文件

### `js/calc/aiPromptGenerator.js`

#### 增強功能

1. **戰略標籤分類系統**
   - 新增 `STRATEGIC_TAG_CATEGORIES` 常數，定義8大標籤分類：
     - `LUCK`: 好命指數相關
     - `PALACE`: 宮位優勢相關
     - `ELEMENT`: 五行能量相關
     - `OVERLAP`: 疊宮分析相關
     - `HEALTH`: 健康預警相關
     - `TRANSFORMATION`: 四化系統相關
     - `QUESTIONNAIRE`: 專家問卷相關（新增）
     - `LOCATION`: 地理位置相關（新增）

2. **增強 `generateStrategicTags()` 函數**
   - 新增 `includeDetails` 選項：返回詳細標籤信息
   - 新增 `maxTags` 選項：限制最大標籤數量（預設20）
   - 為每個標籤添加詳細描述
   - 為每個標籤添加優先級（critical/high/medium/low）
   - 為每個標籤添加分類和相關數據

3. **新增數據源整合**
   - **專家問卷整合**：根據問卷答案生成標籤
     - `#心理原型明確`：心理原型類別答案≥3題
     - `#行為偏好清晰`：行為偏好類別答案≥3題
     - `#抗壓機制完整`：抗壓機制類別答案≥3題
   
   - **地理位置整合**：根據經緯度生成標籤
     - `#東亞地區`：經度100-130，緯度20-30

4. **新增 `generateStrategicTagsReport()` 函數**
   - 生成完整的戰略標籤詳細報告
   - 包含標籤分類統計
   - 包含每個標籤的詳細信息

## 📊 數據結構

### 戰略標籤詳細結果結構

```javascript
{
  tags: ["#極佳命盤", "#命宮優勢", ...], // 標籤陣列
  details: [
    {
      tag: "#極佳命盤",
      category: "luck",
      priority: "high",
      description: "好命指數達到90分以上，命盤配置極佳，具有強大的先天優勢",
      score: 92
    },
    {
      tag: "#命宮優勢",
      category: "palace",
      priority: "high",
      description: "命宮能量強勁（95.0分），是命主的優勢領域",
      palace: "命宮",
      score: 95.0,
      rank: 1
    },
    // ... 其他標籤
  ],
  summary: {
    totalTags: 15,
    categories: {
      luck: 1,
      palace: 3,
      element: 2,
      overlap: 2,
      health: 1,
      transformation: 3,
      questionnaire: 2,
      location: 1
    }
  }
}
```

### 標籤優先級系統

- **critical**（🚨）：關鍵標籤，必須立即關注
  - 超級地雷區、紅色警戒等
  
- **high**（⭐）：高優先級標籤，重要優勢或風險
  - 極佳命盤、最強宮位、本命化祿等
  
- **medium**（📌）：中等優先級標籤，需要關注
  - 良好命盤、一般宮位、黃色預警等
  
- **low**（📍）：低優先級標籤，參考信息
  - 地理位置標籤等

## 🎯 使用範例

### 1. 基本使用（返回標籤陣列）

```javascript
const tags = window.AIPromptGenerator.generateStrategicTags(structuredData);
console.log(tags);
// 輸出：["#極佳命盤", "#命宮優勢", "#財帛宮優勢", ...]
```

### 2. 詳細模式（返回詳細對象）

```javascript
const result = window.AIPromptGenerator.generateStrategicTags(structuredData, {
  includeDetails: true,
  maxTags: 15
});

console.log('標籤數量:', result.summary.totalTags);
console.log('標籤分類:', result.summary.categories);

result.details.forEach(detail => {
  console.log(`${detail.tag}: ${detail.description}`);
});
```

### 3. 生成詳細報告

```javascript
const report = window.AIPromptGenerator.generateStrategicTagsReport(structuredData);
console.log(report);
// 輸出完整的 Markdown 格式報告
```

### 4. 在後台導出中使用

```javascript
// 自動包含在後台數據導出中
const exportData = window.AdminExport.exportCalculationResults();

if (exportData.strategicTags) {
  console.log('戰略標籤:', exportData.strategicTags.tags);
  console.log('標籤詳情:', exportData.strategicTags.details);
  console.log('分類統計:', exportData.strategicTags.summary);
}
```

### 5. 在 AI Prompt 中使用

```javascript
// 自動整合到 AI Prompt 生成中
const prompt = window.AIPromptGenerator.generateAIPrompt(structuredData);
// Prompt 中會自動包含戰略標籤和分類摘要
```

## 🔍 標籤生成邏輯

### 1. 好命指數標籤
- ≥90分：`#極佳命盤`（high）
- 80-89分：`#優秀命盤`（high）
- 70-79分：`#良好命盤`（medium）
- <60分：`#需要努力`（medium）

### 2. 宮位優勢標籤
- 前3名最強宮位：`#${宮位描述}優勢`
- 優先級：第1名（high），第2-3名（medium）

### 3. 五行能量標籤
- 最強五行：`#${五行}氣主導`（high）
- 最弱五行：`#${五行}氣需補強`（medium）

### 4. 疊宮分析標籤
- 超級地雷區：`#${宮位}宮地雷區`（critical）
- 大發財機會：`#${宮位}宮大機會`（high）

### 5. 健康預警標籤
- 紅色警戒：`#紅色警戒`（critical）
- 黃色預警：`#黃色預警`（medium）

### 6. 四化系統標籤
- 本命化祿：`#本命${星曜}化祿`（high）
- 本命化忌：`#本命${星曜}化忌`（medium）
- 大限宮位：`#大限在${宮位}`（high）
- 流年宮位：`#流年在${宮位}`（medium）

### 7. 專家問卷標籤（新增）
- 心理原型≥3題：`#心理原型明確`（medium）
- 行為偏好≥3題：`#行為偏好清晰`（medium）
- 抗壓機制≥3題：`#抗壓機制完整`（medium）

### 8. 地理位置標籤（新增）
- 東亞地區：`#東亞地區`（low）

## 📈 優化效果

### 優化前
- 僅返回標籤陣列
- 無分類和優先級
- 無詳細描述
- 無數據源整合

### 優化後
- 支持詳細模式，返回完整對象
- 8大分類系統
- 4級優先級系統
- 每個標籤都有詳細描述
- 整合專家問卷和地理位置數據
- 自動生成分類統計
- 支持生成詳細報告

## ✅ 測試建議

1. **測試基本標籤生成**
   ```javascript
   const tags = window.AIPromptGenerator.generateStrategicTags(structuredData);
   console.log('標籤數量:', tags.length);
   console.log('標籤列表:', tags);
   ```

2. **測試詳細模式**
   ```javascript
   const result = window.AIPromptGenerator.generateStrategicTags(structuredData, {
     includeDetails: true
   });
   
   console.log('標籤總數:', result.summary.totalTags);
   console.log('分類統計:', result.summary.categories);
   console.log('高優先級標籤:', result.details.filter(d => d.priority === 'high'));
   ```

3. **測試標籤限制**
   ```javascript
   const result = window.AIPromptGenerator.generateStrategicTags(structuredData, {
     includeDetails: true,
     maxTags: 10
   });
   
   console.log('標籤數量應≤10:', result.tags.length <= 10);
   ```

4. **測試專家問卷整合**
   ```javascript
   // 確保 structuredData 包含 expertQuestionnaire 數據
   const result = window.AIPromptGenerator.generateStrategicTags(structuredData, {
     includeDetails: true
   });
   
   const questionnaireTags = result.details.filter(d => 
     d.category === window.AIPromptGenerator.STRATEGIC_TAG_CATEGORIES.QUESTIONNAIRE
   );
   console.log('專家問卷標籤:', questionnaireTags);
   ```

## 🚀 下一步

根據項目計劃，下一步可以：

1. **後台管理界面開發**
   - 實現戰略標籤可視化組件
   - 顯示標籤分類和優先級
   - 整合到命書生成流程

2. **標籤分析功能**
   - 根據標籤生成個性化建議
   - 標籤趨勢分析
   - 標籤關聯分析

3. **數據庫整合**
   - 保存戰略標籤數據
   - 實現歷史記錄查詢功能

## 📚 相關文檔

- `AI_PROMPT_GENERATOR_COMPLETE.md` - AI Prompt 生成器文檔
- `EXPERT_QUESTIONNAIRE_COMPLETE.md` - 15題專家問卷文檔
- `GEOLOCATION_CALIBRATION_COMPLETE.md` - 經緯度校準文檔

---

**完成時間**：2026-02-05  
**狀態**：✅ 已完成並整合到 AI Prompt 生成和後台數據導出系統
