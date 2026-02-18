# 線上命書付費流程規劃

## 目標

- 申請線上命書需付費
- 支援**台灣**與**海外**用戶
- 現有匯款機制不適用，需改為第三方金流
- 回傳購買完成後才觸發命書生成

---

## 一、金流選擇建議

### 台灣用戶

| 平台 | 建議 | 說明 |
|------|------|------|
| **綠界 ECPay** | ⭐ 首選 | 市佔最高、文件完整、支援信用卡/ATM/超商、有 Sandbox、撥款 T+3 |
| **藍新 NewebPay** | 備選 | 無年費、支援跨境（支付寶）、審核較久 |
| **統一金流 PayUni** | 備選 | 費率較低、撥款快，較新平台 |

**建議**：以 **綠界** 為主，其 API 穩定、Sandbox 完整，整合難度適中。

### 海外用戶

| 平台 | 說明 |
|------|------|
| **PayPal** | 國際通用、多幣別、Webhook 完整、需驗證簽章 |

---

## 二、分流邏輯

```
用戶進入購買流程
    ↓
選擇/偵測地區
    ├── 台灣（或選擇 TWD）→ 綠界（信用卡/ATM/超商）
    └── 海外（或選擇 USD）→ PayPal
    ↓
建立訂單（status: pending）
    ↓
導向金流頁面
    ↓
用戶完成付款
    ↓
金流 callback/webhook 回傳
    ↓
驗證簽章 → 更新訂單 status: paid
    ↓
觸發命書生成（Queue 或即時）
```

**地區判斷**：
- 依 `cf-ipcountry`（Cloudflare）或用戶自選
- 預設：台灣 IP → 綠界，其他 → PayPal

---

## 三、資料庫設計

### 新增 `life_book_orders` 表

```sql
CREATE TABLE life_book_orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  -- 關聯
  user_id TEXT,
  email TEXT NOT NULL,

  -- 訂單內容
  birth_info TEXT NOT NULL,
  amount INTEGER NOT NULL,        -- 金額（分/最小單位）
  currency TEXT NOT NULL,         -- TWD, USD

  -- 金流
  payment_provider TEXT NOT NULL,  -- 'ecpay' | 'neweb' | 'paypal'
  payment_id TEXT,                -- 金流方交易 ID
  payment_status TEXT NOT NULL,   -- 'pending' | 'paid' | 'failed' | 'refunded'

  -- 命書關聯（付款完成後產生）
  life_book_id TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (life_book_id) REFERENCES life_books(id)
);

CREATE INDEX idx_orders_user ON life_book_orders(user_id);
CREATE INDEX idx_orders_email ON life_book_orders(email);
CREATE INDEX idx_orders_payment ON life_book_orders(payment_provider, payment_id);
CREATE INDEX idx_orders_status ON life_book_orders(payment_status);
```

### 擴充 `life_books` 表

```sql
ALTER TABLE life_books ADD COLUMN order_id TEXT;
```

---

## 四、API 設計

### 購買流程

| 端點 | 方法 | 說明 |
|------|------|------|
| `POST /api/life-book/checkout` | 建立訂單 | 傳入 email, birth_info, payment_provider → 回傳導向 URL |
| `GET/POST /api/life-book/callback/ecpay` | 綠界 Return/Callback | 驗證後更新訂單、觸發生成 |
| `GET/POST /api/life-book/callback/neweb` | 藍新 Return/Callback | 同上 |
| `POST /api/life-book/webhook/paypal` | PayPal Webhook | 驗證簽章後更新訂單、觸發生成 |

### 安全重點

- **綠界/藍新**：使用 HashKey 驗證 Return/Callback 參數
- **PayPal**：驗證 `paypal-transmission-sig` 與 Webhook ID
- **冪等**：相同 payment_id 僅處理一次
- **金額**：訂單建立時鎖定金額，callback 時比對

---

## 五、實作階段建議

### 階段一：訂單與金流（約 2–3 週）

1. Migration：`life_book_orders`、`life_books.order_id`
2. 綠界 Sandbox 申請與串接
3. `POST /api/life-book/checkout` 建立訂單並回傳綠界表單/URL
4. 綠界 Return URL、Notify URL 處理與驗證
5. 付款成功後更新訂單、建立 `life_books` 關聯

### 階段二：命書自動生成

1. 付款成功時呼叫既有 `generate-section` 流程（或 Queue）
2. 生成完成後寫入 `life_books`、更新 `order.life_book_id`
3. 寄送 email 通知用戶（含下載連結或登入查看）

### 階段三：PayPal

1. PayPal Sandbox 申請
2. `POST /api/life-book/checkout` 支援 provider=paypal
3. PayPal Webhook 端點與簽章驗證
4. 流程與綠界一致：驗證 → 更新訂單 → 觸發生成

### 階段四：使用者端與登入

1. 登入後才能購買（`user_id` 必填）
2. `GET /api/me/life-books` 列出已購命書
3. 訂單狀態頁面（處理中/已完成）

---

## 六、金流串接要點

### 綠界 ECPay

- **文件**：https://www.ecpay.com.tw/Service/API_Doc
- **付款方式**：信用卡、ATM、超商（CVS）
- **驗證**：MerchantID + HashKey + HashIV 產生檢查碼
- **Return URL**：使用者付款後導回，可顯示結果
- **Notify URL**：伺服器對伺服器回調，需驗證並回傳 `1|OK`

### PayPal

- **文件**：https://developer.paypal.com/docs/checkout/
- **事件**：`PAYMENT.CAPTURE.COMPLETED` 表示付款完成
- **驗證**：需驗證 Webhook 簽章
- **幣別**：建議 USD，可多幣別

---

## 七、價格建議

| 地區 | 建議價格 | 幣別 |
|------|----------|------|
| 台灣 | NT$ 299–599 | TWD |
| 海外 | USD 9.99–19.99 | USD |

可依篇幅（20 章）與定價策略微調。

---

## 八、風險與注意

1. **PCI DSS**：信用卡資料不得經手自家伺服器，由金流頁面處理
2. **時區與對帳**：訂單時間、金流時間紀錄清楚，便於對帳
3. **退款**：預留 `refunded` 狀態與人工處理流程
4. **測試**：先用 Sandbox 完整走通再上線

---

## 九、參考架構圖

```
[購買頁] → [建立訂單] → [導向綠界/PayPal]
                              ↓
                        [用戶付款]
                              ↓
          [綠界 Return/Notify] [PayPal Webhook]
                              ↓
                    [驗證簽章 + 更新訂單]
                              ↓
                    [觸發命書生成 20 章]
                              ↓
                    [寫入 life_books]
                              ↓
                    [寄信 / 顯示完成頁]
```
