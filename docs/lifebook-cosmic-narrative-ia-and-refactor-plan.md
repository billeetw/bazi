# 命書宇宙敘事：資訊架構、UI 重構與分階段計畫

> 目的：把「新舊混雜的 Viewer」收斂成 **Root / Domains（12 宮矩陣）/ Timeline / Viewer** 四個角色分明的維度，**視覺一致、可互相跳轉**，且不推翻既有 **deep link 與 gate 契約**。  
> 相關既有文件：[lifebook-home-architecture-boundary.md](./lifebook-home-architecture-boundary.md)、[lifebook-viewer-routing-telemetry-and-gate.md](./lifebook-viewer-routing-telemetry-and-gate.md)。

---

## 正式 URL 表（產品契約 vs 部署現實）

以下將 **產品契約**（對外／文件／長期書籤）與 **目前實作／部署** 拆開，避免「文件說一套、線上跑一套」。

### 產品契約（canonical URL contract）

| 維度 | 路徑／形狀 | 備註 |
|------|------------|------|
| **Root** | `/` | 降生藍圖／總控台入口 |
| **Timeline** | `/timeline` | 時間決策主場（可帶 query，如 `?focus=`） |
| **Viewer（唯一閱讀入口）** | `/viewer?year=YYYY&timeline_node=XXX&source=YYY#palace-zzz` | `year`、`timeline_node`、`source` 為 search params；**宮位錨點只在 hash**（`#palace-{palaceId}`，與 `getSectionDomAnchorId` 一致） |

### 目前實作／部署（過渡期）

| 項目 | 說明 |
|------|------|
| **SPA 入口** | 現階段 build 仍以 **`lifebook-viewer.html`** 為一顆 app 入口（見 `vite.config.ts` `rollupOptions.input`），閱讀模式常見為 **`?view=viewer`**，與 **pathname `/viewer`** 並存於過渡期。 |
| **部署層** | 需補 **rewrite／fallback**，使 **`/viewer`**、**`/timeline`** 與 **`/`**（若與同一 SPA 共用）導向 **同一 app shell**，再由應用內依 pathname／search 決定 Root／Viewer／Timeline。 |
| **rewrite 未完成前** | 文件與產品仍應以 **§ 產品契約** 為 **canonical URL contract**；線上可暫以 **query 形式**（例如 `lifebook-viewer.html?view=viewer&source=…#palace-*`）承接，**語義須與契約欄位一致**（`source`、`year`、`timeline_node`、`#palace-*`），僅 **path 形狀**不同。 |

### pathname 與 `view=viewer`（避免雙真相長期並存）

- **過渡期**：`syncCanonicalViewerPathToSearch`（見 `canonicalAppSurface.ts`）在 pathname 為 `/viewer` 時補上 `view=viewer`，以相容既有依賴 query 的邏輯。
- **長期目標**：以 **pathname `/viewer` 為唯一真相**，`view=viewer` 僅作 **相容層**；待依賴收斂後應刪減同步邏輯，避免 pathname 與 query 兩套「誰算 Viewer」並存。

---

## URL 與 fragment 原則（避免非法 hash）

**原則（寫死）：**

- **`hash`（`#…`）只負責頁內錨點**（例如 `#palace-fuqi`），對應 DOM `id` 與捲動目標。
- **面板／模式／結構層是否展開** 由 **search params** 表達，**不**在 fragment 內再塞第二層參數語義。

**錯誤範例（禁止寫入文件或當實作依據）：**

```text
#palace-x&mode=full
```

`&` 在 fragment 內**不**構成「第二組 query」，瀏覽器會將 `palace-x&mode=full` 當成**單一** fragment 字串，易與錨點 `id` 不一致並害實作踩坑。

**正確範例：**

```text
/viewer?panel=structure#palace-fuqi
/viewer?mode=full#palace-fuqi
```

（實際 param 名稱以工程共識擇一：**`panel=structure`** 或 **`mode=full`**，重點是 **只在 search**。）

---

## 補充規則（Domains／DestinyTree／URL vs state）

### 補充 A：Domains 的 canonical 規則

- **只有一個 canonical Domains 視圖**（12 宮生活領域矩陣）：放在 **Root 內**。
- **產品契約（書籤／對外）**：Root 的 Domains 可分享狀態為 **`/?view=domains`**（程式常數 `ROOT_VIEW_DOMAINS_CONTRACT`，見 `buildQuantumUrls.ts`）。
- **目前實作落地**：過渡期由 **`LIFEBOOK_APP_ENTRY_PATH`（`/lifebook-viewer.html`）** + `?view=domains` 承載；**rewrite 完成、Root 併入站點 `/` 後**，`buildRootUrl` 應改為不再暴露 `.html` 檔名，與契約 **`/?view=domains`** 對齊，避免 **bridge 活太久**。
- **Root 預設**：契約上為 **`/`**；現況同 **`LIFEBOOK_APP_ENTRY_PATH`** 無 extra query。
- **Domains → Viewer（主點擊）**：一律 **`buildViewerUrl({ palaceId, source: "domains" })`** → 整頁進 Viewer（**非**以 hash overlay 作為主路徑）。
- **Viewer 內的宮位 grid** 僅作 **secondary 快速跳轉工具**，**不是**第二套 Domains；不承擔「領域探索」主敘事。
- **Timeline 頁**不再另做第三套矩陣。
- **Root 內捲動**：`?view=domains` 時捲至 **`#lb-domains`**，並顯示 **Domains 模式** UI（`DomainsModeStrip`：標題、狀態 pill、返回總覽／時間決策）。

### 補充 A-2：宮位 overlay（`#palace-*` on Root）— 非 canonical 閱讀

- **不要**讓 Domains **主入口**再走「只開 overlay、不進 Viewer」作為預設；主點擊矩陣格＝**整頁進 Viewer**（`source=domains`）。
- 若日後保留 overlay，**僅能**作 **次要快速預覽** 或 **特定捷徑**，不得與主路徑對調，以免閱讀模型再度發散。

### 補充 B：DestinyTree 的定位

- **Root 上的 `DestinyTree`** = **Timeline 的 preview**（建議僅突出 **2～3 個**重點節點 + 前往完整時間軸的 CTA）。
- **`/timeline`** = **完整時間維度主場**（全節點、可 scroll／zoom／focus，產品細節另案）。
- **兩者共用同一節點模型**（資料與 id 一致），**只差展示密度與互動**；避免兩套邏輯分叉。

### 補充 C：URL vs state 原則

- **可分享、可書籤** 的視圖狀態（目前在看 Domains、Timeline focus、Viewer 結構層是否開啟等）**必須進 URL**（pathname 或 search）。
- **Component state** 僅為 URL 的投影與快取，**不是**單一真相來源；禁止長期依賴純 `state.mode` 而無 URL 同步，以免重新整理或分享連結後漂移。

---

## Quantum Link URL 建構（程式單一入口）

**勿**在 Root／Timeline／Viewer 各處手拼 query／hash。請使用：

| 函式 | 檔案 | 用途 |
|------|------|------|
| `buildViewerUrl` | `src/lifebook-viewer/routing/buildQuantumUrls.ts` | Viewer（`source`、`year`、`timeline_node`、`panel`／`mode`、hash 錨點） |
| `buildTimelineUrl` | 同上 | `/timeline?focus=&source=` |
| `buildRootUrl` | 同上 | Root（`view=domains` 等）；**`LIFEBOOK_APP_ENTRY_PATH`** 與靜態入口一致 |

**遙測**：`App` 掛載後會送 **`home_surface_resolved`**（gtag），含 `app_surface`、`root_sub_view`（`domains` | 省略），便於確認 rewrite 與 Root 子視圖實際流量。

---

## App shell 檢查清單（canonicalAppSurface）

| URL 形狀 | 預期 surface |
|----------|----------------|
| `/` 或 `…/lifebook-viewer.html`（無 `view` 或 `view` 非 viewer／domains） | Root · default |
| `…/lifebook-viewer.html?view=domains` | Root · **domains**（捲至 `#lb-domains`） |
| `/timeline` | Timeline（佔位頁；**返回 Root** 使用 `buildRootUrl()`，**temporary bridge** 直至 Root 正式為 `/`） |
| `/viewer#palace-*` | Viewer（必要時補 `view=viewer`） |
| `/viewer?year=…&timeline_node=…#palace-*` | Viewer + 時間語境 |
| `?view=viewer`（舊格式，同頁或 rewrite 後） | 仍可進 Viewer |

---

## 一、整體資訊架構重整說明

### 1.1 四個「維度」的角色（不是同一長頁的三段）

| 維度 | 使用者問題 | 產品角色 | 語氣方向 |
|------|------------|----------|----------|
| **Root（降生藍圖）** | 你是誰？我從哪裡看起？ | 第一入口／迷惘時回來的 **總控台** | 「這是你的底層藍圖；現在最值得先看的是哪一塊，為什麼。」 |
| **12 Domains（生活領域／宮位矩陣）** | 我生活的哪一塊在動？ | **領域探索中介**：從「領域」進入細讀，而非章節清單 | 符文卡＋一句引子；點擊進 Viewer 對應 `#palace-*`（見 **補充 A**） |
| **Timeline（時間決策）** | 我現在該做什麼？ | **動態時間軸**：風險、轉機、推進點，且每點可進 Viewer | 「這段時間哪裡最需要你出手；去哪裡看懂它。」 |
| **Viewer（12 宮位閱讀）** | 根因與細節是什麼？ | **沉浸式閱讀承接**：不再承擔「主導航決策」 | 「這裡是你要看的真相；有節奏的閱讀，不是資料表。」 |

**與目前程式的大致對應（遷移期）**

- **Root**：`App` 預設的 `LifebookHomeShell`（降生藍圖殼）＋ Oracle／主軸／矩陣摘要等（收斂為「單一 primary focus + 兩條路徑」）。URL 見 **§ 正式 URL 表**。
- **12 Domains**：Root 內 **唯一** canonical 矩陣（**補充 A**）；呈現從清單改為符文卡網格。
- **Timeline**：**`/timeline`** 為完整視圖；Root 內 **DestinyTree** 為 preview（**補充 B**）。
- **Viewer**：契約上為 **`/viewer`** + query + `#palace-*`；過渡期見 **§ 目前實作／部署**。閱讀本體仍為 `LifeBookViewer`（原 `?view=viewer`）＋ `#palace-*` 與 `parseViewerRoute`。

### 1.2 主要跳轉路徑（產品主線）

```
Root ──► Viewer（主宮／推薦宮）
Root ──► Timeline ──► Viewer（帶 year / timeline_node）
Timeline ──► Viewer（溯源／進一步閱讀）
Viewer ──► Timeline（回看時空脈絡；focus 節點）
Viewer ──► Root（回到整體藍圖）
```

**原則**：Tab／導航切換的是「敘事中心」，不是換皮同一頁；**Quantum Link 與 session 行為以 § 二為準**。

---

## 二、Quantum Link 規則與 Session 對表

跨頁連動為一級能力；**契約欄位**沿用既有語義（`parseViewerRoute`、`getSectionDomAnchorId`、gate），**不另發明無謂新參數**。

### 2.1 Quantum Link 矩陣（定案版 + 工程欄）

下表 **URL** 欄為 **產品契約** 形狀；**實際 pathname／現階段實作** 欄標註過渡期對應，避免工程猜測。

| From | To | URL（契約） | 必帶／常用參數 | 誰負責設 CTA | 實際 pathname／現階段實作 | Session 寫入／清除 owner（單一真相） |
|------|----|-------------|----------------|--------------|---------------------------|-------------------------------------|
| Root | Viewer | `/viewer#palace-{id}` | `source=root` | Root 內連結／矩陣／primary focus CTA | 過渡：`lifebook-viewer.html?view=viewer&source=root#palace-*` 或等同 | **一般不寫** timeline session；進入 Viewer 時若 **無** timeline 語境，**應清**與 timeline 節點 highlight 相關之 session（見下 **2.2**）— **實作點**：`App`／路由進入 `LifeBookViewer` 時與 `homeTimelineHighlight` 對齊 |
| Root | Timeline | `/timeline` | `source=root`（可選） | Root 上「時間軸」入口 | 過渡：可能仍為同一 HTML，由 app 依 pathname 渲染 Timeline | 依 **2.2**：僅在 **明確 timeline 語境** 下寫入；純導航到 `/timeline` **不一定**寫 session |
| Domains | Viewer | `/viewer#palace-{id}` | `source=domains` | Root 內 canonical 矩陣上的宮位卡 | 同上，過渡期 `?view=viewer&source=domains#palace-*` | 與 Root→Viewer 相同：**無 timeline 則不應殘留 timeline session** |
| Timeline | Viewer | `/viewer?year=&timeline_node=#palace-{id}` | `timeline_node`（及需要時 `year`） | Timeline 節點 CTA | 過渡：`?view=viewer&year=…&timeline_node=…&source=timeline#palace-*` | **寫入**：`source=timeline` 且帶 `timeline_node` 時，由 **Timeline 頁／CTA 導向 Viewer** 與既有 **`persistViewerTimelineNodeContext`**（或統一後繼 API）負責；**與 `homeTimelineHighlight` 對表**，避免兩套 |
| Viewer | Timeline | `/timeline?focus=` | `focus=<nodeId>`、`source=viewer` | Viewer 內「查看時空影響」等 CTA | 過渡：若尚未有 `/timeline` pathname，則 **暫**以 `/?…` 或 hash 策略 **僅作過渡**，並在 **§ 正式 URL 表** 更新「已完成 rewrite」後收斂 | **可選**：從 Viewer 回到 Timeline 時保留 **focus** 於 URL，**不依賴** session 做唯一真相 |
| Viewer | Root | `/` | `source=viewer`（可選，供承接） | Viewer 頂部「返回藍圖」等 | 過渡：`/` 或 `lifebook-viewer.html` 去掉 `view=viewer` | **返回 Root**：是否保留 timeline highlight **應產品定案**；建議：**無 `timeline_node` query 時清 query**，與現有 **`clearViewerTimelineNodeContext`**／`App` 內 timeline query 清理 **同一套規則**（見 `App.tsx`、`homeTimelineHighlight.ts`） |

**Session／highlight 規則（與文件對齊程式，避免「文件說清、程式沒清」）：**

- **建議契約**：僅在 **`timeline_node` 存在** 且語境為 **從 Timeline 進 Viewer**（例如 **`source=timeline`**）時，**寫入** session（或 sessionStorage 高光語境），供返回 Root 時 **DestinyTree 短暫 flash** 等用途。
- **其餘進入 Viewer**（`source=root`／`domains`、或直接開書籤 **無** timeline）：應 **清除** 或 **不寫** timeline 專用 session，避免舊節點高亮殘留。
- **實作單一 owner**：所有寫入／清除應集中在 **少數入口**（例如 `parseViewerRoute` 之後、`persistViewerTimelineNodeContext`、`clearViewerTimelineNodeContext`、Root `useLayoutEffect` 清 query），並在 PR／註解中指回本表。

### 2.2 承接（source）與著陸提示

- **保留**：從 Root／Timeline／Domains／direct 進入時，不同的 **landing hint / banner**（現有 `describeViewerTopBanner`、`persistViewerTimelineNodeContext` 等路徑）。
- **延伸**：Quantum Link CTA 文案與 **同一套 gate 語氣**（open / teaser / locked）一致（見 § 四）。

### 2.3 工程約束

1. 不破壞 **deep link**：`#palace-*`、`timeline_node`、`source`、`year`、gate contract。
2. **TOC / section anchor** 保留在底層：即使主 UI 降噪，仍保留 scroll、IO、telemetry 掛點。
3. **呈現降噪 ≠ 刪資料結構**：章節順序、section key 仍為單一真相來源（如 `SECTION_ORDER`、worker order JSON）。
4. **結構層／沉浸層切換** 僅用 **search params**（如 `?panel=structure`），與 **§ URL 與 fragment 原則** 一致。

---

## 三、UI 重構提案

### 3.1 建議淘汰或移出主視覺的「舊元件」

| 元件／模式 | 問題 | 方向 |
|------------|------|------|
| 長條列 **章節 TOC** 作為主畫面 | 待辦感、後台感 | 主層改為神諭碎片／探索入口；TOC 收合至「結構層」或抽屜 |
| **宮位即時診斷** 大網格按鈕 | 像 admin 儀表 | 縮減為次要入口或併入 Domains／符文矩陣 |
| **廉價 3D 漸層球** 作為宮位主 icon | 與命宮沉浸殼不一致 | 替換為 **12 宮 SVG 符文系統**（Phase 2） |
| **五行雷達圖** 預設強展示 | 商務報表感 | 預設改「法陣化」視覺；數值用次級／tooltip（§ 四） |
| 單頁垂直 **所有宮位長文堆疊** 作為唯一閱讀方式 | 與「維度平行」衝突 | Viewer 拆 **沉浸主層** vs **結構輔層**；預設只展開當前敘事節奏 |

### 3.2 建議重做（視覺與元件級）

- **全局 Tab Bar**：Root / 12 Domains / Timeline（＋進入 Viewer 的出口不佔第四 Tab，而是從前三頁跳入）。
- **12 宮矩陣卡片**：黑底玻璃、符文、發光邊框、微動態；一句引子＋進 Viewer（**僅** Root canonical 矩陣）。
- **五行視覺**：法陣主視覺 + 可選數據模式。
- **Viewer 首屏**：宮位主視覺 + 一句定調 + D/W/M 神諭模組 + 來源條 + 時間語境列（既有元件擴充而非重造路由）。

### 3.3 保留但降噪

- **深色宇宙背景、發光、命運軌跡感**（Timeline／DestinyTree 方向）。
- **`SectionPalaceTemplate` 沉浸殼**（持續與設計 tokens 對齊）。
- **Gate banner / teaser / locked**：行為不變，樣式收斂到設計系統。
- **WeightSummary、chart embed、技術依據摺疊**：移入「結構輔層」或次要折疊區。

### 3.4 Viewer 分層（資訊層級）

| 層級 | 內容 | 互動 |
|------|------|------|
| **沉浸主層（預設）** | 宮位主視覺、一句定調、D/W/M、時間關聯 CTA、來源承接、Quantum Link | 閱讀與跳轉 |
| **結構輔層（收合）** | 五行總圖、完整宮位 grid、章節結構、JSON／meta／專家模式 | 查資料、深連結仍可到 anchor；**開啟狀態用 `?panel=`／`?mode=`，不用非法 hash**（§ URL 與 fragment 原則） |

原則：**先讓人讀，再讓人查。**

---

## 四、設計系統草案（Phase 1 要先落地）

### 4.1 色彩

- **底**：深空藍／黑（現有 cosmic 背景延續）。
- **能量色**：金（主 CTA／儀式感）、青綠（流動／時間）、紫（神秘／邊界）。
- **狀態**：open（清亮）、teaser（琥珀 warning）、locked（rose／灰鎖）— 與 gate 一致。

### 4.2 Glow 規則

- **弱 glow**：預設卡片邊界。
- **hover glow**：可點擊符文／卡片。
- **focus glow**：鍵盤無障礙與 Tab 導航（**glow 不能替代 focus ring**）。
- **warning / locked**：與 banner、badge 共用語義，避免每頁新色。

### 4.3 卡片

- 玻璃感、細邊框、大圓角層級（例如：容器 20px／內卡 12px）。
- 陰影：發光型（低擴散）為主，避免重陰影「儀表板卡片」。

### 4.4 SVG 符文系統

- **12 宮**：各一圖騰 + 對應色 + 微動態（pulse／orbit／shimmer）。
- **延伸**：命主／身主／五行／時間節點共用幾何語言，避免混用擬物球與扁平 icon 兩套。

### 4.5 字體層級

- 大標 → 神諭句（短、可朗讀）→ 說明 → 微標籤（英文技術標籤可降對比）。

### 4.6 單一 token 來源（建議）

- **目標**：`src/design-system/tokens.ts`（或 CSS variables 由單檔產出）；**禁止** Home／Viewer／Timeline 各維護一套互不匯入的變數。
- **允許命名空間**：`tokens.core`、`tokens.glow`、`tokens.palace`、`tokens.gate` 等；**所有頁面 import 同一份**。

---

## 五、分階段實作計畫（Phase 1～5）

### Phase 1：Design System

- **產出**：**tokens 單一來源**（§ 4.6）、glow／glass／button／badge 規格；可先不動路由。
- **影響**：全站逐步替換散落的顏色與邊框。
- **可先不動**：worker 內容生成、gate 邏輯、`parseViewerRoute` 欄位語義。

**已落地（起始）：**

- `src/design-system/tokens.css`（`:root` CSS variables）、`src/design-system/tokens.ts`（與 CSS 對齊之 TS 常數與 `cssVar` 鍵名）、`src/design-system/index.ts`；`src/lifebook-viewer/index.tsx` 已全域載入 `tokens.css`。
- `src/lifebook-viewer/components/home/lifebookHomeTokens.css` 已改為 **優先 `var(--lb-core-*` 等)**，與單一來源對齊。
- **pathname 契約（過渡）**：`src/lifebook-viewer/routing/canonicalAppSurface.ts`（`getAppSurfaceFromLocation`、`getRootSubViewFromLocation`、`syncCanonicalViewerPathToSearch`）；`App.tsx` 依 surface 分流 Root／`LifeBookViewer`／`LifebookTimelinePlaceholder`；**`sync…` 為過渡**，長期以 pathname 為真相（見上文 § pathname 與 `view=viewer`）。
- **Quantum Link**：`src/lifebook-viewer/routing/buildQuantumUrls.ts`（`buildViewerUrl`、`buildTimelineUrl`、`buildRootUrl`）；`computeTimelineNodeCta`、`HomePalaceMatrix`（Domains→Viewer）已改用 **`source=domains`／`source=timeline`** 之 `buildViewerUrl`。
- **Root Domains**：`?view=domains` → `rootSubView=domains` → 捲至 **`#lb-domains`**；**`DomainsModeStrip`**（標題／領域模式 pill／返回總覽／時間決策）；預設 Root 有 **「進入十二宮領域（Domains）」** 連結（`buildRootUrl({ view: "domains" })`）。
- **`ViewerEntrySource`**：`src/lifebook-viewer/routing/viewerEntrySource.ts`；`buildQuantumUrls` 之 `source` 型別收斂；`ROOT_VIEW_DOMAINS_CONTRACT`（`/?view=domains`）與 `LIFEBOOK_APP_ENTRY_PATH` 並列於程式註解與測試。
- **測試**：`vitest` + `tests/buildQuantumUrls.test.ts`；`npm test`。
- **遙測**：`home_surface_resolved`（gtag：`app_surface`、`root_sub_view`）。
- **Dev**：`vite.config.ts` 內 middleware 將 `/viewer`、`/timeline` 改寫為載入 `lifebook-viewer.html`（與正式 `_redirects` 一致）。
- **部署**：`_redirects` 已加入 `/viewer`、`/timeline` → `lifebook-viewer.html`（200）。
- **lifebook-viewer 專用打包**：`vite.lifebook-viewer.config.ts` 已補 `@` alias（與主設定一致），`npm run build:lifebook-viewer` 可通過。

### Phase 2：12 Domains／宮位矩陣

- **產出**：`PalacePreviewCard`（或後繼元件）改符文卡；淘汰漸層球；矩陣一鍵進 **契約** `/viewer?source=domains#palace-*`（過渡期見 § 正式 URL 表）。
- **影響**：Root 內 **唯一** canonical 矩陣；Viewer 內 grid 降級為 secondary（**補充 A**）。
- **可先不動**：section VM 計算、`SECTION_ORDER`。

### Phase 3：Viewer 重構

- **產出**：沉浸層／結構層拆分；章節 TOC 降噪；來源提示與時間語境列強化；Quantum Link CTA；**結構層 deep link 只用 search + hash 錨點**（§ URL 與 fragment 原則）。
- **影響**：`LifeBookViewer.tsx`、`ModuleGroup`、側欄 TOC 組件。
- **可先不動**：`buildSectionViewModels`、telemetry 事件名、anchor id 生成。

### Phase 4：Root v1

- **產出**：主軸定調、五行總覽、命主／身主／身宮張力、primary focus、兩條路徑；DestinyTree 作 Timeline preview（**補充 B**）。
- **影響**：`LifebookHomeShell`、`buildHomeSummaryFromDocument`、Oracle 區塊配置。
- **可先不動**：summary 組裝契約（見 Home boundary 文件）。

### Phase 5：Timeline polish

- **產出**：`/timeline` 完整視圖、節點卡、命運線視覺、CTA 與 Viewer／Root 一致；**部署 rewrite** 與 pathname 收斂（§ 正式 URL 表）。
- **影響**：`DestinyTree`（preview）、新 Timeline 頁、`App` 路由。
- **可先不動**：`computeTimelineNodeCta` 的 **URL 欄位語義**（與契約一致即可）。

---

## 六、風險與成功標準

- **風險**：Tab 導航與「單頁多 hash」並行時，需明確預設進入路徑與書籤相容策略；**Session 與 § 二矩陣不同步**會直接造成體感混亂。
- **成功**：使用者能說出「我在藍圖／時間／細讀」三種模式；深連結與舊書籤仍可用；開發仍能依 TOC／section 除錯；**產品契約 URL 與過渡實作**在文件層面可對照。

---

## 七、文件索引

| 主題 | 章節 |
|------|------|
| 正式 URL、部署過渡、hash／query 原則 | 文首 § 正式 URL 表、§ URL 與 fragment 原則 |
| Domains／DestinyTree／URL vs state | § 補充 A～C |
| 整體資訊架構、四維角色、主路徑 | § 一 |
| Quantum Link 矩陣、Session owner | § 二 |
| UI 重構 | § 三 |
| 設計系統與 token | § 四 |
| 分階段計畫 | § 五 |

後續迭代時，建議在 Phase 1 完成後補一張 **Figma／Storybook 對照表**（元件名 ↔ 檔案路徑），與本文件雙向連結。
