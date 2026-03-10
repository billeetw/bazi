# 規則結果 → 可閱讀命書句型 渲染層：可行性分析

## 目標摘要

- **句庫**：依 ruleType 提供 message / action / evidence 模板（可輪替）
- **Renderer**：patternHits → 不重複、可引用、有證據的文案塊
- **插入點**：模組一（s00 / s03）取 Top 3–5；12 宮取與該宮相關 1–3，且模組一已出現的 ruleId 用短版

---

## 一、現有資源（可直接用）

| 項目 | 位置 | 說明 |
|------|------|------|
| `PatternHit` | `s00PatternEngine.ts` | 已有 `ruleId`, `priority`, `evidence`, `message`, `action` |
| `evaluateFourTransformPatterns(events)` | 同上 | 產出已依 priority 排序的 hits |
| `evidence` 結構 | 各規則 when 回傳 | 含 `star`, `palace`, `layers`, `fromPalace`, `toPalace`, `target`, `transform`, `count`, `palaces` 等，可推得「涉及宮位／星曜」 |
| s00 模板 | `lifebookSection-zh-TW.json` | 已有 `{s00HotSummary}`, `{s00PatternBlock}`，可改為或新增「全盤結構重點」 |
| 宮位 placeholder | `getPlaceholderMapFromContext` | 依 `sectionKey` + `palaceKey` 填寫，可加 `palaceSiHuaHints`, `palaceGlobalLinkHints` |

---

## 二、需補項目（實作清單）

### 1. ruleType 對應

- **現狀**：僅有 `S00RuleId`（20 條），無 ruleType 分組。
- **要補**：建立 `S00RuleId → ruleType` 對照。建議 ruleType 與你需求對齊，例如：
  - 同星疊加 (R01)
  - 同宮疊加 (R02)
  - 同宮同化疊加 (R03, R20)
  - 同星祿忌 (R04)
  - 同宮祿忌 (R05)
  - 權忌同點 (R06)、科忌同點 (R07)
  - 十年×流年同步 (R08, R09, R10)
  - 忌出宮/祿入宮/權入宮/科入宮 (R11, R12, R13, R14)
  - 祿集中/忌分散 (R15, R16)
  - 權強科弱/科強權弱/僅祿忌 (R17, R18, R19)

### 2. Pattern Phrase Library（句庫）

- **格式**：TS 常數（易型別檢查、可與 engine 同 repo）。
- **內容**：每個 ruleType 至少
  - 3 個 message templates
  - 3 個 action templates
  - 2 個 evidence templates
- **Placeholder**：支援 `{palace}`, `{palaceA}`, `{palaceB}`, `{fromPalace}`, `{star}`, `{star1}`, `{star2}`, `{layer1}`, `{layer2}`, `{evidenceText}`, `{transform}`, `{target}`, `{toPalace}`, `{count}`, `{palaces}` 等（與現有 evidence 鍵名對齊）。
- **輪替**：同 ruleType 用 `hash(ruleId) % templates.length` 選模板，deterministic。

### 3. palacesInvolved / starsInvolved

- **現狀**：PatternHit 無 `palacesInvolved` / `starsInvolved` 陣列。
- **做法**：不改 `evaluateFourTransformPatterns`，在 renderer 內用**純函式**從 `hit.evidence` 推導：
  - `getPalacesInvolved(hit)`: 從 evidence 的 `palace`, `toPalace`, `fromPalace`, `target`, `palaces`（陣列）彙整成 `string[]`（宮名統一為「XX宮」）。
  - `getStarsInvolved(hit)`: 從 evidence 的 `star`, `star1`, `star2` 彙整成 `string[]`。
- **用途**：宮位章節 filter「只取 palacesInvolved 包含該宮」的 hits；多宮連動類可放在「全盤關聯提示」。

### 4. Renderer 行為

- **選取**  
  - 模組一：取已排序 hits 前 3–5。  
  - 宮位：filter `getPalacesInvolved(hit).some(p => normPalace(p) === normPalace(palaceKey))`，取 1–3。
- **去重**  
  - 同章節：同一 `ruleId` 只出現一次。  
  - 全書：若某 ruleId 已在模組一出現，宮位章節只輸出**短版**（例如「本宮也受此結構牽動」+ 證據一句），不重複完整判讀/行動。
- **輸出格式**（每條）  
  - 判讀句（message）  
  - 證據句（evidence，至少一行）  
  - 行動句（action）  
- **AI 渲染版**：不輸出 `ruleId`、`priority`、`riskLevel`、括號內風險係數；技術版可保留（由呼叫端傳 `forTechnicalOutput`）。

### 5. 命書插入點

- **s00**  
  - 新增 placeholder：`{s00GlobalHighlights}`（或沿用/取代部分 `s00PatternBlock`）。  
  - 內容：Renderer 對「全盤」輸出的 Top 3–5 條（每條：判讀 + 證據 + 行動），AI 版不帶 ruleId。
- **s03**  
  - 已有 `siHuaPatternTopBlocks`（模組一四化慣性），可改為改用同一 Renderer 產出，或維持現狀只確保格式一致（判讀/證據/操作）。
- **12 宮**  
  - 在「策略建議」前插入兩段：  
    - **全盤關聯提示**：多宮連動 or 涉及該宮與他宮的 hits（1–2 條，短版若已在模組一出現）。  
    - **本宮四化提示**：該宮最相關的 1–3 條（同上，短版邏輯）。  
  - 新增 placeholder：`{palaceGlobalLinkHints}`, `{palaceSiHuaHints}`，在 `getPlaceholderMapFromContext` 中依 `palaceKey` 與全盤 hits 計算後填入。

### 6. 技術版 vs AI 版

- **技術版**：可保留 ruleId、priority、必要時 riskLevel；由 `forTechnicalOutput === true` 控制。
- **AI 版**：strip 掉 ruleId、priority、riskLevel、`（風險N）`；Renderer 與 placeholder 產出時依 `forTechnicalOutput === false` 不寫入這些欄位。

---

## 三、驗收對應

| 驗收項 | 做法 |
|--------|------|
| 模組一（s00）有 3–5 條命中結構，每條都有 evidence | Renderer 模組一模式取 Top 3–5，每條強制輸出證據句 |
| 宮位章節不重複模組一整段 | 若 ruleId 已在模組一使用，宮位只出短版 |
| 至少 1 條有 evidence 的「本宮四化提示」 | 宮位 filter 後至少渲染 1 條，且每條含證據句 |
| 全書無 risk 數字、priority、ruleId（AI 版） | Renderer + placeholder 在 AI 路徑不寫入上述欄位 |
| 每段對應到具體星曜/宮位/層級 | 證據句從 evidence 組成一行的「層+星+宮」等 |

---

## 四、建議實作順序

1. 新增 **patternPhraseLibrary.ts**（ruleType 對照 + 各 ruleType 的 message/action/evidence 模板陣列）。  
2. 新增 **patternHitRenderer.ts**（或放在 s00PatternEngine 同目錄）：  
   - `getPalacesInvolved(hit)`, `getStarsInvolved(hit)`  
   - `renderPatternHitsForModuleOne(hits, options)`  
   - `renderPatternHitsForPalace(hits, palaceKey, moduleOneRuleIds, options)`  
   - 內部分別呼叫「選模板（輪替）→ 填 placeholder → 組判讀/證據/行動」。  
3. 在 **lifeBookPrompts** 的 `getPlaceholderMapFromContext` 中：  
   - s00：呼叫 renderer 產出 `s00GlobalHighlights`（或取代 s00PatternBlock 內容）。  
   - 12 宮：若有 `palaceKey`，用全盤 hits 產出 `palaceSiHuaHints`、`palaceGlobalLinkHints`，並傳入「模組一已用 ruleIds」以便短版。  
4. 更新 **lifebookSection-zh-TW.json**：  
   - s00 的 structure_analysis 加入或改為使用 `{s00GlobalHighlights}`。  
   - 各宮 structure_analysis 或 strategic_advice 在策略建議前插入 `{palaceGlobalLinkHints}`、`{palaceSiHuaHints}`。  
5. 技術版／AI 版分岐：`getPlaceholderMapFromContext` 已存在 `forTechnicalOutput`，Renderer 與 placeholder 產出時傳入該參數即可。

以上為可行性分析與需補項目；實作時依此清單逐項完成即可對齊「規則結果 → 可閱讀命書句型」的渲染層目標。

---

## 五、實作完成摘要（已接上）

### 新增／修改檔案

| 檔案 | 說明 |
|------|------|
| **worker/src/lifebook/patternPhraseLibrary.ts** | 新增。20 條 S00RuleId 各 3 message / 3 action / 2 evidence 模板；`getPhraseSet(ruleId)`、`pickTemplateIndex(ruleId, n)` 供輪替。 |
| **worker/src/lifebook/patternHitRenderer.ts** | 新增。`getPalacesInvolved(hit)`、`getStarsInvolved(hit)`；`renderPatternHitsForModuleOne(hits, 5, options)`；`renderPatternHitsForPalace(hits, palaceKey, moduleOneRuleIds, 2, 3, options)`；`getModuleOneRuleIds(hits, 5)`。多宮連動類 R11/R15/R16 用於全盤關聯；模組一已出現的 ruleId 在宮位用短版「本宮也受此結構牽動」+ 證據。 |
| **worker/src/lifebook/index.ts** | 匯出 renderer 與 phrase library。 |
| **worker/src/lifeBookPrompts.ts** | s00 分支寫入 `s00GlobalHighlights`（Top 3–5 渲染）；12 宮分支寫入 `palaceGlobalLinkHints`、`palaceSiHuaHints`（依 chartJson 算 hits + 模組一 ruleIds）。 |
| **worker/content/lifebookSection-zh-TW.json** | s00 structure_analysis 加入 `{s00GlobalHighlights}`；s02/s01/s05～s14 的 strategic_advice 在策略建議前加入 `{palaceGlobalLinkHints}`、`{palaceSiHuaHints}`。 |
| **docs/pattern-phrase-renderer-feasibility.md** | 本文件：可行性分析與實作摘要。 |

### 驗收與輸出形式

- **模組一（s00）**：`s00GlobalHighlights` 為「【全盤結構重點】」+ Top 3–5 條，每條：判讀句 → 證據句 → 行動句；技術版每條尾可帶 `[ruleId]`，AI 版不帶。
- **宮位章節**：`palaceGlobalLinkHints`（全盤關聯 1–2 條）、`palaceSiHuaHints`（本宮四化 1–3 條）；若該 ruleId 已在模組一出現則只出短版＋證據。
- **AI 渲染版**：`forTechnicalOutput: false` 時不輸出 ruleId／priority／riskLevel；技術版由既有 `forTechnicalOutput: true` 保留。

### 範例輸出片段（格式示意）

**s00 全盤結構重點（示意）**

```
【全盤結構重點】

財帛宮 被 本命、大限 同時點亮 → 這裡是事件主舞台。
證據：本命、大限 四化皆入 財帛宮。
重大決策先檢查 財帛宮：資源/責任是否在此集中？

天同 同時是祿與忌 →「想要更多」與「怕出事」會拉扯在同一題上。
證據：天同 同時化祿與化忌（多層或同層）。
對 天同 類事件：先訂規則/界線，再加碼投入。
```

**財帛宮 本宮四化提示（示意）**

```
【本宮四化提示】

天機化祿飛入 財帛宮 → 資源、人脈、機會更容易在 財帛宮 聚集。
證據：天機 化祿飛入 財帛宮。
把主動投資放在 財帛宮，效果最好。
```

（實際內容依命盤 events 與規則命中結果而定；無命中時該 block 為空字串，模板中留空行由前端決定是否隱藏。）
