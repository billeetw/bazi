import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LifeBookViewerState } from "../../types";
import type { PalaceId } from "../../themes/palaceVisualTheme";
import { resolvePalacePreset } from "../../themes/palaceThemePresets";
import {
  getPrimarySectionKeyForPalaceId,
  getSectionKeyForPalaceId,
  getTechContextForSection,
  isSectionKeyPalaceShell,
} from "../../constants";
import { clearViewerEntrySource, peekViewerEntrySource } from "../../routing/viewerSession";
import { buildSectionViewModels, pickSectionViewModel } from "../section/sectionViewModel";
import { SectionPalaceTemplate } from "../section/SectionPalaceTemplate";
import { SectionLayout, type LifeBookSection } from "../SectionLayout";
import { generateSingleSectionFromBetaSeed, readBetaSeed } from "../../utils/generateFromBetaSeed";
import { isLifebookApiError } from "../../utils/lifebookApiError";
import { buildLifebookFeedbackUrl } from "../../utils/feedbackLink";
import type { HomeEventName, HomeEventPayload } from "./types";
import styles from "./LifebookPalaceReaderOverlay.module.css";

export type PalaceReaderSurface = "root" | "timeline";

/** P0：對使用者顯示友善文案（節流／伺服器忙碌） */
function userFacingGenerateError(message: string | null | undefined): string {
  if (!message) return "";
  if (message === "__LIFEBOOK_P0_BUSY__") return "目前系統較忙，請稍後再試";
  return message;
}

function splitAdvice(text: string | undefined): string[] {
  if (!text || !text.trim()) return [];
  return text
    .split(/\n+/)
    .map((s) => s.replace(/^\s*[-•·]\s*|\d+\.\s*/g, "").trim())
    .filter(Boolean);
}

export interface LifebookPalaceReaderOverlayProps {
  state: LifeBookViewerState;
  palaceId: PalaceId;
  onClose: () => void;
  /** 單宮按需生成成功後合併回 App state */
  onStateMerged?: (next: LifeBookViewerState) => void;
  /** 與 App `appSurface` 對齊：返回鈕文案與遙測 */
  surface?: PalaceReaderSurface;
  onTelemetry?: (event: HomeEventName, payload: HomeEventPayload) => void;
}

/**
 * Home 上 `#palace-*`：全螢幕閱讀單一宮位（走 `SectionPalaceTemplate`），不強制切到 `?view=viewer` 舊列表頁。
 * v1：有命盤 seed、尚無該宮 primary section 時，自動呼叫 `generate-section` 單章並 merge。
 */
export function LifebookPalaceReaderOverlay({
  state,
  palaceId,
  onClose,
  onStateMerged,
  surface = "root",
  onTelemetry,
}: LifebookPalaceReaderOverlayProps) {
  const sections = state.sections ?? {};
  const chartJson = state.chart_json ?? null;
  const primaryKey = useMemo(() => getPrimarySectionKeyForPalaceId(palaceId), [palaceId]);

  const seedResolved = useMemo(() => {
    return (
      readBetaSeed() ??
      (state.chart_json && state.weight_analysis
        ? {
            chart_json: state.chart_json as Record<string, unknown>,
            weight_analysis: state.weight_analysis as Record<string, unknown>,
          }
        : null)
    );
  }, [state.chart_json, state.weight_analysis]);

  const hasPk = Boolean(primaryKey && sections[primaryKey]);
  const sectionKey = hasPk ? getSectionKeyForPalaceId(palaceId, sections) : primaryKey;
  const section = sectionKey ? sections[sectionKey] : undefined;
  const sectionVms = buildSectionViewModels(state);
  const vm = sectionKey ? pickSectionViewModel(sectionVms, sectionKey) : undefined;

  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const genSeq = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const runGenerate = useCallback(
    (mode: "initial" | "retry") => {
      if (!primaryKey || !seedResolved || !onStateMerged) return;
      if (hasPk) return;
      const appSurfaceLabel = surface === "timeline" ? "timeline" : "root";
      if (mode === "retry") {
        onTelemetry?.("palace_overlay_retry_clicked", {
          palace_id: palaceId,
          section_key: primaryKey,
          app_surface: appSurfaceLabel,
          palace_reader_surface: surface,
        });
      }
      const seq = ++genSeq.current;
      setGenError(null);
      setGenLoading(true);
      onTelemetry?.("palace_section_generate_started", {
        palace_id: palaceId,
        section_key: primaryKey,
        app_surface: appSurfaceLabel,
        palace_reader_surface: surface,
        generate_mode: mode,
      });
      void generateSingleSectionFromBetaSeed(stateRef.current, primaryKey)
        .then(({ state: next, time_context }) => {
          if (genSeq.current !== seq) return;
          onStateMerged(next);
          onTelemetry?.("palace_section_generate_succeeded", {
            palace_id: palaceId,
            section_key: primaryKey,
            app_surface: appSurfaceLabel,
            palace_reader_surface: surface,
            ...(time_context ? { time_context } : {}),
          });
        })
        .catch((e) => {
          if (genSeq.current !== seq) return;
          const msg = e instanceof Error ? e.message : String(e);
          setGenError(msg);
          const tc = isLifebookApiError(e) ? e.time_context : undefined;
          onTelemetry?.("palace_section_generate_failed", {
            palace_id: palaceId,
            section_key: primaryKey,
            app_surface: appSurfaceLabel,
            palace_reader_surface: surface,
            error_message: msg,
            generate_mode: mode,
            ...(tc ? { time_context: tc } : {}),
          });
        })
        .finally(() => {
          if (genSeq.current !== seq) return;
          setGenLoading(false);
        });
    },
    [primaryKey, seedResolved, onStateMerged, hasPk, palaceId, surface, onTelemetry]
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    onTelemetry?.("palace_overlay_opened", {
      palace_id: palaceId,
      app_surface: surface === "timeline" ? "timeline" : "root",
      palace_reader_surface: surface,
    });
  }, [palaceId, surface, onTelemetry]);

  useEffect(() => {
    runGenerate("initial");
  }, [runGenerate]);

  /** 帶 `intent=full` 才保留 `view=viewer`，與 App 內「僅 #palace-* 誤帶 view」的正規化區隔 */
  const fullReaderParams = new URLSearchParams();
  fullReaderParams.set("view", "viewer");
  fullReaderParams.set("intent", "full");
  const entrySrc = peekViewerEntrySource();
  if (entrySrc !== "direct") fullReaderParams.set("source", entrySrc);
  const fullReaderHref = `?${fullReaderParams.toString()}#palace-${palaceId}`;
  const clearEntrySource = () => {
    clearViewerEntrySource();
  };

  const { row } = resolvePalacePreset(palaceId);

  let body: React.ReactNode = null;

  if (!primaryKey) {
    body = (
      <div className={styles.empty} data-testid="lifebook-palace-reader-empty">
        <p className="mb-3">此宮位沒有對應的章節鍵。</p>
      </div>
    );
  } else if (!seedResolved) {
    body = (
      <div className={styles.empty} data-testid="lifebook-palace-reader-empty">
        <p className="mb-3">尚無命書內容，無法顯示宮位正文。</p>
        <p className="text-sm text-slate-400 mb-4">
          請從主站完成排盤後重新開啟本頁，或到完整閱讀頁載入示範／匯入 JSON。
        </p>
        <p>
          <a href={fullReaderHref} onClick={clearEntrySource}>
            前往完整閱讀（示範與匯入）
          </a>
        </p>
      </div>
    );
  } else if (genLoading && !hasPk) {
    body = (
      <div className={styles.loading} data-testid="lifebook-palace-reader-generating">
        <p className="mb-2">正在解析你的命盤（約 2–5 秒）</p>
        <p className="text-sm text-slate-400">「{row.displayNameZh}」單章生成，只向伺服器請求一次。</p>
      </div>
    );
  } else if (genError && !hasPk) {
    body = (
      <div className={styles.empty} data-testid="lifebook-palace-reader-gen-error">
        <p className="mb-3 text-red-300/95">{userFacingGenerateError(genError)}</p>
        <button type="button" className={styles.retry} onClick={() => runGenerate("retry")}>
          重新解析此宮
        </button>
        <p className="mt-4 text-sm text-slate-400">
          <a href={fullReaderHref} onClick={clearEntrySource}>
            改往完整閱讀（示範與匯入）
          </a>
        </p>
      </div>
    );
  } else if (!sectionKey || !section) {
    body = (
      <div className={styles.empty}>
        <p>此份命書未包含「{row.displayNameZh}」對應章節。</p>
        <p className="mt-3 text-sm text-slate-400">
          <a href={fullReaderHref} onClick={clearEntrySource}>
            在完整閱讀檢視其他章節
          </a>
        </p>
      </div>
    );
  } else if (isSectionKeyPalaceShell(sectionKey) && vm) {
    body = (
      <div className={styles.content}>
        <SectionPalaceTemplate vm={vm} onPremiumUnlock={onClose} />
      </div>
    );
  } else {
    const techContext = getTechContextForSection(sectionKey, chartJson);
    const layoutSection: LifeBookSection = {
      id: sectionKey,
      title: section.title ?? sectionKey,
      narrative: section.structure_analysis ?? "",
      advice: splitAdvice(section.strategic_advice),
      techContext: Object.keys(techContext).length > 0 ? techContext : undefined,
      star_palace_quotes:
        section.star_palace_quotes && typeof section.star_palace_quotes === "object"
          ? section.star_palace_quotes
          : undefined,
    };
    body = (
      <div className={styles.content}>
        <SectionLayout section={layoutSection} showPerSectionTechnical={false} />
      </div>
    );
  }

  const backLabel = surface === "timeline" ? "← 返回時間軸" : "← 返回降生藍圖";
  const feedbackHref = buildLifebookFeedbackUrl({
    palace_id: palaceId,
    current_surface: surface === "timeline" ? "timeline" : "root",
  });

  return (
    <div className={styles.wrap} role="dialog" aria-modal="true" aria-label={`${row.displayNameZh}閱讀`} data-testid="lifebook-palace-reader-overlay">
      <div className={styles.bar}>
        <button type="button" className={styles.back} onClick={onClose}>
          {backLabel}
        </button>
        <div className={styles.barActions}>
          {feedbackHref ? (
            <a className={styles.secondary} href={feedbackHref} target="_blank" rel="noopener noreferrer">
              封測回饋
            </a>
          ) : null}
          {section ? (
            <a className={styles.secondary} href={fullReaderHref} onClick={clearEntrySource}>
              進階：完整閱讀
            </a>
          ) : null}
        </div>
      </div>
      {body}
    </div>
  );
}
