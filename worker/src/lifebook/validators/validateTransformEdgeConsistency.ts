/**
 * 四化邊層級驗證：normalizeChart 產出後執行，用於 CI 捕捉「星名與幾何不同源」
 * （例如：幾何仍依宮干飛化，但 starName 被 mutagen 覆寫後，該星所在宮與 toPalace 不一致）。
 */

import { findPalaceByStar } from "../../gonggan-flows.js";
import { toPalaceCanonical } from "../canonicalKeys.js";
import { getNodeProcessEnv } from "../nodeEnv.js";
import type { NormalizedChart, TransformEdge } from "../normalizedChart.js";

export const E_EDGE_STAR_TO_PALACE_MISMATCH = "E_EDGE_STAR_TO_PALACE_MISMATCH";
export const E_EDGE_FROM_PALACE_MISMATCH = "E_EDGE_FROM_PALACE_MISMATCH";
export const E_EDGE_STAR_MUTAGEN_MISMATCH = "E_EDGE_STAR_MUTAGEN_MISMATCH";
export const E_EDGE_STAR_NAME_MISSING = "E_EDGE_STAR_NAME_MISSING";

export type TransformEdgeErrorCode =
  | typeof E_EDGE_STAR_TO_PALACE_MISMATCH
  | typeof E_EDGE_FROM_PALACE_MISMATCH
  | typeof E_EDGE_STAR_MUTAGEN_MISMATCH
  | typeof E_EDGE_STAR_NAME_MISSING;

export interface TransformEdgeValidationIssue {
  code: TransformEdgeErrorCode;
  message: string;
  layer: "natal" | "decade" | "year";
  edge?: TransformEdge;
  severity: "error" | "warning";
}

function collectStarsByPalace(chart: NormalizedChart): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const p of chart.palaces) {
    const names = [
      ...p.mainStars.map((s) => s.name),
      ...p.assistantStars.map((s) => s.name),
      ...p.shaStars.map((s) => s.name),
      ...p.miscStars.map((s) => s.name),
    ].filter(Boolean);
    m.set(p.palace, names);
  }
  return m;
}

function starFromMutagen(mutagenStars: Record<string, string> | undefined, transform: TransformEdge["transform"]): string | undefined {
  if (!mutagenStars || typeof mutagenStars !== "object") return undefined;
  const t = transform as string;
  return mutagenStars[t] ?? mutagenStars[t === "祿" ? "lu" : t === "權" ? "quan" : t === "科" ? "ke" : "ji"];
}

function pushEdgeIssues(
  issues: TransformEdgeValidationIssue[],
  layer: "natal" | "decade" | "year",
  edges: TransformEdge[] | undefined,
  starsByPalace: Map<string, string[]>,
  opts: {
    expectedFromPalace?: string;
    mutagenStars?: Record<string, string>;
  }
): void {
  if (!edges?.length) return;
  const expectedFrom = opts.expectedFromPalace ? toPalaceCanonical(opts.expectedFromPalace) : undefined;

  for (const e of edges) {
    if (!e.starName?.trim()) {
      issues.push({
        code: E_EDGE_STAR_NAME_MISSING,
        message: `${layer} 邊缺少 starName：${e.fromPalace} → ${e.toPalace}（${e.transform}）`,
        layer,
        edge: e,
        severity: "error",
      });
      continue;
    }

    if (expectedFrom && toPalaceCanonical(e.fromPalace) !== expectedFrom) {
      issues.push({
        code: E_EDGE_FROM_PALACE_MISMATCH,
        message: `${layer} 飛出宮不一致：邊為「${e.fromPalace}」，權威為「${expectedFrom}」；${e.starName}${e.transform} → ${e.toPalace}`,
        layer,
        edge: e,
        severity: "error",
      });
    }

    const ms = opts.mutagenStars;
    if (ms) {
      const auth = starFromMutagen(ms, e.transform);
      if (auth && auth.trim() && auth.trim() !== e.starName.trim()) {
        issues.push({
          code: E_EDGE_STAR_MUTAGEN_MISMATCH,
          message: `${layer} 星名與該層 mutagenStars 不一致：邊「${e.starName}」≠ 權威「${auth}」（${e.transform}）`,
          layer,
          edge: e,
          severity: "error",
        });
      }
    }

    const starHome = findPalaceByStar(starsByPalace, e.starName.trim());
    if (starHome && toPalaceCanonical(starHome) !== toPalaceCanonical(e.toPalace)) {
      issues.push({
        code: E_EDGE_STAR_TO_PALACE_MISMATCH,
        message: `${layer} 飛入宮與該星在本命盤落點不一致：${e.starName} 實際在「${starHome}」，邊寫「${e.toPalace}」（${e.fromPalace} 出）`,
        layer,
        edge: e,
        severity: "error",
      });
    }
  }
}

/**
 * 驗證 NormalizedChart 各層 flows：幾何（from/to）與 starName、mutagenStars、星曜落點一致。
 * 用於捕捉「星名對、流向錯」或覆寫後 toPalace 未跟著星走的情況。
 */
export function validateTransformEdgeConsistency(chart: NormalizedChart): TransformEdgeValidationIssue[] {
  const issues: TransformEdgeValidationIssue[] = [];
  const starsByPalace = collectStarsByPalace(chart);

  const natalFlows = chart.natal?.flows ?? chart.natal?.birthTransforms ?? chart.natalTransforms;
  pushEdgeIssues(issues, "natal", natalFlows, starsByPalace, {});

  const decadalPalace = chart.currentDecade?.palace;
  pushEdgeIssues(issues, "decade", chart.currentDecade?.flows, starsByPalace, {
    expectedFromPalace: decadalPalace,
    mutagenStars: chart.currentDecade?.mutagenStars,
  });

  const yearFrom = chart.yearlyHoroscope?.destinyPalace;
  pushEdgeIssues(issues, "year", chart.yearlyHoroscope?.flows, starsByPalace, {
    expectedFromPalace: yearFrom,
    mutagenStars: chart.yearlyHoroscope?.mutagenStars,
  });

  return issues;
}

export function hasTransformEdgeErrors(issues: TransformEdgeValidationIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}

/** 設 LIFEBOOK_STRICT_TRANSFORM_EDGES=1 時，normalize 後若仍有邊錯誤則拋出（CI／整合測試用）；正式環境勿設此變數。 */
export class TransformEdgeValidationError extends Error {
  readonly issues: TransformEdgeValidationIssue[];

  constructor(issues: TransformEdgeValidationIssue[]) {
    const errs = issues.filter((i) => i.severity === "error");
    super(`[lifebook] transform edge validation failed (${errs.length} error(s)): ${JSON.stringify(errs)}`);
    this.name = "TransformEdgeValidationError";
    this.issues = errs;
  }
}

export function isStrictTransformEdgesEnv(): boolean {
  const v = getNodeProcessEnv("LIFEBOOK_STRICT_TRANSFORM_EDGES");
  return v === "1" || v === "true";
}
