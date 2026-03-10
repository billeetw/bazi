/**
 * 模組區塊：標題 + 該組章節列表（三層 SectionLayout 或既有 SectionCard）
 */

import React from "react";
import type { SectionPayload } from "../types";
import { SectionCard } from "./SectionCard";
import { SectionLayout, type LifeBookSection } from "./SectionLayout";
import { getTechContextForSection } from "../constants";

interface ModuleGroupProps {
  title: string;
  sectionKeys: readonly string[];
  sections: Record<string, SectionPayload>;
  chartJson?: Record<string, unknown> | null;
  useSectionLayout?: boolean;
  className?: string;
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
            return <SectionLayout key={key} section={layoutSection} id={key} />;
          }
          return <SectionCard key={key} section={section} id={key} />;
        })}
      </div>
    </section>
  );
}
