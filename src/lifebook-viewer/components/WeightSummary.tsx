/**
 * 權重摘要：優先關注 / 風險 / 穩定宮位
 */

import React from "react";
import type { WeightAnalysis } from "../types";

interface WeightSummaryProps {
  weight?: WeightAnalysis | null;
  className?: string;
}

export function WeightSummary({ weight, className = "" }: WeightSummaryProps) {
  if (!weight) return null;

  const top = weight.top_focus_palaces ?? [];
  const risk = weight.risk_palaces ?? [];
  const stable = weight.stable_palaces ?? [];

  if (top.length === 0 && risk.length === 0 && stable.length === 0) return null;

  return (
    <section className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 ${className}`}>
      <h2 className="text-sm font-bold text-amber-300/90 mb-3 flex items-center gap-2">
        <span className="w-1 h-4 bg-amber-500/60 rounded-full" />
        權重摘要
      </h2>
      <dl className="space-y-3 text-sm text-slate-300">
        {top.length > 0 && (
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wider">優先關注宮位</dt>
            <dd className="text-slate-200">{top.join("、")}</dd>
          </div>
        )}
        {risk.length > 0 && (
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wider">風險宮位</dt>
            <dd className="text-red-200/90">{risk.join("、")}</dd>
          </div>
        )}
        {stable.length > 0 && (
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wider">相對穩定宮位</dt>
            <dd className="text-emerald-200/90">{stable.join("、")}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
