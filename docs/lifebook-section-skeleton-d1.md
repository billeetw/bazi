# 命書章節骨架（lifebookSection）D1 / 靜態用法

## 評估結論：可行

- 骨架寫成「可直接丟進 D1」的形式，搭配既有**底層參數解析**＋**高壓迴路**，5.2 只做少量潤飾即可產出可給個案看的內容。
- 5.2 能辨識這是骨架，會往裡塞原型／五行／六識／迴路，語感可由你控制。

---

## 已實作

1. **DbContent** 新增 `lifebookSection?: Record<string, { structure_analysis?, behavior_pattern?, blind_spots?, strategic_advice? }>`。
2. **D1 解析**（`buildContentFromRows`）支援兩種 key：
   - **整章 JSON**：`copy_key = lifebookSection.s02`，`content` = JSON 字串含四欄。
   - **單欄**：`copy_key = lifebookSection.s02.structure_analysis`，`content` = 該欄文案。
3. **靜態**：`worker/content/lifebookSection-zh-TW.json` 已含 s02（命宮）、s08（官祿宮）共 8 段，並在 zh-TW 時 merge 進 content。
4. **Prompt**：若 `content.lifebookSection[sectionKey]` 有值，會在「請開始生成」前插入 **【本章節骨架（可作為粗稿參考）】**，並說明請結合底層參數與高壓模式潤飾、填入具體描述後產出 JSON。

---

## 怎麼丟進 D1（ui_copy_texts）

### 方式一：一筆一章（content 為 JSON）

| copy_key | content（JSON 字串） |
|----------|----------------------|
| lifebookSection.s02 | `{"structure_analysis":"命宮是你…","behavior_pattern":"在日常生活裡…","blind_spots":"命宮強的人…","strategic_advice":"命宮的功課…"}` |
| lifebookSection.s08 | `{"structure_analysis":"官祿宮是…",…}` |

### 方式二：一筆一欄（你提供的 CSV 格式）

| copy_key | content |
|----------|---------|
| lifebookSection.s02.structure_analysis | 命宮是你「登入這一局」時選擇的角色樣貌… |
| lifebookSection.s02.behavior_pattern | 在日常生活裡，你會下意識地用命宮的這套程式… |
| lifebookSection.s02.blind_spots | 命宮強的人很容易把「我現在的樣子」… |
| lifebookSection.s02.strategic_advice | 命宮的功課，不是改掉自己… |
| lifebookSection.s08.structure_analysis | 官祿宮是你在這一局裡選擇… |
| … | … |

CSV 貼進 D1 時欄位對應：`copy_key` → 表欄位一，`content` → 表欄位二（或你 schema 的欄名）。locale 依你表設計（例如 `zh-TW`）。

---

## 建議驗證步驟

1. 跑一張自己的盤，呼叫 generate-section（s02、s08）。
2. 確認該題 request 的 prompt 裡同時出現：
   - 【本題底層參數解析】
   - 【命盤高壓模式與慣性迴路】（若有命中規則）
   - 【本章節骨架（可作為粗稿參考）】
3. 看 5.2 回傳的 JSON 四欄是否在骨架基礎上填入原型／五行／迴路，且語感符合預期。

若語感偏離，可再微調 system 或骨架文案，無須改程式邏輯。
