/**
 * POST /api/event-registration
 * 活動報名（2/13 等）提交
 */

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (!env?.CONSULT_DB) {
      return new Response(
        JSON.stringify({ error: '資料庫未綁定（缺少 CONSULT_DB）' }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const data = await request.json().catch(() => ({}));
    const {
      eventSlug = '213',
      name = '',
      email = '',
      phone = '',
      bankLast5 = '',
      taxId = null,
    } = data;

    const nameTrim = String(name).trim();
    const emailTrim = String(email).trim();
    const phoneTrim = String(phone).trim();
    const bankTrim = String(bankLast5).trim();

    if (!emailTrim) {
      return new Response(
        JSON.stringify({ error: '請填寫電子郵件' }),
        { status: 400, headers: JSON_HEADERS }
      );
    }
    if (!emailTrim.includes('@')) {
      return new Response(
        JSON.stringify({ error: '請填寫正確的 Email 格式' }),
        { status: 400, headers: JSON_HEADERS }
      );
    }
    if (!nameTrim) {
      return new Response(
        JSON.stringify({ error: '請填寫姓名' }),
        { status: 400, headers: JSON_HEADERS }
      );
    }
    if (!phoneTrim) {
      return new Response(
        JSON.stringify({ error: '請填寫電話' }),
        { status: 400, headers: JSON_HEADERS }
      );
    }
    if (bankTrim.length !== 5 || !/^\d{5}$/.test(bankTrim)) {
      return new Response(
        JSON.stringify({ error: '請填寫轉帳帳號後五碼（五位數字）' }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const slug = String(eventSlug).trim() || '213';
    const taxIdVal = taxId != null && String(taxId).trim() !== '' ? String(taxId).trim() : null;

    await env.CONSULT_DB.prepare(
      `INSERT INTO event_registrations (id, created_at, event_slug, name, email, phone, bank_last5, tax_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, now, slug, nameTrim, emailTrim, phoneTrim, bankTrim, taxIdVal)
      .run();

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (err) {
    console.error('Error in POST /api/event-registration:', err);
    return new Response(
      JSON.stringify({ error: '伺服器發生錯誤（可能尚未建立活動報名資料表）' }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
