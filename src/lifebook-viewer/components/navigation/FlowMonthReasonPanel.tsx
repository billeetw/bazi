import styles from "./FlowMonthReasonPanel.module.css";

/** Phase 1：僅 UI shell；流月原因層真資料見 Phase 2 */
export function FlowMonthReasonPanel() {
  return (
    <aside className={styles.shell} aria-label="本月原因層（即將推出）">
      <p className={styles.placeholder}>本月場域與原因層將在下一階段與流月敘事銜接。</p>
    </aside>
  );
}
