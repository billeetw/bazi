/**
 * CL3 crossChartEngine：四種高價值時間層疊合成。
 */

import type { CrossChartFinding } from "../../lifebookFindings.js";
import type { PalaceTimelineContext } from "./crossChartTypes.js";

/** 模式 1：同宮本命 + 大限 + 流年 三層疊加 */
export function synthesizeSamePalaceStacking(
  context: PalaceTimelineContext
): CrossChartFinding[] {
  const hasNatal = context.natalPatterns.length > 0;
  const hasDecade = context.decadalPatterns.length > 0;
  const hasYear = context.yearlyPatterns.length > 0;

  if (!(hasNatal && hasDecade && hasYear)) return [];

  return [
    {
      findingId: `stack__${context.palace}`,
      palace: context.palace,
      natalLine: context.natalPatterns[0]?.patternName,
      decadalLine: context.decadalPatterns[0]?.patternName,
      yearlyLine: context.yearlyPatterns[0]?.patternName,
      synthesis: `${context.palace}不是今年才有事，而是本命就有這條線，這十年與今年只是把它推到檯面上。`,
      advice: "不要只處理眼前事件，要處理這個宮位長期反覆出現的模式。",
      shockLevel: 3,
      source: "crossChart",
    },
  ];
}

/** 模式 2：本命有慣性 + 流年高壓觸發 */
export function synthesizeNatalStableYearTrigger(
  context: PalaceTimelineContext
): CrossChartFinding[] {
  const hasNatalBase = context.natalPatterns.length > 0 || context.combinations.length > 0;
  const yearPressure = context.yearlyPatterns.some(
    (p) => p.patternType === "pressure" || p.shockLevel >= 2
  );

  if (!(hasNatalBase && yearPressure)) return [];

  return [
    {
      findingId: `trigger__${context.palace}`,
      palace: context.palace,
      synthesis: `${context.palace}原本就有它的慣性，今年只是把這條線推到更明顯、更不能忽視的位置。`,
      advice: "今年不是第一次出現，而是第一次逼你正視。",
      shockLevel: 2,
      source: "crossChart",
    },
  ];
}

/** 模式 3：同一目標宮被多條 spillover 命中 */
export function synthesizeSpilloverStacking(
  context: PalaceTimelineContext
): CrossChartFinding[] {
  if (context.spilloversIn.length < 2) return [];

  const fromPalaces = [...new Set(context.spilloversIn.map((s) => s.fromPalace))];

  return [
    {
      findingId: `spillover__${context.palace}`,
      palace: context.palace,
      synthesis: `你現在感受到的${context.palace}壓力，不是單點事件，而是${fromPalaces.join("、")}的壓力長期溢進來的結果。`,
      advice: `不要只在${context.palace}止血，要回到壓力源宮位處理。`,
      shockLevel: 3,
      source: "crossChart",
    },
  ];
}

/** 模式 4：大限主題宮 ≠ 流年命宮，主線與感受錯位 */
export function synthesizeDecadeYearMismatch(args: {
  currentDecadePalace?: string;
  yearPalace?: string;
}): CrossChartFinding[] {
  const decade = (args.currentDecadePalace ?? "").trim();
  const year = (args.yearPalace ?? "").trim();
  if (!decade || !year || decade === year) return [];

  return [
    {
      findingId: `decade_year__${decade}__${year}`,
      palace: year,
      synthesis: `這十年的主線在${decade}，但今年你最有感的卻是${year}，所以很多壓力會以${year}的形式浮出來。`,
      advice: "先分清楚主線在哪裡、感受在哪裡，不要把今年的情緒誤認成整個十年的方向。",
      shockLevel: 2,
      source: "crossChart",
    },
  ];
}
