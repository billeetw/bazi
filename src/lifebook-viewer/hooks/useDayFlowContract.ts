import { useCallback, useEffect, useState } from "react";
import type { TimeContextTelemetryPayload } from "../components/home/types";
import type { DayContractV1 } from "../types/dayContract";
import { buildClientTimeContextTelemetry } from "../utils/clientTimeContext";
import { fetchDayFlowContract } from "../utils/fetchDayFlowContract";
import { isLifebookApiError } from "../utils/lifebookApiError";

export type UseDayFlowContractResult = {
  data: DayContractV1 | null;
  loading: boolean;
  error: string | null;
  /** 成功或失敗回應內之 `time_context`；無則最近一次 client 快照 */
  timeContext: TimeContextTelemetryPayload | null;
  refetch: () => Promise<void>;
};

/**
 * 依目前命盤與客戶端時區拉取 `DayContractV1`（供 Root／Timeline 時間敘事）。
 */
export function useDayFlowContract(opts: {
  chartJson: Record<string, unknown> | null | undefined;
  enabled: boolean;
}): UseDayFlowContractResult {
  const { chartJson, enabled } = opts;
  const [data, setData] = useState<DayContractV1 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeContext, setTimeContext] = useState<TimeContextTelemetryPayload | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled || !chartJson || typeof chartJson !== "object") {
      setData(null);
      setError(null);
      setLoading(false);
      setTimeContext(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const out = await fetchDayFlowContract({ chart_json: chartJson });
      setData(out.day_contract);
      setTimeContext(out.time_context ?? buildClientTimeContextTelemetry());
    } catch (e) {
      const msg = isLifebookApiError(e) ? e.message : String(e);
      setError(msg);
      setData(null);
      setTimeContext(isLifebookApiError(e) ? e.time_context ?? buildClientTimeContextTelemetry() : buildClientTimeContextTelemetry());
    } finally {
      setLoading(false);
    }
  }, [enabled, chartJson]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, timeContext, refetch };
}
