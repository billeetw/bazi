/**
 * SECTION_DATA_DEPENDENCY_MAP（四部分架構）
 * 每個 section_key 的資料依賴、是否 prompt 內重算、可否 findingsV2-only、重構優先級。
 */

export type RefactorPriority = "high" | "medium" | "low";

export interface SectionDataDependency {
  /** 主要依賴：findings / findingsV2 欄位 */
  primaryFindings: string[];
  /** 次要依賴：chart / content 欄位或來源 */
  secondaryChartContent: string[];
  /** 是否仍有 prompt 內重算邏輯（四化／飛星／疊宮／診斷包等） */
  hasPromptRecalc: boolean;
  /** 是否可直接切換為只讀 findingsV2（無需 chart 直讀） */
  canSwitchFindingsV2Only: boolean;
  /** 重構優先級 */
  refactorPriority: RefactorPriority;
}

export type SectionKey =
  | "s00" | "s03" | "s04" | "s02" | "s10" | "s01" | "s05" | "s06" | "s07" | "s08" | "s09"
  | "s11" | "s12" | "s13" | "s14" | "s15" | "s15a" | "s16" | "s17" | "s18" | "s19" | "s20" | "s21";

export const SECTION_DATA_DEPENDENCY_MAP: Record<SectionKey, SectionDataDependency> = {
  // ── 第一部分：關於命主 ──
  s04: {
    primaryFindings: [],
    secondaryChartContent: ["config (lifeLordDecode, bodyLordDecode, bodyPalaceByHour, lifeBodyRelation)", "content (lifeBodyRelationSnippet, masterStars, bodyPalaceInfo)"],
    hasPromptRecalc: false,
    canSwitchFindingsV2Only: true,
    refactorPriority: "low",
  },

  // ── 第二部分：運勢 ──
  s00: {
    primaryFindings: ["(可選) mainBattlefields"],
    secondaryChartContent: ["chartJson.overlapAnalysis", "chartJson.fourTransformations", "chartJson.decadalLimits", "chartJson.yearlyHoroscope", "chartJson.ziwei", "chartJson.sihuaLayers"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "high",
  },
  s03: {
    primaryFindings: ["crossChartFindings", "palacePatterns", "(可選) mainBattlefields"],
    secondaryChartContent: ["chartJson.ziwei", "chartJson.overlapAnalysis", "chartJson.fourTransformations", "chartJson.decadalLimits", "chartJson.sihuaLayers", "config (assembleInput)"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "high",
  },
  s15: {
    primaryFindings: ["keyYears", "yearSignals", "crossChartFindings"],
    secondaryChartContent: ["chartJson.decadalLimits", "chartJson.fourTransformations", "chartJson.yearlyHoroscope", "chartJson.overlapAnalysis", "chartJson.minorFortuneByPalace"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "high",
  },
  s15a: {
    primaryFindings: ["keyYears"],
    secondaryChartContent: ["chartJson.minorFortuneByPalace", "chartJson.overlapAnalysis (items / criticalRisks / maxOpportunities / volatileAmbivalences)", "content.decisionMatrix"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "high",
  },
  s16: {
    primaryFindings: ["yearSignals", "keyYears", "timeAxis"],
    secondaryChartContent: ["chartJson.yearlyHoroscope", "chartJson.liunian", "chartJson.fourTransformations.liunian", "chartJson.overlapAnalysis", "content.decisionMatrix"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "high",
  },
  s17: {
    primaryFindings: ["keyYears", "yearSignals"],
    secondaryChartContent: ["chartJson.minorFortuneByPalace", "chartJson.overlapAnalysis", "chartJson.decadalLimits", "chartJson.yearlyHoroscope"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "high",
  },
  s20: {
    primaryFindings: ["crossChartFindings"],
    secondaryChartContent: ["chartJson (buildPiercingDiagnosticBundle)", "chartJson.yearlyHoroscope", "chartJson.decadalLimits", "map.currentDecadalPalace / flowYearMingPalace"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "high",
  },

  // ── 第三部分：12宮分析 ──
  s02: {
    primaryFindings: ["sihuaPlacementItems", "natalFlowItems", "starCombinations", "palacePatterns", "mainBattlefields", "pressureOutlets"],
    secondaryChartContent: ["chartJson.ziwei.palaces (星曜、亮度)", "chartJson.overlap (迴路、高壓)", "content.starPalacesMain", "content (narrativeFacade)", "config"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s10: {
    primaryFindings: ["sihuaPlacementItems", "natalFlowItems", "starCombinations", "palacePatterns", "mainBattlefields", "pressureOutlets"],
    secondaryChartContent: ["chartJson.ziwei.palaces", "chartJson.overlap", "content.starPalacesMain", "content (narrativeFacade)", "config"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s01: {
    primaryFindings: ["sihuaPlacementItems", "natalFlowItems", "starCombinations", "palacePatterns", "mainBattlefields", "pressureOutlets"],
    secondaryChartContent: ["chartJson.ziwei.palaces", "chartJson.overlap", "content.starPalacesMain", "content (narrativeFacade)", "config"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s05: {
    primaryFindings: ["sihuaPlacementItems", "natalFlowItems", "starCombinations", "palacePatterns", "mainBattlefields", "pressureOutlets"],
    secondaryChartContent: ["chartJson.ziwei.palaces", "chartJson.overlap", "content.starPalacesMain", "content (narrativeFacade)", "config"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s06: {
    primaryFindings: ["sihuaPlacementItems", "natalFlowItems", "starCombinations", "palacePatterns", "mainBattlefields", "pressureOutlets"],
    secondaryChartContent: ["chartJson.ziwei.palaces", "chartJson.overlap", "content.starPalacesMain", "content (narrativeFacade)", "config"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s07: {
    primaryFindings: ["sihuaPlacementItems", "natalFlowItems", "starCombinations", "palacePatterns", "mainBattlefields", "pressureOutlets"],
    secondaryChartContent: ["chartJson.ziwei.palaces", "chartJson.overlap", "content.starPalacesMain", "content (narrativeFacade)", "config"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s08: {
    primaryFindings: ["sihuaPlacementItems", "natalFlowItems", "starCombinations", "palacePatterns", "mainBattlefields", "pressureOutlets"],
    secondaryChartContent: ["chartJson.ziwei.palaces", "chartJson.overlap", "content.starPalacesMain", "content (narrativeFacade)", "config"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s09: {
    primaryFindings: ["sihuaPlacementItems", "natalFlowItems", "starCombinations", "palacePatterns", "mainBattlefields", "pressureOutlets"],
    secondaryChartContent: ["chartJson.ziwei.palaces", "chartJson.overlap", "content.starPalacesMain", "content (narrativeFacade)", "config"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s11: {
    primaryFindings: ["sihuaPlacementItems", "natalFlowItems", "starCombinations", "palacePatterns", "mainBattlefields", "pressureOutlets"],
    secondaryChartContent: ["chartJson.ziwei.palaces", "chartJson.overlap", "content.starPalacesMain", "content (narrativeFacade)", "config", "content.wuxingWeak (五行弱項)"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s12: {
    primaryFindings: ["sihuaPlacementItems", "natalFlowItems", "starCombinations", "palacePatterns", "mainBattlefields", "pressureOutlets"],
    secondaryChartContent: ["chartJson.ziwei.palaces", "chartJson.overlap", "content.starPalacesMain", "content (narrativeFacade)", "config"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s13: {
    primaryFindings: ["sihuaPlacementItems", "natalFlowItems", "starCombinations", "palacePatterns", "mainBattlefields", "pressureOutlets"],
    secondaryChartContent: ["chartJson.ziwei.palaces", "chartJson.overlap", "content.starPalacesMain", "content (narrativeFacade)", "config"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s14: {
    primaryFindings: ["sihuaPlacementItems", "natalFlowItems", "starCombinations", "palacePatterns", "mainBattlefields", "pressureOutlets"],
    secondaryChartContent: ["chartJson.ziwei.palaces", "chartJson.overlap", "content.starPalacesMain", "content (narrativeFacade)", "config"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },

  // ── 第四部分：此生任務 ──
  s18: {
    primaryFindings: ["lifeLessons", "crossChartFindings"],
    secondaryChartContent: ["chartJson (buildPiercingDiagnosticBundle)", "map.recurringHomeworkNarrative", "map.currentDecadalPalace"],
    hasPromptRecalc: true,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s19: {
    primaryFindings: ["actionItems"],
    secondaryChartContent: ["map.actionNowLayers (來自 s15/s16 脈絡)", "chartJson (year/decade context)", "content.decisionMatrix"],
    hasPromptRecalc: false,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
  s21: {
    primaryFindings: ["lifeLessons"],
    secondaryChartContent: ["map.recurringHomeworkNarrative", "map.yearRoleInDecade", "map.currentDecadalPalace"],
    hasPromptRecalc: false,
    canSwitchFindingsV2Only: false,
    refactorPriority: "medium",
  },
};

/** 依重構優先級篩選 section_key */
export function getSectionsByPriority(priority: RefactorPriority): SectionKey[] {
  return (Object.entries(SECTION_DATA_DEPENDENCY_MAP) as [SectionKey, SectionDataDependency][])
    .filter(([, d]) => d.refactorPriority === priority)
    .map(([k]) => k);
}

/** 仍有 prompt 內重算邏輯的章節 */
export function getSectionsWithPromptRecalc(): SectionKey[] {
  return (Object.entries(SECTION_DATA_DEPENDENCY_MAP) as [SectionKey, SectionDataDependency][])
    .filter(([, d]) => d.hasPromptRecalc)
    .map(([k]) => k);
}

/** 可切換為 findingsV2-only 的章節（目前僅 s04） */
export function getSectionsCanSwitchFindingsV2Only(): SectionKey[] {
  return (Object.entries(SECTION_DATA_DEPENDENCY_MAP) as [SectionKey, SectionDataDependency][])
    .filter(([, d]) => d.canSwitchFindingsV2Only)
    .map(([k]) => k);
}

// ---------------------------------------------------------------------------
// V2 遷移：三批 + SECTION_V2_TARGET_MAP
// ---------------------------------------------------------------------------

/** 高優先級遷移批次：1 = 最早切 V2，2 = 中等複雜度，3 = 依賴多、需重寫敘事 */
export type MigrationBatch = 1 | 2 | 3;

export const HIGH_PRIORITY_MIGRATION_BATCH: Record<SectionKey, MigrationBatch | undefined> = {
  s00: 3,
  s03: 3,
  s15: 2,
  s15a: 1,
  s16: 1,
  s17: 2,
  s20: 2,
  s04: undefined,
  s02: undefined,
  s10: undefined,
  s01: undefined,
  s05: undefined,
  s06: undefined,
  s07: undefined,
  s08: undefined,
  s09: undefined,
  s11: undefined,
  s12: undefined,
  s13: undefined,
  s14: undefined,
  s18: undefined,
  s19: undefined,
  s21: undefined,
};

export interface SectionV2Target {
  /** 建議改讀的 findingsV2 欄位 */
  primary: string[];
  /** 仍需保留的 chart/content fallback（路徑描述） */
  fallback: string[];
  /** 可刪除的 prompt 內重算邏輯描述（供實作對照） */
  removePromptRecalc: string[];
}

/** V2 遷移目標：僅含 high priority 章節；assembler 依此改為「先讀 primary，缺則 fallback」並移除 removePromptRecalc 所列邏輯 */
export const SECTION_V2_TARGET_MAP: Partial<Record<SectionKey, SectionV2Target>> = {
  s15a: {
    primary: ["stackSignals", "timeWindowScores", "eventProbabilities"],
    fallback: ["chartJson.minorFortuneByPalace", "chartJson.overlapAnalysis", "content.decisionMatrix"],
    removePromptRecalc: [
      "minor fortune overlap recompute (shockCount/mineCount/wealthCount from overlap items)",
      "criticalRisks / maxOpportunities / volatileAmbivalences aggregation",
      "buildOverlapDetailBlocks from chart/overlap for shockBlocks, mineBlocks, wealthBlocks",
    ],
  },
  s16: {
    primary: ["eventProbabilities", "timeWindowScores", "triggeredPaths"],
    fallback: ["chartJson.yearlyHoroscope", "chartJson.liunian", "chartJson.fourTransformations.liunian", "content.decisionMatrix"],
    removePromptRecalc: [
      "liunian transform recompute (flowYearSihuaLine from liunian/fourTransformations)",
      "year role inference in prompt (getYearRoleInDecadeAndWhy from liunianMutagen + decadalPalace)",
      "flow year tag from overlap (mine/wealth/shock) for buildYearDecisionSummary",
    ],
  },
  s15: {
    primary: ["timeWindowScores", "triggeredPaths", "stackSignals"],
    fallback: ["chartJson.decadalLimits", "chartJson.fourTransformations", "chartJson.overlapAnalysis", "chartJson.minorFortuneByPalace"],
    removePromptRecalc: [
      "decadal limits list and decadal main line energy from chart",
      "collectFourTransformsForPalace for decadalFourTransformBlocks",
      "buildPiercingDiagnosticBundle for recurringHomeworkNarrative (when no override)",
    ],
  },
  s17: {
    primary: ["timeWindowScores", "triggeredPaths", "eventProbabilities"],
    fallback: ["chartJson.minorFortuneByPalace", "chartJson.overlapAnalysis", "chartJson.decadalLimits", "chartJson.yearlyHoroscope"],
    removePromptRecalc: [
      "overlapDataMissingNotice from direct overlap/minor read",
      "year role and actionNowLayers from chart-derived context",
    ],
  },
  s20: {
    primary: ["stackSignals", "crossChartFindings", "triggeredPaths", "pathNarratives"],
    fallback: ["chartJson (buildPiercingDiagnosticBundle)", "chartJson.yearlyHoroscope", "chartJson.decadalLimits", "map.currentDecadalPalace", "map.flowYearMingPalace"],
    removePromptRecalc: [
      "buildPiercingDiagnosticBundle for s20 year/decadal lines",
      "s20BenmingLine / s20DecadalLine / s20YearLine from chart + map only",
    ],
  },
  s00: {
    primary: ["transformEdges", "triggeredPaths", "pathNarratives", "stackSignals", "mainBattlefields"],
    fallback: ["chartJson.overlapAnalysis", "chartJson.fourTransformations", "chartJson.decadalLimits", "chartJson.yearlyHoroscope", "chartJson.ziwei", "chartJson.sihuaLayers"],
    removePromptRecalc: [
      "runS00Pipeline from chartJson",
      "buildFourTransformPersonality from chartJson",
      "buildSiHuaLayers for s00 placeholder blocks",
      "buildWholeChartContext for starGroupStatsBlock / rhythm",
    ],
  },
  s03: {
    primary: ["triggeredPaths", "pathNarratives", "stackSignals", "transformEdges", "crossChartFindings", "palacePatterns"],
    fallback: ["chartJson.ziwei", "chartJson.overlapAnalysis", "chartJson.fourTransformations", "chartJson.decadalLimits", "chartJson.sihuaLayers", "config (assembleInput)"],
    removePromptRecalc: [
      "buildS03GlobalContext from chartJson",
      "buildWholeChartContext for wholeChartMainlineBlock, siHuaPatternTopBlocks, loopSummaryBlock",
      "buildSiHuaLayers for benmingSiHuaLine / decadal / yearly",
      "buildPiercingDiagnosticBundle for s03PiercingDiagnosisBlock",
    ],
  },
};

/** 取得指定批次的 section_key 列表 */
export function getSectionsByMigrationBatch(batch: MigrationBatch): SectionKey[] {
  return (Object.entries(HIGH_PRIORITY_MIGRATION_BATCH) as [SectionKey, MigrationBatch | undefined][])
    .filter(([, b]) => b === batch)
    .map(([k]) => k);
}
