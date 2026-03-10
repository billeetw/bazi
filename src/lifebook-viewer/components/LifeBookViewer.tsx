/**
 * 命書 Viewer 主版面：TOC、權重摘要、模組分組內容、匯入/匯出
 * 目前為預覽版：僅提供閱讀與匯入功能，不提供命書生成與金流。
 */

import React, { useState, useCallback, useEffect } from "react";
import type { LifeBookViewerState } from "../types";
import { MODULE_MAP, SECTION_ORDER, SECTION_PALACE_MAP, getTechContextForSection, getSectionStatus } from "../constants";
import { WeightSummary } from "./WeightSummary";
import { ModuleGroup } from "./ModuleGroup";
import { ChartEmbed } from "./ChartEmbed";
import { TechnicalView } from "./TechnicalView";
import { useImportExport } from "../hooks/useImportExport";
import { loadDemoLifeBook } from "../utils/loadDemoLifeBook";

interface LifeBookViewerProps {
  state: LifeBookViewerState;
  onImport: (next: LifeBookViewerState) => void;
  /** 專家後台模式：僅此時顯示「整頁技術檢視」分頁，一般 viewer 隱藏技術內容 */
  expertMode?: boolean;
}

/** Beta 提示與示範命書按鈕區塊 */
function BetaBanner({
  onLoadDemo,
  loading,
  error,
}: {
  onLoadDemo: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="rounded-xl border border-amber-700/40 bg-amber-950/30 p-4 mb-6">
      <p className="text-amber-200/90 text-sm font-medium mb-2">
        ✨ 目前為命書 Viewer 預覽版，命書生成功能尚未開放。
      </p>
      <p className="text-slate-400 text-xs mb-3">
        目前僅提供閱讀與匯入功能，未開放線上生成命書與付費功能。
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onLoadDemo}
          disabled={loading}
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

export function LifeBookViewer({ state, onImport, expertMode = false }: LifeBookViewerProps) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"user" | "technical">("user");

  const {
    fileInputRef,
    handleFileChange,
    triggerFileSelect,
    importFromPaste,
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

  useEffect(() => {
    if (!hasContent || sectionKeys.length === 0) return;
    const opts: IntersectionObserverInit = { rootMargin: "-15% 0px -55% 0px", threshold: [0, 0.1, 0.5] };
    const observer = new IntersectionObserver((entries) => {
      let best: { id: string; ratio: number } | null = null;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = (e.target as HTMLElement).id;
        if (id && e.intersectionRatio > (best?.ratio ?? 0)) best = { id, ratio: e.intersectionRatio };
      }
      if (best) setActiveSectionKey(best.id);
    }, opts);
    for (const key of sectionKeys) {
      const el = document.getElementById(key);
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

  const handlePasteSubmit = () => {
    importFromPaste(pasteText);
    setPasteText("");
    setPasteOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* 頂欄：標題 + 操作 */}
      <header className="sticky top-0 z-20 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-amber-300/90">人生說明書 · 命書 Viewer</h1>
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
              className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-sm hover:bg-slate-600"
            >
              匯入命書 JSON
            </button>
            <button
              type="button"
              onClick={() => setPasteOpen((v) => !v)}
              className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-sm hover:bg-slate-600"
            >
              貼上 JSON
            </button>
            {hasContent && (
              <>
                <button
                  type="button"
                  onClick={exportJson}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700/80 text-white text-sm hover:bg-emerald-600"
                >
                  匯出 JSON
                </button>
                <button
                  type="button"
                  onClick={exportHtmlDownload}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700/80 text-white text-sm hover:bg-emerald-600"
                >
                  匯出 HTML
                </button>
                <button
                  type="button"
                  onClick={print}
                  className="px-3 py-1.5 rounded-lg bg-slate-600 text-slate-100 text-sm hover:bg-slate-500"
                >
                  列印
                </button>
              </>
            )}
          </div>
        </div>

        {pasteOpen && (
          <div className="max-w-4xl mx-auto px-4 pb-3">
            <p className="text-xs text-slate-500 mb-2">
              匯入命書 JSON（目前僅支援已生成的命書檔案）。命書生成功能尚未開放，請先使用示範命書體驗介面。
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder='貼上命書 JSON，例如 { "ok": true, "sections": { ... } }'
              rows={4}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-200 p-3 text-sm font-mono"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handlePasteSubmit}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-500"
              >
                匯入
              </button>
              <button
                type="button"
                onClick={() => setPasteOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-600 text-slate-200 text-sm hover:bg-slate-500"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </header>

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
        {/* Beta 提示 + 示範命書按鈕（始終顯示） */}
        <BetaBanner onLoadDemo={handleLoadDemo} loading={demoLoading} error={demoError} />

        {viewTab === "technical" && hasTechnical ? (
          <TechnicalView sections={sections} sectionOrder={sectionOrder} />
        ) : !hasContent ? (
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-8 text-center text-slate-400">
            {typeof window !== "undefined" && window.self !== window.top ? (
              <p className="text-lg font-medium text-slate-300">尚未載入命書資料</p>
            ) : (
              <>
                <p className="mb-4">
                  尚無命書內容。請點上方「查看示範命書」體驗介面，或使用「匯入命書 JSON」／「貼上 JSON」載入已生成的命書檔案。
                </p>
                <p className="text-sm">
                  命書生成功能尚未開放，目前僅支援閱讀與匯入既有命書（格式：<code className="text-slate-400">{"{ ok, sections }"}</code> 或含 <code className="text-slate-400">sections</code> 的 JSON）。
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {meta?.client_name && (
              <p className="text-sm text-slate-500 mb-2">命書對象：{meta.client_name}</p>
            )}
            {meta?.birth_info && (
              <p className="text-sm text-slate-500 mb-2">出生：{meta.birth_info}</p>
            )}
            {hasContent && !chart_json && !weight_analysis && (
              <p className="text-xs text-slate-500 mb-2">此命書為舊格式，無命盤或權重資料。</p>
            )}
            {(meta?.generator_version != null || meta?.schema_version != null) ? (
              <p className="text-sm text-slate-500 mb-4">
                模型：{meta.generator_version ?? "(未知模型版本)"}
                {meta.schema_version != null && ` · schema ${meta.schema_version}`}
              </p>
            ) : (
              (meta?.client_name || meta?.birth_info) && <div className="mb-4" />
            )}

            <WeightSummary weight={weight_analysis} className="mb-6" />

            <ChartEmbed className="mb-6" chartJson={chart_json ?? null} />

            {/* 宮位即時診斷（有 chart_json 時顯示） */}
            {chart_json && sectionKeys.length > 0 && (
              <section className="mb-8 rounded-2xl border border-white/10 bg-black/20 p-6" aria-label="宮位即時診斷">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded-full" />
                  宮位即時診斷
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sectionKeys
                    .filter((key) => SECTION_PALACE_MAP[key])
                    .slice(0, 12)
                    .map((key) => {
                      const sec = sections[key];
                      const techContext = getTechContextForSection(key, chart_json);
                      const status = getSectionStatus(techContext);
                      const palace = SECTION_PALACE_MAP[key];
                      const palaceLabel = palace ? `${palace}${palace.endsWith("宮") ? "" : "宮"}` : key;
                      const statusLabel =
                        status === "HIGH_PRESSURE"
                          ? "高壓區"
                          : status === "OPPORTUNITY"
                            ? "機會點"
                            : "穩定區";
                      const rowClass =
                        status === "HIGH_PRESSURE"
                          ? "bg-red-500/5 border-red-500/20"
                          : status === "OPPORTUNITY"
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-emerald-500/5 border-emerald-500/20";
                      const textClass =
                        status === "HIGH_PRESSURE"
                          ? "text-red-200"
                          : status === "OPPORTUNITY"
                            ? "text-amber-200"
                            : "text-emerald-200";
                      const badgeClass =
                        status === "HIGH_PRESSURE"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : status === "OPPORTUNITY"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                      return (
                        <a
                          key={key}
                          href={`#${key}`}
                          className={`flex items-center justify-between p-3 rounded-xl border transition hover:opacity-90 ${rowClass}`}
                        >
                          <span className={`font-medium text-sm ${textClass}`}>
                            {status === "HIGH_PRESSURE" && "⚠️ "}
                            {status === "OPPORTUNITY" && "⚙️ "}
                            {status === "NEUTRAL" && "✨ "}
                            {sec?.title ?? palaceLabel}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0 ml-2 ${badgeClass}`}
                          >
                            {statusLabel}
                          </span>
                        </a>
                      );
                    })}
                </div>
              </section>
            )}

            {/* TOC：側邊進度標籤 + Status Badge + Active 指示線 */}
            <nav className="mb-8" aria-label="章節導航">
              <h2 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">章節</h2>
              <ul className="space-y-1">
                {sectionKeys.map((key) => {
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
                        href={`#${key}`}
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

            {/* 模組分組內容（三層 SectionLayout + 技術依據摺疊） */}
            <div className="space-y-8">
              {Object.entries(MODULE_MAP).map(([modTitle, keys]) => (
                <ModuleGroup
                  key={modTitle}
                  title={modTitle}
                  sectionKeys={keys}
                  sections={sections}
                  chartJson={chart_json}
                  useSectionLayout
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
