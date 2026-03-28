import type { HexFruitType } from "./types";
import styles from "./HexCoreFruit.module.css";

export interface HexCoreFruitProps {
  type: HexFruitType;
  symbol: string;
  /** 觸發漣漪動畫 */
  rippling?: boolean;
  disabled?: boolean;
  /** 視覺層級：主場當前年節點可加大 */
  size?: "md" | "lg";
  onClick?: () => void;
  "aria-label"?: string;
}

export function HexCoreFruit({
  type,
  symbol,
  rippling,
  disabled,
  size = "md",
  onClick,
  "aria-label": ariaLabel,
}: HexCoreFruitProps) {
  const typeClass = type === "danger" ? styles.danger : type === "wealth" ? styles.wealth : styles.neutral;
  const sizeClass = size === "lg" ? styles.lg : "";
  const cls = [styles.core, typeClass, sizeClass, rippling && styles.ripple].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={cls}
      disabled={disabled || type === "neutral"}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {type === "danger" && <span className={styles.haloDanger} aria-hidden />}
      {type === "wealth" && <span className={styles.haloWealth} aria-hidden />}
      <span className={styles.symbol}>{symbol}</span>
    </button>
  );
}
