/**
 * Phase 3：演算法組裝規則 (Risk Rules)
 * 定義「命盤特徵 (When)」與「心理機制 (Attach)」的對應：
 * 在特定系統配置下，最容易啟動的神經迴路與對應的高壓警示 Snippet。
 */

import type { PalaceId, MainStarId, TenGodId, WuXingId, NeuralLoopId } from "./schema.js";
import type { TransformId } from "./schema.js";

/** 條件：星曜 × 宮位 × 四化（如 命宮有紫微+化忌），供組裝器 match 使用 */
export interface WhenStarPalaceTransform {
  kind: "star_palace_transform";
  palaceId: PalaceId;
  starId: MainStarId;
  transform: TransformId;
}

/** 條件：十神 × 宮位 過旺，供組裝器 match 使用 */
export interface WhenTenGodPalaceExcess {
  kind: "tengod_palace_excess";
  palaceId: PalaceId;
  tenGodId: TenGodId;
}

/** 條件：五行能量極端（極弱 / 極強），供組裝器 match 使用 */
export interface WhenWuxingExtreme {
  kind: "wuxing_extreme";
  wuxingId: WuXingId;
  extreme: "high" | "low";
}

export type RiskRuleWhen =
  | WhenStarPalaceTransform
  | WhenTenGodPalaceExcess
  | WhenWuxingExtreme;

export interface RiskRule {
  id: string;
  when: RiskRuleWhen;
  attachLoops: NeuralLoopId[];
  hpKey: string;
}

/** 1. 星曜 × 宮位 × 神經迴路（核心性格偏誤） */
const STAR_PALACE_RULES: RiskRule[] = [
  {
    id: "ming_ziWei_ji",
    when: { kind: "star_palace_transform", palaceId: "ming", starId: "ziWei", transform: "ji" },
    attachLoops: ["control_loop", "approval_loop"],
    hpKey: "hp.self.authority_anxiety",
  },
  {
    id: "ming_tianJi_ji",
    when: { kind: "star_palace_transform", palaceId: "ming", starId: "tianJi", transform: "ji" },
    attachLoops: ["rumination_loop", "catastrophizing"],
    hpKey: "hp.self.overthinking_burnout",
  },
  {
    id: "fupo_taiYin_ji",
    when: { kind: "star_palace_transform", palaceId: "fupo", starId: "taiYin", transform: "ji" },
    attachLoops: ["avoidance_loop", "victim_loop"],
    hpKey: "hp.relation.emotional_withdrawal",
  },
  {
    id: "cai_wuQu_ji",
    when: { kind: "star_palace_transform", palaceId: "cai", starId: "wuQu", transform: "ji" },
    attachLoops: ["fight_flight", "control_loop"],
    hpKey: "hp.money.financial_rigidity",
  },
  {
    id: "qianyi_juMen_ji",
    when: { kind: "star_palace_transform", palaceId: "qianyi", starId: "juMen", transform: "ji" },
    attachLoops: ["catastrophizing", "rationalization"],
    hpKey: "hp.social.communication_paranoia",
  },
];

/** 2. 十神 × 宮位 × 心理陷阱（生存策略偏失） */
const TENGOD_PALACE_RULES: RiskRule[] = [
  {
    id: "ming_shangGuan_excess",
    when: { kind: "tengod_palace_excess", palaceId: "ming", tenGodId: "shangGuan" },
    attachLoops: ["perfection_loop", "fight_flight"],
    hpKey: "hp.self.rebel_superiority",
  },
  {
    id: "cai_jieCai_excess",
    when: { kind: "tengod_palace_excess", palaceId: "cai", tenGodId: "jieCai" },
    attachLoops: ["saving_loop", "numbing_loop"],
    hpKey: "hp.money.resource_drain",
  },
  {
    id: "fupo_pianYin_excess",
    when: { kind: "tengod_palace_excess", palaceId: "fupo", tenGodId: "pianYin" },
    attachLoops: ["avoidance_loop", "rationalization"],
    hpKey: "hp.relation.spiritual_detachment",
  },
  {
    id: "guanglu_qiSha_excess",
    when: { kind: "tengod_palace_excess", palaceId: "guanglu", tenGodId: "qiSha" },
    attachLoops: ["control_loop", "fight_flight"],
    hpKey: "hp.work.workaholic_aggressive",
  },
  {
    id: "fumu_zhengGuan_excess",
    when: { kind: "tengod_palace_excess", palaceId: "fumu", tenGodId: "zhengGuan" },
    attachLoops: ["approval_loop", "perfection_loop"],
    hpKey: "hp.family.authority_suffocation",
  },
];

/** 3. 五行能量極端（生理與底層動力） */
const WUXING_EXTREME_RULES: RiskRule[] = [
  {
    id: "wood_low",
    when: { kind: "wuxing_extreme", wuxingId: "wood", extreme: "low" },
    attachLoops: ["avoidance_loop", "victim_loop"],
    hpKey: "hp.energy.wood_low_stagnation",
  },
  {
    id: "fire_high",
    when: { kind: "wuxing_extreme", wuxingId: "fire", extreme: "high" },
    attachLoops: ["fight_flight", "comparison_loop"],
    hpKey: "hp.energy.fire_high_impulse",
  },
  {
    id: "water_low",
    when: { kind: "wuxing_extreme", wuxingId: "water", extreme: "low" },
    attachLoops: ["rationalization", "control_loop"],
    hpKey: "hp.energy.water_low_rigidity",
  },
  {
    id: "earth_high",
    when: { kind: "wuxing_extreme", wuxingId: "earth", extreme: "high" },
    attachLoops: ["numbing_loop", "avoidance_loop"],
    hpKey: "hp.energy.earth_high_stubborn",
  },
];

/** 合併後的完整規則表，供組裝器依命盤特徵匹配 */
export const RISK_RULES: RiskRule[] = [
  ...STAR_PALACE_RULES,
  ...TENGOD_PALACE_RULES,
  ...WUXING_EXTREME_RULES,
];
