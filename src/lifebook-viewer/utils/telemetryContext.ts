import type { HomeEventPayload } from "../components/home/types";
import { buildClientTimeContextTelemetry } from "./clientTimeContext";

const BAZI_USER_KEY = "bazi_user";
const BAZI_USER_ID_FALLBACK_KEY = "bazi_user_id";
const INVITE_CODE_KEY = "lifebook_v2_beta_invite_code";

/** 登入後 `bazi_user` JSON 的 `id`（與 JWT `sub` / D1 users.id 對齊） */
export function readTelemetryUserId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(BAZI_USER_KEY);
    if (raw) {
      const u = JSON.parse(raw) as { id?: string | number };
      if (u?.id != null) {
        const s = String(u.id).trim();
        if (s) return s;
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const anon = window.localStorage.getItem(BAZI_USER_ID_FALLBACK_KEY)?.trim();
    if (anon) return anon;
  } catch {
    /* ignore */
  }
  return undefined;
}

export function readTelemetryInviteCode(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const c = window.localStorage.getItem(INVITE_CODE_KEY)?.trim();
    if (c) return c;
  } catch {
    /* ignore */
  }
  return undefined;
}

export function getTelemetryIdentityPayload(): Pick<HomeEventPayload, "user_id" | "invite_code"> {
  const user_id = readTelemetryUserId();
  const invite_code = readTelemetryInviteCode();
  const out: Pick<HomeEventPayload, "user_id" | "invite_code"> = {};
  if (user_id) out.user_id = user_id;
  if (invite_code) out.invite_code = invite_code;
  return out;
}

/** 合併遙測：事件欄位優先，再覆寫帶上 `user_id` / `invite_code`（避免事件 payload 覆蓋身分）；固定附 `time_context` 全量（除錯用，可傳入覆寫） */
export function enrichTelemetryPayload(payload: HomeEventPayload): HomeEventPayload {
  const identity = getTelemetryIdentityPayload();
  return {
    ...payload,
    ...identity,
    time_context: payload.time_context ?? buildClientTimeContextTelemetry(),
  };
}
