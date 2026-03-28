import type { ViewerEntrySource } from "../routing/parseViewerRoute";

/** 閱讀頁頂部「來自」一行（與 `source=` query 對齊） */
export function describeViewerEntrySource(
  source: ViewerEntrySource,
  opts?: { timelineNodeLabel?: string | null; year?: number | null }
): string {
  const y = opts?.year;
  const node = opts?.timelineNodeLabel?.trim();
  switch (source) {
    case "timeline":
      if (node) return `來自：時間決策（${node}）`;
      if (y != null) return `來自：時間決策（${y}）`;
      return "來自：時間決策";
    case "root":
      return "來自：降生藍圖";
    case "domains":
      return "來自：十二宮領域";
    case "viewer":
      return "來自：閱讀延續";
    case "matrix":
      return "來自：十二宮速覽";
    case "home_audit":
      return "來自：首頁建議下一步";
    default:
      return "";
  }
}
