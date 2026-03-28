# 命書章節順序（SECTION_ORDER）

## 唯一來源

**`worker/data/lifebook-section-order.json`** 欄位 `sectionOrder`。

以下檔案應與其一致（勿在下列檔手改順序）：

| 用途 | 檔案 |
|------|------|
| API／模板 | `worker/src/lifeBookTemplates.ts`（`import` 上列 JSON） |
| Viewer | `src/lifebook-viewer/constants.ts`（`import` 上列 JSON） |
| 專家後台一鍵生成 | `expert-admin/index.html`（`LIFEBOOK_SECTION_ORDER_SYNC_*` 區塊） |
| 瀏覽器命書引擎 | `js/calc/lifeBookEngine.js`（同上區塊） |

## 修改流程

1. 編輯 **`worker/data/lifebook-section-order.json`**。
2. 在專案根執行：**`npm run sync:section-order`**
3. 確認 **`worker/src/lifeBookTemplates.ts`** 的 **`SECTION_TEMPLATES`** 仍涵蓋每一個 `section_key`（新增章節須加 template）。
4. 跑測試：`npm run verify:lifebook`（專案根）或 `cd worker && npx vitest run tests/sectionKeyValidation.test.ts`

## 相關

- 內容與程式覆寫關係：**`docs/lifebook-content-governance.md`**
- 產品定位：**`docs/lifebook-product-positioning.md`**

## 為何要有 sync 腳本？

`expert-admin` 與 `lifeBookEngine.js` 為純 HTML／IIFE，無法直接 `import` worker 內 JSON；由腳本寫入標記區間，避免與 API 順序漂移。
