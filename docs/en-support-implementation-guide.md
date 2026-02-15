# 英文版完整支援實作指南

讓英文版使用者看到全英文內容，需同時改動 **Worker** 與 **內容庫**。

**iztro 英文 key 對照表**：見 `docs/iztro-en-us-keys.md`  
**compute/all 回應格式**：見 `docs/compute-all-response-spec.md`

---

## Content 放哪裡？建議

| 方案 | 優點 | 適用 |
|------|------|------|
| **A) Worker 內靜態 JSON** | 最快、無 DB、改 code 即更新 | 先上線、一人開發 |
| **B) D1 / KV** | 可用 admin 維護、不需 redeploy | 之後要常改文案時 |

**建議**：先做 **A)**，等英文內容穩定後再遷到 **B)**。  
若已有 D1（如 ui_copy_texts），可評估直接沿用。

**A) 靜態 JSON 範例**（放 Worker 專案內）：

```js
// content-zh-TW.json
export const contentZhTW = {
  palaces: { "命宮": "你的核心作業系統...", "兄弟": "..." },
  stars: { "紫微": "權威與領導...", "天機": "..." },
  tenGods: {},
  wuxing: {}
};

// content-en.json（key 用 iztro en-US 星名）
export const contentEn = {
  palaces: { "命宮": "Your core operating system...", "兄弟": "..." },
  stars: { "emperor": "Authority and leadership...", "advisor": "..." },
  tenGods: {},
  wuxing: {}
};
```

`GET /content/2026?locale=en` 時回傳對應物件。**重要**：`stars` 的 key 必須與 mainStars 陣列內的星名一致。en 模式下即 `emperor`、`advisor` 等（見 iztro-en-us-keys.md）。宮位 key 目前前端仍用 命宮、兄弟…，故 `palaces` 的 key 維持繁體即可。

---

## 一、Worker（compute/all + content）

### 1.1 compute/all：透傳 language 給 iztro

已於 `docs/worker-language-requirement.md` 說明，重點：

```js
// 接收
const language = req.body.language ?? 'zh-CN';

// 呼叫 iztro
const astrolabe = astro.astrolabeBySolarDate(
  dateStr, timeIndex, gender, fixLeap,
  language  // 'zh-TW' | 'zh-CN' | 'en-US'
);

// 回傳
return { ok: true, language, chartId, features: {...} };
```

完成後：星名、宮名會依 iztro 的 `en-US` 回傳（如 Purple Star、Life Palace 等）。

---

### 1.2 content/2026：依 locale 回傳內容

目前 `GET /content/2026` 無 locale 參數，前端需改為帶入語系。

**Worker 需實作：**

1. 接受查詢參數：`GET /content/2026?locale=zh-TW` 或 `?locale=en`  
2. 從 `ui_copy_texts` 依 `locale` 篩選並組出 dbContent  
3. 建議 locale 對應：`zh-TW`、`zh-CN`、`en`（或 `en-US`，與前端對齊即可）

**dbContent 結構（依 locale 不同）：**

```json
{
  "ok": true,
  "locale": "en",
  "palaces": {
    "soul": "Your core operating system...",
    "siblings": "Your allies and kin resources..."
  },
  "stars": {
    "emperor": "Represents authority and leadership...",
    "advisor": "Represents wisdom and adaptability..."
  },
  "tenGods": {},
  "wuxing": {}
}
```

**重要：key 必須與 iztro 的語系一致**

- `zh-TW`：`palaces.命宮`、`stars.紫微`
- `en`：iztro en-US 回傳的 key，例如 `palaces.soul`、`palaces.siblings`、`stars.emperor`、`stars.advisor`

完整對照表見 `docs/iztro-en-us-keys.md`。

---

## 二、內容庫（ui_copy_texts）

### 2.1 copy_key 命名與 locale

| 語系 | 範例 copy_key | 說明 |
|------|---------------|------|
| zh-TW | `palace.命宮` | 宮位解釋 |
| zh-TW | `star.紫微` | 星曜解釋 |
| en | `palace.Life` | 宮位解釋（對應 iztro 英文宮名） |
| en | `star.Purple Star` | 星曜解釋（對應 iztro 英文星名） |

content API 負責把 `ui_copy_texts` 組合成 `palaces`、`stars`、`tenGods`、`wuxing`。

### 2.2 需補的英文內容

在 `admin-copy.html` 以 `locale=en` 新增，copy_key 需對應 iztro en-US 的 key：

1. **12 宮位**：`palace.soul`、`palace.siblings`、`palace.spouse`…（見 `iztro-en-us-keys.md`）  
2. **14 主星**：`star.emperor`、`star.advisor`、`star.sun`…  
3. **十神**：依八字模組輸出 key 建立  
4. **五行**：若 wuxing 來自 copy，需對應的英文 copy_key

---

## 三、前端改動

### 3.1 loadDbContent 傳入 locale

`api-service.js` 的 `loadDbContent` 需依當前語系請求：

```js
async function loadDbContent(onSuccess) {
  const locale = mapToContentLocale(window.I18n?.getLocale?.());
  const r = await fetch(`${API_BASE}/content/2026?locale=${locale}`, { method: "GET" });
  // ...
}

function mapToContentLocale(i18nLocale) {
  const map = { 'zh-TW': 'zh-TW', 'zh-CN': 'zh-CN', 'en': 'en' };
  return map[i18nLocale] || 'zh-TW';
}
```

### 3.2 宮位／星曜 key 對應

當 `astrolabeLanguage === 'en-US'`，iztro 回傳的星名、宮名為英文。若 content API 的 key 與 iztro 一致，`palace-detail.js` 等可直接用英文 key 查 `dbContent.palaces[name]`、`dbContent.stars[s]`，無需額外對映。

若 content 的 key 與 iztro 不完全一致，需在宮位／星曜查詢處加一層 key mapping。

---

## 四、建議實作順序

| 順序 | 項目 | 負責 | 說明 |
|------|------|------|------|
| 1 | Worker：compute/all 透傳 language | 外部 Worker | 參考 `worker-language-requirement.md` |
| 2 | 前端：loadDbContent 加 ?locale= | 本專案 | 小改 api-service.js |
| 3 | Worker：content/2026 支援 ?locale= | 外部 Worker | 依 locale 查 ui_copy_texts |
| 4 | 後台：建立英文 copy 資料 | 營運 | admin-copy 新增 en 文案 |
| 5 | 核對 iztro 英文 key | 所有人 | 確認宮名、星名與 content key 對應 |

---

## 五、iztro 英文 key 參考

已整理於 `docs/iztro-en-us-keys.md`，來源為 iztro 官方 `src/i18n/locales/en-US/`。
