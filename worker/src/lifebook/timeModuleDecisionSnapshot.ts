/**
 * 模組二決策矩陣輸出：與 timeModuleOverlap 快照同源 tag，禁止 placeholder 內重讀 overlap。
 */
import type { DecisionMatrixConfig, XiaoXianYearItem } from "./timeDecisionEngine.js";
import {
  buildYearDecisionSummary,
  formatXiaoXianDecisionTimeline,
  formatYearDecisionSummaryBlock,
} from "./timeDecisionEngine.js";
import { buildTimeModuleDisplayFromChartJson } from "./sihuaTimeBuilders.js";
import { normPalaceForMatch } from "./timeModuleOverlapSnapshot.js";

export interface TimeModuleDecisionSnapshot {
  keyYearsDecisionTimeline: string;
  /** s15/s16「今年」決策摘要；無流年年份時為空字串 */
  yearDecisionSummaryBlock: string;
}

function tagToRisk(tag: "shock" | "mine" | "wealth" | undefined): 1 | 2 | 3 | 4 | 5 {
  if (tag === "mine") return 5;
  if (tag === "shock") return 4;
  if (tag === "wealth") return 2;
  return 3;
}

/**
 * 僅依 chartJson + 與 overlap 同源的 palaceOverlapTags + decisionMatrix；不重讀 overlap payload。
 */
export function buildTimeModuleDecisionSnapshotFromChart(args: {
  chartJson: Record<string, unknown>;
  decisionMatrix: DecisionMatrixConfig | undefined;
  palaceOverlapTags: Record<string, "shock" | "mine" | "wealth">;
}): TimeModuleDecisionSnapshot {
  const { chartJson, decisionMatrix, palaceOverlapTags } = args;
  const palaceToTag = new Map<string, "shock" | "mine" | "wealth">(
    Object.entries(palaceOverlapTags) as [string, "shock" | "mine" | "wealth"][]
  );

  const minor = chartJson.minorFortuneByPalace as
    | Array<{ palace?: string; year?: number | null; nominalAge?: number | null; stem?: string | null; note?: string | null }>
    | undefined;

  let keyYearsDecisionTimeline = "";
  if (decisionMatrix && Array.isArray(minor) && minor.length > 0) {
    const items: XiaoXianYearItem[] = minor.map((m) => {
      const p = m.palace ?? "";
      const tag = palaceToTag.get(normPalaceForMatch(p));
      return {
        year: m.year ?? undefined,
        nominalAge: m.nominalAge ?? undefined,
        palace: p,
        riskLevel: tagToRisk(tag),
        tag: tag ?? undefined,
      };
    });
    const summaries = items.map((it) => buildYearDecisionSummary(it, decisionMatrix));
    keyYearsDecisionTimeline = formatXiaoXianDecisionTimeline(summaries);
  }

  const yearly = (chartJson.yearlyHoroscope ?? (chartJson.ziwei as Record<string, unknown>)?.yearlyHoroscope) as
    | { year?: number; palaceNames?: string[] }
    | undefined;
  const timeDisplay = buildTimeModuleDisplayFromChartJson(chartJson);
  let yearDecisionSummaryBlock = "";
  if (decisionMatrix && yearly?.year != null) {
    const palace = timeDisplay.flowYearMingPalace || (yearly?.palaceNames?.[0] ?? "");
    const tag = palace ? palaceToTag.get(normPalaceForMatch(palace)) : undefined;
    const currentYearItem: XiaoXianYearItem = {
      year: yearly.year,
      nominalAge: undefined,
      palace,
      riskLevel: tagToRisk(tag),
      tag: tag ?? undefined,
    };
    const summary = buildYearDecisionSummary(currentYearItem, decisionMatrix);
    yearDecisionSummaryBlock = formatYearDecisionSummaryBlock(summary);
  }

  return { keyYearsDecisionTimeline, yearDecisionSummaryBlock };
}

/** P2 inject：補上決策時間軸／今年摘要；不覆寫已由 V2 寫入的 yearDecisionSummaryBlock。 */
export function mergeInjectP2TimeModuleDecisionSnapshot(
  map: Record<string, string>,
  snap: TimeModuleDecisionSnapshot | undefined
): void {
  if (!snap) return;
  if ((snap.keyYearsDecisionTimeline ?? "").trim()) map.keyYearsDecisionTimeline = snap.keyYearsDecisionTimeline;
  if ((snap.yearDecisionSummaryBlock ?? "").trim() && !(map.yearDecisionSummaryBlock ?? "").trim()) {
    map.yearDecisionSummaryBlock = snap.yearDecisionSummaryBlock;
  }
}
