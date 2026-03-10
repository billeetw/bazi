# 命書現有內容對照：哪些可沿用、哪些需補足

## 一、現有內容在哪裡、什麼格式

| 類別 | 來源 | Key 格式 | 數量 | 說明 |
|------|------|----------|------|------|
| **宮位一句話** | content-zh-TW.json `palaces` | 中文：`命宮`、`兄弟`… | 12 | 每宮一句（如「你的核心作業系統」） |
| **星曜 base** | content-zh-TW.json `stars` | 中文：`紫微`、`天府`… | 14 主星 + 輔星 | 主星每顆**一段**（核心本質＋成熟/失衡＋課題，多行） |
| **星曜×宮位** | content-zh-TW.json `starPalaces` | `紫微_命宮`、`天府_財帛`… | **168**（14×12） | 每格 25–40 字小句，主星已滿格 |

現有 API / Worker 使用方式：

- `content.stars["紫微"]`、`content.starPalaces["紫微_命宮"]`（或 D1 `copy_key`: `star.紫微`、`starPalace.紫微_命宮`）
- 宮位在 content 裡是 `palaces["命宮"]`（`palace.命宮`）

---

## 二、與新 ontology 的對應關係

| 新 schema（Phase 2 key） | 現有內容 | 對應方式 |
|--------------------------|----------|----------|
| `star.base.{starId}.core` / `.mature` | `stars["紫微"]` 等 | 現有是**一段**，可當 `.core` 或拆成 core＋補寫 `.mature` |
| `star.palace.{starId}.{palaceId}` | `starPalaces["紫微_命宮"]` 等 | **一對一**：用 `STAR_NAME_ZH_TO_ID`、`PALACE_NAME_ZH_TO_ID` 轉成 id 再查，或反過來用中文 key 查 |
| 宮位說明 | `palaces["命宮"]` 等 | 沿用，新系統用 `palaceId` 時可透過「宮位中文名」對照取現有值 |

**結論**：  
- **星曜×宮位 168 筆**：與新格式完全對應，**文案可直接沿用**，只差在「用中文 key 還是用 id key」的查表方式。  
- **星曜 base**：現有 14 段可沿用為 **core**（或拆段），**缺的是 14 段 mature**（成熟後的使用方式）。  
- **宮位**：現有 12 句可沿用，新 ontology 的 `label` 是另一層（概念標籤），不衝突。

---

## 三、建議：**沿用 + 補足**，不要全部換掉

### 理由

1. **星×宮 168 筆**已上線、語氣統一、長度合適（25–40 字），重寫成本高且易破壞一致性。
2. **星 base** 現有 14 段已涵蓋「核心本質、成熟/失衡、課題」，只需**拆成兩段**或**保留整段當 core、再補 14 段 mature**，不必整批重寫。
3. **宮位** 12 句簡短穩定，沿用即可；新 schema 的 `PALACES[].label` 是給「生命領域」用，與 content 的「一句話說明」並存。

### 不建議「全部換掉」的原因

- 全部換成新 key（如 `star.palace.ziWei.ming`）等於重寫 168 條＋14 段，品質與時程風險都高。
- 現有 API 與 content 結構（`starPalace.紫微_命宮`、`star.紫微`）已多處使用，**雙軌並行**（查表時新舊 key 都支援）比一次性替換安全。

---

## 四、具體做法：沿用 vs 補足

### 4.1 星曜×宮位（168 筆）→ **100% 沿用**

- **保留**：`starPalaces["紫微_命宮"]` … 共 168 筆，不改文案。
- **組裝層**：  
  - 命盤算出「星名 + 宮位中文名」後，用現有 key `星名_宮名` 查 `content.starPalaces`；  
  - 若未來改用新 key（D1 `star.palace.ziWei.ming`），可寫一層**對照函式**：`getStarPalaceContent(starId, palaceId)` 先試新 key，沒有再 fallback 到 `starPalaces[STAR_ID_TO_NAME[starId] + "_" + PALACE_ID_TO_NAME[palaceId]]`。
- **你要補**：無需補；若日後要「輔星×宮位」再擴 324 筆。

### 4.2 星曜 base（14 主星）→ **沿用 + 補足**

- **沿用**：  
  - 現有 `stars["紫微"]` … 共 14 段，可當作 **core**（整段）或拆成「核心本質」當 core、「成熟/失衡/課題」當 mature（由你決定）。  
  - 若不想拆，就**整段當 core**，mature 另補。
- **補足**：  
  - **14 段 mature**：每顆主星「修煉成熟後的使用方式」一段（可 80–150 字）。  
  - 新 key 建議：`star.base.{starId}.mature`（若現有整段當 core，則 `star.base.{starId}.core` = 現有內容，或拆成兩段後都寫進 D1/靜態）。
- **key 對照**：  
  - 現有：`star.紫微`（一段）  
  - 新：`star.base.ziWei.core`、`star.base.ziWei.mature`  
  - 組裝時可：有 `star.base.*.core` 就用新的，沒有就 fallback 到 `stars["紫微"]`（用 STAR_ID_TO_NAME 反查中文名）。

### 4.3 宮位（12 筆）→ **100% 沿用**

- **保留**：`palaces["命宮"]` … 共 12 筆。
- **新 schema**：`PALACES` 已有 id、name、label、lifeDomain；**文案**仍用 content 的 `palaces[宮名]`，不需重複建 12 段新 key，除非你希望「宮位說明」也改成 `palace.{palaceId}` 格式（可選，非必須）。

---

## 五、總結表：你要補什麼

| 項目 | 現有 | 建議 | 你要補的 |
|------|------|------|----------|
| 宮位說明 | 12 句 | 沿用 | 無 |
| 星曜 base | 14 段（一段/星） | 沿用當 core，或拆成 core | ~~**14 段 mature**~~ **已補齊**：寫入 `content-zh-TW.json` → `starBaseMature`，並接上 `DbContent.starBaseMature` |
| 星×宮小句 | 168 筆 | 沿用 | 無（輔星×宮位可 Phase2 再補） |

**一句結論**：  
**星曜、宮位、星曜在不同宮位的解釋，現有 168 筆星×宮與 14 段星 base 都建議沿用；只補足「星 base 的 mature 段」14 筆即可。** 全部換掉不建議，沿用＋補足最省工且風險最低。
