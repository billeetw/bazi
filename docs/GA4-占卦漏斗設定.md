# GA4 占卦漏斗設定指南

> 在 Google Analytics 4 建立「占卦漏斗」探索報表，追蹤完成率與轉換斷點。

---

## 一、前置：確認事件已蒐集

以下事件需在 GA4 中可被辨識（通常需 24–48 小時後才有數據）：

| 事件名稱 | 觸發時機 | 參數 |
|----------|----------|------|
| `divination_hold_start` | 長按蓍草開始 | `lines_done` |
| `divination_hold_abandon` | 長按中斷（未完成） | `lines_done` |
| `divination_complete` | 六爻完成、結果頁顯示 | `hexagram` |
| `divination_context_switch` | 切換情境（事業/財運/感情） | `scenario`, `hexagram` |
| `divination_copy_share` | 複製分享文案 | `method` |
| `divination_share_native` | 原生分享 | - |
| `divination_line_share` | 分享到 LINE | - |
| `divination_click_chart` | 點擊「查看命盤」 | `from` |
| `divination_consult_cta` | 點擊諮詢 CTA | `from`, `alert_count` |

---

## 二、建立漏斗步驟

### 步驟 1：進入探索

1. 登入 [Google Analytics](https://analytics.google.com/)
2. 選擇你的 GA4 財產
3. 左側選單 → **探索** → **空白**（建立新的探索）

### 步驟 2：選擇「漏斗探索」

1. 在探索類型中選擇 **漏斗探索**
2. 命名：例如「占卦漏斗」

### 步驟 3：設定漏斗步驟

依序新增以下步驟（事件名稱需與上表一致）：

| 步驟 | 事件名稱 | 說明 |
|------|----------|------|
| 1 | `divination_hold_start` | 開始揲蓍 |
| 2 | `divination_complete` | 完成六爻、看到結果 |
| 3 | `divination_context_switch` | 切換情境（深度互動） |
| 4a | `divination_copy_share` 或 `divination_share_native` 或 `divination_line_share` | 任一分享行為 |
| 4b | `divination_click_chart` | 點擊查看命盤 |
| 4c | `divination_consult_cta` | 點擊諮詢 CTA |

**建議**：先做 3 步驟漏斗（開始 → 完成 → 情境切換），再視需求加入 4a/4b/4c。

### 步驟 4：設定維度與指標

- **維度**：可加 `Event name`、自訂參數 `lines_done`（分析跳出時完成幾爻）
- **指標**：轉換率、流失人數
- **日期範圍**：選近 7/14/30 天

### 步驟 5：儲存與分享

1. 點右上角 **儲存**
2. 可加入「我的報表」方便定期查看

---

## 三、關鍵指標計算

| 指標 | 計算方式 |
|------|----------|
| **揲蓍完成率** | `divination_complete` / `divination_hold_start` |
| **中斷率** | `divination_hold_abandon` / `divination_hold_start` |
| **命盤轉換率** | `divination_click_chart` / `divination_complete` |
| **諮詢轉換率** | `divination_consult_cta` / 有 alert 的 `divination_complete` |
| **分享率** | (copy + native + line) / `divination_complete` |

---

## 四、自訂事件啟用（若尚未啟用）

若 GA4 未自動蒐集上述事件，需在 **管理** → **資料串流** → **加強型評估** 中確認，或於 **自訂定義** 中新增：

1. **管理** → **自訂定義** → **建立自訂維度**
2. 事件參數：`lines_done`、`hexagram`、`scenario` 等，視需要新增

---

## 五、定期檢視建議

- **每週**：看完成率、中斷率，找出常見跳出點（如多數在 2–3 爻放棄）
- **每月**：看命盤／諮詢轉換率，評估 CTA 與文案效果
- **分享後回訪**：可搭配 UTM 參數（如 `?utm_source=divination_share`）追蹤分享連結點擊
