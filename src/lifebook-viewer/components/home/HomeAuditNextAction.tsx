import React from "react";
import { tryOpenPalaceOverlayFromHashHref } from "../../routing/palaceHashNavigation";
import type { HomeAuditCta } from "./types";
import styles from "./HomeAuditNextAction.module.css";

export interface HomeAuditNextActionProps {
  cta: HomeAuditCta;
  /** 僅 `#` 宮位 overlay 導航時觸發（例如寫入 session，供「進階完整閱讀」帶 source） */
  onHashNavigate?: () => void;
}

/**
 * Step 1：Oracle／audit 區下行動導流（單一主連結）。
 */
export function HomeAuditNextAction({ cta, onHashNavigate }: HomeAuditNextActionProps) {
  return (
    <div className={styles.wrap} aria-label="建議下一步">
      <p className={styles.lead}>{cta.leadLine}</p>
      <p className={styles.reason}>{cta.reasonLine}</p>
      <a
        className={styles.cta}
        href={cta.href}
        onClick={(e) => {
          if (!cta.href.startsWith("#")) return;
          e.preventDefault();
          onHashNavigate?.();
          if (tryOpenPalaceOverlayFromHashHref(cta.href)) return;
          if (window.location.hash !== cta.href) {
            window.location.hash = cta.href;
          } else {
            window.dispatchEvent(new HashChangeEvent("hashchange"));
          }
        }}
      >
        {cta.ctaLabel}
      </a>
    </div>
  );
}
