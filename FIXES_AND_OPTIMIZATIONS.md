# 問題修復與優化建議報告

## ✅ 已修復的問題

### 1. 身主和命主顯示問題

**問題描述**：
- 命主和身主沒有分開顯示，只顯示命主，身主標籤不明確

**修復內容**：
- ✅ 修改 `js/ui/components/ziwei-grid.js`，分開顯示命主和身主
- ✅ 添加明確的標籤：「命主：xxx」和「身主：xxx」
- ✅ 實現了命主和身主的計算邏輯（`js/calc/helpers.js`）

**修復代碼位置**：
- `js/ui/components/ziwei-grid.js` (第152-160行)
- `js/calc/helpers.js` (新增 `calculateMingzhu` 和 `calculateShengong` 函數)

**命主計算規則**（根據命宮地支）：
- 子：貪狼
- 丑、亥：巨門
- 寅、戌：祿存
- 卯、酉：文曲
- 巳、未：武曲
- 辰、申：廉貞
- 午：破軍

**身主計算規則**（根據出生年地支）：
- 子、午：火星
- 丑、未：天相
- 寅、申：天梁
- 卯、酉：天同
- 巳、亥：天機
- 辰、戌：文昌

---

### 2. 宮位主星顯示「主星」占位符問題

**問題描述**：
- 許多宮位顯示「主星」而非實際星曜名稱
- 空宮時應顯示「空宮」而非「主星」

**修復內容**：
- ✅ 改進 `getPalaceMainStars` 函數，正確處理空宮情況
- ✅ 修改所有使用 `mainStars[0] || "主星"` 的地方，改為 `mainStars.length > 0 ? mainStars[0] : "空宮"`
- ✅ 更新 `getPalaceTrait` 函數，空宮時返回「空宮」而非「獨特」

**修復代碼位置**：
- `js/calc/consultationScriptEngine.js`：
  - `getPalaceMainStars` 函數（第23-54行）
  - `getPalaceTrait` 函數（第59行）
  - 所有 `generateQ` 函數中的主星顯示邏輯（Q1-Q15）

**改進邏輯**：
```javascript
// 修復前
const mainStar = mainStars[0] || "主星";

// 修復後
const mainStar = mainStars.length > 0 ? mainStars[0] : "空宮";
```

---

### 3. 命主/身主諮詢問題生成

**問題描述**：
- Q4 問題中命主和身主沒有分開，且計算邏輯簡化

**修復內容**：
- ✅ 重寫 `generateQ4` 函數，正確計算並分開顯示命主和身主
- ✅ 改進問題文本，明確區分命主（潛意識驅動力）和身主（後天行動模式）
- ✅ 添加命主和身主的數據到返回對象中

**修復代碼位置**：
- `js/calc/consultationScriptEngine.js` 的 `generateQ4` 函數（第211-260行）

---

## 🔍 其他潛在問題與優化建議

### 1. 空宮處理一致性

**現狀**：
- `ziweiPipeline.js` 中已有空宮處理邏輯（對宮借星）
- `consultationScriptEngine.js` 中空宮顯示為「空宮」
- 但兩者可能不一致

**建議**：
- ✅ 統一空宮處理邏輯：空宮時應檢查對宮是否有主星
- ✅ 在諮詢問題中，空宮可以顯示「空宮（借對宮xxx星）」

**相關代碼**：
- `js/calc/ziweiPipeline.js` (第402-461行)
- `js/calc/consultationScriptEngine.js` (第23-54行)

---

### 2. 星曜名稱標準化

**現狀**：
- 使用 `toTraditionalStarName` 進行標準化
- 但某些情況下可能仍有簡繁混用

**建議**：
- ✅ 確保所有星曜名稱都經過 `toTraditionalStarName` 處理
- ✅ 在 `getPalaceMainStars` 中加強名稱標準化邏輯
- ✅ 添加星曜名稱映射表的完整性檢查

**相關代碼**：
- `js/calc/helpers.js` 的 `toTraditionalStarName` 函數
- `data/star-name-trad.json`

---

### 3. 數據一致性檢查

**現狀**：
- 命主和身主可能從多個來源獲取（後端、計算）
- 需要確保數據一致性

**建議**：
- ✅ 優先使用後端提供的數據
- ✅ 如果後端沒有，再使用計算邏輯
- ✅ 添加數據驗證，確保命主和身主的值有效

**相關代碼**：
- `js/ui/components/ziwei-grid.js` (第131-160行)
- `js/calc/consultationScriptEngine.js` (第214-260行)

---

### 4. 錯誤處理與降級策略

**現狀**：
- 某些情況下如果計算失敗，可能顯示空白或錯誤值

**建議**：
- ✅ 添加更完善的錯誤處理
- ✅ 當計算失敗時，顯示「—」或「計算中...」
- ✅ 添加 console.warn 日誌，方便調試

**相關代碼**：
- `js/calc/helpers.js` 的 `calculateMingzhu` 和 `calculateShengong`
- `js/ui/components/ziwei-grid.js` 的顯示邏輯

---

### 5. 性能優化

**現狀**：
- `getPalaceMainStars` 在每個問題生成時都會調用
- 可能重複計算

**建議**：
- ✅ 考慮緩存主星數據
- ✅ 一次性計算所有宮位的主星，然後重複使用

**相關代碼**：
- `js/calc/consultationScriptEngine.js` 的 `generateConsultationScript` 函數

---

### 6. 測試覆蓋

**建議**：
- ✅ 添加單元測試，測試命主和身主的計算邏輯
- ✅ 測試空宮處理邏輯
- ✅ 測試星曜名稱標準化

---

## 📝 修復總結

### 已完成的修復：
1. ✅ 身主和命主分開顯示
2. ✅ 實現命主和身主的正確計算邏輯
3. ✅ 修復主星檢測問題（空宮顯示「空宮」而非「主星」）
4. ✅ 改進 Q4 諮詢問題生成

### 待優化項目：
1. ⏳ 空宮處理一致性
2. ⏳ 星曜名稱標準化加強
3. ⏳ 數據一致性檢查
4. ⏳ 錯誤處理完善
5. ⏳ 性能優化
6. ⏳ 測試覆蓋

---

## 🚀 下一步行動建議

1. **立即測試**：
   - 測試不同命宮地支的命主計算
   - 測試不同年支的身主計算
   - 測試空宮的顯示

2. **逐步優化**：
   - 先處理空宮一致性問題
   - 再優化性能
   - 最後添加測試

3. **文檔更新**：
   - 更新 API 文檔，說明命主和身主的計算規則
   - 更新用戶指南，說明空宮的含義
