/**
 * Viewer `source=` query 單一真相（勿自創 `domain` / `home` 等變體）。
 * 與 `buildQuantumUrls`、`parseViewerRoute` 語義對齊。
 */
export type ViewerEntrySource =
  | "root"
  | "domains"
  | "timeline"
  | "matrix"
  | "home_audit"
  | "viewer"
  | "direct";

/** `/timeline?source=` 與跨頁返回語境 */
export type TimelineEntrySource = "root" | "viewer" | "domains";
