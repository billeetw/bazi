# Lifebook Home「靈魂本命」Step 1：Audit 區行動導流（一頁紙規格）

**狀態：** Step 1 **MVP 已實作**（`LifebookHomeShell` 內 `HomeAuditNextAction`、`computeHomeAuditCta`、`?view=viewer#palace-*` + Viewer 錨點 `getSectionDomAnchorId`）。承接高亮／telemetry／`primaryFocus` 仍依下方待辦。  
**目的：** 把 Root（靈魂本命）首頁從「閱讀頁」推進為「導航頁」，先驗證 **是否有人會點**，不驗證時間模型是否完美。

---

## 一句決策

用 **可解釋的 rule-based**（以**語意方向／決策語氣**為主，避免單一關鍵字漏判）推出**單一「推薦一宮」**，在 audit 區最後加 **「原因 + 目的」合一的主 CTA**，以 **固定 hash** 帶使用者進入對應宮位段落；**不做** matrix 引動、Root↔Timeline 深連動、RootViewModel 擴張。

---

## 本輪範圍（做）

| 項目 | 說明 |
|------|------|
| Audit 區 CTA 區塊 | 最後一張 audit 卡**下方**新增固定區塊（見下「文案與位置」） |
| 單一主連結 | **只允許一個**主 CTA，不放第二個連結（避免競爭） |
| 推薦一宮 | **rule-based（語意分類）** + 資料優先序見「資料對應」 |
| 錨點跳轉 | 使用 **hash**，格式 **`#palace-{palaceId}`**（例：`#palace-fuqi`） |
| DOM／捲動 | **必須**在實作與驗收時確認目標 `id` 存在且 **scroll 行為穩定**（見下「硬條件」） |

---

## 本輪不做（刻意排除）

- 12 宮 matrix「當前引動」、pulse、動態 badge（**Step 2**）
- Root ↔ Timeline 深連動、年份／權限路由（**Step 3 或之後**）
- `RootViewModel` 大型化、與引擎完整對齊
- 多個 CTA 並列、A/B 多入口競爭
- 宮位頁「從 Root 導入」的**完整承接 UI**（規格先寫要求，實作可分期，見「承接情境」）

---

## 硬條件：DOM id 與 scroll（⚠️ 未驗＝CTA 失效）

- **必須**在 DOM 層保證 **`id="palace-{palaceId}"`**（或與 hash 1:1 對應之可捲動錨點）**真實存在**，且與 **sticky header／offset** 相容（例如 `scroll-margin-top`），避免點擊後捲到錯誤位置或完全無反應。
- **驗收必测：** 至少抽樣 **4 個 palaceId**（如 `ming`、`fuqi`、`guanlu`、`caibo`）在常見 viewport 下 **點 CTA → 目標區塊可見且穩定**。
- 若與既有 `#s02` 等 id 並存，**本規格以 `#palace-*` 為準**；實作時二選一或雙向同步，避免混用導致 QA 無法重現。

---

## 1. 文案區塊位置

- **位置：** audit 區（三張卡）**最後一張卡片的正下方**。
- **結構（固定）：**
  - **一句行動定調**（含推薦宮名 + **為何現在要看這一宮**）
  - **一個主 CTA**（全頁僅此一個主行動）

### CTA 文案規則：必須帶「原因」，不是只有目的

| ❌ 不建議（點擊動機弱） | ✅ 建議（原因 + 目的） |
|------------------------|-------------------------|
| 查看夫妻宮 → | 你的不安正在影響關係 → 查看夫妻宮 |
| 查看你在關係中的運作 → | （同上類型：先一句**因**，再導向宮位） |

**範例結構（可替換用語，邏輯不變）：**

```text
現在最該優先調整的面向：夫妻宮
你的不安正在影響關係 → 查看夫妻宮
```

（第二行為唯一可點連結，指向 `#palace-{palaceId}`；**「你的不安…」應與當次 rule／摘要語意一致**，避免套版空話。）

---

## 2. 錨點／路由命名

| 項目 | 約定 |
|------|------|
| 宮位跳轉 | **`#palace-{palaceId}`**，`palaceId` 與 `SECTION_KEY_TO_PALACE_ID` / theme 一致（如 `fuqi`、`guanlu`、`ming`） |
| Timeline | **本輪不定**；之後另開規格 |
| Root URL | **本輪不加**額外 query；僅 hash |

---

## 3. 「推薦一宮」：決策語氣分類（rule-based，避免單一 keyword 漏判）

**原則：** 不只比對關鍵字，而以 **語意方向** 歸類；之後接 **findings** 時較易對齊同一套分類。

| 語意方向（描述偏…） | 推薦 `palaceId` |
|---------------------|-----------------|
| **關係互動／情緒拉扯／對方影響** | `fuqi` |
| **角色定位／壓力責任／工作結構** | `guanlu` |
| **資源／金錢／得失／安全感** | `caibo` |
| **自我矛盾／內在狀態**（無法歸入上三者） | `ming`（**或**與 fallback 合併，見下） |
| 無法分類 | **fallback → `ming`** |

> 實作可輔以關鍵字表，但**以語意分類為主**；關鍵字表應集中於設定檔並列入待辦以便迭代。

### Fallback 過度命中的風險（⚠️）

若 rule-based 不夠準，**大量結果會落在 `ming`**，使用者易覺得「怎麼每次都命宮」。

**規格要求：**

- 若 **fallback 命宮連續出現**（或 **命中率過高**），應在產品／工程側**標記為待優化**，並預留為之後 **telemetry** 指標（例如：fallback 率、連續 fallback 次數）。
- 不阻擋 Step 1 上線，但**不得無視**此現象。

---

## 4. 承接情境：Root → 宮位（規格先寫、實作可分期）

**風險：** 使用者從 Root CTA 進入某宮後，若畫面**沒有呼應剛才的 CTA**，體驗會斷裂。

**規格要求（本輪至少滿足「可捲到正確區塊」；視覺提示可 Step 1.1）：**

- 目標宮位區塊在進入視窗時應 **可辨識為當次導流目的**（例如：該區塊 **置頂或接近視窗上緣**、或後續加 **短暫高亮／錨點 label**）。
- 具體 UI **不用在 Step 1 一次做完**，但工程與設計應**預留**「從 Root 導入」狀態（例如 hash + optional `?from=root-audit` 僅作備案，**本輪仍以 hash 為主**）。

---

## 5. 資料對應（不寫程式版）

目標：工程**不用猜**、**不自行發明邏輯**、**不亂接 `chart_json`**；來源順序寫死，缺欄再降級。

### 5.1 優先序（讀取順序）

1. **結構化「主推薦宮位」**（建議新增，見下）
2. **既有章節摘要**（可拼接多段作為分類輸入）
3. **rule-based 語意分類**（audit 文案／summary／關鍵句）
4. **fallback：`ming`**

### 5.2 建議欄位（與現況對齊）

| 來源 | 說明 |
|------|------|
| **`HomeSummary.primaryFocus`** | **建議新增**：型別可為 `{ palaceId: PalaceId; reason?: string }` 或最小 `palaceId` 字串；由 `buildHomeSummaryFromDocument` 或未來引擎寫入。**現況 `HomeSummary`（見 `components/home/types.ts`）尚無此欄，上線前可加欄或第一版略過改走 5.3。** |
| **其次：章節文本** | 作為分類輸入：例如 `sections['s02']?.structure_analysis`、`sections['s08']?.structure_analysis` 等（**不強制只讀 s02/s08**，可依 MODULE 定義挑與 audit 相關者）。 |
| **rule-based 輸入** | 匯總字串：`audit` 區已呈現之文案 + 上述 summary 片段，送入**語意分類**規則（第 3 節）。 |
| **findings（未來）** | 若 worker 輸出結構化「建議宮位」，改為 **優先於** rule-based；本輪可不接。 |

### 5.3 與現有程式型別的對照（避免虛構欄位）

- 現有 **`HomeSummary`** 欄位包含：`oracle`、`timeline`、`cardTitle`、`cardDescription`、`revelationsByNodeId` 等（**無** `primaryFocus`）。
- **實作 Step 1 時二選一：**  
  - **A)** 先加 `primaryFocus`（或 `recommendedPalaceId`）再讀；或  
  - **B)** 第一版完全依 **章節 summary + audit 文案 + rule-based**，並在待辦追 **欄位補齊**。

---

## 驗收（規格層）

- [ ] 使用者讀完 audit 後，**永遠看到且僅看到一組**「定調 + 主 CTA」，且 CTA **帶原因**（非僅「查看某宮」）。
- [ ] 點擊後 **DOM 錨點存在**，**scroll 穩定**（見「硬條件」）。
- [ ] 推薦結果可被團隊用**白話一句話**解釋「為什麼是這一宮」（語意分類可追溯）。
- [ ] 本輪**無** matrix 引動、無 Timeline 第二入口。
- [ ] **承接情境**至少滿足捲動到位；視覺呼應可列後續迭代。

---

## 待辦：rule-based／未接引擎／未來可優化（清單）

### 資料與規則

- [ ] **新增 `HomeSummary.primaryFocus`（或等價欄位）** 與產生時機（`buildHomeSummaryFromDocument` / 引擎）。
- [ ] 語意分類之 **關鍵字／規則表** 集中於單一設定檔，並註明與 **worker／findings** 對齊計畫。
- [ ] 定義 **規則衝突**時的優先序（多語意同時成立）。
- [ ] **Telemetry：** fallback 率、連續 fallback、CTA 點擊 → 停留／二次點擊。
- [ ] 與 **時間模組**（流月／疊宮）對齊後，是否取代或輔助 rule-based（**Step 2**）。

### UI／導流

- [ ] **宮位承接：** 從 Root hash 進入後的 **高亮／短文案／置頂**（Step 1.1+）。
- [ ] **Step 2：** matrix「當前引動」資料契約。
- [ ] **Step 3：** Root ↔ Timeline CTA、路由、權限。
- [ ] 多語系／無障礙：CTA 與推薦句的 **aria**。

### 模型與架構

- [ ] **RootViewModel**：單一入口統籌推薦宮位、audit、下游宮位／時間軸。
- [ ] A/B 或多 CTA 時的實驗框架。

---

## 版本

| 日期 | 說明 |
|------|------|
| 2026-03-24 | 初稿：Step 1 僅規格，不含實作；含待辦清單 |
| 2026-03-24 | 加重：DOM/scroll、語意分類、CTA 帶原因、fallback telemetry、承接情境、資料對應與 `HomeSummary` 現況 |
