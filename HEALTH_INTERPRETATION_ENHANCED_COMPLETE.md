# 健康預警語義轉換與相剋分析完成報告

## ✅ 功能概述

已成功實現三個增強功能，讓健康預警系統在「命書輸出」時更具說服力：

1. **五行等級與風險的語義轉換** - `interpretHealthWarning` 函數
2. **五行「相剋」的精準判斷** - `analyzeElementConflict` 函數
3. **生命健康心電圖數據生成** - `generateMonthlyHealthRisk` 函數

## 📁 修改文件

### `js/calc/healthAnalysis.js`

#### 新增函數

1. **`analyzeElementConflict(strongestElement, weakestElement, yearElementMultipliers, monthElementMultipliers)`**
   - 檢查最強五行與最弱五行的相剋關係
   - 考慮流年/流月加權對相剋的影響
   - 返回相剋分析結果（包括風險加權係數）

2. **`interpretHealthWarning(healthWarning)`**
   - 將健康預警數值轉換為語義標籤
   - 總風險加權 > 1.8 → "紅色警戒：系統高度超載"
   - 1.2 < 總風險 < 1.8 → "黃色預警：能量過度損耗"
   - 總風險 ≤ 1.2 → "系統運轉正常"

3. **`generateMonthlyHealthRisk(wuxingData, options)`**
   - 生成 1-12 月的健康風險數據
   - 橫軸：1-12 月
   - 縱軸：綜合風險分數（0-100）
   - 用於後台管理界面的「生命健康心電圖」視覺化

#### 修改函數

- **`analyzeElementHealth()`**: 整合相剋分析到風險計算流程
- **`generateHealthWarning()`**: 自動生成語義解釋並包含在報告中
- **`generateDetailedReport()`**: 在報告中包含語義解釋和相剋分析

### `js/calc.js`

- 在計算流程中自動生成月度健康風險數據
- 存儲到 `window.monthlyHealthRisk` 供後台使用

### `js/calc/adminExport.js`

- 在導出數據中包含 `monthlyHealthRisk`（月度健康風險數據）

### `js/calc/aiPromptGenerator.js`

- 整合語義解釋到 AI Prompt 生成
- 在戰略標籤中使用語義標籤（#紅色警戒、#黃色預警）
- 在健康管理建議中包含月度風險分析

## 📊 數據結構

### 語義解釋結構

```javascript
{
  semanticLevel: 'critical' | 'warning' | 'normal',
  semanticLabel: '紅色警戒：系統高度超載' | '黃色預警：能量過度損耗' | '系統運轉正常',
  semanticDescription: '總風險加權達到 X.XXx，系統處於...',
  strategicAdvice: '⚠️ 必須立即採取行動：...',
  totalRisk: 1.85,
  breakdown: {
    ageRisk: 1.2,
    jiePalaceRisk: 1.5,
    conflictRisk: 1.2
  }
}
```

### 相剋分析結構

```javascript
{
  hasConflict: true,
  conflictType: 'critical' | 'warning',
  conflictDescription: '⚠️ 嚴重相剋：流年/流月火氣旺盛，而你的本命金氣偏弱...',
  riskMultiplier: 1.5, // 相剋風險加權
  strongestElement: '火',
  weakestElement: '金'
}
```

### 月度健康風險數據結構

```javascript
[
  {
    month: 1,
    monthName: '1月',
    riskScore: 45.5, // 0-100，越高越危險
    riskLevel: 'warning' | 'critical' | 'normal',
    warnings: 2,
    criticalWarnings: 0,
    totalRiskMultiplier: 1.35,
    conflictAnalysis: { ... }, // 如果存在相剋
    semanticInterpretation: { ... } // 語義解釋
  },
  // ... 2-12月
]
```

## 🎯 使用範例

### 1. 語義轉換

```javascript
// 自動在 generateHealthWarning 中生成
const healthWarning = window.HealthAnalysis.generateHealthWarning(wuxingData, options);
const semanticInterpretation = healthWarning.semanticInterpretation;

console.log(semanticInterpretation.semanticLabel);
// 輸出：'紅色警戒：系統高度超載' 或 '黃色預警：能量過度損耗'

console.log(semanticInterpretation.strategicAdvice);
// 輸出：'⚠️ 必須立即採取行動：優先處理嚴重健康風險...'
```

### 2. 相剋分析

```javascript
// 自動在 analyzeElementHealth 中計算
const analysis = window.HealthAnalysis.analyzeElementHealth(wuxingData, options);

if (analysis.conflictAnalysis && analysis.conflictAnalysis.hasConflict) {
  console.log(analysis.conflictAnalysis.conflictDescription);
  // 輸出：'⚠️ 嚴重相剋：流年/流月火氣旺盛，而你的本命金氣偏弱，火會克制金...'
  
  console.log('相剋風險加權:', analysis.conflictAnalysis.riskMultiplier);
  // 輸出：1.5（相剋風險加權 50%）
}
```

### 3. 月度健康風險（生命健康心電圖）

```javascript
// 自動在計算流程中生成
const monthlyRisk = window.monthlyHealthRisk;

// 找出高風險月份
const criticalMonths = monthlyRisk.filter(m => m.riskLevel === 'critical');
const warningMonths = monthlyRisk.filter(m => m.riskLevel === 'warning');

console.log('高風險月份:', criticalMonths.map(m => m.monthName).join('、'));
// 輸出：'7月、8月'

console.log('需注意月份:', warningMonths.map(m => m.monthName).join('、'));
// 輸出：'3月、4月、9月'

// 獲取特定月份的詳細數據
const julyRisk = monthlyRisk.find(m => m.month === 7);
console.log('7月風險分數:', julyRisk.riskScore);
console.log('7月語義標籤:', julyRisk.semanticInterpretation.semanticLabel);
```

### 4. 在後台管理界面中使用

```javascript
// 獲取完整健康預警數據
const healthWarning = window.healthWarning;
const monthlyRisk = window.monthlyHealthRisk;

// 顯示語義標籤
const semanticLabel = healthWarning.semanticInterpretation.semanticLabel;
document.getElementById('health-status').textContent = semanticLabel;

// 生成心電圖數據（用於圖表庫）
const chartData = monthlyRisk.map(m => ({
  x: m.month,
  y: m.riskScore,
  label: m.monthName,
  level: m.riskLevel
}));

// 使用 Chart.js 或其他圖表庫繪製
// 橫軸：1-12 月
// 縱軸：綜合風險分數（0-100）
// 警戒線：30分（黃色預警）、60分（紅色警戒）
```

## 🔍 相剋判斷邏輯

### 五行相剋映射

- **木克土**：擴張動搖根基
- **火克金**：情緒破壞規則（流年火旺 + 本命金弱 = 嚴重相剋）
- **土克水**：體制限制創意
- **金克木**：規則扼殺執行
- **水克火**：理性壓制熱情

### 相剋風險加權

1. **一般相剋**（最強五行克制最弱五行）
   - 風險加權：1.2x（+20%）

2. **嚴重相剋**（最強五行克制最弱五行 + 流年/流月加劇）
   - 風險加權：1.5x（+50%）
   - 條件：
     - 流年/流月增強最強五行（加權 > 1.0）
     - 流年/流月削弱最弱五行（加權 < 1.0）

### 範例場景

**場景1：流年火旺 + 本命金弱**
```
流年：丙年（火氣增強 1.2x）
本命：金氣最弱
結果：火克金，嚴重相剋
風險加權：1.5x
建議：優先補強金氣，避免在火旺月份進行重大決策
```

**場景2：流月土旺 + 本命水弱**
```
流月：6月（土氣增強 1.1x）
本命：水氣最弱
結果：土克水，一般相剋
風險加權：1.2x
建議：關注水氣相關系統（泌尿系統、生殖系統、骨骼系統）
```

## 📈 生命健康心電圖

### 數據生成邏輯

1. **基礎風險分數**
   - 每個嚴重警告：+30分
   - 每個一般警告：+15分

2. **風險加權**
   - 年齡風險加權
   - 疾厄宮四化風險加權
   - 相剋風險加權
   - 流年/流月五行加權

3. **最終風險分數**
   - 基礎分數 × 總風險加權
   - 限制範圍：0-100分

### 風險等級劃分

- **正常**（0-30分）：系統運轉正常
- **警告**（30-60分）：黃色預警，能量過度損耗
- **嚴重**（60-100分）：紅色警戒，系統高度超載

### 視覺化建議

在後台管理界面中，可以使用以下圖表庫繪製心電圖：

1. **Chart.js**
   ```javascript
   const chartData = {
     labels: monthlyRisk.map(m => m.monthName),
     datasets: [{
       label: '健康風險分數',
       data: monthlyRisk.map(m => m.riskScore),
       borderColor: monthlyRisk.map(m => 
         m.riskLevel === 'critical' ? 'red' : 
         m.riskLevel === 'warning' ? 'orange' : 'green'
       ),
       backgroundColor: 'rgba(255, 99, 132, 0.2)'
     }]
   };
   ```

2. **ECharts**
   ```javascript
   const option = {
     xAxis: { type: 'category', data: monthlyRisk.map(m => m.monthName) },
     yAxis: { type: 'value', max: 100 },
     series: [{
       type: 'line',
       data: monthlyRisk.map(m => m.riskScore),
       markLine: {
         data: [
           { yAxis: 30, name: '黃色預警線' },
           { yAxis: 60, name: '紅色警戒線' }
         ]
       }
     }]
   };
   ```

## 🔒 安全考慮

- **僅供後台管理界面使用**：月度健康風險數據和語義解釋不會暴露在前端用戶界面
- **數據完整性**：所有計算結果都會被整合到健康預警報告中
- **向後兼容**：舊的健康預警數據結構仍然支持，新功能為可選增強

## ✅ 測試建議

1. **測試語義轉換**
   ```javascript
   // 測試不同風險等級
   const highRisk = { multipliers: { totalRisk: 2.0 } };
   const mediumRisk = { multipliers: { totalRisk: 1.5 } };
   const lowRisk = { multipliers: { totalRisk: 1.0 } };
   
   console.log(window.HealthAnalysis.interpretHealthWarning(highRisk).semanticLabel);
   // 應該輸出：'紅色警戒：系統高度超載'
   ```

2. **測試相剋分析**
   ```javascript
   const conflict = window.HealthAnalysis.analyzeElementConflict(
     '火', '金', 
     { '火': 1.2 }, // 流年火旺
     { '金': 0.9 }  // 流月金弱
   );
   
   console.log(conflict.hasConflict); // 應該為 true
   console.log(conflict.conflictType); // 應該為 'critical'
   ```

3. **測試月度風險**
   ```javascript
   const monthlyRisk = window.monthlyHealthRisk;
   console.log('總月份數:', monthlyRisk.length); // 應該為 12
   console.log('7月風險:', monthlyRisk.find(m => m.month === 7));
   ```

## 🚀 下一步

根據用戶需求，下一步可以：

1. **後台管理界面開發**
   - 實現「生命健康心電圖」視覺化組件
   - 顯示語義標籤和戰略建議
   - 整合到命書生成流程

2. **數據庫整合**
   - 保存月度健康風險數據
   - 實現歷史記錄查詢功能

3. **AI Prompt 優化**
   - 在命書生成中更詳細地描述月度風險
   - 提供具體的月份建議

## 📚 相關文檔

- `HEALTH_ANALYSIS_ENHANCED_COMPLETE.md` - 五行健康預警系統增強版文檔
- `AI_PROMPT_GENERATOR_COMPLETE.md` - AI Prompt 生成器文檔
- `BACKEND_DATA_EXPORT_GUIDE.md` - 後端數據導出指南

---

**完成時間**：2026-02-05  
**狀態**：✅ 已完成並整合到計算流程
