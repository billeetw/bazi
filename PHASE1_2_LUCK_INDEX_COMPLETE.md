# Phase 1.2: 好命指數（Luck Index）實現完成報告

## ✅ 已完成功能

### 1. 核心模組
- ✅ `js/calc/luckIndex.js` - 好命指數計算模組
- ✅ 整合到 `js/calc.js` 的 `computeAllPalaceScores` 函數
- ✅ 添加到 `index.html` 腳本引用

### 2. 計算組件

#### 2.1 星曜廟旺利陷加權（brightnessScore）
- ✅ 實現亮度狀態權重映射（Miao: 1.2, Wang: 1.1, De: 1.0, Li: 0.9, Ping: 0.8, Bu: 0.6, Xian: 0.4）
- ✅ 遍歷所有宮位的主星和輔星
- ✅ 計算平均亮度加權分數（0-100分）
- ✅ 權重：40%

#### 2.2 吉煞星比例（auspiciousRatio）
- ✅ 定義吉星列表（六吉星 + 其他吉星）
- ✅ 定義煞星列表（六煞星 + 其他煞星）
- ✅ 統計所有宮位的吉煞星數量
- ✅ 計算吉星比例（0-100分）
- ✅ 權重：30%

#### 2.3 主星組合評級（mainStarCombo）
- ✅ 定義主星組合評級映射表
- ✅ 獲取命宮主星組合
- ✅ 評估單星或雙星組合評級（0-100分）
- ✅ 權重：30%

### 3. 綜合計算
- ✅ 好命指數 = brightnessScore × 0.4 + auspiciousRatio × 0.3 + mainStarCombo × 0.3
- ✅ 結果範圍：0-100分
- ✅ 自動生成描述文字（極佳/優秀/良好/中等/普通/較弱）

## 📊 數據結構

### 好命指數結果
```javascript
{
  luckIndex: 75,              // 綜合好命指數（0-100）
  brightnessScore: 80,        // 亮度加權分數
  auspiciousRatio: 70,        // 吉煞星比例分數
  mainStarCombo: 75,          // 主星組合評級
  breakdown: {
    brightnessWeight: 0.4,    // 亮度權重
    auspiciousWeight: 0.3,    // 吉煞星權重
    comboWeight: 0.3          // 主星組合權重
  },
  description: "良好：命盤配置尚可，運勢平穩，適合穩步前進。"
}
```

## 🔍 評級標準

| 好命指數 | 等級 | 描述 |
|---------|------|------|
| 90-100 | 極佳 | 命盤配置優異，運勢強勁，適合積極進取 |
| 80-89 | 優秀 | 命盤配置良好，運勢順暢，適合穩健發展 |
| 70-79 | 良好 | 命盤配置尚可，運勢平穩，適合穩步前進 |
| 60-69 | 中等 | 命盤配置一般，運勢普通，需要努力經營 |
| 50-59 | 普通 | 命盤配置較弱，運勢起伏，需要謹慎規劃 |
| 0-49 | 較弱 | 命盤配置較差，運勢不佳，需要特別注意 |

## 🔄 使用方式

### 自動模式（已整合）
```javascript
// 系統會自動計算好命指數（在 computeAllPalaceScores 中）
computeAllPalaceScores(ziwei, horoscope, { bazi, age })
// 結果存儲在 window.luckIndex
```

### 手動模式
```javascript
// 1. 載入權重資料
const weightsData = await loadZiweiWeights();

// 2. 計算好命指數
const luckIndexData = window.LuckIndex.computeLuckIndex(ziwei, weightsData);
console.log('好命指數:', luckIndexData.luckIndex);
console.log('描述:', luckIndexData.description);
```

## 📝 主星組合評級表

### 頂級組合（90-100分）
- 紫微天府：95分
- 紫微天相：92分
- 太陽太陰：90分
- 武曲天府：90分

### 優秀組合（80-89分）
- 紫微：88分
- 天府：85分
- 太陽：82分
- 太陰：82分
- 武曲：80分

### 良好組合（70-79分）
- 天同：75分
- 天梁：75分
- 天機：72分
- 天相：70分

### 一般組合（60-69分）
- 貪狼：65分
- 巨門：63分
- 廉貞：60分

### 較差組合（50-59分）
- 七殺：55分
- 破軍：50分

## 🧪 測試建議

1. **基本測試**：
   - 完成計算後，檢查 `window.luckIndex`
   - 查看控制台日誌

2. **亮度測試**：
   - 驗證不同亮度狀態的權重是否正確應用

3. **吉煞星測試**：
   - 驗證吉星和煞星的統計是否準確

4. **主星組合測試**：
   - 驗證不同主星組合的評級是否正確

## 📝 下一步

1. ✅ 好命指數計算完成
2. ⏳ UI 顯示好命指數（可選）
3. ⏳ 整合到 AI Prompt 生成（Phase 4）

