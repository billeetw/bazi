/**
 * Life Book ontology & schema.
 * 生命宇宙說明書：宮位、星曜、十神、五行、六識、神經迴路的 ID 與常數。
 */

export {
  type PalaceId,
  type LifeDomain,
  type PalaceMeta,
  PALACES,
  PALACE_ID_TO_NAME,
  PALACE_NAME_ZH_TO_ID,
} from "./schema.js";

export {
  type TenGodId,
  type TenGodCategory,
  type TenGodMeta,
  TENGODS,
  TENGOD_ID_TO_NAME,
  TENGOD_NAME_ZH_TO_ID,
} from "./schema.js";

export {
  type WuXingId,
  type WuXingMeta,
  WUXING,
  WUXING_ID_TO_NAME,
  WUXING_NAME_ZH_TO_ID,
} from "./schema.js";

export {
  type MainStarId,
  type StarKind,
  type StarMeta,
  STARS,
  STAR_ID_TO_NAME,
  STAR_NAME_ZH_TO_ID,
} from "./schema.js";

export {
  type ConsciousChannelId,
  type ConsciousMeta,
  CONSCIOUS_CHANNELS,
} from "./schema.js";

export {
  type NeuralLoopId,
  type NeuralLoopMeta,
  NEURAL_LOOPS,
} from "./schema.js";

export { type TransformId, TRANSFORMS } from "./schema.js";

export {
  type RiskRule,
  type RiskRuleWhen,
  type WhenStarPalaceTransform,
  type WhenTenGodPalaceExcess,
  type WhenWuxingExtreme,
  RISK_RULES,
} from "./rules.js";

export {
  type AssembleInput,
  type AssembleResult,
  type AssembleContentLookup,
  type ArchetypeEntry,
  assembleRiskProfile,
  resolveAssembleSnippets,
} from "./assembler.js";

export { buildAssembleInput } from "./chartToAssembleInput.js";

export {
  getDecisionAdvice,
  buildYearDecisionSummary,
  formatYearDecisionSummaryBlock,
  formatXiaoXianDecisionTimeline,
  validateDecisionMatrix,
  getRiskMode,
  type DecisionMatrixConfig,
  type DecisionAdviceInput,
  type DecisionAdviceOutput,
  type DecisionEventId,
  type RiskMode,
  type XiaoXianYearItem,
  type YearDecisionSummary,
} from "./timeDecisionEngine.js";

export {
  evaluateFourTransformPatterns,
  formatPatternNarrative,
  formatPatternActions,
  formatPatternTopBlocksForModule1,
  getHotStarsAndPalaces,
  type SiHuaEvent,
  type PatternHit,
  type SiHuaLayer,
  type SiHuaTransform,
} from "./s00PatternEngine.js";

export {
  renderPatternHitsForModuleOne,
  renderPatternHitsForPalace,
  getModuleOneRuleIds,
  getPalacesInvolved,
  getStarsInvolved,
} from "./patternHitRenderer.js";
export { getPhraseSet, pickTemplateIndex, type RulePhraseSet } from "./patternPhraseLibrary.js";
export {
  PATTERN_PHRASE_LIBRARY_BY_RULE_TYPE,
  getPhraseSetByRuleType,
  mapRuleIdToRuleType,
  evidenceToRuleTypePlaceholders,
  type RuleTypeId,
  type RuleTypePhraseSet,
} from "./patternPhraseLibraryRuleTypes.js";
export {
  STAR_PERSONALITY_MAP,
  MAIN_STAR_WHITELIST,
  AUX_STAR_WHITELIST,
  isScoredStar,
  calculateStarGroupStats,
  calculateStarGroupStatsWeighted,
  getTopTwoGroups,
  getGroupPercentages,
  hasGroup,
  type StarGroupStats,
  type StarGroupTag,
  type GroupInterpretation,
} from "./starPersonalityMap.js";
export {
  getStarGroupNarrative,
  pickNarrativeIndex,
  buildStarEnergyRhythmBlock,
  type StarGroupNarrativeSet,
} from "./starGroupNarrative.js";

export {
  RHYTHM_FOUR_PALACE_IDS,
  extractSihuaFromEvents,
  computeRhythmOnce,
  buildRhythmFull,
  buildRhythmBrief,
  buildRhythmNarrativeFourSegmentsV2,
  computeRhythmStats,
  calculateRhythmScoresV2,
  type RhythmStats,
  type RhythmScoreInput,
  type RhythmDebugInfo,
  type SihuaRhythmInput,
  type StarsByPalaceInput,
} from "./rhythmEngineV2.js";

export {
  buildSihuaEdges,
  getEdgeScore,
  getTopFlows,
  buildTopFlowsBlock,
  computeSinkScores,
  buildLoopSummaryBlock,
  detectMultiLayerConflict,
  type SiHuaEdge,
  type SiHuaEdgeLayer,
  type SiHuaEdgeTransform,
  type SiHuaEventForFlow,
  type SinkScores,
  type MultiLayerConflict,
} from "./sihuaFlowEngine.js";

export { toPalaceCanonical, toStarName } from "./canonicalKeys.js";

export {
  renderNarrativeBlocks,
  renderNarrativeBlocksAsString,
  type NarrativeCorpusSection,
  type NarrativeToneInput,
} from "./narrativeToneEngine.js";

export type {
  NormalizedSiHuaEvent,
  SiHuaDiagnostics,
  PatternHitV2,
  RuleIdV2,
  Severity,
  DominantPalace,
} from "./s00UnifiedTypes.js";
export { LAYER_LABEL, TRANSFORM_LABEL } from "./s00UnifiedTypes.js";

export { normalizeSiHuaEvents, type NormalizerInputEvent } from "./s00Normalizer.js";

export {
  runAllDetectors,
  dedupeByCanonicalKey,
  renderMainNarrative,
  renderMainNarrativeMergedByPalace,
  getMainNarrativeHits,
  buildS00YearlyAdvice,
  renderDebugEvidence,
} from "./s00DetectorsV2.js";

export { detectDominantPalaces, formatDominantPalacesBlock, PALACE_TAG_COMMENT, PALACE_TAG_PAIR_COMMENT } from "./dominantPalaceDetector.js";

export {
  STAR_SEMANTIC_DICTIONARY,
  PALACE_SEMANTIC_DICTIONARY,
  TRANSFORM_SEMANTIC_DICTIONARY,
  getStarSemantic,
  getStarSemanticPhrases,
  getStarThemesSentenceLead,
  getPalaceSemantic,
  getTransformSemantic,
  type StarSemantic,
  type PalaceSemantic,
  type TransformSemantic,
} from "./starSemanticDictionary.js";

export {
  runS00Pipeline,
  type S00PipelineResult,
  type S00PipelineOptions,
} from "./s00Pipeline.js";

export {
  detectLifeArchetype,
  formatLifeArchetypeBlock,
  LIFE_ARCHETYPES,
  type LifeArchetype,
  type ArchetypeDetectionInput,
} from "./archetypeModel.js";

export {
  findStarPalaceTransformMeaning,
  STAR_PALACE_TRANSFORM_MATRIX,
  type TransformType,
  type StarPalaceTransformMeaning,
} from "./starPalaceTransformMatrix.js";

export {
  getStarTransformMeaning,
  getTransformIntoPalaceMeaning,
  getTransformEdgeMeaning,
  getDecadalPalaceTheme,
  buildDecadalNarrative,
  type DecadalLimitInput,
  type DecadalNarrative,
  type DecadalTransformEdge,
} from "./transformInterpretationEngine.js";

/** Layer 1：NormalizedChart（Architecture Spec v1.1） */
export {
  type NormalizedChart,
  type PalaceStructure,
  type StarInPalace,
  type TransformEdge,
  type TransformDisplay,
  type DecadalLimit,
  type YearScope,
  type XiaoXianScope,
  type BodyPalaceSource,
  toBrightnessCanonical,
  toTransformDisplay,
  PALACE_SUFFIX,
} from "./normalizedChart.js";

/** Layer 4：LifebookFindings（Architecture Spec v1.1） */
export {
  type LifebookFindings,
  type MainBattlefield,
  type PressureOutlet,
  type SpilloverFinding,
  type CrossChartFinding,
  type YearSignal,
  type KeyYearFinding,
  type LifeLessonFinding,
  type ActionItem,
  type StarCombinationFinding,
  type PalacePatternFinding,
  createEmptyFindings,
} from "./lifebookFindings.js";

export { normalizeChart } from "./normalize/index.js";
export {
  buildLifebookFindings,
  buildLifebookFindingsFromChartAndContent,
  type BuildLifebookFindingsInput,
  type LifebookContentLookup,
  type BuildLifebookResultWithContext,
} from "./findings/buildLifebookFindings.js";
export { assembleTimeModuleFromFindings, type TimeModulePlaceholderMap } from "./findings/assembleTimeModuleFromFindings.js";
export {
  validateTimelineConsistency,
  hasTimelineErrors,
  type TimelineValidationIssue,
  type TimelineErrorCode,
} from "./validators/validateTimelineConsistency.js";
