/**
 * S19 override 規則契約測試：id 唯一、(star, transform, palace) 唯一、必填欄位非空
 */

import { describe, expect, it } from "vitest";
import { INTERPRETATION_RULES_V1 } from "../src/lifebook/s19/interpretationRulesOverride.js";
import type { InterpretationRule } from "../src/lifebook/s19/interpretationRuleTypes.js";

const REQUIRED_STRING_FIELDS: (keyof InterpretationRule)[] = [
  "id",
  "star",
  "transform",
  "palace",
  "title",
  "narrative",
  "actionHint",
];

function nonEmptyString(s: unknown): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

describe("S19 INTERPRETATION_RULES_V1 契約", () => {
  it("所有規則 id 唯一", () => {
    const ids = INTERPRETATION_RULES_V1.map((r) => r.id);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) duplicates.push(id);
      else seen.add(id);
    }
    expect(duplicates, `重複的 id: ${duplicates.join(", ")}`).toHaveLength(0);
  });

  it("(star, transform, palace) 在 override 內唯一", () => {
    const triples = INTERPRETATION_RULES_V1.map((r) => `${r.star}|${r.transform}|${r.palace}`);
    const seen = new Map<string, string>();
    const duplicates: { key: string; ids: string[] }[] = [];
    INTERPRETATION_RULES_V1.forEach((r) => {
      const key = `${r.star}|${r.transform}|${r.palace}`;
      const existing = seen.get(key);
      if (existing) {
        const dup = duplicates.find((d) => d.key === key);
        if (dup) dup.ids.push(r.id);
        else duplicates.push({ key, ids: [existing, r.id] });
      } else seen.set(key, r.id);
    });
    expect(
      duplicates,
      duplicates.length ? `重複的 (star, transform, palace): ${JSON.stringify(duplicates)}` : ""
    ).toHaveLength(0);
  });

  it("必填欄位非空：id, star, transform, palace, title, narrative, actionHint", () => {
    const violations: { ruleId: string; field: string }[] = [];
    for (const rule of INTERPRETATION_RULES_V1) {
      for (const field of REQUIRED_STRING_FIELDS) {
        const val = rule[field];
        if (!nonEmptyString(val)) {
          violations.push({
            ruleId: rule.id || "(no id)",
            field,
          });
        }
      }
      if (!Array.isArray(rule.eventType)) {
        violations.push({ ruleId: rule.id, field: "eventType" });
      }
      if (!Array.isArray(rule.baseScenarios)) {
        violations.push({ ruleId: rule.id, field: "baseScenarios" });
      }
      if (!Array.isArray(rule.positiveScenarios)) {
        violations.push({ ruleId: rule.id, field: "positiveScenarios" });
      }
      if (!Array.isArray(rule.negativeScenarios)) {
        violations.push({ ruleId: rule.id, field: "negativeScenarios" });
      }
      if (typeof rule.baseWeight !== "number" || rule.baseWeight < 0) {
        violations.push({ ruleId: rule.id, field: "baseWeight" });
      }
    }
    expect(
      violations,
      violations.length ? `必填欄位違規: ${JSON.stringify(violations)}` : ""
    ).toHaveLength(0);
  });
});
