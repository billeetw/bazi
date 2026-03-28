# 命宮雙主星專題語料（獨立檔）

## 用途

- 僅在 **命宮** 且 **主星恰為兩顆**、且 `ming-dual-main-stars-zh-TW.json` 的 `entries` **有對應鍵**時，在逐宮讀者敘事中輸出 **【命宮雙主星專題】**（標題可於 JSON 覆寫）。
- 未命中組合時 **完全不輸出**（無標題、無留白）。
- 掛載位置：**緊接【星曜結構解析】之後**（含命宮 premium 先斷語路徑與一般路徑）。
- 實作：`worker/src/lifebook/s17/palaceNarrative/mingDualMainStarNarrative.ts` + `renderPalaceNarrativeSample`。

## 與 CCL3 `star-combinations.json` 的關係

- CCL3：偏 **findings / 技術向**、全宮可適用。
- 本檔：偏 **讀者向長段落**、**僅命宮**；可並存，不必強制單一來源。

## 檔案

- `worker/content/ming-dual-main-stars-zh-TW.json`（產出檔）
- `scripts/write-ming-dual-json.mjs`（內嵌文案來源；修改後執行 `node scripts/write-ming-dual-json.mjs` 重新產生 JSON）

### 主星用字

- 與 `star-registry`／CCL3 一致：**七殺**（不用「七煞」）。

## 目前已收錄的命宮雙主星鍵（24 組，皆經 `zh-Hant` 排序）

`七殺+紫微`、`破軍+紫微`、`天府+紫微`、`貪狼+紫微`、`天相+紫微`、`天機+巨門`、`天機+太陰`、`天梁+天機`、`太陰+太陽`、`天梁+太陽`、`太陽+巨門`、`七殺+武曲`、`天府+武曲`、`武曲+貪狼`、`天相+武曲`、`武曲+破軍`、`天同+太陰`、`天同+巨門`、`天同+天梁`、`破軍+廉貞`、`天相+廉貞`、`七殺+廉貞`、`貪狼+廉貞`、`天府+廉貞`。

## Schema

```json
{
  "version": 1,
  "sectionTitle": "【命宮雙主星專題】",
  "entries": {
    "天機+巨門": {
      "paragraphs": [
        "第一段……",
        "第二段……"
      ]
    }
  }
}
```

### 鍵名規則（重要）

- 兩顆主星名稱以 **`+` 連接**，且 **必須經程式排序**後的鍵（與 `canonicalMingDualStarKey` 一致）：依 `localeCompare(..., "zh-Hant")` 排序，例如「巨門、天機」→ 鍵為 **`天機+巨門`**。
- 撰寫新條目時：把兩顆星名丟進排序後再組鍵，避免「紫微天府」與「天府紫微」變成兩條。

## 你提供原始表格時的正規化流程

1. 每列：`星甲`、`星乙`、正文（可多段）。
2. 排序得鍵 `星甲+星乙`（按 zh-Hant）。
3. `paragraphs`：依換行或編號拆成陣列字串。
4. 寫入 `entries`；未列到的雙主星組合維持不輸出。
