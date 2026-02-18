# 太歲光明燈服務 — 實作規劃

> 在紫微與八字（五行）之間新增「太歲服務」區塊。未登入可看狀態＋強 CTA；已登入可點光明燈、得守護語、年度圖片、勳章。

---

## 一、專案現況適配

### 1.1 既有架構

| 項目 | 現況 |
|------|------|
| 資料庫 | Cloudflare D1（SQLite） |
| API | `functions/api/`，Pages Functions |
| 使用者 | `users` + `user_charts`（birth_date, birth_time） |
| 流年地支 | `js/calc/fourTransformations.js` 已有 `computeLiunianBranch(year)` |
| 版面順序 | 紫微 → **（太歲）** → 八字 → 流年 |

### 1.2 生肖／地支來源

- **未登入**：從表單 `birthYear` 取得出生年 → 生肖 → 地支
- **已登入**：從 `user_charts` 的 `birth_date` 取年 → 地支（或取預設命盤）

---

## 二、犯太歲判斷規則（固定 map）

### 2.1 生肖 ↔ 地支

```js
// earthlyBranch.ts 或 constants
const ZODIAC_TO_BRANCH = {
  "鼠": "子", "牛": "丑", "虎": "寅", "兔": "卯", "龍": "辰", "蛇": "巳",
  "馬": "午", "羊": "未", "猴": "申", "雞": "酉", "狗": "戌", "豬": "亥"
};
const BRANCH_TO_ZODIAC = { /* 反向 */ };

// 出生年 → 地支（1984 甲子年起算）
function yearToBranch(year) {
  const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  return BRANCHES[(year - 4) % 12];  // 或 (year - 1984) % 12 若以 1984 為基準
}
```

### 2.2 五類關係（固定 map）

| 類型 | 配對 |
|------|------|
| **六沖** | 子午、丑未、寅申、卯酉、辰戌、巳亥 |
| **六害** | 子未、丑午、寅巳、卯辰、申亥、酉戌 |
| **六破** | 子酉、丑辰、寅亥、卯午、申巳、未戌 |
| **三刑** | 寅巳申、丑戌未、子卯 |
| **自刑** | 辰辰、午午、酉酉、亥亥 |
| **值太歲** | userBranch === flowBranch |

### 2.3 判斷優先序（建議）

1. 值太歲（user === flow）
2. 六沖
3. 三刑（含自刑）
4. 六害
5. 六破
6. 無

> 頁面加一句：「本服務依傳統地支『值、沖、刑、害、破』關係推算。」

---

## 三、後端資料結構（D1）

### 3.1 Migration：`yearly_lamps`

```sql
-- migrations/0012_yearly_lamps.sql
CREATE TABLE IF NOT EXISTS yearly_lamps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  flow_branch TEXT NOT NULL,
  user_branch TEXT NOT NULL,
  status_type TEXT NOT NULL,  -- 值|沖|刑|害|破|無
  guardian_phrase TEXT NOT NULL,
  image_url TEXT,
  lit_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, year),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_yearly_lamps_user_year ON yearly_lamps(user_id, year);
```

### 3.2 使用者地支來源

- `user_charts` 已有 `birth_date`（YYYY-MM-DD）
- 取 `birth_date` 前 4 字元 → 出生年 → `yearToBranch(year)` → `user_branch`
- 登入後若無命盤，可要求先建立或允許用 query 傳 `birthYear`

---

## 四、API 設計

### 4.1 GET `/api/taisui/status`

**用途**：取得太歲狀態（未登入也可）

| 參數 | 說明 |
|------|------|
| `birthYear` | 出生年（未登入必填） |
| `year` | 目標年，預設 2026 |

**回傳**：

```json
{
  "year": 2026,
  "flowBranch": "午",
  "flowStemBranch": "丙午",
  "userBranch": "子",
  "zodiac": "鼠",
  "type": "沖",
  "label": "沖太歲",
  "relation": "子午相沖",
  "explain": "子午相沖，代表變動增加，宜主動規劃與調整。",
  "cta": {
    "requiresLogin": true,
    "text": "登入即可點光明燈（動畫）並獲得守護語、年度圖片與勳章"
  }
}
```

**已登入**：可選用 `Authorization`，從 `user_charts` 取預設命盤的出生年，省略 `birthYear`。

### 4.2 POST `/api/taisui/lamp`

**用途**：點光明燈（必須登入）

**Body**：`{ "year": 2026 }`

**回傳**：

```json
{
  "year": 2026,
  "lit": true,
  "guardianPhrase": "變動會帶來新位置，願你主動調整，走出更適合自己的路。",
  "imageUrl": "https://...",
  "badge": { "key": "lamp_2026", "label": "2026 光明燈" }
}
```

**邏輯**：

1. 查 `yearly_lamps` 是否有 `(user_id, year)`
2. 若有：直接回傳既有 `guardian_phrase`、`image_url`
3. 若無：計算 `status_type` → 選守護語模板 → 產圖（或先回傳 null）→ INSERT

### 4.3 GET `/api/me/badges`

**用途**：登入後 header / 個人頁顯示勳章

**Query**：`year=2026`

**回傳**：

```json
{
  "year": 2026,
  "badges": [
    { "key": "lamp_2026", "label": "2026 光明燈", "litAt": "2026-02-16T..." }
  ]
}
```

---

## 五、守護語模板

| type | 模板（可加 1–2 句隨機變體） |
|------|------------------------------|
| 值 | 今年是你的主題之年，願你穩住節奏，把重要的事做深做實。 |
| 沖 | 變動會帶來新位置，願你主動調整，走出更適合自己的路。 |
| 刑 | 願你放過過度苛責，溫柔整理內在秩序，心定則事順。 |
| 害 | 人際需多留白與溝通，願你遠離誤會，靠近真正的支持。 |
| 破 | 資源要守、步伐要穩，願你避開衝動決策，慢慢累積福氣。 |
| 無 | 今年氣場平穩，願你把握日常，把好運變成習慣。 |

產生後寫入 DB，之後固定不變。

---

## 六、年度圖片（MVP 建議）

### 6.1 方案 A：前端 Canvas（最快）

- 前端拿到 `guardianPhrase`、`flowStemBranch`、`zodiac`
- `<canvas>` 畫：背景、燈 icon、流年名稱、生肖、守護語、logo
- `canvas.toDataURL("image/png")` → 觸發下載
- 優點：無後端依賴、部署快
- 缺點：字型、版型需前端處理

### 6.2 方案 B：後端產圖（進階）

- 使用 `@napi-rs/canvas` 或 `sharp`
- 存到 R2 / Cloudinary
- 回傳 `imageUrl` 給前端
- 優點：一致、可分享固定 URL

**版型建議**：1080×1350，深色底＋燈光感，含：流年、生肖、守護語、logo。

---

## 七、前端 UI 施作

### 7.1 區塊位置

在 `index.html` 的 `#ws-ziwei` 與 `#ws-bazi` 之間新增：

```html
<!-- 太歲狀態卡 -->
<section id="ws-taisui" class="glass dashboard-card p-6 md:p-7 space-y-4">
  <!-- ... -->
</section>
```

### 7.2 導覽列

- 桌機：`<a href="#ws-taisui">太歲</a>` 插入紫微與八字之間
- 手機：`mobile-nav-menu` 同樣加入

### 7.3 太歲狀態卡內容

- 標題：今年的天時（太歲狀態）
- 大字：沖太歲 / 值太歲 / 刑太歲 / 害太歲 / 破太歲 / 無
- 小字：子午相沖（讓懂的人信服）
- 解釋：1–2 句（不恐嚇）

**未登入 CTA**：

- 標題：登入點亮年度光明燈
- 三行：🏮 點燈動畫儀式、✨ 獲得年度守護語、🖼️ 生成年度守護圖片
- 補一句：點亮後，帳號會顯示「光明燈勳章」
- 按鈕：登入並點光明燈

**已登入**：

- 未點燈：按鈕「點光明燈」
- 已點燈：按鈕「已點亮 ✅ 下載年度圖片」

### 7.4 點燈動畫（MVP）

- 按下後：Modal 打開
- 1.5 秒：燈從暗到亮（CSS opacity + scale）
- 結束後：顯示守護語 + 預覽圖 + 下載按鈕

### 7.5 勳章顯示

- **Header**：使用者名稱旁 `🏮 2026`，hover 顯示「2026 光明燈已點亮」
- **個人頁**（若有）：「我的年度守護」區塊

---

## 八、規則頁（信任）

建 `/taisui-rules.html` 或 `articles/taisui-rules.html`：

- 列出：六沖、六害、六破、三刑、自刑
- 說明：本服務依傳統地支『值、沖、刑、害、破』關係推算

---

## 九、Phase 工作分解

### Phase 1 — 基礎判斷與 API

| 任務 | 說明 |
|------|------|
| 1.1 | 建 `js/calc/taisui.js`：生肖↔地支、五類關係 map、`getTaisuiType(userBranch, flowBranch)` |
| 1.2 | Migration `0012_yearly_lamps.sql` |
| 1.3 | `functions/api/taisui/status.js`：GET status |
| 1.4 | `functions/api/taisui/lamp.js`：POST lamp（含 upsert） |
| 1.5 | `functions/api/me/badges.js`：GET badges |

### Phase 2 — 前端太歲卡 + CTA

| 任務 | 說明 |
|------|------|
| 2.1 | 在 `index.html` 紫微與八字之間插入 `#ws-taisui` |
| 2.2 | 建 `js/ui/components/taisui-card.js` 或整合進 `data-renderer.js` |
| 2.3 | 未登入：顯示 CTA + 登入按鈕 |
| 2.4 | 已登入：顯示點燈按鈕 / 已點燈狀態 |
| 2.5 | 更新 nav：紫微、**太歲**、八字、流年 |

### Phase 3 — 點燈動畫 + 守護語

| 任務 | 說明 |
|------|------|
| 3.1 | 建 `LampModal` 或整合進既有 modal |
| 3.2 | 點擊呼叫 POST `/api/taisui/lamp` |
| 3.3 | 播放動畫 → 顯示守護語 |

### Phase 4 — 年度圖片

| 任務 | 說明 |
|------|------|
| 4.1 | MVP：前端 `generateLampImage()`（canvas）→ 下載 |
| 4.2 | 進階：後端產圖 → 存 R2 → 回傳 URL |

### Phase 5 — Badge

| 任務 | 說明 |
|------|------|
| 5.1 | Header 顯示 badge（需確認 authNav 結構） |
| 5.2 | 個人頁／我的命盤區顯示「年度守護」 |

### Phase 6 — 規則頁

| 任務 | 說明 |
|------|------|
| 6.1 | 建 `taisui-rules.html` |
| 6.2 | 太歲卡下方加「了解規則」連結 |

---

## 十、權限與防刷

- 未登入：僅能看 status，不能點燈
- 點燈：必須登入
- 每人每年最多一筆：`UNIQUE(user_id, year)`
- Rate limit：`/api/taisui/lamp` 每帳號每分鐘 3 次（可選）

---

## 十一、驗收清單

- [ ] 未登入：看到狀態 + 明確 CTA（登入可點燈、得圖片、得勳章）
- [ ] 登入後：看到點燈按鈕
- [ ] 點燈後：動畫、守護語、圖片可下載
- [ ] 重複點燈：回傳同一份 guardianPhrase、同一張圖
- [ ] Header / 個人頁出現 badge
- [ ] 規則頁列出六沖六害六破三刑自刑

---

## 十二、檔案清單（預估）

| 類型 | 路徑 |
|------|------|
| 邏輯 | `js/calc/taisui.js` |
| Migration | `migrations/0012_yearly_lamps.sql` |
| API | `functions/api/taisui/status.js` |
| API | `functions/api/taisui/lamp.js` |
| API | `functions/api/me/badges.js` |
| UI | `js/ui/components/taisui-card.js`（或整合） |
| 規則頁 | `taisui-rules.html` 或 `articles/taisui-rules.html` |
| i18n | `data/i18n/` 新增 taisui 相關 key |

---

## 十三、與既有程式整合點

1. **流年地支**：可重用 `fourTransformations.js` 的 `computeLiunianBranch(year)`，或複製一份到 `taisui.js` 避免耦合
2. **天干**：2026 丙午年，天干可寫死或從既有 `content/2026` 取得
3. **Auth**：沿用 `functions/api/auth/jwt.js` 驗證
4. **user_charts**：`/api/me/charts` 可取得預設命盤，從 `birth_date` 取年
