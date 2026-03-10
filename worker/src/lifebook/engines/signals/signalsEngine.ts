/**
 * P2: 從 overlap / decisionMatrix / risk-signals 表 產出 YearSignal[]。
 * 第一版：overlap.criticalRisks→red，maxOpportunities→green，volatileAmbivalences→yellow。
 */

import type { YearSignal } from "../../lifebookFindings.js";

export interface OverlapBucket {
  palace?: string;
  palaceName?: string;
  palaceKey?: string;
  [k: string]: unknown;
}

export interface OverlapInput {
  criticalRisks?: OverlapBucket[];
  maxOpportunities?: OverlapBucket[];
  volatileAmbivalences?: OverlapBucket[];
}

function normPalaceName(p: string | undefined): string {
  if (!p) return "";
  const s = p.trim();
  return s.endsWith("宮") ? s : s === "命" ? "命宮" : s + "宮";
}

/**
 * 從 overlap 三桶子產出 YearSignal[]。year 由呼叫端代入。
 */
export function runSignalsFromOverlap(
  overlap: OverlapInput | undefined,
  year: number
): YearSignal[] {
  const out: YearSignal[] = [];
  if (!overlap) return out;

  const push = (palace: string, color: "red" | "green" | "yellow", label: string, advice: string) => {
    out.push({ year, palace, color, label, advice });
  };

  const risks = overlap.criticalRisks ?? [];
  for (const r of risks) {
    const palace = normPalaceName(r.palace ?? r.palaceName ?? r.palaceKey);
    if (palace) push(palace, "red", "關係或該宮承壓高峰", "避免重大決策與硬碰硬");
  }
  const opportunities = overlap.maxOpportunities ?? [];
  for (const o of opportunities) {
    const palace = normPalaceName(o.palace ?? o.palaceName ?? o.palaceKey);
    if (palace) push(palace, "green", "有資源挹注或機會", "可積極布局、爭取可見度");
  }
  const volatile = overlap.volatileAmbivalences ?? [];
  for (const v of volatile) {
    const palace = normPalaceName(v.palace ?? v.palaceName ?? v.palaceKey);
    if (palace) push(palace, "yellow", "吉凶並見", "謹慎決策、不 all-in");
  }
  return out;
}
