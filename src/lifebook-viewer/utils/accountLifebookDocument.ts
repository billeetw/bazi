/**
 * 帳號級命書：與主站 JWT（localStorage bazi_jwt）連動，GET/PUT /api/me/lifebook-document
 * 僅同源部署有效；無 token 時不呼叫。
 */

import type { LifeBookDocument, LifeBookViewerState } from "../types";

const BAZI_JWT_KEY = "bazi_jwt";

export function readBaziJwt(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(BAZI_JWT_KEY) || "";
  } catch {
    return "";
  }
}

/** 與主站 AuthService 一致：命書頁與首頁同源時讀得到 JWT */
export function getAccountAuthHeaders(): Record<string, string> {
  const t = readBaziJwt();
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
}

function meApiOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin || "";
}

function hasRenderableDoc(d: LifeBookDocument | null | undefined): boolean {
  if (!d || typeof d !== "object") return false;
  const sec = d.sections;
  if (sec && typeof sec === "object" && Object.keys(sec).length > 0) return true;
  return !!(d.chart_json && typeof d.chart_json === "object");
}

/**
 * 登入時拉取雲端命書；未登入或非 200 回傳 null
 */
export async function fetchAccountLifebookDocument(): Promise<LifeBookDocument | null> {
  if (typeof window === "undefined" || !readBaziJwt()) return null;
  const url = `${meApiOrigin()}/api/me/lifebook-document`;
  try {
    const res = await fetch(url, { headers: getAccountAuthHeaders(), credentials: "same-origin" });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; document?: unknown };
    if (!data?.ok || data.document == null) return null;
    const doc = data.document as LifeBookDocument;
    return hasRenderableDoc(doc) ? doc : null;
  } catch {
    return null;
  }
}

const MAX_SAVE_BYTES = 5 * 1024 * 1024;

/**
 * 將目前 Viewer 狀態寫回帳號（debounce 由呼叫端負責）
 */
export async function saveAccountLifebookDocument(state: LifeBookViewerState): Promise<boolean> {
  if (typeof window === "undefined" || !readBaziJwt()) return false;
  const raw = JSON.stringify(state);
  if (raw.length > MAX_SAVE_BYTES) {
    console.warn("[accountLifebookDocument] skip save: payload too large");
    return false;
  }
  const url = `${meApiOrigin()}/api/me/lifebook-document`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "content-type": "application/json; charset=utf-8",
        ...getAccountAuthHeaders(),
      },
      credentials: "same-origin",
      body: JSON.stringify({ document: state }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function isLikelyValidViewerState(doc: unknown): doc is LifeBookViewerState {
  if (!doc || typeof doc !== "object") return false;
  const d = doc as Record<string, unknown>;
  return !!(d.meta && typeof d.meta === "object" && d.sections && typeof d.sections === "object");
}
