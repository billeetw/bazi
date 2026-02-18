/**
 * GET /api/admin/estimate-hour-stats - 異常監控統計（需 Basic Auth）
 * 回傳：last_24h_by_user（Top 10）、last_1h_by_user、anomaly_user_ids（24h 或 1h 內 count > 10）
 * 若有 env.CACHE 則先讀 KV，無或過期再查 D1 並寫入（TTL 3600）。
 */

import { requireAdmin, jsonResponse } from "../../shared/admin-auth.js";

async function fetchStatsFromDb(db) {
  const last24h = await db
    .prepare(
      `SELECT l.user_id, u.email as user_email, COUNT(*) as count
       FROM estimate_hour_logs l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE l.created_at >= datetime('now', '-24 hours')
       GROUP BY l.user_id
       ORDER BY count DESC
       LIMIT 10`
    )
    .all();

  const last1h = await db
    .prepare(
      `SELECT l.user_id, u.email as user_email, COUNT(*) as count
       FROM estimate_hour_logs l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE l.created_at >= datetime('now', '-1 hour')
       GROUP BY l.user_id
       ORDER BY count DESC`
    )
    .all();

  const all24h = await db
    .prepare(
      `SELECT user_id, COUNT(*) as count
       FROM estimate_hour_logs
       WHERE created_at >= datetime('now', '-24 hours')
       GROUP BY user_id`
    )
    .all();

  const all1h = await db
    .prepare(
      `SELECT user_id, COUNT(*) as count
       FROM estimate_hour_logs
       WHERE created_at >= datetime('now', '-1 hour')
       GROUP BY user_id`
    )
    .all();

  const anomalySet = new Set();
  (all24h.results || []).forEach((r) => { if (r.count > 10) anomalySet.add(r.user_id); });
  (all1h.results || []).forEach((r) => { if (r.count > 10) anomalySet.add(r.user_id); });

  let last_24h_by_ip = [];
  try {
    const byIp = await db
      .prepare(
        `SELECT user_ip as ip, COUNT(*) as request_count, COUNT(DISTINCT user_id) as user_count
         FROM estimate_hour_logs
         WHERE created_at >= datetime('now', '-24 hours') AND user_ip IS NOT NULL AND user_ip != ''
         GROUP BY user_ip
         ORDER BY request_count DESC
         LIMIT 20`
      )
      .all();
    last_24h_by_ip = (byIp.results || []).map((r) => ({
      ip: r.ip,
      request_count: r.request_count,
      user_count: r.user_count,
    }));
  } catch (e) {
    console.warn('[admin/estimate-hour-stats] last_24h_by_ip query failed (e.g. user_ip column missing):', e.message);
  }

  const data = {
    last_24h_by_user: (last24h.results || []).map((r) => ({
      user_id: r.user_id,
      user_email: r.user_email || null,
      count: r.count,
    })),
    last_1h_by_user: (last1h.results || []).map((r) => ({
      user_id: r.user_id,
      user_email: r.user_email || null,
      count: r.count,
    })),
    anomaly_user_ids: Array.from(anomalySet),
    last_24h_by_ip,
  };
  return data;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const CACHE_KEY = 'estimate_hour_stats';
    const CACHE_TTL = 3600;

    if (env.CACHE) {
      const cached = await env.CACHE.get(CACHE_KEY);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data.last_24h_by_user && data.anomaly_user_ids) {
            return jsonResponse({ ok: true, last_24h_by_ip: data.last_24h_by_ip || [], ...data });
          }
        } catch (_) {}
      }
    }

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ error: "資料庫未綁定" }, 500);

    const data = await fetchStatsFromDb(db);

    if (env.CACHE) {
      try {
        await env.CACHE.put(CACHE_KEY, JSON.stringify(data), { expirationTtl: CACHE_TTL });
      } catch (e) {
        console.warn('[admin/estimate-hour-stats] KV put failed:', e);
      }
    }

    return jsonResponse({ ok: true, ...data });
  } catch (err) {
    console.error('[admin/estimate-hour-stats] Error:', err);
    return jsonResponse({ error: err.message || "伺服器錯誤" }, 500);
  }
}
