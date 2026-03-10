# 命理師語氣層（narrative tone）可行性與執行摘要

## 目標與邊界（已確認）

- **目標**：s00 / 模組一 / 模組二 改為「命理師諮詢語言」觀察→解釋→建議，每段有命盤證據與可操作建議。
- **邊界**：不破壞 copy_key、content/2026、D1 fallback；先只落地 s00，其他章節後續套用。

## 可行性結論

| 項目 | 可行性 | 說明 |
|------|--------|------|
| narrativeCorpus JSON | ✅ | 與現有 content 並存，靜態載入；D1 不傳則用 static，不破壞 merge。 |
| content 注入 | ✅ | 在 index 的 staticContent 加入 narrativeCorpus（與 starMetadata 同路徑）。 |
| Validator 擴充 | ✅ | validate-content-json.cjs 新增 validateNarrativeCorpus：檔案存在、s00、至少一種 rule、openers/explainers/advisers 非空陣列。 |
| narrativeToneEngine | ✅ | 純函數：hits + corpus + context → toneBlocks；canonicalKey = palace + transform 做去重合併；證據以「本命/大限/流年」命理師語句輸出，不輸出 ruleId。 |
| s00 placeholder | ✅ | 新增 s00NarrativeBlocks，由 tone engine 產出；s00 模板插入該 placeholder；技術版亦不輸出 R01_ 等 rule id。 |
| 缺 corpus 時 fallback | ✅ | 無 narrativeCorpus 或缺 key 時，s00NarrativeBlocks 回退為一句通用句或沿用現有 s00GlobalHighlights 邏輯。 |

## 執行狀態（本輪已完成）

- **技術版不輸出 rule id**：s00 的「全盤結構重點」一律以 `forTechnicalOutput: false` 呼叫 render，故 AI 版與技術版皆不出現 `[R01_...]` 等字樣；raw 四化表與飛星仍保留。
- **缺 corpus 時 fallback**：無 `narrativeCorpus.s00` 或無 hits 時，`s00NarrativeBlocks` 為「（本局四化重點見上方總表與下方判讀。）」。

---

## 執行項目（本輪）

1. **worker/content/narrativeCorpus-zh-TW.json**：s00 下至少 sameStarOverlap、samePalaceLuStack 兩類，每類 openers/explainers/advisers 各 5～10 條，支援 {star}、{layers}、{palace}、{transform}、{detail} 等變數。
2. **Content 注入**：index.ts 將 narrativeCorpus 合進 staticContent；content-from-d1 的 DbContent 新增可選 narrativeCorpus。
3. **Validator**：validate-content-json.cjs 增加 narrativeCorpus 存在、s00、必備 keys、每 rule 三類句型非空陣列。
4. **worker/src/lifebook/narrativeToneEngine.ts**：輸入 hits、corpus、context；ruleId→corpus key 對應；canonicalKey 合併；輸出觀察→解釋→建議段落，證據用命理師語言列點，絕不輸出 ruleId。
5. **s00**：getPlaceholderMapFromContext 產出 s00NarrativeBlocks；lifebookSection-zh-TW.json 的 s00 使用 {s00NarrativeBlocks}；技術版輸出去除 rule id。

## ruleId → corpus key 對應（最小可用）

- R01_SAME_STAR_OVERLAP → sameStarOverlap
- R02_SAME_PALACE_OVERLAP、R03_SAME_TRANSFORM_OVERLAP、R10_DECADE_YEAR_SAME_LU、R20_SAME_PALACE_SAME_TRANSFORM_STACK（祿疊加）→ samePalaceLuStack
- R09_DECADE_YEAR_SAME_JI → samePalaceJiStack
- R04_SAME_STAR_LU_JI → sameStarLuJi
- R05_SAME_PALACE_LU_JI → samePalaceLuJi  
其餘 rule 可對應到 generic 或上述最接近的 key，後續再擴 corpus。
