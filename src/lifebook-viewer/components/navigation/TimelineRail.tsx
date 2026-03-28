import type { PointEmphasisV0, TimelineNodeV0 } from "../../viewmodels/timelineNarrativeV0";
import styles from "./TimelineRail.module.css";

export interface TimelineRailProps {
  /** 已由 `buildTimelineRailNodesV0` 算好呈現欄位 */
  nodes: TimelineNodeV0[];
}

function emphasisClass(e: PointEmphasisV0): string {
  if (e === "muted") return styles.pointMuted;
  if (e === "yearGlow") return styles.yearGlow;
  return "";
}

export function TimelineRail({ nodes }: TimelineRailProps) {
  return (
    <div className={styles.rail} role="presentation" aria-label="時間軸：十年、年、日">
      {nodes.map((n) => {
        if (n.kind === "span") {
          return (
            <div key={n.id} className={styles.node}>
              <span className={styles.spanLabel}>{n.label}</span>
              <span className={styles.spanRange}>{n.rangeLabel}</span>
            </div>
          );
        }
        const { presentation } = n;
        return (
          <div key={n.id} className={styles.node}>
            <span className={`${styles.pointLabel} ${emphasisClass(presentation.emphasis)}`}>{n.primaryText}</span>
            {presentation.showDot ? (
              <span
                className={`${styles.todayDot} ${presentation.dotPulse ? styles.todayPulse : ""}`}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
