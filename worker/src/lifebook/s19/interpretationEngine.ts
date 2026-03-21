/**
 * S19 斷語規則引擎 v1
 *
 * 流程：
 * 1. 從 trigger palace 篩選流月 flows（fromPalace === triggerPalace）
 * 2. star + transform + toPalace 查規則庫（支援 * 萬用；條件 conditions 可篩規則）
 * 3. 依 S18 壓力／機會宮、鏈類型、trigger 強度加權場景
 * 4. 無命中則 fallback：星曜語義 + 四化語氣 + 宮位主題
 *
 * 語氣：避免「一定、必然、注定」；輸出前 sanitize。
 */

import type { GongGanFlow } from "../../gonggan-flows.js";
import {
  getPalaceSemantic,
  getStarSemantic,
  TRANSFORM_SEMANTIC_DICTIONARY,
} from "../starSemanticDictionary.js";
import type { S18Signals } from "../s18/eventSignals.js";
import { buildMonthlyFlowsForS19 } from "./buildMonthlyFlowsForS19.js";
import type {
  InterpretationBlock,
  InterpretationRule,
  InterpretationRuleConditions,
  S18Context,
  S19ChainType,
  S19Context,
  S19InterpretationEngineOutput,
  S19InterpretationPerFlow,
  S18PalaceBias,
} from "./interpretationRuleTypes.js";
import { PRIMARY_CHAIN_PRIORITY } from "./interpretationRuleTypes.js";
import { INTERPRETATION_RULES_V1 } from "./interpretationRulesOverride.js";
import { INTERPRETATION_RULES_SEED } from "./interpretationRulesSeed.js";

const FORBIDDEN_TONE = /一定|必然|注定/g;

const TRANSFORM_TO_KEY: Record<string, "lu" | "quan" | "ke" | "ji"> = {
  祿: "lu",
  權: "quan",
  科: "ke",
  忌: "ji",
};

/** 輸出前安全網：避免絕對化用語 */
export function sanitizeS19Tone(text: string): string {
  if (!text) return text;
  return text
    .replace(/一定/g, "較容易")
    .replace(/必然/g, "很可能")
    .replace(/注定/g, "傾向");
}

/** 內部 chain key → 中文標籤（供 primaryChain / 月報組裝共用） */
export const S19_CHAIN_LABELS: Record<S19ChainType, string> = {
  ji_chase_ji: "忌追忌",
  lu_pressed_by_ji: "祿被忌壓",
  ke_turns_ji: "科轉忌",
  lu_chase_ji: "祿追忌",
  ke_repair_ji: "科修忌",
  quan_push: "權推局",
  lu_open: "祿啟局",
};

const CHAIN_LABELS = S19_CHAIN_LABELS;

const NEGATIVE_CHAIN_LABELS = ["忌追忌", "祿被忌壓", "科轉忌", "祿追忌", "科修忌"];

/** 依 PRIMARY_CHAIN_PRIORITY 從 chainTypes 取第一條作為 primaryChain */
export function resolvePrimaryChain(chainTypes: string[]): string | undefined {
  return PRIMARY_CHAIN_PRIORITY.find((label) => chainTypes.includes(label));
}

/** 規則命中後依 S18／S19 脈絡選場景；後續可改為 primaryChain 做主文案、chainTypes 做加權 */
export function pickScenarios(
  rule: InterpretationRule,
  s18: S18Context,
  s19: S19Context
): string[] {
  const negativeBias =
    !!s18.isPressurePalace ||
    (s18.risk ?? 0) >= 1 ||
    (s19.primaryChain && NEGATIVE_CHAIN_LABELS.includes(s19.primaryChain)) ||
    (s19.chainTypes?.some((c) => NEGATIVE_CHAIN_LABELS.includes(c)) ?? false);

  const positiveBias = !!s18.isOpportunityPalace && !negativeBias;

  if (negativeBias && rule.negativeScenarios?.length) {
    return [
      ...rule.baseScenarios.slice(0, 2),
      ...rule.negativeScenarios.slice(0, 2),
    ];
  }

  if (positiveBias && rule.positiveScenarios?.length) {
    return [
      ...rule.baseScenarios.slice(0, 2),
      ...rule.positiveScenarios.slice(0, 2),
    ];
  }

  return rule.baseScenarios.slice(0, 3);
}

/** 輸出模板：前端可渲染「更具體可能發生」+「提醒」 */
export function renderInterpretationBlock(
  rule: InterpretationRule,
  scenarios: string[]
): InterpretationBlock {
  return {
    title: rule.title,
    narrative: rule.narrative,
    scenarios: scenarios.map(sanitizeS19Tone),
    actionHint: sanitizeS19Tone(rule.actionHint),
  };
}

function assertNoForbiddenTone(text: string, context: string): void {
  if (FORBIDDEN_TONE.test(text)) {
    console.warn(`[S19] tone check: forbidden wording in ${context}:`, text);
  }
}

function normPalace(p: string): string {
  const s = (p ?? "").trim();
  if (!s) return "";
  return s.endsWith("宮") ? s : `${s}宮`;
}

function matchWild(ruleVal: string, actual: string): boolean {
  const r = (ruleVal ?? "").trim();
  if (r === "*" || r === "") return true;
  return r === actual || normPalace(r) === normPalace(actual);
}

function ruleConditionsMet(
  cond: InterpretationRuleConditions | undefined,
  ctx: {
    s18Bias: S18PalaceBias;
    chainTypes: S19ChainType[];
  }
): boolean {
  if (!cond) return true;
  if (cond.requireS18Bias) {
    if (cond.requireS18Bias === "pressure" && ctx.s18Bias !== "pressure") return false;
    if (cond.requireS18Bias === "opportunity" && ctx.s18Bias !== "opportunity") return false;
  }
  if (cond.requireChainsAll?.length) {
    for (const c of cond.requireChainsAll) {
      if (!ctx.chainTypes.includes(c)) return false;
    }
  }
  if (cond.requireChainsAny?.length) {
    if (!cond.requireChainsAny.some((c) => ctx.chainTypes.includes(c))) return false;
  }
  return true;
}

function ruleSpecificity(rule: InterpretationRule, star: string, palace: string): number {
  let s = 0;
  if (rule.star === "*") s += 0;
  else if (matchWild(rule.star, star)) s += 4;
  else return -1;
  if (rule.palace === "*") s += 0;
  else if (matchWild(rule.palace, palace)) s += 4;
  else return -1;
  return s;
}

/**
 * 選出最適用規則：transform 必須相等；star／palace 支援 *；conditions 需滿足
 */
export function pickInterpretationRule(
  rules: InterpretationRule[],
  star: string,
  transform: GongGanFlow["transform"],
  toPalace: string,
  ctx: { s18Bias: S18PalaceBias; chainTypes: S19ChainType[] }
): InterpretationRule | null {
  const palaceN = normPalace(toPalace);
  const candidates = rules.filter(
    (r) => r.transform === transform && matchWild(r.star, star) && matchWild(r.palace, palaceN) && ruleConditionsMet(r.conditions, ctx)
  );
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const sa = ruleSpecificity(a, star, palaceN);
    const sb = ruleSpecificity(b, star, palaceN);
    if (sb !== sa) return sb - sa;
    return b.baseWeight - a.baseWeight;
  });
  return candidates[0] ?? null;
}

/** 從 trigger 宮取得流月飛星；若無則退回「全部流月」以免空白 */
export function getMonthlyFlowsForTriggerPalace(monthlyFlows: GongGanFlow[], triggerPalace: string): GongGanFlow[] {
  const tp = normPalace(triggerPalace);
  const fromTrigger = monthlyFlows.filter((f) => f.layer === "month" && normPalace(f.fromPalace) === tp);
  if (fromTrigger.length) return fromTrigger;
  return monthlyFlows.filter((f) => f.layer === "month");
}

export interface DetectS19ChainTypesOpts {
  /** 觸發宮（fromPalace）；與 S18 同宮向量對齊 */
  triggerPalace?: string;
  /** S18 宮位向量；有提供時才偵測祿追忌／科修忌／權推局／祿啟局 */
  s18?: S18Signals;
}

/**
 * 偵測流月鏈路（同一批、通常同 fromPalace）：
 * - ji_chase_ji：兩條以上化忌
 * - lu_pressed_by_ji：同一 toPalace 同時有祿與忌
 * - ke_turns_ji：同一 toPalace 同時有科與忌
 * - lu_chase_ji：trigger 宮 resource>=1 且當月有忌
 * - ke_repair_ji：trigger 宮 structure>=1 且 risk>=1，且未達科轉忌
 * - quan_push：trigger 宮 power>=1 且當月有權，且 risk 不高
 * - lu_open：trigger 宮 resource>=1 且當月有祿，且 risk 不高
 */
export function detectS19ChainTypes(
  flows: GongGanFlow[],
  opts?: DetectS19ChainTypesOpts
): S19ChainType[] {
  const month = flows.filter((f) => f.layer === "month");
  const out = new Set<S19ChainType>();
  const ji = month.filter((f) => f.transform === "忌");
  if (ji.length >= 2) out.add("ji_chase_ji");

  const byTo = new Map<string, GongGanFlow[]>();
  for (const f of month) {
    const k = normPalace(f.toPalace);
    const arr = byTo.get(k) ?? [];
    arr.push(f);
    byTo.set(k, arr);
  }
  for (const list of byTo.values()) {
    const t = new Set(list.map((x) => x.transform));
    if (t.has("祿") && t.has("忌")) out.add("lu_pressed_by_ji");
    if (t.has("科") && t.has("忌")) out.add("ke_turns_ji");
  }

  const triggerPalace = opts?.triggerPalace ? normPalace(opts.triggerPalace) : undefined;
  const s18 = opts?.s18;
  if (triggerPalace && s18?.palaces) {
    const sig = s18.palaces.find((p) => normPalace(p.palace) === triggerPalace);
    if (sig) {
      const { resource, structure, power, risk } = sig;
      const hasMonthJi = month.some((f) => f.transform === "忌");
      const hasMonthLu = month.some((f) => f.transform === "祿");
      const hasMonthQuan = month.some((f) => f.transform === "權");
      const riskNotHigh = risk < 1;

      if (resource >= 1 && hasMonthJi) out.add("lu_chase_ji");
      if (structure >= 1 && risk >= 1 && !out.has("ke_turns_ji")) out.add("ke_repair_ji");
      if (power >= 1 && hasMonthQuan && riskNotHigh) out.add("quan_push");
      if (resource >= 1 && hasMonthLu && riskNotHigh) out.add("lu_open");
    }
  }

  return [...out];
}

export function getS18PalaceBias(s18: S18Signals | undefined, palace: string): S18PalaceBias {
  if (!s18) return "neutral";
  const p = normPalace(palace);
  if (s18.keyPalaces.strongestPressure.some((x) => normPalace(x) === p)) return "pressure";
  if (s18.keyPalaces.strongestOpportunity.some((x) => normPalace(x) === p)) return "opportunity";
  return "neutral";
}

function transformPlain(transform: GongGanFlow["transform"]): string {
  const key = TRANSFORM_TO_KEY[transform];
  if (!key) return transform;
  return TRANSFORM_SEMANTIC_DICTIONARY[key]?.plain ?? transform;
}

function triggerStrength(_flow: GongGanFlow, flowCount: number): number {
  // 流月單條權重：參與宮越多條，單條略降（避免洗版）
  const dilute = flowCount > 4 ? 0.9 : flowCount > 2 ? 0.95 : 1;
  return dilute;
}

function weightScenarios(params: {
  rule: InterpretationRule | null;
  s18Bias: S18PalaceBias;
  chainTypes: S19ChainType[];
  baseWeight: number;
}): { positive: number; negative: number; base: number } {
  let pos = 1;
  let neg = 1;
  if (params.s18Bias === "opportunity") pos *= 1.35;
  if (params.s18Bias === "pressure") neg *= 1.35;

  const chainNegBoost = params.chainTypes.some((c) =>
    ["ji_chase_ji", "lu_pressed_by_ji", "ke_turns_ji", "lu_chase_ji", "ke_repair_ji"].includes(c)
  );
  if (chainNegBoost) neg *= 1.25;

  const bw = (params.rule?.baseWeight ?? params.baseWeight) || 1;
  return { positive: pos * bw, negative: neg * bw, base: bw };
}

function pickConcreteScenarios(
  base: string[],
  pos: string[],
  neg: string[],
  ws: { positive: number; negative: number },
  s18Bias: S18PalaceBias,
  ts: number
): string[] {
  const posBoost = s18Bias === "opportunity" ? 1.25 : 1;
  const negBoost = s18Bias === "pressure" ? 1.25 : 1;
  const scored: { text: string; score: number }[] = [
    ...base.map((t) => ({ text: t, score: 1 * ts })),
    ...pos.map((t) => ({ text: t, score: ws.positive * posBoost * ts })),
    ...neg.map((t) => ({ text: t, score: ws.negative * negBoost * ts })),
  ];
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { text } of scored) {
    const t = text.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 4) break;
  }
  return out.map(sanitizeS19Tone);
}

function buildBranches(
  rule: InterpretationRule | null,
  s18Bias: S18PalaceBias,
  chainTypes: S19ChainType[],
  positiveScenarios: string[],
  negativeScenarios: string[]
): { condition: string; scenarios: string[] }[] {
  const branches: { condition: string; scenarios: string[] }[] = [];

  branches.push({
    condition: "若 S18 將此宮視為壓力較集中的區域",
    scenarios: negativeScenarios.slice(0, 3).map(sanitizeS19Tone),
  });
  branches.push({
    condition: "若 S18 將此宮視為機會較明顯的區域",
    scenarios: positiveScenarios.slice(0, 3).map(sanitizeS19Tone),
  });

  if (chainTypes.includes("ji_chase_ji")) {
    branches.push({
      condition: "若流月同時帶出多條化忌張力（忌追忌傾向）",
      scenarios: [
        sanitizeS19Tone("收尾與界線要先處理，避免同一議題被連環引爆"),
        sanitizeS19Tone("舊帳或舊案可能被接連提起，適合分段處理而非一次硬扛"),
      ],
    });
  }
  if (chainTypes.includes("lu_pressed_by_ji")) {
    branches.push({
      condition: "若出現祿與忌同宮對沖感（祿被忌壓）",
      scenarios: [
        sanitizeS19Tone("表面有機會或好處，但條款／成本可能隱藏壓力，宜放慢確認"),
      ],
    });
  }
  if (chainTypes.includes("ke_turns_ji")) {
    branches.push({
      condition: "若出現科與忌同宮（科轉忌傾向）",
      scenarios: [
        sanitizeS19Tone("原本想靠方法與規則解套，過程中可能仍感到被挑剔或反覆修改"),
      ],
    });
  }
  if (chainTypes.includes("lu_chase_ji")) {
    branches.push({
      condition: "若資源與忌同時到位（祿追忌傾向）",
      scenarios: [
        sanitizeS19Tone("有機會或好處的同時，壓力也一起來，宜先處理忌再放大祿"),
      ],
    });
  }
  if (chainTypes.includes("ke_repair_ji")) {
    branches.push({
      condition: "若結構與壓力並存（科修忌傾向）",
      scenarios: [
        sanitizeS19Tone("問題可以靠規則、流程或整理慢慢修，但需要時間與耐心"),
      ],
    });
  }
  if (chainTypes.includes("quan_push")) {
    branches.push({
      condition: "若主導力與流月權同現（權推局）",
      scenarios: [
        sanitizeS19Tone("適合主動定調、帶節奏，把主導權握穩再推"),
      ],
    });
  }
  if (chainTypes.includes("lu_open")) {
    branches.push({
      condition: "若資源與流月祿同現（祿啟局）",
      scenarios: [
        sanitizeS19Tone("資源或機會感較明顯，適合順勢承接、不要過度保守"),
      ],
    });
  }

  if (rule?.baseScenarios?.length) {
    branches.push({
      condition: "一般情況（不依 S18 偏權）",
      scenarios: rule.baseScenarios.map(sanitizeS19Tone),
    });
  }

  return branches;
}

function buildFallbackInterpretation(flow: GongGanFlow): {
  narrative: string;
  concretePossibilities: string[];
  actionHint: string;
  positiveScenarios: string[];
  negativeScenarios: string[];
} {
  const starSem = getStarSemantic(flow.star);
  const palaceSem = getPalaceSemantic(flow.toPalace);
  const tPlain = transformPlain(flow.transform);
  const themes = starSem?.themes?.slice(0, 3).join("、") ?? flow.star;
  const palacePlain = palaceSem?.plain ?? `${normPalace(flow.toPalace)}相關主題`;

  const narrative = sanitizeS19Tone(
    `流月${flow.star}化${flow.transform}飛入${normPalace(flow.toPalace)}，比較容易把「${themes}」的議題，連動到${palacePlain}。就四化語感來看，${tPlain}`
  );

  const positiveScenarios =
    flow.transform === "忌"
      ? [
          sanitizeS19Tone("若你原本就願意面對問題，這段時間反而適合收尾、補洞與降低風險"),
          sanitizeS19Tone("把節奏放慢，比較容易找到可執行的小步修正"),
        ]
      : [
          sanitizeS19Tone("若你原本就有準備，這段時間比較容易看見可用的方法或助力"),
          sanitizeS19Tone("適合用小型試驗驗證方向，再決定要不要加碼"),
        ];

  const negativeScenarios =
    flow.transform === "忌"
      ? [
          sanitizeS19Tone("若原本就習慣硬扛，這段時間比較容易把壓力放大成疲勞或拖延"),
          sanitizeS19Tone("若溝通省略細節，比較容易在誤解裡打轉"),
        ]
      : [
          sanitizeS19Tone("若期待一次到位，可能比較容易感到不如預期"),
          sanitizeS19Tone("若界線不清，比較容易把機會變成額外負擔"),
        ];

  const concretePossibilities = [
    sanitizeS19Tone(`與「${themes}」相關的具體事件可能比較容易浮上檯面`),
    sanitizeS19Tone(`${palacePlain}需要多一點耐心與分段處理`),
  ];

  const actionHint = sanitizeS19Tone(
    starSem?.advice ?? "先把目標拆小、確認界線與責任分工，再往前推。"
  );

  return { narrative, concretePossibilities, actionHint, positiveScenarios, negativeScenarios };
}

function interpretOneFlow(
  flow: GongGanFlow,
  ctx: {
    overrideRules: InterpretationRule[];
    seedRules: InterpretationRule[];
    s18: S18Signals | undefined;
    chainTypesInternal: S19ChainType[];
    chainTypes: string[];
    primaryChain: string | undefined;
    flowCount: number;
  }
): S19InterpretationPerFlow {
  const toPalace = normPalace(flow.toPalace);
  const s18Bias = getS18PalaceBias(ctx.s18, toPalace);
  const ruleCtx = { s18Bias, chainTypes: ctx.chainTypesInternal };

  const ruleOverride = pickInterpretationRule(
    ctx.overrideRules,
    flow.star,
    flow.transform,
    toPalace,
    ruleCtx
  );
  const ruleSeed =
    !ruleOverride &&
    pickInterpretationRule(ctx.seedRules, flow.star, flow.transform, toPalace, ruleCtx);

  const rule = ruleOverride ?? ruleSeed ?? null;
  const matchedRuleLayer: "override" | "seed" | "fallback" = ruleOverride
    ? "override"
    : ruleSeed
      ? "seed"
      : "fallback";
  const usedFallback = !rule;

  const ws = weightScenarios({
    rule,
    s18Bias,
    chainTypes: ctx.chainTypesInternal,
    baseWeight: 1,
  });

  const ts = triggerStrength(flow, ctx.flowCount);
  const effectiveWeight = ws.base * ts;

  let narrative: string;
  let actionHint: string;
  let positiveScenarios: string[];
  let negativeScenarios: string[];
  let baseScenarios: string[];

  let block: InterpretationBlock | undefined;
  let concretePossibilities: string[];

  if (rule) {
    narrative = sanitizeS19Tone(rule.narrative);
    actionHint = sanitizeS19Tone(rule.actionHint);
    positiveScenarios = [...rule.positiveScenarios];
    negativeScenarios = [...rule.negativeScenarios];
    baseScenarios = [...rule.baseScenarios];

    const s18Context: S18Context = {
      isOpportunityPalace: ctx.s18?.keyPalaces.strongestOpportunity.some((p) => normPalace(p) === toPalace),
      isPressurePalace: ctx.s18?.keyPalaces.strongestPressure.some((p) => normPalace(p) === toPalace),
      risk: ctx.s18?.palaces?.find((p) => normPalace(p.palace) === toPalace)?.risk,
      pattern: ctx.s18?.palaces?.find((p) => normPalace(p.palace) === toPalace)?.pattern?.id,
    };
    const s19Context: S19Context = {
      chainTypes: ctx.chainTypes,
      primaryChain: ctx.primaryChain,
      triggerTransform: flow.transform,
    };
    const scenarios = pickScenarios(rule, s18Context, s19Context);
    block = renderInterpretationBlock(rule, scenarios);
    concretePossibilities = block.scenarios;
  } else {
    const fb = buildFallbackInterpretation(flow);
    narrative = fb.narrative;
    actionHint = fb.actionHint;
    positiveScenarios = fb.positiveScenarios;
    negativeScenarios = fb.negativeScenarios;
    baseScenarios = [];
    concretePossibilities = pickConcreteScenarios(
      [],
      positiveScenarios,
      negativeScenarios,
      ws,
      s18Bias,
      ts
    );
  }

  const branches = buildBranches(
    rule,
    s18Bias,
    ctx.chainTypesInternal,
    positiveScenarios,
    negativeScenarios
  );

  const out: S19InterpretationPerFlow = {
    flow,
    narrative,
    concretePossibilities,
    branches,
    actionHint,
    matchedRuleId: rule?.id ?? null,
    matchedRuleLayer,
    usedFallback,
    ...(block ? { block } : {}),
    debug: {
      effectiveWeight,
      s18Bias,
      chainTypes: ctx.chainTypes,
      primaryChain: ctx.primaryChain,
      positiveWeight: ws.positive,
      negativeWeight: ws.negative,
    },
  };

  assertNoForbiddenTone(out.narrative, "narrative");
  assertNoForbiddenTone(out.actionHint, "actionHint");
  return out;
}

export interface RunS19InterpretationEngineOpts {
  triggerPalace: string;
  chartJson?: Record<string, unknown>;
  s18Signals?: S18Signals;
  /** 第一層：override 規則（精準星×四化×宮） */
  overrideRules?: InterpretationRule[];
  /** 第二層：seed 規則（含萬用 *） */
  seedRules?: InterpretationRule[];
  monthlyFlowsOverride?: GongGanFlow[];
}

/**
 * S19 斷語規則引擎主入口。規則解析三層：override → seed → generic fallback。
 */
export function runS19InterpretationEngine(opts: RunS19InterpretationEngineOpts): S19InterpretationEngineOutput {
  const overrideRules = opts.overrideRules ?? INTERPRETATION_RULES_V1;
  const seedRules = opts.seedRules ?? INTERPRETATION_RULES_SEED;
  const allMonthly =
    opts.monthlyFlowsOverride ?? buildMonthlyFlowsForS19(opts.chartJson as Record<string, unknown> | undefined);
  const monthFlowsUsed = getMonthlyFlowsForTriggerPalace(allMonthly, opts.triggerPalace);
  const chainTypesInternal = detectS19ChainTypes(monthFlowsUsed, {
    triggerPalace: opts.triggerPalace,
    s18: opts.s18Signals,
  });
  const chainTypes = chainTypesInternal.map((c) => CHAIN_LABELS[c]);
  const primaryChain = resolvePrimaryChain(chainTypes);
  const flowCount = monthFlowsUsed.length;

  const interpretations = monthFlowsUsed.map((flow) =>
    interpretOneFlow(flow, {
      overrideRules,
      seedRules,
      s18: opts.s18Signals,
      chainTypesInternal,
      chainTypes,
      primaryChain,
      flowCount,
    })
  );

  return {
    triggerPalace: normPalace(opts.triggerPalace),
    monthFlowsUsed,
    chainTypes,
    primaryChain,
    interpretations,
  };
}
