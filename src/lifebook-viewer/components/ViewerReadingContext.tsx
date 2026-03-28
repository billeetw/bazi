import type { PalaceId } from "../themes/palaceVisualTheme";
import { resolvePalacePreset } from "../themes/palaceThemePresets";
import type { ViewerEntrySource } from "../routing/parseViewerRoute";
import { describeViewerEntrySource } from "./viewerReadingLabels";

export interface ViewerReadingContextProps {
  palaceId: PalaceId;
  source: ViewerEntrySource;
  timelineNodeLabel?: string | null;
  year?: number | null;
}

/**
 * Viewer 正確開頭：一行閱讀脈絡（非產品說明、非分析摘要）。
 */
export function ViewerReadingContext({
  palaceId,
  source,
  timelineNodeLabel,
  year,
}: ViewerReadingContextProps) {
  const { row } = resolvePalacePreset(palaceId);
  const from = describeViewerEntrySource(source, { timelineNodeLabel, year });

  return (
    <div className="mb-5 border-b border-white/5 pb-4" data-testid="viewer-reading-context">
      <p className="text-sm text-slate-400">
        你正在閱讀：
        <span className="text-slate-100 font-medium"> {row.displayNameZh}</span>
      </p>
      {from ? <p className="text-xs text-slate-500 mt-1.5">{from}</p> : null}
    </div>
  );
}
