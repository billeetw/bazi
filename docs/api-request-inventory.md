# 目前送給 API 的請求清單（調整依據）

依前端實際送出的 **method、路徑、query/body 欄位** 整理，供後端對接或調整 API 時參考。

---

## 1. 排盤／計算（Worker）

### POST `/compute/all`

**位置**：`js/ui/services/api-service.js`（由 `js/ui.js` 呼叫，已套用子時歸日）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `year` | number | 西曆年（晚子時時為次日年） |
| `month` | number | 西曆月（1–12） |
| `day` | number | 西曆日（晚子時時為次日日） |
| `hour` | number | 時（0–23，早子=0、晚子=23） |
| `minute` | number | 分（如 30） |
| `language` | string | 如 "zh-TW" / "zh-CN" / "en-US" |
| `gender` | string | 選填 "M" \| "F" |

**備註**：若後端不支援 `gender` 且回 400，前端會重試一次不帶 `gender` 的 body。

---

### POST `/compute/horoscope`

**位置**：`js/ui/services/api-service.js`（主站未呼叫；`expert-admin.html` 有呼叫，已套用子時歸日）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `year` | number | 同命盤日（晚子=次日） |
| `month` | number | 同命盤日 |
| `day` | number | 同命盤日 |
| `hour` | number | 0–23 |
| `minute` | number | 分 |
| `gender` | string | 選填 "M" \| "F" |
| `horoscopeYear` | number | 目標流年，預設當年 |

---

## 2. 內容／快取

### GET `/content/2026?locale={locale}`

**位置**：`js/ui/services/api-service.js`（loadDbContent）

| Query | 說明 |
|-------|------|
| `locale` | "zh-TW" \| "zh-CN" \| "en" |

---

## 3. 使用紀錄（統計）

### POST `/api/log-usage`

**位置**：`js/ui.js`（計算成功後 fire-and-forget）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `birth_year` | number | 表單選的出生年（未做子時歸日） |
| `gender` | string | "female" \| "male" |
| `language` | string | 如 "zh-TW" |

---

## 4. 太歲／光明燈

### GET `/api/taisui/status?birthYear=...&birth_date=YYYY-MM-DD`

**位置**：`js/ui/components/taisui-card.js`

| Query | 說明 |
|-------|------|
| `birthYear` | 西曆出生年（與命盤日一致，已子時歸日） |
| `birth_date` | 西曆生日 YYYY-MM-DD（與命盤日一致） |

**備註**：需登入，帶 `Authorization: Bearer <token>`。

---

### POST `/api/taisui/lamp`

**位置**：`js/ui/components/taisui-card.js`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `year` | number | 點燈年度（如 2026） |

**備註**：需登入。若 400 且錯誤含「請先建立命盤」，會先呼叫「我的命盤」儲存再重試（body 仍為 `{ year }`）。

---

## 5. 我的命盤

### GET `/api/me/charts`

**位置**：`js/ui/services/my-charts-service.js`

無 body，需 `Authorization`。

---

### POST `/api/me/charts`

**位置**：`js/ui/services/my-charts-service.js`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `label` | string | 如 "本人"、"未命名" |
| `birth_date` | string | 表單日期 YYYY-MM-DD（未做子時歸日） |
| `birth_time` | string | "exact:HH:mm" 或 "shichen:子:upper" |
| `gender` | string | "M" \| "F" 等 |

---

### DELETE `/api/me/charts/:id`

**位置**：`js/ui/services/my-charts-service.js`  
無 body，需 `Authorization`。

---

## 6. 推算時辰（問卷）

### POST `/api/me/estimate-hour`

**位置**：`js/ui/components/birth-time-identifier.js`、`js/identifyBirthTime.js`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `answers` | array | 問卷答案陣列，每題為 { questionId, selectedKeys } 等結構 |

**備註**：可帶 `Authorization`；後端回傳 `branch`、`hour_label`、`hour_range`、`half`、`log_id`、`uiHint`。

---

### PATCH `/api/me/estimate-hour/logs/:log_id`

**位置**：`js/ui/components/birth-time-identifier.js`（儀式後回饋）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `correct` | boolean | 是否正確 |
| `actual_branch` | string | 選填，不正確時實際地支 |
| `actual_half` | string | 選填，不正確時實際上下半時 |

需 `Authorization`。

---

## 7. 宮位分數／戰略提示（Worker）

### GET `/charts/:chartId/scores`

**位置**：`js/ui/services/api-service.js`  
無 body；需 `chartId`（來自 compute/all 回傳）。

---

### GET `/api/strategy-note?palace=...&strength=...&sihuaList=...`

**位置**：`js/strategyConfig.js`（本地/開發時用 GET）

| Query | 說明 |
|-------|------|
| `palace` | 宮位名 |
| `strength` | 強度數字字串 |
| `sihuaList` | 四化列表，逗號分隔 |

---

### POST `/api/strategy-note`

**位置**：`js/strategyConfig.js`（生產環境用 POST）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `palace` | string | 宮位名 |
| `strength` | number | 強度 |
| `sihuaList` | string[] | 四化陣列 |

---

## 8. 占卦

### POST `/api/divination`

**位置**：`js/divination-app.js`（存卦結果，登入後或登入後補存）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `question` | string | 問題文字 |
| `mood` | string \| null | 心情選項值 |
| `primaryIndex` | number | 本卦索引 |
| `transformedIndex` | number | 之卦索引 |
| `mutualIndex` | number | 互卦索引 |
| `lines` | number[] | 六爻數值 |
| `changingLines` | number[] | 動爻索引 |
| `source` | string | 如 "Homepage_Entrance" \| "Result_Save" |

**備註**：可帶 `Authorization`；成功回傳 `ok`, `id`。

---

### POST `/api/divination/feedback`

**位置**：`js/divination-app.js`（兩種按鈕）

- **僅建議**：`{ divination_id, rating: "suggestion", feedback_text }`
- **評分+驗證**：`{ divination_id, rating, feedback_text }`（rating 為使用者選的選項；驗證/指標會拼進 feedback_text）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `divination_id` | string/number | 上次存卦回傳的 id |
| `rating` | string | "suggestion" 或 選項值 |
| `feedback_text` | string | 自由文字（可能含【驗證:…】【指標:…】前綴） |

---

### GET `/api/me/divinations`

**位置**：`js/divination-app.js`  
無 body，需 `Authorization`，用於占卦歷史列表。

---

## 9. 登入／使用者

### GET `/api/auth/config`

**位置**：`js/ui/services/auth-service.js`  
無 body，取得 Google OAuth 等設定。

---

### POST `/api/auth/google`

**位置**：`js/ui/services/auth-service.js`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `code` | string | Google OAuth 授權碼 |
| `redirect_uri` | string | 通常為 `window.location.origin` |

---

### GET `/api/me/badges?year=2026`

**位置**：`js/ui/services/auth-service.js`  
需 `Authorization`。

---

## 10. 反饋（命盤／預測）

### POST `/api/feedback`

**位置**：`js/ui/services/feedback-service.js`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `chartId` | string | 必填 |
| `feedbackType` | string | "prediction" \| "satisfaction" \| "accuracy" \| "suggestion" |
| `feedbackText` | string \| null | 自由文字 |
| `positiveAspects` | string \| null | 滿意度時使用 |
| `negativeAspects` | string \| null | 滿意度時使用 |
| `contextData` | object \| null | 上下文 |
| `userHash` | string \| null | 前端產生的使用者雜湊 |
| **預測時額外** | | |
| `predictionCategory` | string \| null | 如 'palace' \| 'liuyue' \| 'tactics' \| 'overall' |
| `predictionTarget` | string \| null | 如 '命宮', '2026-03' |
| `predictedValue` | string \| null | |
| `actualValue` | string \| null | |
| `accuracyRating` | number \| null | 1–5 |
| **滿意度時額外** | | |
| `satisfactionRating` | number \| null | 1–5 |
| `satisfactionCategory` | string \| null | 如 'ui' \| 'accuracy' \| 'usefulness' \| 'overall' |

---

### GET `/api/feedback?action=stats`

**位置**：`js/ui/services/feedback-service.js`  
管理/統計用，無 body。

---

## 11. 後台／管理（若存在）

### POST `/api/admin/calculation-results`

**位置**：`js/calc/adminExport.js`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `results` | array | 多筆計算結果（含 birthInfo 等），格式由 adminExport 組裝 |

---

## 彙總表（依路徑）

| 方法 | 路徑 | 主要用途 |
|------|------|----------|
| POST | `/compute/all` | 排盤（八字+紫微+流月+十神），已子時歸日 |
| POST | `/compute/horoscope` | 大限/小限/流年（expert-admin） |
| GET | `/content/2026` | 內容 DB，query: locale |
| POST | `/api/log-usage` | 使用統計（birth_year, gender, language） |
| GET | `/api/taisui/status` | 太歲狀態，query: birthYear, birth_date |
| POST | `/api/taisui/lamp` | 點光明燈，body: year |
| GET | `/api/me/charts` | 我的命盤列表 |
| POST | `/api/me/charts` | 儲存命盤（birth_date, birth_time, gender, label） |
| DELETE | `/api/me/charts/:id` | 刪除命盤 |
| POST | `/api/me/estimate-hour` | 推算時辰，body: answers |
| PATCH | `/api/me/estimate-hour/logs/:log_id` | 時辰回饋，body: correct, actual_branch, actual_half |
| GET | `/charts/:chartId/scores` | 宮位分數 |
| GET/POST | `/api/strategy-note` | 戰略一句話（palace, strength, sihuaList） |
| POST | `/api/divination` | 存卦（question, lines, indices, source…） |
| POST | `/api/divination/feedback` | 占卦回饋（divination_id, rating, feedback_text） |
| GET | `/api/me/divinations` | 占卦歷史 |
| GET | `/api/auth/config` | OAuth 設定 |
| POST | `/api/auth/google` | Google 登入，body: code, redirect_uri |
| GET | `/api/me/badges` | 徽章，query: year |
| POST | `/api/feedback` | 命盤/預測/滿意度反饋 |
| GET | `/api/feedback?action=stats` | 反饋統計 |
| POST | `/api/admin/calculation-results` | 後台匯出計算結果 |

---

*文件產生自目前前端程式碼，若新增或修改 API 請同步更新此清單。*
