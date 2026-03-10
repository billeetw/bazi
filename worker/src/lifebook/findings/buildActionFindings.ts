/**
 * Findings Orchestrator v1：行動與功課層組裝。
 * 產出 lifeLessons, actionItems（now / year / decade）。
 */

import type {
  LifeLessonFinding,
  ActionItem,
  CrossChartFinding,
  PalacePatternFinding,
  SpilloverFinding,
  YearSignal,
} from "../lifebookFindings.js";
import type { NormalizedChart } from "../normalizedChart.js";
import { selectTopLifeLessons } from "./findingsSelectors.js";

export interface BuildActionFindingsInput {
  chart: NormalizedChart;
  crossChartFindings: CrossChartFinding[];
  lifeLessonsFromCrossChart: LifeLessonFinding[];
  palacePatterns: PalacePatternFinding[];
  spilloverFindings: SpilloverFinding[];
  yearSignals: YearSignal[];
}

export interface BuildActionFindingsResult {
  lifeLessons: LifeLessonFinding[];
  actionItems: ActionItem[];
}

const MAX_LESSONS = 5;

export function buildActionFindings(input: BuildActionFindingsInput): BuildActionFindingsResult {
  const lifeLessons: LifeLessonFinding[] = [];

  if (input.palacePatterns.length > 0) {
    const first = input.palacePatterns[0];
    lifeLessons.push({
      theme: first.palace + " " + (first.mainStar ?? ""),
      line: first.lifePattern,
      source: "palacePattern",
    });
  }
  lifeLessons.push(...input.lifeLessonsFromCrossChart);
  const lifeLessonsOut = selectTopLifeLessons(lifeLessons, MAX_LESSONS);

  const actionItems: ActionItem[] = [];

  // now：red signal、當前 spillover、高 shock crossChart（施工圖 v1：label, narrative, source）
  const redSignal = input.yearSignals.find((y) => y.color === "red");
  if (redSignal) {
    const doText = redSignal.advice;
    actionItems.push({
      horizon: "now",
      label: redSignal.label,
      narrative: doText + (redSignal.label ? `（${redSignal.label}）` : ""),
      source: "actionBuilder",
      do: doText,
      avoid: "重大決策",
      why: redSignal.label,
    });
  }
  const topSpillover = input.spilloverFindings[0];
  if (topSpillover) {
    const doText = topSpillover.advice;
    actionItems.push({
      horizon: "decade",
      label: "長線提醒",
      narrative: doText + " " + (topSpillover.narrative ?? topSpillover.diagnosis),
      source: "actionBuilder",
      do: doText,
      why: topSpillover.narrative ?? topSpillover.diagnosis,
    });
  }
  const highShockCross = input.crossChartFindings.find((c) => c.shockLevel >= 3);
  if (highShockCross && !actionItems.some((a) => a.do === highShockCross.advice)) {
    const doText = highShockCross.advice ?? "先回到壓力源處理，再處理症狀宮。";
    actionItems.push({
      horizon: "now",
      label: "高壓交會",
      narrative: doText + " " + highShockCross.synthesis,
      source: "actionBuilder",
      do: doText,
      why: highShockCross.synthesis,
    });
  }

  // 1year：從 yearSignals 補（施工圖 v1）
  for (const y of input.yearSignals.slice(0, 2)) {
    if (actionItems.some((a) => a.do === y.advice)) continue;
    actionItems.push({
      horizon: "year",
      label: y.label,
      narrative: y.advice,
      source: "actionBuilder",
      do: y.advice,
      avoid: y.color === "red" ? "重大決策" : undefined,
    });
  }

  // 若尚無 now/year，補預設
  if (!actionItems.some((a) => a.horizon === "now")) {
    actionItems.push({
      horizon: "now",
      label: "當下",
      narrative: "穩住節奏、先守再攻。先看清主戰場再分配力氣。",
      source: "actionBuilder",
      do: "穩住節奏、先守再攻。",
      why: "先看清主戰場再分配力氣。",
    });
  }
  if (!actionItems.some((a) => a.horizon === "year")) {
    actionItems.push({
      horizon: "year",
      label: "今年",
      narrative: "對照大限與小限，有意識分配精力。",
      source: "actionBuilder",
      do: "對照大限與小限，有意識分配精力。",
    });
  }

  return {
    lifeLessons: lifeLessonsOut,
    actionItems,
  };
}
