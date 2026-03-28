import { useCallback, useEffect, useMemo } from "react";
import { useThrottledHomeCoreViewed } from "../../hooks/useThrottledHomeCoreViewed";
import { useTimelineNarrativeFocusV0 } from "../../hooks/useTimelineNarrativeFocusV0";
import { CosmicBackground } from "./CosmicBackground";
import { useLowPowerMode } from "./hooks/useLowPowerMode";
import {
  ROOT_BLUEPRINT_MOCK,
  RootAuditCards,
  RootDomainsSection,
  RootPrimaryFocusCard,
  RootTimelinePreview,
} from "./root";
import type { RootSubView } from "../../routing/canonicalAppSurface";
import type { DayContractV1 } from "../../types/dayContract";
import type {
  HomeEventName,
  HomeEventPayload,
  HomeNodeAction,
  HomeSummary,
  TimeContextTelemetryPayload,
} from "./types";
import { FlowMonthReasonPanel, TimelineHeroCard, TimelineRail } from "../navigation";
import { buildHomeCoreViewedPayloadFromDayFlow } from "../../utils/timelineNarrativeTelemetry";
import {
  buildTimelineHeroViewModelV0,
  buildTimelineRailNodesV0,
} from "../../viewmodels/timelineNarrativeV0";
import { buildLifebookFeedbackUrl } from "../../utils/feedbackLink";
import "./lifebookHomeTokens.css";
import styles from "./LifebookHomeShell.module.css";

export interface LifebookHomeShellProps {
  summary: HomeSummary;
  onNodeAction: (action: HomeNodeAction) => void;
  onRequestRevelation: (input: { source: "node" | "month" | "fog"; nodeId?: string; monthId?: string }) => void;
  onTrackEvent?: (eventName: HomeEventName, payload: HomeEventPayload) => void;
  /** 從 Viewer 回來或 `?timeline_node=`：時間軸預覽未來可接 flash（v1 保留 prop） */
  flashTimelineNodeId?: string | null;
  onTimelineFlashConsumed?: () => void;
  /** `/?view=domains`：捲動至 #lb-domains（十二宮 canonical 區塊） */
  rootSubView?: RootSubView;
  /** `POST /api/life-book/daily-flow`；標題僅 `surface_label_key` → `surfaceLabelZh` */
  dayFlowContract?: DayContractV1 | null;
  dayFlowLoading?: boolean;
  dayFlowError?: string | null;
  /** API 或錯誤回應之 `time_context` */
  dayFlowTimeContext?: TimeContextTelemetryPayload | null;
}

export function LifebookHomeShell({
  summary,
  onNodeAction,
  onRequestRevelation: _onRequestRevelation,
  onTrackEvent,
  flashTimelineNodeId: _flashTimelineNodeId = null,
  onTimelineFlashConsumed: _onTimelineFlashConsumed,
  rootSubView = "default",
  dayFlowContract = null,
  dayFlowLoading = false,
  dayFlowError = null,
  dayFlowTimeContext = null,
}: LifebookHomeShellProps) {
  const lowPower = useLowPowerMode();

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

  useEffect(() => {
    onNodeAction({ type: "view_core_message", source: "root" });
  }, [onNodeAction, dayFlowContract, dayFlowTimeContext, dayFlowLoading, dayFlowError, timelineFocus]);

  const fireHomeCoreViewed = useCallback(() => {
    onTrackEvent?.("home_core_viewed", {
      entry_point: "root",
      ...buildHomeCoreViewedPayloadFromDayFlow({
        contract: dayFlowContract,
        timeContext: dayFlowTimeContext,
        loading: dayFlowLoading,
        error: dayFlowError,
        currentFocus: timelineFocus,
      }),
    });
  }, [onTrackEvent, dayFlowContract, dayFlowTimeContext, dayFlowLoading, dayFlowError, timelineFocus]);

  useThrottledHomeCoreViewed(dayKey, Boolean(onTrackEvent), fireHomeCoreViewed);

  useEffect(() => {
    if (rootSubView !== "domains") return;
    const id = window.setTimeout(() => {
      document.getElementById("lb-domains")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(id);
  }, [rootSubView]);

  const rootClass = ["lb-home-root", styles.shell, lowPower ? "lb-low-power" : ""].filter(Boolean).join(" ");
  const feedbackHref = buildLifebookFeedbackUrl({ current_surface: "root" });

  return (
    <div className={rootClass}>
      <CosmicBackground />
      <div className={styles.app}>
        <div className={styles.contentLayer}>
          <TimelineHeroCard timelineHero={timelineHero} loading={dayFlowLoading} />
          <TimelineRail nodes={railNodes} />
          <FlowMonthReasonPanel />

          <RootAuditCards cards={ROOT_BLUEPRINT_MOCK.auditCards} />

          <RootPrimaryFocusCard data={summary.rootPrimaryFocus ?? ROOT_BLUEPRINT_MOCK.primaryFocus} />
          <RootDomainsSection
            rootSubView={rootSubView}
            palaceMatrix={summary.palaceMatrix ?? null}
            onTrackEvent={onTrackEvent}
          />
          <RootTimelinePreview
            nodes={(summary.rootTimelinePreview?.nodes ?? ROOT_BLUEPRINT_MOCK.timelinePreview.nodes) as typeof ROOT_BLUEPRINT_MOCK.timelinePreview.nodes}
            summaryLine={summary.rootTimelinePreview?.summaryLine ?? ROOT_BLUEPRINT_MOCK.timelinePreview.summaryLine}
          />

          <div className={styles.neonWarn}>
            <span style={{ fontSize: 16 }} aria-hidden>
              🚫
            </span>
            <div>{summary.oracle.warningText ?? "請避免情緒高壓時做重大決策。"}</div>
          </div>
          {feedbackHref ? (
            <p className={styles.feedbackFooter}>
              <a href={feedbackHref} target="_blank" rel="noopener noreferrer" className={styles.feedbackLink}>
                封測回饋
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
