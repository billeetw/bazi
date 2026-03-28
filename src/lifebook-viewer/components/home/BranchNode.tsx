import React from "react";
import type { BranchSide } from "./types";
import styles from "./BranchNode.module.css";

export interface BranchNodeProps {
  branch: BranchSide;
  label?: string;
  /** 地圖欄內窄版排版；timeline = 時間軸主場列 */
  variant?: "overlay" | "map" | "timeline";
  /** 含流月展開時全寬 */
  withMonths?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function BranchNode({ branch, label, variant = "overlay", withMonths, className, children }: BranchNodeProps) {
  const side = branch === "right" ? styles.right : styles.left;
  const map = variant === "map" ? styles.mapScoped : variant === "timeline" ? styles.timelineScoped : "";
  const months = withMonths ? styles.withMonths : "";
  const cls = [styles.node, side, map, months, className].filter(Boolean).join(" ");

  return (
    <div className={cls}>
      {branch === "right" && children}
      {label != null && label !== "" && <span className={styles.branchText}>{label}</span>}
      {branch === "left" && children}
    </div>
  );
}
