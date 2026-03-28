# 流月錨點（S19）與 `monthlyHoroscope`

## 原則

- **單一時間點**：`astrolabe.horoscope(anchor)` 只傳一個 `Date`（不帶第二參數 birth `timeIndex`），讓 iztro 依錨點推算流月月干支、四化、流耀；與 S19 標題使用同一錨點。
- **「現在」預設**：錨點西曆日 = **`Asia/Taipei` 的當日**（以 `Intl` 取年／月／日，避免 Worker UTC 誤差）。
- **可覆寫**：請求 JSON 可選  
  - `flowMonthSolarDate`: `"YYYY-MM-DD"`  
  - 或 `horoscopeAsOf`: 同上（別名）  
  用於重播、測試或指定「以哪一天當流月」。

## 錨點時刻

- 轉成 `Date` 時使用 **`YYYY-MM-DDT12:00:00+08:00`**（台北正午），減少日界與時辰對月柱的邊際影響。

## `monthlyHoroscope` 欄位（輸出）

除原有 `stem` / `branch` / `palace` / `mutagenStars` / `stars` 與完整性欄位外，新增：

| 欄位 | 說明 |
|------|------|
| `solarYear`, `solarMonth`, `solarDay` | 與錨點一致的**西曆**年月日（展示用） |
| `displayTimeZone` | 預設 `Asia/Taipei` |
| `solarTermSpan` | 節（jie）為界的西曆區間說明（`lunar-typescript`） |

## S19 標題

- `getMonthDisplay` 優先組：`{solarYear}年{solarMonth}月（西曆）｜流月分析`，下一行附 `solarTermSpan`。
- 若僅有舊版欄位（無 `solarYear`），則 fallback 為斗數月序提示並建議重算。

## 相關程式

- `worker/src/flowMonthContext.ts`
- `worker/src/index.ts` → `buildMonthlyHoroscopePayload`（`/compute/all`、`/compute/horoscope`）
- `worker/src/lifebook/s19/buildS19MonthlyOutput.ts` → `getMonthDisplay`
