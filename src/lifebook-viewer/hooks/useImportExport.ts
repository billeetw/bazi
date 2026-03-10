/**
 * 命書 Viewer：匯入（檔案 / 貼上）、匯出 JSON/HTML、列印
 */

import { useCallback, useRef } from "react";
import type { LifeBookViewerState } from "../types";
import { normalizeApiResponse } from "../utils/normalizeApiResponse";
import { readFileAsState, downloadJson, downloadHtml, exportHtml } from "../utils/importExport";

export function useImportExport(
  state: LifeBookViewerState,
  onImport: (next: LifeBookViewerState) => void
) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      readFileAsState(file)
        .then(onImport)
        .catch((err) => alert("匯入失敗：" + (err.message || err)))
        .finally(() => {
          e.target.value = "";
        });
    },
    [onImport]
  );

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const importFromPaste = useCallback(
    (jsonText: string) => {
      try {
        const raw = JSON.parse(jsonText) as unknown;
        if (!raw || typeof raw !== "object") {
          alert("無效的 JSON");
          return;
        }
        const obj = raw as Record<string, unknown>;
        const next = normalizeApiResponse({
          ok: obj.ok === true,
          sections: obj.sections as Record<string, unknown> | undefined,
          weight_analysis: obj.weight_analysis as LifeBookViewerState["weight_analysis"],
          chart_json: obj.chart_json as Record<string, unknown> | undefined,
          client_name: obj.meta && typeof obj.meta === "object" ? (obj.meta as { client_name?: string }).client_name : undefined,
          birth_info: obj.meta && typeof obj.meta === "object" ? (obj.meta as { birth_info?: string }).birth_info : undefined,
          sections_json: typeof obj.sections_json === "string" ? obj.sections_json : undefined,
        });
        onImport(next);
      } catch {
        alert("貼上的內容不是有效的 JSON");
      }
    },
    [onImport]
  );

  const exportJson = useCallback(() => {
    downloadJson(state, state.meta?.client_name);
  }, [state]);

  const exportHtmlDownload = useCallback(() => {
    downloadHtml(state, state.meta?.client_name);
  }, [state]);

  const print = useCallback(() => {
    const html = exportHtml(state);
    const w = window.open("", "_blank");
    if (!w) {
      alert("無法開啟列印視窗，請允許彈出視窗");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }, [state]);

  return {
    fileInputRef,
    handleFileChange,
    triggerFileSelect,
    importFromPaste,
    exportJson,
    exportHtmlDownload,
    print,
  };
}
