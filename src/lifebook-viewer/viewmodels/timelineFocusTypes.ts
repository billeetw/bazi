import type { TimeContextTelemetryPayload } from "../components/home/types";
import type { DayContractV1 } from "../types/dayContract";

/** FocusStateMachineV0：Phase 1 刻意收斂 */
export type CurrentFocusV0 = "day" | "year";

export function resolveCurrentFocusV0(input: {
  contract: DayContractV1 | null;
  timeContext: TimeContextTelemetryPayload | null;
  loading: boolean;
}): CurrentFocusV0 {
  if (input.loading) return "day";
  if (input.contract) return "day";
  if (input.timeContext?.day_key) return "year";
  return "day";
}
