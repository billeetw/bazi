export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();

    const {
      email,
      phone,
      taxId,
      name,
      birth,
      topics,
      topicExtra,
      bankLast5,
      paymentMethod,
      source,
    } = data || {};

    if (
      !email ||
      !phone ||
      !name ||
      !birth ||
      !bankLast5 ||
      !Array.isArray(topics) ||
      topics.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: '缺少必填欄位' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    if (!email.includes('@')) {
      return new Response(
        JSON.stringify({ error: '電子郵件格式有誤' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const topicsString = topics.join(', ');
    const method = paymentMethod || 'BANK_TRANSFER';
    const status = 'PENDING';

    const db = env.CONSULT_DB;

    await db
      .prepare(`
        INSERT INTO consultations (
          id, created_at, updated_at,
          name, email, phone, tax_id,
          birth_info, topics, topic_extra, bank_last5,
          payment_method, payment_status, source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        now,
        now,
        name,
        email,
        phone,
        taxId || null,
        birth,
        topicsString,
        topicExtra || null,
        bankLast5,
        method,
        status,
        source || null
      )
      .run();

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (err) {
    console.error('Error in /api/consultation:', err);
    return new Response(JSON.stringify({ error: '伺服器發生錯誤' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}
