import React from "react";
import styles from "./OraclePanel.module.css";

export interface OraclePanelProps {
  anchor: string;
  progressLabel: string;
  /** 0–100，控制細進度條寬度 */
  progressPercent: number;
  title: string;
  prophecy: string;
  doItems: string[];
  dontItems: string[];
}

export function OraclePanel({
  anchor,
  progressLabel,
  progressPercent,
  title,
  prophecy,
  doItems,
  dontItems,
}: OraclePanelProps) {
  const pct = Math.min(100, Math.max(0, progressPercent));
  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.anchor}>{anchor}</div>
      <div className={styles.timeProgress}>
        <div className={styles.pText}>{progressLabel}</div>
        <div className={styles.pTrack}>
          <div className={styles.pFill} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.prophecy}>{prophecy}</p>
      <div className={styles.matrix}>
        <div className={`${styles.col} ${styles.do}`}>
          <div className={styles.colTitle}>順勢而為</div>
          <ul className={styles.list}>
            {doItems.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className={`${styles.col} ${styles.dont}`}>
          <div className={styles.colTitle}>逆流大忌</div>
          <ul className={styles.list}>
            {dontItems.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
