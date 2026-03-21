/**
 * S19 斷語規則 override：命宮、兄弟、夫妻、子女、財帛、疾厄、遷移、僕役、官祿、田宅、福德、父母
 * INTERPRETATION_RULES_V1 = 僅本檔 override 規則（不包含 seed）。
 * 規則已依宮位／規則集拆至 rules/override/*.ts，此檔為單一組裝入口之 re-export。
 */

export {
  INTERPRETATION_RULES_V1,
  SPOUSE_RULES,
  CAREER_RULES,
  MONEY_RULES,
  PROPERTY_RULES,
  SIBLING_RULES,
  FORTUNE_RULES,
  TRAVEL_RULES,
  OUTPUT_RULES,
  HEALTH_RULES,
  SERVANT_RULES,
  SELF_RULES,
  AUTHORITY_RULES,
} from "./rules/override/index.js";
