/**
 * 命書 Viewer：閱讀主體為模組正文；權重／五行／章節導航等為次要收合層。
 * 目前為預覽版：僅提供閱讀與匯入功能，不提供命書生成與金流。
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { LifeBookViewerState } from "../types";
import {
  MODULE_MAP,
  SECTION_ORDER,
  getTechContextForSection,
  getSectionDomAnchorId,
  getSectionKeyForPalaceId,
  getSectionStatus,
  PALACE_TEMPLATE_PREVIEW_SECTION_KEYS,
  PREVIEW_FOCUS_TO_SECTION_KEY,
  type PalacePreviewFocus,
} from "../constants";
import { WeightSummary } from "./WeightSummary";
import { ModuleGroup } from "./ModuleGroup";
import { ChartEmbed } from "./ChartEmbed";
import { TechnicalView } from "./TechnicalView";
import { PalacePreviewCard } from "./section/PalacePreviewCard";
import { buildSectionViewModels, pickSectionViewModel } from "./section/sectionViewModel";
import { useImportExport } from "../hooks/useImportExport";
import { loadDemoLifeBook } from "../utils/loadDemoLifeBook";
import { generateFromBetaSeed, readBetaSeed } from "../utils/generateFromBetaSeed";
import { parseViewerRoute } from "../routing/parseViewerRoute";
import { persistViewerTimelineNodeContext } from "../routing/homeTimelineHighlight";
import { getViewerNavigationSessionId } from "../routing/viewerNavigationIds";
import { resolveGateContract } from "../viewmodels/contracts";
import { describeViewerTopBanner } from "../utils/viewerGateCopy";
import { buildHomeSummaryFromDocument } from "./home/buildHomeSummaryFromDocument";
import { computeFocus } from "./home/computeFocus";
import { ViewerTimeContextBar } from "./ViewerTimeContextBar";
import { ViewerReadingContext } from "./ViewerReadingContext";
import { ViewerDocumentMeta } from "./ViewerDocumentMeta";
import { ViewerSystemDrawer } from "./ViewerSystemDrawer";

interface LifeBookViewerProps {
  state: LifeBookViewerState;
  onImport: (next: LifeBookViewerState) => void;
  /** 專家後台模式：僅此時顯示「整頁技術檢視」分頁，一般 viewer 隱藏技術內容 */
  expertMode?: boolean;
  /** 僅 gate fixture 驗收（`?fixture=`）；供 DOM / 自動化辨識，不影響正式路徑 */
  gateFixtureId?: string | null;
  /**
   * 多宮預覽與章節導航順序：指定焦點宮時把該章節置前。
   * 來源：`?fixture=…&palace=` 或 `?view=viewer&palace=` 等。
   */
  palacePreviewFocus?: PalacePreviewFocus | null;
  /** Phase 3A–3B：完整閱讀路由／gate／捲動（如 gtag） */
  onViewerTelemetry?: (
    event:
      | "viewer_access_blocked"
      | "viewer_scroll_success"
      | "viewer_route_resolved"
      | "viewer_gate_resolved",
    payload: Record<string, unknown>
  ) => void;
}

/** Beta 提示與示範命書按鈕區塊 */
function BetaBanner({
  onLoadDemo,
  onGenerateFromSeed,
  loading,
  generating,
  generateProgress,
  error,
}: {
  onLoadDemo: () => void;
  onGenerateFromSeed: () => void;
  loading: boolean;
  generating: boolean;
  /** 分段生成進度（1-based done / total） */
  generateProgress?: { done: number; total: number; sectionKey: string } | null;
  error: string | null;
}) {
  return (
    <section id="lifebook-beta-banner" className="rounded-xl border border-amber-700/40 bg-amber-950/30 p-4 mb-6">
      <p className="text-amber-200/90 text-sm font-medium mb-2">
        ✨ 人生說明書 2.0 Beta
      </p>
      <p className="text-slate-400 text-xs mb-3">
        從首頁帶入命盤後會自動生成；內容為<strong className="text-slate-300">資料庫技術版</strong>（與專家後台同源，非 AI 潤稿）。若已解鎖邀請碼，會一併顯示進階章節。
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onGenerateFromSeed}
          disabled={generating}
          className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? "命書生成中…" : "生成我的命書（Beta）"}
        </button>
        <button
          type="button"
          onClick={onLoadDemo}
          disabled={loading || generating}
          className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "載入中…" : "查看示範命書"}
        </button>
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-2" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export function LifeBookViewer({
  state,
  onImport,
  expertMode = false,
  gateFixtureId = null,
  palacePreviewFocus = null,
  onViewerTelemetry,
}: LifeBookViewerProps) {
  const [demoLoading, setDemoLoading] = useState(false);
  const [betaGenerating, setBetaGenerating] = useState(false);
  const [betaGenerateProgress, setBetaGenerateProgress] = useState<{
    done: number;
    total: number;
    sectionKey: string;
  } | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"user" | "technical">("user");
  const [routeTick, setRouteTick] = useState(0);
  const [systemDrawerOpen, setSystemDrawerOpen] = useState(false);
  const [viewerNoticeDismissed, setViewerNoticeDismissed] = useState(false);
  const autoGenerateTriedRef = useRef(false);
  const lastScrollReportRef = useRef<string | null>(null);
  const blockedReportedRef = useRef<string | null>(null);
  const onTelemetryRef = useRef(onViewerTelemetry);
  onTelemetryRef.current = onViewerTelemetry;

  const navigationInstanceId = useMemo(
    () =>
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `ni_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
    []
  );
  const navigationSessionId = useMemo(() => getViewerNavigationSessionId(), []);
  const navTelemetryDims = useMemo(
    () => ({
      navigation_instance_id: navigationInstanceId,
      navigation_session_id: navigationSessionId,
    }),
    [navigationInstanceId, navigationSessionId]
  );

  const {
    fileInputRef,
    handleFileChange,
    triggerFileSelect,
    exportJson,
    exportHtmlDownload,
    print,
  } = useImportExport(state, onImport);

  const sections = state.sections ?? {};
  const weight_analysis = state.weight_analysis ?? null;
  const chart_json = state.chart_json ?? null;
  const meta = state.meta ?? null;
  const hasContent = Object.keys(sections).length > 0;
  const sectionKeys = Object.keys(sections);
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);

  const hasTechnical =
    expertMode &&
    (meta?.output_mode === "technical" || sectionKeys.some((k) => sections[k]?.technical != null));
  const sectionOrder = (SECTION_ORDER as readonly string[]).filter((k) => k in sections).length > 0
    ? (SECTION_ORDER as readonly string[]).filter((k) => k in sections)
    : sectionKeys;
  const sectionVms = buildSectionViewModels(state);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const bump = () => setRouteTick((n) => n + 1);
    window.addEventListener("hashchange", bump);
    window.addEventListener("popstate", bump);
    return () => {
      window.removeEventListener("hashchange", bump);
      window.removeEventListener("popstate", bump);
    };
  }, []);

  const viewerRoute = useMemo(() => {
    if (typeof window === "undefined") return parseViewerRoute("http://localhost/");
    return parseViewerRoute(window.location.href);
  }, [routeTick]);

  useEffect(() => {
    if (!viewerRoute.isViewerMode) return;
    if (viewerRoute.timelineNodeId) {
      persistViewerTimelineNodeContext(viewerRoute.timelineNodeId);
    }
  }, [viewerRoute.isViewerMode, viewerRoute.timelineNodeId]);

  const deepLinkSectionKey =
    viewerRoute.palaceId && hasContent ? getSectionKeyForPalaceId(viewerRoute.palaceId, sections) : null;
  const deepLinkGate =
    deepLinkSectionKey && !gateFixtureId ? resolveGateContract(meta, deepLinkSectionKey) : null;

  const sectionSig = sectionKeys.slice().sort().join(",");
  const viewerTopBanner = useMemo(() => {
    if (gateFixtureId || !viewerRoute.palaceId || !deepLinkGate) return null;
    return describeViewerTopBanner(deepLinkGate, { lockReason: deepLinkGate.lockReason });
  }, [gateFixtureId, viewerRoute.palaceId, deepLinkGate]);

  const homeSummary = useMemo(() => buildHomeSummaryFromDocument(state), [state]);
  const activeTimelineNode = useMemo(() => {
    if (!viewerRoute.isViewerMode) return null;
    if (viewerRoute.timelineNodeId) {
      return homeSummary.timeline.find((n) => n.id === viewerRoute.timelineNodeId) ?? null;
    }
    if (viewerRoute.year != null) {
      return homeSummary.timeline.find((n) => n.year === viewerRoute.year) ?? null;
    }
    return null;
  }, [viewerRoute.isViewerMode, viewerRoute.timelineNodeId, viewerRoute.year, homeSummary.timeline]);

  const contextPalaceFromNode = useMemo(() => {
    if (!activeTimelineNode || !viewerRoute.isViewerMode) return null;
    const f = computeFocus(state, {
      timelineNode: activeTimelineNode,
      matrix: homeSummary.palaceMatrix ?? undefined,
      auditCta: homeSummary.auditCta ?? undefined,
      timelineAll: homeSummary.timeline,
    });
    return f?.primaryPalaceId ?? null;
  }, [
    state,
    activeTimelineNode,
    homeSummary.palaceMatrix,
    homeSummary.auditCta,
    homeSummary.timeline,
    viewerRoute.isViewerMode,
  ]);

  const routeResolvedFullKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (gateFixtureId) return;
    if (!hasContent) return;
    if (!viewerRoute.isViewerMode) return;
    if (typeof window === "undefined") return;
    const routeKey = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    /** instance_id：同 URL refresh 視為新的一次載入，可再送 `viewer_route_resolved` */
    const fullKey = `${routeKey}|${sectionSig}|${navigationInstanceId}`;
    if (routeResolvedFullKeyRef.current === fullKey) return;
    routeResolvedFullKeyRef.current = fullKey;

    const focusForTelemetry =
      activeTimelineNode != null
        ? computeFocus(state, {
            timelineNode: activeTimelineNode,
            matrix: homeSummary.palaceMatrix ?? undefined,
            auditCta: homeSummary.auditCta ?? undefined,
            timelineAll: homeSummary.timeline,
          })
        : null;

    onTelemetryRef.current?.("viewer_route_resolved", {
      ...navTelemetryDims,
      is_viewer_mode: true,
      year: viewerRoute.year,
      source: viewerRoute.source,
      intent_full: viewerRoute.intentFull,
      palace_id: viewerRoute.palaceId,
      section_key: deepLinkSectionKey,
      timeline_node_id: viewerRoute.timelineNodeId,
      hash: window.location.hash.length > 1 ? window.location.hash.slice(1) : undefined,
      focus_tone: focusForTelemetry?.tone,
    });

    if (deepLinkSectionKey && viewerRoute.palaceId) {
      const g = resolveGateContract(meta, deepLinkSectionKey);
      onTelemetryRef.current?.("viewer_gate_resolved", {
        ...navTelemetryDims,
        section_key: deepLinkSectionKey,
        palace_id: viewerRoute.palaceId,
        gate: g.gate,
        preview_mode: g.previewMode,
        is_locked: g.isLocked,
        cta_variant: g.ctaVariant,
        year: viewerRoute.year,
        source: viewerRoute.source,
        timeline_node_id: viewerRoute.timelineNodeId,
        focus_tone: focusForTelemetry?.tone,
      });
    }
  }, [
    gateFixtureId,
    hasContent,
    viewerRoute,
    deepLinkSectionKey,
    meta,
    routeTick,
    sectionSig,
    navigationInstanceId,
    navTelemetryDims,
    activeTimelineNode,
    state,
    homeSummary.palaceMatrix,
    homeSummary.auditCta,
    homeSummary.timeline,
  ]);

  useEffect(() => {
    if (gateFixtureId) return;
    if (!hasContent) return;
    if (!viewerRoute.isViewerMode) return;
    if (!viewerRoute.palaceId || !deepLinkSectionKey) return;
    const g = resolveGateContract(meta, deepLinkSectionKey);
    if (g.gate !== "locked") return;
    const key = `${viewerRoute.palaceId}:${deepLinkSectionKey}:${navigationInstanceId}`;
    if (blockedReportedRef.current === key) return;
    blockedReportedRef.current = key;
    onTelemetryRef.current?.("viewer_access_blocked", {
      ...navTelemetryDims,
      section_key: deepLinkSectionKey,
      palace_id: viewerRoute.palaceId,
      year: viewerRoute.year,
      source: viewerRoute.source,
      timeline_node_id: viewerRoute.timelineNodeId,
      reason: g.lockReason,
    });
  }, [gateFixtureId, hasContent, viewerRoute, deepLinkSectionKey, meta, navigationInstanceId, navTelemetryDims]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasContent) return;
    if (!viewerRoute.isViewerMode) return;
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const id = decodeURIComponent(hash.slice(1));
    const glowClasses = ["ring-4", "ring-amber-400/45", "rounded-2xl", "transition-shadow", "duration-500"];
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (!gateFixtureId) {
        if (lastScrollReportRef.current !== id) {
          lastScrollReportRef.current = id;
          const sk =
            viewerRoute.palaceId != null ? getSectionKeyForPalaceId(viewerRoute.palaceId, sections) : null;
          onTelemetryRef.current?.("viewer_scroll_success", {
            ...navTelemetryDims,
            target_id: id,
            year: viewerRoute.year,
            source: viewerRoute.source,
            timeline_node_id: viewerRoute.timelineNodeId,
            section_key: sk,
            palace_id: viewerRoute.palaceId,
          });
        }
        if (viewerRoute.source !== "direct" && viewerRoute.palaceId) {
          el.classList.add(...glowClasses);
          window.setTimeout(() => {
            el.classList.remove(...glowClasses);
          }, 3500);
        }
      }
    }, 450);

    return () => {
      window.clearTimeout(t);
    };
  }, [
    hasContent,
    sectionOrder.join(","),
    viewerRoute.isViewerMode,
    viewerRoute.palaceId,
    viewerRoute.year,
    viewerRoute.source,
    viewerRoute.timelineNodeId,
    routeTick,
    gateFixtureId,
    navTelemetryDims,
    sections,
  ]);

  const palacePreviewVms = useMemo(
    () =>
      PALACE_TEMPLATE_PREVIEW_SECTION_KEYS.map((k) => pickSectionViewModel(sectionVms, k)).filter(
        (vm): vm is NonNullable<typeof vm> => vm != null
      ),
    [sectionVms]
  );

  const orderedPalacePreviewVms = useMemo(() => {
    if (!palacePreviewFocus) return palacePreviewVms;
    const focusKey = PREVIEW_FOCUS_TO_SECTION_KEY[palacePreviewFocus];
    const idx = palacePreviewVms.findIndex((vm) => vm.sectionKey === focusKey);
    if (idx <= 0) return palacePreviewVms;
    const next = [...palacePreviewVms];
    const [first] = next.splice(idx, 1);
    next.unshift(first);
    return next;
  }, [palacePreviewVms, palacePreviewFocus]);

  const orderedSectionKeys = useMemo(() => {
    if (!palacePreviewFocus) return sectionKeys;
    const focusKey = PREVIEW_FOCUS_TO_SECTION_KEY[palacePreviewFocus];
    if (!sectionKeys.includes(focusKey)) return sectionKeys;
    return [focusKey, ...sectionKeys.filter((k) => k !== focusKey)];
  }, [sectionKeys, palacePreviewFocus]);

  useEffect(() => {
    if (!palacePreviewFocus) return;
    const focusKey = PREVIEW_FOCUS_TO_SECTION_KEY[palacePreviewFocus];
    const vm = pickSectionViewModel(sectionVms, focusKey);
    if (!vm) return;
    const anchor = vm.palaceId ?? focusKey;
    const el = document.getElementById(`lifebook-palace-preview-${anchor}`);
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [palacePreviewFocus, sectionVms]);

  const openSystemDrawer = useCallback(() => {
    setSystemDrawerOpen(true);
  }, []);

  useEffect(() => {
    if (!hasContent || sectionKeys.length === 0) return;
    const opts: IntersectionObserverInit = { rootMargin: "-15% 0px -55% 0px", threshold: [0, 0.1, 0.5] };
    const observer = new IntersectionObserver((entries) => {
      let best: { key: string; ratio: number } | null = null;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        const sectionKey = el.dataset.lifebookSection ?? el.id;
        if (sectionKey && e.intersectionRatio > (best?.ratio ?? 0)) best = { key: sectionKey, ratio: e.intersectionRatio };
      }
      if (best) setActiveSectionKey(best.key);
    }, opts);
    for (const key of sectionKeys) {
      const anchor = getSectionDomAnchorId(key);
      const el = document.getElementById(anchor);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [hasContent, sectionKeys.join(",")]);

  const handleLoadDemo = useCallback(async () => {
    setDemoError(null);
    setDemoLoading(true);
    try {
      const next = await loadDemoLifeBook();
      onImport(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "載入示範命書失敗";
      setDemoError(message);
      console.error("[lifebook-viewer] loadDemoLifeBook:", err);
    } finally {
      setDemoLoading(false);
    }
  }, [onImport]);

  const handleGenerateFromSeed = useCallback(async () => {
    setDemoError(null);
    setBetaGenerating(true);
    try {
      const seed = readBetaSeed();
      if (!seed) {
        throw new Error("尚未找到命盤資料。請先在同一個網址完成一次命盤計算（例如同為 127.0.0.1:5191），再開啟命書 Beta。");
      }
      const next = await generateFromBetaSeed(seed);
      onImport(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "命書生成失敗";
      setDemoError(message);
      console.error("[lifebook-viewer] generateFromBetaSeed:", err);
    } finally {
      setBetaGenerating(false);
    }
  }, [onImport]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    /** 僅主站「開啟命書 Beta」會帶 autogen=1；直接開 viewer 不會自動打滿 /generate，避免 Worker 資源爆量 */
    if (params.get("autogen") !== "1") return;
    if (sessionStorage.getItem("lifebook_viewer_autogen_ran") === "1") return;
    if (autoGenerateTriedRef.current || hasContent || betaGenerating) return;
    const seed = readBetaSeed();
    if (!seed) return;
    try {
      sessionStorage.setItem("lifebook_viewer_autogen_ran", "1");
    } catch {
      /* private mode */
    }
    autoGenerateTriedRef.current = true;
    void handleGenerateFromSeed();
  }, [hasContent, betaGenerating, handleGenerateFromSeed]);

  const lockedSections = Array.isArray((meta as unknown as { locked_sections?: unknown[] })?.locked_sections)
    ? ((meta as unknown as { locked_sections?: Array<{ section_key?: string; teaser?: { title?: string; teaser?: string } }> }).locked_sections ?? [])
    : [];
  const hasAnyDisplayContent = hasContent || lockedSections.length > 0;

  return (
    <div
      className="min-h-screen bg-slate-900 text-slate-200"
      data-gate-fixture={gateFixtureId ?? undefined}
      data-palace-preview-focus={palacePreviewFocus ?? undefined}
    >
      {/* 頂欄：與正文同寬、標題與內容字階一致 */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-slate-50 tracking-wide font-sans">
            人生說明書
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={triggerFileSelect}
              className="px-3 py-1.5 rounded-lg border border-white/15 bg-transparent text-sm text-slate-200 hover:bg-white/5"
            >
              匯入命書
            </button>
            {!hasContent ? (
              <button
                type="button"
                onClick={handleLoadDemo}
                disabled={demoLoading}
                className="px-3 py-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 text-sm text-amber-100/95 hover:bg-amber-500/15 disabled:opacity-50"
              >
                {demoLoading ? "載入示範中…" : "載入示範命書"}
              </button>
            ) : null}
            {hasContent && (
              <>
                <button
                  type="button"
                  onClick={exportJson}
                  className="px-3 py-1.5 rounded-lg border border-white/15 bg-transparent text-sm text-slate-200 hover:bg-white/5"
                >
                  匯出 JSON
                </button>
                <button
                  type="button"
                  onClick={exportHtmlDownload}
                  className="px-3 py-1.5 rounded-lg border border-white/15 bg-transparent text-sm text-slate-200 hover:bg-white/5"
                >
                  匯出 HTML
                </button>
                <button
                  type="button"
                  onClick={print}
                  className="px-3 py-1.5 rounded-lg border border-white/15 bg-transparent text-sm text-slate-200 hover:bg-white/5"
                >
                  列印
                </button>
              </>
            )}
          </div>
        </div>
        {!hasContent && demoError ? (
          <div className="max-w-4xl mx-auto px-4 pb-2 text-xs text-red-400" role="alert">
            {demoError}
          </div>
        ) : null}
      </header>

      {hasContent && meta?.viewer_notice_zh && !viewerNoticeDismissed ? (
        <div className="border-b border-amber-500/30 bg-amber-950/25">
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-start sm:justify-between">
            <p className="text-xs text-amber-100/90 leading-relaxed flex-1">{meta.viewer_notice_zh}</p>
            <button
              type="button"
              onClick={() => setViewerNoticeDismissed(true)}
              className="shrink-0 text-xs text-amber-200/95 hover:text-amber-50 underline underline-offset-2 self-start"
            >
              知道了
            </button>
          </div>
        </div>
      ) : null}

      <ViewerSystemDrawer open={systemDrawerOpen} onClose={() => setSystemDrawerOpen(false)} title="系統與示範命書">
        <BetaBanner
          onLoadDemo={handleLoadDemo}
          onGenerateFromSeed={handleGenerateFromSeed}
          loading={demoLoading}
          generating={betaGenerating}
          generateProgress={betaGenerateProgress}
          error={demoError}
        />
        <p className="mt-4 text-xs text-slate-500">
          試讀模式與方案解鎖狀態仍由命書 meta／gate 決定；此處僅為產品與資料入口，非閱讀主畫面。
        </p>
      </ViewerSystemDrawer>

      {/* 專家後台：技術版命書時顯示「使用者視角」|「技術檢視」分頁 */}
      {hasTechnical && (
        <div className="border-b border-slate-700/50 bg-slate-800/30">
          <div className="max-w-4xl mx-auto px-4 flex gap-1">
            <button
              type="button"
              onClick={() => setViewTab("user")}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition ${
                viewTab === "user"
                  ? "bg-slate-800 text-amber-300 border-b-2 border-amber-400 -mb-px"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              使用者視角
            </button>
            <button
              type="button"
              onClick={() => setViewTab("technical")}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition ${
                viewTab === "technical"
                  ? "bg-slate-800 text-amber-300 border-b-2 border-amber-400 -mb-px"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              技術檢視（自用）
            </button>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6">
        {viewTab === "technical" && hasTechnical ? (
          <TechnicalView sections={sections} sectionOrder={sectionOrder} />
        ) : !hasAnyDisplayContent ? (
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-8 text-center text-slate-400">
            {typeof window !== "undefined" && window.self !== window.top ? (
              <p className="text-lg font-medium text-slate-300">尚未載入命書資料</p>
            ) : (
              <>
                <p className="mb-4">
                  尚無命書內容。請點「載入示範命書」（內建 <code className="text-slate-400">public/demo-lifebook.json</code>
                  ），或使用「匯入命書」；亦可於網址加上 <code className="text-slate-400">demo=1</code> 自動載入示範檔。
                </p>
                <p className="text-sm">
                  命書生成功能尚未開放，目前僅支援閱讀與匯入既有命書（格式：
                  <code className="text-slate-400">{"{ ok, sections }"}</code> 或含{" "}
                  <code className="text-slate-400">sections</code> 的 JSON）。
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {viewerRoute.isViewerMode && viewerRoute.palaceId ? (
              <ViewerReadingContext
                palaceId={viewerRoute.palaceId}
                source={viewerRoute.source}
                timelineNodeLabel={activeTimelineNode?.label ?? null}
                year={viewerRoute.year}
              />
            ) : null}

            {viewerRoute.isViewerMode &&
            hasContent &&
            (activeTimelineNode != null || viewerRoute.timelineNodeId != null || viewerRoute.year != null) ? (
              <ViewerTimeContextBar
                resolvedNode={activeTimelineNode}
                timelineNodeId={viewerRoute.timelineNodeId}
                year={viewerRoute.year}
                scrollPalaceId={viewerRoute.palaceId}
                contextPalaceId={contextPalaceFromNode}
              />
            ) : null}

            {viewerTopBanner?.kind === "locked" ? (
              <div
                className="mb-4 rounded-xl border border-rose-500/35 bg-rose-950/25 px-4 py-3 text-sm text-rose-100/90"
                role="alert"
              >
                <strong className="font-semibold text-rose-100">{viewerTopBanner.title}</strong>{" "}
                <span className="text-rose-100/80">{viewerTopBanner.body}</span>
              </div>
            ) : null}
            {viewerTopBanner?.kind === "teaser" ? (
              <div
                className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/90"
                role="status"
              >
                <strong className="font-semibold text-amber-200">{viewerTopBanner.title}</strong>{" "}
                <span className="text-amber-100/85">{viewerTopBanner.body}</span>
              </div>
            ) : null}

            {lockedSections.length > 0 && (
              <section className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-900/10 p-4">
                <h3 className="text-sm font-bold text-amber-300 mb-3">進階版章節（已鎖定）</h3>
                <div className="space-y-2">
                  {lockedSections.map((item) => (
                    <div key={item.section_key || "locked"} className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="text-sm text-amber-200 font-semibold">{item.teaser?.title || item.section_key || "進階章節"}</div>
                      <div className="text-xs text-slate-400 mt-1">{item.teaser?.teaser || "解鎖後查看完整內容"}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 閱讀主體：模組正文優先（非產品說明、非分析儀表板） */}
            <div className="space-y-8">
              {Object.entries(MODULE_MAP).map(([modTitle, keys]) => (
                <ModuleGroup
                  key={modTitle}
                  title={modTitle}
                  sectionKeys={keys}
                  sections={sections}
                  chartJson={chart_json}
                  useSectionLayout
                  showPerSectionTechnical={expertMode === true}
                  sectionVms={sectionVms}
                  onPalacePremiumUnlock={openSystemDrawer}
                />
              ))}
            </div>

            <details className="mt-10 mb-6 group rounded-xl border border-slate-700/45 bg-slate-800/10 open:bg-slate-800/20">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-400 marker:content-none flex items-center justify-between gap-2">
                <span>章節導航（次要）</span>
                <span className="text-slate-600 text-xs group-open:rotate-180 transition">▼</span>
              </summary>
              <nav className="px-2 pb-4 pt-1" aria-label="章節導航">
                <ul className="space-y-1">
                  {orderedSectionKeys.map((key) => {
                    const sec = sections[key];
                    const techContext = getTechContextForSection(key, chart_json);
                    const status = getSectionStatus(techContext);
                    const isActive = activeSectionKey === key;
                    const statusLabel =
                      status === "HIGH_PRESSURE"
                        ? "高壓區"
                        : status === "OPPORTUNITY"
                          ? "機會點"
                          : "穩定區";
                    const badgeClass =
                      status === "HIGH_PRESSURE"
                        ? "bg-red-500/10 text-red-300 border-red-500/30 shadow-[0_0_12px_rgba(255,77,79,0.15)]"
                        : status === "OPPORTUNITY"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(250,173,20,0.15)]"
                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(82,196,26,0.12)]";
                    return (
                      <li key={key}>
                        <a
                          href={`#${getSectionDomAnchorId(key)}`}
                          className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border-l-4 transition-all ${
                            isActive
                              ? "border-amber-400 bg-amber-500/10 text-amber-100 font-semibold"
                              : "border-transparent hover:bg-slate-800/50 text-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                              status === "HIGH_PRESSURE"
                                ? "bg-red-400 shadow-[0_0_6px_#ff4d4f]"
                                : status === "OPPORTUNITY"
                                  ? "bg-amber-400 shadow-[0_0_6px_#faad14]"
                                  : "bg-emerald-400 shadow-[0_0_6px_#52c41a]"
                            }`}
                            aria-hidden
                          />
                          <span className="flex-1 min-w-0 truncate text-sm">
                            {sec?.title ?? key}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0 ${badgeClass}`}
                          >
                            {statusLabel}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </details>

            <details className="mb-6 group rounded-xl border border-slate-700/45 bg-slate-800/10 open:bg-slate-800/20">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-400 marker:content-none flex items-center justify-between gap-2">
                <span>權重摘要與命盤五行（分析層 · 非閱讀正文）</span>
                <span className="text-slate-600 text-xs group-open:rotate-180 transition">▼</span>
              </summary>
              <div className="px-4 pb-4 space-y-4">
                <WeightSummary weight={weight_analysis} className="" />
                <ChartEmbed chartJson={chart_json ?? null} />
              </div>
            </details>

            {orderedPalacePreviewVms.length > 0 ? (
              <details className="mb-8 group rounded-xl border border-slate-700/45 bg-slate-800/10 open:bg-slate-800/20">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-400 marker:content-none flex items-center justify-between gap-2">
                  <span>十二宮速覽（網格 · 決策入口）</span>
                  <span className="text-slate-600 text-xs group-open:rotate-180 transition">▼</span>
                </summary>
                <div className="px-4 pb-6 pt-2" aria-label="宮位預覽入口">
                  <p className="text-xs text-slate-500 mb-4">與 Root「十二宮領域」互補；完整閱讀仍以章節正文為主。</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {orderedPalacePreviewVms.map((vm) => (
                      <div
                        key={vm.sectionKey}
                        id={`lifebook-palace-preview-${vm.palaceId ?? vm.sectionKey}`}
                      >
                        <PalacePreviewCard vm={vm} onPremiumUnlock={openSystemDrawer} />
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ) : null}

            <ViewerDocumentMeta
              meta={meta}
              showLegacyFormatNote={hasContent && !chart_json && !weight_analysis}
            />
          </>
        )}
      </main>
    </div>
  );
}
