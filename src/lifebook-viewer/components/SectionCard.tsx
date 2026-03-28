/**
 * 單章命書：標題、星曜宮位評語、四欄（綜合分析 / 行為慣性 / 盲點 / 戰略建議）
 * 技術版資料不在本元件顯示，僅在專家後台「整頁技術檢視」中呈現。
 */

import React from "react";
import { getSectionDomAnchorId } from "../constants";
import type { SectionPayload } from "../types";

interface SectionCardProps {
  section: SectionPayload;
  id?: string;
  className?: string;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children || (typeof children === "string" && !children.trim())) return null;
  return (
    <div className="mb-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
      <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">{children}</div>
    </div>
  );
}

export function SectionCard({ section, id, className = "" }: SectionCardProps) {
  const {
    title,
    importance_level,
    star_palace_quotes,
    structure_analysis,
    behavior_pattern,
    blind_spots,
    strategic_advice,
  } = section;

  const domAnchorId = id ?? getSectionDomAnchorId(section.section_key);
  return (
    <article
      id={domAnchorId}
      data-lifebook-section={section.section_key}
      className={`rounded-xl border border-slate-700/50 bg-slate-800/20 p-5 scroll-mt-4 ${className}`}
    >
      <header className="mb-4">
        <span className="text-xs text-slate-500 font-medium">{importance_level}</span>
        <h2 className="text-lg font-bold text-slate-100 mt-0.5">{title || section.section_key}</h2>
      </header>

      {star_palace_quotes && Object.keys(star_palace_quotes).length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-amber-950/20 border border-amber-800/30">
          <p className="text-xs font-bold text-amber-300/90 mb-2">【星曜宮位評語（會直接顯示給當事人）】</p>
          <ul className="space-y-1.5 text-sm text-slate-200">
            {Object.entries(star_palace_quotes).map(([k, v]) => (
              <li key={k}>
                <strong className="text-amber-200/90">{k}</strong>：{v}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Block title="綜合分析">{structure_analysis}</Block>
      <Block title="行為慣性與心理動力">{behavior_pattern}</Block>
      <Block title="盲點卡點">{blind_spots}</Block>
      <Block title="戰略建議">{strategic_advice}</Block>
    </article>
  );
}
