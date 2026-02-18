/**
 * GET /api/taisui/status - 取得太歲狀態（未登入也可）
 * Query: birthYear, year（預設 2026）
 * 已登入時可省略 birthYear，從 user_charts 取預設命盤出生年
 */

import { getAuthFromRequest } from '../auth/jwt.js';
import { getTaisuiStatus } from '../../utils/taisui.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    let birthYear = parseInt(url.searchParams.get('birthYear') || '', 10);
    const year = parseInt(url.searchParams.get('year') || '2026', 10);

    if (!birthYear || isNaN(birthYear)) {
      const payload = await getAuthFromRequest(request, env.JWT_SECRET);
      if (payload?.sub && env.CONSULT_DB) {
        const row = await env.CONSULT_DB
          .prepare(
            `SELECT birth_date FROM user_charts WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC LIMIT 1`
          )
          .bind(payload.sub)
          .first();
        if (row?.birth_date) {
          birthYear = parseInt(String(row.birth_date).slice(0, 4), 10);
        }
      }
    }

    if (!birthYear || isNaN(birthYear) || birthYear < 1900 || birthYear > 2100) {
      return jsonResponse({ error: '請提供 birthYear（出生年）或登入後使用預設命盤' }, 400);
    }

    const status = getTaisuiStatus({ birthYear, year });
    return jsonResponse(status);
  } catch (err) {
    console.error('[taisui/status] Error:', err);
    return jsonResponse({ error: err.message || '伺服器錯誤' }, 500);
  }
}
