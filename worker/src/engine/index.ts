/**
 * 四化引擎統一入口
 */

export { normalizeSiHuaEvents, type NormalizerInputEvent } from "./normalizeSiHuaEvents.js";
export {
  detectR01,
  detectR02,
  detectR03,
  detectR11,
  detectR30,
  runAllDetectors,
} from "./patternDetectors.js";
export { mergePatternHits } from "./patternMerge.js";
export {
  generateNarrative,
  generateMainTextOnly,
  type NarrativeResult,
  type DebugBlock,
} from "./generateNarrative.js";
export { buildDecisionAdvice, buildDecisionAdviceFromHits } from "./decisionEngine.js";
export {
  star_consultation_dictionary,
  getPalaceTransformDictionary,
  getPalaceCausalityMatrix,
  getPalaceConsultationDictionary,
  getStarTransformDictionary,
  lookupCausality,
} from "./loadData.js";
export type {
  SiHuaEvent,
  SiHuaDiagnostics,
  PatternHit,
  NormalizeResult,
  TransformZh,
  Layer,
  DecisionTag,
  PalaceCausalityRow,
} from "./types.js";
