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
    const url = new URL(request.url);
    const eventSlug = url.searchParams.get('event_slug'); // 選填：篩選活動 ID

    const db = env.CONSULT_DB;
    let stmt;
    let bind = [];
    if (eventSlug && String(eventSlug).trim()) {
      stmt = db.prepare(
        `SELECT id, created_at, event_slug, name, email, phone, bank_last5, tax_id
         FROM event_registrations
         WHERE event_slug = ?
         ORDER BY created_at DESC`
      );
      bind = [String(eventSlug).trim()];
    } else {
      stmt = db.prepare(
        `SELECT id, created_at, event_slug, name, email, phone, bank_last5, tax_id
         FROM event_registrations
         ORDER BY created_at DESC`
      );
    }

    const { results } = bind.length ? await stmt.bind(...bind).all() : await stmt.all();

    return new Response(JSON.stringify({ list: results || [] }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (err) {
    console.error('Error in GET /api/admin/event-registrations:', err);
    return new Response(JSON.stringify({ error: '讀取失敗（可能尚未執行 event_registrations 的 migration）' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
