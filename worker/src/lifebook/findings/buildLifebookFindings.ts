/**
 * Findings Orchestrator v1：把 CL3 四引擎結果收斂成章節唯一可讀的 LifebookFindings。
 * 後面的 assembler / template 禁止直接碰 chartJson；只讀 LifebookFindings。
 *
 * Layer A: Normalize（chartJson → normalizeChart → NormalizedChart）
 * Layer B: Engine Execution（四引擎）
 * Layer C: Findings Assembly（buildPalace / buildTime / buildAction）
 * Layer D: Final LifebookFindings
 */

import { createEmptyFindings } from "../lifebookFindings.js";
import type { NormalizedChart } from "../normalizedChart.js";
import type { LifebookFindings, NatalFlowItem } from "../lifebookFindings.js";
import { normalizeChart } from "../normalize/index.js";
import { validateTimelineConsistency, type TimelineValidationIssue } from "../validators/validateTimelineConsistency.js";
import {
  validateTransformEdgeConsistency,
  hasTransformEdgeErrors,
  TransformEdgeValidationError,
  isStrictTransformEdgesEnv,
  type TransformEdgeValidationIssue,
} from "../validators/validateTransformEdgeConsistency.js";
import { runStarCombinationEngine } from "../engines/starCombination/starCombinationEngine.js";
import type { StarCombinationsTable } from "../engines/starCombination/starCombinationEngine.js";
import { runPalaceInferenceEngine } from "../engines/palaceInference/palaceInferenceEngine.js";
import type { PalaceTransformStarPatternRow } from "../engines/palaceInference/palacePatternMatcher.js";
import type { MainStarInferenceHint } from "../engines/palaceInference/palacePatternFallback.js";
import { buildSpilloverFindings } from "../engines/crossChart/spilloverEngine.js";
import { buildCrossChartEngineResult } from "../engines/crossChart/crossChartEngine.js";
import type { CrossChartRuleRow } from "../engines/crossChart/crossChartRuleTypes.js";
import type { PalaceAxisLinkRow } from "../engines/crossChart/crossChartRuleTypes.js";
import type { OverlapInput } from "../engines/signals/signalsEngine.js";
import { buildPalaceFindings } from "./buildPalaceFindings.js";
import { buildTimeFindings } from "./buildTimeFindings.js";
import { buildActionFindings } from "./buildActionFindings.js";
import { buildTimeModuleOverlapSnapshotFromChartJson } from "../timeModuleOverlapSnapshot.js";
import { buildTimeModuleDecisionSnapshotFromChart } from "../timeModuleDecisionSnapshot.js";
import type { DecisionMatrixConfig } from "../timeDecisionEngine.js";
import decisionMatrixJson from "../../../content/decisionMatrix.json";

/** 施工圖 v1：contentLookup 形狀，供「只吃 chartJson + content」入口使用 */
export interface LifebookContentLookup {
  ccl3: {
    starCombinationsTable: StarCombinationsTable;
    crossChartRules: CrossChartRuleRow[];
    palaceAxisLinks: PalaceAxisLinkRow[];
    palaceMatrixPatterns: PalaceTransformStarPatternRow[];
    mainStarHints: MainStarInferenceHint[];
  };
}

export interface BuildLifebookFindingsInput {
  normalizedChart: NormalizedChart;
  starCombinationsTable: StarCombinationsTable;
  crossChartRules: CrossChartRuleRow[];
  palaceAxisLinks: PalaceAxisLinkRow[];
  palaceMatrixPatterns: PalaceTransformStarPatternRow[];
  mainStarHints: MainStarInferenceHint[];
  overlap?: OverlapInput;
  minorFortuneByPalace?: Array<{ palace: string; year?: number | null; nominalAge?: number | null; note?: string | null }>;
  birthYear?: number;
}

/**
 * 從 chartJson + contentLookup 組出 BuildLifebookFindingsInput（overlap / minorFortune / birthYear 取自 chartJson）。
 */
function buildInputFromChartAndContent(
  chartJson: Record<string, unknown>,
  content: LifebookContentLookup
): BuildLifebookFindingsInput {
  const chart = normalizeChart(chartJson);
  const overlap = chartJson.overlapAnalysis as OverlapInput | undefined;
  const minorFortuneByPalace = chartJson.minorFortuneByPalace as BuildLifebookFindingsInput["minorFortuneByPalace"];
  const yh = chartJson.yearlyHoroscope as { year?: number; nominalAge?: number } | undefined;
  const birthYear = (chartJson.birthInfo as { year?: number } | undefined)?.year ??
    (yh?.year != null && yh?.nominalAge != null ? yh.year - yh.nominalAge : undefined);

  return {
    normalizedChart: chart,
    starCombinationsTable: content.ccl3.starCombinationsTable,
    crossChartRules: content.ccl3.crossChartRules,
    palaceAxisLinks: content.ccl3.palaceAxisLinks,
    palaceMatrixPatterns: content.ccl3.palaceMatrixPatterns,
    mainStarHints: content.ccl3.mainStarHints,
    overlap,
    minorFortuneByPalace,
    birthYear,
  };
}

/** 回傳給呼叫端：findings + timeContext（來自同一份 normalizeChart，assembler 只讀此） */
export interface BuildLifebookResultWithContext {
  findings: LifebookFindings;
  timeContext: {
    currentDecadePalace?: string;
    shenGong?: string;
    year?: number;
    nominalAge?: number;
  };
  /** 時間軸一致性驗證結果；若有 error 則禁止輸出錯誤四化文案 */
  timelineValidationIssues?: TimelineValidationIssue[];
  /** 四化邊與星曜落點／mutagen 一致性；若有 error 表示幾何與星名不同源 */
  transformEdgeValidationIssues?: TransformEdgeValidationIssue[];
}

/**
 * 只吃 chartJson + contentLookup；內部做 normalizeChart()，組裝唯一 LifebookFindings 並帶出 timeContext。
 * 供 index 等呼叫端使用，後續 assembler / template 禁止再碰 chartJson。
 */
export function buildLifebookFindingsFromChartAndContent(args: {
  chartJson: unknown;
  content: LifebookContentLookup;
}): BuildLifebookResultWithContext | null {
  if (!args.chartJson || typeof args.chartJson !== "object") return null;
  try {
    const input = buildInputFromChartAndContent(
      args.chartJson as Record<string, unknown>,
      args.content
    );
    const chart = input.normalizedChart;
    const timelineValidationIssues = validateTimelineConsistency(chart);
    const transformEdgeValidationIssues = validateTransformEdgeConsistency(chart);
    const logger = typeof console !== "undefined" && console.warn ? console : { warn: () => {} };
    if (timelineValidationIssues.length > 0) {
      logger.warn("[lifebook] validateTimelineConsistency:", timelineValidationIssues);
    }
    if (transformEdgeValidationIssues.length > 0) {
      logger.warn("[lifebook] validateTransformEdgeConsistency:", transformEdgeValidationIssues);
    }
    if (isStrictTransformEdgesEnv() && hasTransformEdgeErrors(transformEdgeValidationIssues)) {
      throw new TransformEdgeValidationError(transformEdgeValidationIssues);
    }
    const findings = buildLifebookFindings(input);
    const chartJson = args.chartJson as Record<string, unknown>;
    findings.timeModuleOverlap = buildTimeModuleOverlapSnapshotFromChartJson(chartJson, {});
    findings.timeModuleDecision = buildTimeModuleDecisionSnapshotFromChart({
      chartJson,
      decisionMatrix: decisionMatrixJson as unknown as DecisionMatrixConfig,
      palaceOverlapTags: findings.timeModuleOverlap.palaceOverlapTags,
    });
    return {
      findings,
      timeContext: {
        currentDecadePalace: chart.currentDecade?.palace,
        shenGong: chart.shenGong,
        year: chart.flowYear ?? chart.yearlyHoroscope?.year,
        nominalAge: chart.nominalAge ?? chart.yearlyHoroscope?.nominalAge,
      },
      timelineValidationIssues,
      transformEdgeValidationIssues,
    };
  } catch (e) {
    if (e instanceof TransformEdgeValidationError) throw e;
    return null;
  }
}

/**
 * 單一入口：產出 LifebookFindings。
 * 流程：四引擎 → 宮位層組裝 → 時間層組裝 → 行動層組裝 → 合併輸出。
 */
export function buildLifebookFindings(input: BuildLifebookFindingsInput): LifebookFindings {
  const f = createEmptyFindings();
  const chart = input.normalizedChart;

  // ── Layer B: Engine Execution ──
  const starCombinations = runStarCombinationEngine(chart.palaces, input.starCombinationsTable);
  const palacePatterns = runPalaceInferenceEngine(chart.palaces, {
    patterns: input.palaceMatrixPatterns,
    mainStarHints: input.mainStarHints,
  });
  const spilloverFindings = buildSpilloverFindings(
    chart,
    input.crossChartRules,
    input.palaceAxisLinks
  );
  const crossChartResult = buildCrossChartEngineResult({
    chart,
    palacePatterns,
    spillovers: spilloverFindings,
    starCombinations,
  });

  // ── Layer C: Findings Assembly ──
  const palaceLayer = buildPalaceFindings({
    chart,
    palacePatterns,
    starCombinations,
    spilloverFindings,
    crossChartFindings: crossChartResult.crossChartFindings,
  });

  const timeLayer = buildTimeFindings({
    chart,
    crossChartFindings: crossChartResult.crossChartFindings,
    yearSignalsFromCrossChart: crossChartResult.yearSignals,
    overlap: input.overlap,
    minorFortuneByPalace: input.minorFortuneByPalace,
    birthYear: input.birthYear,
  });

  const actionLayer = buildActionFindings({
    chart,
    crossChartFindings: timeLayer.crossChartFindings,
    lifeLessonsFromCrossChart: crossChartResult.lifeLessons,
    palacePatterns: palaceLayer.palacePatterns,
    spilloverFindings: palaceLayer.spilloverFindings,
    yearSignals: timeLayer.yearSignals,
  });

  // ── Layer D: Final LifebookFindings ──
  f.mainBattlefields = palaceLayer.mainBattlefields;
  f.pressureOutlets = palaceLayer.pressureOutlets;
  f.palacePatterns = palaceLayer.palacePatterns;
  f.starCombinations = palaceLayer.starCombinations;
  f.spilloverFindings = palaceLayer.spilloverFindings;
  f.crossChartFindings = timeLayer.crossChartFindings;
  f.yearSignals = timeLayer.yearSignals;
  f.keyYears = timeLayer.keyYears;
  f.lifeLessons = actionLayer.lifeLessons;
  f.actionItems = actionLayer.actionItems;

  const natalFlows = chart.natal?.flows ?? chart.natal?.birthTransforms ?? chart.natalTransforms;
  f.natalFlowItems = (natalFlows ?? []).map((e): NatalFlowItem => ({
    fromPalace: e.fromPalace,
    toPalace: e.toPalace,
    starName: e.starName,
    transform: e.transform,
  }));

  return f;
}
