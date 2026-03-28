# 命書 Viewer：首頁殼（Home Shell）與 12 宮／詳解分流

本文件說明：若將 `lifebook-decision-tree-demo.html` 的視覺與資訊層級視為 **Viewer 首頁**，應如何調整職責、資料接線與導向「12 宮詳解／更細章節」。

---

## 1. 首頁應只做一件事：**「當下時空錨點」**

| 區塊 | 建議職責 | 不建議塞進首頁的內容 |
|------|----------|----------------------|
| 每日膠囊 | 流日／高頻提醒（短句、可快取） | 整段命理解析 |
| 年度卡片 | **當年**主題、宜忌、一句話代價、進度感 | 12 宮逐宮長文 |
| 生命時空導航 | 時間軸節點（今年、明年、大限年…） | 宮位全文；點節點應 **導向** 詳細頁或 modal |
| 付費／告警彈窗 | 轉化或風險提示（與產品策略一致） | 替代完整章節 |

**原則**：首頁 = 儀表板 + 導航；**閱讀與鑽研** 在次級路由或獨立頁。

---

## 2. 與現有 Viewer 的接法（`src/lifebook-viewer/`）

### 2.1 資料契約（與現有一致）

- Viewer 已支援從 `window.__LIFEBOOK_INITIAL_STATE__`、`sessionStorage` / `localStorage`（`lifebook_doc`）載入 **LifeBookDocument**（`sections` + 可選 `chart_json`、`meta`）。
- 首頁殼需要的 **額外「摘要」** 建議單獨型別，避免把整本 `sections` 當首頁 props：

```ts
// 建議（示意）
type LifeBookHomeSummary = {
  dailyPill?: string;           // 流日一句
  focusYear: number;            // 錨定年（如 2026）
  yearProgressPct?: number;   // 0–100
  yearTitle: string;           // 如「關鍵推進年」— 可來自 findings / 模板
  prophecy?: string;
  doList: string[];
  dontList: string[];
  warnLine?: string;
  timelineNodes: Array<{
    id: string;
    label: string;            // e.g. "2026"
    tag?: string;
    summary?: string;
    branch?: "left" | "right"; // 對應 UI：node-item--branch-left / right
    href?: string;              // 詳細頁或 modal
  }>;
};
```

**來源**：由後端 worker 的 `findings`／`buildLifeBookDocument` 的前置摘要 API 產出，或前端在 `buildLifeBookDocument` 後從 `sections` + `chart_json` **derive** 一小段（避免首頁重算全盤）。

### 2.2 路由（本 repo 實作：query + hash）

實際入口為 **`lifebook-viewer.html`**，預設 **Home Shell**；`?view=viewer` 進 **完整閱讀**。

| 型態 | 範例 | 內容 |
|------|------|------|
| Home | `lifebook-viewer.html` 或 `?...` 且無 `view=viewer` | `LifebookHomeShell` |
| 完整閱讀 | `?view=viewer&year=2026&source=timeline&timeline_node=y2026#palace-guanlu` | `LifeBookViewer` + hash 捲動 |
| Home 單宮 overlay | `#palace-fuqi`（無 `view=viewer`） | `LifebookPalaceReaderOverlay` |

時間軸 CTA 與 telemetry／gate 行為見：**[lifebook-viewer-routing-telemetry-and-gate.md](./lifebook-viewer-routing-telemetry-and-gate.md)**。

首頁的「年節點／果實按鈕」應 **導向** 上述 query 或 hash，**不要**在首頁展開 12 宮全文。

### 2.3 嵌入與父頁面

- `iframe` 嵌入 `lifebook-viewer.html` 時，父頁可 `postMessage({ type: 'LIFEBOOK_DOC', payload })`；與 `index.tsx` 既有設計對齊時，**首頁殼** 應在 `App` 內判斷：有 `homeSummary` 時渲染 Home，有完整 `sections` 時仍可由 **同一入口** 進入「章節列表」或「單章」。

---

## 3. 實作路徑（建議順序）

1. **抽樣式**：把 `lifebook-decision-tree-demo.html` 的 `<style>` 拆成 `lifebook-home-shell.css`（或 Tailwind 模組），供 React 組件 `LifebookHomeShell.tsx` import。
2. **抽資料**：靜態 demo → `LifebookHomeShell` 只吃 `LifeBookHomeSummary` + `onNodeAction`。
3. **接真實資料**：在 `buildLifeBookDocument` 或 worker 加一層 `buildHomeSummary(doc)`（或 API）。
4. **導流**：時間軸節點與「⚠／💰」按鈕綁 `href` 或 `onOpenDetail({ type, id })`。
5. **12 宮**：沿用 `docs/lifebook-viewer-plan.md` 中的 `PalaceDetail` / ZiweiGrid 路線，不與首頁重複。

---

## 4. 與本 repo 檔案的對應

| 檔案 | 角色 |
|------|------|
| `lifebook-decision-tree-demo.html` | 視覺與互動原型（單檔）；樹枝已改為 **`.node-item--branch-left` / `--branch-right`** |
| `lifebook-viewer.html` + `src/lifebook-viewer/` | 正式 Viewer；首頁應實作為其中一個 **Route** 或 **初始畫面** |
| `lifebook-detail.html`（若存在） | 深讀／單宮或單章 |
| `docs/lifebook-viewer-plan.md` | Viewer 資料結構與目錄規劃 |

---

## 5. 小結

- **首頁**：錨定「當年＋時間軸＋短決策」，資料用 **Summary**。
- **詳解**：12 宮與長章在 **另一路由／頁**，與 `sections` / `chart_json` 深度綁定。
- **接線**：沿用既有 `LifeBookDocument` 載入方式，**加一層摘要建構** 即可，不必在首頁重算全盤命理引擎。
