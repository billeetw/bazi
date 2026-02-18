# User-Facing Content Extract

Extracted for brand communication audit. Grouped by module.

---

## i18n (data/i18n/zh-TW.json, zh-CN.json, en.json)

All keys in `data/i18n/*.json` are user-facing. Full values in JSON files.

### meta
| Key | zh-TW | en |
|-----|-------|-----|
| title | 人生說明書｜一起出來玩 | Life Manual \| 17 Gon Play |
| description | 人生說明書：結合八字五行、紫微斗數與 2026 流月紅綠燈的個人戰略指揮中心… | Life Manual is your personal strategy command center… |

### brand
| Key | zh-TW | en |
|-----|-------|-----|
| navFull | 一起出來玩｜人生說明書 | 17 Gon Play \| Life Manual |
| navShort | 人生說明書 | Life Manual |
| footerBrand | 一起出來玩 | 17 Gon Play |
| footerHandle | 17gonplay | 17gonplay |
| tagline | (empty) | Ancient Structure. Modern Strategy. |

### home
| Key | zh-TW | en |
|-----|-------|-----|
| heroHeadline | 命運座標輸入 | A Strategic Map for Real Life. |
| heroSubheadline | 輸入你的出生資訊，開啟專屬的人生使用說明書 | Built on Ziwei and Bazi. Designed as a modern decision system. |
| heroPrimaryCta | 開啟 人生使用說明書 | Open My Life Manual |
| helperUnsureTime | 不確定出生時間？ | Not sure of your birth time? |
| helperEstimateBtn | 點我推算時辰 | Estimate my Shichen |
| saveChart | 儲存到我的命盤 | Save to My Charts |
| feature1Title | 解讀你的結構 | Decode Your Structure |
| feature1Body | 了解命宮與五行平衡如何形塑你的決策。 | Understand how your Life Palace and Five-Phase balance shape your decisions. |
| feature2Title | 掌握你的節奏 | Track Your Timing |
| feature2Body | 大限、小限、流月訊號。 | Major cycles. Minor limits. Monthly flow signals. |
| feature3Title | 定位你的行動 | Position Your Moves |
| feature3Body | 順勢推進。必要時守成。 | Push when aligned. Hold when necessary. |

### ziwei (sample)
| Key | zh-TW | en |
|-----|-------|-----|
| boardTitle | 紫微12宮・作戰版方盤 | Ziwei 12 Palaces · Tactical Board |
| strategyPanelTitle | 2026 {{name}} · 作戰面板 | 2026 {{name}} · Strategy Panel |
| palaceStrengthTitle | 宮位強度 | Palace Strength |
| palaceStrengthDesc.命宮 | 你的核心作業系統 | Your core operating system |
| (12 palaces) | … | … |
| fivePhaseRatioTitle | 紫微五行比例 | Ziwei Five-Phase Ratio |
| phaseProfileLabel | 本局屬性： | Core Attribute: |
| bestStrategyLabel | 戰略亮點： | Best Strategy: |
| systemRiskLabel | 系統風險： | System Risk: |
| thisYearAdviceLabel | 今年： | This Year: |
| subjectiveFocusHint | 此領域為你本年度的生命重心，波動感將會特別強烈。 | Primary structural focus this year. Higher variance expected. |

### ui (sample)
| Key | zh-TW | en |
|-----|-------|-----|
| submit | 送出 | Submit |
| loading | 載入中… | Loading… |
| calculate | 計算 | Calculate |
| statusExcellent | 極佳 | Peak Alignment |
| statusStrong | 強勁 | High Momentum |
| statusStable | 平穩 | Stable Flow |
| statusSteady | 穩健 | Steady Flow |
| statusBase | 基礎 | Foundational |
| loadError | 系統載入失敗，請刷新頁面重試 | Load failed. Please refresh the page. |

### bazi, flow, strategic, consult, strategy, chartLangMismatch, wuxing, estimateHour, ceremony
Full key-value pairs in `data/i18n/zh-TW.json`, `data/i18n/zh-CN.json`, `data/i18n/en.json`.

**File paths**: `data/i18n/zh-TW.json`, `data/i18n/zh-CN.json`, `data/i18n/en.json`

---

## constants.js — Palace & One-Liners

| Original Chinese | Original English | File | Line |
|------------------|------------------|------|------|
| 你的核心作業系統 | Your core operating system | js/calc/constants.js | 61 |
| 你的戰友與近親資源 | Your allies and kinship resources | js/calc/constants.js | 62 |
| 你的親密連結與合夥狀態 | Your intimacy and partnership dynamics | js/calc/constants.js | 63 |
| 你的產出效能與創造力 | Your output and creative performance | js/calc/constants.js | 64 |
| 你的金錢獲取與理財邏輯 | Your wealth flow and money logic | js/calc/constants.js | 65 |
| 你的生理硬體與身心基石 | Your physical foundation and health base | js/calc/constants.js | 66 |
| 你的外部接口與外界觀感 | Your external interface and social image | js/calc/constants.js | 67 |
| 你的社交網絡與眾生緣分 | Your network and resource flow | js/calc/constants.js | 68 |
| 你的事業軌道與執行強度 | Your career momentum and execution drive | js/calc/constants.js | 69 |
| 你的資產根基與穩定堡壘 | Your asset foundation and stability | js/calc/constants.js | 70 |
| 你的精神底蘊與內心平衡 | Your mental resilience and inner balance | js/calc/constants.js | 71 |
| 你的規則約束與權威互動 | Your rules and authority dynamics | js/calc/constants.js | 72 |

---

## constants.js — Energy Labels

| Original Chinese | Original English | File | Line |
|------------------|------------------|------|------|
| 低頻 | Low | js/calc/constants.js | 401 |
| 平穩 | Stable | js/calc/constants.js | 402 |
| 強健 | Strong | js/calc/constants.js | 403 |
| 過旺 | Overactive | js/calc/constants.js | 404 |

---

## constants.js — Five-Element Core Meaning (Surface & Strategic)

**Surface (外在)** — core, low01, level2, level3, remedy per element (木火土金水)

| Key | Original Chinese | Original English |
|-----|------------------|------------------|
| 木 core | 外在成長模組 | Outer Growth Module |
| 木 low01 | 較為內斂、不願主動連結 | More reserved; less willing to initiate connections |
| 木 level2 | 積極主動、願意擴展社交圈 | Proactive; willing to expand your social circle |
| 木 level3 | 過度擴張、無法聚焦 | Over-expanding; struggling to focus |
| 火 core | 外在亮度模組 | Outer Visibility Module |
| 土 core | 外在穩定模組 | Outer Stability Module |
| 金 core | 外在界線模組 | Outer Boundaries Module |
| 水 core | 外在溝通模組 | Outer Communication Module |
| (Strategic) 木 core | 策略模組 | Strategy Module |
| (Strategic) 火 core | 推進力模組 | Momentum Module |
| (Strategic) 土 core | 耐力模組 | Endurance Module |
| (Strategic) 金 core | 決斷力模組 | Decisiveness Module |
| (Strategic) 水 core | 洞察模組 | Insight Module |

**File**: `js/calc/constants.js` — ELEMENT_CORE_MEANING_SURFACE, ELEMENT_CORE_MEANING_STRATEGIC, *_EN variants (lines 411–553)

---

## constants.js — Generation & Overcoming Post Style

**GENERATION_POST_STYLE** (相生): 木->火, 火->土, 土->金, 金->水, 水->木 — headline + text

| Link | Chinese headline | Chinese text (excerpt) |
|------|------------------|------------------------|
| 木->火 | 策略引燃市場 | 你的執行力（木）正精準轉化為市場名聲（火）… |
| 火->土 | 流量沉澱資產 | 目前的高關注度（火）應迅速轉化為品牌信用與基礎建設（土）… |
| 土->金 | 資源轉化效率 | 厚實的根基（土）是為了萃取更高效率的 SOP 與規則（金）… |
| 金->水 | 決斷催生智慧 | 你的紀律與邊界（金）正在為深度的思考與策略（水）… |
| 水->木 | 智謀驅動執行 | 充沛的智慧（水）正高效轉化為具體的執行管道（木）… |

**OVERCOMING_POST_STYLE** (相剋): 木->土, 土->水, 水->火, 火->金, 金->木 — headline + text

| Link | Chinese headline | Chinese text (excerpt) |
|------|------------------|------------------------|
| 木->土 | 擴張動搖根基 | 過度的擴張慾望（木）正在損害你的信用與穩定性（土）… |
| 土->水 | 體制限制創意 | 僵化的制度或過度追求穩健（土），正在扼殺你原本靈活的智慧流動（水）… |
| 水->火 | 理性壓制熱情 | 絕對的冷靜理性（水）雖然能避險，但也可能讓你的事業缺乏感性紅利（火）… |
| 火->金 | 情緒破壞規則 | 突發的情緒衝動或追求曝光（火），正在挑戰你辛苦建立的決斷邊界（金）… |
| 金->木 | 規則扼殺執行 | 嚴苛的管理與自我設限（金），正在剪除你應有的執行活力與成長空間（木）… |

**File**: `js/calc/constants.js` — ELEMENT_CORE_MEANING_SURFACE, ELEMENT_CORE_MEANING_STRATEGIC, GENERATION_POST_STYLE, OVERCOMING_POST_STYLE, *_EN variants (lines 438–608)

---

## constants.js — PoYen Conversion, Risk, Push

**POYEN_CONVERSION_ONE** (最優路徑): 木->火, 火->土, 土->金, 金->水, 水->木  
**POYEN_RISK_ONE** (系統風險): 木->土, 土->水, 水->火, 火->金, 金->木  
**POYEN_PUSH** (助推建議): 木, 火, 土, 金, 水 — per-element remedy text

**File**: `js/calc/constants.js` — lines 465–524, 555–595

---

## constants.js — Element Type & Strategic Advice

| Original Chinese | Original English | File | Line |
|------------------|------------------|------|------|
| 執行型 | Execution-Type | js/calc/constants.js | 459, 537 |
| 傳播型 | Amplification-Type | js/calc/constants.js | 459, 537 |
| 整合型 | Integration-Type | js/calc/constants.js | 459, 537 |
| 決斷型 | Decision-Type | js/calc/constants.js | 459, 537 |
| 流動型 | Flow-Type | js/calc/constants.js | 459, 537 |
| 均衡型 | Balanced-Type | js/calc/constants.js | 537 |

**STRATEGIC_ADVICE_BY_STARS** (level 1–5):

| Level | Chinese | English |
|-------|---------|---------|
| 5 | 全速推進。能量通道完全開啟，適合執行高槓桿計畫，把握優勢時機。 | Strategic Window Open. Conditions support high-leverage execution. Move decisively while structural support is strong. |
| 4 | 穩健擴張。系統運轉順暢，可適度增加資源投入與執行強度，持續優化流程。 | Expansion Supported. System flow is smooth. Increase resource allocation gradually and optimize process depth. |
| 3 | 維持節奏。當前狀態平穩，建議保持現有策略，在穩定中尋找微調機會。 | Maintain Rhythm. Stability is present. Refine rather than expand. |
| 2 | 聚焦優化。系統運作正常，建議優先處理核心任務，逐步建立更穩健的運作模式。 | Focus Optimization. System operates normally. Prioritize core tasks and build steadier operational patterns. |
| 1 | 穩步調整。系統基礎穩固，建議從關鍵環節開始優化，為後續發展打好基礎。 | Structural Consolidation Phase. Strengthen core mechanics before scaling. Focus on critical nodes first. |

**File**: `js/calc/constants.js` — lines 459, 537, 681–696

---

## helpers.js — Five-Element Diagnosis & Labels

| Original Chinese | Original English | File | Line |
|------------------|------------------|------|------|
| 五行偏均衡：以${s}帶動，${w}需補位。 | Balanced distribution: let ${s} lead while reinforcing ${w}. | js/calc/helpers.js | 480 |
| 能量兩極：${s}過度主導，${w}成瓶頸。 | Polarized energy: ${s} over-dominates; ${w} becomes the bottleneck. | js/calc/helpers.js | 480 |
| 存在過旺：${s}主導節奏，注意失衡代價。 | Overactive signal: ${s} drives the rhythm—watch the cost of imbalance. | js/calc/helpers.js | 480 |
| 明顯短板：${w}偏弱，易拖慢推進。 | Clear weakness: ${w} is underpowered and may slow momentum. | js/calc/helpers.js | 480 |
| 分布不均：${s}偏強、${w}偏弱，先補短板再放大。 | Uneven distribution: ${s} strong, ${w} weak—patch the weak spot before scaling. | js/calc/helpers.js | 480 |
| 五行狀態： | Five-Phase Status: | js/calc/helpers.js | 509 |
| 能量路徑（以最強為起點）： | Energy Path (starting from the strongest): | js/calc/helpers.js | 510 |
| 相生亮點： | Generation Highlights: | js/calc/helpers.js | 511 |
| 深度路徑警訊： | Deep-path Warnings: | js/calc/helpers.js | 532 |
| 制衡提醒： | Balancing Reminder: | js/calc/helpers.js | 533 |
| 短板 | Weak spot | js/calc/helpers.js | 540 |
| 缺 | Lacking | js/calc/helpers.js | 541 |
| 強弱 | Strong–Weak | js/calc/helpers.js | 519 |
| 弱強 | Weak–Strong | js/calc/helpers.js | 520 |

**relationBadge fallback** (helpers.js ~400–406): 強弱→Strong–Weak, 弱強→Weak–Strong, 強強→Strong–Strong, 弱弱→Weak–Weak

---

## helpers.js — PoYen Board (getPoYenBoard)

| Original Chinese | Original English | File | Line |
|------------------|------------------|------|------|
| 本局屬性： | Core Profile: | js/calc/helpers.js | 627–629 |
| 最優路徑： | Best Path: | js/calc/helpers.js | 635–637 |
| 系統風險： | System Risk: | js/calc/helpers.js | 646–651 |
| 這一關，先把【${weakest}】補上再談放大。 | This stage: patch ${weakest} first—then talk about scaling. | js/calc/helpers.js | 655 |

---

## helpers.js — Ten-God (tenGodFromStems)

| Original Chinese | File | Line |
|------------------|------|------|
| 比肩 | js/calc/helpers.js | 802 |
| 劫財 | js/calc/helpers.js | 802 |
| 偏印 | js/calc/helpers.js | 803 |
| 正印 | js/calc/helpers.js | 803 |
| 食神 | js/calc/helpers.js | 804 |
| 傷官 | js/calc/helpers.js | 804 |
| 偏財 | js/calc/helpers.js | 805 |
| 正財 | js/calc/helpers.js | 805 |
| 七殺 | js/calc/helpers.js | 806 |
| 正官 | js/calc/helpers.js | 806 |

---

## config.js — Status Labels (fallback)

| Original Chinese | Original English | File | Line |
|------------------|------------------|------|------|
| 極佳 | Peak Alignment | js/config.js | 32 |
| 強勁 | High Momentum | js/config.js | 32 |
| 平穩 | Stable Flow | js/config.js | 32 |
| 穩健 | Steady Flow | js/config.js | 32 |
| 基礎 | Foundational | js/config.js | 32 |

**File**: `js/config.js` — getStatusLabels fallback (lines 28–40)

---

## ziweiOutput.js — Level Notes & Month Strategy Tag

| Original Chinese | File | Line |
|------------------|------|------|
| 能量通道完全開啟 | js/calc/ziweiOutput.js | 225 |
| 系統運轉順暢 | js/calc/ziweiOutput.js | 225 |
| 當前狀態平穩 | js/calc/ziweiOutput.js | 225 |
| 運作正常 | js/calc/ziweiOutput.js | 225 |
| 基礎穩固 | js/calc/ziweiOutput.js | 225 |
| 剛毅開創 | js/calc/ziweiOutput.js | 397 |
| 柔韌適應 | js/calc/ziweiOutput.js | 397 |
| 熱情擴張 | js/calc/ziweiOutput.js | 397 |
| 細緻執行 | js/calc/ziweiOutput.js | 397 |
| 穩健累積 | js/calc/ziweiOutput.js | 397 |
| 靈活整合 | js/calc/ziweiOutput.js | 397 |
| 精準優化 | js/calc/ziweiOutput.js | 397 |
| 流動擴展 | js/calc/ziweiOutput.js | 397 |
| 深度滲透 | js/calc/ziweiOutput.js | 397 |
| 潛藏蓄力 | js/calc/ziweiOutput.js | 405 |
| 穩固基礎 | js/calc/ziweiOutput.js | 405 |
| 開創啟動 | js/calc/ziweiOutput.js | 405 |
| 柔韌成長 | js/calc/ziweiOutput.js | 405 |
| 整合擴張 | js/calc/ziweiOutput.js | 405 |
| 轉化突破 | js/calc/ziweiOutput.js | 405 |
| 高峰執行 | js/calc/ziweiOutput.js | 405 |
| 收穫整合 | js/calc/ziweiOutput.js | 405 |
| 理性分析 | js/calc/ziweiOutput.js | 405 |
| 精煉優化 | js/calc/ziweiOutput.js | 405 |
| 穩固防禦 | js/calc/ziweiOutput.js | 405 |
| 深度沉潛 | js/calc/ziweiOutput.js | 405 |
| 執行 | js/calc/ziweiOutput.js | 409 |
| 運轉 | js/calc/ziweiOutput.js | 410 |

---

## wuxingFlowPipeline.js — Five-Phase Flow Report

**GEN_TYPE_MAP / GEN_DISPLAY** (相生): 滋養成長, 助燃行動, 行動奠基, 淬煉方法, 規則生智 — name + summary/body  
**CONTROL_TYPE_MAP / CONTROL_DISPLAY** (相剋): 感覺卡卡型, 刀口餘生型, 改革衝撞型, 常想太多型, 基礎空虛型 — name + summary/body  
**BOTTLENECK_DISPLAY**: transform + supply per gen link

**Report section labels** (buildReport):
- 一、氣勢 / Overall momentum…
- 二、相生優勢 / The smoothest generative cycle…
- 三、相生瓶頸 / The main generative bottleneck…
- 四、最大制衡壓力 / The strongest control pressure…
- 五、下一步我們能為你做什麼？ / predictionText

**File**: `js/calc/wuxingFlowPipeline.js` — lines 11–82, 357–435

---

## Auth Service

| Original Chinese | File | Line |
|------------------|------|------|
| 登入為 | js/ui/services/auth-service.js | 78 |
| 登出 | js/ui/services/auth-service.js | 82–83 |
| 登入 | js/ui/services/auth-service.js | 98–99 |
| 登入功能尚未設定。\n\n… | js/ui/services/auth-service.js | 122–128 |
| Google 登入錯誤 | js/ui/services/auth-service.js | 139 |
| Google 登入失敗，請再試一次。 | js/ui/services/auth-service.js | 141 |
| 登入失敗 | js/ui/services/auth-service.js | 162, 170, 177 |
| Google 登入尚未載入，請重新整理頁面再試。 | js/ui/services/auth-service.js | 183 |
| 無法開啟登入視窗，請再試一次。 | js/ui/services/auth-service.js | 191 |

---

## My Charts Service

| Original Chinese | File | Line |
|------------------|------|------|
| 未命名 | js/ui/services/my-charts-service.js | 150 |
| 　→ 點我載入 | js/ui/services/my-charts-service.js | 150 |
| 載入命盤： | js/ui/services/my-charts-service.js | 151 |
| 刪除 | js/ui/services/my-charts-service.js | 158 |
| 刪除此命盤 | js/ui/services/my-charts-service.js | 159 |
| 確定要刪除「…」嗎？ | js/ui/services/my-charts-service.js | 161 |
| 儲存失敗，登入可能已過期，請試著登出後重新登入。 | js/ui/services/my-charts-service.js | 199 |
| 最多 5 筆命盤，請先刪除舊的再儲存。 | js/ui/services/my-charts-service.js | 204 |
| 儲存失敗 | js/ui/services/my-charts-service.js | 206, 213 |
| 刪除失敗，登入可能已過期… | js/ui/services/my-charts-service.js | 227 |
| 刪除失敗，請稍後再試。 | js/ui/services/my-charts-service.js | 233 |

---

## Birth Time Identifier

| Original Chinese | File | Line |
|------------------|------|------|
| 請先登入以使用推算時辰功能。 | js/ui/components/birth-time-identifier.js | 379 |

---

## Data Renderer

| Original Chinese | File | Line |
|------------------|------|------|
| 紫微暫不可用 | js/ui/services/data-renderer.js | 186 |
| 後端 iztro 可能出錯（或打包問題）。請先確認 worker build/依賴，再重試。 | js/ui/services/data-renderer.js | 188–189 |

---

## index.html — Static Copy & aria-labels

| Original Chinese | Original English | File | Line |
|------------------|------------------|------|------|
| Five Elements Meanings | — | index.html | 1988 (hardcoded subtitle) |
| 金木水火土 · 基本意義 | Five Elements · Core Meaning | index.html | 1989 (data-i18n) |
| 回到首頁 | — | index.html | 1632 |
| 1:1 諮詢 | — | index.html | 1637 |
| 簡体中文 / 繁中 / EN | — | index.html | 1650–1654 |
| 開啟選單 | — | index.html | 1664 |
| 戰略導航 | — | index.html | 2006 |
| 虛歲，拖曳可即時更新小限宮位與四化 | — | index.html | 1804 (title) |
| 收合宮位說明 | — | index.html | 2081 |
| 真實時辰 / 上半或下半 | — | index.html | 2057, 2060 |

**File**: `index.html`

---

## tactics.js

| Original Chinese | File | Line |
|------------------|------|------|
| 平穩 | js/calc/tactics.js | 230 |

**File**: `js/calc/tactics.js` — statusLabel fallback

---

## ui.js

| Original Chinese | Original English | File | Line |
|------------------|------------------|------|------|
| 流月组件未加载，请刷新页面重试 | — | js/ui.js | 152 |
| 系統載入失敗，請刷新頁面重試 | Load failed. Please refresh the page. | js/ui.js | 994, 1005 |
| 系統載入失敗，請刷新頁面重試（錯誤：calc.js 未載入） | Load failed. Please refresh (calc.js not loaded). | js/ui.js | 994 |
| 無法啟動：calc.js 未載入 | — | js/ui.js | 1008 |
| （資料庫尚未填入「…」的十神指令。你可以先在 ten_god_analysis 補上 2026 內容。） | — | js/ui.js | 684 |

---

## consultationScriptEngine.js

| Original Chinese | File | Line |
|------------------|------|------|
| 請確認年齡和命盤數據是否正確 | js/calc/consultationScriptEngine.js | 907 |
| 請確認流年數據是否正確 | js/calc/consultationScriptEngine.js | 1026 |

---

## geolocation-calibration.js

| Original Chinese | File | Line |
|------------------|------|------|
| 確認 | js/ui/components/geolocation-calibration.js | 292 |

---

## wuxing-panel.js

| Original Chinese | File | Line |
|------------------|------|------|
| （五行解釋暫不可用） | js/ui/components/wuxing-panel.js | 34 |

---

## expert-admin.html

| Original Chinese | File | Line |
|------------------|------|------|
| 帳號 | expert-admin.html | 119 |
| 密碼 | expert-admin.html | 123 |
| 年 / 月 / 日 / 時 (0-23) / 分 (0-59) | expert-admin.html | 146–152 |
| AI Prompt 將在這裡顯示... | expert-admin.html | 345 |
| 計算中... | expert-admin.html | 451 |
| 正在連線後端計算（八字＋紫微＋流月＋十神）… | expert-admin.html | 456 |
| 正在計算宮位分數和進階分析… | expert-admin.html | 509 |
| 計算完成！ | expert-admin.html | 550 |
| 計算 | expert-admin.html | 557 |
| 計算失敗： | expert-admin.html | 563 |
| 暫無戰略標籤 | expert-admin.html | 638 |
| 尚未計算，請先輸入出生資訊並計算 | expert-admin.html | 641, 654, 671, 1237, 1277, 1318 |
| 諮詢腳本引擎未載入 | expert-admin.html | 666 |
| 請先完成計算以生成諮詢腳本 | expert-admin.html | 671 |
| 生成失敗： | expert-admin.html | 685 |
| 記錄用戶回答的20%關鍵數據... | expert-admin.html | 736 |
| 疊宮分析數據為空 | expert-admin.html | 1235 |
| 健康狀態正常 | expert-admin.html | 1275 |
| 黃色預警線（30分） / 紅色警戒線（60分） | expert-admin.html | 1292–1293 |
| 總筆數：…　已回饋：…　正確：…　不正確：…　準確率… | expert-admin.html | 1484 |
| 尚無資料，請按「載入推算紀錄」。 | expert-admin.html | 1534 |

---

## render-helpers.js

| Original Chinese | File | Line |
|------------------|------|------|
| 五行雷達圖 | js/ui/utils/render-helpers.js | 201 (aria-label) |

---

## liuyue-month.js

| Original Chinese | File | Line |
|------------------|------|------|
| 能量指數 | js/ui/components/liuyue-month.js | 364 (title) |

---

## Summary

- **i18n JSON**: All keys in `data/i18n/*.json` are user-facing. zh-TW, zh-CN, en.
- **constants.js**: `PALACE_ONE_LINERS`, `ENERGY_LABEL`, `ELEMENT_CORE_MEANING_*`, `GENERATION_POST_STYLE`, `OVERCOMING_POST_STYLE`, `POYEN_*`, `ELEMENT_TYPE`, `STRATEGIC_ADVICE_BY_STARS` and their EN variants.
- **helpers.js**: `generateFiveElementDiagnosis` titles, `getPoYenBoard` labels, `relationBadge` fallback, `tenGodFromStems` ten-god names.
- **config.js**: status label fallbacks (極佳, 強勁, 平穩, 穩健, 基礎).
- **ziweiOutput.js**: level notes fallback, `generateMonthStrategyTag` stem/branch attributes.
- **wuxingFlowPipeline.js**: GEN_DISPLAY, CONTROL_DISPLAY, BOTTLENECK_DISPLAY, report section labels, prediction text.
- **auth-service.js**: login/logout UI, error messages.
- **my-charts-service.js**: chart list labels, delete confirm, save/delete errors.
- **birth-time-identifier.js**: login prompt.
- **data-renderer.js**: ziwei unavailable message.
- **ui.js**: load error messages.
- **tactics.js**: statusLabel fallback.
- **consultationScriptEngine.js**: validation messages.
- **index.html**: section titles, lang buttons (via data-i18n or static).
