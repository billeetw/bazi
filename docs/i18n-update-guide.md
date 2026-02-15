# 何時與如何更新英文版（en.json）

## 何時需要更新 en.json

1. **新增任何顯示給使用者的文字時**
   - 新按鈕、標題、提示、錯誤訊息
   - 新區塊、問卷題目、選項

2. **修改 zh-TW.json 任何 key 時**
   - 若要改繁中文案，同時更新 en.json 對應 key，避免英文出現過時或錯誤內容

3. **新增語系（例如 zh-CN）時**
   - 同步補齊該語系檔的所有 key

## 需要同步的檔案

| 檔案 | 用途 |
|------|------|
| `data/i18n/zh-TW.json` | 繁中（預設），修改時為基準 |
| `data/i18n/en.json` | 英文，與 zh-TW 結構一致 |
| `data/i18n/zh-CN.json` | 簡中，與 zh-TW 結構一致 |

## 主要 key 區塊

- **ui.*** — 通用：按鈕、導覽、表單標籤
- **wuxing.*** — 五行生剋報告
- **estimateHour.*** — 時辰推算問卷與儀式（含 modalTitle, modalSubtitle, progressTemplate, q1～q19, uiHintLowConfidence）
- **ceremony.*** — 座標鎖定儀式（resultTemplate, systemLabel, feedbackQuestion, feedbackCorrect/Incorrect, 12 時辰人格文案）

## 快速檢查

```bash
# 比對三語系 key 是否一致（需安裝 jq）
diff <(jq -r 'keys[]' data/i18n/zh-TW.json | sort) <(jq -r 'keys[]' data/i18n/en.json | sort)
```

## 翻譯建議

- 保持語氣一致（正式／親和）
- 時辰名（子丑寅卯…）英文可保留或加註 "Zi (23–01)"
- 專有名詞（八字、紫微、流年）可保留拼音：Bazi, Ziwei, Flow
