# Behavior Axis、語氣層與循環鏈（BM3 設計草案）

> **目的**：在**不新增段落、不線性膨脹維護面**的前提下，讓同一套 H3／H4 讀起來**更像在說這個人**，而不是多一層規則感。  
> **一句話**：**讓系統更像人，而不是更複雜。**

**v1 已落地（規格 + 純函式模組）** → **[lifebook-behavior-axis-v1-spec.md](./lifebook-behavior-axis-v1-spec.md)** · `worker/src/lifebook/s17/palaceNarrative/behaviorAxisV1.ts`（管線串接可選，未預設開啟）。

與 **[確定性內容框架](./lifebook-reader-narrative-deterministic-content-framework.md)**、**[補資料順序](./lifebook-reader-narrative-supplement-sequence.md)** 並讀；程式落點仍以 `PalaceNarrativeBuilder`、`palaceNarrativeCopy`、`palaceReaderPremium` 的 `tone()` 族為主。

---

## 一、語意分工（與現有 H3／H4 對齊）

| 欄位（既有） | 讀者感受（建議定位） | BM3 要補的「一層」 |
|--------------|----------------------|-------------------|
| **H3** `decisionPatterns` | **你怎麼活**——慣性決策、日常站位 | 同一句可帶 **Behavior Axis 著色**（語氣／用詞偏移），不變更欄位數量 |
| **H4** `pitfalls` | **你會怎樣**——踩坑、後果、外顯 | 同上；可標 **與星曜張力的衝突** 而非另寫一段 |
| **Loop（新建·輕量）** | **你為什麼一直這樣**——強化循環、自我證成 | **不當成第四段**；見下文「落點選項」 |

---

## 二、三層結構（你要加的）

### 2.1 Layer 1 — Behavior Axis → **語氣偏移表**（直接接 tone layer）

- **Behavior Axis**：少數枚舉軸（例：偏規避／偏直面、偏快收斂／偏拖、偏關係／偏任務——**實際軸與命名由你定**）。
- **語氣偏移表**：每個軸值對應到現有 **soft / standard / direct**（或你專案裡的 tone 分級）的**選詞規則**，而不是另寫一整篇。
- **接線方式**：與現有 `palaceReaderPremium.ts` 的 `tone()` 思路一致——**同一意義，不同硬度／委婉度**；BM3 只是把「選哪一欄」從純規則擴成 **Axis 解析結果 + 規則**。

**維護約束**：軸的個數 **上界固定**（例如 ≤8），偏移表 **一行一軸值**，避免「每軸一篇作文」。

---

### 2.2 Layer 2 — **星曜 × Behavior Axis 衝突表**

- **衝突**：主星（或主星組）與某 Behavior Axis **預設張力**（例如「想穩但星性偏衝」類），表內只存 **稀疏條目**（有張力才寫）。
- **用途**：在 **不增加段落** 下，決定  
  - H3／H4 用哪一個 **著色模板**（短語級），或  
  - 是否切換 tone 分級／是否顯示 Loop 短句（見下）。

**維護約束**：禁止「每星×每軸」全表；採 **命中才維護** + **預算上限**（與 L3 規則包同一哲學）。

---

### 2.3 Layer 3 — **H3 × H4 × 衝突循環鏈（Loop）**

- **Loop** 只回答：**為什麼這組 H3 會反覆導向這組 H4**（強化迴路一句話級）。
- **不增加段落**的落點選項（擇一或並存，產品可選）：

| 方案 | 做法 | 優點 | 注意 |
|------|------|------|------|
| **A. 子句級** | 在某一條 H3 或 H4 **句內**加短短連接（例如「→ 久了就…」），總條數不變 | 讀者仍覺得是「同一句話」 | 需嚴格長度上限 |
| **B. 同欄位替換** | 僅在「有 Loop 模板」時，用**同位置**的一句替換預設句 | 完全不增段 | 句庫要預算 |
| **C. 僅權重／premium 路徑** | Loop 只在 `weightedMode` 或 premium 命中時插入一行 | 不動無權重純 copy | 兩條產品線語感可能略異 |

預設建議：**B 或 C** 最符合「不增加段落」的硬限制。

---

## 三、與現有管線的關係（不另開一套敘事）

```
NormalizedChart + palace + mainStars
        ↓
[Behavior Axis 解析]（你的算法入口）
        ↓
Layer1 語氣偏移 → 選 tone 規則
Layer2 衝突表 → 是否觸發著色／Loop
Layer3 Loop → 可選：替換 H3/H4 其中一句 或 加內嵌子句（若產品允許極短）
        ↓
既有 PalaceNarrativeBuilder / renderPalaceNarrativeSample
```

- **不新增 JSON 資產種類**為前提：BM3 prefer **單一結構表**（例如 `behaviorAxisToneOffsets.json` + `starAxisTension.json` + `h3h4LoopTemplates.json`）三小檔，或合併一檔、分 key。

---

## 四、命中率「再上一層」但不爆維護的條件

1. **組合數可算**：`O(軸數) + O(稀疏衝突條數) + O(Loop 模板條數)`，每季可加預算上限。  
2. **Fallback**：無 Axis／無衝突 → 行為與現在完全一致（純 `palaceNarrativeCopy`）。  
3. **可測**：同一 chart hash → 同一 Axis／tone／Loop 選擇（deterministic）。  
4. **人感來源**：來自「**用詞與因果一句**」，不是來自「多一章說明」。

---

## 五、請你提供的「算法」——我們評估時會看這些

當你準備好，可直接貼 **偽碼或步驟**，我們用下面清單評估是否值得落檔：

| 項目 | 問題 |
|------|------|
| **輸入** | 從盤上取哪些欄位？是否只用主星／亮度／四化？ |
| **輸出** | 是單一 Axis、多軸向量、還是 priority 規則鏈？ |
| **決定性** | 同一輸入是否保證同一輸出？ |
| **稀疏性** | 衝突表如何維持稀疏（預算／預設值）？ |
| **與 tone 映射** | Layer1 如何接到現有 `tone()` 分級？ |
| **Loop 生成** | 模板索引鍵是什麼（例：`palace#axis#tension`）？ |
| **失敗模式** | 缺資料時行為？ |

---

## 六、狀態

| 項目 | 狀態 |
|------|------|
| 本文件 | **總覽**；細節以 **[v1 規格](./lifebook-behavior-axis-v1-spec.md)** 為準 |
| 程式模組 | **`behaviorAxisV1.ts`**：Axis、偏移句、衝突表、Loop 示範、tone gate |
| 管線串接 | **可選**：於 `PalaceNarrativeBuilder`／renderer 依 `maxPerPalace` 注入 |
| 與 H1–H4 橫切 | H1–H4 句庫可繼續補；BM3 是**著色與循環**，不重寫橫切句意 |

---

*最後更新：2026-03 — BM3 = Behavior axis + Mapping + Loop chain（暫名）。*
