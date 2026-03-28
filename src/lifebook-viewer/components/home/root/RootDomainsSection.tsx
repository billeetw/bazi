import { DomainsModeStrip } from "../DomainsModeStrip";
import { HomePalaceMatrix } from "../HomePalaceMatrix";
import { buildRootUrl } from "../../../routing/buildQuantumUrls";
import type { RootSubView } from "../../../routing/canonicalAppSurface";
import type { HomeEventName, HomeEventPayload, HomePalaceMatrix as HomePalaceMatrixModel } from "../types";
import styles from "./RootDomainsSection.module.css";

export interface RootDomainsSectionProps {
  rootSubView: RootSubView;
  palaceMatrix: HomePalaceMatrixModel | null;
  onTrackEvent?: (eventName: HomeEventName, payload: HomeEventPayload) => void;
}

export function RootDomainsSection({ rootSubView, palaceMatrix, onTrackEvent }: RootDomainsSectionProps) {
  const domainsHref = buildRootUrl({ view: "domains" });
  const showStrip = rootSubView === "domains";

  return (
    <section className={styles.wrap} aria-label="十二宮領域">
      <h2 className={styles.kicker}>12 DOMAINS OF LIFE</h2>

      {rootSubView !== "domains" ? (
        <div className={styles.entryWrap}>
          <a href={domainsHref} className={styles.entryLink}>
            進入十二宮領域（Domains）
          </a>
        </div>
      ) : null}

      <div
        id="lb-domains"
        tabIndex={-1}
        className={showStrip ? `${styles.domainsAnchor} ${styles.domainsAnchorActive}` : styles.domainsAnchor}
        data-lb-root-subview={showStrip ? "domains" : undefined}
      >
        {showStrip ? <DomainsModeStrip /> : null}
        {palaceMatrix ? (
          <HomePalaceMatrix matrix={palaceMatrix} onTrackEvent={onTrackEvent} />
        ) : (
          <p className={styles.empty}>尚無十二宮矩陣資料；稍後由命書載入後會顯示於此。</p>
        )}
      </div>
    </section>
  );
}
