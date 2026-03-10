/**
 * 整頁技術檢視：僅在專家後台顯示，列出各章節的 technical 資料（宮位、星曜、五行、大小限流年等）。
 */

import React, { useState } from "react";
import type { LifeBookUserSection } from "../types";

interface TechnicalViewProps {
  sections: Record<string, LifeBookUserSection>;
  sectionOrder: string[];
}

function SectionTechnicalBlock({ sectionKey, section }: { sectionKey: string; section: LifeBookUserSection }) {
  const [open, setOpen] = useState(false);
  const tech = section.technical;
  if (!tech) return null;
  const hasContent =
    tech.chart_slice ||
    tech.star_palace_quotes ||
    tech.decadal_limits != null ||
    tech.yearly_horoscope != null ||
    tech.liunian != null ||
    tech.weight_analysis != null ||
    tech.wuxing_by_palace ||
    tech.ten_god_by_palace ||
    tech.ziwei != null ||
    tech.bazi != null ||
    tech.five_elements != null ||
    tech.four_transformations != null;
  if (!hasContent) return null;
  return (
    <section className="rounded-xl border border-slate-600/50 bg-slate-800/30 overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 text-left flex items-center justify-between bg-slate-800/50 hover:bg-slate-700/50 border-b border-slate-600/50"
      >
        <span className="font-medium text-slate-200">
          {section.title || sectionKey}
        </span>
        <span className="text-xs text-slate-500">{open ? "▲ 收合" : "▼ 展開"}</span>
      </button>
      {open && (
        <pre className="p-4 text-xs font-mono text-slate-300 bg-black/30 overflow-auto max-h-[70vh] whitespace-pre-wrap break-words">
          {JSON.stringify(tech, null, 2)}
        </pre>
      )}
    </section>
  );
}

export function TechnicalView({ sections, sectionOrder }: TechnicalViewProps) {
  const keysWithTechnical = sectionOrder.filter((k) => sections[k]?.technical != null);
  if (keysWithTechnical.length === 0) {
    return (
      <div className="rounded-xl border border-slate-600/50 bg-slate-800/20 p-8 text-center text-slate-400">
        <p className="font-medium">本命書無技術版資料</p>
        <p className="text-sm mt-2">僅有以「資料庫技術版（自用）」生成的命書會在此顯示宮位、星曜、五行、大小限流年等技術細節。</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-500 mb-4">
        以下為各章節的命盤與組裝技術資料（chart_slice、星曜宮位評語、大限小限流年、五行十神等），僅供專家後台自用。
      </p>
      {keysWithTechnical.map((key) => (
        <SectionTechnicalBlock key={key} sectionKey={key} section={sections[key]} />
      ))}
    </div>
  );
}
