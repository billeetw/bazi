import React, { useCallback } from "react";
import type { PalaceId } from "../../themes/palaceVisualTheme";
import { resolvePalacePreset } from "../../themes/palaceThemePresets";
import type { HomeEventName, HomeEventPayload, HomePalaceMatrix as HomePalaceMatrixModel } from "./types";
import { buildHomePalaceReadUrl } from "../../routing/buildQuantumUrls";
import { tryOpenPalaceOverlayFromHashHref } from "../../routing/palaceHashNavigation";
import { setViewerEntrySourceForNextFullRead } from "../../routing/viewerSession";
import styles from "./HomePalaceMatrix.module.css";

export interface HomePalaceMatrixProps {
  matrix: HomePalaceMatrixModel;
  onTrackEvent?: (eventName: HomeEventName, payload: HomeEventPayload) => void;
}

/**
 * Step 2：十二宮速覽格線 + 單一「當前引動」高亮；格內連結至 Viewer `#palace-*`。
 */
export function HomePalaceMatrix({ matrix, onTrackEvent }: HomePalaceMatrixProps) {
  const handlePalaceClick = useCallback(
    (palaceId: PalaceId) => {
      onTrackEvent?.("home_palace_matrix_cell_clicked", {
        entry_point: "palace_matrix",
        palace_id: palaceId,
        matrix_source: matrix.source,
      });
    },
    [matrix.source, onTrackEvent]
  );

  const hintParts = matrix.hintLine.split("·");
  const hintPrimary = hintParts[0]?.trim() ?? matrix.hintLine;
  const hintRest = hintParts.length > 1 ? ` · ${hintParts.slice(1).join("·").trim()}` : "";

  return (
    <section className={styles.wrap} aria-label="十二宮速覽" data-testid="home-palace-matrix">
      <header className={styles.head}>
        <h2 className={styles.title}>十二宮 · 當前引動</h2>
        <p className={styles.hint}>
          <span className={styles.hintEm}>{hintPrimary}</span>
          {hintRest}
        </p>
      </header>
      <div className={styles.grid}>
        {matrix.order.map((id) => {
          const palaceId = id as PalaceId;
          const { row } = resolvePalacePreset(palaceId);
          const active = matrix.activePalaceId === palaceId;
          const href = buildHomePalaceReadUrl(palaceId);
          return (
            <a
              key={palaceId}
              href={href}
              data-lb-palace-id={palaceId}
              data-lb-palace-active={active ? "true" : "false"}
              className={[styles.cell, active ? styles.cellActive : ""].filter(Boolean).join(" ")}
              onClick={(e) => {
                e.preventDefault();
                setViewerEntrySourceForNextFullRead("matrix");
                handlePalaceClick(palaceId);
                tryOpenPalaceOverlayFromHashHref(href);
              }}
            >
              <span className={[styles.badge, active ? styles.badgeVisible : ""].filter(Boolean).join(" ")}>引動</span>
              {row.displayNameZh}
            </a>
          );
        })}
      </div>
    </section>
  );
}
