# 前端 168 顆星曜解釋資料來源與 Worker 對齊修正

## 一、前端（www.17gonplay.com）星曜資料從哪裡來

### 1. 資料載入

- **API**：`ApiService.loadDbContent()` 取得合併後的 `dbContent`（語系 + zh-TW fallback）。
- **靜態**：`worker/content/content-zh-TW.json` 內含完整 **stars**、**starPalaces**，與 API 回傳結構一致。

### 2. 星曜「通用解釋」（168 顆）

- **使用處**：`js/ui/components/palace-detail.js`（點宮位後的星曜卡片）。
- **取法**：`ContentUtils.getContentValue(dbContent, "stars", s, null)`，其中 `s` = 星名（中文，如 `"火星"`、`"封誥"`）。
- **對應資料**：`dbContent.stars[星名]`，即 **content-zh-TW.json 的 `stars`**，key 為**中文星名**（紫微、天機、火星、封誥、月德、天廚、破碎…），共約 80+ 條（與 168 顆對應的完整清單以實際 JSON 為準）。
- **本地 fallback**：`js/ui/utils/content-utils.js` 的 `STAR_FALLBACK_ZH`，key 同樣為中文星名，API 失敗時使用。

### 3. 星曜「在該宮位表現」

- **使用處**：同上，`palace-detail.js` 每顆星下方的「此星在此宮的表現」。
- **取法**：`ContentUtils.getStarInPalaceContent(dbContent, s, name, null)`，`s` = 星名，`name` = 宮位名（如 財帛、命宮）。
- **對應資料**：`dbContent.starPalaces[starName + "_" + palaceName]`，例如 `"火星_財帛"`、`"紫微_命宮"`。
- **來源**：
  - **worker/content/content-zh-TW.json** 的 `starPalaces`（key 格式：`星名_宮名`，宮名多數為短名如 財帛、兄弟，命宮仍為 命宮）；
  - 或 **data/star-palaces-zh-TW.json**（由 `scripts/sync-star-palaces.js` 從 content-zh-TW 同步，勿手動改）。

### 4. 小結：前端 168 顆都有解釋的原因

- **通用解釋**：來自 **content-zh-TW.json 的 `stars`**（中文 key）+ content-utils 的 **STAR_FALLBACK_ZH**。
- **在宮表現**：來自 **content-zh-TW.json 的 `starPalaces`**（`星名_宮名`）+ **data/star-palaces-zh-TW.json** 作 fallback。

---

## 二、Worker 命書為何之前取不到火星、封誥等

### 1. 星曜說明（baseMeaning）

- Worker 只查 **content.starBaseCore[starId]**。
- **worker/content/starBaseCore-zh-TW.json** 只有 **14 主星**，且 key 為 **camelCase id**（如 lianZhen、ziWei），沒有 火星、封誥、天廚、月德、破碎 等輔星／煞星。
- 命盤的 `starByPalace` 會包含所有星（含火星等），但 schema 的 `STAR_NAME_ZH_TO_ID` 只有 14 主星，其餘用星名字串當 id，因此 **content.starBaseCore["火星"]** 為空。

### 2. 星在宮表現（meaningInPalace）

- Worker 只查 **content.starPalaces[`${name}_${palaceName}`]**，例如 `"火星_財帛宮"`。
- content-zh-TW 的 key 是 **"火星_財帛"**（宮名多數不加「宮」），因此對不上。

---

## 三、已做的 Worker 修正（lifeBookPrompts.ts）

1. **星曜說明**  
   - 先查 `content.starBaseCore[starId]`（14 主星、camelCase）。  
   - 若無，再查 **content.stars[星名]**（與前端相同：**中文 key**，來自 content-zh-TW.json 的 `stars`）。  
   - 這樣 火星、封誥、月德、天廚、破碎 等都會從 `content.stars` 取得與前端一致的 168 顆解釋。

2. **星在宮表現**  
   - 先查 `content.starPalaces["星名_宮名"]`（例如 火星_財帛宮）。  
   - 若無，再查 `content.starPalaces["星名_宮短名"]`（例如 火星_財帛）。  
   - 與 content-zh-TW 的 `starPalaces` key 格式一致，命宮仍用「命宮」。

如此 Worker 命書的「星曜詳解」與「此宮表現」會與前端同一套 content（content-zh-TW.json + star-palaces-zh-TW.json）對齊，168 顆星在命書中也會有完整星曜說明與在宮表現。
