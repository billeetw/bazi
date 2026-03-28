import type { RootBlueprintHeroMock } from "./rootBlueprintMock";
import styles from "./RootBlueprintHero.module.css";

export interface RootBlueprintHeroProps {
  data: RootBlueprintHeroMock;
}

export function RootBlueprintHero({ data }: RootBlueprintHeroProps) {
  return (
    <header className={styles.wrap}>
      <div className={styles.tag}>{data.tag}</div>
      <h1 className={styles.title}>{data.titleLine1}</h1>
      <p className={styles.sub}>{data.titleLine2}</p>

      <div className={styles.stage} aria-hidden>
        <svg className={styles.astrolabe} viewBox="0 0 400 400">
          <circle cx="140" cy="200" r="90" className={styles.ringSoul} />
          <circle cx="260" cy="200" r="90" className={styles.ringBody} />
          <circle cx="200" cy="200" r="50" className={styles.centerFlareBg} />
          <circle cx="200" cy="200" r="20" className={styles.centerFlareCore} />
        </svg>

        <div className={`${styles.node} ${styles.nodeSoul}`}>
          <span className={styles.nodeSub}>{data.mingZhuLabel}</span>
          <span className={styles.nodeTitle}>{data.mingZhuName}</span>
        </div>
        <div className={`${styles.node} ${styles.nodePalace}`}>
          <span className={styles.nodeSub}>{data.shenGongLabel}</span>
          <span className={styles.nodeTitle}>{data.shenGongName}</span>
        </div>
        <div className={`${styles.node} ${styles.nodeBody}`}>
          <span className={styles.nodeSub}>{data.shenZhuLabel}</span>
          <span className={styles.nodeTitle}>{data.shenZhuName}</span>
        </div>
      </div>
    </header>
  );
}
