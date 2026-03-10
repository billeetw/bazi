# 四化引擎內容資料（worker/data）

本目錄為「四化事件→Pattern→字典→命理敘事→決策」引擎的**內容資料庫**，與 `worker/src/engine/` 搭配使用。

## 宮位／星曜正規化（系統一致性）

- **宮位**：一律使用帶「宮」的完整名稱，與 `canonicalKeys.toPalaceCanonical` 輸出一致：  
  `命宮、兄弟宮、夫妻宮、子女宮、財帛宮、疾厄宮、遷移宮、僕役宮、官祿宮、田宅宮、福德宮、父母宮`
- **星曜**：與 schema / `toStarName` 一致，例如：紫微、天機、太陽、武曲、天同、廉貞、天府、太陰、貪狼、巨門、天相、天梁、七殺、破軍
- **四化**：字典與主文使用「祿」「權」「科」「忌」；程式內部可沿用 lu/quan/ke/ji，在查表前轉換即可

## 已入庫檔案

| 檔案 | 說明 | 條數 |
|------|------|------|
| `palace_transform_dictionary.zh-TW.json` | 12宮 × 四化：meaning / advice | 48 |
| `palace_causality_matrix.zh-TW.json` | 飛宮因果：from/to/transform + consultation/advice/decisionTags | 114（同 key 唯一） |
| `major_patterns.zh-TW.json` | 格局/結構（殺破狼、機月同梁、府相朝垣等） | 9 |
| `star_combinations.zh-TW.json` | 星曜組合語義（雙星/三星） | 40 |
| `star_consultation_dictionary.ts` | 14 主星：themes / tension / strategy | 14 |
| `star_transform_dictionary.zh-TW.json` | 14 主星 × 四化：meaning / counsel / do / dont | 56 |
| `palace_consultation_dictionary.zh-TW.json` | 12 宮：domain / description | 12 |

**7 個內容檔已齊，可接 engine 實作與測試。**

## Loader / Validator 規則

- 所有 JSON 載入時需驗證：必填欄位存在、宮位/星曜經 canonical 後合法、transform 僅 祿/權/科/忌
- `palace_causality_matrix.zh-TW.json`：同一組 `(fromPalace, toPalace, transform)` 只能出現一筆，loader 需檢查並報錯
