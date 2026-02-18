/**
 * GET /api/me/divinations - 列出當前使用者的占卦紀錄（最多 20 筆）
 */

import { getAuthFromRequest } from '../auth/jwt.js';

const MAX_DIVINATIONS_PER_USER = 20;

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
    const payload = await getAuthFromRequest(request, env.JWT_SECRET);
    if (!payload || !payload.sub) {
      return unauthorized();
    }

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ error: '資料庫未綁定' }, 500);

    const rows = await db
      .prepare(
        `SELECT id, created_at, question, mood, primary_index, transformed_index, mutual_index, lines_json, changing_lines_json, feedback_rating, feedback_text, feedback_at
         FROM divination_logs
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .bind(payload.sub, MAX_DIVINATIONS_PER_USER)
      .all();

    const results = (rows.results || []).map((r) => {
      let lines = [];
      let changingLines = [];
      try {
        if (r.lines_json) lines = JSON.parse(r.lines_json);
        if (r.changing_lines_json) changingLines = JSON.parse(r.changing_lines_json);
      } catch (_) {}
      return {
        id: r.id,
        created_at: r.created_at,
        question: r.question || '',
        mood: r.mood,
        primary_index: r.primary_index,
        transformed_index: r.transformed_index,
        mutual_index: r.mutual_index,
        lines,
        changing_lines: changingLines,
        feedback_rating: r.feedback_rating || null,
        feedback_text: r.feedback_text || null,
        feedback_at: r.feedback_at || null,
      };
    });

    return jsonResponse({ ok: true, divinations: results });
  } catch (err) {
    console.error('[me/divinations] GET Error:', err);
    return jsonResponse({ error: err.message || '伺服器錯誤' }, 500);
  }
}
