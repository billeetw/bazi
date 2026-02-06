# 專家後台版分析報告：人生戰略引擎

## 📊 現有系統基礎評估

### ✅ 已實現的核心功能

#### 1. **九層演算法架構（L1-L9）** - 完整實現
- **L1-L3**: 主星/輔星基礎分數、廟旺利陷、宮位共鳴 ✅
- **L4**: 三方四正空間連動 ✅
- **L5**: 能量環境（預留接口）✅
- **L6-L7**: 觸發與感知（小限宮位增益）✅
- **L8**: 細節噪訊（懲罰機制）✅
- **L9**: 戰略輸出（星級評分、語義標籤）✅

#### 2. **12宮位安星邏輯** - 完整實現
- 主星分布計算 ✅
- 輔星分布計算 ✅
- 空宮處理（對宮借星）✅
- 宮位順序與映射 ✅

#### 3. **四化系統** - 部分實現
- ✅ **小限四化**：已實現（`getMutagenStars`, `getSiHuaWeights`）
- ⚠️ **本命四化**：需要補充（基於生年天干）
- ⚠️ **大限四化**：需要補充（基於大限天干）
- ⚠️ **流年四化**：需要補充（基於流年天干）

#### 4. **五行能量系統** - 完整實現
- 五行百分比計算 ✅
- 五行相生相剋 ✅
- 五行能量等級（0-3）✅
- 五行診斷報告 ✅

#### 5. **流月計算** - 完整實現
- 2026流月數據 ✅
- 流月與紫微宮位關聯 ✅
- 流月與五行關聯 ✅

#### 6. **問卷系統** - 部分實現
- ✅ **出生時間問卷**：18+1題（已實現）
- ⚠️ **專家問卷**：15題心理原型問卷（需要新增）

---

## 🎯 計劃需求 vs 現有系統對照表

| 需求項目 | 現有狀態 | 優先級 | 工作量評估 |
|---------|---------|--------|-----------|
| **數據採集層** |
| 15題專家問卷 | ❌ 未實現 | 🔴 高 | 中（2-3天）|
| 天文校準（經緯度）| ❌ 未實現 | 🟡 中 | 低（1天）|
| **邏輯演算層** |
| 12宮位安星 | ✅ 完整 | - | - |
| 本命四化 | ⚠️ 部分 | 🔴 高 | 低（1天）|
| 大限四化 | ❌ 未實現 | 🔴 高 | 中（2天）|
| 流年四化 | ❌ 未實現 | 🔴 高 | 中（2天）|
| 小限四化 | ✅ 完整 | - | - |
| 宮位強度（Power Index）| ✅ 已有基礎 | 🟡 中 | 低（優化1天）|
| 好命指數（Luck Index）| ⚠️ 部分 | 🔴 高 | 中（2天）|
| 五行平衡 | ✅ 完整 | - | - |
| **指標分析層** |
| 五行健康預警 | ❌ 未實現 | 🟡 中 | 中（2-3天）|
| 時空重疊（疊宮）| ⚠️ 部分 | 🔴 高 | 中（2-3天）|
| 戰略標籤生成 | ✅ 已有基礎 | 🟡 中 | 低（優化1天）|
| **生成與輸出層** |
| 結構化JSON輸出 | ✅ 已有基礎 | 🟡 中 | 低（優化1天）|
| AI Prompt模板 | ❌ 未實現 | 🔴 高 | 中（2-3天）|

---

## 💡 技術建議與優先級

### 🔴 Phase 1: 核心邏輯補強（2-3週）

#### 1.1 四化系統完整化（最高優先級）
```javascript
// 需要新增的函數結構
function computeFourTransformations(bazi, horoscope, currentYear) {
  return {
    benming: computeBenmingSiHua(bazi.yearStem),      // 本命四化
    dalimit: computeDalimitSiHua(bazi, age),          // 大限四化
    liunian: computeLiunianSiHua(currentYear),        // 流年四化
    xiaoxian: computeXiaoxianSiHua(horoscope)         // 小限四化（已有）
  };
}
```

**建議實現路徑**：
- 擴展現有的 `getMutagenStars` 函數
- 新增 `calc/fourTransformations.js` 模組
- 整合到 `ziweiPipeline.js` 的 Stage 5

#### 1.2 好命指數（Luck Index）演算
```javascript
// 基於現有的星曜評分系統擴展
function computeLuckIndex(ziwei, allPalaceScores) {
  // 1. 星曜廟旺利陷加權
  const brightnessScore = computeBrightnessWeight(ziwei);
  
  // 2. 吉煞星比例
  const auspiciousRatio = computeAuspiciousRatio(ziwei);
  
  // 3. 主星組合評級
  const mainStarCombo = evaluateMainStarCombination(ziwei);
  
  // 4. 綜合計算（0-100分）
  return (brightnessScore * 0.4 + auspiciousRatio * 0.3 + mainStarCombo * 0.3);
}
```

**建議實現路徑**：
- 新增 `calc/luckIndex.js` 模組
- 整合到 `computeAllPalaceScores` 的輸出

#### 1.3 時空重疊（疊宮）邏輯
```javascript
// 擴展現有的小限宮位邏輯
function computeSpatialOverlap(bazi, horoscope, currentYear) {
  const dalimitPalace = getDalimitPalace(bazi, age);
  const liunianPalace = getLiunianPalace(currentYear);
  const xiaoxianPalace = horoscope.activeLimitPalaceName;
  
  return {
    overlaps: {
      dalimit_liunian: dalimitPalace === liunianPalace,
      dalimit_xiaoxian: dalimitPalace === xiaoxianPalace,
      liunian_xiaoxian: liunianPalace === xiaoxianPalace,
      triple: dalimitPalace === liunianPalace && liunianPalace === xiaoxianPalace
    },
    energyMultiplier: computeOverlapMultiplier(overlaps)
  };
}
```

**建議實現路徑**：
- 擴展 `baziCore.js` 中的大限計算
- 新增流年宮位計算函數
- 整合到 `ziweiPipeline.js` 的 Stage 7

---

### 🟡 Phase 2: 數據採集擴展（1-2週）

#### 2.1 15題專家問卷設計
**建議問卷結構**：
```javascript
const EXPERT_QUESTIONNAIRE = [
  // 心理原型（5題）
  { id: "eq1", category: "psychology", text: "..." },
  // 行為偏好（5題）
  { id: "eq2", category: "behavior", text: "..." },
  // 抗壓機制（5題）
  { id: "eq3", category: "resilience", text: "..." }
];
```

**實現建議**：
- 參考現有的 `identifyBirthTime.js` 結構
- 新增 `js/ui/components/expert-questionnaire.js`
- 整合到現有的表單流程

#### 2.2 經緯度校準
**實現建議**：
- 使用瀏覽器 Geolocation API（可選）
- 提供手動輸入選項
- 整合到 `baziCore.js` 的計算流程

---

### 🟢 Phase 3: 指標分析與輸出（1-2週）

#### 3.1 五行健康預警
```javascript
function generateHealthWarning(wuxingData, palaceScores) {
  // 基於五行強弱對應生理系統
  const healthMap = {
    "木": { organs: ["肝", "膽"], weakRisk: "..." },
    "火": { organs: ["心", "小腸"], weakRisk: "..." },
    // ...
  };
  
  return analyzeElementHealth(wuxingData, healthMap);
}
```

#### 3.2 AI Prompt 模板設計
```javascript
function generateAIPrompt(structuredData) {
  return `
# 命主特徵標籤
${generateStrategicTags(structuredData)}

# 核心數據
- 好命指數：${structuredData.luckIndex}/100
- 最強宮位：${structuredData.topPalaces.join(", ")}
- 五行狀態：${structuredData.wuxingSummary}

# 深度分析要求
請以「#深度貼文」風格撰寫1500字命書，重點分析：
1. 命主核心特質與優勢領域
2. 十年大限導航建議
3. 2026流月關鍵風險與機會
...
  `;
}
```

---

## 🏗️ 架構整合建議

### 建議的模組結構
```
js/calc/
├── constants.js          ✅ 已有
├── helpers.js            ✅ 已有
├── baziCore.js           ✅ 已有
├── ziweiPipeline.js      ✅ 已有
├── ziweiOutput.js        ✅ 已有
├── tactics.js            ✅ 已有
├── fourTransformations.js  ⚠️ 新增（四化完整化）
├── luckIndex.js          ⚠️ 新增（好命指數）
├── spatialOverlap.js     ⚠️ 新增（疊宮邏輯）
└── healthAnalysis.js     ⚠️ 新增（五行健康）

js/ui/components/
├── expert-questionnaire.js  ⚠️ 新增（15題問卷）
└── ai-prompt-generator.js   ⚠️ 新增（AI Prompt生成）

functions/api/
└── expert-analysis.js       ⚠️ 新增（專家分析API）
```

---

## 📈 開發時序建議（調整版）

### **Phase 1: 核心邏輯補強**（2-3週）
1. ✅ 四化系統完整化（本命、大限、流年）
2. ✅ 好命指數演算
3. ✅ 時空重疊邏輯
4. ✅ 宮位強度優化

### **Phase 2: 數據採集擴展**（1-2週）
1. ✅ 15題專家問卷UI與邏輯
2. ✅ 經緯度校準功能
3. ✅ 問卷數據整合到計算流程

### **Phase 3: 指標分析**（1-2週）
1. ✅ 五行健康預警系統
2. ✅ 戰略標籤優化
3. ✅ 疊宮能量倍數計算

### **Phase 4: AI整合與後台**（2-3週）
1. ✅ 結構化JSON輸出優化
2. ✅ AI Prompt模板設計
3. ✅ 管理後台Dashboard
4. ✅ 一鍵生成功能

---

## ⚠️ 潛在技術挑戰

### 1. **大限計算的準確性**
- 需要確認大限起始年齡的計算邏輯
- 需要處理跨大限的過渡期

### 2. **流年四化的複雜度**
- 流年天干需要精確計算
- 需要考慮流年與本命、大限的互動

### 3. **疊宮邏輯的權重設計**
- 雙重疊宮 vs 三重疊宮的能量倍數
- 需要實證數據驗證

### 4. **AI Prompt的品質控制**
- 如何確保生成的Prompt能產生高品質命書
- 需要A/B測試不同Prompt模板

---

## 💪 優勢與機會

### ✅ 現有系統的優勢
1. **完整的九層架構**：為擴展提供了堅實基礎
2. **模組化設計**：易於新增功能
3. **已有評分系統**：可直接用於好命指數計算
4. **流月數據完整**：2026年數據已就緒

### 🚀 建議的創新點
1. **動態四化連動視覺化**：展示四化在不同時間層級的變化
2. **疊宮能量熱力圖**：視覺化展示時空重疊的能量分布
3. **AI命書品質評分**：基於數據結構完整性評分
4. **專家問卷個性化**：根據問卷結果調整計算權重

---

## 📝 結論與建議

### 總體評估：**高度可行** ✅

現有系統已經具備了約 **70%** 的基礎功能，主要需要：
1. **補強四化系統**（最高優先級）
2. **新增專家問卷**
3. **完善指標分析**
4. **AI Prompt生成**

### 建議優先順序：
1. 🔴 **Phase 1**：核心邏輯補強（必須先完成）
2. 🟡 **Phase 2**：數據採集（可與Phase 1並行）
3. 🟢 **Phase 3-4**：指標分析與AI整合（依序進行）

### 預估總開發時間：**6-10週**

---

## 🎯 下一步行動建議

1. **立即開始**：Phase 1.1（四化系統完整化）
2. **並行設計**：Phase 2.1（15題問卷設計）
3. **準備資源**：AI API整合（OpenAI/Claude等）

**建議先從四化系統開始，因為這是整個系統的核心邏輯基礎。**
