# 命書 Placeholder 代入與後續迭代

## 本次改動（星曜×宮位、十神×宮位、大限／流年、流年・小限）

### 1. 星曜×宮位原型與描述
- **AssembleContentLookup** 新增：`starPalaces`、`tenGodPalaces`、`tenGodPalacesById`。
- **getPlaceholderMap**：當 `content.starPalaces` 存在時，以 `「星名_宮名」`（如 `紫微_福德`）查表，將該星在該宮的表現寫入 `starArchetypeTitle`、`starArchetypeDescription`、`starArchetype`，覆蓋僅依星曜的通用原型。
- 星名／宮名來自 schema 的 `STAR_ID_TO_NAME`、`PALACE_ID_TO_NAME`，與既有 content key（如 content-zh-TW 的 `starPalaces`）一致。

### 2. 十神×宮位角色描述
- **getPlaceholderMap**：依本題 `palaceId` 與 `tenGodId`，查 `content.tenGodPalaces`（key：`十神名_宮名`）或 `content.tenGodPalacesById`（key：`tenGodId.palaceId`），寫入 **`tenGodPalaceRole`**。
- 骨架中可使用 `{tenGodPalaceRole}` 顯示該宮十神在該宮的角色描述；缺資料時由通用 fallback 顯示「依十神與本宮對照。」

### 3. 大限／流年：不填通用 fallback
- **decadal***（s15）、**year***（s16）等欄位：僅在確實有大限／流年宮位與 content 對應時代入。
- 缺資料時**不再**用「第一個星曜／五行／心識」當 fallback，保留未解析，由 `resolveSkeletonPlaceholders` 顯示「（此欄位資料不足）」，方便排查是缺 `chartJson.decadalLimits`／`yearlyHoroscope` 還是 content 缺 key。

### 4. 流年・小限章節：年份與小限落宮
- **getPlaceholderMap** 從 `chartJson.yearlyHoroscope` 讀取：
  - **flowYear**：`year`（西元年）
  - **xiaoXianPalaceName**：`activeLimitPalaceName` 或 `palaceNames[0]`（小限落宮名稱）
- **s16 骨架**（`lifebookSection-zh-TW.json`）已加入：
  - `{flowYear}`：用於「{flowYear} 年」「迎接 {flowYear} 年課題」
  - `{xiaoXianPalaceName}`：用於「小限落於 {xiaoXianPalaceName}」「小限（{xiaoXianPalaceName}）心理濾鏡」
- 若請求未帶 `yearlyHoroscope`（或無 `year`／`activeLimitPalaceName`），`flowYear`／`xiaoXianPalaceName` 會顯示「（此欄位資料不足）」以便確認命盤解析層是否有傳入。

---

## 後續迭代建議

1. **命盤解析層**  
   - 確保 `chartJson` 提供：`starByPalace`（或由 ziwei 推導）、`decadalLimits`、`yearlyHoroscope`（含 `year`、`activeLimitPalaceName` 或 `palaceNames`）。  
   - 若有「(starCode, palaceKey) → archetype」對照表，可繼續用現有 `content.starPalaces`（`星名_宮名`）或擴充 key 格式，在 **getPlaceholderMap** 中沿用或擴充現有查表即可。

2. **骨架與 placeholder**  
   - 各宮位章節已可多用 `{starArchetypeTitle}`、`{starArchetypeDescription}`（現由星曜×宮位優先代入）、`{tenGodPalaceRole}`。  
   - 流年・小限相關章節已支援 `{flowYear}`、`{xiaoXianPalaceName}`；若需更多時間維度（例如大限宮名），可再擴充 `getDecadalAndYearPalaceKeys` 與 map 的 key。

3. **content 來源**  
   - `starPalaces`、`tenGodPalaces`／`tenGodPalacesById` 需在 D1 或靜態 JSON 中提供，並經 `getContentForLocale` 合併進傳給 **getPlaceholderMap** 的 `content`，目前型別已掛在 **AssembleContentLookup** 上。
