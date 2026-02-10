/**
 * POST /api/me/estimate-hour
 * 送出問卷答案，後端推算時辰、寫入 estimate_hour_logs、回傳結果與 log_id。
 * 需 JWT。
 */

import { getAuthFromRequest } from '../auth/jwt.js';
import { estimateHourFromAnswers } from './shichen-logic.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function unauthorized() {
  return jsonResponse({ error: '未登入或 token 已過期' }, 401);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const payload = await getAuthFromRequest(request, env.JWT_SECRET);
    if (!payload || !payload.sub) return unauthorized();

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ error: '資料庫未綁定' }, 500);

    const body = await request.json().catch(() => ({}));
    const answers = body?.answers;
    if (!answers || typeof answers !== 'object') {
      return jsonResponse({ error: '缺少 answers（問卷答案物件）' }, 400);
    }

    const result = estimateHourFromAnswers(answers);
    const { branch, hour_label, hour_range, half } = result;

    const logId = crypto.randomUUID();
    const answersJson = JSON.stringify(answers);
    const userId = payload.sub;

    await db
      .prepare(
        `INSERT INTO estimate_hour_logs (id, user_id, answers_json, estimated_branch, estimated_half, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(logId, userId, answersJson, branch, half)
      .run();

    return jsonResponse({
      ok: true,
      branch,
      hour_label,
      hour_range,
      half,
      log_id: logId,
    }, 201);
  } catch (err) {
    console.error('[me/estimate-hour] POST Error:', err);
    return jsonResponse({ error: err.message || '伺服器錯誤' }, 500);
  }
}
