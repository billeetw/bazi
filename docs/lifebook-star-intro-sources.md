# 命書：星曜介紹語料來源一覽

目前程式裡**與「星曜介紹」有關**的語料如下。**沒有一份是「完整多段介紹」**，多為一句或數句。

---

## 1. 主星（14 顆）：`worker/src/lifebook/starSemanticDictionary.ts`（STAR_SEMANTIC_DICTIONARY）

| 欄位 | 說明 | 長度 |
|------|------|------|
| `core` | 關鍵詞（如「領導、主導權與中心角色」） | 一句 |
| `plain` | 一句話白話（如「你在意自己是否有位置、有影響力…」） | 一句 |
| `themes` | 主題陣列（領導、權威、決策…） | 數個詞 |
| `risk` | 風險／陰影一句 | 一句 |
| `advice` | 建議一句 | 一句 |

**涵蓋**：紫微、天機、太陽、武曲、天同、廉貞、天府、太陰、貪狼、巨門、天相、天梁、七殺、破軍。  
**沒有**：輔星、煞星、雜曜。

---

## 2. 主星核心一句：`worker/content/starBaseCore-zh-TW.json`

- **Key**：starId（如 `ziWei`, `tianJi`）
- **內容**：每顆主星一句「本質／核心」描述。  
  例：`"tianJi": "極速的邏輯運算與多維度的變量分析，追求最優解。"`
- **涵蓋**：同上 14 顆主星。

---

## 3. 主星陰影一句：`worker/content/starBaseShadow-zh-TW.json`

- **Key**：starId（同上）
- **內容**：每顆主星一句「陰影／失衡」描述。  
  例：`"tianJi": "腦袋停不下來的焦慮，易陷入碎形思考而導致決策癱瘓。"`
- **涵蓋**：同上 14 顆主星。

---

## 4. 輔星／煞星／雜曜一句：`worker/content/starBaseMeaning-zh-TW.json`

- **Key**：`starBaseMeaning` 底下的**中文星名**（左輔、右弼、天魁、天鉞、文昌、文曲、祿存、天馬、擎羊、陀羅、火星、鈴星、地空、地劫、月德、破碎…）
- **內容**：多為「象徵…」一句。  
  例：`"右弼": "象徵人際支援與協作資源。"`、`"月德": "象徵溫和的助力與轉圜空間。"`
- **涵蓋**：輔星、煞星、雜曜；**不含 14 主星**（主星用 starBaseCore）。

---

## 5. 主星「落宮邏輯」一句：`worker/content/starPalacesMain-zh-TW.json` → `starLogicMain`

- **Key**：中文星名（14 主星）
- **內容**：「這顆星在哪，那裡就是…」的邏輯句，不是星曜本身介紹。  
  例：`"天機": "天機在哪，那裡就是妳「動腦筋、算計、焦慮」的地方。"`

---

## 6. 星曜 × 宮位表現：`starPalacesMain` / `starPalacesAux`

- **starPalacesMain-zh-TW.json** 的 `starPalacesMain`：主星在 12 宮的表現（每宮一段）。
- **starPalacesAux-zh-TW.json**：輔星等在宮位的解釋。
- 這是「**在本宮的表現**」，不是「星曜本身介紹」。

---

## 7. 英文多段介紹：`worker/content/content-en.json` → `stars`

- **Key**：英文名（emperor, advisor, sun, helper, aide…）
- **內容**：多行為「Core Essence: …」＋數句（優勢／陰影／成長）。  
  **僅英文**，目前 **zh-TW 沒有對應的「完整多段介紹」** 語料。

---

## 總結：中文「星曜完整介紹」現狀

| 類型 | 主星 | 輔星／煞／雜曜 | 是否「完整介紹」 |
|------|------|----------------|------------------|
| 語意字典 core/plain/risk/advice | ✅ 有（短句） | ❌ 無 | 否，為短句組合 |
| starBaseCore | ✅ 一句 | ❌ 無 | 否，一句 |
| starBaseShadow | ✅ 一句 | ❌ 無 | 否，一句 |
| starBaseMeaning | ❌ 無 | ✅ 一句「象徵…」 | 否，一句 |
| 多段完整介紹（zh-TW） | ❌ 無 | ❌ 無 | **目前沒有** |

若要【星曜介紹】區塊改為「**完整介紹**」（逐顆一段或多段），可以：

1. **新增語料**：例如 `starIntroFull-zh-TW.json`（每顆星一段完整介紹），再由程式逐顆輸出。
2. **用現有欄位組裝**：主星 = starBaseCore + starBaseShadow +（語意字典的 plain / risk / advice）拼接成一段；輔星／雜曜 = starBaseMeaning（仍只有一句，或再補一句若日後有）。

如需我依你選的方案改 `buildPalaceStarIntroBlock` 或設計 `starIntroFull` 的 key 格式，可以指定要「新增語料」或「現有欄位組裝」。
