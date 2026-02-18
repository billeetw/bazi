/**
 * GET /api/admin/usage-stats - 使用統計（日報、年齡分布、性別比、語言）
 * 需 Basic Auth，資料來源 usage_logs 表
 */

import { requireAdmin, jsonResponse } from "../../shared/admin-auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(request.url);
    const days = Math.min(90, Math.max(7, parseInt(url.searchParams.get('days') || '30', 10)));

    const db = env.CONSULT_DB;
    if (!db) {
    return jsonResponse({ error: "資料庫未綁定" }, 500);
    }

    // 日報：每日使用次數
    const dailyRes = await db
      .prepare(
        `SELECT date(created_at) as d, COUNT(*) as cnt
         FROM usage_logs
         WHERE created_at >= date('now', '-' || ? || ' days')
         GROUP BY d
         ORDER BY d DESC
         LIMIT 90`
      )
      .bind(String(days))
      .all();

    // 年齡區間分布
    const ageRes = await db
      .prepare(
        `SELECT
           CASE
             WHEN birth_year IS NULL THEN 'unknown'
             WHEN birth_year >= 2010 THEN '2010s'
             WHEN birth_year >= 2000 THEN '2000s'
             WHEN birth_year >= 1990 THEN '1990s'
             WHEN birth_year >= 1980 THEN '1980s'
             WHEN birth_year >= 1970 THEN '1970s'
             ELSE 'pre-1970'
           END as age_band,
           COUNT(*) as cnt
         FROM usage_logs
         GROUP BY age_band
         ORDER BY cnt DESC`
      )
      .all();

    // 性別比
    const genderRes = await db
      .prepare(
        `SELECT COALESCE(NULLIF(TRIM(gender), ''), 'unknown') as g, COUNT(*) as cnt
         FROM usage_logs
         GROUP BY g
         ORDER BY cnt DESC`
      )
      .all();

    // 語言分布
    const langRes = await db
      .prepare(
        `SELECT COALESCE(NULLIF(TRIM(language), ''), 'unknown') as lang, COUNT(*) as cnt
         FROM usage_logs
         GROUP BY lang
         ORDER BY cnt DESC`
      )
      .all();

    // 總筆數
    const totalRes = await db
      .prepare('SELECT COUNT(*) as total FROM usage_logs')
      .first();

    const data = {
      ok: true,
      total: totalRes?.total ?? 0,
      daily: (dailyRes.results || []).map((r) => ({ date: r.d, count: r.cnt })),
      age_distribution: (ageRes.results || []).map((r) => ({ age_band: r.age_band, count: r.cnt })),
      gender_ratio: (genderRes.results || []).map((r) => ({ gender: r.g, count: r.cnt })),
      language_distribution: (langRes.results || []).map((r) => ({ language: r.lang, count: r.cnt })),
    };

    return jsonResponse(data);
  } catch (err) {
    console.error('[admin/usage-stats] Error:', err);
    return jsonResponse({ error: err.message || "伺服器錯誤" }, 500);
  }
}
