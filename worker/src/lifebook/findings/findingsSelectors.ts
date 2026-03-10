/**
 * Findings Selectors 施工版 v1：把 LifebookFindings 轉成章節 assembler 可直接讀的、已排序已選擇好的內容。
 * 不做新推理，只做：排序、挑選、輕量 fallback、章節適配。
 * 僅時間骨架類 selector 可讀 chart.currentDecade。
 */

import type {
  LifebookFindings,
  MainBattlefield,
  PressureOutlet,
  PalacePatternFinding,
  StarCombinationFinding,
  SpilloverFinding,
  CrossChartFinding,
  LifeLessonFinding,
  KeyYearFinding,
  ActionItem,
} from "../lifebookFindings.js";
import type { NormalizedChart } from "../normalizedChart.js";

// ── 共用 helper：權重與排序 ──

export const PATTERN_TYPE_WEIGHT: Record<string, number> = {
  pressure: 4,
  power: 3,
  correction: 2,
  growth: 1,
};

export const SIGNAL_COLOR_WEIGHT: Record<string, number> = {
  red: 3,
  yellow: 2,
  green: 1,
};

export const KEY_YEAR_LABEL_WEIGHT: Record<string, number> = {
  mine: 3,
  shock: 2,
  opportunity: 1,
};

export function sortByScoreDesc<T>(items: T[], getScore: (item: T) => number): T[] {
  return [...items].sort((a, b) => getScore(b) - getScore(a));
}

export function firstOrUndefined<T>(items?: T[]): T | undefined {
  return items && items.length > 0 ? items[0] : undefined;
}

export function getShockScore(item: { shockLevel?: number }): number {
  return item.shockLevel ?? 0;
}

/** 大限宮對應主題（供 s15 等用） */
const DECADAL_THEME_BY_PALACE: Record<string, string> = {
  命宮: "自我與主線",
  兄弟宮: "手足與戰友",
  夫妻宮: "伴侶與合夥",
  子女宮: "創造與傳承",
  財帛宮: "金錢與資源",
  疾厄宮: "身體與壓力",
  遷移宮: "對外舞台",
  僕役宮: "人際與團隊",
  官祿宮: "事業與成就",
  田宅宮: "根基與安全",
  福德宮: "靈魂休息站",
  父母宮: "根源與權威",
};

/** 依分數選前 N 個主戰場。currentDecade +3, 流年命宮 +2, pattern shock>=2 +2, spillover to +2, starCombo +1, crossChart +2 */
export function selectMainBattlefields(args: {
  chart: NormalizedChart;
  palacePatterns: PalacePatternFinding[];
  starCombinations: StarCombinationFinding[];
  spilloverFindings: SpilloverFinding[];
  crossChartFindings: CrossChartFinding[];
  topN: number;
}): MainBattlefield[] {
  const scores = new Map<string, number>();
  const reasons = new Map<string, string[]>();

  const decadePalace = args.chart.currentDecade?.palace;
  const yearPalace = args.chart.yearlyHoroscope?.destinyPalace ?? "";

  if (decadePalace) {
    scores.set(decadePalace, (scores.get(decadePalace) ?? 0) + 3);
    const r = reasons.get(decadePalace) ?? [];
    if (!r.includes("當前大限")) r.push("當前大限");
    reasons.set(decadePalace, r);
  }
  if (yearPalace) {
    scores.set(yearPalace, (scores.get(yearPalace) ?? 0) + 2);
    const r = reasons.get(yearPalace) ?? [];
    if (!r.includes("流年命宮")) r.push("流年命宮");
    reasons.set(yearPalace, r);
  }

  for (const p of args.palacePatterns) {
    if (p.shockLevel >= 2) {
      scores.set(p.palace, (scores.get(p.palace) ?? 0) + 2);
      const r = reasons.get(p.palace) ?? [];
      if (!r.includes("多層化忌或高壓")) r.push("多層化忌或高壓");
      reasons.set(p.palace, r);
    }
  }
  for (const s of args.spilloverFindings) {
    const to = s.toPalace;
    scores.set(to, (scores.get(to) ?? 0) + 2);
    const r = reasons.get(to) ?? [];
    if (!r.includes("壓力外溢目標宮")) r.push("壓力外溢目標宮");
    reasons.set(to, r);
  }
  for (const c of args.starCombinations) {
    scores.set(c.palace, (scores.get(c.palace) ?? 0) + 1);
    const r = reasons.get(c.palace) ?? [];
    if (!r.includes("星曜組合命中")) r.push("星曜組合命中");
    reasons.set(c.palace, r);
  }
  for (const x of args.crossChartFindings) {
    scores.set(x.palace, (scores.get(x.palace) ?? 0) + 2);
    const r = reasons.get(x.palace) ?? [];
    if (!r.includes("三盤疊加")) r.push("三盤疊加");
    reasons.set(x.palace, r);
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, args.topN);
  const out: MainBattlefield[] = [];
  for (const [palace, score] of sorted) {
    const r = reasons.get(palace) ?? [];
    const layer = palace === decadePalace ? "decade" : palace === yearPalace ? "year" : "natal";
    out.push({
      palace,
      score,
      reasons: r,
      reason: r.length > 0 ? r.join("、") : "四化或疊加命中",
      label: score >= 5 ? "主戰場" : "重點宮",
      layer,
      source: "selector",
    });
  }
  return out;
}

/** 選壓力出口：疾厄/福德 base，pressure pattern，spillover target，stress combo */
export function selectPressureOutlets(args: {
  palacePatterns: PalacePatternFinding[];
  starCombinations: StarCombinationFinding[];
  spilloverFindings: SpilloverFinding[];
  topN: number;
}): PressureOutlet[] {
  const scores = new Map<string, number>();
  const narratives = new Map<string, string>();

  const pressurePalaces = ["疾厄宮", "福德宮", "命宮"];
  for (const p of pressurePalaces) {
    scores.set(p, (scores.get(p) ?? 0) + 2);
  }

  for (const p of args.palacePatterns) {
    if (p.patternType === "pressure" || p.palace === "疾厄宮" || p.palace === "福德宮") {
      scores.set(p.palace, (scores.get(p.palace) ?? 0) + 2);
      const n = p.psychology + "。" + p.lifePattern;
      if (!narratives.get(p.palace)) narratives.set(p.palace, n);
    }
  }
  for (const s of args.spilloverFindings) {
    scores.set(s.toPalace, (scores.get(s.toPalace) ?? 0) + 1);
    if (!narratives.get(s.toPalace)) narratives.set(s.toPalace, s.diagnosis + "。" + s.lifePattern);
  }
  for (const c of args.starCombinations) {
    if (c.patternType === "stress" || c.shockLevel >= 2) {
      scores.set(c.palace, (scores.get(c.palace) ?? 0) + 1);
      if (!narratives.get(c.palace)) narratives.set(c.palace, c.psychology + "。" + c.lifePattern);
    }
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, args.topN);
  const out: PressureOutlet[] = [];
  for (const [palace, score] of sorted) {
    out.push({
      palace,
      pattern: "pressure",
      narrative: narratives.get(palace) ?? "此宮為壓力易顯處。",
      score,
      source: "selector",
      type: "pressure",
      bodySignals: [],
    });
  }
  return out;
}

export function selectTopLifeLessons(
  lessons: LifeLessonFinding[],
  limit: number
): LifeLessonFinding[] {
  return lessons.slice(0, limit);
}

export function selectTopCrossChartFindings(
  findings: CrossChartFinding[],
  limit: number
): CrossChartFinding[] {
  return [...findings].sort((a, b) => b.shockLevel - a.shockLevel).slice(0, limit);
}

export function selectKeyYears(
  keyYears: KeyYearFinding[],
  limit: number
): KeyYearFinding[] {
  return keyYears.slice(0, limit);
}

// ── 共用：最強 spillover / 星曜組合（供 s18/s20 等） ──

export function selectTopPressureSpillover(findings: LifebookFindings): SpilloverFinding | undefined {
  return firstOrUndefined(
    sortByScoreDesc(findings.spilloverFindings ?? [], (s) => s.shockLevel ?? 0)
  );
}

export function selectTopShockCombination(findings: LifebookFindings): StarCombinationFinding | undefined {
  return firstOrUndefined(
    sortByScoreDesc(findings.starCombinations ?? [], (c) => c.shockLevel ?? 0)
  );
}

// ── S15 用 selectors ──

export function selectCurrentDecadeNarrative(
  findings: LifebookFindings,
  chart: NormalizedChart
): {
  decadePalace: string;
  decadeTheme: string;
  coreHomework: string;
  clueLine: string;
} {
  const decadePalace = chart.currentDecade?.palace ?? "命宮";
  const decadeTheme = DECADAL_THEME_BY_PALACE[decadePalace] ?? `${decadePalace}主題`;

  const decadePatterns = sortByScoreDesc(
    (findings.palacePatterns ?? []).filter(
      (p) => p.palace === decadePalace && p.layer === "decade"
    ),
    (p) => (p.shockLevel ?? 0) + (PATTERN_TYPE_WEIGHT[p.patternType] ?? 0)
  );
  const topPattern = firstOrUndefined(decadePatterns);
  const relatedCross = firstOrUndefined(
    (findings.crossChartFindings ?? []).filter((f) => f.palace === decadePalace)
  );

  const homeworkParts: string[] = [];
  homeworkParts.push(`這十年你要演的主題是「${decadeTheme}」。`);
  if (topPattern) {
    homeworkParts.push(topPattern.psychology);
    homeworkParts.push(topPattern.lifePattern);
  }
  if (relatedCross) homeworkParts.push(relatedCross.synthesis);

  const transformSummary = (chart.currentDecade as { transformSummary?: string } | undefined)?.transformSummary ?? "";
  return {
    decadePalace,
    decadeTheme,
    coreHomework: homeworkParts.join(" "),
    clueLine: `${decadePalace}，大限四化：${transformSummary}`.trim(),
  };
}

export function selectTopBattlefieldsForS15(findings: LifebookFindings): {
  main?: MainBattlefield;
  secondary?: MainBattlefield;
} {
  const ranked = sortByScoreDesc(findings.mainBattlefields ?? [], (b) => b.score ?? 0);
  return {
    main: ranked[0],
    secondary: ranked[1],
  };
}

export function selectCurrentYearRole(
  findings: LifebookFindings,
  chart: NormalizedChart
): {
  roleLabel: string;
  shortNarrative: string;
  feltPalace?: string;
  advice?: string;
} {
  const signals = sortByScoreDesc(
    findings.yearSignals ?? [],
    (s) => (SIGNAL_COLOR_WEIGHT[s.color] ?? 0) * 10 + (s.shockLevel ?? 0)
  );
  const topSignal = firstOrUndefined(signals);

  let roleLabel = "調整年";
  if (topSignal?.color === "red") roleLabel = "壓力年";
  else if (topSignal?.color === "yellow") roleLabel = "修正年";
  else if (topSignal?.color === "green") roleLabel = "推進年";

  const feltPalace = chart.yearlyHoroscope?.destinyPalace ?? topSignal?.palace;
  const relatedCross = firstOrUndefined(
    (findings.crossChartFindings ?? []).filter(
      (f) => !feltPalace || f.palace === feltPalace
    )
  );

  return {
    roleLabel,
    shortNarrative:
      relatedCross?.synthesis ??
      topSignal?.description ??
      topSignal?.label ??
      `今年的重點會以${feltPalace ?? "當前年份主題"}的形式浮出來。`,
    feltPalace,
    advice: relatedCross?.advice ?? topSignal?.advice,
  };
}

export function selectTopCrossChartFindingForS15(
  findings: LifebookFindings,
  chart?: NormalizedChart
): CrossChartFinding | undefined {
  const decadePalace = chart?.currentDecade?.palace;
  const yearPalace = chart?.yearlyHoroscope?.destinyPalace;

  const ranked = [...(findings.crossChartFindings ?? [])].sort((a, b) => {
    const aScore =
      (a.shockLevel ?? 0) * 10 +
      (a.palace === decadePalace ? 3 : 0) +
      (a.palace === yearPalace ? 2 : 0);
    const bScore =
      (b.shockLevel ?? 0) * 10 +
      (b.palace === decadePalace ? 3 : 0) +
      (b.palace === yearPalace ? 2 : 0);
    return bScore - aScore;
  });
  return ranked[0];
}

export function selectKeyYearsByLabel(findings: LifebookFindings): {
  mines: KeyYearFinding[];
  opportunities: KeyYearFinding[];
  shocks: KeyYearFinding[];
} {
  const all = findings.keyYears ?? [];
  const mines = sortByScoreDesc(
    all.filter((k) => k.label === "mine" || k.signal === "mine"),
    (k) => k.score ?? 0
  ).slice(0, 3);
  const opportunities = sortByScoreDesc(
    all.filter((k) => k.label === "opportunity" || k.signal === "wealth"),
    (k) => k.score ?? 0
  ).slice(0, 3);
  const shocks = sortByScoreDesc(
    all.filter((k) => k.label === "shock" || k.signal === "shock"),
    (k) => k.score ?? 0
  ).slice(0, 3);
  return { mines, opportunities, shocks };
}

export function selectRecurringLessonForS15(findings: LifebookFindings): {
  narrative: string;
  palace?: string;
  advice?: string;
} {
  const topLesson = firstOrUndefined(findings.lifeLessons ?? []);
  if (topLesson) {
    return {
      narrative: topLesson.narrative ?? topLesson.line,
      palace: topLesson.palace,
      advice: topLesson.advice,
    };
  }
  const topSpillover = selectTopPressureSpillover(findings);
  if (topSpillover) {
    return {
      narrative: `你最容易重演的，不是單純${topSpillover.toPalace}出問題，而是${topSpillover.fromPalace}的壓力一路溢進${topSpillover.toPalace}。`,
      palace: topSpillover.toPalace,
      advice: topSpillover.advice,
    };
  }
  const topCross = firstOrUndefined(findings.crossChartFindings ?? []);
  if (topCross) {
    return {
      narrative: topCross.synthesis,
      palace: topCross.palace,
      advice: topCross.advice,
    };
  }
  return {
    narrative: "這段時間你最容易重演的，往往不是單一事件，而是同一種壓力處理方式反覆出現。",
  };
}

export function selectS15ActionItems(findings: LifebookFindings): {
  now?: ActionItem;
  oneYear?: ActionItem;
  decade?: ActionItem;
} {
  const items = findings.actionItems ?? [];
  const oneYear = firstOrUndefined(items.filter((a) => a.horizon === "1year" || a.horizon === "year"));
  return {
    now: firstOrUndefined(items.filter((a) => a.horizon === "now")),
    oneYear,
    decade: firstOrUndefined(items.filter((a) => a.horizon === "decade")),
  };
}

export function selectClosingForS15(findings: LifebookFindings): {
  lifelongLesson: string;
  nowUnderstanding: string;
} {
  const topLesson = firstOrUndefined(findings.lifeLessons ?? []);
  const topCross = firstOrUndefined(findings.crossChartFindings ?? []);
  const topBattlefield = firstOrUndefined(findings.mainBattlefields ?? []);

  return {
    lifelongLesson:
      topLesson?.narrative ?? topLesson?.line ??
      "你反覆在學的，是同一種壓力會如何在不同場景裡換名字重演。",
    nowUnderstanding:
      topCross?.synthesis ??
      (topBattlefield
        ? `現在最該看懂的，是主戰場其實在${topBattlefield.palace}。`
        : "現在最該看懂的，是不要把眼前症狀誤認成真正的源頭。"),
  };
}

// ── S18 用 selector ──

export function selectBlindSpotFindingForS18(findings: LifebookFindings): {
  titleLine: string;
  blindSpotLine: string;
  adviceLine?: string;
} {
  const topSpillover = selectTopPressureSpillover(findings);
  if (topSpillover) {
    return {
      titleLine: `你最容易誤判的，是以為問題在${topSpillover.toPalace}；`,
      blindSpotLine: `其實真正沒有處理完的壓力，來自${topSpillover.fromPalace}。${topSpillover.lifePattern}`,
      adviceLine: topSpillover.advice,
    };
  }
  const topLesson = firstOrUndefined(findings.lifeLessons ?? []);
  if (topLesson) {
    return {
      titleLine: "你最容易重演的，不是單一事件，而是一種固定的內在反應。",
      blindSpotLine: topLesson.narrative ?? topLesson.line,
      adviceLine: topLesson.advice,
    };
  }
  const topOutlet = firstOrUndefined(
    sortByScoreDesc(findings.pressureOutlets ?? [], (p) => p.score ?? 0)
  );
  if (topOutlet) {
    return {
      titleLine: `這段時間最容易被你忽略的，是壓力最後其實都會從${topOutlet.palace}表現出來。`,
      blindSpotLine: topOutlet.narrative,
    };
  }
  const topCombo = selectTopShockCombination(findings);
  if (topCombo) {
    return {
      titleLine: `你最容易忽略的，不是事件本身，而是${topCombo.patternName}這種反應模式。`,
      blindSpotLine: `${topCombo.psychology} ${topCombo.lifePattern}`,
    };
  }
  return {
    titleLine: "這段時間最需要留意的，是不要把表面事件誤認成真正的問題。",
    blindSpotLine: "很多時候你在處理的是症狀，而不是源頭。",
  };
}

// ── S20 用 selectors ──

export function selectS20BenmingLine(findings: LifebookFindings): {
  line: string;
  palace?: string;
} {
  const natalCombo = selectTopShockCombination(findings);
  if (natalCombo) {
    return {
      line: `本命給你的，是${natalCombo.patternName}這種慣性：${natalCombo.psychology}。${natalCombo.lifePattern}`,
      palace: natalCombo.palace,
    };
  }
  const natalPattern = firstOrUndefined(
    sortByScoreDesc(
      (findings.palacePatterns ?? []).filter((p) => p.layer === "natal"),
      (p) => (p.shockLevel ?? 0) + (PATTERN_TYPE_WEIGHT[p.patternType] ?? 0)
    )
  );
  if (natalPattern) {
    return {
      line: `本命給你的，是在${natalPattern.palace}這一題上，習慣用${natalPattern.patternName}的方式回應世界。`,
      palace: natalPattern.palace,
    };
  }
  const topLesson = firstOrUndefined(findings.lifeLessons ?? []);
  if (topLesson) {
    return {
      line: `本命給你的，是一種反覆會回到原點的內在慣性：${topLesson.narrative ?? topLesson.line}`,
      palace: topLesson.palace,
    };
  }
  return {
    line: "本命給你的，是一種會在熟悉主題上反覆出現的處理慣性。",
  };
}

export function selectS20DecadalLine(
  findings: LifebookFindings,
  chart: NormalizedChart
): {
  line: string;
  palace?: string;
} {
  const topBattlefield = firstOrUndefined(findings.mainBattlefields ?? []);
  if (topBattlefield) {
    const reasons =
      topBattlefield.reasons && topBattlefield.reasons.length > 0
        ? topBattlefield.reasons.join("、")
        : "它成了反覆被點亮的主戰場";
    return {
      line: `這十年大限在練的，是${topBattlefield.palace}這一題：${reasons}。`,
      palace: topBattlefield.palace,
    };
  }
  const decadePattern = firstOrUndefined(
    sortByScoreDesc(
      (findings.palacePatterns ?? []).filter((p) => p.layer === "decade"),
      (p) => (p.shockLevel ?? 0) + (PATTERN_TYPE_WEIGHT[p.patternType] ?? 0)
    )
  );
  if (decadePattern) {
    return {
      line: `這十年被放大的，是${decadePattern.palace}這一題：${decadePattern.lifePattern}`,
      palace: decadePattern.palace,
    };
  }
  const decadePalace = chart.currentDecade?.palace ?? "命宮";
  return {
    line: `這十年真正被放大的，是${decadePalace}這條主線。`,
    palace: decadePalace,
  };
}

export function selectS20YearLine(
  findings: LifebookFindings,
  chart: NormalizedChart
): {
  line: string;
  palace?: string;
} {
  const topCross = firstOrUndefined(findings.crossChartFindings ?? []);
  if (topCross) {
    return {
      line: `今年流年把焦點推到${topCross.palace}，所以很多原本在別處累積的壓力，會以這個領域的形式浮出來。`,
      palace: topCross.palace,
    };
  }
  const topSpill = selectTopPressureSpillover(findings);
  if (topSpill) {
    return {
      line: `今年最有感的，會是${topSpill.toPalace}這一題；但那不只是眼前事件，而是${topSpill.fromPalace}一路溢進來的結果。`,
      palace: topSpill.toPalace,
    };
  }
  const topSignal = firstOrUndefined(findings.yearSignals ?? []);
  const yearPalace = chart.yearlyHoroscope?.destinyPalace;
  if (topSignal) {
    const pal = topSignal.palace ?? yearPalace;
    return {
      line: `今年最有感的，會是${pal ?? "當前年份"}這類議題。${topSignal.description ?? topSignal.label ?? ""}`,
      palace: pal,
    };
  }
  return {
    line: `今年最有感的，會是${yearPalace ?? "當前年份"}這類議題。`,
    palace: yearPalace,
  };
}

export function selectS20TopCrossChart(findings: LifebookFindings): CrossChartFinding | undefined {
  return firstOrUndefined(
    sortByScoreDesc(findings.crossChartFindings ?? [], (f) => f.shockLevel ?? 0)
  );
}
