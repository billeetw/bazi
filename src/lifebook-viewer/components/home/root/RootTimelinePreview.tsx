import { buildTimelineUrl } from "../../../routing/buildQuantumUrls";
import type { RootTimelinePreviewNodeMock } from "./rootBlueprintMock";
import styles from "./RootTimelinePreview.module.css";

export interface RootTimelinePreviewProps {
  nodes: RootTimelinePreviewNodeMock[];
  /** 一句說明（mock） */
  summaryLine: string;
}

export function RootTimelinePreview({ nodes, summaryLine }: RootTimelinePreviewProps) {
  const href = buildTimelineUrl({ source: "root" });
  const previewNodes = nodes.slice(0, 2);

  return (
    <section className={styles.wrap} aria-label="時間決策預覽">
      <div className={styles.inner}>
        <h2 className={styles.title}>TIMELINE PREVIEW</h2>
        <div className={styles.nodes}>
          {previewNodes.map((n) => (
            <article key={n.id} className={styles.node}>
              <div className={styles.nodeHead}>
                <span className={styles.nodeLabel}>{n.label}</span>
                <span className={styles.nodeYear}>{n.year}</span>
              </div>
              <p className={styles.nodeLine}>{n.oneLiner}</p>
            </article>
          ))}
        </div>
        <p className={styles.hint}>{summaryLine}</p>
        <a
          href={href}
          className={styles.cta}
          onClick={(e) => {
            e.preventDefault();
            window.location.assign(href);
          }}
        >
          開啟時間決策（完整時間軸）
        </a>
      </div>
    </section>
  );
}
