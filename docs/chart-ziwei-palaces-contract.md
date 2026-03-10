# chart.ziwei 契約：前後端一致（含主星亮度）

命書與紫微相關功能依賴 `chart_json.ziwei`。為讓**主星亮度（廟旺利陷）**與**宮位星曜**在前後端一致，約定以下格式。

## 1. 契約格式

### 1.1 來源

- **Worker**：`/compute/all` 回傳的 `features.ziwei` 為**標準來源**，已包含 `palaces`（含亮度）。
- **前端**：命書／進階功能應使用「Compute 後寫入的 `window.contract`」組出 `chart_json`，勿用僅含 `mainStars` 的舊結構。

### 1.2 ziwei 必備與選填

| 欄位 | 必備 | 說明 |
|------|------|------|
| `core` | ✅ | 命宮地支、身宮地支、五行局等 |
| `basic` | ✅ | 命主／身主星名 |
| `mainStars` | ✅ | `Record<宮名, 星名[]>`，例：`{ "命宮": ["紫微", "天府"], ... }` |
| `horoscope` | 選 | 大限／小限／流年、horoscopeByYear 等 |
| **`palaces`** | **選（命書亮度用）** | 見下節；**有則命書會顯示廟旺** |

### 1.3 ziwei.palaces 格式（主星亮度）

當存在時，命書會讀取並顯示「亮度（廟旺利平陷）」區塊與主星後的（廟）（旺）等。

- **型別**：`Array<{ majorStars, minorStars }>`，長度 12。
- **順序**：固定為 **命宮 → 兄弟宮 → 夫妻宮 → … → 父母宮**（索引 0 = 命宮）。
- **每宮**：
  - `majorStars: Array<{ name: string, brightness?: string }>`
  - `minorStars: Array<{ name: string, brightness?: string }>`
- **brightness**：建議用 iztro 鍵名（`miao` | `wang` | `de` | `li` | `ping` | `bu` | `xian`），命書端會對應為 廟／旺／得／利／平／不／陷；亦可直接傳中文（廟、旺等）。

範例（單宮）：

```json
{
  "ziwei": {
    "core": { "minggongBranch": "寅", ... },
    "basic": { "masterStar": "廉貞", "bodyStar": "天相" },
    "mainStars": { "命宮": ["紫微", "天府"], ... },
    "horoscope": { ... },
    "palaces": [
      {
        "majorStars": [
          { "name": "紫微", "brightness": "wang" },
          { "name": "天府", "brightness": "miao" }
        ],
        "minorStars": [
          { "name": "左輔", "brightness": "li" }
        ]
      },
      ...
    ]
  }
}
```

## 2. 誰負責填 palaces

| 端 | 責任 |
|----|------|
| **Worker** | `/compute/all` 已從 iztro astrolabe 產出 `ziwei.palaces` 並放入 `features.ziwei`。 |
| **前端** | 使用 `window.contract.ziwei`（即 `payload.features.ziwei`）作為命盤來源時，**無需再組 palaces**；`exportCalculationResults()` 會帶出 `contract.ziwei`（含 `palaces`）。 |
| **其他客戶端** | 若自行組 chart 且希望命書顯示亮度，需依上列格式提供 `ziwei.palaces`。 |

## 3. 命書 API 的處理方式

- 收到 `chart_json` 時，若**沒有** `chart_json.ziwei` 但有 `chart_json.features.ziwei`，會以 `features.ziwei` 作為 `ziwei`（含 `palaces`）。
- 因此前端可傳「整包 compute 回傳」或「已把 `features.ziwei` 抄到 `chart_json.ziwei`」皆可，只要最終 `chart_json.ziwei.palaces` 存在即可顯示亮度。

## 4. 前後一致檢查清單

- [ ] Worker：`/compute/all` 回傳 `features.ziwei.palaces`（已實作）
- [ ] 前端：命書／進階流程使用 Compute 後的 `window.contract`，不覆寫 `contract.ziwei` 為僅含 `mainStars` 的舊結構
- [ ] 前端：傳給命書 API 的 `chart_json.ziwei` 來自 `exportCalculationResults()` 或等同含 `palaces` 的物件
- [ ] 若前端日後需「不經 Worker 自行組 chart」：需自行產出 `ziwei.palaces`（例如接 iztro 或亮度對照表），格式同上

## 5. 亮度鍵名對照（命書端）

| 鍵名（英文） | 顯示 |
|-------------|------|
| miao | 廟 |
| wang | 旺 |
| de | 得 |
| li | 利 |
| ping | 平 |
| bu | 不 |
| xian | 陷 |

命書 placeholder 與主星敘事會使用上述顯示用字。
