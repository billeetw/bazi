# 命書正式版：可直接使用嗎？還缺什麼？

## 可以直接使用

在以下條件都滿足時，**現在就可以當正式版用**：

1. **已部署**  
   - Worker 與專家後台已部署（含 `npm run build:expert-admin` 產生的 `dist/expert-admin.js`，內含 `lifeBookPalaceConstants.js`）。

2. **使用流程**  
   - 在專家後台輸入出生資料 → 點「計算」→ 再點「一鍵生成命書」。  
   - 計算完成後 `window.contract.bazi` 會有四柱天干；生成命書時會自動呼叫 `assignTenGodByPalace(chartJson.bazi)` 並把結果塞進 `chart_json.tenGodByPalace` 送給 Worker。

3. **沒補也照樣跑**  
   - 若八字資料缺天干、或尚未 build 專家後台，命書仍會正常生成，只是各章不會帶「十神」context，〈技術依據〉只會有星曜與四化，不會有十神那一行。

---

## 還缺什麼（可選）

| 項目 | 狀態 | 說明 |
|------|------|------|
| **十神 × 12 宮** | ✅ 已接好 | 專家後台一鍵生成時會自動算並帶入 `tenGodByPalace`，Worker 已吃得到。 |
| **五行 × 12 宮（wuxingByPalace）** | ⚪ 未接 | Worker 已支援「有傳就用」；目前沒有任何地方計算並傳入 `chart_json.wuxingByPalace`。若要完整三維，需實作 `assignWuxingByPalace(ziwei 或 bazi)`（例如依紫微 12 宮地支→五行），並在組裝 `chart_json` 時一併塞入。 |
| **主站／其他入口生成命書** | ⚪ 視需求 | 目前只有專家後台會送 `generate-section` 並在送前注入 `tenGodByPalace`。若日後主站或別頁也呼叫同一支 API 生成命書，需在該處同樣在 `chart_json` 上加上 `tenGodByPalace`（必要時也可加 `wuxingByPalace`）。 |
| **專家後台 build** | 必須一次 | 正式上線前需執行 `npm run build:expert-admin`，否則新加的 `lifeBookPalaceConstants.js` 不會在 bundle 裡，一鍵生成時不會有十神。 |

---

## 一句話結論

- **正式版可以直接用**：部署含專家後台 build，用專家後台「計算 → 一鍵生成命書」即會帶入十神，其餘行為與先前一致。  
- **可選補齊**：若要〈技術依據〉也出現「五行」那一行，再補 `wuxingByPalace` 的計算與注入即可。
