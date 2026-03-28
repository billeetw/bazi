import type { LifeBookViewerState } from "../../types";
import { resolvePalacePreset } from "../../themes/palaceThemePresets";
import { buildViewerUrl } from "../../routing/buildQuantumUrls";
import type { HomeAuditCta, HomePalaceMatrix, HomeTimelineNode, TimelineNodeCta } from "./types";
import { computeFocus } from "./computeFocus";

/**
 * Phase 3A.2：時間軸節點 → 完整閱讀 deep link（含 year + source=timeline + palace hash）
 * 主宮／理由與 `computeHomeAuditCta` 共用 `computeFocus`。
 */
export function computeTimelineNodeCta(
  node: HomeTimelineNode,
  state: LifeBookViewerState,
  matrix: HomePalaceMatrix | null | undefined,
  audit: HomeAuditCta | null | undefined,
  timelineAll?: HomeTimelineNode[] | null
): TimelineNodeCta | null {
  if (!state.sections || Object.keys(state.sections).length === 0) return null;

  const focus = computeFocus(state, {
    timelineNode: node,
    matrix: matrix ?? undefined,
    auditCta: audit ?? undefined,
    timelineAll: timelineAll ?? undefined,
  });
  if (!focus) return null;

  const palaceId = focus.primaryPalaceId;
  const { row } = resolvePalacePreset(palaceId);

  const href = buildViewerUrl({
    palaceId,
    year: node.year,
    timelineNodeId: node.id,
    source: "timeline",
  });

  return {
    reasonLine: focus.reasonLine,
    detailLine: `主線章節：${node.actionTarget}；將捲至「${row.displayNameZh}」，並帶入節點 ${node.id}（URL timeline_node）。試讀時可於章內升級解鎖全文。`,
    detailParts: {
      template: "timeline_cta_v1",
      timeline_node_id: node.id,
      section_key: node.actionTarget,
      palace_id: palaceId,
      year: node.year,
    },
    href,
    palaceId,
    sectionKey: node.actionTarget,
    timelineNodeId: node.id,
  };
}
