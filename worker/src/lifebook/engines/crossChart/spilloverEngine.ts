/**
 * CL3 spilloverEngine：壓力外溢與根因追蹤。
 * 只處理 source palace → (transform/axis/rule) → target palace，輸出 SpilloverFinding[]。
 */

import type { NormalizedChart, TransformDisplay } from "../../normalizedChart.js";
import type { SpilloverFinding } from "../../lifebookFindings.js";
import type { CrossChartRuleRow, PalaceAxisLinkRow } from "./crossChartRuleTypes.js";
import { matchEdgeRule, type TransformEdgeWithLayer } from "./crossChartRuleMatcher.js";
import { findAxisForPalaces } from "./axisLookup.js";

function collectAllEdges(chart: NormalizedChart): TransformEdgeWithLayer[] {
  const out: TransformEdgeWithLayer[] = [];
  for (const e of chart.natalTransforms) {
    out.push({ ...e, layer: "natal" });
  }
  for (const p of chart.palaces) {
    for (const e of p.decadalTransformsIn) out.push({ ...e, layer: "decade" });
    for (const e of p.decadalTransformsOut) out.push({ ...e, layer: "decade" });
    for (const e of p.yearlyTransformsIn) out.push({ ...e, layer: "year" });
    for (const e of p.yearlyTransformsOut) out.push({ ...e, layer: "year" });
  }
  return out;
}

function buildPalaceTransformBucket(
  edges: TransformEdgeWithLayer[]
): Map<string, Set<TransformDisplay>> {
  const map = new Map<string, Set<TransformDisplay>>();
  for (const edge of edges) {
    const to = edge.toPalace?.trim() ?? "";
    if (!to) continue;
    let set = map.get(to);
    if (!set) {
      set = new Set();
      map.set(to, set);
    }
    set.add(edge.transform);
  }
  return map;
}

function dedupeSpillovers(findings: SpilloverFinding[]): SpilloverFinding[] {
  const seen = new Set<string>();
  const result: SpilloverFinding[] = [];
  for (const item of findings) {
    const key = `${item.ruleId}__${item.fromPalace}__${item.toPalace}__${item.transform ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

const PALACE_GROUPS: Record<string, string[]> = {
  pressure: ["官祿宮", "田宅宮", "財帛宮", "父母宮", "福德宮"],
  relationship: ["夫妻宮", "僕役宮", "兄弟宮"],
  body: ["疾厄宮"],
  creation: ["子女宮"],
};

const LAYER_MAP = { natal: "natal" as const, decade: "decade" as const, year: "year" as const };

function toSpillover(
  rule: CrossChartRuleRow,
  fromPalace: string,
  toPalace: string,
  transform: TransformDisplay | undefined,
  axis: string | undefined,
  layer?: "natal" | "decade" | "year"
): SpilloverFinding {
  const shockLevel = rule.shockLevel ?? 2;
  const narrative = rule.diagnosis + "。" + rule.lifePattern;
  return {
    ruleId: rule.ruleId,
    fromPalace,
    toPalace,
    transform,
    diagnosis: rule.diagnosis,
    lifePattern: rule.lifePattern,
    advice: rule.advice,
    shockLevel,
    axis,
    source: "crossChartRule",
    layer: layer != null ? LAYER_MAP[layer] : undefined,
    sourcePalace: fromPalace,
    targetPalace: toPalace,
    narrative,
  };
}

export function buildSpilloverFindings(
  chart: NormalizedChart,
  rules: CrossChartRuleRow[],
  axisRows: PalaceAxisLinkRow[]
): SpilloverFinding[] {
  const edges = collectAllEdges(chart);
  const findings: SpilloverFinding[] = [];

  // 1. edgeMatch
  for (const edge of edges) {
    for (const rule of rules) {
      if (rule.triggerType !== "edgeMatch") continue;
      if (!matchEdgeRule(edge, rule)) continue;
      const axis = findAxisForPalaces(edge.fromPalace, edge.toPalace, axisRows);
      findings.push(toSpillover(rule, edge.fromPalace, edge.toPalace, edge.transform, axis, edge.layer));
    }
  }

  // 2. samePalaceTransformMix
  const bucket = buildPalaceTransformBucket(edges);
  for (const rule of rules) {
    if (rule.triggerType !== "samePalaceTransformMix") continue;
    const trigger = rule.trigger as { hasTransforms?: TransformDisplay[] };
    const required = (trigger.hasTransforms ?? []) as TransformDisplay[];
    for (const [palace, transforms] of bucket) {
      const ok = required.length > 0 && required.every((t) => transforms.has(t));
      if (!ok) continue;
      findings.push(toSpillover(rule, palace, palace, undefined, undefined, undefined));
    }
  }

  // 3. groupMatch
  for (const edge of edges) {
    for (const rule of rules) {
      if (rule.triggerType !== "groupMatch") continue;
      const trigger = rule.trigger as {
        sourceGroup?: string;
        targetGroup?: string;
        transform?: TransformDisplay;
      };
      if (trigger.transform != null && trigger.transform !== edge.transform) continue;
      const sourceGroupPalaces = PALACE_GROUPS[trigger.sourceGroup ?? ""] ?? [];
      const targetGroupPalaces = PALACE_GROUPS[trigger.targetGroup ?? ""] ?? [];
      if (!sourceGroupPalaces.includes(edge.fromPalace)) continue;
      if (!targetGroupPalaces.includes(edge.toPalace)) continue;
      const axis = findAxisForPalaces(edge.fromPalace, edge.toPalace, axisRows);
      findings.push(toSpillover(rule, edge.fromPalace, edge.toPalace, edge.transform, axis, edge.layer));
    }
  }

  return dedupeSpillovers(findings);
}
