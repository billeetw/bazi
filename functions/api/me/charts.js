/**
 * GET /api/me/charts - 列出當前使用者的命盤（最多 5 筆）
 * POST /api/me/charts - 新增一筆命盤（需 JWT，每人最多 5 筆）
 */

import { getAuthFromRequest } from '../auth/jwt.js';

const MAX_CHARTS_PER_USER = 5;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function unauthorized() {
  return jsonResponse({ error: '未登入或 token 已過期' }, 401);
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const hasAuth = !!request.headers.get('Authorization');
    const hasSecret = !!env.JWT_SECRET;
    const payload = await getAuthFromRequest(request, env.JWT_SECRET);
    if (!payload || !payload.sub) {
      if (!payload) console.warn('[me/charts] GET 401: hasAuth=', hasAuth, 'hasSecret=', hasSecret);
      return unauthorized();
    }

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ error: '資料庫未綁定' }, 500);

    const rows = await db
      .prepare(
        `SELECT id, label, birth_date, birth_time, gender, sort_order, created_at
         FROM user_charts
         WHERE user_id = ?
         ORDER BY sort_order ASC, created_at ASC`
      )
      .bind(payload.sub)
      .all();

    return jsonResponse({ ok: true, charts: rows.results || [] });
  } catch (err) {
    console.error('[me/charts] GET Error:', err);
    return jsonResponse({ error: err.message || '伺服器錯誤' }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const hasAuth = !!request.headers.get('Authorization');
    const hasSecret = !!env.JWT_SECRET;
    const payload = await getAuthFromRequest(request, env.JWT_SECRET);
    if (!payload || !payload.sub) {
      if (!payload) console.warn('[me/charts] POST 401: hasAuth=', hasAuth, 'hasSecret=', hasSecret);
      return unauthorized();
    }

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ error: '資料庫未綁定' }, 500);

    const body = await request.json().catch(() => ({}));
    const label = (body?.label ?? '').toString().trim();
    const birthDate = (body?.birth_date ?? '').toString().trim();
    const birthTime = (body?.birth_time ?? '').toString().trim();
    const gender = (body?.gender ?? '').toString().trim();

    if (!label) return jsonResponse({ error: '缺少 label' }, 400);
    if (!birthDate) return jsonResponse({ error: '缺少 birth_date（YYYY-MM-DD）' }, 400);
    if (!birthTime) return jsonResponse({ error: '缺少 birth_time' }, 400);
    if (!gender) return jsonResponse({ error: '缺少 gender（M 或 F）' }, 400);

    const userId = payload.sub;

    const countRow = await db
      .prepare('SELECT COUNT(*) as n FROM user_charts WHERE user_id = ?')
      .bind(userId)
      .first();

    if ((countRow?.n ?? 0) >= MAX_CHARTS_PER_USER) {
      return jsonResponse(
        { error: 'MAX_CHARTS', message: '已達 5 筆上限，請先刪除舊的命盤' },
        400
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const sortRow = await db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM user_charts WHERE user_id = ?')
      .bind(userId)
      .first();
    const sortOrder = sortRow?.next_order ?? 0;

    await db
      .prepare(
        `INSERT INTO user_charts (id, user_id, label, birth_date, birth_time, gender, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, userId, label, birthDate, birthTime, gender, sortOrder, now)
      .run();

    return jsonResponse(
      {
        ok: true,
        chart: {
          id,
          label,
          birth_date: birthDate,
          birth_time: birthTime,
          gender,
          sort_order: sortOrder,
          created_at: now,
        },
      },
      201
    );
  } catch (err) {
    console.error('[me/charts] POST Error:', err);
    return jsonResponse({ error: err.message || '伺服器錯誤' }, 500);
  }
}
