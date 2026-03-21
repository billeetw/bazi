# 只讀 Findings vs 可讀 Chart+Content 的差異

命書組裝時，**資料從哪裡來**有兩種契約：**只讀 LifebookFindings** 與 **可讀 chart + content**。差異在「誰算、誰存、誰讀」。

---

## 1. 一句話對照

| 模式 | 誰產出資料 | 組裝層讀什麼 | 適用章節（目前契約） |
|------|------------|--------------|------------------------|
| **只讀 Findings** | chart → 正規化／引擎 → **寫入 LifebookFindings** | 組裝**只讀 findings**，不碰 chart / content | s00、s03、s15～s21（若恢復） |
| **可讀 Chart+Content** | 不強制寫入 findings | 組裝**直接讀** chart、content、（s04 時）config | 核心 13 段（s04 + 12 宮） |

---

## 2. 資料流差異

### 只讀 Findings

```
chartJson ──► 正規化／引擎（buildLifebookFindings、buildP2FindingsAndContext 等）
                    │
                    ▼
             LifebookFindings（timeAxis、sihuaPlacement、keyYears、actionItems…）
                    │
                    ▼
             組裝層（getPlaceholderMap、模板替換）只准從 findings 取欄位
                    │
                    ▼
             命書輸出
```

- **組裝層**：不拿 `chartJson`、不拿 `content`，只拿 `findings.xxx`。
- **優點**：單一真相在 findings；可快取／預先算 findings 再多次組裝；API 可只回傳 findings 讓別端組裝。
- **代價**：所有要顯示的都要先寫進 findings；findings 結構一變，組裝與引擎都要對齊。

### 可讀 Chart+Content（目前核心 13 段）

```
chartJson ──┐
            ├──► 組裝層（getPlaceholderMapFromContext）直接讀 chart + content + config
content ────┤              │
config ─────┘              ▼
                    命書輸出
```

- **組裝層**：可讀 `chartJson`（ziwei、mainStars…）、`content`（語句庫、模板）、s04 時還有 `config`（命主/身主/身宮）。
- **優點**：不必為 s04/12 宮擴充 findings；新加 content 或 chart 欄位可立刻用；實作簡單。
- **代價**：真相分散在 chart / content；若日後要「預算好再組裝」或「只傳 findings 給前端」，需再改寫成「先寫入 findings 再讀」。

---

## 3. 實務上的差別

| 項目 | 只讀 Findings | 可讀 Chart+Content |
|------|----------------|---------------------|
| **s04 命主/身主/身宮** | 需在寫入 findings 時就算好並寫進 findings（例如 `findings.masterStars`、`findings.bodyPalaceInfo`），組裝只讀這些欄位 | 組裝直接讀 index 組好的 `config.masterStars`、`config.bodyPalaceInfo` 與 content 語句庫 |
| **12 宮星曜與解釋** | 需在 findings 裡有「每宮星曜、每宮敘事」等欄位，組裝只讀 findings | 組裝直接讀 `chartJson.ziwei` / starByPalace 與 content（starPalacesMain、palaceContexts、各宮語句庫） |
| **新增一個 content 欄位** | 要先決定對應的 findings 欄位，引擎寫入，組裝再讀 | 組裝可直接讀 content 新欄位，不必動 findings |
| **快取／離線組裝** | 可只快取 findings，用同一份 findings 多次組裝或不同模板 | 需要 chart + content（+ config）一起才有辦法組裝 |
| **誰負責「命理計算」** | 全在「寫入 findings 前」的引擎；組裝零計算 | 組裝可含輕量推論（例如從 chart 取星、從 content 取句），但契約仍約定不把 overlap 當唯一真相 |

---

## 4. 目前契約下的選擇

- **核心 13 段（s04 + 12 宮）**：契約允許**可讀 chart+content**（見 `lifebook-core-sections-contract.md`）。實作上就是 getPlaceholderMapFromContext 直讀 chart、content、config，不依賴 findings 的 s04/12 宮專用欄位。
- **其餘章節（s00、s03、s15～s21，若恢復）**：契約為**只讀 findings**；組裝不直讀 chart，只讀 LifebookFindings（與 injectTimeModuleDataIntoSection 的 P2 路徑一致）。

若日後要讓核心 13 段也改為「只讀 findings」，需要：

1. 在產出 findings 時寫入 s04 與 12 宮所需欄位（命主/身主/身宮、每宮星曜、每宮敘事等）；
2. 組裝改為只從 findings 讀這些欄位；
3. 更新契約：廢除「核心章節可直讀 chart+content」的例外。
