import type { TimeContextTelemetryPayload } from "../components/home/types";
import type { DayContractV1 } from "../types/dayContract";
import { clientTimeContextPayload } from "./clientTimeContext";
import { LifebookApiError } from "./lifebookApiError";

function resolveApiBase(): string {
  const w = typeof window !== "undefined" ? (window as unknown as { Config?: { API_BASE?: string; REMOTE_API_BASE?: string; LOCAL_WORKER_API_BASE?: string } }) : null;
  const cfg = w?.Config;
  if (cfg?.API_BASE) return cfg.API_BASE;
  const isLocalhost =
    typeof window !== "undefined" && /^localhost$|^127\.0\.0\.1$/.test(window.location.hostname || "");
  if (isLocalhost) return cfg?.LOCAL_WORKER_API_BASE || "http://127.0.0.1:8787";
  return cfg?.REMOTE_API_BASE || "https://bazi-api.billeetw.workers.dev";
}

function getBetaInviteCode(): string | undefined {
  try {
    const c = String(localStorage.getItem("lifebook_v2_beta_invite_code") || "").trim();
    return c || undefined;
  } catch {
    return undefined;
  }
}

function parseTimeContextFromApi(data: Record<string, unknown>): TimeContextTelemetryPayload | undefined {
  const raw = data.time_context;
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (typeof o.time_zone !== "string" || typeof o.day_key !== "string" || typeof o.client_now_iso !== "string") {
    return undefined;
  }
  if (o.day_key_mode !== "civil_client_tz") return undefined;
  if (o.timezone_source !== "client_iana" && o.timezone_source !== "fallback_utc") return undefined;
  return {
    time_zone: o.time_zone,
    day_key: o.day_key,
    client_now_iso: o.client_now_iso,
    day_key_mode: "civil_client_tz",
    timezone_source: o.timezone_source,
  };
}

/**
 * 流日 DayContract：`POST /api/life-book/daily-flow`（與 `generate-section` 相同 `clientTimeZone` + `clientNowISO` 語境）。
 */
export async function fetchDayFlowContract(input: {
  chart_json: Record<string, unknown>;
  skip_cache?: boolean;
}): Promise<{ day_contract: DayContractV1; time_context?: TimeContextTelemetryPayload }> {
  const apiBase = resolveApiBase();
  const { clientTimeZone, clientNowISO } = clientTimeContextPayload();
  const body: Record<string, unknown> = {
    chart_json: input.chart_json,
    clientTimeZone,
    clientNowISO,
    skip_cache: input.skip_cache === true,
  };
  const code = getBetaInviteCode();
  if (code) body.beta_invite_code = code;

  const res = await fetch(`${apiBase}/api/life-book/daily-flow`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  let data: Record<string, unknown>;
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    throw new LifebookApiError("daily-flow: invalid JSON", { status: res.status });
  }
  const tc = parseTimeContextFromApi(data);
  if (!res.ok) {
    const err = typeof data.error === "string" ? data.error : `HTTP ${res.status}`;
    throw new LifebookApiError(err, { status: res.status, time_context: tc, body: data });
  }
  if (data.ok !== true || !data.day_contract || typeof data.day_contract !== "object") {
    throw new LifebookApiError("daily-flow: unexpected response", { status: res.status, time_context: tc, body: data });
  }
  return { day_contract: data.day_contract as DayContractV1, time_context: tc };
}
