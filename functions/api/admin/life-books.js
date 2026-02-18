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
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 100);

    let stmt;
    if (consultationId) {
      stmt = db.prepare(
        `SELECT id, created_at, consultation_id, user_id, email, birth_info
         FROM life_books WHERE consultation_id = ? ORDER BY created_at DESC LIMIT ?`
      ).bind(consultationId, limit);
    } else {
      stmt = db.prepare(
        `SELECT id, created_at, consultation_id, user_id, email, birth_info
         FROM life_books ORDER BY created_at DESC LIMIT ?`
      ).bind(limit);
    }

    const { results } = await stmt.all();
    return jsonResponse({ list: results || [] });
  } catch (err) {
    console.error('Error in GET /api/admin/life-books:', err);
    return jsonResponse({ error: '讀取失敗' }, 500);
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
    const { consultation_id, user_id, email, birth_info, sections_json, html_content } = body;

    if (!birth_info || typeof birth_info !== 'string') {
      return jsonResponse({ error: '缺少 birth_info' }, 400);
    }
    if (!sections_json || typeof sections_json !== 'string') {
      return jsonResponse({ error: '缺少 sections_json' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO life_books (id, created_at, consultation_id, user_id, email, birth_info, sections_json, html_content)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        now,
        consultation_id || null,
        user_id || null,
        email || null,
        birth_info,
        sections_json,
        html_content || null
      )
      .run();

    return jsonResponse({ ok: true, id, created_at: now });
  } catch (err) {
    console.error('Error in POST /api/admin/life-books:', err);
    return jsonResponse({ error: '儲存失敗' }, 500);
  }
}
