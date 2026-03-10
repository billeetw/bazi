/**
 * s15 時間主線與功課：只讀 findings + selectors，產出 placeholder map。
 * 不做命理判斷，不現場推 narrative。
 */

import type { LifebookFindings } from "../lifebookFindings.js";
import type { NormalizedChart } from "../normalizedChart.js";
import {
  selectCurrentDecadeNarrative,
  selectTopBattlefieldsForS15,
  selectCurrentYearRole,
  selectTopCrossChartFindingForS15,
  selectKeyYearsByLabel,
  selectRecurringLessonForS15,
  selectS15ActionItems,
  selectClosingForS15,
} from "../findings/findingsSelectors.js";
import { renderKeyYears, safeLine } from "./assembleHelpers.js";

export function assembleS15(args: {
  chart: NormalizedChart;
  findings: LifebookFindings;
}): Record<string, string> {
  const { chart, findings } = args;

  const decade = selectCurrentDecadeNarrative(findings, chart);
  const battlefields = selectTopBattlefieldsForS15(findings);
  const yearRole = selectCurrentYearRole(findings, chart);
  const cross = selectTopCrossChartFindingForS15(findings, chart);
  const keyYears = selectKeyYearsByLabel(findings);
  const recurring = selectRecurringLessonForS15(findings);
  const actions = selectS15ActionItems(findings);
  const closing = selectClosingForS15(findings);

  const decadePalace = chart.currentDecade?.palace ?? "命宮";

  return {
    currentDecadalPalace: safeLine(decade.decadePalace, decadePalace),
    currentDecadalTheme: safeLine(decade.decadeTheme, `${decadePalace}主題`),
    currentDecadalHomework: safeLine(
      decade.coreHomework,
      `這十年主線落在${decadePalace}，先看清主戰場，再決定力氣往哪裡放。`
    ),

    s15MainBattlefield: safeLine(battlefields.main?.palace),
    s15SecondaryBattlefield: safeLine(battlefields.secondary?.palace),

    yearRoleInDecade: safeLine(yearRole.roleLabel, "調整年"),
    yearRoleWhy: safeLine(yearRole.shortNarrative, "今年最有感的，會是流年所帶來的議題。"),

    s15TopCrossChartSynthesis: safeLine(cross?.synthesis),
    s15TopCrossChartAdvice: safeLine(cross?.advice),

    mineBlocks: renderKeyYears(keyYears.mines),
    wealthBlocks: renderKeyYears(keyYears.opportunities),
    shockBlocks: renderKeyYears(keyYears.shocks),

    recurringHomeworkNarrative: safeLine(recurring.narrative),

    s15ActionNow: safeLine(
      actions.now?.narrative ?? actions.now?.do,
      "先做一件對齊今年主線的事，少做一件只是消耗你的事。"
    ),
    s15ActionOneYear: safeLine(
      actions.oneYear?.narrative ?? actions.oneYear?.do,
      "一年內，把力氣集中在最重要的一兩個領域，其他先放著。"
    ),
    s15ActionDecade: safeLine(
      actions.decade?.narrative ?? actions.decade?.do,
      `這十年都要記住：主戰場在${battlefields.main?.palace ?? decadePalace}。`
    ),

    s15ClosingLesson: safeLine(closing.lifelongLesson),
    s15ClosingNowSee: safeLine(closing.nowUnderstanding),
  };
}
