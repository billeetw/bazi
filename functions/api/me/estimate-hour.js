/**
 * POST /api/me/estimate-hour
 * 送出問卷答案，後端推算時辰、寫入 estimate_hour_logs、回傳結果與 log_id。
 * 需 JWT。
 */

import { getAuthFromRequest } from '../auth/jwt.js';
import { estimateHourFromAnswers } from '../../utils/shichen-logic.js';

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

    const userId = payload.sub;

    // 頻率限制：每日最多 5 次、兩次間隔至少 30 秒；超過回 429 並告知使用上限
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const todayPrefix = today + '%';
    const countRow = await db
      .prepare(
        `SELECT COUNT(*) as count FROM estimate_hour_logs WHERE user_id = ? AND created_at LIKE ?`
      )
      .bind(userId, todayPrefix)
      .first();
    const todayCount = countRow?.count ?? 0;
    if (todayCount >= 5) {
      return jsonResponse(
        {
          error:
            '已達每日使用上限（每日最多 5 次、兩次間隔 30 秒），請明日再試。',
        },
        429
      );
    }

    const lastRow = await db
      .prepare(
        `SELECT created_at FROM estimate_hour_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
      )
      .bind(userId)
      .first();
    if (lastRow?.created_at) {
      const lastAt = new Date(lastRow.created_at).getTime();
      const now = Date.now();
      if ((now - lastAt) / 1000 < 30) {
        return jsonResponse(
          {
            error:
              '請稍後再試（兩次推算需間隔 30 秒；每日最多 5 次）。',
          },
          429
        );
      }
    }

    const recentRows = await db
      .prepare(
        `SELECT estimated_branch FROM estimate_hour_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 3`
      )
      .bind(userId)
      .all();
    const recentPredictions = (recentRows?.results || []).map((r) => ({ bestBranch: r.estimated_branch }));

    const result = estimateHourFromAnswers(answers, { recentPredictions });
    const {
      branch,
      hour_label,
      hour_range,
      half,
      score,
      debug,
      confidence_score,
      uiHint,
      top2Branches,
      bestScore,
      secondScore,
      delta,
      flags,
      contributions,
    } = result;

    const logId = crypto.randomUUID();
    const answersJson = JSON.stringify(answers);
    const userIp = request.headers.get('CF-Connecting-IP') || null;
    const top2BranchesJson = top2Branches?.length ? JSON.stringify(top2Branches) : null;
    const flagsJson = flags ? JSON.stringify(flags) : null;
    const contributionsJson = contributions?.length ? JSON.stringify(contributions) : null;

    try {
      await db
        .prepare(
          `INSERT INTO estimate_hour_logs (
            id, user_id, answers_json, estimated_branch, estimated_half, created_at, user_ip,
            confidence_score, best_score, second_score, delta, top2_branches, flags_json, contributions_json
          ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          logId,
          userId,
          answersJson,
          branch,
          half,
          userIp,
          confidence_score ?? null,
          bestScore ?? null,
          secondScore ?? null,
          delta ?? null,
          top2BranchesJson,
          flagsJson,
          contributionsJson
        )
        .run();
    } catch (insertErr) {
      const msg = String(insertErr?.message || insertErr);
      if (msg.includes('no such column') || msg.includes('confidence_score')) {
        await db
          .prepare(
            `INSERT INTO estimate_hour_logs (id, user_id, answers_json, estimated_branch, estimated_half, created_at, user_ip)
             VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`
          )
          .bind(logId, userId, answersJson, branch, half, userIp)
          .run();
      } else {
        throw insertErr;
      }
    }

    const responseBody = {
      ok: true,
      branch,
      hour_label,
      hour_range,
      half,
      log_id: logId,
    };
    if (score != null) responseBody.score = score;
    if (debug) responseBody.debug = debug;
    if (uiHint) responseBody.uiHint = uiHint;
    return jsonResponse(responseBody, 201);
  } catch (err) {
    console.error('[me/estimate-hour] POST Error:', err);
    return jsonResponse({ error: err.message || '伺服器錯誤' }, 500);
  }
}
