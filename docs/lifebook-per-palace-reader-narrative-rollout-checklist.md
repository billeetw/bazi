# 逐宮讀者敘事：全量套用與驗收順序

> **名詞**：**逐宮讀者敘事**＝依每個宮位產出的讀者向全文（`PalaceNarrativeBuilder` → `renderPalaceNarrativeSample`）。  
> **≠ 命書章節 `s17`**：`section_key === "s17"` 是獨立的「疊宮分析」章，勿與本管線混稱。

## 現況（已全量）

- Worker 對 **`PALACE_SECTION_KEYS`** 內的宮位章節（s02、s01、s05–s14）已走同一套**逐宮讀者敘事**管線：`NormalizedChart` → `getPalaceSectionReaderOverrides` → `renderPalaceNarrativeSample`（含【星曜結構解析】、精簡核心段、生年四化僅本宮命中項等）。
- **不需再開「宮別開關」**：部署後一命書即含 12 宮區塊；下列順序僅供**人工驗收與修正優先級**，不是上線順序。

## 建議驗收順序（高曝光 → 其餘）

| 順序 | 章節 key | 宮位（canonical） | 備註 |
|-----|----------|-------------------|------|
| 1 | s02 | 命宮 | 語氣與 copy 最完整，當作基準 |
| 2 | s10 | 財帛宮 | 金錢敘事敏感，優先看句庫與主星句 |
| 3 | s08 | 官祿宮 | 工作／成就敘事，同上 |
| 4 | s13 | 夫妻宮 | 關係敘事，注意用詞與現象星 |
| 5 | s09 | 田宅宮 | 已有較多田宅專用 copy，對照是否需微調 |
| 6 | s11 | 疾厄宮 | 健康相關避免過度斷語，檢查現象句 |
| 7 | s12 | 遷移宮 | 對外／異地語境 |
| 8 | s01 | 福德宮 | 內在／精神語境 |
| 9 | s05 | 父母宮 | 原生家庭語境 |
| 10 | s06 | 兄弟宮 | 同儕／手足語境 |
| 11 | s07 | 僕役宮 | 團隊／下屬語境 |
| 12 | s14 | 子女宮 | 子女／創造語境 |

## 每宮快速檢查表（複製到新列）

對照該章 HTML 的 **structure_analysis**（讀者版整段）：

- [ ] **主定調星**：主星有無 `（廟／旺…）`（若有 iztro 亮度）；無亮度時是否僅「代表…」無硬補亮度句
- [ ] **主星收束**：單主星／雙主星／三主星以上文案是否正確（無「兩顆」誤用）
- [ ] **其他星曜**：是否為「輔＋雜」合併列表；每顆有解釋才出現；**無**底下整段重複總結
- [ ] **本命四化**：僅在有生年化星坐本宮時出現整段；**不要**出現宮干飛入冒充生年
- [ ] **語氣**：與該宮主題无明显違和（可記下要改 `palaceNarrativeCopy` 或句庫的句子）

## 發現問題時怎麼改（優先級）

1. **某星沒解釋** → `palaceMiscPhenomena.ts` 短句／`MINOR_STAR_LINE`／`starSemanticDictionary.ts`
2. **宮位語氣不對** → `palaceNarrativeCopy.ts`（該宮若尚無條目，可仿命宮／田宅新增一組）
3. **亮度仍缺** → 查 `chart_json.ziwei.palaces` 是否帶 `brightness`；合併邏輯在 `mergeZiweiBrightnessIntoPalaceRaw`
4. **雜曜有 iztro、命書沒列** → `getStarByPalaceFromChart` 已會把 `ziwei.palaces[].adjectiveStars` **與** `starByPalace` **聯集**（見 `normalizePalaces.mergeStarNamesFromZiweiPalaces`）。若仍缺：該星可能不在本命盤 `palaces`（例如僅流年／神煞另表），需在 `chart_json` 補欄位或另開管線。

## 下一步

依上表從 **s02 → s10 → s08 → s13** 各用 1～2 張真盤跑「一鍵生成」，把問題記成一列（章節 key + 截圖／原文片段 + 期望），再批次改句庫或 copy。

**內容策略（無 LLM 渲染、成本可控、可補齊）**：見 **[逐宮讀者敘事：確定性內容框架](./lifebook-reader-narrative-deterministic-content-framework.md)**（三層模型、規模停損、填表模板、與程式模組對照）。
