# 命書統一文件：建議可行性評估與優先順序

## 建議 1：DB 加上 document_json 欄位

**可行性**：高。  
**影響**：migration 新增一欄、POST 與 GET API 各改一處、後台詳情優先讀 document_json。  
**建議**：**優先實作**。一鍵生成已產出完整 doc，只差寫入與讀取；舊列無 document_json 時 fallback 到 sections_json 組最小 doc（已實作），無需遷移舊資料。

---

## 建議 2：HTML renderer 抽成單一實作

**可行性**：中高，需一點建置與載入調整。  
**做法**：  
- 將「命書 HTML 樣板」放在一個中立檔（例如 `js/lifebook-html.js`）實作 `renderLifeBookDocumentToHtml(doc)`，以 UMD 或 ES module 匯出。  
- 後台：`lifeBookEngine.js` 改為呼叫該模組（或由 expert-admin 先載入該 script，`window.LifeBookHtml.renderLifeBookDocumentToHtml`）。  
- 前台：viewer 的 build 改為 import 同一支（或從同一來源編譯），避免兩份實作。  

**建議**：列為**下一階段**。目前兩邊結構已對齊，短期可維持；等有 PDF 或樣板改動頻繁時再抽成單一實作，效益更大。

---

## 建議 3：generator_version / schema_version 做成常數

**可行性**：高，改動小。  
**建議**：**優先實作**。在專案中共用常數（例如 `LIFEBOOK_SCHEMA_VERSION`、`LIFEBOOK_GENERATOR_VERSION`），組裝器與後台一鍵流程都從常數讀；未來改 prompt 或 schema 時只改一處，詳情頁也可顯示「此命書為 v1 schema」等。

---

## 建議 4：詳情頁 ExpertPanel 演變成專家工作台

**可行性**：高，屬功能迭代。  
**建議**：**中期**。骨架已有，可逐步加：  
- 分 tab：概覽 / 推論層（每章 infer 四欄）/ 模型用量（per_section token、model）  
- 單章「重新生成此章」按鈕，call Worker 只打該 section，再 patch doc  
這樣有助調整 prompt 與分析使用效果，不需一次做完。

---

## 建議 5：buildLifeBookDocument 小測試（smoke test）

**可行性**：高。  
**建議**：**優先實作**。組裝器是樞紐，可加幾則簡單測試：  
- 給簡化 chartJson + contentDb + lifeBookJson  
- 檢查 meta.schema_version、sections 的 star_palace_quotes 對應、expert 帶入  
用現有 test 跑法（例如 `node scripts/smoke-test-lifebook-assembler.cjs` 或 Vitest）即可，避免日後改結構時組裝器靜默壞掉。

---

## 建議優先順序（實作）

1. **建議 1**：migration 加 `document_json`，POST 存、GET 回傳，詳情優先使用。  
2. **建議 3**：集中定義 `LIFEBOOK_SCHEMA_VERSION`、`LIFEBOOK_GENERATOR_VERSION`，組裝器與後台引用。  
3. **建議 5**：為 `buildLifeBookDocument` 加 1～2 個 smoke test。  
4. **建議 4**：依需求逐步加強 ExpertPanel（tab、重新生成單章）。  
5. **建議 2**：有 PDF 或樣板維護成本變高時，再抽單一 HTML renderer。
