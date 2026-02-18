# 占卦系統數據蒐集計畫

## 目標

- 提升流量：優化分享機制、追蹤分享轉換
- 諮詢轉換：在低分月份（轉折點）追蹤 CTA 點擊與轉換
- 跳出點分析：上線後蒐集關鍵互動數據，找出最常跳出點

## 追蹤事件定義

| 事件名稱 | 觸發時機 | 參數 | 用途 |
|---------|----------|------|------|
| `divination_complete` | 六爻完成、結果頁顯示 | `hexagram` | 完成率、熱門卦象 |
| `divination_context_switch` | 切換情境（事業/財運/感情） | `scenario`, `hexagram` | 情境偏好、深度互動 |
| `divination_copy_share` | 複製分享文案成功 | `method` (clipboard/fallback) | 分享意願、分享轉換 |
| `divination_share_native` | 使用原生分享（Web Share API） | - | 行動端分享行為 |
| `divination_line_share` | 點擊「分享到 LINE」 | - | LINE 分享轉換 |
| `divination_click_chart` | 點擊「查看命盤」 | `from` (result) | 占卦→命盤轉換 |
| `divination_consult_cta` | 點擊諮詢 CTA（低分提醒區） | `from` (alert), `alert_count` | 諮詢轉換、低分轉換率 |

## 關鍵指標

### 流量相關

- **分享率** = (`divination_copy_share` + `divination_share_native` + `divination_line_share`) / `divination_complete`
- **分享後流量**：需搭配 UTM 或短網址追蹤回訪

### 轉換相關

- **命盤轉換率** = `divination_click_chart` / `divination_complete`
- **諮詢轉換率** = `divination_consult_cta` / 有 alert 的 `divination_complete`

### 跳出點分析（上線後蒐集）

- **step1→step2**：開始占卦後進入蓍草步驟的比例
- **step2 中斷**：長按蓍草未完成的比例（可加 `divination_hold_start` / `divination_hold_abandon`）
- **step3 深度**：情境切換次數、是否複製分享、是否點擊命盤

## 已實作事件（第二階段）✅

| 事件 | 觸發時機 | 參數 | 用途 |
|------|----------|------|------|
| `divination_hold_start` | 長按蓍草開始 | `lines_done` | 計算完成率 |
| `divination_hold_abandon` | 長按中斷（未完成六爻） | `lines_done` | 跳出點分析 |

## GA4 設定建議

1. 在 GA4 自訂事件中啟用上述事件
2. 建立轉換：`divination_consult_cta`、`divination_click_chart` 可設為轉換
3. 探索報表：建立「占卦漏斗」：完成 → 情境切換 → 分享 / 命盤 / 諮詢
