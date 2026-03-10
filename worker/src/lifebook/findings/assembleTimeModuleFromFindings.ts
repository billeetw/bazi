/**
 * P2: 模組二章節（s15/s18/s19/s20/s21）只讀 LifebookFindings 產出 placeholder 對照表。
 * s15/s18/s20 由專用 assembler 產出（只讀 selectors + 少量 chart 時間骨架）；此處只做合併與 s19/s21。
 */

import type { LifebookFindings } from "../lifebookFindings.js";
import type { NormalizedChart } from "../normalizedChart.js";
import { assembleS15 } from "../assemblers/assembleS15.js";
import { assembleS18 } from "../assemblers/assembleS18.js";
import { assembleS20 } from "../assemblers/assembleS20.js";

export interface TimeModulePlaceholderMap {
  currentDecadalPalace?: string;
  currentDecadalTheme?: string;
  currentDecadalHomework?: string;
  yearRoleInDecade?: string;
  yearOneLineAdvice?: string;
  /** s15 */
  s15MainBattlefield?: string;
  s15SecondaryBattlefield?: string;
  yearRoleWhy?: string;
  s15TopCrossChartSynthesis?: string;
  s15TopCrossChartAdvice?: string;
  mineBlocks?: string;
  wealthBlocks?: string;
  shockBlocks?: string;
  recurringHomeworkNarrative?: string;
  s15ActionNow?: string;
  s15ActionOneYear?: string;
  s15ActionDecade?: string;
  s15ClosingLesson?: string;
  s15ClosingNowSee?: string;
  /** s18 */
  s18BlindSpotLine?: string;
  s18BodyLine?: string;
  s18AdviceLine?: string;
  /** s19 */
  s19ActionNow?: string;
  s19LongTerm?: string;
  s19Avoid?: string;
  /** s20 */
  s20BenmingLine?: string;
  s20DecadalLine?: string;
  s20YearLine?: string;
  s20CrossChartLine?: string;
  /** s21 */
  s21LifelongLesson?: string;
  s21NowSee?: string;
  [key: string]: string | undefined;
}

/** 從 context 組出 assembler 用的最小 chart（僅 currentDecade）。 */
function minimalChartFromContext(context: { currentDecadePalace?: string }): NormalizedChart {
  return {
    chartId: "",
    locale: "zh-TW",
    mingGong: "命宮",
    palaces: [],
    natalTransforms: [],
    decadalLimits: [],
    currentDecade: context.currentDecadePalace
      ? { palace: context.currentDecadePalace, startAge: 0, endAge: 0 }
      : undefined,
  };
}

/**
 * 從 LifebookFindings + 當前時間 context 產出模組二 placeholder 表。
 * s15/s18/s20 由 assembler 產出；s19/s21 與 yearOneLineAdvice 仍由此處填。
 */
export function assembleTimeModuleFromFindings(
  findings: LifebookFindings,
  context: { currentDecadePalace?: string; shenGong?: string; year?: number; nominalAge?: number }
): TimeModulePlaceholderMap {
  const chart = minimalChartFromContext(context);
  const s15Map = assembleS15({ chart, findings });
  const s18Map = assembleS18({ findings });
  const s20Map = assembleS20({ chart, findings });

  const map: TimeModulePlaceholderMap = {
    ...s15Map,
    ...s18Map,
    ...s20Map,
  };

  map.yearOneLineAdvice = findings.actionItems.find((a) => a.horizon === "year")?.do ?? "穩住節奏、先守再攻。";

  // s19 行動（仍由此處產出）
  const actionNow = findings.actionItems.filter((a) => a.horizon === "now" || a.horizon === "year").slice(0, 2);
  map.s19ActionNow = actionNow.map((a) => a.do).join("；") || "先穩住節奏。";
  map.s19LongTerm = findings.actionItems.find((a) => a.horizon === "decade")?.do ?? "把十年主線想清楚，再分配力氣。";
  map.s19Avoid = findings.spilloverFindings[0]?.advice ?? "避免在壓力源未處理前，在症狀宮加碼。";

  // s21 靈魂收束
  const lesson = findings.lifeLessons[0];
  map.s21LifelongLesson = lesson?.line ?? "把尊嚴與責任放在對的位置。";
  map.s21NowSee = lesson?.theme ?? "此刻要看清的是主戰場與壓力源。";

  return map;
}
