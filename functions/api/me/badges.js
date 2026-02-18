/**
 * GET /api/me/badges - 登入後取得勳章（含光明燈）
 * Query: year（預設 2026）
 */

import { getAuthFromRequest } from '../auth/jwt.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
    },
  });
}

function unauthorized() {
  return jsonResponse({ error: '未登入或 token 已過期' }, 401);
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const payload = await getAuthFromRequest(request, env.JWT_SECRET);
    if (!payload || !payload.sub) return unauthorized();

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ error: '資料庫未綁定' }, 500);

    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get('year') || '2026', 10);

    const rows = await db
      .prepare(
        `SELECT year, lit_at FROM yearly_lamps WHERE user_id = ? AND year = ? AND lit_at IS NOT NULL`
      )
      .bind(payload.sub, year)
      .all();

    const results = (rows?.results || []).map((r) => ({
      key: `lamp_${r.year}`,
      label: `${r.year} 光明燈`,
      litAt: r.lit_at,
    }));

    return jsonResponse({
      year,
      badges: results,
    });
  } catch (err) {
    console.error('[me/badges] Error:', err);
    return jsonResponse({ error: err.message || '伺服器錯誤' }, 500);
  }
}
