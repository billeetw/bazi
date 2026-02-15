# 國際化 (i18n)

第一批語系：**zh-TW**（預設）、**zh-CN**、**en**。

## 檔案

- `zh-TW.json`：繁體中文（預設）
- `zh-CN.json`：簡體中文
- `en.json`：English

## Key 結構

- **ui.*** — 通用：`appTitle`, `submit`, `loading`, `calculate`, `back`, `lang`
- **wuxing.*** — 五行生剋診斷：`title`, `section1`～`section5`, `consultButton`, `placeholder`, `noReport`
- **estimateHour.q1～q19** — 時辰推算問卷：每題有 `text`、`options.A`～`options.F`（依題而異）

## 前端用法

1. 確保已載入 `js/i18n.js` 並在頁面中執行過 `I18n.init()`（index.html 已掛好）。
2. 取字串：`I18n.t('wuxing.title')`、`I18n.t('estimateHour.q1.text')`。
3. 替換變數：`I18n.t('wuxing.momentumTemplate', { top2: '火、木', bottom2: '金、水' })`（模板內用 `{{top2}}`）。
4. 取整題（問卷）：`I18n.tObject('estimateHour.q1')` 得到 `{ text: '...', options: { A: '...', ... } }`。

## 語系來源優先順序

1. 網址參數 `?lang=zh-CN` 或 `?lang=en`
2. `localStorage` 的 `locale`
3. 預設 `zh-TW`

## 切換語系（不重整頁面）

```js
I18n.switchLocale('en').then(function () {
  // 依需求重新渲染會用到 I18n.t() 的區塊，或 location.reload()
});
```

## 語言切換器範例（可放在導覽列）

```html
<select id="langSwitcher" aria-label="語言">
  <option value="zh-TW">繁體中文</option>
  <option value="zh-CN">简体中文</option>
  <option value="en">English</option>
</select>
<script>
  (function () {
    var sel = document.getElementById('langSwitcher');
    if (!sel || !window.I18n) return;
    sel.value = window.I18n.getLocale();
    sel.addEventListener('change', function () {
      window.I18n.setLocale(sel.value, { reload: true });
    });
  })();
</script>
```

## 後續接軌

- **問卷**：在 `identifyBirthTime.js` 中改為用 `I18n.tObject('estimateHour')` 組出 `QUESTIONS`（若已 init）。
- **五行卡片**：在 `data-renderer.js` / `ui.js` 的五行區塊用 `I18n.t('wuxing.section1')` 等取代硬編碼標題。
- **管線報告**：若報告內文也要多語，需在 `wuxingFlowPipeline.js` 依語系選用不同模板或由 API 回傳已翻譯段落。
