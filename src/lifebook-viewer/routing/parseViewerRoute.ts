/**
 * Phase 3A.1：命書「完整閱讀」URL 約定（實際路徑仍為 lifebook-viewer.html）
 * 例：`?view=viewer&year=2026&source=timeline&timeline_node=y2026#palace-fuqi`
 * `intent=full`：由 overlay「進階完整閱讀」明確指定，勿被首頁誤修正剝除。
 */
import type { PalaceId } from "../themes/palaceVisualTheme";
import { parsePalaceIdFromHash } from "../hooks/useHashPalaceId";

export type ViewerEntrySource =
  | "home_audit"
  | "matrix"
  | "timeline"
  | "root"
  | "domains"
  | "viewer"
  | "direct";

export interface ParsedViewerRoute {
  /** search 內 view=viewer */
  isViewerMode: boolean;
  year: number | null;
  palaceId: PalaceId | null;
  source: ViewerEntrySource;
  intentFull: boolean;
  /** 時間軸節點 id（`timeline_node` 或 `node`） */
  timelineNodeId: string | null;
}

const SOURCE_VALUES: ViewerEntrySource[] = [
  "home_audit",
  "matrix",
  "timeline",
  "root",
  "domains",
  "viewer",
];

function parseSourceParam(raw: string | null): ViewerEntrySource {
  if (raw && (SOURCE_VALUES as readonly string[]).includes(raw)) return raw as ViewerEntrySource;
  return "direct";
}

export function parseViewerRoute(href: string | URL): ParsedViewerRoute {
  let url: URL;
  try {
    url = typeof href === "string" ? new URL(href, typeof window !== "undefined" ? window.location.origin : "http://localhost") : href;
  } catch {
    return {
      isViewerMode: false,
      year: null,
      palaceId: null,
      source: "direct",
      intentFull: false,
      timelineNodeId: null,
    };
  }

  const q = url.searchParams;
  const isViewerMode = q.get("view") === "viewer";
  const rawYear = q.get("year");
  const y = rawYear != null && rawYear !== "" ? Number(rawYear) : NaN;
  const year = Number.isFinite(y) && y > 1900 && y < 2300 ? Math.floor(y) : null;
  const rawNode = q.get("timeline_node") ?? q.get("node");
  const timelineNodeId = rawNode != null && String(rawNode).trim() !== "" ? String(rawNode).trim() : null;

  return {
    isViewerMode,
    year,
    palaceId: parsePalaceIdFromHash(url.hash),
    source: parseSourceParam(q.get("source")),
    intentFull: q.get("intent") === "full",
    timelineNodeId,
  };
}

/** 僅用於首頁誤帶 `?view=viewer#palace-*`（無 year／source／intent）時剝除 view */
export function isBarePalaceViewerMistake(url: URL): boolean {
  if (url.searchParams.get("view") !== "viewer") return false;
  if (url.searchParams.get("intent") === "full") return false;
  if (url.searchParams.has("year")) return false;
  if (url.searchParams.has("source")) return false;
  if (url.searchParams.has("timeline_node") || url.searchParams.has("node")) return false;
  return parsePalaceIdFromHash(url.hash) != null;
}
