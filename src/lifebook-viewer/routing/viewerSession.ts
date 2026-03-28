import type { ViewerEntrySource } from "./parseViewerRoute";

export const LB_VIEWER_ENTRY_SOURCE_KEY = "lb_viewer_entry_source";

export function setViewerEntrySourceForNextFullRead(source: Exclude<ViewerEntrySource, "direct">): void {
  try {
    sessionStorage.setItem(LB_VIEWER_ENTRY_SOURCE_KEY, source);
  } catch {
    /* ignore */
  }
}

export function peekViewerEntrySource(): ViewerEntrySource {
  try {
    const v = sessionStorage.getItem(LB_VIEWER_ENTRY_SOURCE_KEY);
    if (v === "home_audit" || v === "matrix" || v === "timeline") return v;
  } catch {
    /* ignore */
  }
  return "direct";
}

export function clearViewerEntrySource(): void {
  try {
    sessionStorage.removeItem(LB_VIEWER_ENTRY_SOURCE_KEY);
  } catch {
    /* ignore */
  }
}
