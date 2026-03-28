import { buildRootUrl, buildTimelineUrl } from "../../routing/buildQuantumUrls";
import styles from "./DomainsModeStrip.module.css";

/**
 * `?view=domains` 時：明確「Domains 模式」與返回／時間軸切換（非僅捲動）。
 * 主路徑仍為矩陣 → 整頁 Viewer（見 HomePalaceMatrix）；overlay 僅能作次要預覽，非 canonical。
 */
export function DomainsModeStrip() {
  const backHref = buildRootUrl();
  const timelineHref = buildTimelineUrl({ source: "viewer" });

  return (
    <section className={styles.strip} aria-label="生活領域模式">
      <div className={styles.row}>
        <div>
          <p className={styles.kicker}>DOMAINS · 生活領域</p>
          <h2 className={styles.title}>十二宮當前引動</h2>
          <p className={styles.sub}>主入口：點下方宮位將開啟完整閱讀（非預覽 overlay）。</p>
        </div>
        <span className={styles.pill} aria-current="page">
          領域模式
        </span>
      </div>
      <div className={styles.actions}>
        <a href={backHref} className={styles.btnGhost}>
          返回降生藍圖總覽
        </a>
        <a href={timelineHref} className={styles.btnGold}>
          時間決策
        </a>
      </div>
    </section>
  );
}
