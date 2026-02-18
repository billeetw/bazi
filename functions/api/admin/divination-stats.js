/**
 * GET /api/admin/divination-stats - 占卦使用統計與回饋建議
 * Query: days (7-90), feedback (all|yes|no), rating (all|accurate|inaccurate|pending|suggestion)
 * 需 Basic Auth
 */

import { requireAdmin, jsonResponse } from "../../shared/admin-auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(request.url);
    const days = Math.min(90, Math.max(7, parseInt(url.searchParams.get("days") || "30", 10)));
    const feedback = (url.searchParams.get("feedback") || "all").toLowerCase();
    const rating = (url.searchParams.get("rating") || "all").toLowerCase();

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ error: "資料庫未綁定" }, 500);

    const sinceExpr = "date('now', '-' || ? || ' days')";

    // 日報：每日占卦次數
    const dailyRes = await db
      .prepare(
        `SELECT date(created_at) as d, COUNT(*) as cnt
         FROM divination_logs
         WHERE created_at >= ${sinceExpr}
         GROUP BY d
         ORDER BY d DESC
         LIMIT 90`
      )
      .bind(String(days))
      .all();

    // 總筆數
    const totalRes = await db
      .prepare(`SELECT COUNT(*) as total FROM divination_logs WHERE created_at >= ${sinceExpr}`)
      .bind(String(days))
      .first();

    // 回饋分布
    const ratingRes = await db
      .prepare(
        `SELECT feedback_rating as r, COUNT(*) as cnt
         FROM divination_logs
         WHERE created_at >= ${sinceExpr} AND feedback_rating IS NOT NULL
         GROUP BY feedback_rating
         ORDER BY cnt DESC`
      )
      .bind(String(days))
      .all();

    // 有回饋的筆數
    const withFeedbackRes = await db
      .prepare(
        `SELECT COUNT(*) as n FROM divination_logs
         WHERE created_at >= ${sinceExpr} AND feedback_rating IS NOT NULL`
      )
      .bind(String(days))
      .first();

    // 回饋列表（含建議）
    let conditions = [`created_at >= ${sinceExpr}`];
    if (feedback === "yes") conditions.push("feedback_rating IS NOT NULL");
    else if (feedback === "no") conditions.push("feedback_rating IS NULL");
    if (rating !== "all" && ["accurate", "inaccurate", "pending", "suggestion"].includes(rating)) {
      conditions.push("feedback_rating = ?");
    }
    const whereClause = conditions.join(" AND ");
    const listBindArgs = [String(days)];
    if (rating !== "all") listBindArgs.push(rating);

    const listRes = await db
      .prepare(
        `SELECT id, created_at, user_id, question, mood, primary_index, transformed_index,
                feedback_rating, feedback_text, feedback_at
         FROM divination_logs
         WHERE ${whereClause}
         ORDER BY COALESCE(feedback_at, created_at) DESC
         LIMIT 200`
      )
      .bind(...listBindArgs)
      .all();

    const data = {
      ok: true,
      total: totalRes?.total ?? 0,
      with_feedback: withFeedbackRes?.n ?? 0,
      daily: (dailyRes.results || []).map((r) => ({ date: r.d, count: r.cnt })),
      rating_distribution: (ratingRes.results || []).map((r) => ({
        rating: r.r,
        count: r.cnt,
      })),
      list: (listRes.results || []).map((r) => ({
        id: r.id,
        created_at: r.created_at,
        user_id: r.user_id,
        question: (r.question || "").slice(0, 80),
        mood: r.mood,
        primary_index: r.primary_index,
        feedback_rating: r.feedback_rating,
        feedback_text: r.feedback_text,
        feedback_at: r.feedback_at,
      })),
    };

    return jsonResponse(data);
  } catch (err) {
    console.error("[admin/divination-stats] Error:", err);
    return jsonResponse({ error: err.message || "伺服器錯誤" }, 500);
  }
}
