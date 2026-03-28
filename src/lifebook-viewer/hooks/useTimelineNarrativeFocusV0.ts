import { useCallback, useMemo, useState } from "react";
import type { TimeContextTelemetryPayload } from "../components/home/types";
import type { DayContractV1 } from "../types/dayContract";
import type { CurrentFocusV0 } from "../viewmodels/timelineFocusTypes";
import { resolveCurrentFocusV0 } from "../viewmodels/timelineFocusTypes";

/**
 * Phase 1.5：`currentFocus` 為 state（`manual ?? derived`），供 Phase 2 切換今日／今年。
 * `setFocus` / `resetFocus` 可先不接 UI。
 */
export function useTimelineNarrativeFocusV0(input: {
  contract: DayContractV1 | null;
  timeContext: TimeContextTelemetryPayload | null;
  loading: boolean;
}) {
  const derivedFocus = useMemo(
    () =>
      resolveCurrentFocusV0({
        contract: input.contract,
        timeContext: input.timeContext,
        loading: input.loading,
      }),
    [input.contract, input.timeContext, input.loading]
  );

  const [manualFocus, setManualFocus] = useState<CurrentFocusV0 | null>(null);
  const focus = manualFocus ?? derivedFocus;

  const setFocus = useCallback((v: CurrentFocusV0) => {
    setManualFocus(v);
  }, []);

  const resetFocus = useCallback(() => {
    setManualFocus(null);
  }, []);

  return {
    focus,
    derivedFocus,
    setFocus,
    resetFocus,
  };
}
