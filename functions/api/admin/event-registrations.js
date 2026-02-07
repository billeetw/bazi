/**
 * GET /api/admin/event-registrations
 * 後台：活動報名列表（Basic 認證），可選 ?event_slug=213 篩選
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
  return new Response(JSON.stringify({ error: '請登入' }), {
    status: 401,
    headers: { ...JSON_HEADERS, 'WWW-Authenticate': 'Basic realm="Admin"' },
  });
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
    const eventSlug = url.searchParams.get('event_slug');
    const db = env.CONSULT_DB;

    let stmt;
    if (eventSlug && eventSlug.trim()) {
      stmt = db
        .prepare(
          `SELECT id, created_at, event_slug, name, email, phone, bank_last5, tax_id
           FROM event_registrations
           WHERE event_slug = ?
           ORDER BY created_at DESC`
        )
        .bind(eventSlug.trim());
    } else {
      stmt = db.prepare(
        `SELECT id, created_at, event_slug, name, email, phone, bank_last5, tax_id
         FROM event_registrations
         ORDER BY created_at DESC`
      );
    }

    const { results } = await stmt.all();
    const list = (results || []).map((row) => ({
      id: row.id,
      created_at: row.created_at,
      event_slug: row.event_slug,
      name: row.name,
      email: row.email,
      phone: row.phone,
      bank_last5: row.bank_last5,
      tax_id: row.tax_id,
    }));

    return new Response(JSON.stringify({ list }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (err) {
    console.error('Error in GET /api/admin/event-registrations:', err);
    return new Response(JSON.stringify({ error: '讀取失敗' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
