# Lifebook Viewer：路由、Telemetry、Gate（teaser / locked）

本文件與實作對齊：`src/lifebook-viewer/routing/parseViewerRoute.ts`、`viewmodels/contracts.ts`（`resolveGateContract`）、`components/LifeBookViewer.tsx`。

---

## 1. 完整閱讀 URL 約定（同頁 `lifebook-viewer.html`）

| 參數 | 說明 |
|------|------|
| `view=viewer` | 進入「完整閱讀」版面（TOC／章節長文），非首頁 Shell。 |
| `intent=full` | 由 Home `#palace-*` overlay「進階完整閱讀」明確指定；**勿**觸發「誤帶 view」正規化（見 `isBarePalaceViewerMistake`）。 |
| `year` | 可選；語意錨定（分析／回放），例如時間軸節點年份。 |
| `source` | `home_audit` \| `matrix` \| `timeline`；缺省視為 `direct`。用於落地提示與事件維度。 |
| `timeline_node` | 可選；時間軸節點 id（如 `y2026`），與 `source=timeline` 併用，利於 **node-level routing** 與 `viewer_route_resolved`。 |
| `#palace-{palaceId}` | 捲動錨點；章節 DOM id 與 `getSectionDomAnchorId` 一致。 |

首頁誤連修正：僅在 **`?view=viewer#palace-*` 且無 `year`／`source`／`intent`／`timeline_node`** 時剝除 `view`（留在 Home 開 overlay）。見 `isBarePalaceViewerMistake`。

### 1.1 `timeline_node` 與 `#palace-*` 的主從（固定規則，避免捲到 A、UI 心在 B）

| 層級 | 權威來源 | 行為 |
|------|----------|------|
| **捲動／閱讀錨點** | **`#palace-{id}`** | 唯一決定 `scrollIntoView` 目標與章節 DOM；手改 hash 即以此為準。 |
| **時間語境（哪一年／哪個節點）** | **`timeline_node` + `year`（query）** | 驅動 Viewer 頂部「時間軸語境」列、`computeFocus(..., timelineNode)` 與分析維度；**不覆寫** hash 捲動。 |
| **若兩者對應宮位不一致** | 見上兩列 | **捲動仍以 hash 為準**；語境列可顯示「錨點宮 ≠ 節點建議宮」提示（實作：`ViewerTimeContextBar`）。 |
| **僅有 `timeline_node`、無 hash** | — | 目前仍應由產品入口補齊 `#palace-*`；不建議長期依賴「無 hash」的完整閱讀 URL。 |

**衝突時優先序一句話**：**Hash 主導捲動；`timeline_node` / `year` 主導時間軸語境與 telemetry。** 未來若要做「無 hash 自動選宮」，應另開參數並寫入本表，而非默默覆寫 hash。

---

## 2. 事件（gtag / `onTrackEvent`）

### 2.1 Home Shell

| 事件 | 時機 |
|------|------|
| `home_core_viewed` | 首頁載入 Oracle |
| `home_time_node_clicked` | 時間節點互動 |
| `home_revelation_opened` / `home_revelation_cta_clicked` | 啟示彈窗 |
| `home_palace_matrix_cell_clicked` | 十二宮格點擊 |
| `timeline_node_clicked` | 點「在完整閱讀打開此宮」等 Timeline CTA |

### 2.2 完整閱讀（Viewer）

| 事件 | 時機 | 備註 |
|------|------|------|
| **`viewer_route_resolved`** | 已載入命書且 **`view=viewer`** 時，對目前 URL 解析完成並 **同一載入實例內去重後** 送一次 | 含 `year`、`source`、`palace_id`、`section_key`、`timeline_node_id`、`intent_full`、**`navigation_instance_id`**、**`navigation_session_id`**、可選 **`focus_tone`**（`computeFocus`） |
| **`viewer_gate_resolved`** | 同上且 deep link 能對應到 **某 `section_key`** 時 | 含 `gate`、`preview_mode`、`is_locked`、`cta_variant`；同上帶導航 id |
| `viewer_scroll_success` | hash 對應 DOM 存在並捲動成功 | 含 `source`、`timeline_node_id`、導航 id |
| `viewer_access_blocked` | **`gate === locked`**（`meta.locked_sections` 標記該章鎖住） | 轉化／權限漏斗；與 teaser 分開；含導航 id |

**語意區分**：`viewer_route_resolved` / `viewer_gate_resolved` 偏 **分析與漏斗還原**；`viewer_access_blocked` 偏 **鎖章當下的阻擋行為**。

### 2.3 去重與「不要過度合併」

- **元件內去重鍵**（避免 Strict Mode／effect 重跑重複送）：`pathname + search + hash` + **命書章節簽名** + **`navigation_instance_id`**。  
  - **同 URL refresh**：新掛載 → **新** `navigation_instance_id` → **可再送** `viewer_route_resolved`，分析上與「同頁不重送」分開。
- **`navigation_session_id`**：存於 `sessionStorage`（同源分頁），**可跨 refresh** 關聯多次載入；與 instance 並用可還原「同工作階段、不同進站」。
- **維度辨識**：即使 URL 路徑層級被合併，`source`、`timeline_node_id`、`focus_tone` 仍應保留在 payload，避免把不同入口誤當同一種流量。

---

## 3. `locked` 與 `teaser` 差異（產品 + UI）

來源皆為 **`resolveGateContract(meta, sectionKey)`**（單一章節維度）。

| 維度 | **locked** | **teaser**（含 **partial**） |
|------|------------|------------------------------|
| **資料依據** | `locked_sections[]` 中該 `section_key` 且 `is_locked === true` | 非上述鎖章；且為免費／試用層：`gate === teaser` 或 `partial`（`available_sections` 含該 key 時為 partial） |
| **previewMode** | `hidden`（不展示完整正文） | `teaser`（試讀／摘要） |
| **完整閱讀頁頂部** | **阻擋橫幅**（rose）：說明未解鎖 + `lock_reason` | **試讀橫幅**（amber）：說明可讀摘要、升級解鎖全文 |
| **章節內** | 由模板／鎖章資料決定（不當作「試讀」） | `SectionPalaceTemplate` 等依 VM 顯示試讀與 CTA |
| **Telemetry** | `viewer_gate_resolved` 帶 `gate: locked`；另送 **`viewer_access_blocked`** | `viewer_gate_resolved` 帶 `gate: teaser` 或 `partial`；**不**送 `viewer_access_blocked` |

**open / pro**：`plan_tier === pro` → `gate: open`，不額外顯示試讀／鎖章橫幅（與現有 TOC 一致）。

---

## 4. 相關程式位置

- 路由解析：`src/lifebook-viewer/routing/parseViewerRoute.ts`
- Home 高亮 session／query：`src/lifebook-viewer/routing/homeTimelineHighlight.ts`
- 導航 id：`src/lifebook-viewer/routing/viewerNavigationIds.ts`（`navigation_session_id`）
- Gate 矩陣：`src/lifebook-viewer/viewmodels/contracts.ts`
- 橫幅文案：`src/lifebook-viewer/utils/viewerGateCopy.ts`（`describeViewerTopBanner`）
- 共用推薦：`src/lifebook-viewer/components/home/computeFocus.ts`（Home / Matrix / Timeline）
- Timeline CTA：`src/lifebook-viewer/components/home/computeTimelineNodeCta.ts`
- Viewer 時間語境列：`src/lifebook-viewer/components/ViewerTimeContextBar.tsx`

---

## 5. Home 回訪：DestinyTree 短暫高亮（單向）

當使用者曾從 **時間軸語境** 進入完整閱讀（URL 含 `timeline_node`），回到 Home 或帶 `?timeline_node=` 開 Home 時：

| 優先 | 來源 |
|------|------|
| 1 | Query：`timeline_node` 或 `node`（且 `view` ≠ `viewer`） |
| 2 | Session：`persistViewerTimelineNodeContext`（Viewer 內有 `timeline_node` 時寫入） |

若皆無或 id 不在當前 `summary.timeline`：**不高亮**，並清除無效 session。

**行為**：`DestinyTree` 對應節點約 **5s** amber 框線／glow；可選小字「你剛查看的是這個時間節點」。**不**自動捲動、**不**改變既有選中邏輯、**不**雙向綁定 Viewer。結束後 `onTimelineFlashConsumed` 清 session，並自 URL 移除 `timeline_node`／`node`（若曾帶在 query）。

程式：`routing/homeTimelineHighlight.ts`、`App.tsx`、`DestinyTree.tsx`。

---

## 6. Step 3 後續 roadmap（對齊產品討論）

| 優先 | 項目 | 狀態 |
|------|------|------|
| P1 | Timeline ↔ Viewer UI（`timeline_node` 驅動語境列、與 hash 主從分離） | 已接 **語境列 + 規格**；**Home 回訪 DestinyTree 短暫高亮**（§5） |
| P2 | `computeFocus` 統一 Matrix / Timeline / Audit | **已導入**；後續可將 Matrix 點擊等全走同一入口 |
| P3 | `detailLine`：結構化 `detailParts`（`timeline_cta_v1`）→ findings → 最後才 LLM | **已加** `TimelineNodeCta.detailParts` |
| P4 | Gate copy / `cta_variant` A／B | 待有數據再做 |
