# 命書「純資料庫組裝」可行性與效益評估

## 一、你的命題

- **現狀**：22 題每題都呼叫 GPT-4.1 生成四欄（structure_analysis、behavior_pattern、blind_spots、strategic_advice），你覺得 4.1 寫得不好。
- **提案**：改為只用資料庫內容（你持續補充）來**組裝**命書，不再依賴模型生成正文。

以下為可行性、效益，以及**你需要補充的資料內容清單**。

---

## 二、可行性評估

### 2.1 結論：可行，但需補足「章節級」與「組合級」內容

| 維度 | 說明 |
|------|------|
| **技術** | 可行。Worker 已有 content 層（D1 / 靜態 JSON）、命盤維度（宮位、十神、五行、星曜）。只要 DB 有對應 key，組裝邏輯就是「依 section_key + 命盤維度查表 → 拼成四欄」即可。 |
| **內容覆蓋** | 目前 DB 已有：starPalaces（星_宮）、tenGodPalaces（十神_宮）、wuxingPalaces（五行_宮）、stars（命主身主）、palaces。**缺的是**：每章的「導入句」「行為模式」「盲點」「建議」四段正文（或可拼出這四段的 building blocks）。 |
| **組合爆炸** | 若每段都依「宮位×十神×五行×主星」各寫一種，筆數會爆。實務上必須用「章節 + 少數維度」或「模板 + 占位符」控制筆數。 |

### 2.2 兩種組裝策略

- **策略 A：章節 × 四欄純塊狀**  
  每題只存 4 段固定文（例如 `section.s08.structure_analysis`、`section.s08.behavior_pattern` …）。  
  - **優點**：實作最簡單、品質完全由你掌控。  
  - **缺點**：無個人化，每個人同一題看到的一樣（只有星曜評語等既有區塊會因命盤不同而不同）。

- **策略 B：章節 + 占位符／維度拼接**  
  每題存「模板」或「依維度查到的多段文」再拼接。  
  - 例：`structure_analysis` = `section.s08.intro`（可含 `{宮位}`、`{十神}`、`{五行}`）+ 該宮的 starPalaces 內文 + tenGodPalaces + wuxingPalaces。  
  - **優點**：同一題可因十神／五行／星曜不同而不同。  
  - **缺點**：要設計好 key 與 fallback，且「行為／盲點／建議」若也要分維度，需補的筆數較多。

建議：**先做策略 A（每題 4 段固定文）**，確認品質與流程後，再對部分章節改為策略 B（只對你願意維護的維度做區分）。

---

## 三、效益評估

| 效益 | 說明 |
|------|------|
| **品質穩定** | 文案完全由你（或編輯）撰寫與審稿，不再受 4.1 發揮不穩影響。 |
| **成本與延遲** | 不再為 22 題各打一次 OpenAI，成本與延遲都大幅下降（可改為純 Worker + D1 查表）。 |
| **可迭代** | 改文案只需改 D1／靜態 JSON，不用改 prompt、不用重新訓練。 |
| **多語系** | 同一套 key 結構，多 locale 各一份 content 即可。 |
| **代價** | 需一次性補齊 22×4 段（或你決定的段落數），且若要做個人化，要再補「維度 × 段落」的內容或模板。 |

---

## 四、你需要補充的資料（具體清單）

以下皆為「若改為純 DB 組裝」時，**至少要補**的內容；格式與 key 可與現有 D1／content 慣例對齊。

### 4.1 必備：22 章 × 4 欄的正文（策略 A）

每章一筆，用一個 key 存四欄，或拆成四個 key。建議 key 格式（與現有 `section.*` 可併存）：

- **方案 1（一筆 JSON）**  
  - `copy_key`: `lifebookSection.{section_key}`（如 `lifebookSection.s08`）  
  - `content`: JSON 字串，例如：
    ```json
    {
      "structure_analysis": "此題聚焦你的工作狀態、外界期待…（你寫的完整段落）",
      "behavior_pattern": "事業宮強的人通常…",
      "blind_spots": "容易…",
      "strategic_advice": "建議一…建議二…"
    }
    ```
- **方案 2（四筆分開）**  
  - `lifebookSection.{section_key}.structure_analysis`  
  - `lifebookSection.{section_key}.behavior_pattern`  
  - `lifebookSection.{section_key}.blind_spots`  
  - `lifebookSection.{section_key}.strategic_advice`  

**你需要補充的內容**：22 個 section_key（s00～s21）各自 4 段文字（可先寫一版，再依上線反應改 D1）。

### 4.2 若要做「宮位題」個人化（策略 B 入門）

在 4.1 的基礎上，不改 4 欄結構，但**第一段（structure_analysis）** 改為「模板 + 既有 building blocks」：

- **新增 key**（建議）：  
  - `lifebookIntro.{section_key}`  
  - content：一段「導入模板」，可含占位符，例如：  
    「你的{宮位}宮主星為{主星列表}，十神為{十神}，五行屬{五行}。……」

**組裝時**：  
- 用命盤算出該題的宮位、十神、五行、主星列表。  
- 從既有 content 取：該宮的 starPalaces 內文、tenGodPalaces[十神_宮]、wuxingPalaces[五行_宮]。  
- 將「導入模板」的占位符替換後，再與上述星／十神／五行段落拼接成一段 structure_analysis。  
- 其餘三欄（behavior_pattern、blind_spots、strategic_advice）仍用 4.1 的固定段即可。

**你需要補充的內容**：  
- 22 筆 `lifebookIntro.{section_key}`（若該題無宮位則可留空或共用總論）。  
- 確認 starPalaces / tenGodPalaces / wuxingPalaces 在該題用到的 key 都已補齊（你 doc 裡 1b、1c 已列）。

### 4.3 現有內容可直接沿用、不需重複補

- **starPalaces**（星_宮）：已有，組裝時直接取用。  
- **tenGodPalaces**（十神_宮）、**wuxingPalaces**（五行_宮）：依 doc 已支援，補齊 120／60 筆即可。  
- **stars**（命主身主）、**palaces**（宮位簡介）：已有，若要出現在命書中，組裝時帶入即可。

### 4.4 小結：你要補什麼

| 優先 | 補充項目 | 筆數 | 用途 |
|------|----------|------|------|
| 1 | **lifebookSection.{s00～s21}**：每章 4 段（structure_analysis, behavior_pattern, blind_spots, strategic_advice） | 22 章 × 1 筆（或 22×4 筆） | 純 DB 組裝時直接輸出，不呼叫 GPT |
| 2 | **lifebookIntro.{s02,s04,s05～s14}**：宮位題的「導入模板」（含占位符） | 約 13 筆 | 第一段可與星／十神／五行拼接，略做個人化 |
| 3 | 確認 **tenGodPalaces / wuxingPalaces** 已補齊 | 120 + 60 筆（若尚未） | 與 starPalaces 一起當 building blocks |

其餘（輔星×宮位、十神句庫、五行弱項句庫）依你現有 doc 建議補齊即可，組裝時可一併納入顯示或簡短說明區塊。

---

## 五、實作面建議（Worker）

- **新 API 或 mode**：例如 `POST /api/life-book/assemble` 或同一 endpoint 加 `?mode=db_only`。  
  - 輸入：與現有 generate 相同（chart_json、weight_analysis 等）。  
  - 邏輯：依 section_key 與命盤維度從 content 讀取 lifebookSection（及選用 lifebookIntro + starPalaces + tenGodPalaces + wuxingPalaces），組出 22 章的四欄，**不呼叫 OpenAI**。  
- **輸出**：與現有命書 JSON 同格式（section_key、title、importance_level、四欄），方便現有 Viewer 與儲存流程沿用。  
- **fallback**：若某章在 DB 沒有對應 key，可回傳空字串或「本題暫無資料」，或 fallback 回舊的 generate（呼叫 GPT）二擇一。

---

## 六、總結

- **可行性**：可行，且與你「繼續補充資料」的方向一致；差別在於要補的**不只是星/十神/五行**，而是**每章四段正文**（或至少導入模板 + 三段固定文）。  
- **效益**：品質可控、成本與延遲大降、易迭代、易多語系。  
- **你要補充的**：  
  1. **22 章 × 4 欄** 的命書正文（lifebookSection.s00～s21）；  
  2. （可選）約 13 筆宮位題 **導入模板**（lifebookIntro）；  
  3. 確認 tenGodPalaces／wuxingPalaces 已齊，其餘照現有 doc 補。

若你願意，下一步可以訂出 **lifebookSection 的 key 命名與 JSON 格式**（例如與現有 section 標題對照表），再在 Worker 加一版「純組裝」流程，並保留現有 generate 作為 fallback 或 A/B 測試用。
