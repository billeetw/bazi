import { useCallback, useEffect, useMemo, useState } from "react";
import { useThrottledHomeCoreViewed } from "../hooks/useThrottledHomeCoreViewed";
import { useTimelineNarrativeFocusV0 } from "../hooks/useTimelineNarrativeFocusV0";
import {
  buildRevelationPayloadFromAction,
  CosmicBackground,
  DestinyTree,
  RevelationModal,
  useLowPowerMode,
} from "./home";
import type {
  HomeEventName,
  HomeEventPayload,
  HomeNodeAction,
  HomeSummary,
  RevelationContent,
  TimeContextTelemetryPayload,
} from "./home/types";
import type { DayContractV1 } from "../types/dayContract";
import { TimelineDecisionTaskCard } from "./TimelineDecisionTaskCard";
import { FlowMonthReasonPanel, TimelineHeroCard, TimelineRail } from "./navigation";
import { buildRootUrl, resolveLifebookEntryPath } from "../routing/buildQuantumUrls";
import { readBetaSeed } from "../utils/generateFromBetaSeed";
import { buildLifebookFeedbackUrl } from "../utils/feedbackLink";
import { enrichTelemetryPayload } from "../utils/telemetryContext";
import { buildHomeCoreViewedPayloadFromDayFlow } from "../utils/timelineNarrativeTelemetry";
import {
  buildTimelineHeroViewModelV0,
  buildTimelineRailNodesV0,
} from "../viewmodels/timelineNarrativeV0";
import type { LifeBookViewerState } from "../types";
import "./home/lifebookHomeTokens.css";
import homeStyles from "./home/LifebookHomeShell.module.css";
import styles from "./LifebookTimelineSurface.module.css";

export interface LifebookTimelineSurfaceProps {
  summary: HomeSummary;
  state: LifeBookViewerState;
  flashTimelineNodeId?: string | null;
  onTimelineFlashConsumed?: () => void;
  onLoadDemo: () => Promise<void>;
  dayFlowContract?: DayContractV1 | null;
  dayFlowLoading?: boolean;
  dayFlowError?: string | null;
  dayFlowTimeContext?: TimeContextTelemetryPayload | null;
}

function hasDocumentSections(state: LifeBookViewerState): boolean {
  const s = state.sections;
  return Boolean(s && typeof s === "object" && Object.keys(s).length > 0);
}

/** 已有主站／Viewer 命盤資料（含 session seed），僅缺章節時不顯示「完全未載入命書」強提示 */
function hasChartOrSeedForTimeline(state: LifeBookViewerState): boolean {
  if (state.chart_json && typeof state.chart_json === "object") return true;
  if (state.weight_analysis && typeof state.weight_analysis === "object") return true;
  try {
    return readBetaSeed() != null;
  } catch {
    return false;
  }
}

export function LifebookTimelineSurface({
  summary,
  state,
  flashTimelineNodeId = null,
  onTimelineFlashConsumed,
  onLoadDemo,
  dayFlowContract = null,
  dayFlowLoading = false,
  dayFlowError = null,
  dayFlowTimeContext = null,
}: LifebookTimelineSurfaceProps) {
  const lowPower = useLowPowerMode();
  const [revelationOpen, setRevelationOpen] = useState(false);
  const [revelationContent, setRevelationContent] = useState<RevelationContent | null>(null);

  const { focus: timelineFocus, setFocus: _setTimelineFocus } = useTimelineNarrativeFocusV0({
    contract: dayFlowContract,
    timeContext: dayFlowTimeContext,
    loading: dayFlowLoading,
  });

  const dayKey =
    dayFlowContract?.day_key ?? dayFlowTimeContext?.day_key ?? new Date().toISOString().slice(0, 10);

  const timelineHero = useMemo(
    () =>
      buildTimelineHeroViewModelV0({
        contract: dayFlowContract,
        timeContext: dayFlowTimeContext,
        loading: dayFlowLoading,
        error: dayFlowError,
        currentFocus: timelineFocus,
      }),
    [dayFlowContract, dayFlowTimeContext, dayFlowLoading, dayFlowError, timelineFocus]
  );

  const railNodes = useMemo(
    () =>
      buildTimelineRailNodesV0({
        contract: dayFlowContract,
        timeContext: dayFlowTimeContext,
        currentFocus: timelineFocus,
        dayKey,
      }),
    [dayFlowContract, dayFlowTimeContext, timelineFocus, dayKey]
  );

  const rootHref = useMemo(() => buildRootUrl(), []);
  const viewerHref = useMemo(() => `${resolveLifebookEntryPath()}?view=viewer`, []);
  const emptyDoc = !hasDocumentSections(state);
  const showNoDocBanner = emptyDoc && !hasChartOrSeedForTimeline(state);
  const showSeedHint = emptyDoc && hasChartOrSeedForTimeline(state);

  const gtag = useCallback((eventName: string, payload: HomeEventPayload) => {
    try {
      (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.(
        "event",
        eventName,
        enrichTelemetryPayload(payload)
      );
    } catch {
      /* ignore */
    }
  }, []);

  const fireHomeCoreViewed = useCallback(() => {
    gtag("home_core_viewed", {
      entry_point: "timeline",
      app_surface: "timeline",
      ...buildHomeCoreViewedPayloadFromDayFlow({
        contract: dayFlowContract,
        timeContext: dayFlowTimeContext,
        loading: dayFlowLoading,
        error: dayFlowError,
        currentFocus: timelineFocus,
      }),
    });
  }, [gtag, dayFlowContract, dayFlowTimeContext, dayFlowLoading, dayFlowError, timelineFocus]);

  useThrottledHomeCoreViewed(dayKey, true, fireHomeCoreViewed);

  const onNodeAction = useCallback(
    (action: HomeNodeAction) => {
      if (action.type === "view_core_message") {
        return;
      }
      if (action.type === "open_time_node") {
        gtag("home_time_node_clicked", { entry_point: "timeline", node_id: action.nodeId, app_surface: "timeline" });
        return;
      }
      gtag("home_revelation_opened", {
        entry_point: action.source,
        node_id: action.nodeId ?? "",
        month_id: action.monthId ?? "",
        app_surface: "timeline",
      });
    },
    [gtag]
  );

  const onRequestRevelation = useCallback(
    (input: { source: "node" | "month" | "fog"; nodeId?: string; monthId?: string }) => {
      gtag("lifebook_revelation_open", { kind: input.source, app_surface: "timeline" });
      const payload = buildRevelationPayloadFromAction(summary, input);
      if (payload) {
        setRevelationContent(payload);
        setRevelationOpen(true);
      }
    },
    [gtag, summary]
  );

  const onTrackEvent = useCallback(
    (eventName: HomeEventName, payload: HomeEventPayload) => {
      gtag(eventName, payload);
    },
    [gtag]
  );

  const feedbackHref = buildLifebookFeedbackUrl({ current_surface: "timeline" });

  const rootClass = ["lb-home-root", homeStyles.shell, lowPower ? "lb-low-power" : ""].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <CosmicBackground />
      <div className={homeStyles.app}>
        <div className={`${homeStyles.contentLayer} ${styles.timelineContent}`}>
          <header className={styles.timelineHeader}>
            <p className={styles.timelineKicker}>時空導航</p>
            <div className={styles.timelineHeaderLinks}>
              <a className={styles.headerLink} href={rootHref}>
                降生藍圖
              </a>
              <span className={styles.headerSep} aria-hidden>
                ·
              </span>
              <a className={styles.headerLink} href={viewerHref}>
                完整閱讀
              </a>
              {feedbackHref ? (
                <>
                  <span className={styles.headerSep} aria-hidden>
                    ·
                  </span>
                  <a className={styles.headerLink} href={feedbackHref} target="_blank" rel="noopener noreferrer">
                    封測回饋
                  </a>
                </>
              ) : null}
            </div>
          </header>

          <TimelineHeroCard timelineHero={timelineHero} loading={dayFlowLoading} />
          <TimelineRail nodes={railNodes} />
          <FlowMonthReasonPanel />

          {summary.decisionTask ? (
            <TimelineDecisionTaskCard task={summary.decisionTask} onTrackEvent={onTrackEvent} reduceMotion={lowPower} />
          ) : null}

          {showNoDocBanner ? (
            <div className={styles.emptyBanner} role="status">
              <p className={styles.emptyText}>尚未載入命書，時間節點為示意資料。可先載入示範或從降生藍圖進入。</p>
              <div className={styles.emptyActions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => {
                    void onLoadDemo();
                  }}
                >
                  載入示範命書
                </button>
                <a className={styles.btnGhost} href={rootHref}>
                  回降生藍圖
                </a>
              </div>
            </div>
          ) : null}
          {showSeedHint ? (
            <div className={styles.seedHint} role="status">
              <p className={styles.seedHintText}>
                已帶入命盤；章節尚未生成。請點上方「查看××宮」開啟閱讀並按需生成，或回降生藍圖點十二宮。
              </p>
            </div>
          ) : null}

          <div className={styles.timelineHeroStage}>
            <DestinyTree
              summary={summary}
              onNodeAction={onNodeAction}
              onRequestRevelation={onRequestRevelation}
              onTrackEvent={onTrackEvent}
              flashTimelineNodeId={flashTimelineNodeId}
              onTimelineFlashConsumed={onTimelineFlashConsumed}
              reduceMotion={lowPower}
            />
          </div>

          <footer className={styles.timelineFooterActions}>
            <a className={styles.footerLink} href={rootHref}>
              ← 回降生藍圖
            </a>
            <a className={styles.footerLinkPrimary} href={viewerHref}>
              進入完整閱讀
            </a>
          </footer>
        </div>
      </div>

      {revelationContent ? (
        <RevelationModal
          open={revelationOpen}
          content={revelationContent}
          onClose={() => setRevelationOpen(false)}
          onCta={() => {
            window.location.href = viewerHref;
          }}
        />
      ) : null}
    </div>
  );
}
