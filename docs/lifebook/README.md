# Lifebook 命書資料（JSON 參考）

此目錄存放由程式碼匯出的命書用資料，供 Cursor / 前端 / DB 對照使用。**單一來源為 worker 內 TypeScript 常數**，JSON 僅作參考與介接。

| 檔案 | 來源 | 說明 |
|------|------|------|
| `star-personality-map-zh-TW.json` | `worker/src/lifebook/starPersonalityMap.ts` → `STAR_PERSONALITY_MAP` | 星曜→群性標籤（動星、智星、穩星、權星、財星、情緒星等） |
| `phrase-library-rule-types-zh-TW.json` | `worker/src/lifebook/patternPhraseLibraryRuleTypes.ts` → `PATTERN_PHRASE_LIBRARY_BY_RULE_TYPE` | 10 類四化規則的判讀／行動／證據句型模板 |

宮位／星曜 canonical 函式：`toPalaceCanonical`、`toStarName`（見 `worker/src/lifebook/canonicalKeys.ts`）。  
若修改分類或句庫，請同步更新上述 TS 檔，再手動或依專案腳本更新此處 JSON。
