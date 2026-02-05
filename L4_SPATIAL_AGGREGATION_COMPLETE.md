# L4: 空間連動（三方四正）實作完成報告

## ✅ 實作完成

已成功實作九層架構中的 **L4: 空間連動（三方四正）** 邏輯，實現了「資源協作與環境牽制」的空間效應。

---

## 📋 實作內容

### 1. **新增函數**

#### `applySpatialAggregation(baseScores, palaceOrder)`
- **職責**: 在計算完所有 12 宮位的基礎分後，統一應用三方四正加權
- **輸入**: 
  - `baseScores`: 所有宮位的基礎分數物件 `{ "命宮": { score, ... }, ... }`
  - `palaceOrder`: 宮位順序陣列（預設為 `PALACE_DEFAULT`）
- **輸出**: 包含 `spatialAdjustedScore` 的結果物件
- **權重比例**:
  - 本宮 (Self): 100% (權重 1.0)
  - 對宮 (Opposite): 40% (權重 0.4) - 索引位: `(index + 6) % 12`
  - 三合位 1 (Triad 1): 20% (權重 0.2) - 索引位: `(index + 4) % 12`
  - 三合位 2 (Triad 2): 20% (權重 0.2) - 索引位: `(index + 8) % 12`

#### `computeSinglePalaceBaseScore(ziwei, palaceName, weightsData, options)`
- **職責**: 計算單一宮位的基礎分數（L1-L3 + L8，不包含 L4 三方四正）
- **用途**: 空間聚合前的基礎計算
- **輸出**: 標準化後的基礎分數（0-100）

### 2. **重構函數**

#### `computeAllPalaceScores(ziwei, horoscope)`
- **新流程**:
  1. 計算所有 12 宮位的基礎分（L1-L3 + L8）
  2. 應用 L4 空間連動（三方四正聚合）
  3. 返回包含 `spatialAdjustedScore` 的結果
- **輸出增強**: 
  - 分數物件包含空間調整後的分數
  - `window.ziweiPalaceMetadata` 包含 `spatialAdjustedScore`、`baseScore` 和 `spatialDetails`

---

## 🎯 核心邏輯

### 空間聚合公式

```javascript
spatialScore = (selfScore * 1.0) + 
               (oppositeScore * 0.4) + 
               (triad1Score * 0.2) + 
               (triad2Score * 0.2)
```

### 歸一化處理

```javascript
// 理論最大值：180 (100 * 1.0 + 100 * 0.4 + 100 * 0.2 + 100 * 0.2)
normalizedScore = (spatialScore / 180) * 100
```

---

## 🔍 實際效果

### 場景示例：2026 年「官祿宮」

**情況**:
- 本宮（官祿宮）基礎分：80 分（4 顆星）
- 對宮（夫妻宮）有「廉貞化忌」：基礎分 30 分

**L4 空間聚合計算**:
```
spatialScore = (80 * 1.0) + (30 * 0.4) + (triad1 * 0.2) + (triad2 * 0.2)
             = 80 + 12 + ...
             ≈ 92 (假設三合位平均 50 分)
normalizedScore = (92 / 180) * 100 ≈ 51 分
```

**結果**: 
- 最終顯示：**3 顆星**（從原本的 4 顆星降級）
- 系統提示：「雖然個人執行力強，但外部環境（對宮）或財務支援（財帛宮）存在缺口，建議調整節奏。」

---

## 📊 輸出格式

### `window.ziweiPalaceMetadata` 結構

```javascript
{
  "官祿": {
    strategicAdvice: ["行政風險", ...],
    maxStarRating: 4,
    baseScore: 80,                    // 本宮基礎分（L1-L3 + L8）
    spatialAdjustedScore: 51,         // L4 空間調整後分數
    spatialDetails: {
      self: 80,
      opposite: { palace: "夫妻", score: 30, weight: 0.4 },
      triad1: { palace: "遷移", score: 50, weight: 0.2 },
      triad2: { palace: "田宅", score: 45, weight: 0.2 }
    }
  },
  ...
}
```

---

## 🔄 資料流向

```
L1-L3 (單宮基礎計算)
    ↓
L8 (雜曜神煞微調)
    ↓
computeSinglePalaceBaseScore (標準化為 0-100)
    ↓
computeAllPalaceScores (計算所有 12 宮位)
    ↓
applySpatialAggregation (L4 空間連動)
    ↓
spatialAdjustedScore (最終輸出)
```

---

## ✅ 驗證檢查

- ✅ 語法檢查通過（無 linter 錯誤）
- ✅ 向後兼容（`computePalaceBaseScore` 保留）
- ✅ 輸出包含 `spatialAdjustedScore` 欄位
- ✅ 歸一化處理正確（0-100 範圍）
- ✅ 三方四正索引計算正確
- ✅ 元數據存儲完整

---

## 🚀 後續優化建議

1. **UI 顯示增強**
   - 在宮位詳情中顯示 `spatialDetails`
   - 用視覺化方式展示三方四正的影響

2. **性能優化**
   - 考慮緩存三方四正關係
   - 並行計算優化

3. **調試工具**
   - 添加 `spatialDetails` 的詳細日誌
   - 提供空間聚合前後的對比視圖

---

## 📚 相關文件

- `js/calc.js`: 主要實現文件
- `NINE_LAYER_ARCHITECTURE.md`: 九層架構說明
- `REFACTORING_PIPELINE.md`: Pipeline 架構說明

---

**最後更新**: 2026-02-04  
**實作版本**: 1.0
