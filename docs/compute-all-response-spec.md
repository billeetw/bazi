# /compute/all 回應格式規格

前端解析的 `payload.features` 結構。Worker 回傳時請符合此格式。

---

## 頂層結構

```json
{
  "ok": true,
  "language": "zh-TW",
  "chartId": "uuid-xxx",
  "features": {
    "version": "strategic_features_v1",
    "bazi": { ... },
    "ziwei": { ... }
  }
}
```

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| ok | boolean | ✅ | 成功時為 true |
| language | string | 建議 | `zh-TW` \| `zh-CN` \| `en-US`，前端依此決定是否套用轉繁 |
| chartId | string | 建議 | 命盤 ID，供後續 scores API 使用 |
| features | object | ✅ | 見下 |
| features.version | string | ✅ | 固定 `strategic_features_v1` |
| features.bazi | object | ✅ | 八字資料 |
| features.ziwei | object | ✅ | 紫微資料 |
| features.ziwei.horoscope | object \| null | 建議 | 小限（運限）資料，供專家系統算每年重點 |

---

## ziwei.horoscope（小限）

當 Worker 呼叫 iztro `astrolabe.horoscope(targetDate, timeIndex)` 取得運限後，會回傳此物件。若無法取得則為 `null`。

### 請求參數（可選）

| 參數 | 類型 | 說明 |
|------|------|------|
| horoscopeYear | number | 欲查詢小限的年份，預設為當前西元年 |

### 回傳欄位

| 欄位 | 類型 | 說明 |
|------|------|------|
| year | number | 目標西元年 |
| nominalAge | number \| null | 該年虛歲 |
| yearlyStem | string \| null | 小限天干 |
| yearlyBranch | string \| null | 小限地支 |
| yearlyIndex | number | 小限所在宮位索引（0–11） |
| activeLimitPalaceName | string \| null | 小限所在宮位名稱（繁體，如 `命宮`） |
| mutagenStars | object \| null | 小限四化 `{ 祿, 權, 科, 忌 }` 對應星名 |
| decadal | object \| null | 大限（十年運限）含 stem, branch, palace, mutagenStars |
| yearly | object \| null | 流年含 stem, branch, palace, mutagenStars |
| horoscopeByYear | object \| null | 每年小限 `{ [西元年]: { nominalAge, palace, stem } }` |

### 範例

```json
{
  "horoscope": {
    "year": 2026,
    "nominalAge": 37,
    "yearlyStem": "丙",
    "yearlyBranch": "午",
    "yearlyIndex": 4,
    "activeLimitPalaceName": "財帛",
    "mutagenStars": {
      "祿": "廉貞",
      "權": "破軍",
      "科": "武曲",
      "忌": "太陽"
    }
  }
}
```

---

## ziwei 結構（星名那段）

```json
{
  "ziwei": {
    "core": {
      "minggongBranch": "午",
      "shengongBranch": "戌",
      "wuxingju": "木三局"
    },
    "basic": {
      "masterStar": "破軍",
      "bodyStar": "文昌"
    },
    "mainStars": {
      "命宮": ["紫微"],
      "兄弟": ["天機"],
      "夫妻": ["七杀"],
      "子女": ["太陽", "天梁"],
      "財帛": ["武曲", "天相"],
      "疾厄": ["天同", "巨門"],
      "遷移": ["貪狼"],
      "僕役": ["太陰"],
      "官祿": ["廉貞", "天府"],
      "田宅": [],
      "福德": ["破軍", "祿存"],
      "父母": []
    },
    "horoscope": {
      "year": 2026,
      "nominalAge": 37,
      "yearlyStem": "丙",
      "yearlyBranch": "午",
      "yearlyIndex": 4,
      "activeLimitPalaceName": "財帛",
      "mutagenStars": { "祿": "廉貞", "權": "破軍", "科": "武曲", "忌": "太陽" }
    }
  }
}
```

### mainStars 重要說明

1. **key 一律用繁體宮名**：`命宮`、`兄弟`、`夫妻`、`子女`、`財帛`、`疾厄`、`遷移`、`僕役`、`官祿`、`田宅`、`福德`、`父母`  
   - 前端用 `PALACE_DEFAULT` 遍歷，Worker 請維持這組 key

2. **value 為星名陣列**：依 `language` 決定語系  
   - `zh-TW` / `zh-CN`：`["紫微", "天機"]`、`["七杀"]`（簡體也可，前端會轉繁）  
   - `en-US`：`["emperor", "advisor"]`、`["marshal"]`（iztro en-US 的 star value，見 `iztro-en-us-keys.md`）

3. **空宮**：`[]`

### core

| 欄位 | 說明 |
|------|------|
| minggongBranch | 命宮地支：寅、卯、辰、巳、午、未、申、酉、戌、亥、子、丑 |
| shengongBranch | 身宮地支，同上 |
| wuxingju | 五行局，如 `木三局`、`金四局` |

### basic（命主、身主）

- `masterStar`、`bodyStar` 為星名，語系與 mainStars 一致
- 例：zh-TW 為 `破軍`、`文昌`；en-US 為 `rebel`、`scholar`

---

## 星名 en-US 對照

| 繁體 | en-US |
|------|-------|
| 紫微 | emperor |
| 天機 | advisor |
| 太陽 | sun |
| 武曲 | general |
| 天同 | fortunate |
| 廉貞 | judge |
| 天府 | empress |
| 太陰 | moon |
| 貪狼 | wolf |
| 巨門 | advocator |
| 天相 | minister |
| 天梁 | sage |
| 七殺 | marshal |
| 破軍 | rebel |
| 文昌 | scholar |
| 文曲 | artist |
| 左輔 | officer |
| 右弼 | helper |
| 祿存 | money |
| 天馬 | horse |

完整對照見 `docs/iztro-en-us-keys.md`。

---

## 範例：en-US 的 mainStars 片段

```json
{
  "mainStars": {
    "命宮": ["emperor"],
    "兄弟": ["advisor"],
    "夫妻": ["marshal"],
    "子女": ["sun", "sage"],
    "財帛": ["general", "minister"],
    "疾厄": ["fortunate", "advocator"],
    "遷移": ["wolf"],
    "僕役": ["moon"],
    "官祿": ["judge", "empress"],
    "田宅": [],
    "福德": ["rebel", "money"],
    "父母": []
  }
}
```

---

## Worker 實作建議

1. 呼叫 iztro 時帶入 `language`
2. 把 iztro 的 `palaces` 映射成 `mainStars`，key 固定為繁體宮名
3. 把 iztro 的星名（可能為簡體或英文）填入 value 陣列
4. `basic.masterStar`、`basic.bodyStar` 一併依 language 轉換
