/**
 * 將 API 回傳或已存命書 JSON 正規化為 LifeBookViewerState（可當 LifeBookDocument 使用者視角）
 * 舊 JSON 無 meta.schema_version 時會補上共用常數，以符合 LifeBookDocument 介面。
 */

import type { SectionPayload, WeightAnalysis, LifeBookViewerState, LifeBookMeta, LifeBookSectionTechnical } from "../types";
import { SECTION_ORDER } from "../constants";
import { LIFEBOOK_SCHEMA_VERSION } from "../../../js/lifebook-version.js";
import { omitDeprecatedSihuaLayers } from "./chartJsonSanitize";

function normalizeSection(raw: unknown, key: string): SectionPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const star_palace_quotes =
    o.star_palace_quotes && typeof o.star_palace_quotes === "object" && !Array.isArray(o.star_palace_quotes)
      ? (o.star_palace_quotes as Record<string, string>)
      : undefined;
  const section: SectionPayload = {
    section_key: typeof o.section_key === "string" ? o.section_key : key,
    title: typeof o.title === "string" ? o.title : `[${key}]`,
    importance_level: ["high", "medium", "low"].includes(String(o.importance_level))
      ? (o.importance_level as SectionPayload["importance_level"])
      : "medium",
    structure_analysis: String(o.structure_analysis ?? ""),
    behavior_pattern: String(o.behavior_pattern ?? ""),
    blind_spots: String(o.blind_spots ?? ""),
    strategic_advice: String(o.strategic_advice ?? ""),
  };
  if (o.output_mode === "technical" || o.output_mode === "ai") {
    section.output_mode = o.output_mode;
  }
  if (o.technical && typeof o.technical === "object" && !Array.isArray(o.technical)) {
    section.technical = o.technical as LifeBookSectionTechnical;
  }
  if (star_palace_quotes && Object.keys(star_palace_quotes).length > 0) {
    section.star_palace_quotes = star_palace_quotes;
  }
  return section;
}

export interface NormalizeInput {
  ok?: boolean;
  sections?: Record<string, unknown>;
  weight_analysis?: WeightAnalysis | null;
  chart_json?: Record<string, unknown> | null;
  client_name?: string;
  birth_info?: string;
  /** 或直接傳入 meta 物件（如 demo / 已存命書） */
  meta?: { client_name?: string; birth_info?: string; output_mode?: "ai" | "technical" } | null;
  /** 已存命書可能只傳 sections_json 字串 */
  sections_json?: string;
  locked_sections?: Array<{
    section_key?: string;
    is_locked?: boolean;
    lock_reason?: string;
    teaser?: { section_key?: string; title?: string; teaser?: string };
  }>;
  plan_tier?: "free" | "pro";
  plan_matrix_version?: string;
  available_sections?: string[];
}

/**
 * 將 API 或上傳的 JSON 轉成 Viewer 狀態
 */
export function normalizeApiResponse(input: NormalizeInput): LifeBookViewerState {
  let sections: Record<string, SectionPayload> = {};

  if (input.sections && typeof input.sections === "object") {
    for (const key of SECTION_ORDER) {
      const raw = input.sections[key];
      const sec = normalizeSection(raw, key);
      if (sec) sections[key] = sec;
    }
  }

  if (input.sections_json && typeof input.sections_json === "string") {
    try {
      const parsed = JSON.parse(input.sections_json) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") {
        for (const key of SECTION_ORDER) {
          const raw = parsed[key];
          const sec = normalizeSection(raw, key);
          if (sec) sections[key] = sec;
        }
      }
    } catch {
      /* ignore */
    }
  }

  const weight_analysis: WeightAnalysis | undefined =
    input.weight_analysis && typeof input.weight_analysis === "object"
      ? {
          top_focus_palaces: Array.isArray(input.weight_analysis.top_focus_palaces)
            ? input.weight_analysis.top_focus_palaces
            : undefined,
          risk_palaces: Array.isArray(input.weight_analysis.risk_palaces)
            ? input.weight_analysis.risk_palaces
            : undefined,
          stable_palaces: Array.isArray(input.weight_analysis.stable_palaces)
            ? input.weight_analysis.stable_palaces
            : undefined,
          importance_map:
            input.weight_analysis.importance_map && typeof input.weight_analysis.importance_map === "object"
              ? input.weight_analysis.importance_map
              : undefined,
        }
      : undefined;

  const metaRaw =
    input.meta && typeof input.meta === "object"
      ? { ...input.meta }
      : input.client_name != null || input.birth_info != null
        ? { client_name: input.client_name, birth_info: input.birth_info }
        : {};
  const meta: LifeBookMeta = {
    schema_version: (metaRaw as LifeBookMeta).schema_version ?? LIFEBOOK_SCHEMA_VERSION,
    generator_version: (metaRaw as LifeBookMeta).generator_version,
    id: (metaRaw as LifeBookMeta).id,
    chart_id: (metaRaw as LifeBookMeta).chart_id,
    locale: (metaRaw as LifeBookMeta).locale,
    client_name: metaRaw.client_name,
    birth_info: metaRaw.birth_info,
    created_at: (metaRaw as LifeBookMeta).created_at,
    output_mode: (metaRaw as LifeBookMeta).output_mode,
    viewer_notice_zh: (metaRaw as LifeBookMeta).viewer_notice_zh,
  };

  if (Array.isArray(input.locked_sections)) {
    (meta as unknown as Record<string, unknown>).locked_sections = input.locked_sections;
  }
  if (typeof input.plan_tier === "string") {
    (meta as unknown as Record<string, unknown>).plan_tier = input.plan_tier;
  }
  if (typeof input.plan_matrix_version === "string") {
    (meta as unknown as Record<string, unknown>).plan_matrix_version = input.plan_matrix_version;
  }
  if (Array.isArray(input.available_sections)) {
    (meta as unknown as Record<string, unknown>).available_sections = input.available_sections;
  }

  const rawChart = input.chart_json && typeof input.chart_json === "object" ? input.chart_json : null;
  return {
    meta,
    sections,
    weight_analysis: weight_analysis ?? null,
    chart_json: rawChart ? omitDeprecatedSihuaLayers(rawChart) ?? null : null,
  };
}
