/**
 * S19 進階分析（流月、斷語引擎等）
 */

export { buildMonthlyFlowsForS19 } from "./buildMonthlyFlowsForS19.js";
export {
  buildS19MonthlyOutput,
  formatS19MonthlyOutputToCard,
  type BuildS19MonthlyOutputOpts,
} from "./buildS19MonthlyOutput.js";
export { renderFlowNarrativeFromExistingAssets, type FlowInput, type RenderedFlow } from "./prototypeFlowRenderer.js";
export {
  runS19InterpretationEngine,
  pickInterpretationRule,
  pickScenarios,
  renderInterpretationBlock,
  getMonthlyFlowsForTriggerPalace,
  detectS19ChainTypes,
  getS18PalaceBias,
  sanitizeS19Tone,
  type RunS19InterpretationEngineOpts,
  type DetectS19ChainTypesOpts,
  S19_CHAIN_LABELS,
} from "./interpretationEngine.js";
export {
  runSynthesis,
  SYNTHESIS_RULES,
  type SynthesisRule,
  type SynthesisRuleMatch,
  type SynthesisResult,
} from "./synthesisRules.js";
export { INTERPRETATION_RULES_SEED } from "./interpretationRulesSeed.js";
export {
  INTERPRETATION_RULES_V1,
  SPOUSE_RULES,
  CAREER_RULES,
  MONEY_RULES,
  PROPERTY_RULES,
  SIBLING_RULES,
  FORTUNE_RULES,
  TRAVEL_RULES,
  OUTPUT_RULES,
  SELF_RULES,
  HEALTH_RULES,
  SERVANT_RULES,
  AUTHORITY_RULES,
} from "./interpretationRulesOverride.js";
export type {
  InterpretationRule,
  InterpretationRuleConditions,
  InterpretationBlock,
  S18Context,
  S19Context,
  S19ChainType,
  S19InterpretationEngineOutput,
  S19InterpretationPerFlow,
  S18PalaceBias,
  S19MonthlyOutput,
} from "./interpretationRuleTypes.js";
export { PRIMARY_CHAIN_PRIORITY } from "./interpretationRuleTypes.js";
export { resolvePrimaryChain } from "./interpretationEngine.js";
