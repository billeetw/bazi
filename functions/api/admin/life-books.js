/**
 * GET /api/admin/life-books - 列出命書
 * POST /api/admin/life-books - 儲存命書
 */

import { requireAdmin, jsonResponse } from "../../shared/admin-auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const db = env.CONSULT_DB;
    if (!db) {
      return jsonResponse({ error: '資料庫未綁定' }, 500);
    }

    const url = new URL(request.url);
    const consultationId = url.searchParams.get('consultation_id');
    const q = url.searchParams.get('q') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 100);

    let stmt;
    if (consultationId) {
      stmt = db.prepare(
        `SELECT id, created_at, consultation_id, user_id, email, client_name, birth_info
         FROM life_books WHERE consultation_id = ? ORDER BY created_at DESC LIMIT ?`
      ).bind(consultationId, limit);
    } else if (q.trim()) {
      const pattern = '%' + q.trim() + '%';
      stmt = db.prepare(
        `SELECT id, created_at, consultation_id, user_id, email, client_name, birth_info
         FROM life_books WHERE birth_info LIKE ? OR email LIKE ? OR id LIKE ? OR client_name LIKE ?
         ORDER BY created_at DESC LIMIT ?`
      ).bind(pattern, pattern, pattern, pattern, limit);
    } else {
      stmt = db.prepare(
        `SELECT id, created_at, consultation_id, user_id, email, client_name, birth_info
         FROM life_books ORDER BY created_at DESC LIMIT ?`
      ).bind(limit);
    }

    const { results } = await stmt.all();
    return jsonResponse({ list: results || [] });
  } catch (err) {
    console.error('Error in GET /api/admin/life-books:', err);
    return jsonResponse({ error: '讀取失敗', details: err?.message || String(err) }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const db = env.CONSULT_DB;
    if (!db) {
      return jsonResponse({ error: '資料庫未綁定' }, 500);
    }

    const body = await request.json().catch(() => ({}));
    const { consultation_id, user_id, email, client_name, birth_info, sections_json, html_content, document_json } = body;

    if (!birth_info || typeof birth_info !== 'string') {
      return jsonResponse({ error: '缺少 birth_info' }, 400);
    }
    if (!sections_json || typeof sections_json !== 'string') {
      return jsonResponse({ error: '缺少 sections_json' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const docJson = (typeof document_json === 'string' ? document_json : (document_json != null ? JSON.stringify(document_json) : null)) || null;

    await db
      .prepare(
        `INSERT INTO life_books (id, created_at, consultation_id, user_id, email, client_name, birth_info, sections_json, html_content, document_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        now,
        consultation_id || null,
        user_id || null,
        email || null,
        (typeof client_name === 'string' ? client_name.trim() : null) || null,
        birth_info,
        sections_json,
        html_content || null,
        docJson
      )
      .run();

    return jsonResponse({ ok: true, id, created_at: now });
  } catch (err) {
    console.error('Error in POST /api/admin/life-books:', err);
    return jsonResponse({ error: '儲存失敗', details: err?.message || String(err) }, 500);
  }
}
