# 命書 Viewer 分析與計劃

## 一、目前前端已有的資源

### 1. 紫微宮位與星曜

| 資源 | 位置 | 說明 |
|------|------|------|
| **ZiweiGrid** | `js/ui/components/ziwei-grid.js` | `window.UiComponents.ZiweiGrid.renderZiwei(ziwei, horoscope, onPalaceClick, options)`：渲染 12 宮格、每宮主星/四化/五行標記、大限、小限標示。依賴 `window.Calc`, `UiRenderHelpers`, `UiDomHelpers`。 |
| **PalaceDetail** | `js/ui/components/palace-detail.js` | `selectPalace(name, options)`：選中宮位後顯示本宮/對宮/夾宮、星曜、四化、權重與戰略建議。 |
| **PalaceScores** | `js/ui/components/palace-scores.js` | `renderZiweiScores(scores, horoscope, ziwei, onPalaceClick)`：宮位分數條與雷達式排序，可點擊跳宮位。 |

以上皆為 **vanilla JS**，掛在 `window`，由主站 `js/ui.js` 與 `data-renderer.js` 驅動，需完整 `app.js`（Calc、常數、i18n）才能運行。

### 2. 五行雷達圖

| 資源 | 位置 | 說明 |
|------|------|------|
| **renderRadarChart** | `js/ui/utils/render-helpers.js` | `renderRadarChart(containerId, wx)`：依五行數值畫 SVG 雷達圖（木火土金水），需 DOM containerId。 |
| **renderBar** | 同上 | 五行長條圖。 |
| **DataRenderer.renderBaziData** | `js/ui/services/data-renderer.js` | 整合八字柱、表面/戰略五行條形與雷達、五行一句話、能量結構等，需 `bazi`（含 `wuxing.surface` / `wuxing.strategic`）。 |

雷達圖與條形圖皆依賴 `bazi.wuxing` 結構，與命書 API 回傳的 `chart_json` 相容（同一套 compute 產物）。

### 3. 命書 API 與既有輸出

- **generate-section** 回傳**單章**：`{ ok, section }`，`section` = `section_key`, `title`, `importance_level`, `structure_analysis`, `behavior_pattern`, `blind_spots`, `strategic_advice`, `star_palace_quotes?`。
- **generate** 回傳**整本**：`{ ok, sections }`，`sections` = `Record<section_key, SectionPayload>`，結構同上。
- **前端 HTML 組裝**：`js/calc/lifeBookEngine.js` 的 `renderHTML(weightAnalysisData, sections, chartJson)` 依模組分組、輸出權重摘要 + 每章（星曜評語 → 四欄），供下載與儲存。

Viewer 需能**匯入**上述 API 回傳（或已存命書的 `sections_json` + `weight_analysis`），**匯出**為同一格式或 HTML。

---

## 二、命書 Viewer 前端架構規劃

### 2.1 資料結構（與 API 一致）

```ts
// 單章
SectionPayload = {
  section_key: string;
  title: string;
  importance_level: "high" | "medium" | "low";
  structure_analysis: string;
  behavior_pattern: string;
  blind_spots: string;
  strategic_advice: string;
  star_palace_quotes?: Record<string, string>;
}

// API 整本回傳
LifeBookApiResponse = {
  ok: true;
  sections: Record<string, SectionPayload>;
}

// 含權重與命盤（可選，用於顯示或匯出）
LifeBookViewerState = {
  sections: Record<string, SectionPayload>;
  weight_analysis?: WeightAnalysis;
  chart_json?: Record<string, unknown>;
  meta?: { client_name?: string; birth_info?: string };
}
```

### 2.2 目錄結構

```
src/lifebook-viewer/
├── types.ts              # SectionPayload, WeightAnalysis, LifeBookViewerState
├── constants.ts          # SECTION_ORDER, MODULE_MAP（與 lifeBookEngine 一致）
├── utils/
│   ├── normalizeApiResponse.ts  # API 回傳 → LifeBookViewerState
│   └── importExport.ts          # 匯入 JSON / 匯出 JSON、HTML
├── hooks/
│   ├── useLifeBookData.ts       # 狀態：sections, weight, chart, setSections, …
│   └── useImportExport.ts      # 匯入檔案/貼上、匯出下載、列印
├── components/
│   ├── WeightSummary.tsx       # 權重摘要（優先/風險/穩定宮位）
│   ├── SectionCard.tsx         # 單章：標題、星曜評語、四欄
│   ├── ModuleGroup.tsx        # 模組標題 + 該組 SectionCard 列表
│   ├── LifeBookViewer.tsx      # 主版面：TOC + 內容區、匯入/匯出按鈕
│   └── ChartEmbed.tsx          # 選用：說明「命盤與五行請至首頁查看」或未來嵌入
├── App.tsx                     # 根：LifeBookViewer + 提供 hooks 資料
└── index.tsx                   # React 掛載點
```

### 2.3 與現有紫微/五行的整合方式

- **Viewer 第一版**：只負責「命書內容」與「權重摘要」的閱讀與匯入/匯出；不內嵌紫微盤與五行雷達，避免依賴整包 `app.js`。
- **進階**：同一頁可載入 `app.js` 並傳入 `chart_json`，由既有 `renderZiwei` / `renderRadarChart` 渲染到指定容器（需與 React 共存）；或提供「在首頁開啟此命盤」連結（帶 chart 快取或 ID）。  
  計畫中以 **ChartEmbed** 預留區塊與說明，之後可接 chart_json 與現有元件。

---

## 三、Import / Export 規格

### 3.1 匯入

- **來源**：  
  - 檔案選擇：使用者選一個 `.json`。  
  - 貼上：文字框貼 JSON 字串。
- **支援格式**：  
  - 直接 `{ ok: true, sections: { ... } }`（generate 回傳）；  
  - 或 `{ sections: { ... }, weight_analysis?: { ... }, chart_json?: { ... } }`（已存命書/自存格式）。  
- **正規化**：`normalizeApiResponse(raw)` → `LifeBookViewerState`（補預設、過濾無效章節）。

### 3.2 匯出

- **JSON**：將當前 `LifeBookViewerState` 序列化下載（檔名含日期或 client_name）。  
- **HTML**：與 `LifeBookEngine.renderHTML` 邏輯一致（權重 + 模組分組 + 星曜評語 + 四欄），由 `utils/importExport.ts` 的 `exportHtml(state)` 產出字串並觸發下載。  
- **列印**：以當前 React 渲染內容開新視窗列印（可只印命書區塊）。

---

## 四、可行性評估

| 項目 | 評估 |
|------|------|
| **資料流** | API 回傳與現有 `renderHTML` 結構一致，正規化與 state 設計直接可行。 |
| **React 獨立性** | Viewer 僅依賴 sections + weight_analysis，不依賴 Calc/ziwei-grid，可單獨建 bundle（如 `dist/lifebook-viewer.js`）。 |
| **紫微/五行** | 不內嵌則無額外風險；內嵌需載入主站 bundle 或抽離共用模組，建議第二階段再做。 |
| **匯出 HTML** | 可將 `lifeBookEngine.js` 的 moduleMap/標題/星曜區塊邏輯在 TypeScript 複用或呼叫 `window.LifeBookEngine.renderHTML`（若同頁已載入）；或完全在 viewer 內實作一份，避免依賴舊 bundle。 |
| **部署** | 獨立頁 `lifebook-viewer.html` + Vite entry，建置成單一 JS，與現有 expert-admin、main 並存。 |

**結論**：命書 React viewer（閱讀 + 權重 + 匯入/匯出 + 可選 HTML 匯出）**可行且建議獨立實作**；紫微/五行雷達以「連結至首頁」或後續再嵌入為宜。

---

## 五、實作完成清單與使用方式

### 已產生檔案

| 路徑 | 說明 |
|------|------|
| `src/lifebook-viewer/types.ts` | SectionPayload、WeightAnalysis、LifeBookViewerState |
| `src/lifebook-viewer/constants.ts` | SECTION_ORDER、MODULE_MAP |
| `src/lifebook-viewer/utils/normalizeApiResponse.ts` | API/JSON 正規化為 state |
| `src/lifebook-viewer/utils/loadDemoLifeBook.ts` | 載入示範命書（fetch `./demo-lifebook.json`，不呼叫 API） |
| `src/lifebook-viewer/utils/importExport.ts` | 匯入檔案、匯出 JSON/HTML、列印 |
| `public/demo-lifebook.json` | 內建示範命書（符合 normalizeApiResponse 輸入格式） |
| `src/lifebook-viewer/hooks/useLifeBookData.ts` | 命書 state 與 setState |
| `src/lifebook-viewer/hooks/useImportExport.ts` | 匯入/匯出/列印 操作 |
| `src/lifebook-viewer/components/WeightSummary.tsx` | 權重摘要區塊 |
| `src/lifebook-viewer/components/SectionCard.tsx` | 單章（星曜評語 + 四欄） |
| `src/lifebook-viewer/components/ModuleGroup.tsx` | 模組標題 + 章節列表 |
| `src/lifebook-viewer/components/ChartEmbed.tsx` | 命盤/五行說明（預留） |
| `src/lifebook-viewer/components/LifeBookViewer.tsx` | 主版面（TOC、匯入/匯出、列印） |
| `src/lifebook-viewer/App.tsx` | 根元件 |
| `src/lifebook-viewer/index.tsx` | React 掛載點 |
| `vite.lifebook-viewer.config.ts` | Vite 建置設定 |
| `lifebook-viewer.html` | 命書 Viewer 頁面 |

### 指令

- **開發**：`npm run dev:lifebook-viewer`，再開啟 `http://localhost:5173/lifebook-viewer.html`
- **建置**：`npm run build:lifebook-viewer` → `dist/lifebook-viewer.html`、`dist/lifebook-viewer.js`

### 匯入格式

- API 回傳：`{ ok: true, sections: { s01: {...}, ... } }`
- 或含 `weight_analysis`、`chart_json`、`meta`、`sections_json` 的完整 state JSON

### 部署注意

若站點根目錄為專案根（如 `wrangler pages deploy .`），上線後需讓 `lifebook-viewer.html` 能載入 JS：可將建置後的 `dist/lifebook-viewer.html` 複製到根目錄，並將內嵌 script 改為 `src="dist/lifebook-viewer.js"`；或將 Pages 的 build 輸出目錄設為 `dist` 並以 `dist` 為根對外提供。示範命書需可被讀取：建置時 Vite 會將 `public/demo-lifebook.json` 複製到 `dist/`，若部署 `dist` 為根則 `/demo-lifebook.json` 可用；若部署專案根，請確保 `/demo-lifebook.json` 可存取（例如將 `public/demo-lifebook.json` 複製到根目錄或設定靜態路由）。

---

## 六、目前上線策略

- **命書 HTML Viewer 已對外開放**：任何人可開啟 Viewer 頁面，體驗完整閱讀介面（權重摘要、章節、匯入/匯出、列印）。
- **命書生成功能尚未開放**：前端**不提供**「一鍵生成命書」、不呼叫 infer/generate 等 API，亦無金流或登入流程。使用者僅能：
  - 點「查看示範命書」載入內建 `demo-lifebook.json` 體驗；
  - 或匯入已存在的命書 JSON（檔案／貼上）。
- **後續**：待金流與權限機制就緒後，再於其他頁面（例如專家後台或付費流程）開放「生成命書」API 與按鈕；Viewer 維持為純閱讀與匯入工具。

### 命盤與五行（iframe 嵌入）

- **ChartEmbed** 改為以 **iframe** 嵌入主站命盤示範頁，不再在 React 內直接呼叫 `UiComponents.ZiweiGrid` 或 `UiRenderHelpers.renderRadarChart`。
- 示範頁 URL 由 **`LIFEBOOK_DEMO_CHART_URL`**（`src/lifebook-viewer/constants.ts`）設定，預設為 `/ziwei/demo-lifebook`；可依實際主站路由修改。
- Viewer 頁面**不再載入 app.js**，也無需 `.zw-grid-container` / `.zw-palace` 等樣式，命盤與五行完全由 iframe 內頁面負責。
- 主站需提供對應路由（例如 `/ziwei/demo-lifebook`），該頁面載入示範命盤資料並顯示紫微盤與五行雷達圖；與命書 Viewer 共用同一組示範命書概念即可。
