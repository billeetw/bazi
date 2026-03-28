import type { TimelineHeroViewModelV0 } from "../../viewmodels/timelineNarrativeV0";
import styles from "./TimelineHeroCard.module.css";

export interface TimelineHeroCardProps {
  /** Phase 1：由 `buildTimelineHeroViewModelV0` 聚合 */
  timelineHero: TimelineHeroViewModelV0;
  loading: boolean;
}

export function TimelineHeroCard({ timelineHero, loading }: TimelineHeroCardProps) {
  const variant = timelineHero.is_fallback ? styles.amber : styles.cyan;

  if (loading) {
    return (
      <section className={`${styles.timelineHeroCard} ${styles.amber}`} aria-busy="true" aria-label="載入今日時間敘事">
        <div className={styles.skeleton} />
      </section>
    );
  }

  return (
    <section className={`${styles.timelineHeroCard} ${variant}`} aria-labelledby="timeline-hero-headline">
      <p className={styles.kicker}>{timelineHero.label_text || "時間敘事"}</p>
      <h2 id="timeline-hero-headline" className={styles.headline}>
        {timelineHero.headline}
      </h2>
      <p className={styles.description}>{timelineHero.description}</p>
      {timelineHero.timezone_hint ? (
        <p className={styles.meta}>時區 {timelineHero.timezone_hint}</p>
      ) : null}
    </section>
  );
}
