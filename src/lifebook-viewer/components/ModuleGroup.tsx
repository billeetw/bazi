/**
 * 模組區塊：標題 + 該組章節列表。
 * 宮位課題章節（`isSectionKeyPalaceShell`）→ `SectionPalaceTemplate`；其餘 → `SectionLayout`。
 */

import React from "react";
import type { SectionPayload } from "../types";
import { SectionCard } from "./SectionCard";
import { SectionLayout, type LifeBookSection } from "./SectionLayout";
import { TechnicalInsight } from "./TechnicalInsight";
import { getSectionDomAnchorId, getTechContextForSection, isSectionKeyPalaceShell } from "../constants";
import { SectionPalaceTemplate } from "./section/SectionPalaceTemplate";
import { pickSectionViewModel, type SectionViewModel } from "./section/sectionViewModel";

interface ModuleGroupProps {
  title: string;
  sectionKeys: readonly string[];
  sections: Record<string, SectionPayload>;
  chartJson?: Record<string, unknown> | null;
  useSectionLayout?: boolean;
  className?: string;
  /** 見 SectionLayout.showPerSectionTechnical */
  showPerSectionTechnical?: boolean;
  /** 與命書 state 同步的 VM；有則宮位章節走 palace 殼 */
  sectionVms?: SectionViewModel[] | null;
  /** 鎖章時 palace 殼 CTA（與預覽卡一致） */
  onPalacePremiumUnlock?: () => void;
}

function splitAdvice(text: string | undefined): string[] {
  if (!text || !text.trim()) return [];
  return text
    .split(/\n+/)
    .map((s) => s.replace(/^\s*[-•·]\s*|\d+\.\s*/g, "").trim())
    .filter(Boolean);
}

export function ModuleGroup({
  title,
  sectionKeys,
  sections,
  chartJson,
  useSectionLayout = true,
  className = "",
  showPerSectionTechnical = true,
  sectionVms = null,
  onPalacePremiumUnlock,
}: ModuleGroupProps) {
  const items = sectionKeys
    .map((key) => ({ key, section: sections[key] }))
    .filter((x): x is { key: string; section: SectionPayload } => x.section != null);

  if (items.length === 0) return null;

  return (
    <section className={className}>
      <h2 className="text-base font-bold text-slate-400 mb-3 sticky top-0 bg-slate-900/95 py-2 z-10">
        {title}
      </h2>
      <div className="space-y-6">
        {items.map(({ key, section }) => {
          const wantPalaceShell =
            useSectionLayout && sectionVms != null && sectionVms.length > 0 && isSectionKeyPalaceShell(key);
          const vm = wantPalaceShell ? pickSectionViewModel(sectionVms, key) : undefined;
          const usePalaceShell = wantPalaceShell && vm != null;

          if (usePalaceShell) {
            const techContext = getTechContextForSection(key, chartJson ?? null);
            return (
              <div
                key={key}
                id={getSectionDomAnchorId(key)}
                data-lifebook-section={key}
                className="scroll-mt-6 space-y-2"
              >
                <SectionPalaceTemplate vm={vm} onPremiumUnlock={onPalacePremiumUnlock} />
                {showPerSectionTechnical ? (
                  <section className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-slate-500 hover:text-amber-400/90">
                        <span className="flex items-center gap-2 text-xs uppercase tracking-widest">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60" />
                          查看底層技術依據
                        </span>
                        <span className="text-[10px] transition-transform duration-300 group-open:rotate-180">▼</span>
                      </summary>
                      <div className="mt-3">
                        <TechnicalInsight
                          stars={techContext.stars ?? []}
                          tenGod={techContext.tenGod ?? null}
                          wuxing={techContext.wuxing ?? null}
                        />
                      </div>
                    </details>
                  </section>
                ) : null}
              </div>
            );
          }

          if (useSectionLayout) {
            const techContext = getTechContextForSection(key, chartJson ?? null);
            const layoutSection: LifeBookSection = {
              id: key,
              title: section.title ?? key,
              narrative: section.structure_analysis ?? "",
              advice: splitAdvice(section.strategic_advice),
              techContext: Object.keys(techContext).length > 0 ? techContext : undefined,
              star_palace_quotes:
                section.star_palace_quotes && typeof section.star_palace_quotes === "object" && Object.keys(section.star_palace_quotes).length > 0
                  ? section.star_palace_quotes
                  : undefined,
            };
            return (
              <SectionLayout
                key={key}
                section={layoutSection}
                showPerSectionTechnical={showPerSectionTechnical}
              />
            );
          }
          return <SectionCard key={key} section={section} />;
        })}
      </div>
    </section>
  );
}
