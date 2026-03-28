# 命宮視覺重構頁 vs `SectionPalaceTemplate`：順序對齊與折疊策略

## 檔案

- **原版弧線＋舊段落順序**：`palace-ming-refactor.html`（保留，不與本規格同步修改）
- **與 React 模板區塊順序一致**：`palace-ming-refactor-section-order.html`
- **生命線 SVG**：使用 `pmso-trunk-gradient`、`pmso-glow-gold` 等前綴 id，避免同頁多區塊重複 id

## 與 `SectionPalaceTemplate.tsx` 相同的區塊順序

1. **Header**：`title`、`subtitle`、`signals`（符文）
2. **分隔**：`STAR_ATLAS`（對應「本宮星曜」區；靜態頁以生命線＋主星卡＋弧線星群＋「查看全部」替代原本的 `<details>` 星表）
3. **靈魂共振儀**：`resonance.calibration`、`resonance.cards`、`resonance.triggers`
4. **摘要**：`summary`（`angelWhisper`）
5. **分隔**：`resonance.archivesHeading`（預設字樣 `CORE_ARCHIVES`）
6. **核心解讀**：`whyItMatters`、`inertiaNarrative`、`recommendAction`（對應三塊 `sacredSlate`）
7. **原始命書**：`preservedNarratives` 四欄（`structure` / `behavior` / `blindSpots` / `strategicAdvice`）
8. **三方四正**：`relatedPalaceLinks`（命宮預設財帛／官祿／遷移）
9. **命運投射**：`fateProjection`（`nodes.length > 0` 時才應渲染；靜態頁為演示固定一筆）
10. **付費試讀**：`premiumTeaser`＋ veil（靜態頁預設 `hidden`，對應無 veil 或試讀關閉）

## 折疊／預設展開（建議 React 一併遵守）

| 資料 / UI | 預設狀態 | 說明 |
|-----------|----------|------|
| `preservedNarratives`（SOURCE_NOTES） | **折疊**（`<details>`） | 與現有模板一致；長原文不干擾首屏 |
| 模板內「星曜列表」`details`（STAR_ATLAS） | **折疊** | 現有 `SectionPalaceTemplate` 行為 |
| 視覺版「查看全部星曜」網格 | **折疊**（按鈕 toggle） | 僅視覺版；模板無此項 |
| 星曜點擊神諭 Modal | **關閉**，互動才開 | overlay，非區塊折疊 |
| `resonance.calibration`、三張 `cards` | **展開** | 與模板一致 |
| `resonance.triggers` | **展開** | 與模板一致 |
| `summary`、三塊核心解讀、`fateProjection`（有資料時） | **展開** | 與模板一致 |
| `premiumTeaser` | 有資料時顯示區塊；遮罩內文為「試讀／升級」 | 非 `<details>` 折疊，屬權限遮罩 |

## 僅視覺版具備、模板目前沒有的項目

- 底部生命線 SVG、弧線星群、`z-index` 分層的「查看全部星曜」膠囊
- 主星卡上的雙主星段落：正式資料應來自 **`getMingDualMainStarNarrativeText`** 所用之 `ming-dual-main-stars-zh-TW.json`（鍵為 `canonicalMingDualStarKey`，即兩星 `zh-Hant` 排序後 `甲+乙`）

## 雙主星與亮度（實作約定）

- **亮度 badge**：來自命盤解析字串（如廟、旺、陷），對應 `SectionStarItem.brightness` / `parseStarName`；無資料則不顯示 badge。
- **雙主星內文**：以組合語料為準；無 `entries` 鍵時顯示佔位說明，由內容端補 JSON。
