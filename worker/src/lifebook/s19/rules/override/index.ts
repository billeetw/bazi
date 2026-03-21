/**
 * S19 override 規則組裝入口：單一 INTERPRETATION_RULES_V1，其餘為依宮位拆檔的規則集。
 */

import type { InterpretationRule } from "../../interpretationRuleTypes.js";
import { AUTHORITY_RULES } from "./authorityRules.js";
import { CAREER_RULES } from "./careerRules.js";
import { FORTUNE_RULES } from "./fortuneRules.js";
import { HEALTH_RULES } from "./healthRules.js";
import { MONEY_RULES } from "./moneyRules.js";
import { OUTPUT_RULES } from "./outputRules.js";
import { PROPERTY_RULES } from "./propertyRules.js";
import { SELF_RULES } from "./selfRules.js";
import { SERVANT_RULES } from "./servantRules.js";
import { SIBLING_RULES } from "./siblingRules.js";
import { SPOUSE_RULES } from "./spouseRules.js";
import { TRAVEL_RULES } from "./travelRules.js";

export { SPOUSE_RULES } from "./spouseRules.js";
export { CAREER_RULES } from "./careerRules.js";
export { MONEY_RULES } from "./moneyRules.js";
export { PROPERTY_RULES } from "./propertyRules.js";
export { SIBLING_RULES } from "./siblingRules.js";
export { FORTUNE_RULES } from "./fortuneRules.js";
export { TRAVEL_RULES } from "./travelRules.js";
export { OUTPUT_RULES } from "./outputRules.js";
export { HEALTH_RULES } from "./healthRules.js";
export { SERVANT_RULES } from "./servantRules.js";
export { SELF_RULES } from "./selfRules.js";
export { AUTHORITY_RULES } from "./authorityRules.js";

/** 僅 override 規則（不含 seed），僅在 S19 trigger 宮位使用。組裝順序與原單檔一致。 */
export const INTERPRETATION_RULES_V1: InterpretationRule[] = [
  ...SPOUSE_RULES,
  ...CAREER_RULES,
  ...MONEY_RULES,
  ...PROPERTY_RULES,
  ...SIBLING_RULES,
  ...FORTUNE_RULES,
  ...TRAVEL_RULES,
  ...OUTPUT_RULES,
  ...SELF_RULES,
  ...HEALTH_RULES,
  ...SERVANT_RULES,
  ...AUTHORITY_RULES,
];
