# L7: 主觀頻率修正（Subjective Boost）實作完成報告

## ✅ 實作完成

已成功實作九層架構中的 **L7: 主觀頻率修正（Subjective Boost）**，實現了「個人化體感區分度」：小限宮位會產生更強烈的波動感。

---

## 📋 實作內容

### 1. **新增函數**

#### `stageSubjectiveBoost(spatialScores, xiaoXianPalace)`
- **職責**: 根據使用者的個人資料，判斷當前計算的宮位是否與其該年度的「小限宮位」重疊
- **輸入**: 
  - `spatialScores`: 經過 L4 空間聚合後的分數物件
  - `xiaoXianPalace`: 小限宮位名稱（繁體，如 "官祿"）
- **輸出**: 包含 `subjectiveAdjustedScore` 和 `isSubjectiveFocus` 的結果物件
- **增益係數**: α = 1.5（小限宮位分數乘以 1.5 倍）

### 2. **集成到計算流程**

#### `computeAllPalaceScores(ziwei, horoscope)`
- **新流程**:
  1. 計算所有 12 宮位的基礎分（L1-L3 + L8）
  2. 應用 L4 空間連動（三方四正聚合）
  3. **應用 L7 主觀頻率修正（小限宮位增益）** ← 新增
  4. 返回包含 `subjectiveAdjustedScore` 和 `isSubjectiveFocus` 的結果

### 3. **UI 層戰略建議聯動**

#### `renderZiweiScores(scores, horoscope, ziwei)`
- **新增邏輯**: 當 `isSubjectiveFocus` 為 `true` 時，自動在建議文字前加入：
  > 「此領域為你本年度的生命重心，波動感將會特別強烈。」

---

## 🎯 核心邏輯

### 判定邏輯

```javascript
IF currentPalace.id == user.xiaoXianPalace
THEN 
  該宮位的 finalScore 乘以 1.5 倍 (增益係數 α = 1.5)
  標記 isSubjectiveFocus: true
ELSE 
  保持原分數
  標記 isSubjectiveFocus: false
```

### 增益公式

```javascript
subjectiveAdjustedScore = Math.min(100, spatialAdjustedScore * 1.5)
```

**注意**: 分數上限為 100，因為已經標準化過。

---

## 🔍 實際效果

### 場景示例：2026 年 2 月「官祿宮」

**情況 A（你的命盤）**:
- 小限宮位：官祿宮
- L4 空間聚合後分數：60 分（3 顆星）
- L7 主觀頻率修正：60 * 1.5 = 90 分（5 顆星）
- 系統提示：「此領域為你本年度的生命重心，波動感將會特別強烈。」

**情況 B（朋友的命盤）**:
- 小限宮位：財帛宮（不是官祿宮）
- L4 空間聚合後分數：60 分（3 顆星）
- L7 主觀頻率修正：不觸發，保持 60 分（3 顆星）
- 系統提示：無特殊提示

**結果**: 
- 你的系統顯示：⭐⭐⭐⭐⭐（5 顆星）+ 特殊提示
- 朋友的系統顯示：⭐⭐⭐（3 顆星）+ 一般提示

這就是「個人化」的極致體現：**體感區分度**。

---

## 📊 輸出格式

### `window.ziweiPalaceMetadata` 結構（更新後）

```javascript
{
  "官祿": {
    strategicAdvice: ["行政風險", ...],
    maxStarRating: 4,
    baseScore: 60,                    // L1-L3 + L8 基礎分
    spatialAdjustedScore: 60,          // L4 空間調整後分數
    subjectiveAdjustedScore: 90,       // L7 主觀頻率修正後分數（新增）
    isSubjectiveFocus: true,           // L7 標記（新增）
    boostApplied: 1.5,                 // 增益係數（新增）
    spatialDetails: {
      self: 60,
      opposite: { palace: "夫妻", score: 30, weight: 0.4 },
      triad1: { palace: "遷移", score: 50, weight: 0.2 },
      triad2: { palace: "田宅", score: 45, weight: 0.2 }
    }
  },
  "財帛": {
    // ... 非小限宮位，isSubjectiveFocus: false
    isSubjectiveFocus: false
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
stageSubjectiveBoost (L7 主觀頻率修正) ← 新增
    ↓
subjectiveAdjustedScore (最終輸出)
    ↓
UI 層顯示（包含 L7 提示文字）
```

---

## ✅ 驗證檢查

- ✅ 語法檢查通過（無 linter 錯誤）
- ✅ L7 在 L4 之後、L9 之前執行
- ✅ 輸出包含 `isSubjectiveFocus` 標記
- ✅ 輸出包含 `subjectiveAdjustedScore` 欄位
- ✅ UI 層自動添加戰略建議文字
- ✅ 分數上限處理正確（不超過 100）

---

## 🎨 UI 顯示效果

### 小限宮位（觸發 L7）
```
官祿 · 小限命宮 ⭐⭐⭐⭐⭐
─────────────────────────────
此領域為你本年度的生命重心，波動感將會特別強烈。 · 行政風險
```

### 非小限宮位（未觸發 L7）
```
財帛 ⭐⭐⭐
─────────────────────────────
行政風險
```

---

## 🚀 後續優化建議

1. **視覺化增強**
   - 小限宮位可以用特殊顏色或圖標標記
   - 顯示增益前後的分數對比

2. **調試工具**
   - 在開發模式下顯示 `boostApplied` 和 `originalSpatialScore`
   - 提供 L7 觸發情況的詳細日誌

3. **性能優化**
   - 考慮緩存小限宮位判斷結果
   - 避免重複計算

---

## 📚 相關文件

- `js/calc.js`: 主要實現文件
- `js/ui.js`: UI 層戰略建議聯動
- `NINE_LAYER_ARCHITECTURE.md`: 九層架構說明
- `L4_SPATIAL_AGGREGATION_COMPLETE.md`: L4 實作報告

---

## 💡 設計理念

L7 主觀頻率修正體現了紫微斗數的「個人化」核心：

1. **體感區分度**: 同樣的分數，對不同的人意義不同
2. **年度重心**: 小限宮位是當年的生命重心，影響更強烈
3. **波動感**: 小限宮位的變化會產生更強烈的體感

這使得系統不僅是「客觀評分」，更是「個人化戰略地圖」。

---

**最後更新**: 2026-02-04  
**實作版本**: 1.0
