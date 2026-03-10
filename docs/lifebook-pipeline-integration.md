# 命書流水線整合：Viewer + GPT 命書系統

## 可行性與效益

### 可行性

- **Viewer 已吃結構化 state**：`LifeBookViewerState` = `sections` + `weight_analysis` + `chart_json` + `meta`，與 Worker 回傳的 20 章 + 四欄完全對應。
- **Worker 命書 API 已定型**：`/api/life-book/generate` 或 20 次 `/api/life-book/generate-section` 回傳 `{ ok, sections }`，每章含四欄（structure_analysis, behavior_pattern, blind_spots, strategic_advice），Worker 可選填 `star_palace_quotes`。
- **內容 DB 與命盤分離**：`/content/2026` 的 `starPalaces`（星曜_宮位評語）可與 `chartJson.ziwei.mainStars` 在前端組裝，無需 GPT 輸出該段長文案，token 與一致性都更好。
- **單一入口**：組裝後只產生一份 `LifeBookDocument`，viewer 只負責「怎麼顯示」，不負責「去哪裡拿資料、怎麼組」。

### 效益

1. **職責分離**：Viewer 專注排版與章節切換；組裝（命盤 + DB + GPT）集中在 `buildLifeBookDocument`。
2. **星曜評語一致**：StarPalace 評語一律來自 content DB + 命盤 mainStars，避免 GPT 重寫或漏寫。
3. **易於測試與除錯**：可單獨測組裝器（給定 chartJson / contentDb / lifeBookJson → doc），再測 viewer（給定 doc → 畫面）。
4. **未來擴充**：若要改章節順序、新增欄位或改用 HTML 區塊，只需改組裝器與型別，viewer 可保持不變或小幅擴充。

---

## 1. LifeBookDocument 型別定義

與既有 `LifeBookViewerState` 同構，viewer 直接吃此結構：

```ts
// src/lifebook-viewer/types.ts

export type LifeBookDocument = LifeBookViewerState;

export interface LifeBookViewerState {
  sections: Record<string, SectionPayload>;
  weight_analysis?: WeightAnalysis | null;
  chart_json?: Record<string, unknown> | null;
  meta?: { client_name?: string; birth_info?: string } | null;
}

export interface SectionPayload {
  section_key: string;
  title: string;
  importance_level: "high" | "medium" | "low";
  structure_analysis: string;
  behavior_pattern: string;
  blind_spots: string;
  strategic_advice: string;
  star_palace_quotes?: Record<string, string>;
}
```

---

## 2. 組裝模組：lifebook-assembler

**位置**：`src/lifebook-viewer/utils/lifebook-assembler.ts`

**職責**：

- 從 `lifeBookJson.sections` 取出 20 章（四欄由 GPT 產生）。
- 針對每章 `section_key`：依 `SECTION_PALACE_FOCUS`（與 worker lifeBookTemplates 一致）從 `chartJson.ziwei.mainStars` 取得該章宮位星曜，組成「星曜_宮位」key；再從 `contentDb.starPalaces` 取出對應評語，寫入 `section.star_palace_quotes`。
- 回傳 `{ sections, weight_analysis, chart_json, meta }` 即 `LifeBookDocument`。

**簽名**：

```ts
export function buildLifeBookDocument(params: {
  chartJson: Record<string, unknown> | null | undefined;
  contentDb: { starPalaces?: Record<string, string> | null } | null | undefined;
  lifeBookJson: {
    ok?: boolean;
    sections?: Record<string, Partial<SectionPayload>>;
    weight_analysis?: WeightAnalysis | null;
    meta?: { client_name?: string; birth_info?: string } | null;
  } | null | undefined;
  meta?: { client_name?: string; birth_info?: string } | null;
}): LifeBookDocument;
```

- `chartJson`：來自 `/compute/all` 的 `payload.features`（或含 `ziwei.mainStars` 的命盤物件）。
- `contentDb`：來自 `GET /content/2026?locale=...` 的 `{ starPalaces }`。
- `lifeBookJson`：來自 `POST /api/life-book/generate` 的整本回傳（或 20 次 generate-section 自行合併的 `sections`）。
- 若某章無 `palace_focus`（如 s03 五行、s15 大限），該章不組 `star_palace_quotes`。

---

## 3. Viewer 初始化與「取得 doc 並塞進 viewer」

Viewer **不再自己 call API 或組字串**；由外部流水線產出 `LifeBookDocument` 後傳入。

### 方式 A：掛載前注入（同頁或父頁流水線）

1. 先取得：
   - `chartJson`：例如 `await apiService.computeAll(...)` 的 `payload.features`，或既有命盤物件（需含 `ziwei.mainStars`）。
   - `contentDb`：`await fetch(API_BASE + '/content/2026?locale=zh-TW').then(r => r.json())`，取 `result`（或 `.content`，依實際 API 回傳）。
   - `lifeBookJson`：`await fetch(API_BASE + '/api/life-book/generate', { method: 'POST', body: JSON.stringify({ chart_json: chartJson, weight_analysis }) }).then(r => r.json())`。
2. 組裝：
   ```js
   const doc = window.buildLifeBookDocument({ chartJson, contentDb, lifeBookJson, meta });
   ```
   （`buildLifeBookDocument` 在 viewer bundle 載入後會掛在 `window`。）
3. 傳給 viewer：
   - 若在**同一頁**先跑流水線再掛載 React：  
     `window.__LIFEBOOK_INITIAL_STATE__ = doc;`  
     然後載入 viewer 的 script，React 掛載時 `App` 會讀 `window.__LIFEBOOK_INITIAL_STATE__` 當作初始 state。
   - 若在**不同頁**（例如主站排盤完成後跳轉命書頁）：將 `doc` 放進 `sessionStorage`：  
     `sessionStorage.setItem('lifebook_doc', JSON.stringify(doc)); location.href = '/lifebook-viewer.html';`  
     Viewer 掛載時會自動從 `sessionStorage.getItem('lifebook_doc')` 讀取並作為初始命書顯示（見 `App.tsx` 的 `getInitialDocument`）。

### 方式 B：React 傳入 initialDocument

若命書頁由 React 根元件渲染，且流水線在父層執行：

```tsx
const doc = buildLifeBookDocument({ chartJson, contentDb, lifeBookJson, meta });
createRoot(rootEl).render(<App initialDocument={doc} />);
```

`App` 會將 `initialDocument` 傳給 `useLifeBookData(initial)`，viewer 即以該 doc 為初始內容。

### 方式 C：匯入／貼上（既有流程）

使用者「匯入命書 JSON」或「貼上 JSON」時，仍走既有 `onImport(next)`，`next` 可為已存命書格式（含 `sections`、可選 `weight_analysis`、`chart_json`、`meta`）。若該 JSON 是流水線產出的 `LifeBookDocument`，無需再組裝，直接顯示。

---

## 4. 若未來要改成「HTML 區塊」section.html

- 可在 `buildLifeBookDocument` 內，對每章多產一個 `section.html`：用既有 lifebook-renderer 邏輯把「星曜列表 + 星曜評語 + 四欄分析」拼成 HTML 字串，寫入 `section.html`。
- Viewer 該章改為用 `dangerouslySetInnerHTML` 或 template 只渲染 `section.html`，不再個別渲染四欄與 `star_palace_quotes`。目前實作仍為「四欄 + star_palace_quotes」結構化渲染，無需改 viewer 即可上線。

---

## 5. 檔案一覽

| 項目 | 路徑 |
|------|------|
| 型別 `LifeBookDocument` | `src/lifebook-viewer/types.ts` |
| 組裝器 `buildLifeBookDocument` | `src/lifebook-viewer/utils/lifebook-assembler.ts` |
| Viewer 根元件（接受 `initialDocument`） | `src/lifebook-viewer/App.tsx` |
| 入口（暴露 `window.buildLifeBookDocument`、讀 `__LIFEBOOK_INITIAL_STATE__`） | `src/lifebook-viewer/index.tsx` |
| 章節順序 / 宮位聚焦 | `lifebook-assembler.ts` 內 `SECTION_ORDER`、`SECTION_PALACE_FOCUS`（與 worker lifeBookTemplates 一致） |

---

*文件依目前實作整理，若 API 或章節設定異動請同步更新組裝器與此說明。*
