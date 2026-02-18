/**
 * 寄送諮詢報名確認信（Resend API）
 * 若 env.RESEND_API_KEY 未設定，則不寄信
 */
async function sendConfirmationEmail(env, { name, email, birth, topicsString }) {
  const apiKey = env?.RESEND_API_KEY;
  if (!apiKey || typeof apiKey !== 'string') return;

  const fromEmail = env?.CONSULT_FROM_EMAIL || 'noreply@17gonplay.com';
  const subject = '【人生說明書】諮詢報名確認 - 我們已收到您的資料';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;line-height:1.6;color:#334155;max-width:560px;margin:0 auto;padding:24px;}h1{color:#b45309;font-size:1.25rem;}p{margin:12px 0;}.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;}.footer{font-size:12px;color:#64748b;margin-top:24px;}</style></head>
<body>
  <h1>諮詢報名確認</h1>
  <p>${escapeHtml(name)} 您好，</p>
  <p>感謝您報名人生說明書的深度諮詢，我們已收到您的資料。</p>
  <div class="box">
    <p><strong>出生資訊：</strong> ${escapeHtml(birth)}</p>
    <p><strong>想討論的主題：</strong> ${escapeHtml(topicsString)}</p>
  </div>
  <p><strong>下一步：</strong>請到以下連結選擇第一次線上訪談時間：<br>
  <a href="https://calendly.com/billeetw/30min" style="color:#b45309;font-weight:bold;">立即預約 Calendly</a></p>
  <p>我們將在 <strong>1–2 個工作天內</strong> 與您聯繫確認時段。</p>
  <p class="footer">若有任何疑問，歡迎來信 billeetw@gmail.com</p>
</body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[consultation] Resend error:', res.status, err);
    }
  } catch (err) {
    console.error('[consultation] sendConfirmationEmail:', err);
  }
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

    // 寄送確認信（非同步，不阻塞回應；若無 RESEND_API_KEY 則跳過）
    sendConfirmationEmail(env, {
      name,
      email,
      birth,
      topicsString,
    }).catch((err) => console.error('[consultation] email:', err));

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (err) {
    console.error('Error in /api/consultation:', err);
    // Most common reasons:
    // - D1 binding missing
    // - table not created yet (run D1 migrations)
    return new Response(JSON.stringify({ error: '伺服器發生錯誤（可能尚未建立資料表）' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
}
