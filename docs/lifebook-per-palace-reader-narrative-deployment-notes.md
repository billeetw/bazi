# 逐宮讀者敘事 — 部署與驗證說明

本檔總結已**在程式內落地**的行為（無須另開 feature flag）。對外「部署」僅需發布含下列 commit 的 **worker**／呼叫端。

## 已落地項目

| 項目 | 行為 |
|------|------|
| **命名** | 讀者向逐宮全文統稱 **逐宮讀者敘事**；**≠** 命書章節 `s17`（疊宮分析）。見 `lifebook-s17-s18-s19-unified-architecture-assessment.md` 名詞表。 |
| **資料來源** | `getPalaceSectionReaderOverrides` 優先自 **`normalizedChart`**（未傳則內部 `normalizeChart(chartJson)`）取 `PalaceStructure`，再 `palaceStructureToPalaceRawInput` → `buildPalaceNarrativeInput` → `renderPalaceNarrativeSample`。 |
| **本命四化句** | `natalTransformItems` 優先 **`getTransformSemantic`**（星×宮×四化矩陣 → 四化×宮 → 通用），無命中才 **`buildTransformNarrative`**。與 `narrativeFacade`／模組二用語同源。 |
| **API 路徑** | `worker/src/index.ts` 單章與批次在 12 宮分支呼叫 `getPalaceSectionReaderOverrides(..., p2.normalizedChart)`（與 findings 同次 normalize 時不重算）。 |

## 驗證指令（開發機）

```bash
cd worker
npm test -- PalaceNarrativeBuilder.test.ts natalTransformResolutionChain.test.ts getPalaceSectionReaderOverrides.test.ts
```

預期：全通過。

## 驗收清單（產品）

- 見 **`docs/lifebook-per-palace-reader-narrative-rollout-checklist.md`**（宮別人工讀稿順序）。

## 文件索引

- 四化語料契約：`docs/lifebook-fourhua-narrative-supply-contract.md`
- 架構評估（含 Phase 1–3）：`docs/lifebook-s17-s18-s19-unified-architecture-assessment.md`
