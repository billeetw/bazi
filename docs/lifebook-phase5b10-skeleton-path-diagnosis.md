# Phase 5B-10：12 宮最終骨架路徑定位

## 目標

實際輸出仍顯示【動態引動與根因】而非新版【四化引動】+【宮干飛化】，需確認最終 render 用的 skeleton 來源與 placeholder 是否接上。

## 任務 1：實際 render 用的 skeleton 來自哪裡

### 資料流

1. **content 來源**：`getContentForLocale(env, locale)`  
   - **KV**：快取（key `content:zh-TW`），可能為舊 deploy 前寫入，內容可能含舊骨架。  
   - **D1**：`mergeContent(staticContent, buildContentFromRows(rows))`，`lifebookSection` 由 `mergeLifebookSections(D1, static)` 合併，**static 覆蓋 D1**，故理論上骨架以靜態 JSON 為準。  
   - **static**：`worker/content/lifebookSection-zh-TW.json`（import 為 `lifebookSectionZhTw`）+ `contentZhTw.lifebookSection`，後者被前者覆蓋，故**靜態 = lifebookSection-zh-TW.json**。

2. **Reader 路徑**：  
   - `getPalaceSectionReaderOverrides(sectionKey, chartJson, config, sectionContent, locale, findings)`  
   - `sectionSkeleton = content.lifebookSection?.[sectionKey]` → 即上述 content 的該 section 骨架。  
   - `resolvedStructureAnalysis = resolveSkeletonPlaceholders(sectionSkeleton.structure_analysis, placeholderMap)`  
   - 若 `overrides.resolvedStructureAnalysis` 有值，則 `structureAnalysisOut = overrides.resolvedStructureAnalysis`，否則用 AI 回傳的 `four.structure_analysis`（可能含舊標題）。

### 可能原因

| 情況 | 說明 |
|------|------|
| **KV 快取為舊版** | 若 content 來自 KV 且快取是 deploy 前寫入，則 KV 內的 `lifebookSection` 可能是舊骨架（【動態引動與根因】+ `{palaceSihuaSummaryBlock}`）。 |
| **D1 覆蓋 static** | 目前程式為 static 覆蓋 D1，若實務上合併順序或 D1 結構不同，需以 log 確認。 |
| **AI 覆寫** | 僅在 `overrides.resolvedStructureAnalysis` 為空時才會用 AI 的 `four.structure_analysis`；若 AI 回傳含【動態引動與根因】，且 resolved 為空，就會出現舊標題。 |
| **其他 locale 檔** | 目前 12 宮骨架僅在 zh-TW 的 lifebookSection-zh-TW.json 更新，若實際請求為 zh-CN 或 en 且用不同 JSON，也會影響。 |

---

## 任務 2 & 3：診斷 log 位置與解讀

已加入下列 log（僅 兄弟宮 s01、僕役宮 s09、官祿宮 s11）：

### A. getContentForLocale（content 來源）

- **時機**：取得 content 後（KV / D1 / static 三路徑都會打）。
- **Log**：`[getContentForLocale Phase5B-10] source=<kv|d1|static> sectionKey=<s01|s09|s11> hasNew=<true|false> hasOld=<true|false> snippet=<structure_analysis 前 180 字>`  
- **解讀**：  
  - `hasNew=true`：skeleton 含「四化引動」與「宮干飛化」→ 新版。  
  - `hasOld=true`：skeleton 含「動態引動與根因」→ 舊版。  
  - 若 **source=kv** 且 **hasOld=true** → 極可能為 **KV 快取舊 content**。

### B. getPalaceSectionReaderOverrides（reader 用的 skeleton）

- **時機**：取得 `sectionSkeleton` 後、resolve 前。
- **Log**：`[getPalaceSectionReaderOverrides Phase5B-10] sectionKey=... skeletonHasNew=... skeletonHasOld=... structure_analysis(0..200)=...`  
- **解讀**：確認傳入 `resolveSkeletonPlaceholders` 的模板是新版還是舊版。

### C. getPlaceholderMapFromContext（placeholder 是否有新 key）

- **時機**：設好 `palaceSihuaPlacementBlock`、`palaceSihuaFlowBlock` 後。
- **Log**：`[getPlaceholderMapFromContext Phase5B-10] sectionKey=... palaceSihuaPlacementBlock(0..80)=... palaceSihuaFlowBlock(0..80)=... palaceSihuaSummaryBlock=...`  
- **解讀**：  
  - `palaceSihuaSummaryBlock=(no key)` 為預期（Phase 5B-9 已移除）。  
  - 若新 key 有內容、skeleton 也是新版，但最終仍為舊標題 → 可能是 resolved 沒被採用（例如 overrides 為空，改用 AI 回傳）。

### D. index 最終輸出（單章與 batch）

- **時機**：`structureAnalysisOut` 定稿、組好 `section` / `sectionPayload` 並回傳前。
- **Log**：`[life-book/generate-section Phase5B-10]` 或 `[life-book/generate Phase5B-10] sectionKey=... finalHasNew=... finalHasOld=... structure_analysis(0..400)=...`  
- **解讀**：  
  - **finalHasOld=true** → 最終送進 render 的仍是舊版。  
  - 對照 A/B/C：若 A/B 已是新版但 D 為舊版，表示中間被覆寫（例如沒走 overrides.resolvedStructureAnalysis）；若 A 就 hasOld，則問題在 content 來源（KV/D1/static）。

---

## 任務 4：最小修正點判斷

依 log 對照表：

| A getContentForLocale | B reader skeleton | C placeholder | D 最終輸出 | 最小修正點 |
|-----------------------|-------------------|--------------|------------|------------|
| hasOld=true (e.g. kv) | hasOld=true       | —            | hasOld=true | **KV 快取或 content 來源**：清 KV 或改 content 來源，讓 skeleton 來自新版 JSON。 |
| hasNew=true           | hasOld=true       | —            | hasOld=true | **content 傳遞或 sectionKey 對應錯誤**：確認傳入 getPalaceSectionReaderOverrides 的 content 與 sectionKey 一致。 |
| hasNew=true           | hasNew=true       | 新 key 有值   | hasOld=true | **Reader 路徑未採用 resolved**：檢查 overrides.resolvedStructureAnalysis 是否為空、是否被正確賦值給 structureAnalysisOut。 |
| hasNew=true           | hasNew=true       | 新 key 有值   | hasNew=true | 骨架與 placeholder 皆正確，若畫面上仍舊版，問題在**前端或別條 API**。 |

---

## 實作摘要

- **index.ts**：  
  - 在 `getContentForLocale` 的 KV / D1 / static 三處回傳前，對 s01/s09/s11 打 log（skeleton 片段、hasNew、hasOld）。  
  - 單章回傳前：`PALACE_SECTION_KEYS` 且 sectionKey 為 s01/s09/s11 時，打 log 最終 `structure_analysis` 片段與 hasNew/hasOld。  
  - Batch 回傳前：同上，對 s01/s09/s11 打 log。
- **lifeBookPrompts.ts**：  
  - `getPalaceSectionReaderOverrides`：對 s01/s09/s11 打 log sectionSkeleton.structure_analysis 與 hasNew/hasOld。  
  - `getPlaceholderMapFromContext`：對 s01/s09/s11 打 log palaceSihuaPlacementBlock、palaceSihuaFlowBlock、palaceSihuaSummaryBlock（前 80 字或 "(no key)"）。

請在實際請求 兄弟宮(s01)、僕役宮(s09)、官祿宮(s11) 後，依上述 log 對照本表即可定位是最新 skeleton 沒被使用、reader 覆蓋、還是 placeholder 沒接上。
