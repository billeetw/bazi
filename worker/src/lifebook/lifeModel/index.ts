/**
 * S22 結構線 / S23 轉化流（本命靜態）
 */

export { getPalaceScore } from "./palaceScore.js";
export { getStructureLines, classifyStructureBalance } from "./structureLines.js";
export { getTransformationFlows, classifyFlowType } from "./transformationFlows.js";
export {
  formatStructureLinesForTechnical,
  formatTransformationFlowsForTechnical,
} from "./formatTechnicalBlocks.js";
export { getPalacePersonality, type PalacePersonalityStyle } from "./palacePersonality.js";
export { pickSynonym } from "./narrativeSynonyms.js";
export {
  buildStarStateNarrativeSlice,
  type StarStateNarrativeSlice,
  type StarStateNarrativeTone,
} from "./starStateNarrativeSlice.js";
export type {
  PalaceScoreResult,
  PalaceScoreVersion,
  StructureLine,
  StructureLineId,
  StructureBalanceType,
  TransformationFlow,
  TransformationFlowId,
  TransformationFlowType,
} from "./types.js";
