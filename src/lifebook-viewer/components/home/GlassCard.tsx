import React from "react";
import styles from "./GlassCard.module.css";

export interface GlassCardProps {
  active?: boolean;
  /** 節點摘要卡：較薄、較不搶眼 */
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function GlassCard({ active, compact, className, children }: GlassCardProps) {
  const cls = [styles.card, active && styles.active, compact && styles.compact, className].filter(Boolean).join(" ");
  return <div className={cls}>{children}</div>;
}
