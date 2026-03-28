import { getTelemetryIdentityPayload } from "./telemetryContext";

function getFeedbackBaseUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    const cfg = (window as unknown as { Config?: { LIFEBOOK_FEEDBACK_URL?: string } }).Config;
    return String(cfg?.LIFEBOOK_FEEDBACK_URL ?? "").trim();
  } catch {
    return "";
  }
}

/**
 * 封測回饋連結：請在 `js/config.js` 設定 `LIFEBOOK_FEEDBACK_URL`（Google Form / Typeform 等）。
 * Query：`user_id`、`invite_code`、`current_surface`、`palace_id`（可選）。
 */
export function buildLifebookFeedbackUrl(opts?: {
  palace_id?: string;
  current_surface?: string;
}): string {
  const base = getFeedbackBaseUrl();
  if (!base) return "";
  try {
    const url = new URL(base, typeof window !== "undefined" ? window.location.origin : "https://example.com");
    const id = getTelemetryIdentityPayload();
    if (id.user_id) url.searchParams.set("user_id", id.user_id);
    if (id.invite_code) url.searchParams.set("invite_code", id.invite_code);
    if (opts?.current_surface) url.searchParams.set("current_surface", opts.current_surface);
    if (opts?.palace_id) url.searchParams.set("palace_id", opts.palace_id);
    return url.toString();
  } catch {
    return base;
  }
}
