/**
 * S19 單月最終輸出：總覽 + 主引爆點 + 具體可能 + 關聯事件 + 建議
 * 與 S18 區隔：S18 整體順／卡；S19 本月哪裡最有感、怎麼演。
 */

import type { GongGanFlow } from "../../gonggan-flows.js";
import { getPalaceSemantic } from "../starSemanticDictionary.js";
import type { S18Signals } from "../s18/eventSignals.js";
import type {
  InterpretationRule,
  S18Context,
  S19Context,
  S19MonthlyOutput,
} from "./interpretationRuleTypes.js";
import { buildMonthlyFlowsForS19 } from "./buildMonthlyFlowsForS19.js";
import {
  detectS19ChainTypes,
  pickInterpretationRule,
  resolvePrimaryChain,
  runS19InterpretationEngine,
  sanitizeS19Tone,
  S19_CHAIN_LABELS,
} from "./interpretationEngine.js";
import type { S19ChainType } from "./interpretationRuleTypes.js";
import { INTERPRETATION_RULES_V1 } from "./interpretationRulesOverride.js";
import { INTERPRETATION_RULES_SEED } from "./interpretationRulesSeed.js";
import { runSynthesis } from "./synthesisRules.js";
import {
  buildFlowMonthSolarTermSpanZh,
  resolveFlowMonthSolarYmd,
} from "../../flowMonthContext.js";
import type { NormalizedChart } from "../normalizedChart.js";

function normPalace(p: string): string {
  const s = (p ?? "").trim();
  if (!s) return "";
  return s.endsWith("宮") ? s : `${s}宮`;
}

/** 月支 → 斗數正月起寅之月序 1–12（僅作舊資料 fallback，新盤以 solarYear/solarMonth 為準） */
const BRANCH_TO_MONTH: Record<string, number> = {
  寅: 1, 卯: 2, 辰: 3, 巳: 4, 午: 5, 未: 6, 申: 7, 酉: 8, 戌: 9, 亥: 10, 子: 11, 丑: 12,
};

type MonthlyHoroscopeDisplay = {
  solarYear?: number;
  solarMonth?: number;
  solarDay?: number;
  solarTermSpan?: string;
  year?: number;
  month?: number;
  branch?: string;
};

/** 從 chartJson 取得流月標題：優先西曆錨點 + 節氣區間（與 compute 端 monthlyHoroscope 一致） */
function getMonthDisplay(chartJson: Record<string, unknown> | undefined): string | undefined {
  if (!chartJson) return undefined;
  const z = chartJson.features?.ziwei ?? chartJson.ziwei;
  const zObj = z && typeof z === "object" ? (z as Record<string, unknown>) : undefined;
  const monthly = (zObj?.monthlyHoroscope ?? zObj?.monthly) as MonthlyHoroscopeDisplay | undefined;
  const yearly = (zObj?.yearlyHoroscope ?? chartJson.yearlyHoroscope) as
    | { year?: number }
    | undefined;

  const solarY = monthly?.solarYear;
  const solarM = monthly?.solarMonth;
  if (typeof solarY === "number" && typeof solarM === "number" && solarM >= 1 && solarM <= 12) {
    const line1 = `${solarY}年${solarM}月（西曆）｜流月分析`;
    const span = (monthly?.solarTermSpan ?? "").trim();
    if (span) return `${line1}\n${span}`;
    return line1;
  }

  /** 舊快取／舊 API 未帶 solar 時：用與 compute 相同的錨點規則推算標題，勿把 monthly.month／地支當西曆月誤標「斗數月序」 */
  try {
    const body = chartJson as Record<string, unknown>;
    const { y, m, d } = resolveFlowMonthSolarYmd(body, new Date());
    const line1 = `${y}年${m}月（西曆）｜流月分析`;
    const span = buildFlowMonthSolarTermSpanZh(y, m, d).trim();
    if (span) return `${line1}\n${span}`;
    return line1;
  } catch {
    /* Intl / 環境異常時再退回舊欄位 */
  }

  const year =
    typeof monthly?.year === "number"
      ? monthly.year
      : typeof (zObj?.year as number) === "number"
        ? (zObj.year as number)
        : typeof yearly?.year === "number"
          ? yearly.year
          : undefined;
  let month: number | undefined =
    typeof monthly?.month === "number" ? monthly.month : undefined;
  if (month == null && monthly?.branch) {
    const b = String(monthly.branch).trim();
    month = BRANCH_TO_MONTH[b] ?? undefined;
  }
  if (year != null && month != null && month >= 1 && month <= 12) {
    return `${year}年（斗數月序${month}）｜流月分析（舊版欄位，建議重算命盤以取得西曆錨點與節氣說明）`;
  }
  return undefined;
}

/** 與 interpretationEngine 內 CHAIN_LABELS 對齊的副標 */
const CHAIN_TITLE_SUBLINE: Record<string, string> = {
  忌追忌: "同一類壓力會反覆出現",
  祿被忌壓: "原本的優勢被外在壓力拖住",
  科轉忌: "看似安排好，細節卻容易出錯",
  祿追忌: "機會與代價一起放大",
  科修忌: "有壓力，但還能靠方法慢慢修",
  權推局: "事情不會自己動，要你推",
  祿啟局: "資源感上來，適合開局",
};

const CHAIN_SUMMARY_ONE_LINER: Record<string, string> = {
  忌追忌: "這個月真正有感的，是同一類壓力被反覆放大。",
  祿被忌壓: "這個月的重點，不是沒機會，而是原本的優勢容易被外在壓力拖住。",
  科轉忌: "這個月看起來能穩住的事，執行上反而容易卡。",
  祿追忌: "這個月機會會來，但代價也會跟著放大。",
  科修忌: "這個月壓力與修法並存，適合邊修邊走。",
  權推局: "這個月很多事不會自己動，需要你主動推。",
  祿啟局: "這個月資源感較明顯，適合順勢啟動。",
};

/** 無 chain 時依主星四化類型生成 summary（不再用通用 fallback） */
const SUMMARY_BY_TRANSFORM: Record<string, string> = {
  忌: "這個月真正有感的，不是事情變多，而是內在的壓力與思緒開始被放大。",
  祿: "這個月資源與機會較明顯，適合順勢而為。",
  權: "這個月很多事不會自己動，需要你主動推。",
  科: "這個月看起來能穩住的事，要靠方法與結構慢慢修。",
};

/** 無 chain 時 fallback chain 語義（第二行：星＋宮 之下一定要有 chain 語義） */
const FALLBACK_CHAIN_BY_TRANSFORM: Record<string, string> = {
  忌: "內耗放大｜思緒與壓力會反覆出現",
  祿: "資源引動｜機會與流動較明顯",
  權: "主導引動｜需要主動推進與決策",
  科: "結構引動｜靠方法與規則穩住",
};

const NEGATIVE_CHAINS_FOR_SCENARIO = ["忌追忌", "祿被忌壓", "科轉忌", "祿追忌", "科修忌"];

function palaceTopicLine(palace: string): string {
  const sem = getPalaceSemantic(palace);
  const short = sem?.short?.trim();
  if (short) return short;
  const core = sem?.core?.trim();
  if (core) return core;
  return `${normPalace(palace)}相關主題`;
}

function isPressurePalace(s18: S18Signals | undefined, palace: string): boolean {
  if (!s18) return false;
  const p = normPalace(palace);
  return s18.keyPalaces.strongestPressure.some((x) => normPalace(x) === p);
}

function isOpportunityPalace(s18: S18Signals | undefined, palace: string): boolean {
  if (!s18) return false;
  const p = normPalace(palace);
  return s18.keyPalaces.strongestOpportunity.some((x) => normPalace(x) === p);
}

function getPalaceSignal(s18: S18Signals | undefined, palace: string) {
  if (!s18?.palaces) return undefined;
  const p = normPalace(palace);
  return s18.palaces.find((x) => normPalace(x.palace) === p);
}

/** 流月主引爆 flow 排序：忌+壓力 > 祿+機會 > 科+結構局 > 權+主導局；同分再比 risk、|score|、pattern、規則層級 */
function scorePrimaryFlowCandidate(
  flow: GongGanFlow,
  s18: S18Signals | undefined,
  ctx: { chainTypesInternal: S19ChainType[] },
  overrideRules: InterpretationRule[],
  seedRules: InterpretationRule[]
): {
  tier: number;
  risk: number;
  absScore: number;
  hasPattern: number;
  ruleRank: number;
  baseWeight: number;
} {
  const to = normPalace(flow.toPalace);
  const sig = getPalaceSignal(s18, to);
  const risk = sig?.risk ?? 0;
  const score = sig?.score ?? 0;
  const patternId = sig?.pattern?.id ?? "none";
  const hasPattern = patternId !== "none" ? 1 : 0;

  const s18Bias =
    isPressurePalace(s18, to) ? "pressure" : isOpportunityPalace(s18, to) ? "opportunity" : ("neutral" as const);
  const ruleCtx = { s18Bias, chainTypes: ctx.chainTypesInternal };
  const override = pickInterpretationRule(overrideRules, flow.star, flow.transform, to, ruleCtx);
  const seed =
    !override && pickInterpretationRule(seedRules, flow.star, flow.transform, to, ruleCtx);
  const rule = override ?? seed ?? null;
  const ruleRank = override ? 2 : seed ? 1 : 0;
  const baseWeight = rule?.baseWeight ?? 0;

  let tier = 0;
  if (flow.transform === "忌" && isPressurePalace(s18, to)) tier = 4;
  else if (flow.transform === "祿" && isOpportunityPalace(s18, to)) tier = 3;
  else if (
    flow.transform === "科" &&
    sig &&
    (sig.structure >= 1 || patternId === "double_ke" || patternId === "ke_ji_coexist")
  )
    tier = 2;
  else if (flow.transform === "權" && sig && (patternId === "power_strong" || sig.power >= 2)) tier = 1;

  return {
    tier,
    risk,
    absScore: Math.abs(score),
    hasPattern,
    ruleRank,
    baseWeight,
  };
}

function comparePrimaryCandidates(
  a: ReturnType<typeof scorePrimaryFlowCandidate>,
  b: ReturnType<typeof scorePrimaryFlowCandidate>
): number {
  if (b.tier !== a.tier) return b.tier - a.tier;
  if (b.risk !== a.risk) return b.risk - a.risk;
  if (b.absScore !== a.absScore) return b.absScore - a.absScore;
  if (b.hasPattern !== a.hasPattern) return b.hasPattern - a.hasPattern;
  if (b.ruleRank !== a.ruleRank) return b.ruleRank - a.ruleRank;
  return b.baseWeight - a.baseWeight;
}

function pickPrimaryMonthFlow(
  monthFlows: GongGanFlow[],
  s18: S18Signals | undefined,
  chainTypesInternal: S19ChainType[],
  overrideRules: InterpretationRule[],
  seedRules: InterpretationRule[]
): GongGanFlow | undefined {
  if (!monthFlows.length) return undefined;
  const scored = monthFlows.map((flow) => ({
    flow,
    s: scorePrimaryFlowCandidate(flow, s18, { chainTypesInternal }, overrideRules, seedRules),
  }));
  scored.sort((x, y) => comparePrimaryCandidates(x.s, y.s));
  return scored[0]?.flow;
}

function flowsEqual(a: GongGanFlow, b: GongGanFlow): boolean {
  return (
    normPalace(a.toPalace) === normPalace(b.toPalace) &&
    a.star === b.star &&
    a.transform === b.transform &&
    normPalace(a.fromPalace) === normPalace(b.fromPalace)
  );
}

/** 最多 3 條：base 1～2 + 壓力／機會／負向 chain 補一條 + 可選「若…」一句 */
function pickMonthlyScenariosMax3(
  rule: InterpretationRule | null,
  s18: S18Context,
  s19: S19Context,
  fallbackLines: string[]
): string[] {
  const out: string[] = [];
  const negChain =
    !!s19.primaryChain && NEGATIVE_CHAINS_FOR_SCENARIO.includes(s19.primaryChain);
  const chainNeg = s19.chainTypes?.some((c) => NEGATIVE_CHAINS_FOR_SCENARIO.includes(c)) ?? false;

  if (rule) {
    out.push(...rule.baseScenarios.slice(0, 2));
    if (s18.isPressurePalace && rule.negativeScenarios.length) {
      out.push(rule.negativeScenarios[0]!);
    } else if (s18.isOpportunityPalace && rule.positiveScenarios.length) {
      out.push(rule.positiveScenarios[0]!);
    } else if ((negChain || chainNeg) && rule.negativeScenarios.length) {
      out.push(rule.negativeScenarios[0]!);
    }

    const conditionalPool = [...rule.negativeScenarios, ...rule.positiveScenarios, ...rule.baseScenarios];
    const ifLine = conditionalPool.find((t) => /^若/.test((t ?? "").trim()));
    if (ifLine && out.length < 3 && !out.some((x) => x === ifLine)) {
      out.push(ifLine);
    }
  } else {
    out.push(...fallbackLines.slice(0, 3));
  }

  const seen = new Set<string>();
  const dedup: string[] = [];
  for (const t of out) {
    const u = (t ?? "").trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    dedup.push(sanitizeS19Tone(u));
    if (dedup.length >= 3) break;
  }
  return dedup.slice(0, 3);
}

function firstSentenceOneLine(text: string): string {
  const t = sanitizeS19Tone((text ?? "").trim());
  if (!t) return "";
  const parts = t.split(/[。；]/).map((s) => s.trim()).filter(Boolean);
  const first = parts[0] ?? t;
  return first.endsWith("。") || first.endsWith("；") ? first : `${first}。`;
}

/** 關聯事件因果句：由於焦點在 primary 宮，故 synthesis 描述成立 */
function buildSynthesisCausal(
  primaryPalace: string,
  _title: string,
  description: string
): string {
  const desc = (description ?? "").trim();
  if (!desc) return `由於壓力與焦點集中在${primaryPalace}，會牽動其他面向。`;
  return `由於壓力集中在${primaryPalace}，${desc}`;
}

function buildChainTitle(primaryChain: string | undefined, transform: string): string {
  if (primaryChain) {
    const sub = CHAIN_TITLE_SUBLINE[primaryChain];
    if (sub) return `${primaryChain}｜${sub}`;
  }
  return FALLBACK_CHAIN_BY_TRANSFORM[transform] ?? FALLBACK_CHAIN_BY_TRANSFORM["忌"];
}

/** 依 chain 或忌類型生成，不再用通用 fallback */
function buildSummary(primaryChain: string | undefined, transform: string): string {
  if (primaryChain) return CHAIN_SUMMARY_ONE_LINER[primaryChain] ?? SUMMARY_BY_TRANSFORM[transform];
  return SUMMARY_BY_TRANSFORM[transform] ?? SUMMARY_BY_TRANSFORM["忌"];
}

function computeConfidence(params: {
  usedFallback: boolean;
  matchedRuleLayer: "override" | "seed" | "fallback";
  primaryChain?: string;
  flow: GongGanFlow;
  s18: S18Signals | undefined;
  toPalace: string;
}): "low" | "medium" | "high" {
  const { usedFallback, matchedRuleLayer, primaryChain, flow, s18, toPalace } = params;
  if (usedFallback || matchedRuleLayer === "fallback") return "low";

  const pressure = isPressurePalace(s18, toPalace);
  const opportunity = isOpportunityPalace(s18, toPalace);
  const s18Supports =
    (flow.transform === "忌" && pressure) ||
    (flow.transform === "祿" && opportunity) ||
    (flow.transform === "權" || flow.transform === "科") ||
    (!pressure && !opportunity);

  const chainClear = !!primaryChain?.trim();

  if (matchedRuleLayer === "override" && chainClear && s18Supports) return "high";
  if (matchedRuleLayer === "override" && chainClear) return "high";
  if (matchedRuleLayer === "override") return "medium";
  return "medium";
}

export interface BuildS19MonthlyOutputOpts {
  chartJson?: Record<string, unknown>;
  s18Signals?: S18Signals;
  monthlyFlowsOverride?: GongGanFlow[];
  overrideRules?: InterpretationRule[];
  seedRules?: InterpretationRule[];
}

const EMPTY_OUTPUT: S19MonthlyOutput = {
  summary: sanitizeS19Tone("流月資料不足，暫無法組裝本月引爆點。"),
  primary: {
    palace: "—",
    palaceTopic: "—",
    triggerTitle: "—",
    chainTitle: "—",
    narrative: sanitizeS19Tone("請確認命盤已帶入流月（monthlyHoroscope）後再試。"),
    scenarios: [],
    actionHint: sanitizeS19Tone("先補齊流月資料。"),
  },
  meta: {
    triggerSource: "month",
    confidence: "low",
  },
};

/** 將 S19 單月輸出格式化成命書章節用的一整段文字（月份 → 總覽 → 主引爆點兩行 → 更具體可能 → 關聯事件＋因果句 → 本月建議） */
export function formatS19MonthlyOutputToCard(out: S19MonthlyOutput): string {
  const lines: string[] = [];
  lines.push("【流月引爆點】", "");
  if (out.monthDisplay) lines.push(out.monthDisplay, "");
  lines.push(out.summary, "");
  lines.push(
    "本月最有感：" + out.primary.palace + "｜" + out.primary.palaceTopic,
    "",
    out.primary.triggerTitle,
    out.primary.chainTitle
  );
  lines.push("", out.primary.narrative, "");
  if (out.primary.scenarios.length > 0) {
    lines.push("更具體可能發生：");
    out.primary.scenarios.forEach((s) => lines.push("- " + s));
    lines.push("");
  }
  if (out.synthesis) {
    lines.push("關聯事件：", out.synthesis.title, "");
    if (out.synthesis.causalSentence) lines.push(out.synthesis.causalSentence, "");
    lines.push(out.synthesis.description, "");
    if (out.synthesis.scenarios?.length) {
      out.synthesis.scenarios.forEach((s) => lines.push("- " + s));
      lines.push("");
    }
  }
  lines.push("本月建議：", out.primary.actionHint);
  return lines.join("\n").trim();
}

/**
 * 組裝單月 S19 卡片式輸出（1 主宮、scenarios≤3、synthesis≤1、summary／actionHint 各一句為主）
 */
export function buildS19MonthlyOutput(opts: BuildS19MonthlyOutputOpts): S19MonthlyOutput {
  const overrideRules = opts.overrideRules ?? INTERPRETATION_RULES_V1;
  const seedRules = opts.seedRules ?? INTERPRETATION_RULES_SEED;
  const allMonthly =
    opts.monthlyFlowsOverride ?? buildMonthlyFlowsForS19(opts.chartJson as Record<string, unknown> | undefined);
  const monthOnly = allMonthly.filter((f) => f.layer === "month");
  if (!monthOnly.length) return EMPTY_OUTPUT;

  const fromPalace = normPalace(monthOnly[0]!.fromPalace);
  const chainTypesInternal = detectS19ChainTypes(monthOnly, {
    triggerPalace: fromPalace,
    s18: opts.s18Signals,
  });
  const chainTypes = chainTypesInternal.map((c) => S19_CHAIN_LABELS[c]);
  const primaryChain = resolvePrimaryChain(chainTypes);

  const primaryFlow = pickPrimaryMonthFlow(
    monthOnly,
    opts.s18Signals,
    chainTypesInternal,
    overrideRules,
    seedRules
  );
  if (!primaryFlow) return EMPTY_OUTPUT;

  const engineOut = runS19InterpretationEngine({
    triggerPalace: fromPalace,
    chartJson: opts.chartJson,
    s18Signals: opts.s18Signals,
    overrideRules,
    seedRules,
    monthlyFlowsOverride: allMonthly,
  });

  const interp =
    engineOut.interpretations.find((i) => flowsEqual(i.flow, primaryFlow)) ?? engineOut.interpretations[0];
  if (!interp) return EMPTY_OUTPUT;

  const toPalace = normPalace(primaryFlow.toPalace);
  const triggerTitle = `${primaryFlow.star}化${primaryFlow.transform}引動${toPalace}`;
  const palaceTopic = palaceTopicLine(toPalace);
  const summary = buildSummary(primaryChain, primaryFlow.transform);
  const chainTitle = buildChainTitle(primaryChain, primaryFlow.transform);

  const s18Context: S18Context = {
    isOpportunityPalace: isOpportunityPalace(opts.s18Signals, toPalace),
    isPressurePalace: isPressurePalace(opts.s18Signals, toPalace),
    risk: getPalaceSignal(opts.s18Signals, toPalace)?.risk,
    pattern: getPalaceSignal(opts.s18Signals, toPalace)?.pattern?.id,
  };
  const s19Context: S19Context = {
    chainTypes,
    primaryChain,
    triggerTransform: primaryFlow.transform,
  };

  const ruleOverride = pickInterpretationRule(
    overrideRules,
    primaryFlow.star,
    primaryFlow.transform,
    toPalace,
    {
      s18Bias:
        s18Context.isPressurePalace ? "pressure" : s18Context.isOpportunityPalace ? "opportunity" : "neutral",
      chainTypes: chainTypesInternal,
    }
  );
  const ruleSeed =
    !ruleOverride &&
    pickInterpretationRule(seedRules, primaryFlow.star, primaryFlow.transform, toPalace, {
      s18Bias:
        s18Context.isPressurePalace ? "pressure" : s18Context.isOpportunityPalace ? "opportunity" : "neutral",
      chainTypes: chainTypesInternal,
    });
  const rule = ruleOverride ?? ruleSeed ?? null;

  const scenarios = pickMonthlyScenariosMax3(rule, s18Context, s19Context, interp.concretePossibilities);

  const narrative = sanitizeS19Tone(interp.narrative);
  const actionHint = firstSentenceOneLine(interp.actionHint);

  const triggeredPalaces = [...new Set(monthOnly.map((f) => normPalace(f.toPalace)))];
  const syn = runSynthesis(triggeredPalaces, monthOnly);
  const synthesis = syn
    ? {
        title: syn.result.title,
        description: syn.result.description,
        causalSentence: buildSynthesisCausal(toPalace, syn.result.title, syn.result.description),
        scenarios: syn.result.scenarios.slice(0, 3),
        actionHint: syn.result.actionHint ? firstSentenceOneLine(syn.result.actionHint) : undefined,
      }
    : undefined;

  const confidence = computeConfidence({
    usedFallback: interp.usedFallback,
    matchedRuleLayer: interp.matchedRuleLayer,
    primaryChain,
    flow: primaryFlow,
    s18: opts.s18Signals,
    toPalace,
  });

  const monthDisplay = getMonthDisplay(opts.chartJson);

  return {
    ...(monthDisplay ? { monthDisplay } : {}),
    summary: sanitizeS19Tone(summary),
    primary: {
      palace: toPalace,
      palaceTopic,
      triggerTitle,
      chainTitle,
      narrative,
      scenarios,
      actionHint,
    },
    ...(synthesis ? { synthesis } : {}),
    meta: {
      triggerSource: "month",
      triggerTransform: primaryFlow.transform,
      triggerStar: primaryFlow.star,
      chain: primaryChain,
      confidence,
      edgeAuthority: opts.normalizedChart
        ? "normalizedChart_plus_month_gonggan"
        : "chartJson_overlay_plus_month_gonggan",
    },
  };
}
