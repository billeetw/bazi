import type { LifeBookViewerState } from "../types";
import type { TimeContextTelemetryPayload } from "../components/home/types";
import { SECTION_ORDER } from "../constants";
import { normalizeApiResponse, type NormalizeInput } from "./normalizeApiResponse";
import {
  buildLifebookGenerateFingerprint,
  LIFEBOOK_CLIENT_CACHE_PREFIX,
  LIFEBOOK_CLIENT_CACHE_TTL_MS,
  normalizeUnlockForFingerprint,
} from "./lifebookGenerateFingerprint";
import { clientTimeContextPayload } from "./clientTimeContext";
import { LifebookApiError } from "./lifebookApiError";

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

const BETA_SEED_KEY = "lifebook_v2_seed";
const BETA_SEED_BACKUP_KEY = "lifebook_v2_seed_backup";

function resolveApiBase(): string {
  const w = typeof window !== "undefined" ? (window as unknown as { Config?: { API_BASE?: string; REMOTE_API_BASE?: string; LOCAL_WORKER_API_BASE?: string } }) : null;
  const cfg = w?.Config;
  if (cfg?.API_BASE) return cfg.API_BASE;
  const isLocalhost =
    typeof window !== "undefined" &&
    /^localhost$|^127\.0\.0\.1$/.test(window.location.hostname || "");
  if (isLocalhost) return cfg?.LOCAL_WORKER_API_BASE || "http://127.0.0.1:8787";
  return cfg?.REMOTE_API_BASE || "https://bazi-api.billeetw.workers.dev";
}

function getPlanPayload(): { plan_tier: "free" | "pro"; unlock_sections: string[]; beta_invite_code?: string } {
  let plan_tier: "free" | "pro" = "free";
  let unlock_sections: string[] = [];
  try {
    const t = localStorage.getItem("lifebook_v2_tier");
    if (t === "pro") plan_tier = "pro";
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem("lifebook_v2_unlock_sections");
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) unlock_sections = parsed.filter((x) => typeof x === "string");
  } catch {
    /* ignore */
  }
  let beta_invite_code = "";
  try {
    beta_invite_code = String(localStorage.getItem("lifebook_v2_beta_invite_code") || "").trim();
  } catch {
    /* ignore */
  }
  return { plan_tier, unlock_sections, beta_invite_code: beta_invite_code || undefined };
}

export function readBetaSeed(): { chart_json: Record<string, unknown>; weight_analysis: Record<string, unknown> } | null {
  try {
    const raw = sessionStorage.getItem(BETA_SEED_KEY) || localStorage.getItem(BETA_SEED_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      chart_json?: Record<string, unknown>;
      weight_analysis?: Record<string, unknown>;
    };
    if (!parsed?.chart_json || !parsed?.weight_analysis) return null;
    return {
      chart_json: parsed.chart_json,
      weight_analysis: parsed.weight_analysis,
    };
  } catch {
    return null;
  }
}

/** 與主站 redeem 一致：須有後端認可的驗證標記，或當場 redeem 成功 */
async function ensureBetaInviteVerified(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem("lifebook_v2_beta_invite_verified") === "1") return;
  } catch {
    /* ignore */
  }
  let code = "";
  try {
    code = String(localStorage.getItem("lifebook_v2_beta_invite_code") || "").trim();
  } catch {
    /* ignore */
  }
  if (!code) {
    throw new Error("請先於主站「驗證邀請碼」後再生成命書（人生說明書 Beta 區塊 → 驗證邀請碼）。");
  }
  const apiBase = resolveApiBase();
  const res = await fetch(`${apiBase}/api/life-book/beta/redeem`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ invite_code: code }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
  if (!res.ok || data?.ok !== true) {
    throw new Error("邀請碼無效或已失效，請回主站重新驗證。");
  }
  try {
    localStorage.setItem("lifebook_v2_beta_invite_verified", "1");
  } catch {
    /* ignore */
  }
}

function readLocalCache(fp: string): LifeBookViewerState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LIFEBOOK_CLIENT_CACHE_PREFIX + fp);
    if (!raw) return null;
    const entry = JSON.parse(raw) as { savedAt?: number; state?: LifeBookViewerState };
    if (!entry?.savedAt || !entry?.state) return null;
    if (Date.now() - entry.savedAt > LIFEBOOK_CLIENT_CACHE_TTL_MS) return null;
    return entry.state;
  } catch {
    return null;
  }
}

function writeLocalCache(fp: string, state: LifeBookViewerState): void {
  try {
    localStorage.setItem(LIFEBOOK_CLIENT_CACHE_PREFIX + fp, JSON.stringify({ savedAt: Date.now(), state }));
  } catch {
    /* quota */
  }
}

function parseGenerateLikeToState(
  data: Record<string, unknown>,
  seed: { chart_json: Record<string, unknown>; weight_analysis: Record<string, unknown> }
): LifeBookViewerState {
  const chartOut =
    data.chart_json && typeof data.chart_json === "object"
      ? (data.chart_json as Record<string, unknown>)
      : seed.chart_json;
  const weightOut =
    data.weight_analysis && typeof data.weight_analysis === "object"
      ? (data.weight_analysis as LifeBookViewerState["weight_analysis"])
      : seed.weight_analysis;
  return normalizeApiResponse({
    ok: true,
    sections: (data.sections as Record<string, unknown>) ?? {},
    chart_json: chartOut,
    weight_analysis: weightOut,
    locked_sections: Array.isArray(data.locked_sections) ? (data.locked_sections as NormalizeInput["locked_sections"]) : undefined,
    plan_tier: data.plan_tier as "free" | "pro" | undefined,
    plan_matrix_version: data.plan_matrix_version as string | undefined,
    available_sections: Array.isArray(data.available_sections) ? (data.available_sections as string[]) : undefined,
    meta: { output_mode: "technical" },
  });
}

async function tryServerCache(
  apiBase: string,
  fp: string,
  beta_invite_code: string | undefined,
  seed: { chart_json: Record<string, unknown>; weight_analysis: Record<string, unknown> }
): Promise<LifeBookViewerState | null> {
  const res = await fetch(`${apiBase}/api/life-book/cache-fetch`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fingerprint: fp, beta_invite_code: beta_invite_code || undefined }),
  });
  if (res.status === 404) return null;
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || data?.ok !== true) return null;
  return parseGenerateLikeToState(data, seed);
}

async function fetchChartWithFindings(
  apiBase: string,
  seed: { chart_json: Record<string, unknown>; weight_analysis: Record<string, unknown> },
  beta_invite_code: string | undefined
): Promise<Record<string, unknown>> {
  const localeRaw = String(seed.chart_json?.language ?? seed.chart_json?.astrolabeLanguage ?? "zh-TW");
  const res = await fetch(`${apiBase}/api/life-book/chart-with-findings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chart_json: seed.chart_json,
      locale: localeRaw,
      beta_invite_code: beta_invite_code || undefined,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || data?.ok !== true) {
    const msg = typeof data?.error === "string" ? data.error : `命盤附 findings 失敗（${res.status}）`;
    throw new Error(msg);
  }
  if (data.chart_json && typeof data.chart_json === "object") {
    return data.chart_json as Record<string, unknown>;
  }
  throw new Error("chart-with-findings 回應缺少 chart_json");
}

async function storeServerCache(
  apiBase: string,
  fp: string,
  beta_invite_code: string | undefined,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await fetch(`${apiBase}/api/life-book/cache-store`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fingerprint: fp,
        beta_invite_code: beta_invite_code || undefined,
        payload,
      }),
    });
  } catch {
    /* ignore */
  }
}

export type GenerateFromBetaSeedOptions = {
  /** 分段生成進度：done 為 1-based，total 為 SECTION_ORDER 長度 */
  onProgress?: (done: number, total: number, sectionKey: string) => void;
};

async function generateSegmentedTechnical(
  seed: { chart_json: Record<string, unknown>; weight_analysis: Record<string, unknown> },
  plan: ReturnType<typeof getPlanPayload>,
  apiBase: string,
  options?: GenerateFromBetaSeedOptions
): Promise<{ state: LifeBookViewerState; cachePayload: Record<string, unknown> }> {
  const sections: Record<string, unknown> = {};
  const lockedSections: Array<{
    section_key?: string;
    is_locked?: boolean;
    lock_reason?: string;
    teaser?: { section_key?: string; title?: string; teaser?: string };
  }> = [];

  let planTier: "free" | "pro" | undefined;
  let planMatrixVersion: string | undefined;
  const total = SECTION_ORDER.length;

  for (let i = 0; i < SECTION_ORDER.length; i++) {
    const sectionKey = SECTION_ORDER[i];
    options?.onProgress?.(i + 1, total, sectionKey);

    const res = await fetch(`${apiBase}/api/life-book/generate-section`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        section_key: sectionKey,
        chart_json: seed.chart_json,
        weight_analysis: seed.weight_analysis,
        plan_tier: plan.plan_tier,
        unlock_sections: plan.unlock_sections,
        beta_invite_code: plan.beta_invite_code,
        output_mode: "technical",
        ...clientTimeContextPayload(),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const msg = typeof data?.error === "string" ? data.error : `章節 ${sectionKey} 失敗（${res.status}）`;
      throw new Error(msg);
    }
    if (data.invite_required === true) {
      throw new Error("請先於主站「驗證邀請碼」後再生成命書。");
    }
    if (data.is_locked === true) {
      lockedSections.push({
        section_key: sectionKey,
        is_locked: true,
        lock_reason: typeof data.lock_reason === "string" ? data.lock_reason : "requires_pro",
        teaser: data.teaser as { section_key?: string; title?: string; teaser?: string } | undefined,
      });
      if (typeof data.plan_tier === "string") planTier = data.plan_tier as "free" | "pro";
      if (typeof data.plan_matrix_version === "string") planMatrixVersion = data.plan_matrix_version;
      continue;
    }
    if (data.section && typeof data.section === "object") {
      sections[sectionKey] = data.section as Record<string, unknown>;
    }
    if (typeof data.plan_tier === "string") planTier = data.plan_tier as "free" | "pro";
    if (typeof data.plan_matrix_version === "string") planMatrixVersion = data.plan_matrix_version;
  }

  const chartOut = await fetchChartWithFindings(apiBase, seed, plan.beta_invite_code);
  const available_sections = SECTION_ORDER.filter((k) => k in sections);
  const tierResolved = planTier ?? plan.plan_tier;
  const cachePayload: Record<string, unknown> = {
    ok: true,
    sections,
    chart_json: chartOut,
    weight_analysis: seed.weight_analysis,
    plan_tier: tierResolved,
    plan_matrix_version: planMatrixVersion ?? "unknown",
    available_sections,
    locked_sections: lockedSections.length > 0 ? lockedSections : undefined,
  };

  const state = normalizeApiResponse({
    ok: true,
    sections: sections as Record<string, unknown>,
    chart_json: chartOut,
    weight_analysis: seed.weight_analysis,
    locked_sections: lockedSections.length > 0 ? lockedSections : undefined,
    plan_tier: tierResolved,
    plan_matrix_version: planMatrixVersion,
    available_sections,
    meta: { output_mode: "technical" },
  });

  return { state, cachePayload };
}

function buildFingerprint(seed: { chart_json: Record<string, unknown>; weight_analysis: Record<string, unknown> }, plan: ReturnType<typeof getPlanPayload>): string {
  const inviteFingerprint = plan.beta_invite_code ? String(plan.beta_invite_code).trim().toUpperCase() : "";
  return buildLifebookGenerateFingerprint({
    chart_json: seed.chart_json,
    weight_analysis: seed.weight_analysis,
    plan_tier: plan.plan_tier,
    unlock_sections: normalizeUnlockForFingerprint(plan.unlock_sections),
    output_mode: "technical",
    invite_fingerprint: inviteFingerprint,
  });
}

export type GenerateSingleSectionFromBetaSeedResult = {
  state: LifeBookViewerState;
  /** Worker `generate-section` 回應之 `time_context`（供 telemetry） */
  time_context?: TimeContextTelemetryPayload;
};

/**
 * 單章按需生成：呼叫既有 `generate-section`，只 merge 一個 `section_key`，不重跑整本。
 */
export async function generateSingleSectionFromBetaSeed(
  baseState: LifeBookViewerState,
  sectionKey: string
): Promise<GenerateSingleSectionFromBetaSeedResult> {
  const seed =
    readBetaSeed() ??
    (baseState.chart_json && baseState.weight_analysis
      ? {
          chart_json: baseState.chart_json as Record<string, unknown>,
          weight_analysis: baseState.weight_analysis as Record<string, unknown>,
        }
      : null);
  if (!seed) {
    throw new Error("尚未找到命盤資料。請先在同一網域完成一次命盤計算，再開啟命書。");
  }
  await ensureBetaInviteVerified();
  const plan = getPlanPayload();
  const apiBase = resolveApiBase();

  const res = await fetch(`${apiBase}/api/life-book/generate-section`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      section_key: sectionKey,
      chart_json: seed.chart_json,
      weight_analysis: seed.weight_analysis,
      plan_tier: plan.plan_tier,
      unlock_sections: plan.unlock_sections,
      beta_invite_code: plan.beta_invite_code,
      output_mode: "technical",
      ...clientTimeContextPayload(),
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const tc = parseTimeContextFromApi(data);
    if (res.status === 429 && data?.error === "rate_limited") {
      throw new LifebookApiError("__LIFEBOOK_P0_BUSY__", { status: res.status, time_context: tc, body: data });
    }
    if (res.status >= 500) {
      throw new LifebookApiError("__LIFEBOOK_P0_BUSY__", { status: res.status, time_context: tc, body: data });
    }
    const msg = typeof data?.error === "string" ? data.error : `章節 ${sectionKey} 失敗（${res.status}）`;
    throw new LifebookApiError(msg, { status: res.status, time_context: tc, body: data });
  }
  if (data.invite_required === true) {
    throw new Error("請先於主站「驗證邀請碼」後再生成命書。");
  }
  if (data.is_locked === true) {
    throw new Error(
      typeof data.lock_reason === "string" && data.lock_reason
        ? `此章節需進階方案：${data.lock_reason}`
        : "此章節目前為鎖定狀態，請於完整閱讀檢視方案。"
    );
  }
  if (!data.section || typeof data.section !== "object") {
    throw new Error(`章節 ${sectionKey} 回應格式異常。`);
  }

  const mergedSections: Record<string, unknown> = { ...(baseState.sections as Record<string, unknown>) };
  mergedSections[sectionKey] = data.section as Record<string, unknown>;

  const planTierFromApi = typeof data.plan_tier === "string" ? (data.plan_tier as "free" | "pro") : undefined;
  const planMatrixFromApi =
    typeof data.plan_matrix_version === "string" ? data.plan_matrix_version : undefined;

  const metaLocked = (baseState.meta as unknown as { locked_sections?: unknown })?.locked_sections;
  const state = normalizeApiResponse({
    ok: true,
    sections: mergedSections,
    chart_json: baseState.chart_json ?? seed.chart_json,
    weight_analysis: baseState.weight_analysis ?? seed.weight_analysis,
    meta: {
      ...(baseState.meta && typeof baseState.meta === "object" ? baseState.meta : {}),
      output_mode: "technical",
    },
    locked_sections: Array.isArray(metaLocked) ? (metaLocked as NormalizeInput["locked_sections"]) : undefined,
    plan_tier: planTierFromApi ?? (baseState.meta as unknown as { plan_tier?: "free" | "pro" })?.plan_tier,
    plan_matrix_version:
      planMatrixFromApi ?? (baseState.meta as unknown as { plan_matrix_version?: string })?.plan_matrix_version,
  });
  return { state, time_context: parseTimeContextFromApi(data) };
}

export async function generateFromBetaSeed(
  seed: { chart_json: Record<string, unknown>; weight_analysis: Record<string, unknown> },
  options?: GenerateFromBetaSeedOptions
): Promise<LifeBookViewerState> {
  const plan = getPlanPayload();
  const fp = buildFingerprint(seed, plan);

  const localHit = readLocalCache(fp);
  if (localHit) return localHit;

  await ensureBetaInviteVerified();

  const apiBase = resolveApiBase();

  const serverHit = await tryServerCache(apiBase, fp, plan.beta_invite_code, seed);
  if (serverHit) {
    writeLocalCache(fp, serverHit);
    return serverHit;
  }

  const { state, cachePayload } = await generateSegmentedTechnical(seed, plan, apiBase, options);
  writeLocalCache(fp, state);
  void storeServerCache(apiBase, fp, plan.beta_invite_code, cachePayload);

  return state;
}
