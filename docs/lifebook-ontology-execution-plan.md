# 命書「先有世界，再有故事」執行計畫

## 一、計畫分析

### 1.1 底層邏輯（你已定好的順序）

- **世界** = 天（星曜/宮位/四化）＋ 地（五行能量）＋ 人（十神角色）＋ 心（六識/大腦迴路）
- **22 章** = 用不同角度「讀這個世界」，不是 22 種獨立文案
- 因此執行順序必須是：**先定義世界元素 → 再寫元素文案 → 再定組合規則 → 最後才用 22 章當 view**

### 1.2 四階段對應

| 階段 | 內容 | 產出 | 誰寫 |
|------|------|------|------|
| **Phase 1** | 世界常數 & ID 命名 | TypeScript 型別 + enum + 常數表（短句） | Cursor / 你定規格 |
| **Phase 2** | 底層文字庫 v1 | D1/靜態 snippet（星/十神/五行/六識/神經迴路） | **你要補的文案** |
| **Phase 3** | 組合規則 | rules / mapping（維度→心智迴路、高壓 snippet key） | 你定規則，Cursor 實作 |
| **Phase 4** | 22 章骨架 + 5.2 潤飾 | lifebookSection + 組裝器 + 潤飾 API | 你補章節骨架，Cursor 串接 |

「先從地基」= 只做 **Phase 1 + Phase 2 + 一點點 Phase 3**，**不動 Phase 4**。

---

## 二、執行步驟（待辦順序）

### Step 1：定義 ontology 檔（Phase 1）✅ 已完成

- **產出**：`worker/src/lifebook/schema.ts`（及 `lifebook/index.ts`）
- **內容**：
  - `PalaceId` / `PalaceMeta` + `PALACES`
  - `TenGodId` / `TenGodMeta` + `TENGODS`
  - `WuXingId` / `WuXingMeta` + `WUXING`
  - `MainStarId` / `StarMeta` + `STARS`（14 主星）
  - `ConsciousChannelId` / `ConsciousMeta` + `CONSCIOUS_CHANNELS`
  - `NeuralLoopId` / `NeuralLoopMeta` + `NEURAL_LOOPS`
  - 對照表：`PALACE_NAME_ZH_TO_ID`、`TENGOD_NAME_ZH_TO_ID`、`WUXING_NAME_ZH_TO_ID`、`STAR_NAME_ZH_TO_ID`
- **你需配合**：若想改某個 id 或 shortPhrase，直接說「把 xx 改成 yy」。

---

### Step 2：Phase 2 底層文字庫 — 你要補什麼內容給我

以下每一項都是「你要寫的文案／要提供的資料」，交給 Cursor 時可以：  
- 用 Excel/CSV 貼上，或  
- 用「key → 文案」清單（Markdown 或 JSON），或  
- 直接寫進 D1 的 `ui_copy_texts`（key 格式見下），再跟我說「已寫入 D1，key 前綴為 xxx」。

---

#### 2.1 星曜 base 文案（星本質）

| 你要補的內容 | 格式 | 數量 | 狀態 |
|--------------|------|------|------|
| 每顆主星的 **core** 段 | 這顆星代表的 archetype／生存策略／生命感受（80–120 字） | 14 段 | ✅ 14 顆已寫入 `starBaseCore-zh-TW.json`（含紫微 ziWei） |
| 每顆主星的 **shadow** 段 | 失衡狀態（30–80 字） | 14 段 | ✅ 14 顆已寫入 `starBaseShadow-zh-TW.json`（含紫微） |
| 每顆主星的 **mature** 段 | 這顆星修煉成熟後的使用方式 | 14 段 | ✅ 已寫入 `content-zh-TW.json` → `starBaseMature` |

**Key 規則**（與 schema 的 MainStarId 對應）：

- `star.base.{starId}.core`  
  例：`star.base.tanLang.core`、`star.base.ziWei.core`（沿用現有 content.stars 或日後補）
- `star.base.{starId}.mature`  
  例：`star.base.tanLang.mature` — 靜態 JSON 已用 `starBaseMature.{starId}`；D1 可用 `copy_key=star.base.ziWei.mature` 覆寫。

**starId 對照**：ziWei, tianJi, taiYang, wuQu, tianTong, lianZhen, tianFu, taiYin, tanLang, juMen, tianXiang, tianLiang, qiSha, poJun（見 schema.ts 的 STARS）。

---

#### 2.2 星曜 × 宮位小句

| 你要補的內容 | 格式 | 數量 |
|--------------|------|------|
| 每顆主星在每個宮的 **一句話**（25–40 字） | 星落該宮的「行為感／特質」 | 14 × 12 = 168 句 |

**Key 規則**：

- `star.palace.{starId}.{palaceId}`  
  例：`star.palace.tanLang.cai`、`star.palace.ziWei.ming`

**palaceId 對照**：ming, xiongdi, fupo, ziNv, cai, jiE, qianyi, puyi, guanglu, tianzhai, fude, fumu（見 schema.ts 的 PALACES）。

若你已有「紫微_命宮」這種中文 key，可先保留；組裝時用 `PALACE_NAME_ZH_TO_ID`、`STAR_NAME_ZH_TO_ID` 轉成 id 再查，或做一層 key 對照表。

---

#### 2.3 十神 × 宮位 snippet

| 你要補的內容 | 格式 | 數量 | 狀態 |
|--------------|------|------|------|
| 每個十神在每個宮的 **40–60 字** | 在這個宮，這個十神像是什麼「角色」 | 10 × 12 = 120 段 | ✅ **Part 1 已完成**：120 筆寫入 `worker/content/tenGodPalacesById-zh-TW.json`，key = `tenGodId.palaceId`，並接上 `DbContent.tenGodPalacesById` |

**Key 規則**：

- `tengod.palace.{tenGodId}.{palaceId}`  
  例：`tengod.palace.biJian.ming`、`tengod.palace.shangGuan.ziNv`  
  靜態：`tenGodPalacesById-zh-TW.json`；D1 可用同 key 覆寫或補 locale。

**tenGodId 對照**：biJian, jieCai, shiShen, shangGuan, pianCai, zhengCai, qiSha, zhengGuan, pianYin, zhengYin（見 schema.ts 的 TENGODS）。

---

#### 2.4 五行能量 snippet（強／弱）

| 你要補的內容 | 格式 | 數量 | 狀態 |
|--------------|------|------|------|
| 每行 **strong** 段 | 該五行偏強時的行為/體感表現 | 5 段 | ✅ 已寫入 `wuxingEnergy-zh-TW.json`（key：wood.strong / wood.weak 等） |
| 每行 **weak** 段 | 該五行偏弱時容易卡在哪裡 | 5 段 | ✅ 同上 |

**Key 規則**：

- `wuxing.energy.{wuxingId}.strong`  
  例：`wuxing.energy.wood.strong`
- `wuxing.energy.{wuxingId}.weak`  
  例：`wuxing.energy.wood.weak`

**wuxingId**：wood, fire, earth, metal, water。靜態 JSON 使用複合 key：`wood.strong`、`water.weak` 等，已接上 `DbContent.wuxingEnergy`。

---

#### 2.5 心智／六識 × 宮位 mapping（先一版）

| 你要補的內容 | 格式 | 數量 | 狀態 |
|--------------|------|------|------|
| 每個宮對應的 **主六識** | 該宮主要對應哪一個六識（眼耳鼻舌身意）或 20 字內說明 | 12 筆 | ✅ 已寫入 `consciousPalace-zh-TW.json`，key = palaceId（ming, fumu, fude, …），接上 `DbContent.consciousPalace` |

**Key 規則**：

- `conscious.palace.{palaceId}`  
  內容可為：`consciousChannelId`（yanShi / erShi / biShi / sheShi / shenShi / yiShi）  
  或一段 20 字內的說明。

---

#### 2.6 神經迴路 taxonomy（先列出 pattern）

| 你要補的內容 | 格式 | 數量 | 狀態 |
|--------------|------|------|------|
| 每種迴路的 **描述** | 這種迴路的人，遇到壓力時通常怎麼想、怎麼做（約 60–80 字） | 12 段 | ✅ **已完成**：寫入 `worker/content/neuralLoops-zh-TW.json`，並接上 `DbContent.neuralLoops`；schema 已擴為 12 個 loopId。 |

**Key 規則**：

- `neural.loop.{loopId}`  
  例：`neural.loop.approval_loop`、`neural.loop.rumination_loop`  
  靜態：`neuralLoops-zh-TW.json`；D1 可用同 key 覆寫或補 locale。

**loopId 對照**（schema NEURAL_LOOPS）：fight_flight, approval_loop, avoidance_loop, rumination_loop, control_loop, perfection_loop, victim_loop, comparison_loop, catastrophizing, saving_loop, numbing_loop, rationalization。

---

### Step 3：Phase 3 組合規則（一點點 3）✅ 已完成

- **產出**：`worker/src/lifebook/rules.ts`（`RiskRule` 型別 + `RISK_RULES` 14 條）、`worker/content/highPressure-zh-TW.json`（39 筆 hp.* 文案）、`DbContent.highPressure` + D1 key `hp.*`。
- **規則分類**：① 星曜×宮位×化忌 5 條 ② 十神×宮位過旺 5 條 ③ 五行極端 4 條。
- **組裝器**：✅ 已實作 `worker/src/lifebook/assembler.ts` — `assembleRiskProfile(input)` 回傳 `{ loops, highPressureKeys }`；`resolveAssembleSnippets(result, content)` 可依結果從 content 取出對應的 neuralLoops / highPressure 文案供 prompt 或 80% 組裝使用。

---

### Step 4：Phase 4 暫不執行

- 22 章骨架（lifebookSection.s00–s21）、組裝器、GPT-5.2 潤飾，等 Phase 1–3 穩了再上。

---

## 三、你要補什麼內容給我（清單總表）

| 階段 | 項目 | Key 格式 | 筆數 | 你要給的格式建議 |
|------|------|----------|------|------------------|
| Phase 2 | 星曜 base | star.base.{starId}.core / .mature | 28 | key → 一段文案（可 Excel 兩欄） |
| Phase 2 | 星×宮小句 | star.palace.{starId}.{palaceId} | 168 | key → 25–40 字一句 |
| Phase 2 | 十神×宮 | tengod.palace.{tenGodId}.{palaceId} | 120 | key → 40–60 字 |
| Phase 2 | 五行強/弱 | wuxing.energy.{wuxingId}.strong / .weak | 10 ✅ | 已寫入 `wuxingEnergy-zh-TW.json` |
| Phase 2 | 六識×宮 | conscious.palace.{palaceId} | 12 ✅ | 已寫入 `consciousPalace-zh-TW.json` |
| Phase 2 | 神經迴路 | neural.loop.{loopId} | 12 ✅ | key → 描述段（已寫入 neuralLoops-zh-TW.json） |
| Phase 3 | 高壓 snippet | hp.{類別}.{情境}（如 hp.self.authority_anxiety） | 39 ✅ | 已寫入 `highPressure-zh-TW.json`，接上 `DbContent.highPressure` |
| Phase 3 | 規則表 | — | 14 條 ✅ | 已寫入 `worker/src/lifebook/rules.ts`（RISK_RULES：星×宮×化忌 5、十神×宮過旺 5、五行極端 4） |

---

## 四、整體藍圖一句話

- **Phase 1**：世界常數 & ID 命名（schema）→ **已完成，id 與短句已定。**
- **Phase 2**：你要補「元素級」文案（星 base、星×宮、十神×宮、五行、六識×宮、神經迴路）→ **照上表 key 與筆數提供給我或寫入 D1。**
- **Phase 3**：你定「哪些情境掛哪些迴路與 snippet」，Cursor 寫成規則表與組裝邏輯。
- **Phase 4**：再上 22 章骨架與 5.2 潤飾。

接下來你只要依 **Section 三** 的表格，分批補內容（先星曜、再十神×宮、再五行…），每補一批就說「這批 key 已寫入 D1」或貼上 key→文案，我就可以幫你對接 schema、key 命名與後續組裝。
