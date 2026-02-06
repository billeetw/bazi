# 後台數據導出指南

## 📋 概述

本系統實現的所有計算功能都是為**後台管理界面**設計的，用於：
1. **判讀基礎**：專家可以查看完整的結構化計算結果
2. **命書輸出**：作為未來收費服務的數據基礎
3. **管理機制**：後台可以管理和審核計算結果

**重要**：這些功能**不會暴露在前端UI**，避免用戶誤會或嚇壞。

## 🔒 後台API端點

### GET /api/admin/calculation-results
獲取計算結果數據結構說明

**認證**：Basic Auth（與其他 admin API 一致）

**請求**：
```bash
curl -u admin:password https://your-domain.com/api/admin/calculation-results
```

**響應**：
```json
{
  "ok": true,
  "message": "計算結果數據結構說明",
  "dataStructure": {
    "fourTransformations": {...},
    "overlapAnalysis": {...},
    "luckIndex": {...},
    "palaceScores": {...},
    "palaceMetadata": {...},
    "fiveElements": {...},
    "liuyue": {...}
  }
}
```

### POST /api/admin/calculation-results
保存計算結果到數據庫（供後台管理使用）

**認證**：Basic Auth

**請求體**：
```json
{
  "chartId": "chart-123",
  "birthInfo": {
    "year": 1990,
    "month": 5,
    "day": 15,
    "hour": 14,
    "minute": 30,
    "gender": "M"
  },
  "fourTransformations": {...},
  "overlapAnalysis": {...},
  "luckIndex": {...},
  "palaceScores": {...},
  "palaceMetadata": {...},
  "fiveElements": {...},
  "liuyue": {...}
}
```

## 📊 數據結構

### 1. 四化系統數據 (fourTransformations)
```javascript
{
  benming: {
    stem: "甲",
    mutagenStars: { 祿: "廉貞", 權: "破軍", 科: "武曲", 忌: "太陽" },
    weights: { "廉貞": 3, "破軍": 2, "武曲": 1, "太陽": -3 }
  },
  dalimit: {
    stem: "乙",
    palace: "財帛",
    mutagenStars: {...},
    weights: {...}
  },
  liunian: {
    stem: "丙",
    branch: "子",
    palace: "官祿",
    mutagenStars: {...},
    weights: {...}
  },
  xiaoxian: {
    stem: "丁",
    palace: "遷移",
    mutagenStars: {...},
    weights: {...}
  },
  combinedWeights: {...},
  summary: {...}
}
```

### 2. 疊宮分析數據 (overlapAnalysis)
```javascript
{
  palaceMap: Map<string, PalaceData>,
  criticalRisks: [
    {
      palace: "財帛",
      jiCount: 3,
      transformations: {...},
      description: "財帛宮：本命化忌 + 大限化忌 + 流年化忌 → 超級地雷區"
    }
  ],
  maxOpportunities: [
    {
      palace: "官祿",
      luCount: 2,
      transformations: {...},
      description: "官祿宮：本命化祿 + 流年化祿 → 大發財機會"
    }
  ],
  summary: {
    totalCriticalRisks: 1,
    totalMaxOpportunities: 1,
    riskPalaces: ["財帛"],
    opportunityPalaces: ["官祿"]
  },
  comments: [
    "⚠️ 財帛宮：雖然你天生財運好（本命祿），但這十年大限忌在財帛，且今年流年忌又疊上去。所以今年你絕對不能投資，否則會破產。"
  ]
}
```

### 3. 好命指數數據 (luckIndex)
```javascript
{
  luckIndex: 75,              // 0-100
  brightnessScore: 80,
  auspiciousRatio: 70,
  mainStarCombo: 75,
  breakdown: {
    brightnessWeight: 0.4,
    auspiciousWeight: 0.3,
    comboWeight: 0.3
  },
  description: "良好：命盤配置尚可，運勢平穩，適合穩步前進。"
}
```

### 4. 宮位分數和元數據
```javascript
{
  palaceScores: {
    "命宮": 85.5,
    "兄弟": 72.3,
    // ... 其他宮位
  },
  palaceMetadata: {
    "命宮": {
      stars: [...],
      baseScore: 85.5,
      strategicAdvice: ["全速推進。能量通道完全開啟..."],
      maxStarRating: 5,
      // ... 其他元數據
    }
  }
}
```

## 🔧 使用方式

### 方式1：從前端導出（開發階段）

在前端計算完成後，可以通過 `window.AdminExport` 導出：

```javascript
// 導出計算結果
const results = window.AdminExport.exportCalculationResults({
  chartId: 'chart-123',
  birthInfo: {
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    minute: 30,
    gender: 'M'
  }
});

// 提交到後台API（需要認證）
await window.AdminExport.submitToAdminAPI(
  results,
  'admin_username',
  'admin_password'
);
```

### 方式2：後台管理界面直接調用API

後台管理界面可以：
1. 接收前端提交的計算結果
2. 或從數據庫讀取已保存的結果
3. 進行判讀和命書生成

## 📝 下一步

1. ✅ 計算結果數據結構已定義
2. ✅ 後台API端點已創建
3. ⏳ 創建數據庫 migration（保存計算結果）
4. ⏳ 實現後台管理界面
5. ⏳ 整合到命書生成流程

## ⚠️ 注意事項

1. **不暴露在前端UI**：所有管理功能都通過後台API訪問
2. **認證保護**：所有後台API都需要Basic Auth認證
3. **數據隱私**：計算結果包含敏感資訊，需要妥善保護
4. **性能考慮**：大量計算結果可能需要分頁或緩存

