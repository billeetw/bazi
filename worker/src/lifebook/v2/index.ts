/**
 * Lifebook V2：時序飛星推理引擎。
 * 入口與 schema / reason / config 匯出。
 */

export * from "./schema/index.js";
export { buildTransformEdges } from "./reason/buildTransformEdges.js";
export { matchPaths } from "./reason/matchPaths.js";
export { detectStacks } from "./reason/detectStacks.js";
export { scoreTimeWindows } from "./reason/scoreTimeWindows.js";
export { reasonFromChart } from "./reason/reasonFromChart.js";
export { inferEvents } from "./reason/inferEvents.js";
export type { ReasonFromChartV2Result, ReasonFromChartResult } from "./reason/reasonFromChart.js";
export { buildS15aPlaceholderMapFromV2 } from "./assembler/buildS15aMapFromV2.js";
export type { S15aMapFromV2Result } from "./assembler/buildS15aMapFromV2.js";
export { buildS16PlaceholderMapFromV2 } from "./assembler/buildS16MapFromV2.js";
export type { S16MapFromV2Result } from "./assembler/buildS16MapFromV2.js";
export { PATH_LIBRARY, getPathById, getPathsByCategory } from "./config/pathLibrary.js";
export type { PalacePathDefinition, PathCategory } from "./config/pathLibrary.js";
export {
  TRANSFORM_SCORE,
  PALACE_WEIGHT,
  LAYER_WEIGHT,
  STACK_MULTIPLIER,
} from "./config/scoreWeights.js";
