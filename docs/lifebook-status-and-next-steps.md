# 命書地基：完成狀態與下一步建議

## 一、已完成（你已給的都有接上）

| 階段 | 項目 | 狀態 | 位置 |
|------|------|------|------|
| **Phase 1** | 世界常數 & ID 命名 | ✅ | `worker/src/lifebook/schema.ts`、`index.ts` |
| **Phase 2** | 星曜 base mature（14 段） | ✅ | `content-zh-TW.json` → `starBaseMature` |
| **Phase 2** | 星×宮小句（168 筆） | ✅ 沿用 | 現有 `starPalaces`（紫微_命宮…） |
| **Phase 2** | 十神×宮（120 筆） | ✅ | `tenGodPalacesById-zh-TW.json` → `tenGodPalacesById` |
| **Phase 2** | 神經迴路（12 段） | ✅ | `neuralLoops-zh-TW.json` → `neuralLoops` |
| **Phase 3** | 演算法規則表（14 條） | ✅ | `worker/src/lifebook/rules.ts` → `RISK_RULES` |
| **Phase 3** | 高壓 Snippet（39 筆） | ✅ | `highPressure-zh-TW.json` → `DbContent.highPressure` |

---

## 二、你還缺什麼沒給我（可選補齊）

Phase 2 底層文案已全數接上：

| 項目 | 狀態 |
|------|------|
| **星 base core / shadow** | ✅ 14 顆（含紫微）已寫入 `starBaseCore-zh-TW.json`、`starBaseShadow-zh-TW.json` |
| **五行強／弱** | ✅ 10 段已寫入 `wuxingEnergy-zh-TW.json`，接上 `DbContent.wuxingEnergy` |
| **六識×宮** | ✅ 12 筆已寫入 `consciousPalace-zh-TW.json`，接上 `DbContent.consciousPalace` |

**不必再給的**：星×宮 168、十神×宮 120、神經迴路 12、高壓 39、規則表 14 條、星 core/shadow 14×2、五行 10、六識×宮 12 — 都已寫入並接好。

---

## 三、下一步建議（優先順序）

### 1. 組裝器邏輯 ✅ 已完成

- **產出**：`worker/src/lifebook/assembler.ts`
  - **輸入**：`AssembleInput`（starByPalace, tenGodByPalace, wuxingStrength, fourTransformations）
  - **輸出**：`AssembleResult`（loops: NeuralLoopId[], highPressureKeys: string[]）
  - **函式**：`assembleRiskProfile(input)` 依 RISK_RULES 匹配；`resolveAssembleSnippets(result, content)` 從 content 取出對應的 neuralLoops / highPressure 文案。
- **用途**：命書生成時可先呼叫 `assembleRiskProfile`，再以 `resolveAssembleSnippets` 取文案塞進 prompt 或章節。

### 2. Phase 4：22 章骨架 + 80% 組裝 + 5.2 潤飾

- 等你準備好再做：22 章×4 段骨架（或帶占位符的模板）、組裝器依宮位／星／十神／五行／規則匹配結果組出粗稿、最後用 GPT-5.2 只做語氣潤飾。
- 需要你補：**22 章×4 段** 的骨架文案（或同意用簡易模板＋占位符由 Cursor 起稿）。

### 3. Phase 2 底層文案 ✅ 已補齊

- 星 base core／shadow 14 顆（含紫微）、五行強弱 10 段、六識×宮 12 筆均已寫入靜態 JSON 並接上 DbContent。

---

## 四、一句總結

- **已完成**：Phase 1 ontology、Phase 2 星 mature／十神×宮／神經迴路、Phase 3 規則表＋高壓 39 筆；你給的內容都接上了。
- **你還缺**：五行強弱／六識×宮／星 base core（可選）；Phase 4 的 22 章骨架（要做 80% 組裝時再給）。
- **下一步**：實作「規則匹配 + 取迴路／高壓文案」的組裝器函式，再接上命書生成流程；其後再排 Phase 4 與可選文案補齊。
