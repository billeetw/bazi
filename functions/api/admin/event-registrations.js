/**
 * GET /api/admin/event-registrations
 * 後台：活動報名列表（Basic 認證），可選 ?event_slug=213 篩選
 */

import { requireAdmin, jsonResponse } from "../../shared/admin-auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

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

    return jsonResponse({ list });
  } catch (err) {
    console.error('Error in GET /api/admin/event-registrations:', err);
    return jsonResponse({ error: '讀取失敗' }, 500);
  }
}
