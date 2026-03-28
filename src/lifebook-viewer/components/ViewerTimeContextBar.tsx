import React from "react";
import type { HomeTimelineNode } from "./home/types";

export interface ViewerTimeContextBarProps {
  /** 自 `buildHomeSummaryFromDocument` 對齊的節點（優先） */
  resolvedNode: HomeTimelineNode | null;
  timelineNodeId: string | null;
  year: number | null;
  /** URL hash 宮（捲動權威） */
  scrollPalaceId: string | null;
  /** `computeFocus` 依節點+matrix+audit 推得的宮；與 scrollPalaceId 不同時顯示提示 */
  contextPalaceId?: string | null;
}

/**
 * 完整閱讀頂部：時間軸語境（`timeline_node` / `year`），與 hash 捲動錨點分離展示。
 */
export function ViewerTimeContextBar({
  resolvedNode,
  timelineNodeId,
  year,
  scrollPalaceId,
  contextPalaceId,
}: ViewerTimeContextBarProps) {
  if (!resolvedNode && !timelineNodeId && year == null) return null;

  const label = resolvedNode?.label ?? (year != null ? `${year} 年` : null);
  const subtitle = resolvedNode?.subtitle;
  const mismatch =
    Boolean(scrollPalaceId && contextPalaceId && scrollPalaceId !== contextPalaceId);

  return (
    <div
      className="mb-4 rounded-xl border border-cyan-500/25 bg-slate-800/50 px-4 py-3 text-sm text-slate-200"
      role="region"
      aria-label="時間軸語境"
      data-lb-viewer-time-context="true"
    >
      <div className="font-semibold text-cyan-200/95">時間軸語境</div>
      <div className="mt-1 text-slate-300/95 leading-relaxed">
        {label ? (
          <>
            {label}
            {subtitle ? ` · ${subtitle}` : ""}
          </>
        ) : (
          <>節點 {timelineNodeId ?? "—"}</>
        )}
        {year != null ? ` · ${year} 年` : null}
        {timelineNodeId ? ` · id ${timelineNodeId}` : null}
      </div>
      {scrollPalaceId ? (
        <div className="mt-2 text-xs text-slate-500">
          閱讀捲動以網址 <span className="text-slate-400">#palace-{scrollPalaceId}</span> 為準（hash 主導捲動）。
        </div>
      ) : null}
      {mismatch ? (
        <div className="mt-2 text-xs text-amber-400/90">
          目前錨點宮「{scrollPalaceId}」與時間節點建議宮「{contextPalaceId}」不一致；已依錨點捲動，時間語境仍以節點為準。
        </div>
      ) : null}
    </div>
  );
}
