export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env || !env.CONSULT_DB) {
      return new Response(
        JSON.stringify({ error: '資料庫未綁定（缺少 CONSULT_DB）' }),
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const data = await request.json();

    const {
      eventSlug,
      name,
      email,
      phone,
      bankLast5,
      taxId,
    } = data || {};

    if (!eventSlug || !name || !email || !phone || !bankLast5) {
      return new Response(
        JSON.stringify({ error: '缺少必填欄位（活動代碼、姓名、Email、電話、轉帳後五碼）' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    if (!email.includes('@')) {
      return new Response(
        JSON.stringify({ error: '電子郵件格式有誤' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const bankLast5Trim = String(bankLast5).trim();
    if (bankLast5Trim.length !== 5 || !/^\d{5}$/.test(bankLast5Trim)) {
      return new Response(
        JSON.stringify({ error: '轉帳帳號後五碼須為五位數字' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const db = env.CONSULT_DB;

    await db
      .prepare(`
        INSERT INTO event_registrations (
          id, created_at, event_slug, name, email, phone, bank_last5, tax_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        now,
        String(eventSlug).trim(),
        String(name).trim(),
        String(email).trim(),
        String(phone).trim(),
        bankLast5Trim,
        taxId ? String(taxId).trim() : null
      )
      .run();

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (err) {
    console.error('Error in /api/event-registration:', err);
    return new Response(JSON.stringify({ error: '伺服器發生錯誤（可能尚未建立資料表，請執行 D1 migrations）' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}
