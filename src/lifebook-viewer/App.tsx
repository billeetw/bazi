/**
 * 命書 Viewer 根元件：狀態 + LifeBookViewer
 * 可由外部傳入 initialDocument（流水線組裝後的 LifeBookDocument），viewer 只負責顯示。
 * 若在 iframe 內，會向 parent 發送 'lifebook-viewer-ready'，並監聽 parent 回傳的 LIFEBOOK_DOC。
 * expertMode：來自 URL ?mode=expert 或 postMessage LIFEBOOK_DOC.expertMode，僅專家後台為 true，用於顯示「整頁技術檢視」。
 */

import React, { useEffect, useState } from "react";
import { LifeBookViewer } from "./components/LifeBookViewer";
import { useLifeBookData } from "./hooks/useLifeBookData";
import type { LifeBookDocument } from "./types";

function getExpertModeFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "expert";
  } catch {
    return false;
  }
}

export interface AppProps {
  /** 流水線組裝好的命書文件；也可透過 window.__LIFEBOOK_INITIAL_STATE__ 在掛載前注入 */
  initialDocument?: LifeBookDocument | null;
}

const STORAGE_KEY = "lifebook_doc";

function parseStoredDoc(raw: string | null): LifeBookDocument | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as LifeBookDocument;
    if (parsed?.sections && typeof parsed.sections === "object" && Object.keys(parsed.sections).length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error("Failed to parse lifebook_doc:", e);
  }
  return null;
}

function getInitialDocument(initialDocument: LifeBookDocument | null | undefined): LifeBookDocument | null {
  if (initialDocument && Object.keys(initialDocument.sections ?? {}).length > 0) return initialDocument;
  if (typeof window === "undefined") return null;
  try {
    const fromWindow = (window as unknown as { __LIFEBOOK_INITIAL_STATE__?: LifeBookDocument }).__LIFEBOOK_INITIAL_STATE__;
    if (fromWindow && Object.keys(fromWindow.sections ?? {}).length > 0) return fromWindow;
  } catch {
    /* ignore */
  }
  try {
    const fromSession = parseStoredDoc(sessionStorage.getItem(STORAGE_KEY));
    if (fromSession) return fromSession;
  } catch {
    /* sessionStorage may throw in iframe/sandbox */
  }
  try {
    const fromLocal = parseStoredDoc(localStorage.getItem(STORAGE_KEY));
    if (fromLocal) return fromLocal;
  } catch {
    /* localStorage may throw when disabled or in private mode */
  }
  return null;
}

export function App({ initialDocument }: AppProps) {
  const initial = getInitialDocument(initialDocument);
  const [expertMode, setExpertMode] = useState(getExpertModeFromUrl);
  console.log("[lifebook-viewer] App initial doc:", initial ? { sectionsCount: Object.keys(initial.sections || {}).length } : null);
  const { state, setState } = useLifeBookData(initial);

  useEffect(() => {
    if (typeof window === "undefined" || window.self === window.top) return;
    window.parent.postMessage("lifebook-viewer-ready", "*");
    const handler = (event: MessageEvent) => {
      const data = event.data as { type?: string; doc?: LifeBookDocument; expertMode?: boolean } | undefined;
      if (data?.type !== "LIFEBOOK_DOC" || !data.doc) return;
      if (data.doc.sections && typeof data.doc.sections === "object" && Object.keys(data.doc.sections).length > 0) {
        setState(data.doc);
      }
      if (data.expertMode === true) setExpertMode(true);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setState]);

  return (
    <LifeBookViewer
      state={state}
      onImport={(next) => setState(next)}
      expertMode={expertMode}
    />
  );
}
