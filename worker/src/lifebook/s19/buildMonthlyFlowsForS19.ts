/**
 * S19：流月 flows 建構器
 *
 * 規格對齊：
 * - iztro horoscope layer 對應：monthly
 * - monthly 資料直接來自 chartJson.features.ziwei.monthlyHoroscope
 * - fromPalace = flowMonthPalace（= palaceByBranch[monthly.earthlyBranch]，已由 worker 在 monthlyHoroscope 輸出端處理）
 * - toPalace = findPalaceByStar(starsByPalace, mutagen[i])
 * - triggerStem = monthly.heavenlyStem
 */

import type { GongGanFlow } from "../../gonggan-flows.js";
import { buildMonthlySihuaFlows } from "../../gonggan-flows.js";
import { getStarByPalaceFromChart } from "../normalize/index.js";

type MonthlyHoroscope = {
  stem?: string | null;
  branch?: string | null;
  palace?: string | null;
  mutagenStars?: Record<string, string>;
  stars?: unknown;
};

export function buildMonthlyFlowsForS19(chartJson: Record<string, unknown> | undefined): GongGanFlow[] {
  if (!chartJson) return [];

  const monthly = (chartJson as any)?.features?.ziwei?.monthlyHoroscope as MonthlyHoroscope | undefined
    ?? (chartJson as any)?.ziwei?.monthlyHoroscope;
  if (!monthly?.stem || !monthly?.palace) return [];

  const starsByPalace = getStarByPalaceFromChart(chartJson as any);
  const flows = buildMonthlySihuaFlows(
    monthly.stem,
    monthly.palace,
    starsByPalace,
    monthly.mutagenStars ?? null
  );
  return flows;
}

