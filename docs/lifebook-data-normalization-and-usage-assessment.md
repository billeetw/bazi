# 命書／四化／星群 現狀評分與正規化、使用效益建議

**執行紀錄（P0–P2 已完成）**

- **P0**：移除 `STAR_ENERGY_GROUP`，`buildS03GlobalContext` 改為使用 6 群（`calculateStarGroupStats`、`getTopTwoGroups`、`getStarGroupNarrative`、`hasGroup`）；命宮／官祿等單宮判斷改為 `hasGroup(starNames, "動星"|"穩星")`。
- **P1a**：s03 的 `starEnergySummary`／`starClusterBehaviorSummary` 已由 6 群統計與 Top 群敘述產出，behavior/blind/strategic 自然引用同一套。
- **P1b**：新增 `mapRuleIdToRuleType`、`evidenceToRuleTypePlaceholders`；`patternHitRenderer` 優先用 10 ruleType 句庫（`getPhraseSetByRuleType`），無對應時退回 ruleId 句庫。
- **P2**：新增 `canonicalKeys.ts`（`toPalaceCanonical`、`toStarName`）；宮位正規化改為使用 `toPalaceCanonical`；`docs/lifebook/` 新增 `star-personality-map-zh-TW.json`、`phrase-library-rule-types-zh-TW.json` 與 README。

---

## 一、目前狀態評分（滿分 10）

| 維度 | 評分 | 說明 |
|------|------|------|
| **資料完整性** | 7/10 | 20 條規則句庫、10 ruleType 句庫、星曜 3 群＋6 群皆有；10 ruleType 未接入、星群雙軌並存。 |
| **單一事實來源** | 5/10 | 句型有 ruleId 與 ruleType 兩套；星曜有 id 鍵 3 群與 星名鍵 6 群 兩套，未統一。 |
| **正規化程度** | 5/10 | 宮位／星曜 id↔name 多處對照；句庫僅 TS，未與 DB/JSON 對齊；placeholder 命名不盡一致。 |
| **使用效益** | 6/10 | 模組一 structure 已用 6 群＋pattern hits；behavior/blind/strategic 仍用 3 群；10 ruleType 未被使用。 |
| **可維護性** | 6/10 | 邏輯分散在 lifeBookPrompts / lifebook/*；新增規則或星標要改多處。 |
| **整體** | **5.8/10** | 功能到位但資料雙軌、10 ruleType 閒置、星群未統一，正規化後可望提升至 7.5+。 |

---

## 二、資料正規化建議

### 1. 星曜群性：單一來源、一種鍵、一組分類

**現狀**

- `lifeBookPrompts.STAR_ENERGY_GROUP`：star **id**（qiSha, poJun…）→ 3 群（action / wisdom / stable），供 buildS03GlobalContext。
- `starPersonalityMap.STAR_PERSONALITY_MAP`：star **name**（七殺, 破軍…）→ 6 群（動星…情緒星），供 buildStarEnergyRhythmBlock。

**建議**

- **單一星曜群性表**：只保留 6 群（動／智／穩／權／財／情緒），一顆星可多標。
- **鍵統一為星名（中文）**：與 content / 命書文案一致；在統計前用既有 `STAR_ID_TO_NAME` 把 id 轉 name 再查表。
- **實作**：
  - 在 `starPersonalityMap.ts` 保留並視為**唯一**來源；必要時補齊 14 主星＋輔星。
  - 在 `lifeBookPrompts` 移除 `STAR_ENERGY_GROUP`；`buildS03GlobalContext` 改為：先 id→name，再查 `STAR_PERSONALITY_MAP`，只取 動/智/穩 三欄做「動星／智星／穩星」摘要（或直接改用 6 群敘述，見下）。

**效益**：一處改星群定義即可；模組一各段落（structure + behavior + blind + strategic）可全用同一套 6 群。

---

### 2. 四化句型：ruleId ↔ ruleType 二選一或明確分工

**現狀**

- **patternPhraseLibrary.ts**（20 條 by S00RuleId）：被 patternHitRenderer **實際使用**。
- **patternPhraseLibraryRuleTypes.ts**（10 個 ruleType）：已匯出，**無任何呼叫**；沒有 S00RuleId → RuleTypeId 對應。

**建議（二選一）**

- **方案 A：以 10 ruleType 為展示層**  
  - 建立 **S00RuleId → RuleTypeId** 對照（例如 R02→lu_overlap_palace/ji_overlap_palace 依 evidence.transform）。  
  - Renderer 改為：hit 先對應到 ruleType，再從 `getPhraseSetByRuleType(ruleType)` 取 3 message / 3 action / 2 evidence 輪替。  
  - 20 條 ruleId 仍負責「何時命中」，10 類負責「怎麼寫成句子」。

- **方案 B：維持以 20 ruleId 為唯一句庫**  
  - 10 ruleType 當作「產品／運營用分類」或未來多語/AB 用，不參與現有渲染。  
  - 若不再需要，可將 10 ruleType 改為 JSON 匯出給外部使用，程式內只保留 ruleId 句庫。

**效益**：要麼 10 ruleType 真正被用上（口吻更一致、輪替更可控），要麼移除閒置依賴、介面更單純。

---

### 3. 模組一 s03：星曜敘述單一化

**現狀**

- **structure_analysis**：用 6 群（starGroupStatsBlock = buildStarEnergyRhythmBlock）。
- **behavior_pattern / blind_spots / strategic_advice**：仍用 buildS03GlobalContext 的 3 群（starEnergySummary, starClusterBehaviorSummary）。

**建議**

- 模組一內**只採用一套星群敘述**：
  - 要麼 **buildS03GlobalContext** 改為使用 6 群（由 STAR_PERSONALITY_MAP 算出動/智/穩/權/財/情緒），產出 starEnergySummary / starClusterBehaviorSummary 時改寫為「依 6 群 Top 2」的短句；
  - 要麼 s03 的 behavior/blind/strategic 改為直接引用 **starGroupStatsBlock 的結論句**（例如只取「其中 X 比例最高」那一句＋一句 action），避免同一章出現兩套星群說法。

**效益**：讀者不會在同一章看到「動星／智星／穩星」與「action/wisdom/stable」兩套語彙；維護時只需改一處邏輯。

---

### 4. 宮位／星曜 key 與 content 對齊

**現狀**

- 宮位有時用 id（ming, cai）、有時用中文（命宮、財帛）、有時帶「宮」有時不帶；多處有 normPalace / normPalaceForTheme。
- 星曜有 id（ziWei）與 name（紫微）；STAR_ID_TO_NAME、STAR_NAME_ZH_TO_ID 分散在 schema 與各呼叫端。

**建議**

- **約定單一 canonical**：例如「宮位」以中文名＋「宮」為 canonical（命宮、財帛宮…），id 僅在計算與 DB 使用；「星曜」以中文名為 canonical，id 僅在與 schema/API 對接時使用。
- 在 **lifebook** 或 **utils** 提供唯一入口：`toPalaceCanonical(idOrName)`、`toStarName(idOrName)`，其餘模組只呼叫此處，避免各處重寫 norm。

**效益**：過濾「該宮相關 hits」、產出「飛入 X 宮」時不會因 key 不一致漏判或重複。

---

### 5. 句庫與 content 的載體（JSON / DB）

**現狀**

- 句庫全部在 TS 常數；content 有 JSON（lifebookSection-zh-TW.json 等）。

**建議**

- **不必立刻改 DB**：若無多語／後台編輯需求，維持 TS 常數即可，但建議：
  - 將 **10 ruleType 句庫** 與 **星曜群性命書句庫**（6 類 message/action）抽成 **單一 JSON 檔**（例如 `data/lifebook/phrase-library-zh-TW.json`），在 build 或 runtime 載入；TS 只保留型別與 fallback。這樣 Cursor／前端／未來後台可共用的「唯一來源」。
- 若未來要存 DB：可設計 **phrase_library** 表（rule_type_id 或 rule_id, kind: message|action|evidence, index, template），與現有 TS 結構對齊，方便日後遷移。

**效益**：內容與程式分離、方便替換或擴充語系，同時保留型別安全。

---

## 三、使用效益建議

### 1. 讓 10 ruleType 真正參與渲染

- 實作 **S00RuleId → RuleTypeId** 對應（必要時依 evidence 細分，例如 R02 依 祿/忌 選 lu_overlap_palace / ji_overlap_palace）。
- **patternHitRenderer** 改為依 ruleType 取句庫（getPhraseSetByRuleType），placeholder 仍用 hit.evidence 填寫。
- 可保留 20 條 ruleId 句庫當 fallback，或逐步棄用，以 10 類為唯一展示層。

**效益**：口吻更一致、產品可依「10 類」調文案而不動 20 條規則邏輯。

---

### 2. 模組一 s03 全段統一用 6 群

- buildS03GlobalContext 改為使用 **STAR_PERSONALITY_MAP**（id→name 後查表）算出 6 群，再產出 starEnergySummary / starClusterBehaviorSummary（例如「動星最多，次為權星」＋一句 message）。
- 或改 s03 模板：behavior/blind/strategic 改引用「星曜能量節奏」的結論（例如 `{starGroupStatsBlock}` 的摘要句），不再用 starEnergySummary / starClusterBehaviorSummary。

**效益**：模組一整章語彙一致、讀者不困惑；星群邏輯只維護一處。

---

### 3. 宮位章節「本宮四化／全盤關聯」與模組一不重複

- 已實作：模組一出現過的 ruleId 在宮位用短版。可再強化：若某 ruleType 在模組一已出現，宮位只出「本宮也受此結構牽動」＋證據，不再重複同一 ruleType 的長句。

**效益**：全書不囉嗦、每條 hit 在模組一講一次、宮位只做提醒。

---

### 4. 導出「可被 Cursor / 營運使用」的資料清單

- **patternPhraseLibraryRuleTypes**：匯出 JSON（10 ruleType × 3 message / 3 action / 2 evidence）。
- **STAR_PERSONALITY_MAP**：匯出 JSON（星名 → 標籤陣列）。
- **starGroupNarrative**：匯出 6 類 message/action 的 JSON。

可放在 `data/lifebook/` 或 `docs/`，並在 README 註明「命書句型與星群定義由此載入」，方便 Cursor 與未來工具使用。

**效益**：文件與程式共用同一份資料、減少手動同步錯誤。

---

## 四、優先順序建議

| 優先 | 項目 | 預估效益 | 難度 |
|------|------|----------|------|
| P0 | 星曜群性單一來源（6 群、星名鍵）、buildS03GlobalContext 改用它 | 高：消除雙軌、語彙一致 | 中 |
| P1 | 模組一 s03 的 behavior/blind/strategic 改為引用 6 群或 starGroupStatsBlock 摘要 | 高：整章一致 | 低 |
| P1 | S00RuleId → RuleTypeId 對應 ＋ renderer 改用 10 ruleType 句庫 | 高：10 類句庫被使用、口吻統一 | 中 |
| P2 | 宮位／星曜 canonical 單一入口（toPalaceCanonical / toStarName） | 中：少 bug、易維護 | 低 |
| P2 | 句庫／星群匯出 JSON 至 data 或 docs | 中：Cursor 與營運可重用 | 低 |
| P3 | phrase_library / star_personality 表結構設計（若要做 DB） | 中：為未來多語／後台鋪路 | 中 |

---

### 何時做 P3 適合

**P3（DB 表結構：phrase_library / star_personality）** 適合在以下時機再做，不必提前：

- **要做多語命書**：句型與星群標籤需依語系從 DB 載入、或由營運在後台編輯時。
- **要讓非工程編輯句庫／星標**：後台需要 CRUD 句型或星曜群性，單一來源必須從 TS 改為 DB 時。
- **已有明確「從 DB 讀取」需求**：例如 A/B 文案、合規審核流程需存版次時。

在此之前，維持 **TS 為單一來源、JSON 僅作匯出參考** 即可；過早做 P3 容易過度設計。若只為「將來也許多語」而先建表，可先寫一份 **表結構設計 doc**（欄位與現有 TS/JSON 對齊），等真要接 API 再實作。

---

## 五、小結

- **現狀**：功能齊全（規則命中、句型輪替、星群統計、模組一＋宮位注入）但存在**雙軌資料**（星曜 3 群 vs 6 群、ruleId 句庫 vs 未接的 10 ruleType）與**模組一內不一致**（structure 用 6 群、behavior/blind/strategic 用 3 群）。
- **正規化**：星曜單一來源（6 群、星名鍵）、ruleId↔ruleType 明確分工或只留其一、宮位/星曜 canonical 統一、句庫可選 JSON/DB。
- **使用效益**：統一模組一星群敘述、讓 10 ruleType 參與渲染、導出 JSON 供 Cursor/營運用，整體評分可從約 **5.8** 提升到 **7.5+**，並為後續多語與後台管理鋪路。
