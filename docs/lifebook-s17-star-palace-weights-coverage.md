# 逐宮讀者敘事：星曜 × 宮位權重覆蓋盤點

## 資料來源與結構

- **完整表**：`worker/src/lifebook/s17/weights/starPalaceWeightsFull.ts`
  - **十四主星**：`MAIN_STAR_FULL_WEIGHTS` — 每星 **12 宮**（canonical：`命宮`…`父母宮`；`交友宮` 圖資已正規成 **`僕役宮`**）。
  - **輔、煞、雜曜**：`AUX_AND_SHA_STAR_WEIGHTS` — 每列星盡量 **12 宮**；使用者原表僅列部分宮者，其餘為同星性補齊。
- **匯出**：`registry.ts` 的 `STAR_PALACE_WEIGHTS = buildCompleteStarPalaceWeightsMap()`  
  - 自動加上 **`事業宮` 鍵 = `官祿宮`**（向後相容）。
  - **`截路`** 若無專表，複製 **`截空`**。

## 先前「只補一部份」的原因

第一期 `registry` 只有少數宮位（多為 **財帛**、**官祿** 試點），**主星缺許多宮** → `buildWeightedPalaceContext` 對該星該宮 **base 全 0** → 敘事掉回套版。現已改為 **主星全 12 宮 + 輔煞雜曜大表**。

## 目前覆蓋一覽

| 類別 | 星曜 | 覆蓋 |
|------|------|------|
| 主星 | 紫微、天機、太陽、武曲、天同、廉貞、天府、太陰、貪狼、巨門、天相、天梁、七殺、破軍 | 12 宮；紫微～天相＋殺破為你提供的數值；**太陽、天同、廉貞、巨門、天梁** 全宮為表未列時之**對偶補齊**；**七殺／破軍** 缺宮由原表＋星性補齊。 |
| 輔／財馬昌曲 | 祿存、天馬、文昌、文曲 | 12 宮（重點宮維持你原表比例）。 |
| 空劫 | 地劫、地空、**天空**（與地空同權重表） | 12 宮。 |
| 六煞等 | 擎羊、陀羅、火星、鈴星、大耗 | 12 宮（財帛原表加彌補）。 |
| 雜曜 | 三台、八座 | 12 宮。 |
| 魁鉞左右 | 天魁、天鉞、左輔、右弼 | 12 宮。 |
| 桃花／魅力 | 紅鸞、天姚 | 12 宮。 |
| 田宅 pilot 常見 | **旬空、截空／截路、孤辰、天刑** | 12 宮；權重略抬 **phenomenon／pitfall**，配合 `minor` 倍率仍能過 `DEFAULT_DRIVE_THRESHOLD`。 |

## 語義字與 phenomenon 行

雜曜若在分段敘事出現，會走 `getStarSemantic(star).risk`。已補：

- `天馬`、`旬空`、`截空`、`截路`、`孤辰`、`天刑` → `starSemanticDictionary.ts`

避免 phenomenon 一律變成泛用「節奏波動與摩擦」。

## 仍可能為 0 的狀況

- **盤上星名**與表 **鍵名不一致**（別名未建）：例如只寫 `截空` 無 `截路` 已處理；若有其他寫法需再加 alias。
- **門檻**：`DEFAULT_DRIVE_THRESHOLD = 2.8`；**雜曜** × `STAR_CLASS_MULTIPLIER.minor 0.58` 時，基底分需約 **≥ 4.9** 才穩過線（煞曜另有偏置）。
- **phenomenon 名額**：`PalaceNarrativeBuilder` 對一般宮現取 phenomenon **前 7 名**，避免雜曜互擠。

## 相關程式

- `PalaceNarrativeBuilder.ts`：`topWeightedStars` + `buildWeightedNarrativeByLayers`
- `weights/parser.ts`：`buildWeightedPalaceContext`
