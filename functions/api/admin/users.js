/**
 * GET /api/admin/users - 後台列出登入用戶（需 Basic Auth）
 * 回傳：id, provider, email, name, created_at
 */

import { requireAdmin, jsonResponse } from "../../shared/admin-auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const db = env.CONSULT_DB;
    const { results } = await db
      .prepare(
        `SELECT id, provider, provider_user_id, email, name, created_at
         FROM users
         ORDER BY created_at DESC`
      )
      .all();

    return jsonResponse({ ok: true, users: results || [] });
  } catch (err) {
    console.error('[admin/users] Error:', err);
    return jsonResponse({ error: err.message || "伺服器錯誤" }, 500);
  }
}
