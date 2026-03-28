import type { TimeContextTelemetryPayload } from "../components/home/types";

/** `generate-section` 等非 2xx：若 body 含 `time_context`，附於此類以供 telemetry */
export class LifebookApiError extends Error {
  readonly status: number;
  readonly time_context?: TimeContextTelemetryPayload;
  readonly body?: Record<string, unknown>;

  constructor(
    message: string,
    opts?: { status?: number; time_context?: TimeContextTelemetryPayload; body?: Record<string, unknown> }
  ) {
    super(message);
    this.name = "LifebookApiError";
    this.status = opts?.status ?? 0;
    this.time_context = opts?.time_context;
    this.body = opts?.body;
  }
}

export function isLifebookApiError(e: unknown): e is LifebookApiError {
  return e instanceof LifebookApiError;
}
