# 五行健康預警系統增強版完成報告

## ✅ 已實現的增強功能

### 1. 年份月份加權
- ✅ **流年五行加權**：基於流年天干對五行產生影響
  - 甲/乙年：木氣增強（1.2x），火氣稍弱（0.9x）
  - 丙/丁年：火氣增強（1.2x），土氣稍弱（0.9x）
  - 戊/己年：土氣增強（1.2x），金氣稍弱（0.9x）
  - 庚/辛年：金氣增強（1.2x），水氣稍弱（0.9x）
  - 壬/癸年：水氣增強（1.2x），木氣稍弱（0.9x）

- ✅ **流月五行加權**：基於月份對五行產生影響
  - 1-2月（冬末初春）：水/木氣強
  - 3-5月（春初夏）：木/火氣強
  - 6-7月（長夏）：土氣強
  - 8-10月（秋）：金氣強
  - 11-12月（冬）：水氣強

### 2. 用戶年紀風險增加
- ✅ **年齡風險加權係數**：
  - 0-20歲：1.0x（基礎風險）
  - 21-30歲：1.1x（輕微增加）
  - 31-40歲：1.2x（中等增加）
  - 41-50歲：1.4x（明顯增加）
  - 51-60歲：1.6x（顯著增加）
  - 61-70歲：1.8x（高度增加）
  - 71歲以上：2.0x（極高風險）

### 3. 流年大小限分析
- ✅ **檢測流年大小限是否在疾厄宮**
- ✅ **生成特別提醒**：如果大限、流年、小限在疾厄宮，健康波動感會特別明顯

### 4. 疾厄宮星曜四化分析
- ✅ **化忌疊加檢測**：
  - 2個以上化忌：風險增加50%（1.5x）
  - 1個化忌：風險增加20%（1.2x）
- ✅ **化祿疊加檢測**：
  - 2個以上化祿：風險降低20%（0.8x）
  - 1個化祿：風險降低10%（0.9x）
- ✅ **結合疊宮分析**：使用 `overlapAnalysis` 獲取疾厄宮的四化疊加情況

## 📊 綜合風險計算

### 風險加權公式
```
總風險加權 = 年齡風險加權 × 疾厄宮四化風險加權
```

### 五行等級調整
```
調整後等級 = 原始等級 + 流年加權調整 + 流月加權調整
```

## 🔍 增強後的數據結構

### 健康預警結果（增強版）
```javascript
{
  riskLevel: 'critical',
  summary: '...',
  warnings: [
    {
      element: '木',
      level: 0.5, // 調整後等級
      originalLevel: 0, // 原始等級
      severity: 'critical',
      type: 'weak',
      risk: '肝膽功能偏弱... 特別注意：2026年（丙年）對木氣不利；2月對木氣不利；年齡35歲，健康風險增加20%。',
      riskMultiplier: 1.44, // 總風險加權（1.2 × 1.2）
      yearMonthNote: '2026年（丙年）對木氣不利；2月對木氣不利；年齡35歲，健康風險增加20%'
    }
  ],
  multipliers: {
    ageRisk: 1.2, // 年齡風險加權
    jiePalaceRisk: 1.2, // 疾厄宮四化風險加權
    totalRisk: 1.44, // 總風險加權
    yearElement: { "火": 1.2, "土": 0.9 }, // 流年五行加權
    monthElement: { "水": 1.1, "木": 0.95 } // 流月五行加權
  },
  jiePalaceAnalysis: {
    hasCriticalRisk: false,
    hasMaxOpportunity: false,
    transformations: {
      benming: { type: '忌', star: '太陽', weight: 1.0 },
      liunian: { type: '忌', star: '廉貞', weight: 2.0 }
    },
    riskMultiplier: 1.2,
    notes: [
      '⚠️ 疾厄宮有化忌，需要特別注意健康',
      '📍 流年大小限在疾厄宮：流年、小限，健康波動感會特別明顯'
    ],
    jiCount: 2,
    luCount: 0
  }
}
```

## 💡 使用範例

### 完整計算（自動模式）
```javascript
// 系統會自動計算增強版五行健康預警
computeAllPalaceScores(ziwei, horoscope, { bazi, age })
// 結果存儲在 window.healthWarning
```

### 手動調用
```javascript
const healthWarning = window.HealthAnalysis.generateHealthWarning(wuxingData, {
  palaceScores: scores,
  palaceMetadata: finalMetadata,
  overlapAnalysis: overlapAnalysis,
  age: 35,
  currentYear: 2026,
  currentMonth: 2,
  fourTransformations: fourTransformations
});

// 查看風險加權
console.log('年齡風險加權:', healthWarning.multipliers.ageRisk);
console.log('疾厄宮風險加權:', healthWarning.multipliers.jiePalaceRisk);
console.log('總風險加權:', healthWarning.multipliers.totalRisk);

// 查看疾厄宮四化分析
console.log('疾厄宮化忌數量:', healthWarning.jiePalaceAnalysis.jiCount);
console.log('疾厄宮備註:', healthWarning.jiePalaceAnalysis.notes);
```

## 🎯 關鍵改進

1. **動態風險調整**：根據年份月份和年齡動態調整健康風險
2. **時空疊加分析**：結合流年大小限在疾厄宮的情況
3. **四化共振檢測**：檢測疾厄宮的化忌/化祿疊加
4. **個人化建議**：根據具體情況生成個人化的健康建議

## 📝 注意事項

1. **向後兼容**：舊的調用方式 `generateHealthWarning(wuxingData, palaceScores)` 仍然支持
2. **數據完整性**：如果缺少某些數據（如年齡、四化數據），系統會使用預設值或跳過相關分析
3. **風險等級提升**：如果疾厄宮有嚴重風險，會自動提升整體風險等級

