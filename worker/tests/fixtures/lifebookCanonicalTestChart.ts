/**
 * 生命書／逐宮敘事 **共用測試命盤**（v1）
 *
 * - 固定 `chartId` 便於 log 與除錯對照。
 * - 命宮地支 **子** → Behavior Axis `relational`（桃花軸），便於驗收軸向句與衝突表。
 * - 命宮主星含 **巨門** → `behaviorAxisConflictV1` 時可命中「巨門 × relational」衝突句。
 * - 含 `yearlyHoroscope` / `liunian` / `decadalLimits`，與疊宮、時間語境測試相容。
 * - **`palaceStemMap`**：與 `normalizeChart` 宮干飛化一致（供 overlay 與 `natalTransformsIn` 對照）。
 * - **`fourTransformations.benming`**：生年四化星名；星曜所在宮須與 `starByPalace` 一致（供 S18 `buildSiHuaLayers`）。
 *
 * **新測試請優先** `import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js"`
 * 避免每支測試各寫一張盤、輸出無法橫向比對。
 */

/** 與 `LifeBookConfig` / `buildPalaceNarrativeInputsFromChart` 之 behavior 欄位對齊 */
export type LifeBookBehaviorAxisConfigSlice = {
  behaviorAxisV1?: boolean;
  behaviorAxisConflictV1?: boolean;
  behaviorAxisLoopV1?: boolean;
  behaviorAxisWideOpen?: boolean;
};

/** 與 `getDefaultConfig()` 預設一致：全關；僅在測試裡覆寫需要的欄位 */
export const LIFEBOOK_CANONICAL_BEHAVIOR_AXIS_FLAGS_OFF: LifeBookBehaviorAxisConfigSlice = {
  behaviorAxisV1: false,
  behaviorAxisConflictV1: false,
  behaviorAxisLoopV1: false,
  behaviorAxisWideOpen: false,
};

/** Rollout 階段 1：只開軸向合併 */
export const LIFEBOOK_CANONICAL_BEHAVIOR_STAGE1: LifeBookBehaviorAxisConfigSlice = {
  behaviorAxisV1: true,
  behaviorAxisConflictV1: false,
  behaviorAxisLoopV1: false,
  behaviorAxisWideOpen: false,
};

/** Rollout 階段 2：軸向 + 衝突 */
export const LIFEBOOK_CANONICAL_BEHAVIOR_STAGE2: LifeBookBehaviorAxisConfigSlice = {
  behaviorAxisV1: true,
  behaviorAxisConflictV1: true,
  behaviorAxisLoopV1: false,
  behaviorAxisWideOpen: false,
};

/** Rollout 階段 3：軸向 + 衝突 + Loop（窄四宮） */
export const LIFEBOOK_CANONICAL_BEHAVIOR_STAGE3: LifeBookBehaviorAxisConfigSlice = {
  behaviorAxisV1: true,
  behaviorAxisConflictV1: true,
  behaviorAxisLoopV1: true,
  behaviorAxisWideOpen: false,
};

/**
 * 共用命盤 JSON（餵給 `normalizeChart`）
 */
export const LIFEBOOK_CANONICAL_TEST_CHART_JSON: Record<string, unknown> = {
  chartId: "lifebook-canonical-test-v1",
  birthInfo: { year: 1972 },
  ziwei: {
    core: { minggongBranch: "子", minggongStem: "甲" },
    starByPalace: {
      命宮: ["巨門", "天機"],
      /** 兄弟有廉貞：生年祿 + 流年忌可形成祿忌交錯（丙干） */
      兄弟宮: ["廉貞"],
      /** 含文昌：丙干四化需文昌落點，否則流年飛出會少一條（見 gonggan findPalaceByStar） */
      夫妻宮: ["太陰", "天梁", "文昌"],
      子女宮: ["天同", "破軍"],
      財帛宮: ["天相"],
      疾厄宮: ["七殺"],
      /** 刻意空宮：供 overlay formatter「無」測試 */
      遷移宮: [],
      僕役宮: ["武曲", "紫微"],
      官祿宮: ["太陽", "天梁"],
      田宅宮: ["天機", "天梁"],
      福德宮: ["天同", "天梁"],
      父母宮: ["天府"],
    },
  },
  /**
   * 與整庫 overlay／normalize 對照測試一致；壬干命宮 → 宮干飛化與原「亥命盤」同圖式時需搭配地支
   * （此處僅用於測試固定邊；與 ziwei.core 地支一併維護）。
   */
  palaceStemMap: {
    命宮: "壬",
    兄弟宮: "癸",
    夫妻宮: "甲",
    子女宮: "乙",
    財帛宮: "丙",
    疾厄宮: "丁",
    遷移宮: "戊",
    僕役宮: "己",
    官祿宮: "庚",
    田宅宮: "辛",
    福德宮: "壬",
    父母宮: "癸",
  },
  fourTransformations: {
    benming: {
      mutagenStars: { 祿: "廉貞", 權: "破軍", 科: "武曲", 忌: "太陽" },
    },
  },
  decadalLimits: [{ startAge: 44, endAge: 53, palace: "僕役宮", stem: "甲" }],
  yearlyHoroscope: { year: 2026, nominalAge: 54, stem: "丙" },
  /**
   * 流年四化起點宮：**勿同時**傳 `branch` 與 `palace` 若兩者不一致。
   * 命宮地支為「子」時，`branch: 午` 會經 `getFlowYearPalace` 指到「遷移宮」，與 `palace: 疾厄宮` 衝突。
   * 測試固定以 **疾厄宮** 為丙干飛出宮時，只傳 `palace` + `stem`。
   */
  liunian: { palace: "疾厄宮", stem: "丙" },
  overlapAnalysis: { items: [] },
};
