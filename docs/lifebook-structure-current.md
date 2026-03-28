# 命書結構（現狀）

供你調整用。修改後告訴我要改哪些檔案與內容即可。

---

## 1. 章節順序（SECTION_ORDER）

共 **23 章**，順序固定，以下為陣列順序：

```
s00 → s03 → s02 → s10 → s01 → s05 → s06 → s07 → s08 → s04 → s09 → s11 → s12 → s13 → s14 → s15 → s15a → s16 → s17 → s18 → s19 → s20 → s21
```

**s15a**：各宮位小限年份與疊宮引爆分析（大限章節之後新增）。

**定義位置：**
- Worker：`worker/src/lifeBookTemplates.ts` → `SECTION_ORDER`
- 前端 viewer：`src/lifebook-viewer/constants.ts` → `SECTION_ORDER`
- 前端 lifeBookEngine：`js/calc/lifeBookEngine.js` → `SECTION_ORDER`（陣列字面量）

---

## 2. 每章定義（SECTION_TEMPLATES）

每章一筆，欄位如下：

| 欄位 | 說明 |
|------|------|
| **section_key** | 章節 ID（s00～s21） |
| **index** | 題號 0～21 |
| **title** | 章節標題（顯示用） |
| **description** | 一欄任務描述，供 prompt【任務】使用 |
| **slice_types** | 命盤資料切片：`ziwei` \| `bazi` \| `overlap` \| `sihua` \| `wuxing` |
| **palace_focus** | 該章對應宮位（可多個），用於取星曜、亮度（廟旺利陷）、四化、三方四正；無則不綁宮位（宮位不再使用十神／五行／心識） |
| **needs_wuxing_weak** | 是否需五行弱項建議（true 時會注入五行弱句） |
| **importance_level** | 預設權重：`high` \| `medium` \| `low`（可被 weight_analysis 覆寫） |

**定義位置：** `worker/src/lifeBookTemplates.ts` → `SECTION_TEMPLATES`

### 現有 22 章一覽

| index | section_key | title | palace_focus | slice_types | importance_level |
|-------|-------------|-------|--------------|-------------|------------------|
| 0 | s00 | 這一局，你為什麼要來？（靈魂行前簡報） | — | ziwei, overlap, wuxing, fourTransform | high |
| 1 | s03 | 你的命盤結構（主線劇本 × 星曜群性 × 四化慣性） | — | ziwei, sihua | — |
| 2 | s02 | 你是帶著什麼狀態上場？（命宮） | 命宮 | ziwei, overlap, sihua | — |
| 3 | s10 | 賺錢方式與財務節奏（財帛宮） | 財帛 | ziwei, overlap, sihua | high |
| 4 | s01 | 你的心靈休息站（福德宮） | 福德 | ziwei, overlap | — |
| 5 | s05 | 學習看自己的鏡子（父母宮） | 父母 | ziwei, overlap, sihua | — |
| 6 | s06 | 互相成就課題（兄弟宮） | 兄弟 | ziwei, overlap, sihua | — |
| 7 | s07 | 服務他人、團隊默契（僕役宮） | 僕役 | ziwei, overlap, sihua | — |
| 8 | s08 | 事業、成就、工作舞台（官祿宮） | 官祿 | ziwei, overlap, sihua | high |
| 9 | s04 | 你為這具身體準備了什麼？（命主・身主・身宮） | 命宮, 福德 | ziwei, overlap, sihua | — |
| 10 | s09 | 生活根基與安全基地（田宅宮） | 田宅 | ziwei, overlap, sihua | — |
| 11 | s11 | 健康與壓力出口（疾厄宮） | 疾厄 | ziwei, overlap, wuxing | — |
| 12 | s12 | 對外舞台與社會運勢（遷移宮） | 遷移 | ziwei, overlap, sihua | — |
| 13 | s13 | 重要調整區（夫妻宮） | 夫妻 | ziwei, overlap, sihua | — |
| 14 | s14 | 紅燈高壓區（子女宮） | 子女 | ziwei, overlap, sihua | — |
| 15 | s15 | 你的一生章節（十年大限總覽） | — | ziwei, overlap, sihua | high |
| 16 | s15a | 各宮位小限年份與疊宮引爆分析 | — | ziwei, overlap, sihua | — |
| 17 | s16 | 今年的主線任務與心理濾鏡（流年・小限） | — | ziwei, overlap, sihua | high |
| 18 | s17 | 此生核心功課（靈魂使命） | — | ziwei, overlap, wuxing | — |
| 19 | s18 | 未完成的必修課（業力議題） | — | ziwei, overlap, sihua | — |
| 20 | s19 | 三條立刻可做・三條長期累積・三條避開折損 | — | ziwei, overlap, wuxing, sihua | — |
| 21 | s20 | 三盤疊加診斷（流年 × 大限 × 本命） | — | ziwei, overlap, wuxing, sihua | high |
| 22 | s21 | 你往何處去（靈魂總結） | — | ziwei, overlap | high |

**needs_wuxing_weak: true** 的章節：s03、s11。

---

## 3. 每章輸出欄位（四欄）

每章 API 回傳 / 骨架替換後產出 **4 個欄位**，key 固定：

| 欄位 key | 說明 |
|----------|------|
| **structure_analysis** | 結構分析（星曜、亮度廟旺利陷、四化、三方四正、迴路等底層說明；宮位不包含十神／五行／心識） |
| **behavior_pattern** | 行為模式 |
| **blind_spots** | 盲點 |
| **strategic_advice** | 策略建議 |

骨架模板（含 `{placeholder}`）定義在：  
**`worker/content/lifebookSection-zh-TW.json`**  
→ 以 `section_key` 為 key，每個 section 一組上述四欄。

---

## 4. 前端章節分組（可選調整）

Viewer 導航用：

**MODULE_MAP**（`src/lifebook-viewer/constants.ts`）：

| 模組標題 | section_key 列表 |
|----------|------------------|
| 開場 | s00 |
| 模組一：核心作業系統 | s03, s02, s10, s01 |
| 人生十二課題 | s05, s06, s07, s08, s04, s09, s11, s12, s13, s14 |
| 模組二：時間主線與功課 | s15, s15a, s16, s17, s18, s19, s20 |
| 收束 | s21 |

**SECTION_GROUPS**（同檔案）：

- CORE（生命核心）：s00, s03, s02, s01  
- STAGE（外部舞台）：s08, s10, s12, s09  
- RELATIONSHIP（關係連結）：s06, s13, s14, s07, s05  
- HIDDEN（隱形壓力）：s11, s04, s05  
- TIME_AND_CLOSING（時間與收束）：s15, s15a, s16, s17, s18, s19, s20, s21  

**SECTION_PALACE_MAP**（section_key → 主宮位，用於從 chart_json 取十神／五行）：

- 有宮位：s01→福德, s02→命宮, s04→命宮, s05→父母, s06→兄弟, s07→僕役, s08→官祿, s09→田宅, s10→財帛, s11→疾厄, s12→遷移, s13→夫妻, s14→子女  
- 無宮位（null）：s00, s03, s15, s15a, s16, s17, s18, s19, s20, s21  

---

## 5. 命主・身主・身宮與主星×12 宮內容（專家系統資料庫）

以下內容用於命書 s04 與宮位解析，**zh-TW 靜態**來自獨立 JSON，並在 `getContentForLocale` 時併入 content。

| 用途 | 來源 | key 說明 |
|------|------|----------|
| 命主靈魂解碼 | `worker/content/lifeLord-bodyLord-zh-TW.json` → `lifeLordDecode` | 星名 → 文案（依命宮地支對應之命主星） |
| 身主工具箱解碼 | 同上 → `bodyLordDecode` | 星名 → 文案（依生年地支對應之身主星） |
| 身宮依時辰 | 同上 → `bodyPalaceByHour` | 時辰組（子午、卯酉…）→ `{ palace, tagline, interpretation }` |
| 命身關係斷語 | `worker/content/lifeBodyRelation-zh-TW.json` → `lifeBodyRelation` | `lifeBodySamePalace` / `lifeBodyPivot` / `lifeLordBodyLordDialogue`（各含 tagline, interpretation, strategy_tone） |
| 14 主星底層邏輯 | `worker/content/starPalacesMain-zh-TW.json` → `starLogicMain` | 星名 → 一句話 |
| 14 主星×12 宮顧問口吻 | 同上 → `starPalacesMain` | 「星名_宮名」→ 戰略解析（命書組裝時**優先**於 `starPalaces`） |

**邏輯**：命主/身主在 prompt 中使用的說明文字，優先從 `lifeLordDecode`/`bodyLordDecode` 依星名取出；若無則 fallback `content.stars`。宮位內星曜的「在宮表現」優先從 `starPalacesMain` 取出，若無則用 `starPalaces`。

**身宮與命身關係**：Worker 依 `chart_json` 的生時（優先 `birthInfo.hour`、`ziwei.basic.hour`、`bazi.hour`）換算時辰組，查 `bodyPalaceByHour` 得到身宮解讀；並依命宮是否與身宮同宮選用 `lifeBodyRelation.lifeBodySamePalace` 或 `lifeBodyPivot`，若有命主+身主則加上 `lifeLordBodyLordDialogue`。上述片段在 **s04** 會注入 infer 與 generate-section/generate 的注意事項，供模型融入「你為這具身體準備了什麼？」章節。

---

## 5b. 輔星／煞星／雜曜 × 宮位（解釋 + 行動建議）

主星定「格」、輔星定「變」。輔星／煞星／雜曜提供**資源取得方式／風險行為**（解釋）與**可執行方針**（行動建議），供戰略建議欄位使用。

| 用途 | content key | key 格式 | value |
|------|-------------|----------|--------|
| 解釋（戰略解析） | `starPalacesAux` | `星名_宮名`（如 `文昌_財帛`、`地劫_財帛`） | 一段話：該星在該宮的「資源取得方式」或「風險具體行為」 |
| 行動建議 | `starPalacesAuxAction` | 同上 | 一段話：具體可執行方針（例：停止槓桿投資、現金轉實體資產） |
| 風險等級 | `starPalacesAuxRisk` | 同上 | 數字 1～5（1=低，5=高）；等級 4～5 時 AI 採保守防禦語氣、主動提醒避險 |

- **宮名**與現有一致：`命宮`、`兄弟`、`夫妻`、`子女`、`財帛`、`疾厄`、`遷移`、`僕役`、`官祿`、`田宅`、`福德`、`父母`（無「宮」尾也可，程式會對照 `星名_宮名` 與 `星名_宮`）。
- 命盤會依「該宮有哪些星」（含 minorStars、adjectiveStars）組出 usedKeys，只會載入有出現的 key，不會送整張表進 prompt。
- **靜態**：可新增 `worker/content/starPalacesAux-zh-TW.json`，格式為 `{ "starPalacesAux": { "文昌_財帛": "…", … }, "starPalacesAuxAction": { "文昌_財帛": "…", … } }`，並在 index 合併進 zh-TW content。
- **D1**：copy_key 為 `starPalaceAux.文昌_財帛`、`starPalaceAuxAction.文昌_財帛`、`starPalaceAuxRisk.文昌_命宮`（風險為數字 1～5），content 為對應字串或數字。
- **Composite Key**：Palace_Type（宮位）與 Star_ID（星曜）組成 key = `星名_宮名`。
- **連動／語氣指引**（AI 依宮位+星曜自動調整）：
  - 命宮有地劫 → 保守防禦語氣。
  - 夫妻宮有鈴星 → 分析感情時主動提醒避免冷暴力與隱形記恨。
  - **財帛宮 (wealth) + 地劫 (di_jie)** → 戰略清單中置頂「止損指令」。
  - **財帛宮 祿存 + 地劫** → 斷語：「妳雖然有存錢的本領，但身邊總有黑洞在吸妳的血。戰略：只進不出，且要把錢藏到誰都動不了的地方。」
  - **疾厄宮** → 解釋採「預防醫學」語氣，非單純恐嚇。
  - **官祿宮 (career) + 擎羊 (qing_yang)** → 職場建議強化「競爭策略與情緒控制」。
  - **官祿宮 天馬 (tian_ma)** → 職涯建議加入「移動與變動才是妳的生路」。
  - **交友宮／僕役 + 地劫** → 所有社交建議中必須加入「財務隔離警告」。
  - **僕役 蜚廉 (fei_lian) 或 鈴星** → 社交建議中置頂「防小人機制」。
- **雜曜 Modifier**：Small_Star_Logic 與主星產生修正效果。例：夫妻宮有 紫微（主星）+ 擎羊（煞星）→「妳的另一半是個霸氣的皇帝，但帶刀而來，妳們的互動是一場權力與忍耐的博弈。」
- **高風險警示**：`risk_level > 3` 時觸發 AI「高風險警示模組」。
- **資料完整度**：12 宮之輔星、煞星、雜曜（含 祿存、天馬、天刑、紅鸞、天喜、孤辰、寡宿、破碎、蜚廉、大耗、龍池、鳳閣）已全數入庫；每筆符合 星曜名稱、戰術解析、行動建議、風險等級 四欄。

---

## 6. 會用到「命書結構」的檔案一覽

| 用途 | 檔案 |
|------|------|
| 章節順序 + 每章 meta（title, description, slice_types, palace_focus） | `worker/src/lifeBookTemplates.ts` |
| 每章四欄骨架文案（含 placeholder） | `worker/content/lifebookSection-zh-TW.json` |
| Viewer 章節順序 + 模組分組 + 宮位對照 | `src/lifebook-viewer/constants.ts` |
| 前端命書引擎（順序 + 標題 + 宮位） | `js/calc/lifeBookEngine.js`（SECTION_ORDER, SECTION_CONFIG） |
| 組裝命書文件（SECTION_ORDER） | `src/lifebook-viewer/utils/lifebook-assembler.ts` |
| Infer 章節列表 | `worker/src/lifeBookInfer.ts`（SECTION_ORDER, SECTION_TEMPLATES） |

---

## 7. 可用的 placeholder（骨架內）

以下為現有系統會代入的 key，僅可**使用**，不可新增：

- **星曜／宮位**：`{palaceAllStarsSnippet}`, `{palaceStarStructureSnippet}`, `{palace}`  
- **三方四正**：`{sanfangSizheng}`（本宮＋三合兩宮＋對宮，頓號分隔）  
- **十神**：`{tenGod}`, `{tenGodBehavior}`；**十神整段（有則顯示、無則不顯示）**：`{tenGodBlock}`  
- **五行**：`{wuxingEnergyLabel}`, `{wuxingEnergyShadow}`  
- **心識**：`{sixSense}`  
- **迴路／高壓**：`{loopSnippet}`, `{hpSnippet}`, `{loopSnippets}`, `{highPressureSnippets}`  
- **流年・小限**：`{flowYear}`, `{xiaoXianPalaceName}`  
- **十年大限（s15）**：`{decadalLimitsList}`（所有大限及宮位、大限四化列表）  
- **小限與疊宮（s15a）**：`{xiaoXianYearTable}`（各宮小限年份表，同 minorFortuneTable）、`{xiaoXianShockCount}` / `{xiaoXianMineCount}` / `{xiaoXianWealthCount}`（統計個數）；詳細疊宮區塊：`{xiaoXianShockBlocks}`、`{xiaoXianMineBlocks}`、`{xiaoXianWealthBlocks}`（每宮可含結構／感受／建議三小段）。格式見 `docs/lifebook-overlap-analysis-format.md`。  
- **四化高階（s00／s03／12 宮）**：`{benMingSiHuaList}`, `{daXianSiHuaList}`, `{liuNianSiHuaList}`（「星名化祿、星名化權…」列表）；`{benMingLuStars}`, `{benMingJiStars}`, `{daXianLuStars}`, `{daXianJiStars}`, `{liuNianLuStars}`, `{liuNianJiStars}`（祿／忌星名）；`{sihuaGlobalSummary}`（全盤四化總結，s03 用）；`{sihuaFlowForPalace}`（本宮四化流向摘要，12 宮用）；`{palaceStarDetailBlock}`（同 palacePureStarsBlock，星曜詳解區塊）。  
- **s03 主線劇本**：`{mingQuadSummary}`, `{caiQuadSummary}`, `{guanQuadSummary}`, `{qianQuadSummary}`（命／財／官／遷四宮一句摘要）；`{starClusterBehaviorSummary}`（星曜群性切換節奏描述）。

---

## 7b. 四化高階：`buildSiHuaLayers`／`buildSiHuaContext`（單一權威）

**顯示層四化**由 **`buildSiHuaLayers(chartJson)`** 產出（`normalizeChart` 落宮 + `fourTransformations.mutagenStars`）；**不讀** `chart_json.sihuaLayers` wire（已 deprecated，僅供與 worker diff／除錯，見 `docs/lifebook-sihua-single-source-phase1.md`）。實驗覆寫用 **`lifebookSiHuaDisplayOverride`** + audit。

舊 **sihuaLayers** wire 若仍存在於請求，形狀可參考歷史文件（`benMing`／`daXianCurrent`／`liuNianCurrent` 等 `transforms[]`）；**請勿再依賴其驅動正文**。

**buildSiHuaContext(chartJson)**（`lifeBookPrompts.ts`）回傳：本命／大限／流年列表與祿忌星名、`perPalaceFlow`（每宮一段四化流向摘要）、`sihuaGlobalSummary`。技術版命書不再附「四化來源」演算法備註，避免使用者看到內部說明。

---

## 7c. 補強與可選優化（四化高階實作後）

**已做：**
- 文件表格 s00／s03 標題與 slice_types 與程式一致；s03 為「命盤結構（主線劇本×星曜群性×四化慣性）」。
- s00 的 placeholder 只填 `flowYear.startAge/endAge/year`，不再重複填舊的 `benmingFourTransformBlocks` 等（s00 骨架已改用 buildSiHuaContext 的 key），減少冗餘。

**可選優化：**
- **buildSiHuaContext 快取**：整本命書生成時每個 section 都會呼叫一次 `buildSiHuaContext(chartJson)`，若同一請求內 chartJson 不變，可在上層算一次 sihuaContext 再傳入，或於 Worker 內用 request-scoped 快取，避免重複計算。
- **perPalaceFlow 長度**：依 `buildSihuaFlowSummary`／findings 時，整段壓成一段可能較長；若希望每宮摘要固定簡短，可對該段做字數上限或只取前幾句。
- **覆寫顯示**：請用 **`lifebookSiHuaDisplayOverride`**，勿再送舊 `sihuaLayers` wire 當權威。

---

你調整時可以：
- **改順序**：改 `SECTION_ORDER`（需同步 Worker + Viewer + lifeBookEngine）。
- **改章節 meta**：改 `SECTION_TEMPLATES`（title, description, palace_focus, slice_types 等）。
- **增／刪章**：改 `SECTION_ORDER`、`SECTION_TEMPLATES`，並在 `lifebookSection-zh-TW.json` 增／刪對應 section_key；Viewer / lifeBookEngine 若有寫死 22 章或 section 列表也要一併改。
- **改四欄名稱或增減欄位**：需改 JSON 的 key 與 Worker/前端產出與顯示的結構（影響較大，通常不建議）。

告訴我你要的「新順序 / 新章節 / 新標題 / 新分組」等，我可以依此給出對應的修改清單與 patch。
