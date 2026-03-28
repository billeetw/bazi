/**
 * 命書 Viewer 根元件：狀態 + LifeBookViewer
 * 可由外部傳入 initialDocument（流水線組裝後的 LifeBookDocument），viewer 只負責顯示。
 * 若在 iframe 內，會向 parent 發送 'lifebook-viewer-ready'，並監聽 parent 回傳的 LIFEBOOK_DOC。
 * expertMode：來自 URL ?mode=expert 或 postMessage LIFEBOOK_DOC.expertMode，僅專家後台為 true，用於顯示「整頁技術檢視」。
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  buildHomeSummaryFromDocument,
  DEFAULT_HOME_SUMMARY,
  LifebookHomeShell,
  LifebookPalaceReaderOverlay,
  type HomeEventName,
  type HomeEventPayload,
} from "./components/home";
import { LifeBookViewer } from "./components/LifeBookViewer";
import { useLifeBookData } from "./hooks/useLifeBookData";
import { useHashPalaceId } from "./hooks/useHashPalaceId";
import {
  getAppSurfaceFromLocation,
  getRootSubViewFromLocation,
  syncCanonicalTimelineSurfaceToSearch,
  syncCanonicalViewerPathToSearch,
} from "./routing/canonicalAppSurface";
import { isBarePalaceViewerMistake } from "./routing/parseViewerRoute";
import {
  clearViewerTimelineNodeContext,
  parseHomeTimelineNodeFromQuery,
  peekViewerTimelineNodeContext,
} from "./routing/homeTimelineHighlight";
import {
  buildGateFixtureState,
  parseGateFixtureFocusFromParams,
  parseGateFixtureFromSearch,
} from "./testing/gateFixtures";
import type { PalacePreviewFocus } from "./constants";
import type { LifeBookDocument, LifeBookViewerState } from "./types";
import { LifebookTimelineSurface } from "./components/LifebookTimelineSurface";
import { loadDemoLifeBook } from "./utils/loadDemoLifeBook";
import { mergeDocWithBetaSeed, tryLoadBetaSeedDocument } from "./utils/betaSeedDocument";
import { isLifebookBetaInviteVerified } from "./utils/betaInvite";
import { BetaInviteGateFallback } from "./components/BetaInviteGateFallback";
import { tryCloseHomePalaceOverlay } from "./routing/palaceHashNavigation";
import { useAccountLifebookPersistence } from "./hooks/useAccountLifebookPersistence";
import { useDayFlowContract } from "./hooks/useDayFlowContract";
import { enrichTelemetryPayload } from "./utils/telemetryContext";

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

function documentHasChartOrSections(doc: LifeBookDocument | null | undefined): boolean {
  if (!doc) return false;
  if (doc.sections && typeof doc.sections === "object" && Object.keys(doc.sections).length > 0) return true;
  return !!(doc.chart_json && typeof doc.chart_json === "object");
}

function parseStoredDoc(raw: string | null): LifeBookDocument | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as LifeBookDocument;
    if (parsed && typeof parsed === "object" && documentHasChartOrSections(parsed)) {
      if (!parsed.sections || typeof parsed.sections !== "object") {
        parsed.sections = {};
      }
      return parsed;
    }
  } catch (e) {
    console.error("Failed to parse lifebook_doc:", e);
  }
  return null;
}

function getInitialDocument(initialDocument: LifeBookDocument | null | undefined): LifeBookDocument | null {
  const seed = tryLoadBetaSeedDocument();
  const withSeed = (doc: LifeBookDocument | null): LifeBookDocument | null =>
    doc ? mergeDocWithBetaSeed(doc, seed) ?? doc : seed;

  if (initialDocument && documentHasChartOrSections(initialDocument)) return withSeed(initialDocument);
  if (typeof window === "undefined") return seed;
  try {
    const fromWindow = (window as unknown as { __LIFEBOOK_INITIAL_STATE__?: LifeBookDocument }).__LIFEBOOK_INITIAL_STATE__;
    if (fromWindow && documentHasChartOrSections(fromWindow)) return withSeed(fromWindow);
  } catch {
    /* ignore */
  }
  try {
    const fromSession = parseStoredDoc(sessionStorage.getItem(STORAGE_KEY));
    if (fromSession) return withSeed(fromSession);
  } catch {
    /* sessionStorage may throw in iframe/sandbox */
  }
  try {
    const fromLocal = parseStoredDoc(localStorage.getItem(STORAGE_KEY));
    if (fromLocal) return withSeed(fromLocal);
  } catch {
    /* localStorage may throw when disabled or in private mode */
  }
  return seed;
}

export function App({ initialDocument }: AppProps) {
  const gateFixtureParams = useMemo(() => {
    if (typeof window === "undefined") return null;
    return parseGateFixtureFromSearch(window.location.search);
  }, []);

  /** `/viewer` canonical pathname 會補上 `view=viewer`；此 tick 讓依賴 query 的 memo 在同步後重算 */
  const [canonicalUrlEpoch, setCanonicalUrlEpoch] = useState(0);
  /** 他分頁完成邀請碼驗證時，同一瀏覽器分頁內 root shell 需重算 */
  const [inviteStorageTick, setInviteStorageTick] = useState(0);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "lifebook_v2_beta_invite_verified") setInviteStorageTick((n) => n + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  /** 主站帶 `?beta=1` 但未驗證：清參數（降生藍圖改由未驗證即全頁 gate，不再依賴頂部提示條） */
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get("beta") !== "1") return;
      if (localStorage.getItem("lifebook_v2_beta_invite_verified") === "1") return;
      u.searchParams.delete("beta");
      u.searchParams.delete("autogen");
      window.history.replaceState(null, "", `${u.pathname}${u.searchParams.toString() ? `?${u.searchParams}` : ""}${u.hash}`);
      setCanonicalUrlEpoch((n) => n + 1);
    } catch {
      /* ignore */
    }
  }, []);
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    syncCanonicalViewerPathToSearch();
    syncCanonicalTimelineSurfaceToSearch();
    setCanonicalUrlEpoch((n) => n + 1);
  }, []);

  /** 多宮預覽／TOC 順序：fixture 時用其 focus；一般 viewer 可 ?view=viewer&palace=… */
  const palacePreviewFocus = useMemo((): PalacePreviewFocus | null => {
    if (typeof window === "undefined") return null;
    const p = new URLSearchParams(window.location.search);
    if (gateFixtureParams) return gateFixtureParams.focus;
    if (p.get("view") === "viewer") {
      return parseGateFixtureFocusFromParams(p);
    }
    return null;
  }, [gateFixtureParams, canonicalUrlEpoch]);

  const initialDocResolved = useMemo(() => getInitialDocument(initialDocument), [initialDocument]);
  const initialForData = useMemo(() => {
    if (gateFixtureParams) {
      return buildGateFixtureState(gateFixtureParams.id, gateFixtureParams.focus);
    }
    return initialDocResolved;
  }, [gateFixtureParams, initialDocResolved]);

  const [expertMode, setExpertMode] = useState(getExpertModeFromUrl);
  /** 舊連結／誤帶參數：`?view=viewer#palace-*` 會直接進列表頁；改為去掉 `view` 留在首頁並靠 hash 開 overlay（`intent=full` 除外） */
  const [, setPalaceUrlNormalized] = useState(0);
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (!isBarePalaceViewerMistake(url)) return;
      url.searchParams.delete("view");
      const qs = url.searchParams.toString();
      window.history.replaceState(null, "", `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`);
      setPalaceUrlNormalized((n) => n + 1);
    } catch {
      /* ignore */
    }
  }, []);

  const appSurface = useMemo(() => {
    if (typeof window === "undefined") return "timeline" as const;
    return getAppSurfaceFromLocation(window.location.href);
  }, [canonicalUrlEpoch]);

  const rootSubView = useMemo(() => {
    if (typeof window === "undefined") return "default" as const;
    if (appSurface !== "root") return "default" as const;
    return getRootSubViewFromLocation(window.location.href);
  }, [canonicalUrlEpoch, appSurface]);

  /** App shell 分流遙測（debug `/viewer`、`/timeline` rewrite 與 Root subview） */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      let surface = appSurface;
      if (gateFixtureParams) surface = "viewer";
      const sub = surface === "root" ? getRootSubViewFromLocation(window.location.href) : "default";
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      w.gtag?.(
        "event",
        "home_surface_resolved",
        enrichTelemetryPayload({
          app_surface: surface,
          root_sub_view: surface === "root" ? sub : undefined,
        })
      );
    } catch {
      /* ignore */
    }
  }, [appSurface, canonicalUrlEpoch, gateFixtureParams]);

  /** 有 `?fixture=` 時改走 Viewer；`/timeline` 或無 `view` 走時間軸主場；`?view=home`／`domains` 為降生藍圖（Root） */
  const showHomeShell = !gateFixtureParams && appSurface === "root";
  const inviteVerified = useMemo(
    () => isLifebookBetaInviteVerified(),
    [canonicalUrlEpoch, inviteStorageTick]
  );
  /** 同分頁完成驗證時不會觸發 `storage`；靠 focus 再讀一次 localStorage */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (inviteVerified) return;
    const onFocus = () => {
      if (isLifebookBetaInviteVerified()) setInviteStorageTick((n) => n + 1);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [inviteVerified]);
  /**
   * 專家後台等 **iframe 嵌入** 同源 viewer：不強制主站邀請碼（否則無法預覽命書）。
   * 頂層一般使用者仍須 `inviteVerified` 才會通過下方統一 gate。
   */
  const inviteGateBypassEmbed = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.self !== window.top;
    } catch {
      return false;
    }
  }, []);
  /** 通過統一 gate 後才可能為 true；與舊名相容（root 殼＋宮位 overlay） */
  const showBetaRootExperience = showHomeShell;
  const hashPalaceId = useHashPalaceId();
  const showHomePalaceOverlay = showBetaRootExperience && hashPalaceId != null;
  /** 時間軸主場也需 `#palace-*` overlay（與降生藍圖同源：按需生成單章） */
  const showTimelinePalaceOverlay = appSurface === "timeline" && hashPalaceId != null;
  const { state, setState } = useLifeBookData(initialForData);
  const persistLifebookDisabled =
    gateFixtureParams != null ||
    (typeof window !== "undefined" && (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })());
  useAccountLifebookPersistence(state, setState, persistLifebookDisabled);
  const sendTelemetryEvent = useCallback((eventName: string, payload?: HomeEventPayload) => {
    if (typeof window === "undefined") return;
    try {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      w.gtag?.("event", eventName, enrichTelemetryPayload(payload ?? {}));
    } catch {
      /* ignore */
    }
  }, []);
  const onPalaceOverlayTelemetry = useCallback(
    (eventName: HomeEventName, payload: HomeEventPayload) => {
      sendTelemetryEvent(eventName, payload);
    },
    [sendTelemetryEvent]
  );
  const onPalaceOverlayStateMerged = useCallback((next: LifeBookViewerState) => {
    setState(next);
  }, [setState]);
  const homeSummary = useMemo(() => {
    try {
      return buildHomeSummaryFromDocument(state);
    } catch (e) {
      console.error("[lifebook-viewer] buildHomeSummaryFromDocument failed:", e);
      return DEFAULT_HOME_SUMMARY;
    }
  }, [state]);

  const dayFlow = useDayFlowContract({
    chartJson: state.chart_json ?? null,
    enabled:
      inviteVerified &&
      !gateFixtureParams &&
      (appSurface === "root" || appSurface === "timeline") &&
      !!state.chart_json &&
      typeof state.chart_json === "object",
  });

  const [homeTimelineFlashNodeId, setHomeTimelineFlashNodeId] = useState<string | null>(null);
  const [timelineSurfaceFlashNodeId, setTimelineSurfaceFlashNodeId] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!showBetaRootExperience) return;
    const q = parseHomeTimelineNodeFromQuery(window.location.search);
    const fromSession = peekViewerTimelineNodeContext();
    const raw = (q ?? fromSession)?.trim() || null;
    if (!raw) {
      setHomeTimelineFlashNodeId(null);
      return;
    }
    const timeline = Array.isArray(homeSummary.timeline) ? homeSummary.timeline : [];
    const valid = timeline.some((n) => n.id === raw);
    if (!valid) {
      setHomeTimelineFlashNodeId(null);
      clearViewerTimelineNodeContext();
      return;
    }
    setHomeTimelineFlashNodeId(raw);
  }, [showBetaRootExperience, homeSummary.timeline]);

  useLayoutEffect(() => {
    if (appSurface !== "timeline") return;
    const q = parseHomeTimelineNodeFromQuery(window.location.search);
    const fromSession = peekViewerTimelineNodeContext();
    const raw = (q ?? fromSession)?.trim() || null;
    if (!raw) {
      setTimelineSurfaceFlashNodeId(null);
      return;
    }
    const timeline = Array.isArray(homeSummary.timeline) ? homeSummary.timeline : [];
    const valid = timeline.some((n) => n.id === raw);
    if (!valid) {
      setTimelineSurfaceFlashNodeId(null);
      clearViewerTimelineNodeContext();
      return;
    }
    setTimelineSurfaceFlashNodeId(raw);
  }, [appSurface, homeSummary.timeline]);

  /** 開發／測試：`?demo=1` 自動載入 `public/demo-lifebook.json`（與閱讀頁「載入示範命書」相同） */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (gateFixtureParams) return;
    if (!isLifebookBetaInviteVerified()) return;
    let cancelled = false;
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get("demo") !== "1") return;
      const stripDemo = () => {
        u.searchParams.delete("demo");
        const qs = u.searchParams.toString();
        window.history.replaceState(null, "", `${u.pathname}${qs ? `?${qs}` : ""}${u.hash}`);
      };
      const hasSections = state.sections && Object.keys(state.sections).length > 0;
      if (hasSections) {
        stripDemo();
        return;
      }
      void loadDemoLifeBook()
        .then((doc) => {
          if (cancelled) return;
          setState(doc);
          stripDemo();
        })
        .catch((e) => {
          console.error("[lifebook-viewer] ?demo=1 load failed:", e);
        });
    } catch {
      /* ignore */
    }
    return () => {
      cancelled = true;
    };
  }, [gateFixtureParams, setState, state.sections, inviteVerified]);

  const onHomeTimelineFlashConsumed = useCallback(() => {
    setHomeTimelineFlashNodeId(null);
    clearViewerTimelineNodeContext();
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("view") === "viewer") return;
      if (!url.searchParams.has("timeline_node") && !url.searchParams.has("node")) return;
      url.searchParams.delete("timeline_node");
      url.searchParams.delete("node");
      const qs = url.searchParams.toString();
      window.history.replaceState(null, "", `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`);
    } catch {
      /* ignore */
    }
  }, []);

  const onTimelineSurfaceFlashConsumed = useCallback(() => {
    setTimelineSurfaceFlashNodeId(null);
    clearViewerTimelineNodeContext();
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (!url.pathname.includes("timeline")) return;
      if (!url.searchParams.has("timeline_node") && !url.searchParams.has("node")) return;
      url.searchParams.delete("timeline_node");
      url.searchParams.delete("node");
      const qs = url.searchParams.toString();
      window.history.replaceState(null, "", `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`);
    } catch {
      /* ignore */
    }
  }, []);

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

  /** 頂層頁面（非 iframe、非 fixture）須先通過封測邀請驗證 */
  if (!gateFixtureParams && !inviteGateBypassEmbed && !inviteVerified) {
    return <BetaInviteGateFallback />;
  }

  if (gateFixtureParams) {
    return (
      <LifeBookViewer
        state={state}
        onImport={(next) => setState(next)}
        expertMode={expertMode}
        gateFixtureId={gateFixtureParams.id}
        palacePreviewFocus={palacePreviewFocus}
        onViewerTelemetry={(eventName, payload) => {
          sendTelemetryEvent(eventName, payload);
        }}
      />
    );
  }

  if (appSurface === "timeline") {
    return (
      <>
        <LifebookTimelineSurface
          summary={homeSummary}
          state={state}
          flashTimelineNodeId={timelineSurfaceFlashNodeId}
          onTimelineFlashConsumed={onTimelineSurfaceFlashConsumed}
          dayFlowContract={dayFlow.data}
          dayFlowLoading={dayFlow.loading}
          dayFlowError={dayFlow.error}
          dayFlowTimeContext={dayFlow.timeContext}
          onLoadDemo={async () => {
            const doc = await loadDemoLifeBook();
            setState(doc);
          }}
        />
        {showTimelinePalaceOverlay && hashPalaceId ? (
          <LifebookPalaceReaderOverlay
            state={state}
            palaceId={hashPalaceId}
            surface="timeline"
            onTelemetry={onPalaceOverlayTelemetry}
            onStateMerged={onPalaceOverlayStateMerged}
            onClose={() => {
              tryCloseHomePalaceOverlay();
            }}
          />
        ) : null}
      </>
    );
  }

  if (showHomeShell) {
    return (
      <>
        <LifebookHomeShell
          summary={homeSummary}
          rootSubView={rootSubView}
          flashTimelineNodeId={homeTimelineFlashNodeId}
          onTimelineFlashConsumed={onHomeTimelineFlashConsumed}
          dayFlowContract={dayFlow.data}
          dayFlowLoading={dayFlow.loading}
          dayFlowError={dayFlow.error}
          dayFlowTimeContext={dayFlow.timeContext}
          onNodeAction={(action) => {
          if (action.type === "view_core_message") {
            return;
          }
          if (action.type === "open_time_node") {
            sendTelemetryEvent("home_time_node_clicked", {
              entry_point: "node",
              node_id: action.nodeId,
            });
            return;
          }
          sendTelemetryEvent("home_revelation_opened", {
            entry_point: action.source,
            node_id: action.nodeId ?? "",
            month_id: action.monthId ?? "",
          });
        }}
        onRequestRevelation={(input) => {
          sendTelemetryEvent("lifebook_revelation_open", {
            kind: input.source,
          });
        }}
        onTrackEvent={(eventName, payload) => {
          sendTelemetryEvent(eventName, payload);
        }}
        />
        {showHomePalaceOverlay && hashPalaceId ? (
          <LifebookPalaceReaderOverlay
            state={state}
            palaceId={hashPalaceId}
            surface="root"
            onTelemetry={onPalaceOverlayTelemetry}
            onStateMerged={onPalaceOverlayStateMerged}
            onClose={() => {
              tryCloseHomePalaceOverlay();
            }}
          />
        ) : null}
      </>
    );
  }

  return (
    <LifeBookViewer
      state={state}
      onImport={(next) => setState(next)}
      expertMode={expertMode}
      gateFixtureId={null}
      palacePreviewFocus={palacePreviewFocus}
      onViewerTelemetry={(eventName, payload) => {
        sendTelemetryEvent(eventName, payload);
      }}
    />
  );
}
