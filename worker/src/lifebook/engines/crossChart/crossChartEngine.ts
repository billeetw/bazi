/**
 * CL3 crossChartEngine：為什麼偏偏是現在？因=本命、緣=大限、果=流年/小限。
 * 時間層疊推理 → CrossChartFinding[]、YearSignal[]、LifeLessonFinding[]。
 */

import type {
  CrossChartFinding,
  LifeLessonFinding,
  YearSignal,
  PalacePatternFinding,
  SpilloverFinding,
  StarCombinationFinding,
} from "../../lifebookFindings.js";
import type { NormalizedChart } from "../../normalizedChart.js";
import { collectPalaceTimelineContexts } from "./crossChartCollector.js";
import {
  synthesizeSamePalaceStacking,
  synthesizeNatalStableYearTrigger,
  synthesizeSpilloverStacking,
  synthesizeDecadeYearMismatch,
} from "./crossChartSynthesizer.js";

export interface CrossChartEngineResult {
  crossChartFindings: CrossChartFinding[];
  yearSignals: YearSignal[];
  lifeLessons: LifeLessonFinding[];
}

function dedupeCrossChartFindings(findings: CrossChartFinding[]): CrossChartFinding[] {
  const seen = new Set<string>();
  const result: CrossChartFinding[] = [];
  for (const f of findings) {
    const key = `${f.palace}__${f.synthesis}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(f);
  }
  return result;
}

export function buildCrossChartEngineResult(args: {
  chart: NormalizedChart;
  palacePatterns: PalacePatternFinding[];
  spillovers: SpilloverFinding[];
  starCombinations: StarCombinationFinding[];
}): CrossChartEngineResult {
  const contexts = collectPalaceTimelineContexts({
    chart: args.chart,
    palacePatterns: args.palacePatterns,
    spillovers: args.spillovers,
    starCombinations: args.starCombinations,
  });

  const crossChartFindings: CrossChartFinding[] = [];
  const yearSignals: YearSignal[] = [];
  const lifeLessons: LifeLessonFinding[] = [];

  for (const context of contexts) {
    crossChartFindings.push(
      ...synthesizeSamePalaceStacking(context),
      ...synthesizeNatalStableYearTrigger(context),
      ...synthesizeSpilloverStacking(context)
    );
  }

  crossChartFindings.push(
    ...synthesizeDecadeYearMismatch({
      currentDecadePalace: args.chart.currentDecade?.palace,
      yearPalace: args.chart.yearlyHoroscope?.destinyPalace,
    })
  );

  const deduped = dedupeCrossChartFindings(crossChartFindings);
  const year = args.chart.flowYear ?? args.chart.yearlyHoroscope?.year ?? new Date().getFullYear();

  for (const finding of deduped) {
    if (finding.shockLevel >= 3) {
      yearSignals.push({
        signalId: `${finding.findingId}__signal`,
        year,
        palace: finding.palace,
        label: "高壓交會點",
        description: finding.synthesis,
        color: "red",
        advice: finding.advice ?? "先回到壓力源處理，再處理症狀宮。",
        shockLevel: finding.shockLevel,
        source: "crossChart",
      });
    }
    lifeLessons.push({
      lessonId: `${finding.findingId}__lesson`,
      theme: finding.palace,
      line: finding.synthesis,
      narrative: finding.synthesis,
      advice: finding.advice,
      palace: finding.palace,
      source: "crossChart",
    });
  }

  return {
    crossChartFindings: deduped,
    yearSignals,
    lifeLessons,
  };
}
