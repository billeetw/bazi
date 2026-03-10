/**
 * POST /api/taisui/lamp - 點光明燈（必須登入）
 * Body: { year: 2026 }
 * 每人每年最多一筆，重複點燈回傳既有資料
 */

import { getAuthFromRequest } from '../auth/jwt.js';
import { getTaisuiStatus, getGuardianPhrase } from '../../utils/taisui.js';

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

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const payload = await getAuthFromRequest(request, env.JWT_SECRET);
    if (!payload || !payload.sub) return unauthorized();

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ error: '資料庫未綁定' }, 500);

    const body = await request.json().catch(() => ({}));
    const year = parseInt(body?.year || '2026', 10);
    if (isNaN(year) || year < 1984 || year > 2100) {
      return jsonResponse({ error: '請提供有效 year（如 2026）' }, 400);
    }

    const userId = payload.sub;

    // 取得使用者出生年（從預設命盤）
    const chartRow = await db
      .prepare(
        `SELECT birth_date FROM user_charts WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC LIMIT 1`
      )
      .bind(userId)
      .first();

    const birthDate = chartRow?.birth_date ? String(chartRow.birth_date).trim() : '';
    const birthYear = birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
      ? parseInt(birthDate.slice(0, 4), 10)
      : (birthDate ? parseInt(String(birthDate).slice(0, 4), 10) : null);
    if (!birthYear || isNaN(birthYear)) {
      return jsonResponse({ error: '請先建立命盤資料' }, 400);
    }

    const status = getTaisuiStatus({ birthYear, birthDate: /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? birthDate : undefined, year });
    const flowBranch = status.flowBranch;
    const userBranch = status.userBranch;
    const statusType = status.type;
    const guardianPhrase = getGuardianPhrase(statusType);

    // 查是否已點過
    const existing = await db
      .prepare(`SELECT guardian_phrase, image_url, lit_at FROM yearly_lamps WHERE user_id = ? AND year = ?`)
      .bind(userId, year)
      .first();

    if (existing) {
      return jsonResponse({
        year,
        lit: true,
        guardianPhrase: existing.guardian_phrase,
        imageUrl: existing.image_url || null,
        flowStemBranch: status.flowStemBranch,
        zodiac: status.zodiac,
        badge: { key: `lamp_${year}`, label: `${year} 光明燈` },
      });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO yearly_lamps (id, user_id, year, flow_branch, user_branch, status_type, guardian_phrase, image_url, lit_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, userId, year, flowBranch, userBranch, statusType, guardianPhrase, null, now, now, now)
      .run();

    return jsonResponse({
      year,
      lit: true,
      guardianPhrase,
      imageUrl: null,
      flowStemBranch: status.flowStemBranch,
      zodiac: status.zodiac,
      badge: { key: `lamp_${year}`, label: `${year} 光明燈` },
    });
  } catch (err) {
    console.error('[taisui/lamp] Error:', err);
    return jsonResponse({ error: err.message || '伺服器錯誤' }, 500);
  }
}
