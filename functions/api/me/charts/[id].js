/**
 * DELETE /api/me/charts/:id - 刪除一筆命盤（僅限本人）
 */

import { getAuthFromRequest } from '../../auth/jwt.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function unauthorized() {
  return jsonResponse({ error: '未登入或 token 已過期' }, 401);
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;

  try {
    const payload = await getAuthFromRequest(request, env.JWT_SECRET);
    if (!payload || !payload.sub) return unauthorized();

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ error: '資料庫未綁定' }, 500);

    const id = params?.id;
    if (!id) return jsonResponse({ error: '缺少 id' }, 400);

    const userId = payload.sub;

    const row = await db
      .prepare('SELECT id FROM user_charts WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first();

    if (!row) {
      return jsonResponse({ error: '找不到該命盤或無權限' }, 404);
    }

    await db
      .prepare('DELETE FROM user_charts WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run();

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('[me/charts/:id] DELETE Error:', err);
    return jsonResponse({ error: err.message || '伺服器錯誤' }, 500);
  }
}
