import { requireAdmin, jsonResponse } from "../../shared/admin-auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const db = env.CONSULT_DB;
    const { results } = await db
      .prepare(
        `SELECT id, created_at, name, email, phone, tax_id, birth_info, topics, topic_extra, bank_last5, payment_method, payment_status, source
         FROM consultations
         ORDER BY created_at DESC`
      )
      .all();

    return jsonResponse({ list: results || [] });
  } catch (err) {
    console.error('Error in GET /api/admin/consultations:', err);
    return jsonResponse({ error: '讀取失敗' }, 500);
  }
}
