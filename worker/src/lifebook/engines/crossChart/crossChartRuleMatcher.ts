/**
 * CL3 spilloverEngine：單條規則與單條 edge 的比對。
 */

import type { CrossChartRuleRow } from "./crossChartRuleTypes.js";
import type { TransformDisplay } from "../../normalizedChart.js";

export type TransformEdgeWithLayer = {
  fromPalace: string;
  toPalace: string;
  transform: TransformDisplay;
  layer: "natal" | "decade" | "year";
};

export function matchEdgeRule(
  edge: TransformEdgeWithLayer,
  rule: CrossChartRuleRow
): boolean {
  if (rule.triggerType !== "edgeMatch") return false;
  const trigger = rule.trigger as {
    transform?: string;
    fromPalace?: string;
    toPalace?: string;
  };
  if (trigger.transform != null && trigger.transform !== edge.transform) return false;
  if (trigger.fromPalace != null && trigger.fromPalace !== edge.fromPalace) return false;
  if (trigger.toPalace != null && trigger.toPalace !== edge.toPalace) return false;
  return true;
}
