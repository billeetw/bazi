/** Viewer 帶時間節點進完整閱讀時寫入；回 Home 時讀取以做 DestinyTree 短暫高亮（單向、非雙向綁定） */
const VIEWER_TIMELINE_NODE_KEY = "lb_viewer_timeline_context_node_id";

export function persistViewerTimelineNodeContext(nodeId: string): void {
  try {
    sessionStorage.setItem(VIEWER_TIMELINE_NODE_KEY, nodeId.trim());
  } catch {
    /* ignore */
  }
}

export function clearViewerTimelineNodeContext(): void {
  try {
    sessionStorage.removeItem(VIEWER_TIMELINE_NODE_KEY);
  } catch {
    /* ignore */
  }
}

export function peekViewerTimelineNodeContext(): string | null {
  try {
    const v = sessionStorage.getItem(VIEWER_TIMELINE_NODE_KEY);
    return v && v.trim() !== "" ? v.trim() : null;
  } catch {
    return null;
  }
}

/** Home Shell（`view` 非 viewer）時從 query 取 `timeline_node`／`node` */
export function parseHomeTimelineNodeFromQuery(search: string): string | null {
  try {
    const q = search.startsWith("?") ? search.slice(1) : search;
    const p = new URLSearchParams(q);
    if (p.get("view") === "viewer") return null;
    const raw = p.get("timeline_node") ?? p.get("node");
    return raw && raw.trim() !== "" ? raw.trim() : null;
  } catch {
    return null;
  }
}
