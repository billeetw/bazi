# 命書詳情左側 Viewer 空白 — 本地除錯步驟

## 為什麼要先本地測？

正式站部署後若左側仍空白，在本地可以：
1. 開瀏覽器開發者工具，直接看 **iframe 內的 Console 錯誤**
2. 確認 postMessage 是否有送出／收到
3. 不用反覆部署就能改程式、重新整理驗證

---

## 一、本地跑起來

```bash
# 建置（含 viewer 與專家後台）
npm run build:lifebook-viewer
npm run build:expert-admin
npm run build:tailwind

# 從專案根目錄 serve（才能同時提供 expert-admin.html 與 dist/ 內建好的檔）
npx serve . -p 8789
```

- **測詳情 modal**：開 **http://localhost:8789/expert-admin.html**，登入 → 命書列表 → 點「詳情」。
- **獨立頁除錯（建議）**：同上點「詳情」後，在 modal 頂列點 **「獨立頁除錯」**，會在新分頁開啟 **lifebook-detail.html?id=xxx**。此頁與專家視角分離，僅做「依 ID 取得命書 → 寫入 storage → 載入 viewer iframe」，右側有 Meta + 除錯 log，較易排查 viewer 是否讀到 doc、storage 是否寫入成功。
- **只測 viewer + postMessage**：開 **http://localhost:8789/test-lifebook-detail-iframe.html**（左側應會出現「第一章」等內容）。

---

## 二、看 iframe 裡的錯誤（關鍵）

左側是 **iframe**，錯誤會出現在 **iframe 的 Console**，不是主頁的 Console。

### Chrome / Edge

1. 開開發者工具 (F12) → 切到 **Console**。
2. Console 左上角有一個 **下拉選單**（預設是 "top" 或主框架）。
3. 點開後選 **lifebook-viewer.html**（或該 iframe 的 URL）。
4. 再觸發一次「詳情」、重新整理 iframe，看 **紅色錯誤** 與堆疊。

### 或：直接對 iframe 檢查

1. 在左側「使用者視角」空白處 **右鍵 → 檢查**。
2. 在 Elements 裡確認選到的是 iframe 內的節點（`#document` 底下是 `<html>` 命書 viewer 的內容）。
3. 切到 **Console**，此時 Console 的 context 應是該 iframe，錯誤會在這裡。

把 **完整錯誤訊息 + 檔名與行號**（例如 `lifebook-viewer-xxx.js:1:1234`）記下來或截圖。

---

## 三、確認 postMessage 有沒有跑

在 **主頁** Console（expert-admin，不要選 iframe）貼上並執行：

```js
window.addEventListener('message', function(e) {
  console.log('[parent] message', e.origin, e.data);
});
```

再開一次「詳情」。應該會看到：
- 一筆 `[parent] message ... "lifebook-viewer-ready"` → 表示 iframe 有送出 ready。
- 若沒有 → 表示 iframe 可能沒載完、或腳本錯誤沒跑到 postMessage。

在 **iframe** Console（切到 lifebook-viewer 的 context）貼上：

```js
window.addEventListener('message', function(e) {
  console.log('[viewer] message', e.origin, e.data?.type, e.data?.doc ? 'has doc' : 'no doc');
});
```

再開一次「詳情」。應該會看到：
- 一筆 `[viewer] message ... LIFEBOOK_DOC has doc` → 表示父頁有把 doc 傳進來。
- 若沒有 → 表示父頁沒送到或送錯 target。

---

## 四、用獨立測試頁驗證 viewer（可選）

專案根目錄有 **test-lifebook-detail-iframe.html**：
- 頁面內嵌 `dist/lifebook-viewer.html` 的 iframe，並在收到 `lifebook-viewer-ready` 後 postMessage 一筆最小 doc。
- 若左側出現「第一章」等內容，表示 viewer 與 postMessage 流程正常，問題多半在 expert-admin 或正式環境（路徑／CSP／網域等）。

```bash
npm run build:lifebook-viewer
npx serve . -p 8789
# 開 http://localhost:8789/test-lifebook-detail-iframe.html
```

---

## 五、把結果貼給協助者

若仍無法排除，請提供：

1. **iframe Console 的紅色錯誤**（完整訊息 + 檔名行號）。
2. 主頁與 iframe 的 **postMessage 的 console.log 結果**（有無 "lifebook-viewer-ready" / "LIFEBOOK_DOC has doc"）。
3. 左側 iframe 內是否有出現文字（例如「尚未載入命書資料 · xxx」），若有，**「·」後面的 xxx** 完整內容。

有這些就能對症修正，不必猜測。
