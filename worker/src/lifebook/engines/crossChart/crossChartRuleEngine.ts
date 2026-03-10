/**
 * P2: 四化邊 + 規則表 → SpilloverFinding[]。
 * 支援 triggerType: edgeMatch、samePalaceTransformMix、groupMatch。
 */

import { toPalaceCanonical } from "../../canonicalKeys.js";
import type { TransformEdge } from "../../normalizedChart.js";
import type { SpilloverFinding } from "../../lifebookFindings.js";

const PRESSURE_GROUP = new Set(["官祿宮", "田宅宮", "財帛宮", "福德宮"]);
const RELATIONSHIP_GROUP = new Set(["夫妻宮", "僕役宮", "兄弟宮"]);

function normPalace(p: string): string {
  return toPalaceCanonical((p ?? "").trim());
}

export interface CrossChartRule {
  ruleId: string;
  triggerType: "edgeMatch" | "samePalaceTransformMix" | "groupMatch";
  trigger: Record<string, unknown>;
  diagnosis: string;
  lifePattern: string;
  advice: string;
}

export interface CrossChartRuleEngineInput {
  rules: CrossChartRule[];
  edges: TransformEdge[];
  /** 同宮祿忌：宮位名 → true（該宮同時有祿與忌入或出） */
  samePalaceLuJi?: Set<string>;
}

function edgeMatch(edge: TransformEdge, trigger: Record<string, unknown>): boolean {
  const t = trigger.transform as string | undefined;
  const from = (trigger.fromPalace as string) ?? "";
  const to = (trigger.toPalace as string) ?? "";
  if (!t || !from || !to) return false;
  return (
    (edge.transform === t || edge.transform === (t === "忌" ? "忌" : t)) &&
    normPalace(edge.fromPalace) === normPalace(from) &&
    normPalace(edge.toPalace) === normPalace(to)
  );
}

function groupMatch(edge: TransformEdge, trigger: Record<string, unknown>): boolean {
  const t = trigger.transform as string | undefined;
  const srcGroup = trigger.sourceGroup as string | undefined;
  const tgtGroup = trigger.targetGroup as string | undefined;
  if (t && edge.transform !== t) return false;
  if (srcGroup === "pressure" && !PRESSURE_GROUP.has(normPalace(edge.fromPalace))) return false;
  if (tgtGroup === "relationship" && !RELATIONSHIP_GROUP.has(normPalace(edge.toPalace))) return false;
  return true;
}

function buildSamePalaceLuJiSet(edges: TransformEdge[]): Set<string> {
  const byTo = new Map<string, Set<string>>();
  for (const e of edges) {
    const to = normPalace(e.toPalace);
    if (!to) continue;
    let set = byTo.get(to);
    if (!set) { set = new Set(); byTo.set(to, set); }
    set.add(e.transform);
  }
  const out = new Set<string>();
  for (const [palace, transforms] of byTo) {
    if (transforms.has("祿") && transforms.has("忌")) out.add(palace);
  }
  return out;
}

/**
 * 執行規則表比對，產出 SpilloverFinding[]。
 */
export function runCrossChartRuleEngine(input: CrossChartRuleEngineInput): SpilloverFinding[] {
  const { rules, edges } = input;
  const samePalaceLuJi = input.samePalaceLuJi ?? buildSamePalaceLuJiSet(edges);
  const findings: SpilloverFinding[] = [];
  const seen = new Set<string>();

  for (const rule of rules) {
    if (rule.triggerType === "edgeMatch") {
      for (const edge of edges) {
        if (!edgeMatch(edge, rule.trigger)) continue;
        const key = rule.ruleId + "|" + edge.fromPalace + "|" + edge.toPalace;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          sourcePalace: edge.fromPalace,
          targetPalace: edge.toPalace,
          severity: "medium",
          narrative: rule.diagnosis + "。" + rule.lifePattern,
          advice: rule.advice,
        });
      }
    } else if (rule.triggerType === "samePalaceTransformMix") {
      const hasTransforms = rule.trigger.hasTransforms as string[] | undefined;
      const needLu = hasTransforms?.includes("祿");
      const needJi = hasTransforms?.includes("忌");
      if (needLu && needJi && samePalaceLuJi.size > 0) {
        for (const palace of samePalaceLuJi) {
          const key = rule.ruleId + "|" + palace;
          if (seen.has(key)) continue;
          seen.add(key);
          findings.push({
            sourcePalace: palace,
            targetPalace: palace,
            severity: "medium",
            narrative: rule.diagnosis + "。" + rule.lifePattern,
            advice: rule.advice,
          });
        }
      }
    } else if (rule.triggerType === "groupMatch") {
      for (const edge of edges) {
        if (!groupMatch(edge, rule.trigger)) continue;
        const key = rule.ruleId + "|" + edge.fromPalace + "|" + edge.toPalace;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          sourcePalace: edge.fromPalace,
          targetPalace: edge.toPalace,
          severity: "medium",
          narrative: rule.diagnosis + "。" + rule.lifePattern,
          advice: rule.advice,
        });
      }
    }
  }
  return findings;
}
