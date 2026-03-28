import React, { useCallback, useEffect, useId } from "react";
import FocusLock from "react-focus-lock";
import type { RevelationContent } from "./types";
import { PremiumButton } from "./PremiumButton";
import styles from "./RevelationModal.module.css";

export interface RevelationModalProps {
  open: boolean;
  content: RevelationContent;
  onClose: () => void;
  /** 主 CTA（訂閱／解鎖）；便於接 GA / Mixpanel 單一路徑 */
  onCta?: () => void;
  /** 圖示區 emoji 或字元 */
  headerIcon?: string;
}

export function RevelationModal({
  open,
  content,
  onClose,
  onCta,
  headerIcon = "◆",
}: RevelationModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, handleEscape]);

  if (!open) return null;

  const { title, subtitle, palaceLabel, starLabel, prophecy, doomSummary, logicRows, ctaLabel } = content;

  return (
    <div
      className={`${styles.overlay} ${styles.overlayOpen}`}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <FocusLock returnFocus persistentFocus={false} autoFocus>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={styles.panel}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <header className={styles.header}>
            <div className={styles.icon} aria-hidden>
              {headerIcon}
            </div>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </header>

          {palaceLabel ? (
            <div className={styles.block}>
              <div className={styles.label}>宮位定位</div>
              <p className={styles.text}>{palaceLabel}</p>
            </div>
          ) : null}

          {starLabel ? (
            <div className={styles.block}>
              <div className={styles.label}>星曜引動</div>
              <p className={styles.text}>{starLabel}</p>
            </div>
          ) : null}

          {prophecy ? (
            <div className={styles.block}>
              <div className={styles.label}>預言</div>
              <p className={styles.text}>{prophecy}</p>
            </div>
          ) : null}

          {logicRows && logicRows.length > 0 ? (
            <div className={styles.logic}>
              {logicRows.map((row) => (
                <div key={row.label} className={styles.logicRow}>
                  <div className={styles.logicKey}>{row.label}</div>
                  <div className={styles.logicVal}>{row.value}</div>
                </div>
              ))}
            </div>
          ) : null}

          {doomSummary ? (
            <div className={styles.doom}>
              <p className={styles.text}>{doomSummary}</p>
            </div>
          ) : null}

          {ctaLabel && onCta ? (
            <div className={styles.ctaWrap}>
              <PremiumButton type="button" onClick={onCta}>
                {ctaLabel}
              </PremiumButton>
            </div>
          ) : null}

          <button type="button" className={styles.closeLink} onClick={onClose}>
            稍後再說
          </button>
        </div>
      </FocusLock>
    </div>
  );
}
