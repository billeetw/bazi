/**
 * 命書單章三層版面：標題+狀態 → 敘事 → 建議卡片 → 技術依據（可摺疊）
 */

import React from "react";
import { getSectionDomAnchorId, getSectionStatus, type SectionTechContext } from "../constants";
import { TechnicalInsight } from "./TechnicalInsight";
import { ActionCard } from "./ActionCard";

export interface LifeBookSection {
  id: string;
  title: string;
  narrative: string;
  advice?: string[];
  techContext?: SectionTechContext;
  /** 星曜宮位評語（會直接顯示給當事人），與 prompt 中【星曜宮位評語】一致 */
  star_palace_quotes?: Record<string, string>;
}

interface SectionLayoutProps {
  section: LifeBookSection;
  id?: string;
  className?: string;
  /**
   * 是否顯示每章底部「底層技術依據」摺疊區。
   * 一般讀者版建議 false；專家模式（expertMode）為 true。
   */
  showPerSectionTechnical?: boolean;
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({
  section,
  id: propId,
  className = "",
  showPerSectionTechnical = true,
}) => {
  const status = getSectionStatus(section.techContext ?? {});

  const statusLabel =
    status === "HIGH_PRESSURE"
      ? "高壓區"
      : status === "OPPORTUNITY"
        ? "機會點"
        : "穩定區";
  const statusBadgeClass =
    status === "HIGH_PRESSURE"
      ? "bg-red-500/10 text-red-300 border-red-500/30"
      : status === "OPPORTUNITY"
        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";

  const titleMatch = section.title.match(/^(.+?)[（(]([^）)]+)[）)]$/);
  const mainTitle = titleMatch ? titleMatch[1] : section.title;
  const palaceName = titleMatch ? titleMatch[2] : null;

  const narrativeParagraphs = section.narrative.trim().split(/\n\n+/);
  const firstParagraph = narrativeParagraphs[0] ?? section.narrative;
  const restNarrative = narrativeParagraphs.slice(1).join("\n\n");

  /** 與 `getSectionDomAnchorId` / Home `#palace-*` 一致；`data-lifebook-section` 仍用 section id 供 TOC／observer */
  const domAnchorId = propId ?? getSectionDomAnchorId(section.id);
  return (
    <article
      id={domAnchorId}
      data-lifebook-section={section.id}
      className={`lifebook-section rounded-2xl border border-slate-700/50 overflow-hidden scroll-mt-6 ${className}`}
    >
      <header className="lifebook-section-header bg-gradient-to-br from-slate-800/90 via-indigo-950/30 to-slate-900/90 px-6 py-5 border-b border-white/5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {mainTitle}
              {palaceName && (
                <span className="text-sm font-normal text-slate-500 ml-2">（{palaceName}）</span>
              )}
            </h2>
          </div>
          <span
            className={`lifebook-section-status text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusBadgeClass}`}
          >
            {statusLabel}
          </span>
        </div>
      </header>

      {section.star_palace_quotes && Object.keys(section.star_palace_quotes).length > 0 && (
        <section className="lifebook-section-quotes px-6 py-4 bg-amber-950/20 border-b border-amber-800/20">
          <p className="text-xs font-bold text-amber-300/90 mb-2">【星曜宮位評語（會直接顯示給當事人）】</p>
          <ul className="space-y-1.5 text-sm text-slate-200">
            {Object.entries(section.star_palace_quotes).map(([k, v]) => (
              <li key={k}>
                <strong className="text-amber-200/90">{k}</strong>：{v}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="lifebook-section-narrative px-6 py-6 bg-slate-900/30">
        {firstParagraph && (
          <div className="relative mb-6 pl-5 border-l-4 border-blue-500/50">
            <p className="text-lg leading-relaxed text-slate-100/95">
              {firstParagraph}
            </p>
          </div>
        )}
        {restNarrative && (
          <p className="text-slate-200 leading-relaxed whitespace-pre-wrap text-sm">
            {restNarrative}
          </p>
        )}
      </section>

      {section.advice != null && section.advice.length > 0 && (
        <section className="lifebook-section-advice px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.advice.map((item, idx) => (
            <ActionCard
              key={idx}
              advice={item}
              tenGod={section.techContext?.tenGod}
              wuxing={section.techContext?.wuxing}
            />
          ))}
        </section>
      )}

      {showPerSectionTechnical ? (
        <section className="lifebook-section-tech border-t border-white/5 pt-4 px-6 pb-6">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none text-slate-500 hover:text-amber-400/90 transition-all py-2">
              <span className="flex items-center gap-2 text-xs uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-amber-500/60 rounded-full motion-reduce:animate-none animate-pulse" />
                🔍 查看底層技術依據
              </span>
              <span className="text-[10px] group-open:rotate-180 transition-transform duration-300">▼</span>
            </summary>
            <div className="mt-4">
              <TechnicalInsight
                stars={section.techContext?.stars ?? []}
                tenGod={section.techContext?.tenGod ?? null}
                wuxing={section.techContext?.wuxing ?? null}
              />
            </div>
          </details>
        </section>
      ) : null}
    </article>
  );
};
