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
    const url = new URL(request.url);
    const activityIdFilter = url.searchParams.get('activity_id') || '';

    const baseCols = 'id, created_at, name, email, phone, tax_id, birth_info, topics, topic_extra, bank_last5, payment_method, payment_status, source';
    let results;
    try {
      let stmt;
      if (!activityIdFilter) {
        stmt = db.prepare(
          `SELECT ${baseCols}, activity_id FROM consultations ORDER BY created_at DESC`
        );
      } else if (activityIdFilter === 'consultation') {
        stmt = db.prepare(
          `SELECT ${baseCols}, activity_id FROM consultations
           WHERE (activity_id IS NULL OR activity_id = '' OR activity_id = 'consultation')
           ORDER BY created_at DESC`
        );
      } else if (activityIdFilter === 'activity-213') {
        stmt = db.prepare(
          `SELECT ${baseCols}, activity_id FROM consultations
           WHERE activity_id = 'activity-213'
              OR (activity_id IS NULL AND (
                source = 'activity-213-page' OR source LIKE '%213%' OR source LIKE '%activity-213%'
                OR topics LIKE '%2/13%' OR topics LIKE '%聚會%'
              ))
           ORDER BY created_at DESC`
        );
      } else {
        stmt = db.prepare(
          `SELECT ${baseCols}, activity_id FROM consultations WHERE activity_id = ? ORDER BY created_at DESC`
        ).bind(activityIdFilter);
      }
      const out = await stmt.all();
      results = out.results || [];
    } catch (colErr) {
      const stmtFallback = db.prepare(
        `SELECT ${baseCols} FROM consultations ORDER BY created_at DESC`
      );
      const out = await stmtFallback.all();
      results = (out.results || []).map((r) => {
        const src = r.source || '';
        const top = r.topics || '';
        const is213 = src === 'activity-213-page' || src.indexOf('213') >= 0 || top.indexOf('2/13') >= 0 || top.indexOf('聚會') >= 0;
        return { ...r, activity_id: is213 ? 'activity-213' : null };
      });
      if (activityIdFilter === 'consultation') {
        results = results.filter((r) => !r.activity_id || r.activity_id === 'consultation');
      } else if (activityIdFilter === 'activity-213') {
        results = results.filter((r) => r.activity_id === 'activity-213');
      } else if (activityIdFilter) {
        results = [];
      }
    }

    return new Response(JSON.stringify({ list: results || [] }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (err) {
    console.error('Error in GET /api/admin/consultations:', err);
    return new Response(JSON.stringify({ error: '讀取失敗' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
