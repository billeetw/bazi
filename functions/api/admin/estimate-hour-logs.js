/**
 * GET /api/admin/estimate-hour-logs - 後台列出推算時辰紀錄與回饋（需 Basic Auth）
 * Query: from, to, feedback (all|yes|no), correct (all|1|0), page, pageSize
 */

import { requireAdmin, jsonResponse } from "../../shared/admin-auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(request.url);
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';
    const feedback = (url.searchParams.get('feedback') || 'all').toLowerCase();
    const correct = url.searchParams.get('correct') || 'all';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '50', 10)));
    const offset = (page - 1) * pageSize;

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ error: "資料庫未綁定" }, 500);

    const conditions = [];
    const bindings = [];

    if (from) {
      conditions.push("l.created_at >= ?");
      bindings.push(from);
    }
    if (to) {
      conditions.push("l.created_at <= ?");
      bindings.push(to);
    }
    if (feedback === 'yes') {
      conditions.push("l.feedback_correct IS NOT NULL");
    } else if (feedback === 'no') {
      conditions.push("l.feedback_correct IS NULL");
    }
    if (correct === '1') {
      conditions.push("l.feedback_correct = 1");
    } else if (correct === '0') {
      conditions.push("l.feedback_correct = 0");
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countStmt = db.prepare(
      `SELECT COUNT(*) as n FROM estimate_hour_logs l ${whereClause}`
    );
    const countRow = conditions.length
      ? await countStmt.bind(...bindings).first()
      : await countStmt.first();
    const total = countRow?.n ?? 0;

    const selectBindings = conditions.length ? [...bindings, pageSize, offset] : [pageSize, offset];
    const orderLimit = 'ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    const selectStmt = db.prepare(
      `SELECT l.id, l.user_id, l.answers_json, l.estimated_branch, l.estimated_half, l.created_at,
              l.feedback_correct, l.feedback_actual_branch, l.feedback_actual_half, l.feedback_at,
              l.user_ip,
              u.email as user_email, u.name as user_name
       FROM estimate_hour_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${whereClause}
       ${orderLimit}`
    );
    const { results } = await selectStmt.bind(...selectBindings).all();

    const logs = (results || []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_email: row.user_email || null,
      user_name: row.user_name || null,
      user_ip: row.user_ip || null,
      answers_json: row.answers_json,
      estimated_branch: row.estimated_branch,
      estimated_half: row.estimated_half,
      created_at: row.created_at,
      feedback_correct: row.feedback_correct,
      feedback_actual_branch: row.feedback_actual_branch || null,
      feedback_actual_half: row.feedback_actual_half || null,
      feedback_at: row.feedback_at || null,
    }));

    return jsonResponse({ ok: true, logs, total });
  } catch (err) {
    console.error('[admin/estimate-hour-logs] Error:', err);
    return jsonResponse({ error: err.message || "伺服器錯誤" }, 500);
  }
}
