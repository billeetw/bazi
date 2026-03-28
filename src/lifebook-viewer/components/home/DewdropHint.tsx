import React from "react";
import styles from "./DewdropHint.module.css";

export interface DewdropHintProps {
  children: React.ReactNode;
  className?: string;
}

export function DewdropHint({ children, className }: DewdropHintProps) {
  return <div className={[styles.hint, className].filter(Boolean).join(" ")}>{children}</div>;
}
