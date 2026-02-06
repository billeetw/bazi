# 15題專家問卷系統完成報告

## ✅ 功能概述

已成功實現 **Phase 2: 15題專家問卷數據採集**，用於後台管理界面，採集心理原型、行為偏好、抗壓機制，作為判讀和命書輸出（未來收費服務）的基礎數據。

## 📁 新增文件

### `js/ui/components/expert-questionnaire.js`
15題專家問卷組件，提供以下核心功能：

1. **問卷題目定義**
   - 心理原型（5題）：決策驅動力、人格特質、壓力反應、擅長領域、人生目標
   - 行為偏好（5題）：團隊合作、衝突處理、學習方式、完成後行為、不確定性應對
   - 抗壓機制（5題）：恢復方式、失敗應對、能量耗盡處理、長期壓力策略、需加強能力

2. **核心函數**
   - `initExpertQuestionnaire(container, options)` - 初始化問卷組件
   - `getAnswers()` - 獲取問卷答案
   - `getSummary()` - 獲取問卷摘要（完成率、分類統計）
   - `clearAnswers()` - 清空問卷答案
   - `loadAnswers()` - 從本地存儲載入答案
   - `saveAnswers()` - 保存答案到本地存儲

3. **自動功能**
   - 進度條顯示（已完成 X/15 題）
   - 本地存儲自動保存
   - 全局狀態同步（`window.expertQuestionnaire`）
   - 提交事件觸發（`expertQuestionnaireSubmit`）

## 🔗 整合點

### `index.html`
- 添加專家問卷組件腳本引用
- 添加專家問卷樣式（CSS）

### `js/calc/adminExport.js`
- 在 `exportCalculationResults` 函數中自動包含專家問卷數據
- 導出格式包含答案、摘要、時間戳

### `js/calc/aiPromptGenerator.js`
- 在 `collectStructuredData` 函數中自動收集專家問卷數據
- 整合到結構化數據中，供 AI Prompt 生成使用

## 📊 數據結構

### 問卷答案結構

```javascript
{
  "eq1": {
    answer: "A",
    category: "psychology",
    questionText: "在面對重大決策時，你的核心驅動力來自？",
    optionText: "邏輯分析與數據支撐"
  },
  "eq2": {
    answer: "B",
    category: "psychology",
    questionText: "你認為自己最核心的人格特質是？",
    optionText: "觀察力敏銳，善於分析"
  },
  // ... 其他13題
}
```

### 問卷摘要結構

```javascript
{
  totalAnswered: 15,
  totalQuestions: 15,
  completionRate: 100,
  categorySummary: {
    psychology: { answered: 5, total: 5 },
    behavior: { answered: 5, total: 5 },
    resilience: { answered: 5, total: 5 }
  },
  answers: { /* 完整答案對象 */ },
  isComplete: true
}
```

### 導出數據結構

```javascript
{
  expertQuestionnaire: {
    answers: { /* 問卷答案 */ },
    summary: {
      totalAnswered: 15,
      totalQuestions: 15,
      completionRate: 100,
      categorySummary: { /* 分類統計 */ }
    },
    timestamp: "2026-02-05T12:00:00.000Z"
  }
}
```

## 🎯 使用範例

### 1. 初始化問卷組件

```javascript
// 在後台管理界面中初始化
const container = document.getElementById('admin-questionnaire-container');

window.ExpertQuestionnaire.init(container, {
  onSubmit: function(answers, summary) {
    console.log('問卷提交成功:', answers);
    console.log('完成率:', summary.completionRate + '%');
    
    // 可以觸發後續處理，例如保存到數據庫
    saveToDatabase(answers, summary);
  }
});
```

### 2. 獲取問卷答案

```javascript
// 獲取當前答案
const answers = window.ExpertQuestionnaire.getAnswers();

// 獲取摘要
const summary = window.ExpertQuestionnaire.getSummary();
console.log('已完成:', summary.totalAnswered, '/', summary.totalQuestions);
console.log('完成率:', summary.completionRate + '%');
```

### 3. 在後台導出中使用

```javascript
// 自動包含在後台數據導出中
const exportData = window.AdminExport.exportCalculationResults();

if (exportData.expertQuestionnaire) {
  console.log('專家問卷數據:', exportData.expertQuestionnaire);
  console.log('完成率:', exportData.expertQuestionnaire.summary.completionRate + '%');
}
```

### 4. 在 AI Prompt 生成中使用

```javascript
// 自動整合到結構化數據中
const structuredData = window.AIPromptGenerator.collectStructuredData();

if (structuredData.expertQuestionnaire) {
  // 可以在 AI Prompt 中加入問卷分析
  const questionnaire = structuredData.expertQuestionnaire;
  
  // 例如：根據心理原型調整命書風格
  if (questionnaire.summary.categorySummary.psychology.answered === 5) {
    // 心理原型完整，可以進行深度分析
  }
}
```

## 🔒 安全考慮

- **僅供後台管理界面使用**：專家問卷組件不會自動顯示在前端用戶界面
- **數據隱私**：問卷答案存儲在本地存儲和全局狀態中，不會自動上傳
- **可選功能**：問卷數據為可選，不影響核心計算流程

## 📝 問卷題目分類

### 心理原型（5題）
1. **決策驅動力**：邏輯分析、直覺感受、他人意見、過往經驗
2. **人格特質**：執行力、觀察力、創造力、穩定可靠
3. **壓力反應**：整理計劃、退後觀察、直接行動、尋求支持
4. **擅長領域**：策略規劃、人際連結、創新突破、穩定執行
5. **人生目標**：影響力聲望、內在平靜、創造價值、穩定安全

### 行為偏好（5題）
1. **團隊合作**：主導方向、協調溝通、執行任務、提供創意
2. **衝突處理**：直接溝通、先避開、快速解決、尋求協助
3. **學習方式**：系統學習、實作學習、討論學習、觀察模仿
4. **完成後行為**：規劃下一步、休息沉澱、分享成果、尋找挑戰
5. **不確定性應對**：蒐集資訊、先試一點、觀望等待、尋求建議

### 抗壓機制（5題）
1. **恢復方式**：獨處靜心、運動活動、親友交流、轉換環境
2. **失敗應對**：分析原因、接受現實、重新出發、尋求支持
3. **能量耗盡處理**：減少工作量、尋求協助、改變方法、暫時休息
4. **長期壓力策略**：建立規律、尋找意義、適度調整、尋求專業
5. **需加強能力**：情緒管理、時間管理、人際支持、目標執行

## ✅ 測試建議

1. **測試問卷初始化**
   ```javascript
   const container = document.createElement('div');
   window.ExpertQuestionnaire.init(container);
   console.log('問卷題目數:', window.ExpertQuestionnaire.EXPERT_QUESTIONNAIRE.length);
   // 應該輸出：15
   ```

2. **測試答案保存**
   ```javascript
   // 模擬選擇答案
   const inputs = document.querySelectorAll('.option-input');
   inputs[0].click(); // 選擇第一題的第一個選項
   
   // 檢查答案是否保存
   const answers = window.ExpertQuestionnaire.getAnswers();
   console.log('已答題數:', Object.keys(answers).length);
   ```

3. **測試完成率計算**
   ```javascript
   // 完成所有15題後
   const summary = window.ExpertQuestionnaire.getSummary();
   console.log('完成率:', summary.completionRate); // 應該為 100
   console.log('是否完成:', summary.isComplete); // 應該為 true
   ```

4. **測試後台導出**
   ```javascript
   const exportData = window.AdminExport.exportCalculationResults();
   if (exportData.expertQuestionnaire) {
     console.log('問卷數據已包含在導出中');
   }
   ```

## 🚀 下一步

根據項目計劃，下一步可以：

1. **後台管理界面開發**
   - 創建專家問卷管理頁面
   - 實現問卷數據可視化
   - 整合到命書生成流程

2. **問卷數據分析**
   - 根據問卷結果調整計算權重
   - 生成個性化標籤和建議
   - 整合到 AI Prompt 生成

3. **數據庫整合**
   - 保存問卷答案到數據庫
   - 實現歷史記錄查詢功能
   - 分析問卷數據趨勢

## 📚 相關文檔

- `EXPERT_ADMIN_EDITION_ANALYSIS.md` - 項目整體分析
- `BACKEND_DATA_EXPORT_GUIDE.md` - 後端數據導出指南
- `AI_PROMPT_GENERATOR_COMPLETE.md` - AI Prompt 生成器文檔

---

**完成時間**：2026-02-05  
**狀態**：✅ 已完成並整合到後台數據導出系統
