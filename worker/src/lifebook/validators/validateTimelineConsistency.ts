/**
 * 時間軸一致性驗證：normalizeChart 產出後、lifebook render 前執行。
 * 若有 error：log 並禁止輸出錯誤四化文案。
 */

import type { NormalizedChart, TransformEdge } from "../normalizedChart.js";

export const E_NATAL_TRANSFORMS_MISSING = "E_NATAL_TRANSFORMS_MISSING";
export const E_DECADE_LIMIT_RESOLUTION_FAILED = "E_DECADE_LIMIT_RESOLUTION_FAILED";
export const E_YEAR_TRANSFORMS_FALLBACK_TO_DECADE = "E_YEAR_TRANSFORMS_FALLBACK_TO_DECADE";
export const E_FLOW_YEAR_DESTINY_PALACE_MISSING = "E_FLOW_YEAR_DESTINY_PALACE_MISSING";

export type TimelineErrorCode =
  | typeof E_NATAL_TRANSFORMS_MISSING
  | typeof E_DECADE_LIMIT_RESOLUTION_FAILED
  | typeof E_YEAR_TRANSFORMS_FALLBACK_TO_DECADE
  | typeof E_FLOW_YEAR_DESTINY_PALACE_MISSING;

export interface TimelineValidationIssue {
  code: TimelineErrorCode;
  message: string;
  severity: "error" | "warning";
}

function sameArrayRef(a: TransformEdge[] | undefined, b: TransformEdge[] | undefined): boolean {
  return a === b;
}

export function validateTimelineConsistency(chart: NormalizedChart): TimelineValidationIssue[] {
  const issues: TimelineValidationIssue[] = [];

  if (!chart.natalTransforms || chart.natalTransforms.length === 0) {
    const hasNatal = chart.natal?.birthTransforms?.length;
    if (!hasNatal) {
      issues.push({
        code: E_NATAL_TRANSFORMS_MISSING,
        message: "本命（生年）四化缺失",
        severity: "error",
      });
    }
  }

  if (chart.nominalAge != null && (!chart.decadalLimits?.length || !chart.currentDecade)) {
    issues.push({
      code: E_DECADE_LIMIT_RESOLUTION_FAILED,
      message: "無法依 nominalAge 解析當前大限",
      severity: "error",
    });
  }

  const decadeTransforms = chart.currentDecade?.transforms ?? [];
  const yearTransforms = chart.yearlyHoroscope?.transforms ?? [];
  if (sameArrayRef(yearTransforms, decadeTransforms) && (decadeTransforms.length > 0 || yearTransforms.length > 0)) {
    issues.push({
      code: E_YEAR_TRANSFORMS_FALLBACK_TO_DECADE,
      message: "流年四化不可為大限四化之 fallback（流年四化必須獨立解析）",
      severity: "error",
    });
  }

  if (chart.flowYear != null && chart.yearlyHoroscope && !chart.yearlyHoroscope.destinyPalace) {
    issues.push({
      code: E_FLOW_YEAR_DESTINY_PALACE_MISSING,
      message: "流年命宮（destinyPalace）缺失，無法對應流年四化",
      severity: "warning",
    });
  }

  return issues;
}

export function hasTimelineErrors(issues: TimelineValidationIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}
