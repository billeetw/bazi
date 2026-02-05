# 系統架構評估報告

## 📊 當前狀態分析

### 文件規模
- **calc.js**: 2,292 行（51 個函數）
- **ui.js**: 2,065 行（34 個函數 + 184 個 DOM 操作）
- **identifyBirthTime.js**: 162 行
- **strategyConfig.js**: 48 行
- **總計**: 4,567 行

### 架構模式
- ✅ **IIFE 模組化**: 使用立即執行函數表達式，避免全局污染
- ✅ **職責分離**: calc.js（計算邏輯）與 ui.js（UI 渲染）分離
- ✅ **九層架構**: 已實現 Pipeline 模式，邏輯清晰
- ⚠️ **單文件過大**: calc.js 和 ui.js 都超過 2000 行

---

## 🔍 問題診斷

### 1. **單文件過大（臃腫風險）**

#### calc.js (2,292 行)
**問題**:
- 包含所有計算邏輯：紫微、八字、五行、流月、星等映射
- 51 個函數集中在一個文件
- 難以快速定位特定功能

**影響**:
- 代碼審查困難
- Git 衝突頻繁
- 加載時間較長（雖然有 IIFE 優化）

#### ui.js (2,065 行)
**問題**:
- 包含所有 UI 渲染邏輯
- 184 個 DOM 操作點
- 事件處理、動畫、狀態管理混在一起

**影響**:
- 難以維護特定 UI 組件
- 事件綁定分散，難以追蹤
- 樣式與邏輯耦合

---

### 2. **職責邊界模糊**

#### calc.js 中的 UI 相關代碼
- `generateMonthStrategyTag`: 生成 UI 標籤（應屬於 UI 層）
- `finalizeStarRating`: 語義輸出（介於計算與 UI 之間）

#### ui.js 中的計算邏輯
- `getStarRating`: 星等計算（應屬於 calc.js）
- `riskToEnergyColor`: 顏色映射（可提取為配置）

---

### 3. **重複代碼**

#### 重複的輔助函數
- `parseMonthFromRange`: 在 calc.js 和 ui.js 中都有實現
- `esc` (HTML 轉義): 在多個地方重複定義
- 顏色映射邏輯分散在多處

#### 重複的數據結構
- 宮位映射表可能重複定義
- 星等映射邏輯在多處實現

---

### 4. **全局狀態管理**

#### window 對象使用
- `window.Calc`: 模組導出（合理）
- `window.ziweiPalaceMetadata`: 全局狀態（可優化）
- `window.ziweiScores`: 全局緩存（可優化）
- `window.currentSelectedPalace`: 臨時狀態（應本地化）

**問題**:
- 全局狀態難以追蹤變化
- 可能導致內存洩漏
- 測試困難

---

### 5. **依賴關係複雜**

```
ui.js → calc.js (依賴計算邏輯)
ui.js → window.Calc (51 個導出函數)
ui.js → DOM API (184 個操作點)
calc.js → ziweiWeights.json (異步載入)
calc.js → 多個常數映射表
```

**問題**:
- 依賴鏈過長
- 難以進行單元測試
- 循環依賴風險

---

## ✅ 架構優勢

### 1. **九層 Pipeline 架構**
- ✅ 邏輯清晰，易於擴展
- ✅ 職責分離良好
- ✅ 符合單一職責原則

### 2. **模組化設計**
- ✅ IIFE 避免全局污染
- ✅ 明確的導出接口
- ✅ 依賴注入清晰

### 3. **向後兼容**
- ✅ 保持 API 不變
- ✅ 漸進式重構
- ✅ 文檔完善

---

## 🚀 優化建議

### 優先級 1: 立即優化（低風險、高收益）

#### 1.1 提取重複代碼
```javascript
// 創建 js/utils.js
export function parseMonthFromRange(range) { ... }
export function escHtml(str) { ... }
export function getColorFromCode(code) { ... }
```

**收益**: 減少重複，統一邏輯

#### 1.2 提取配置常量
```javascript
// 創建 js/config.js
export const COLOR_MAP = { ... }
export const STATUS_LABELS = { ... }
export const PALACE_MAPPING = { ... }
```

**收益**: 集中管理，易於修改

#### 1.3 優化全局狀態
```javascript
// 使用命名空間
window.BaziApp = {
  state: {
    ziweiPalaceMetadata: {},
    currentSelectedPalace: null
  },
  // 提供狀態管理方法
  setState(key, value) { ... },
  getState(key) { ... }
}
```

**收益**: 狀態可追蹤，易於調試

---

### 優先級 2: 中期重構（中風險、中收益）

#### 2.1 拆分 calc.js
```
calc.js (2,292 行)
├── core/
│   ├── ziwei-core.js      (L1-L3: 基礎計算)
│   ├── ziwei-spatial.js   (L4: 空間連動)
│   ├── ziwei-sihua.js     (L6: 四化)
│   ├── ziwei-penalty.js   (L8: 雜曜神煞)
│   └── ziwei-output.js    (L9: 語義輸出)
├── bazi/
│   ├── bazi-core.js       (八字核心計算)
│   └── bazi-wuxing.js     (五行計算)
├── liuyue/
│   └── liuyue-rating.js   (流月星等)
└── utils/
    ├── constants.js       (常數定義)
    └── helpers.js         (輔助函數)
```

**收益**: 
- 單文件 < 500 行
- 職責清晰
- 易於維護

#### 2.2 拆分 ui.js
```
ui.js (2,065 行)
├── components/
│   ├── palace-scores.js   (宮位強度渲染)
│   ├── palace-detail.js   (宮位詳解)
│   ├── liuyue-month.js    (流月卡片)
│   ├── wuxing-bars.js     (五行條形圖)
│   └── startup-sequence.js (入場動畫)
├── handlers/
│   ├── palace-click.js    (宮位點擊處理)
│   ├── sheet-toggle.js    (底部面板切換)
│   └── form-submit.js     (表單提交)
└── utils/
    ├── dom-helpers.js     (DOM 操作工具)
    └── render-helpers.js  (渲染輔助)
```

**收益**:
- 組件化，易於重用
- 事件處理集中
- 易於測試

---

### 優先級 3: 長期優化（高風險、高收益）

#### 3.1 引入構建工具
```javascript
// 使用 Rollup/Webpack 打包
// 支持 ES6 modules
import { computePalaceScore } from './core/ziwei-core.js';
import { renderPalaceScores } from './components/palace-scores.js';
```

**收益**:
- 代碼分割
- Tree-shaking
- 更好的開發體驗

#### 3.2 狀態管理庫
```javascript
// 使用輕量級狀態管理（如 Zustand）
import { create } from 'zustand';

const useBaziStore = create((set) => ({
  ziweiPalaceMetadata: {},
  setPalaceMetadata: (data) => set({ ziweiPalaceMetadata: data }),
}));
```

**收益**:
- 狀態可追蹤
- 響應式更新
- 易於測試

#### 3.3 TypeScript 遷移
```typescript
// 逐步遷移，先從核心模組開始
interface PalaceScore {
  name: string;
  score: number;
  stars: number;
  // ...
}
```

**收益**:
- 類型安全
- 更好的 IDE 支持
- 減少運行時錯誤

---

## 📋 實施路線圖

### 階段 1: 清理重複（1-2 週）
1. ✅ 提取 `parseMonthFromRange` 到 utils
2. ✅ 提取 `escHtml` 到 utils
3. ✅ 提取顏色映射到 config
4. ✅ 統一全局狀態管理

### 階段 2: 拆分大文件（2-4 週）
1. ✅ 拆分 calc.js 為核心模組
2. ✅ 拆分 ui.js 為組件模組
3. ✅ 保持向後兼容
4. ✅ 更新文檔

### 階段 3: 優化架構（4-8 週）
1. ⚠️ 引入構建工具（可選）
2. ⚠️ 狀態管理庫（可選）
3. ⚠️ TypeScript 遷移（可選）

---

## 🎯 關鍵指標

### 當前指標
- **單文件最大行數**: 2,292 行（calc.js）
- **函數數量**: 85+ 個
- **全局狀態**: 5+ 個
- **重複代碼**: ~3 處

### 目標指標
- **單文件最大行數**: < 500 行
- **函數數量**: 每個模組 < 10 個
- **全局狀態**: < 2 個（通過狀態管理）
- **重複代碼**: 0 處

---

## 💡 建議優先級

### 🔴 高優先級（立即執行）
1. **提取重複代碼** - 風險低，收益高
2. **優化全局狀態** - 風險低，收益中
3. **提取配置常量** - 風險低，收益中

### 🟡 中優先級（1-2 個月內）
1. **拆分 calc.js** - 風險中，收益高
2. **拆分 ui.js** - 風險中，收益高
3. **組件化 UI** - 風險中，收益中

### 🟢 低優先級（長期規劃）
1. **引入構建工具** - 風險高，收益中
2. **TypeScript 遷移** - 風險高，收益高
3. **狀態管理庫** - 風險中，收益中

---

## 📝 結論

### 當前狀態
- ✅ **架構合理**: 九層 Pipeline 設計良好
- ⚠️ **文件過大**: 單文件超過 2000 行
- ⚠️ **有優化空間**: 重複代碼、全局狀態可優化

### 建議
1. **短期**: 提取重複代碼，優化全局狀態（1-2 週）
2. **中期**: 拆分大文件為模組（2-4 週）
3. **長期**: 考慮構建工具和 TypeScript（可選）

### 風險評估
- **低風險**: 提取重複代碼、優化全局狀態
- **中風險**: 拆分大文件（需確保向後兼容）
- **高風險**: 引入新工具鏈（需團隊學習成本）

---

**評估日期**: 2026-02-04  
**評估人**: AI Assistant  
**下次評估**: 完成階段 1 後
