# 紫微評分系統 Pipeline 重構建議

## 📊 當前問題分析

### 複雜度評估
- **`computeSinglePalaceScore`**: ~175 行，職責過多
- **循環複雜度**: 高（多層嵌套 if/forEach）
- **可測試性**: 低（函數過大，難以單元測試）
- **可維護性**: 中（邏輯混合，修改風險高）

### 當前架構問題
1. **職責混合**: 分類、計算、特殊處理都在一個函數
2. **難以擴展**: 添加新評分階段需要修改核心函數
3. **難以測試**: 無法單獨測試某個評分階段
4. **代碼重複**: 主星/輔星/雜曜/神煞的處理邏輯相似但分散

---

## ✅ Pipeline 架構優勢

### 1. **職責分離**
每個階段只做一件事，符合單一職責原則：
- `stageBaseScore`: 基礎分數計算
- `stageBrightness`: 亮度乘數應用
- `stageResonance`: 宮位共鳴係數
- `stageElement`: 五行增益（預留擴展）
- `stageSiHua`: 四化權重調整
- `stagePenalty`: 懲罰與特殊規則

### 2. **易於測試**
```javascript
// 可以單獨測試每個階段
const context = { stars: [...], baseScore: 0, ... };
const result = stageBrightness(context, ziwei, getStarBrightness);
expect(result.baseScore).toBe(expectedValue);
```

### 3. **易於擴展**
```javascript
// 添加新階段只需在 Pipeline 中插入
context = stageBaseScore(context, ziwei, weightsData);
context = stageBrightness(context, ziwei, getStarBrightness);
context = stageNewFeature(context, ...); // 新階段
context = stageResonance(context);
```

### 4. **可讀性強**
流程清晰，一目了然：
```javascript
Base → Brightness → Resonance → Element → SiHua → Penalty → Finalize
```

### 5. **易於調試**
每個階段都有明確的輸入輸出，可以輕鬆插入日誌：
```javascript
function stageBrightness(context, ziwei, getStarBrightness) {
  console.log('[Stage 2] Input:', context.baseScore);
  // ... 處理邏輯
  console.log('[Stage 2] Output:', context.baseScore);
  return context;
}
```

---

## 🏗️ 重構方案

### 方案 A: 漸進式重構（推薦）

**優點**: 風險低，可以逐步遷移，不影響現有功能

**步驟**:
1. ✅ 創建 `ziweiLogic.js` Pipeline 架構（已完成）
2. 在 `calc.js` 中添加適配層，調用 Pipeline
3. 逐步遷移現有邏輯到 Pipeline 階段
4. 測試驗證後移除舊代碼

**實施**:
```javascript
// calc.js 中的適配層
async function computeSinglePalaceScore(ziwei, palaceName, weightsData, options = {}) {
  // 使用 Pipeline 架構
  const context = window.ZiweiLogic.executePipeline(
    ziwei, 
    palaceName, 
    weightsData, 
    {
      getStarBrightness: getStarBrightness,
      horoscope: options.horoscope,
      year: options.year
    }
  );
  
  // 轉換為舊格式（向後兼容）
  return {
    score: context.baseScore + context.minorBoost - context.penaltyApplied,
    minorBoost: context.minorBoost,
    strategicAdvice: context.strategicAdvice,
    maxStarRating: context.maxStarRating,
    penaltyApplied: context.penaltyApplied
  };
}
```

### 方案 B: 完全重構

**優點**: 代碼更乾淨，架構更統一

**缺點**: 風險高，需要大量測試

**步驟**:
1. 完整實現 Pipeline 架構
2. 重寫所有相關函數
3. 全面測試
4. 一次性替換

---

## 📝 實施建議

### 1. **依賴管理**
`ziweiLogic.js` 需要從 `calc.js` 導入：
- `getStarsForPalace` ✅ (已導出)
- `toTraditionalStarName` ✅ (已導出)
- `getStarWeightConfig` ❌ (未導出，需添加)
- `getStarBrightness` ❌ (未導出，需添加)
- `computeRelatedPalaces` ✅ (已導出)
- `PALACE_NAME_TO_ID_MAP` ❌ (未導出，需添加)
- `PALACE_DEFAULT` ✅ (已導出)

**解決方案**: 
- **方案 1 (推薦)**: 將 Pipeline 架構直接整合到 `calc.js` 中
  - 優點: 無需處理依賴，所有函數都在同一作用域
  - 缺點: `calc.js` 文件會變大（但結構更清晰）
  
- **方案 2**: 將內部函數也導出到 `window.Calc`
  ```javascript
  // calc.js
  const Calc = Object.freeze({
    // ... 現有導出
    getStarWeightConfig,  // 新增
    getStarBrightness,    // 新增
    PALACE_NAME_TO_ID_MAP // 新增
  });
  ```
  
- **方案 3**: 將這些函數提取到 `utils.js`，兩個文件都導入

### 2. **向後兼容**
保持現有 API 不變，內部使用 Pipeline：
```javascript
// 對外接口不變
async function computePalaceBaseScore(ziwei, palaceName, horoscope) {
  // 內部使用 Pipeline
  const context = executePipeline(...);
  return finalizeStarRating(context);
}
```

### 3. **測試策略**
- **單元測試**: 每個階段獨立測試
- **集成測試**: 完整 Pipeline 測試
- **回歸測試**: 確保結果與舊算法一致

### 4. **性能考慮**
Pipeline 模式可能略微增加函數調用開銷，但：
- 現代 JavaScript 引擎優化良好
- 可讀性和可維護性的收益遠大於微小的性能損失
- 如果性能成為問題，可以考慮合併某些階段

---

## 🎯 推薦決策

### ✅ **建議採用 Pipeline 重構**

**理由**:
1. **當前代碼已達臨界點**: 175 行的函數已經難以維護
2. **未來擴展需求**: 用戶提到可能添加新功能（如五行增益）
3. **測試友好**: Pipeline 模式更易於單元測試
4. **團隊協作**: 不同開發者可以並行開發不同階段

### 📅 **實施時間表**

**階段 1 (1-2 天)**: 
- 完善 `ziweiLogic.js`，確保所有依賴正確
- 添加適配層，保持向後兼容

**階段 2 (2-3 天)**:
- 遷移現有邏輯到 Pipeline 階段
- 單元測試每個階段

**階段 3 (1-2 天)**:
- 集成測試
- 性能測試
- 修復問題

**階段 4 (1 天)**:
- 移除舊代碼
- 文檔更新

**總計**: 約 5-8 天

---

## 🔍 代碼對比

### 舊代碼（當前）
```javascript
function computeSinglePalaceScore(ziwei, palaceName, weightsData, options = {}) {
  // 175 行混合邏輯
  // - 星曜分類
  // - 基礎分數計算
  // - 亮度乘數
  // - 共鳴係數
  // - 雜曜處理
  // - 神煞處理
  // - 空宮處理
  // - 特殊規則
  // ...
}
```

### 新代碼（Pipeline）
```javascript
function executePipeline(ziwei, palaceName, weightsData, options) {
  let context = initializeContext(...);
  
  context = stageBaseScore(context, ziwei, weightsData);
  context = stageBrightness(context, ziwei, getStarBrightness);
  context = stageResonance(context);
  context = stageElement(context, ziwei);
  context = stageSiHua(context, horoscope, ziwei);
  context = stagePenalty(context, weightsData, options);
  
  return context;
}
```

---

## ❓ 常見問題

### Q1: Pipeline 會影響性能嗎？
**A**: 影響微乎其微。現代 JavaScript 引擎對函數調用優化很好，而且評分計算不是性能瓶頸。

### Q2: 如何處理空宮邏輯？
**A**: 在 `executePipeline` 開始時檢查，如果需要，為對宮創建臨時上下文並執行前三個階段。

### Q3: 三方四正加權在哪裡處理？
**A**: 在 `computePalaceBaseScore` 層級處理（調用 Pipeline 多次），Pipeline 只處理單一宮位。

### Q4: 如何確保結果一致性？
**A**: 編寫回歸測試，確保新算法與舊算法結果一致（允許小數點誤差）。

---

## 📚 參考資料

- [Pipeline Pattern](https://refactoring.guru/design-patterns/pipeline)
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)
