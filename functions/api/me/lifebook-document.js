/**
 * GET  /api/me/lifebook-document — 取得當前使用者已儲存的命書 JSON（登入）
 * PUT  /api/me/lifebook-document — 覆寫儲存（debounce 由前端負責）
 *
 * document 為 LifeBookViewerState 序列化（meta / chart_json / weight_analysis / sections）
 */

import { getAuthFromRequest } from '../auth/jwt.js';

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024; // 5 MiB

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  });
}

function unauthorized() {
  return jsonResponse({ ok: false, error: '未登入或 token 已過期' }, 401);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const payload = await getAuthFromRequest(request, env.JWT_SECRET);
    if (!payload || !payload.sub) return unauthorized();

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ ok: false, error: '資料庫未綁定' }, 500);

    const row = await db
      .prepare('SELECT document_json, updated_at FROM user_lifebook_documents WHERE user_id = ?')
      .bind(payload.sub)
      .first();

    if (!row || !row.document_json) {
      return jsonResponse({ ok: true, document: null, updated_at: null });
    }

    let document;
    try {
      document = JSON.parse(row.document_json);
    } catch {
      return jsonResponse({ ok: true, document: null, updated_at: null });
    }

    return jsonResponse({
      ok: true,
      document,
      updated_at: row.updated_at ?? null,
    });
  } catch (err) {
    console.error('[me/lifebook-document] GET:', err);
    return jsonResponse({ ok: false, error: err.message || '伺服器錯誤' }, 500);
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const payload = await getAuthFromRequest(request, env.JWT_SECRET);
    if (!payload || !payload.sub) return unauthorized();

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ ok: false, error: '資料庫未綁定' }, 500);

    const body = await request.json().catch(() => ({}));
    const document = body?.document;
    if (!document || typeof document !== 'object') {
      return jsonResponse({ ok: false, error: '缺少 document 物件' }, 400);
    }

    const raw = JSON.stringify(document);
    if (raw.length > MAX_DOCUMENT_BYTES) {
      return jsonResponse({ ok: false, error: '命書資料過大' }, 413);
    }

    const userId = payload.sub;
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO user_lifebook_documents (user_id, document_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           document_json = excluded.document_json,
           updated_at = excluded.updated_at`
      )
      .bind(userId, raw, now)
      .run();

    return jsonResponse({ ok: true, updated_at: now });
  } catch (err) {
    console.error('[me/lifebook-document] PUT:', err);
    return jsonResponse({ ok: false, error: err.message || '伺服器錯誤' }, 500);
  }
}
