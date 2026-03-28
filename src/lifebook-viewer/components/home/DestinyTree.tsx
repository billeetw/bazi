import { useCallback, useEffect, useState } from "react";
import { BranchNode } from "./BranchNode";
import { GlassCard } from "./GlassCard";
import { HexCoreFruit } from "./HexCoreFruit";
import type { HomeEventName, HomeEventPayload, HomeNodeAction, HomeSummary, HomeTimelineNode } from "./types";
import { tryOpenPalaceOverlayFromHashHref } from "../../routing/palaceHashNavigation";
import styles from "./DestinyTree.module.css";

const FLASH_MS = 5200;

export interface DestinyTreeProps {
  summary: HomeSummary;
  onNodeAction: (action: HomeNodeAction) => void;
  onRequestRevelation: (input: { source: "node" | "month" | "fog"; nodeId?: string; monthId?: string }) => void;
  onTrackEvent?: (eventName: HomeEventName, payload: HomeEventPayload) => void;
  /** 從 Viewer／`?timeline_node=` 來：對應節點短暫 amber 框線（不改變選中狀態） */
  flashTimelineNodeId?: string | null;
  onTimelineFlashConsumed?: () => void;
  /** 低動效時減弱 glow */
  reduceMotion?: boolean;
}

export function DestinyTree({
  summary,
  onNodeAction,
  onRequestRevelation,
  onTrackEvent,
  flashTimelineNodeId = null,
  onTimelineFlashConsumed,
  reduceMotion = false,
}: DestinyTreeProps) {
  const [monthsOpen, setMonthsOpen] = useState(false);
  const [rippleKey, setRippleKey] = useState<string | null>(null);
  const [flashVisualId, setFlashVisualId] = useState<string | null>(null);

  useEffect(() => {
    if (!flashTimelineNodeId) return;
    const valid = summary.timeline.some((n) => n.id === flashTimelineNodeId);
    if (!valid) {
      onTimelineFlashConsumed?.();
      return;
    }
    setFlashVisualId(flashTimelineNodeId);
    const t = window.setTimeout(() => {
      setFlashVisualId(null);
      onTimelineFlashConsumed?.();
    }, FLASH_MS);
    return () => window.clearTimeout(t);
  }, [flashTimelineNodeId, summary.timeline, onTimelineFlashConsumed]);

  const currentNodeId =
    summary.currentNodeId ??
    summary.timeline.find((n) => n.isCurrent)?.id ??
    summary.timeline.find((n) => !n.isLocked)?.id ??
    summary.timeline[0]?.id ??
    "";
  const currentNode = summary.timeline.find((n) => n.id === currentNodeId);
  const nextNode = summary.timeline.find((n) => n.isLocked) ?? summary.timeline.find((n) => n.id !== currentNodeId);
  const viewerCta = currentNode ? summary.timelineViewerCtas?.[currentNode.id] : undefined;

  const runFruit = useCallback(
    (key: string, source: "node" | "fog", nodeId: string) => {
      setRippleKey(key);
      onNodeAction({ type: "open_time_node", nodeId });
      window.setTimeout(() => {
        onNodeAction({ type: "open_revelation", source, nodeId });
        onRequestRevelation({ source, nodeId });
        setRippleKey(null);
      }, 400);
    },
    [onNodeAction, onRequestRevelation]
  );

  if (!currentNode) {
    return (
      <section className={styles.mapSection} aria-label="生命時空導航">
        <div className={styles.mapTitle}>--- 生命時空導航 ---</div>
        <p className={styles.flashHint} role="alert">
          時間軸節點暫時無法顯示。請重新整理頁面，或回降生藍圖再試。
        </p>
      </section>
    );
  }

  const flashClass = (nodeId: string) =>
    flashVisualId === nodeId
      ? [styles.flashFromViewer, reduceMotion ? styles.flashReduced : ""].filter(Boolean).join(" ")
      : "";

  const fruitType = (risk: HomeTimelineNode["risk"]) => (risk === "neutral" ? "wealth" : risk);

  const statusLabel =
    currentNode.status === "active" ? "此刻" : currentNode.status === "upcoming" ? "將至" : currentNode.status === "review" ? "復盤" : currentNode.status;

  return (
    <section className={styles.mapSection} aria-label="生命時空導航">
      <div className={styles.mapTitle}>--- 生命時空導航 ---</div>
      {flashVisualId ? (
        <p className={styles.flashHint} role="status">
          你剛查看的是這個時間節點
        </p>
      ) : null}

      <div className={styles.heroCanvas}>
        <div className={styles.destinySpine} aria-hidden>
          <div className={styles.spineEnergy} />
          <div className={styles.spineGlow} />
        </div>

        <div className={styles.spineLayer}>
          <div className={styles.nodeLayer}>
            {/* 當前節點：卡片在左、主幹果實在中 */}
            <div
              className={[
                styles.timeNode,
                styles.alignLeft,
                styles.nodeCurrent,
                flashClass(currentNode.id),
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className={styles.nodeCard}>
                <GlassCard compact active className={styles.nodeCardInner}>
                  <div className={styles.nodeCardKicker}>
                    {currentNode.year} · {statusLabel}
                  </div>
                  <div className={styles.nodeCardTitle}>{currentNode.label}</div>
                  <p className={styles.nodeCardLine}>{currentNode.subtitle ?? "當前主線"}</p>
                </GlassCard>
              </div>

              <div className={styles.nodeSpineCol}>
                <BranchNode branch="right" variant="timeline" withMonths>
                  <HexCoreFruit
                    type={fruitType(currentNode.risk)}
                    symbol={currentNode.symbol}
                    size="lg"
                    rippling={rippleKey === "d"}
                    aria-label={`${currentNode.year} 年關鍵節點`}
                    onClick={() => runFruit("d", "node", currentNode.id)}
                  />
                  <span className={styles.branchTextFog}>
                    {currentNode.label}
                    <button
                      type="button"
                      className={styles.branchTrigger}
                      aria-expanded={monthsOpen}
                      onClick={() => {
                        setMonthsOpen((o) => !o);
                        onNodeAction({ type: "open_time_node", nodeId: currentNode.id });
                      }}
                    >
                      {monthsOpen ? "收合子脈" : "子脈·展開"}
                    </button>
                  </span>
                  <div
                    className={`${styles.monthStream} ${monthsOpen ? styles.streamOpen : ""}`}
                    aria-hidden={!monthsOpen}
                  >
                    {(currentNode.monthPreview ?? []).map((m) => (
                      <div
                        key={m.id}
                        className={`${styles.mLeaf} ${m.risk === "danger" ? styles.danger : m.risk === "wealth" ? styles.wealth : ""}`}
                      >
                        <span className={styles.mDot} aria-hidden />
                        <div className={styles.mText}>
                          <strong>{m.label}</strong>
                          <button
                            type="button"
                            className={styles.mDetailBtn}
                            onClick={() => {
                              onNodeAction({
                                type: "open_revelation",
                                source: "month",
                                nodeId: currentNode.id,
                                monthId: m.id,
                              });
                              onRequestRevelation({ source: "month", nodeId: currentNode.id, monthId: m.id });
                            }}
                          >
                            啟示 →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </BranchNode>
              </div>

              <div className={styles.nodePadCol} aria-hidden />
            </div>

            {/* 下一節點／迷霧：卡片在右、訊號在中 */}
            {nextNode ? (
              <div
                className={[
                  styles.timeNode,
                  styles.alignRight,
                  styles.nodeNext,
                  flashClass(nextNode.id),
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={styles.nodePadCol} aria-hidden />

                <div className={styles.nodeSpineCol}>
                  <div className={styles.mistNode}>
                    <button
                      type="button"
                      className={styles.mistHit}
                      aria-label={`感應 ${nextNode.label} 未來訊號`}
                      onClick={() => runFruit("fog", "fog", nextNode.id)}
                    />
                    <BranchNode branch="left" variant="timeline">
                      <span className={styles.mistLabel}>{nextNode.label}</span>
                      <span className={styles.mistFruitWrap}>
                        <HexCoreFruit
                          type={fruitType(nextNode.risk)}
                          symbol={nextNode.symbol}
                          disabled
                          aria-label="未來節點（示意）"
                        />
                      </span>
                    </BranchNode>
                  </div>
                </div>

                <div className={styles.nodeCard}>
                  <GlassCard compact className={styles.nodeCardInner}>
                    <div className={styles.nodeCardKicker}>下一節點</div>
                    <div className={styles.nodeCardTitle}>{nextNode.year}</div>
                    <p className={styles.nodeCardLineMuted}>未來軌跡仍受雲霧影響，點中央訊號以啟示。</p>
                  </GlassCard>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.focusSummaryLayer}>
          <div className={styles.focusSummaryInner}>
            <p className={styles.focusLine}>{summary.cardDescription}</p>
            {viewerCta ? (
              <div className={styles.viewerCta}>
                <p className={styles.viewerCtaReason}>{viewerCta.reasonLine}</p>
                {viewerCta.detailLine ? <p className={styles.viewerCtaDetail}>{viewerCta.detailLine}</p> : null}
                <a
                  className={styles.viewerCtaLink}
                  href={viewerCta.href}
                  onClick={(e) => {
                    if (tryOpenPalaceOverlayFromHashHref(viewerCta.href)) {
                      e.preventDefault();
                    }
                    onTrackEvent?.("timeline_node_clicked", {
                      node_id: currentNode.id,
                      year: currentNode.year,
                      source: "timeline",
                      section_key: viewerCta.sectionKey,
                      palace_id: viewerCta.palaceId,
                      reason: viewerCta.reasonLine,
                      timeline_node_id: viewerCta.timelineNodeId,
                    });
                  }}
                >
                  在完整閱讀打開此宮 →
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
