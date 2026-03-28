import { buildHomePalaceReadUrl, buildTimelineUrl } from "../../../routing/buildQuantumUrls";
import { tryOpenPalaceOverlayFromHashHref } from "../../../routing/palaceHashNavigation";
import type { RootPrimaryFocusMock } from "./rootBlueprintMock";
import styles from "./RootPrimaryFocusCard.module.css";

export interface RootPrimaryFocusCardProps {
  data: RootPrimaryFocusMock;
}

export function RootPrimaryFocusCard({ data }: RootPrimaryFocusCardProps) {
  const palaceReadHref = buildHomePalaceReadUrl(data.palaceId);
  const timelineHref = buildTimelineUrl({ source: "root", focus: data.timelineNodeId });

  return (
    <section className={styles.card} aria-label="本週首要焦點">
      <div className={styles.inner}>
        <p className={styles.kicker}>PRIMARY FOCUS</p>
        <p className={styles.reason}>{data.reasonLine}</p>
        <div className={styles.focusRow}>
          <span className={styles.pill}>
            宮位 · <strong>{data.palaceLabelZh}</strong>
          </span>
          <span className={`${styles.pill} ${styles.pillMuted}`}>{data.timelineNodeLabel}</span>
        </div>
        <div className={styles.ctaRow}>
          <a
            href={palaceReadHref}
            className={`${styles.cta} ${styles.ctaPrimary}`}
            onClick={(e) => {
              e.preventDefault();
              tryOpenPalaceOverlayFromHashHref(palaceReadHref);
            }}
          >
            閱讀 {data.palaceLabelZh}
          </a>
          <a
            href={timelineHref}
            className={`${styles.cta} ${styles.ctaSecondary}`}
            onClick={(e) => {
              e.preventDefault();
              window.location.assign(timelineHref);
            }}
          >
            打開時間軸
          </a>
        </div>
      </div>
    </section>
  );
}
