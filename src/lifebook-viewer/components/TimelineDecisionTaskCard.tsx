import { useEffect, useRef } from "react";
import type { DecisionTask } from "../decision/timelineDecisionTask";
import { buildTimelineDecisionTelemetryPayload } from "../decision/timelineDecisionTask";
import { tryOpenPalaceOverlayFromHashHref } from "../routing/palaceHashNavigation";
import type { HomeEventName, HomeEventPayload } from "./home/types";
import styles from "./TimelineDecisionTaskCard.module.css";

export interface TimelineDecisionTaskCardProps {
  task: DecisionTask;
  /** 與 DestinyTree 一致：低動力模式改為掛載即送曝光（仍只送一次） */
  reduceMotion?: boolean;
  onTrackEvent?: (eventName: HomeEventName, payload: HomeEventPayload) => void;
}

export function TimelineDecisionTaskCard({ task, reduceMotion = false, onTrackEvent }: TimelineDecisionTaskCardProps) {
  const palaceLabel = task.palaceId === "caibo" ? "財帛宮" : "官祿宮";
  const ctaLabel = `查看${palaceLabel}`;
  const sectionRef = useRef<HTMLElement>(null);
  /** 已送過曝光的 `task.id`（換任務時可再送） */
  const lastImpressionTaskId = useRef<string | null>(null);

  useEffect(() => {
    if (!onTrackEvent) return;
    if (lastImpressionTaskId.current === task.id) return;

    const fire = (): void => {
      if (lastImpressionTaskId.current === task.id) return;
      lastImpressionTaskId.current = task.id;
      onTrackEvent("timeline_decision_task_impression", buildTimelineDecisionTelemetryPayload(task));
    };

    if (reduceMotion) {
      fire();
      return;
    }

    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      fire();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.5) {
            fire();
            io.disconnect();
          }
        }
      },
      { threshold: [0.5] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [task, onTrackEvent, reduceMotion]);

  const handleCtaClick = (e: MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault();
    tryOpenPalaceOverlayFromHashHref(task.viewerHref);
    onTrackEvent?.("timeline_decision_cta_click", buildTimelineDecisionTelemetryPayload(task));
  };

  return (
    <section
      ref={sectionRef}
      className={styles.card}
      aria-labelledby="timeline-decision-title"
    >
      <p className={styles.kicker}>這段時間 · 先處理一件事</p>
      <h2 id="timeline-decision-title" className={styles.title}>
        {task.title}
      </h2>
      <p className={styles.summary}>{task.summary}</p>
      <p className={styles.rationale}>{task.rationale}</p>
      <div className={styles.metaRow}>
        <span className={task.urgency === "now" ? styles.urgency : `${styles.urgency} ${styles.urgencySoon}`}>
          {task.urgency === "now" ? "優先處理" : "近期處理"}
        </span>
      </div>
      <a className={styles.cta} href={task.viewerHref} onClick={handleCtaClick}>
        {ctaLabel} →
      </a>
    </section>
  );
}
