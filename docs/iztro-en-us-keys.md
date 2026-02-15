# iztro en-US 宮位與星曜 Key 對照表

供 content API 與 ui_copy_texts 英文內容建立時參考。iztro 使用 `language: 'en-US'` 時回傳的宮名、星名即為下列 value。

## 12 宮位 (palaces)

| 繁體 | iztro en-US key |
|------|-----------------|
| 命宮 | soul |
| 兄弟 | siblings |
| 夫妻 | spouse |
| 子女 | children |
| 財帛 | wealth |
| 疾厄 | health |
| 遷移 | surface |
| 僕役 | friends |
| 官祿 | career |
| 田宅 | property |
| 福德 | spirit |
| 父母 | parents |

## 14 主星 (major stars)

| 繁體 | iztro en-US key |
|------|-----------------|
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

## 常用輔星

| 繁體 | iztro en-US key |
|------|-----------------|
| 左輔 | officer |
| 右弼 | helper |
| 文昌 | scholar |
| 文曲 | artist |
| 祿存 | money |
| 天馬 | horse |
| 天魁 | assistant |
| 天鉞 | aide |
| 擎羊 | driven |
| 陀羅 | tangled |
| 火星 | impulsive |
| 鈴星 | spark |
| 地空 | ideologue |
| 地劫 | fickle |

## content API 回傳結構（en locale）

當 `?locale=en` 時，content API 應回傳：

```json
{
  "ok": true,
  "locale": "en",
  "palaces": {
    "soul": "Your core operating system...",
    "siblings": "Your allies and kin resources...",
    "spouse": "...",
    "children": "...",
    "wealth": "...",
    "health": "...",
    "surface": "...",
    "friends": "...",
    "career": "...",
    "property": "...",
    "spirit": "...",
    "parents": "..."
  },
  "stars": {
    "emperor": "Represents authority and leadership...",
    "advisor": "Represents wisdom and adaptability...",
    "sun": "...",
    "general": "...",
    ...
  },
  "tenGods": {},
  "wuxing": {}
}
```

十神 (tenGod) 的英文 key 需對照 iztro 或八字模組的輸出；若無則可先留空或沿用繁中 key。
