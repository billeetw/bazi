/**
 * GET /api/admin/life-books/:id - 取得單一命書
 */

import { requireAdmin, jsonResponse } from "../../../shared/admin-auth.js";

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const id = params?.id;
  if (!id) {
    return jsonResponse({ error: '缺少 id' }, 400);
  }

  try {
    const db = env.CONSULT_DB;
    if (!db) {
      return jsonResponse({ error: '資料庫未綁定' }, 500);
    }

    const row = await db
      .prepare(
        `SELECT id, created_at, consultation_id, user_id, email, client_name, birth_info, sections_json, html_content, document_json
         FROM life_books WHERE id = ?`
      )
      .bind(id)
      .first();

    if (!row) {
      return jsonResponse({ error: '找不到命書' }, 404);
    }

    return jsonResponse(row);
  } catch (err) {
    console.error('Error in GET /api/admin/life-books/:id:', err);
    return jsonResponse({ error: '讀取失敗', details: err?.message || String(err) }, 500);
  }
}
