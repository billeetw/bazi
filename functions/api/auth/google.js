/**
 * POST /api/auth/google
 * Body: { code, redirect_uri? }
 * 用 Google authorization code 換 token → 取 user info → 查/建 users → 回傳 JWT
 */

import { sign } from './jwt.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const CONSULT_DB = env.CONSULT_DB;
    const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
    const JWT_SECRET = env.JWT_SECRET;

    if (!CONSULT_DB || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !JWT_SECRET) {
      return jsonResponse(
        { error: '伺服器未設定 OAuth 或 JWT' },
        500
      );
    }

    const body = await request.json().catch(() => ({}));
    const code = body?.code;
    if (!code || typeof code !== 'string') {
      return jsonResponse({ error: '缺少 code' }, 400);
    }

    const url = new URL(request.url);
    let redirectUri = (body.redirect_uri || url.origin || '').trim().replace(/\/$/, '') || url.origin;
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[auth/google] Token exchange failed:', tokenRes.status, redirectUri, errText);
      let errMsg = 'Google 登入失敗（code 無效或已過期）';
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error === 'invalid_client') errMsg = 'Google 登入失敗：用戶端 ID 或密鑰錯誤，或正式機未設定正確的 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET';
        else if (errJson.error === 'invalid_grant') errMsg = 'Google 登入失敗：授權碼無效或已過期，或 redirect_uri 與 Google Console 設定不一致（請確認「已授權的重新導向 URI」含目前網址）';
        else if (errJson.error_description) errMsg = 'Google 登入失敗：' + errJson.error_description;
      } catch (_) {}
      return jsonResponse({ error: errMsg }, 400);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return jsonResponse({ error: 'Google 登入失敗' }, 400);
    }

    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
      console.error('[auth/google] Userinfo failed:', userRes.status);
      return jsonResponse({ error: '無法取得 Google 帳號資訊' }, 400);
    }

    const userInfo = await userRes.json();
    const provider = 'google';
    const providerUserId = String(userInfo.id || '');
    const email = userInfo.email || null;
    const name = userInfo.name || userInfo.email || '使用者';

    if (!providerUserId) {
      return jsonResponse({ error: 'Google 帳號資訊不完整' }, 400);
    }

    const db = CONSULT_DB;
    const now = new Date().toISOString();

    let row = await db
      .prepare(
        'SELECT id, email, name FROM users WHERE provider = ? AND provider_user_id = ?'
      )
      .bind(provider, providerUserId)
      .first();

    if (!row) {
      const userId = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO users (id, provider, provider_user_id, email, name, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(userId, provider, providerUserId, email, name, now)
        .run();
      row = { id: userId, email, name };
    }

    const userId = row.id;
    const token = await sign(
      { sub: userId, email: row.email, name: row.name },
      JWT_SECRET
    );

    return jsonResponse({
      ok: true,
      token,
      user: {
        id: userId,
        email: row.email ?? email,
        name: row.name ?? name,
      },
    });
  } catch (err) {
    console.error('[auth/google] Error:', err);
    return jsonResponse(
      { error: err.message || '登入失敗' },
      500
    );
  }
}
