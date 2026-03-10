# 命書優化計劃評估

## 一、整體看法

計劃方向正確，問題診斷精準。三層分離（資料→推論→敘事）、人格固定、句庫注入、一次傳入命盤，都是業界常見的 prompt 優化手法。可行性高，但需分階段實作，並在技術細節上做幾項取捨。

---

## 二、可行性評估

### ✅ 高可行性

| 項目 | 說明 |
|------|------|
| **專家人格固定** | 直接擴充現有 `SYSTEM_PROMPT`，無架構改動 |
| **20 題模板可編輯** | 專家後台加「問題／模板編輯」介面，存 D1 或 KV |
| **句庫（十神、五行）** | 放入 system 或 user prompt 的 reference 區塊 |
| **命盤 JSON 結構化** | 現有 `chart_json` 已接近，補齊欄位即可 |
| **模型切換** | Worker 加 `model` 參數，expert-admin 可選 gpt-5-main / gpt-5-thinking |

### ⚠️ 需取捨

| 項目 | 挑戰 | 建議 |
|------|------|------|
| **一次生成 20 章** | 單次輸出 20×800 字 ≈ 16K+ tokens，易逾時、易截斷、解析複雜 | **維持逐章呼叫**，但改為「先傳命盤 + 人格」建立 context，後續 20 次只傳「第 N 題」+ 句庫，大幅減少重複輸入 |
| **三層分離（資料→推論→敘事）** | 需新增推論層 API、改 pipeline、兩次模型呼叫 | **Phase 2** 再做。Phase 1 先優化單一模型 prompt（人格+句庫+模板） |
| **o1 用於推論層** | o1 偏推理、輸出格式較難控制，不適合直接產文案 | 推論層若用 o1，需明確要求「結構化 JSON」；敘事層仍用 GPT-5 |

### ❓ 需釐清

1. **「一次傳入命盤」的實作方式**  
   - 方案 A：單次 API 回傳 20 章（風險：逾時、截斷）  
   - 方案 B：多輪對話，第一輪傳命盤，後續 20 輪只傳題號（仍 20 次 API，但 input 精簡）  
   - 方案 C：維持 20 次獨立呼叫，但每次只傳「題號 + 句庫」，命盤與人格放 system（需確認 context 長度）

2. **GPT-5 型號**  
   - `gpt-5-main`：速度與成本較平衡  
   - `gpt-5-thinking`：推理強，適合推論層，但較貴、較慢  

---

## 三、需補充調整之處

### 1. 輸出格式與現有引擎對接

`LifeBookEngine.renderHTML()` 依賴這四個欄位：

- `structure_analysis`
- `behavior_pattern`
- `blind_spots`
- `strategic_advice`

你的四段結構可對應為：

| 你的四段 | 建議對應欄位 |
|----------|--------------|
| 核心洞察（你為什麼會如此） | `behavior_pattern` |
| 命盤證據（星曜／三方四正／五行） | `structure_analysis` |
| 人生影響（對性格／事件） | `blind_spots` |
| 行動建議 | `strategic_advice` |

**建議**：Prompt 中仍要求模型輸出這四個欄位，僅在說明裡改為「核心洞察、命盤證據、人生影響、行動建議」的語意，以維持相容。

### 2. 命盤 JSON 結構

你列的結構：

```
命主、身主、命宮、三方四正、五行表層、五行實戰、紫微12宮、大限、流年、小限、生年四化
```

現有 `chart_json` 已有：

- `ziwei`（含命主、身主、12 宮）
- `bazi`
- `overlapAnalysis`（疊宮）
- `fourTransformations`（四化）
- `fiveElements`（五行）

**需補**：大限、流年、小限若在 `contract.ziwei.horoscope`，需確保 `AdminExport` 會一併匯出。可加一層「命盤摘要」轉換，把上述欄位整理成你指定的結構，再給模型。

### 3. 句庫與五行弱項的動態注入

五行弱項建議（金弱、木弱…）應依命盤**實際弱項**決定。建議：

- 在 `weightAnalysis` 或 `fiveElements` 中標出「弱行」
- 只把對應的句庫段落注入 prompt，避免每次都傳 5 句

### 4. 20 題模板的 s18 與現有 s19 對調

你的模板：

- [18/20] 業力議題：化忌、空、煞…
- [19/20] 行動建議（整合版）
- [20/20] 總結

現有 `SECTION_ORDER` 的 s18、s19、s20：

- s18：人生主線任務
- s19：業力與未完成課題
- s20：總結導航

**建議**：先決定是否要調整題序；若調整，需同步更新 `lifeBookEngine.js` 的 `SECTION_CONFIG`、`moduleMap` 與 `renderHTML` 的模組分組。

### 5. 專家後台「可編輯」介面

建議可編輯：

- [ ] 專家人格（system prompt）
- [ ] 20 題模板（含每題的 4 段說明）
- [ ] 十神句庫
- [ ] 五行弱項句庫
- [ ] 模型選擇（gpt-5-main / gpt-5-thinking / gpt-4o-mini）

儲存方式：D1 表 `lifebook_prompt_config` 或 KV `lifebook:prompt`，Worker 透過 API 讀取；或先以 JSON 檔部署，之後再改為動態讀取。

---

## 四、建議實作順序

### Phase 1：Prompt 優化（1–2 週）

1. 擴充 `life-book-prompts.ts`：專家人格 + 句庫 + 新 20 題模板  
2. Worker 支援 `model` 參數，expert-admin 可選模型  
3. 維持逐章呼叫，但每次 prompt 只含「題號 + 句庫」，命盤與人格放 system  
4. 輸出欄位維持 `structure_analysis` 等四項，確保與 `renderHTML` 相容  

### Phase 2：專家後台介面（約 1 週）

1. 新增「問題與模板編輯」區塊  
2. 新增「人格與句庫編輯」區塊  
3. 儲存至 D1 / KV，Worker 讀取  

### Phase 3：三層分離（可選，2–3 週）

1. 推論層：`/api/life-book/infer`，用 o1-mini 產結構化 insight  
2. 敘事層：`/api/life-book/narrate`，用 GPT-5 依 insight + 風格寫文案  
3. 前端：先呼叫 infer，再呼叫 narrate 20 次  

### Phase 4：整合管理系統

1. 報名紀錄後台「產生命書」沿用現有流程  
2. 改為呼叫新的 generate-section（含優化後 prompt）  
3. 驗證品質與穩定性後再考慮線上購買  

---

## 五、總結

| 方向 | 評估 |
|------|------|
| 問題診斷 | 準確，特別是「重複理解命盤」與「缺乏風格庫」 |
| 人格 + 句庫 + 模板 | 建議採納，可直接實作 |
| 一次傳入命盤 | 建議：維持 20 次呼叫，但精簡每次 input |
| 三層分離 | 建議放 Phase 3，先做 prompt 優化 |
| 模型選擇 | 建議用 gpt-5-main 預設，gpt-5-thinking 可選 |
| 可編輯介面 | 建議納入 Phase 2，方便測試與迭代 |

若你同意，可從 Phase 1 的 prompt 與模型參數開始，再逐步加上編輯介面與三層分離。
