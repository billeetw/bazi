const NAV_SESSION_KEY = "lb_viewer_navigation_session_id";

/**
 * 同源分頁內可跨 refresh 關聯多次載入（仍建議以 `navigation_instance_id` 區分單次「實例」）。
 */
export function getViewerNavigationSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let v = sessionStorage.getItem(NAV_SESSION_KEY);
    if (!v || v.trim() === "") {
      v = crypto.randomUUID();
      sessionStorage.setItem(NAV_SESSION_KEY, v);
    }
    return v;
  } catch {
    return "unknown";
  }
}
