/**
 * GET /api/admin/users - 後台列出登入用戶（需 Basic Auth）
 * 回傳：id, provider, email, name, created_at
 */

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

function parseBasicAuth(request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Basic ')) return null;
  try {
    const base64 = auth.slice(6).trim();
    const decoded = atob(base64);
    const i = decoded.indexOf(':');
    if (i === -1) return null;
    return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
  } catch {
    return null;
  }
}

function unauthorized() {
  return new Response(
    JSON.stringify({ error: '請登入' }),
    { status: 401, headers: { ...JSON_HEADERS, 'WWW-Authenticate': 'Basic realm="Admin"' } }
  );
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const cred = parseBasicAuth(request);
  const adminUser = env.ADMIN_USER;
  const adminPass = env.ADMIN_PASSWORD;

  if (!adminUser || !adminPass) {
    return new Response(
      JSON.stringify({ error: '後台未設定 ADMIN_USER / ADMIN_PASSWORD' }),
      { status: 500, headers: JSON_HEADERS }
    );
  }

  if (!cred || cred.user !== adminUser || cred.pass !== adminPass) {
    return unauthorized();
  }

  try {
    const db = env.CONSULT_DB;
    const { results } = await db
      .prepare(
        `SELECT id, provider, provider_user_id, email, name, created_at
         FROM users
         ORDER BY created_at DESC`
      )
      .all();

    return new Response(
      JSON.stringify({ ok: true, users: results || [] }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (err) {
    console.error('[admin/users] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || '伺服器錯誤' }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
