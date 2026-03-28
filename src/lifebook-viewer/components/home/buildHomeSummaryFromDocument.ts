import type { LifeBookUserSection, LifeBookViewerState } from "../../types";
import { SECTION_ORDER } from "../../constants";
import type { PalaceId } from "../../themes/palaceVisualTheme";
import { resolvePalacePreset } from "../../themes/palaceThemePresets";
import { buildRootBlueprintHeroFromChart } from "../../utils/rootBlueprintFromChart";
import { DEFAULT_HOME_SUMMARY } from "./defaultHomeSummary";
import type { HomeMonthItem, HomeSummary, HomeTimelineNode, RevelationContent, TimelineNodeCta } from "./types";
import { computeHomeAuditCta } from "./computeHomeAuditCta";
import { computePalaceMatrixHighlight } from "./computePalaceMatrixHighlight";
import { computeTimelineNodeCta } from "./computeTimelineNodeCta";
import type { ViewSignal, ViewStatus } from "../../viewmodels/contracts";
import { resolveGateContract } from "../../viewmodels/contracts";
import { resolveSignals, viewSignalsToDisplaySignals } from "../../viewmodels/signalResolver";
import { buildTimelineDecisionTask } from "../../decision/timelineDecisionTask";

function firstSentence(text: string | undefined, fallback: string): string {
  const t = String(text ?? "").trim();
  if (!t) return fallback;
  const cut = t.split(/[。！？\n]/).find((x) => x.trim().length > 0);
  return (cut ?? t).trim();
}

function pickPrimarySection(sections: Record<string, LifeBookUserSection>): LifeBookUserSection | null {
  for (const key of SECTION_ORDER) {
    if (sections[key]) return sections[key];
  }
  const first = Object.keys(sections)[0];
  return first ? sections[first] : null;
}

function buildNodeRevelation(section: LifeBookUserSection | null, title: string, subtitle: string): RevelationContent {
  if (!section) {
    return {
      title,
      subtitle,
      prophecy: DEFAULT_HOME_SUMMARY.oracle.prophecy,
      ctaLabel: "解鎖完整命書",
    };
  }
  return {
    kind: "node",
    title,
    subtitle,
    palaceLabel: section.title,
    prophecy: firstSentence(section.structure_analysis, DEFAULT_HOME_SUMMARY.oracle.prophecy),
    doomSummary: firstSentence(section.blind_spots, ""),
    ctaLabel: "查看完整章節",
  };
}

function parseYearFromChart(chart: Record<string, unknown> | null): number {
  if (!chart) return new Date().getFullYear();
  const y1 = Number((chart.yearlyHoroscope as { year?: unknown } | undefined)?.year);
  if (Number.isFinite(y1) && y1 > 1900 && y1 < 2200) return y1;
  const y2 = Number((chart.liunian as { year?: unknown } | undefined)?.year);
  if (Number.isFinite(y2) && y2 > 1900 && y2 < 2200) return y2;
  return new Date().getFullYear();
}

function parseDecadalYears(chart: Record<string, unknown> | null, currentYear: number): number[] {
  if (!chart) return [currentYear, currentYear + 1];
  const limits = chart.decadalLimits;
  if (!Array.isArray(limits) || limits.length === 0) return [currentYear, currentYear + 1];
  const current = limits.find((x) => {
    if (!x || typeof x !== "object") return false;
    const s = Number((x as { startAge?: unknown }).startAge);
    const e = Number((x as { endAge?: unknown }).endAge);
    if (!Number.isFinite(s) || !Number.isFinite(e)) return false;
    // chart 年齡未知時，取第一段視為當前段
    return s <= 60 && e >= 20;
  }) as { startAge?: number; endAge?: number } | undefined;
  const next = limits[1] as { startAge?: unknown } | undefined;
  const nextOffset = Number(next?.startAge);
  const curOffset = Number(current?.startAge);
  if (Number.isFinite(nextOffset) && Number.isFinite(curOffset)) {
    const shift = Math.max(1, Math.round(nextOffset - curOffset));
    return [currentYear, currentYear + shift];
  }
  return [currentYear, currentYear + 10];
}

function splitToLines(text: string | undefined): string[] {
  return String(text ?? "")
    .split(/[。\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function monthNumToLabel(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return "關鍵月";
  return `${String(Math.floor(n)).padStart(2, "0")}月`;
}

function extractMonthPreviewFromS19OrTimeModule(
  state: LifeBookViewerState,
  yearCurrent: number,
  risk: string[],
  stable: string[]
): HomeMonthItem[] {
  const s19 = state.sections?.s19;
  const tech = s19?.technical as Record<string, unknown> | undefined;
  const liunian = (tech?.liunian ?? state.chart_json?.liunian) as Record<string, unknown> | undefined;
  const yearly = (tech?.yearly_horoscope ?? state.chart_json?.yearlyHoroscope) as Record<string, unknown> | undefined;

  // 1) 優先：若有 monthlyHoroscope，抽本月作為 preview#1
  const monthly = (
    (state.chart_json?.ziwei as Record<string, unknown> | undefined)?.monthlyHoroscope ??
    (state.chart_json as Record<string, unknown> | undefined)?.monthlyHoroscope
  ) as Record<string, unknown> | undefined;
  const monthlyMonth = monthly?.solarMonth ?? monthly?.month;
  const monthlyPalace = String(monthly?.palace ?? liunian?.palace ?? yearly?.destinyPalace ?? "").trim();
  const first: HomeMonthItem = {
    id: `m${yearCurrent}-m1`,
    month: monthNumToLabel(monthlyMonth),
    label: monthlyMonth != null ? `${monthNumToLabel(monthlyMonth)} · 時間模組` : "關鍵月 A",
    summary: monthlyPalace ? `${monthlyPalace}引動，先穩節奏再推進。` : "時間模組顯示本月需先控節奏。",
    risk: risk.length > 0 ? "danger" : "neutral",
    severity: risk.length > 0 ? "high" : "medium",
    kind: risk.length > 0 ? "alert" : "career",
    actionTarget: "s19",
  };

  // 2) 次優先：s19 文本抽一句作為 preview#2
  const s19Summary = splitToLines(s19?.strategic_advice)[0] ?? splitToLines(s19?.structure_analysis)[0] ?? "";
  const second: HomeMonthItem = {
    id: `m${yearCurrent}-m2`,
    month: "次月",
    label: "關鍵月 B",
    summary: s19Summary || "本年後半段可逐步擴張成果，留意風險轉折。",
    risk: stable.length > 0 ? "wealth" : "neutral",
    severity: stable.length > 0 ? "medium" : "low",
    kind: stable.length > 0 ? "wealth" : "career",
    actionTarget: "s19",
  };

  return [first, second];
}

export function buildHomeSummaryFromDocument(state: LifeBookViewerState): HomeSummary {
  const sections = state.sections ?? {};
  const primary = pickPrimarySection(sections);
  const risk = (state.weight_analysis?.risk_palaces ?? []).slice(0, 3);
  const stable = (state.weight_analysis?.stable_palaces ?? []).slice(0, 3);
  const chart = state.chart_json ?? null;
  const year = parseYearFromChart(chart);
  const [yearCurrent, yearNext] = parseDecadalYears(chart, year);
  const signalResult = primary
    ? resolveSignals({
        sectionKey: primary.section_key,
        section: primary,
        chartJson: chart,
        weight: state.weight_analysis ?? null,
      })
    : {
        status: "neutral" as ViewStatus,
        signals: ["career"] as ViewSignal[],
        displaySignals: viewSignalsToDisplaySignals(["career"], "keyword-fallback"),
        sourceTrace: { status: "keyword-fallback" as const, signals: "keyword-fallback" as const },
      };
  const signals = [...signalResult.signals];
  const nextSection = sections.s19 ?? primary;
  const nextSignalResult =
    nextSection != null
      ? resolveSignals({
          sectionKey: nextSection.section_key,
          section: nextSection,
          chartJson: chart,
          weight: state.weight_analysis ?? null,
        })
      : signalResult;
  const nextGateContract = resolveGateContract(state.meta, "s19");
  const nextGate = nextGateContract.gate;
  const nextLocked = nextGateContract.isLocked;
  const progressPercent = Math.max(0, Math.min(100, Math.round(((new Date().getMonth() + 1) / 12) * 100)));

  const oracleTitle = primary?.title ?? DEFAULT_HOME_SUMMARY.oracle.title;
  const oracleProphecy = firstSentence(primary?.structure_analysis, DEFAULT_HOME_SUMMARY.oracle.prophecy);
  const oracleDo =
    primary?.strategic_advice
      ?.split(/[，、。]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 3) ?? DEFAULT_HOME_SUMMARY.oracle.doItems;
  const oracleDont =
    primary?.blind_spots
      ?.split(/[，、。]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 3) ?? DEFAULT_HOME_SUMMARY.oracle.dontItems;
  const cardDesc = firstSentence(primary?.behavior_pattern, DEFAULT_HOME_SUMMARY.cardDescription);

  const auditCta = computeHomeAuditCta(state, {
    title: oracleTitle,
    prophecy: oracleProphecy,
    doItems: oracleDo,
    dontItems: oracleDont,
    cardDescription: cardDesc,
  });

  const palaceMatrix = computePalaceMatrixHighlight(state);

  const timeline: HomeTimelineNode[] = [
    {
      id: `y${yearCurrent}`,
      year: yearCurrent,
      label: `${yearCurrent} · 推進`,
      subtitle: "當前主線",
      isCurrent: true,
      branch: "right",
      signals,
      status: "active",
      actionTarget: primary?.section_key ?? "s17",
      isLocked: false,
      gate: "open",
      risk: risk.length > 0 ? "danger" : "wealth",
      symbol: risk.length > 0 ? "災" : "祿",
      monthPreview: extractMonthPreviewFromS19OrTimeModule(state, yearCurrent, risk, stable),
    },
    {
      id: `y${yearNext}`,
      year: yearNext,
      label: `${yearNext} · 盤整`,
      subtitle: "下一階段",
      isCurrent: false,
      branch: "left",
      signals: [...nextSignalResult.signals],
      status: "upcoming",
      actionTarget: "s19",
      isLocked: nextLocked,
      gate: nextGate,
      risk: "wealth",
      symbol: "祿",
      monthPreview: [],
    },
  ];

  const timelineViewerCtas: Record<string, TimelineNodeCta> = {};
  for (const n of timeline) {
    const cta = computeTimelineNodeCta(n, state, palaceMatrix, auditCta, timeline);
    if (cta) timelineViewerCtas[n.id] = cta;
  }

  const decisionTask = buildTimelineDecisionTask(state, { timelineNodeId: `y${yearCurrent}` });

  const rootBlueprintHero = buildRootBlueprintHeroFromChart(chart);
  const rootPrimaryFocus =
    auditCta?.palaceId != null
      ? (() => {
          const row = resolvePalacePreset(auditCta.palaceId as PalaceId);
          const current = timeline.find((n) => n.isCurrent) ?? timeline[0];
          if (!current) return null;
          return {
            reasonLine: auditCta.reasonLine || auditCta.leadLine,
            palaceId: auditCta.palaceId,
            palaceLabelZh: row.displayNameZh,
            timelineNodeId: current.id,
            timelineNodeLabel: current.label,
          };
        })()
      : null;
  const rootTimelinePreview =
    timeline.length > 0
      ? {
          summaryLine: "依你的命盤時間軸節點預覽；完整節點在時間軸展開。",
          nodes: timeline.slice(0, 2).map((n) => ({
            id: n.id,
            year: n.year,
            label: n.label,
            oneLiner: n.monthPreview?.[0]?.summary ?? n.subtitle ?? `${n.year} 主線`,
          })),
        }
      : null;

  return {
    oracle: {
      anchor: `DESTINY CORE ${year}`,
      progressLabel: `歲月流轉 ${progressPercent}%`,
      progressPercent,
      title: oracleTitle,
      prophecy: oracleProphecy,
      doItems: oracleDo,
      dontItems: oracleDont,
      hintText: DEFAULT_HOME_SUMMARY.oracle.hintText,
      warningText:
        risk.length > 0
          ? `近期高壓宮位：${risk.join("、")}。先穩住節奏，再做重大承諾。`
          : DEFAULT_HOME_SUMMARY.oracle.warningText,
    },
    timeline,
    cardTitle: `${yearCurrent} ACTIVE`,
    cardDescription: cardDesc,
    currentNodeId: `y${yearCurrent}`,
    revelationsByNodeId: {
      [`y${yearCurrent}`]: buildNodeRevelation(primary, "今年關鍵節點", "NODE"),
      [`y${yearNext}`]: {
        kind: "fog",
        title: `${yearNext} 軌跡仍籠罩在迷霧中`,
        subtitle: "PREMIUM",
        prophecy: "解鎖後可對齊時間模組與章節上下文，取得下一階段策略。",
        ctaLabel: "解鎖未來年度導航",
      },
    },
    revelationsByMonthId: {
      [`m${yearCurrent}-m2`]: {
        kind: "month",
        title: "季度節點細節",
        subtitle: "TIMELINE",
        prophecy: firstSentence(primary?.strategic_advice, "此節點建議先穩節奏，再擴張。"),
        ctaLabel: "查看完整節點解讀",
      },
    },
    auditCta,
    palaceMatrix,
    timelineViewerCtas,
    decisionTask,
    rootBlueprintHero,
    rootPrimaryFocus,
    rootTimelinePreview,
  };
}

