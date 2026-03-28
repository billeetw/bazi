/**
 * 命書 Viewer 狀態：sections、weight、chart、meta
 */

import { useState, useCallback, type SetStateAction } from "react";
import type { LifeBookViewerState, SectionPayload } from "../types";

const emptyState: LifeBookViewerState = {
  meta: { schema_version: "1.0" },
  sections: {},
  weight_analysis: null,
  chart_json: null,
};

export function useLifeBookData(initial?: LifeBookViewerState | null) {
  const [state, setState] = useState<LifeBookViewerState>(initial ?? emptyState);

  const setSections = useCallback((sections: Record<string, SectionPayload>) => {
    setState((prev) => ({ ...prev, sections }));
  }, []);

  const setWeightAnalysis = useCallback((weight_analysis: LifeBookViewerState["weight_analysis"]) => {
    setState((prev) => ({ ...prev, weight_analysis: weight_analysis ?? null }));
  }, []);

  const setChartJson = useCallback((chart_json: LifeBookViewerState["chart_json"]) => {
    setState((prev) => ({ ...prev, chart_json: chart_json ?? null }));
  }, []);

  const setMeta = useCallback((meta: LifeBookViewerState["meta"]) => {
    setState((prev) => ({ ...prev, meta: meta ?? null }));
  }, []);

  const replaceState = useCallback((next: SetStateAction<LifeBookViewerState>) => {
    setState(next);
  }, []);

  const clear = useCallback(() => {
    setState(emptyState);
  }, []);

  const hasContent = Object.keys(state.sections).length > 0;

  return {
    state,
    setState: replaceState,
    setSections,
    setWeightAnalysis,
    setChartJson,
    setMeta,
    clear,
    hasContent,
  };
}
