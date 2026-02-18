/**
 * POST /api/divination/feedback - 提交占卦回饋
 * Body: { divination_id, rating: 'accurate'|'inaccurate'|'pending', feedback_text? }
 */

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "access-control-allow-origin": "*" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const divinationId = (body?.divination_id ?? "").toString().trim();
    const rating = (body?.rating ?? "").toString().toLowerCase();
    const feedbackText = (body?.feedback_text ?? "").toString().trim().slice(0, 500);

    if (!divinationId) return jsonResponse({ error: "請提供 divination_id" }, 400);
    if (!["accurate", "inaccurate", "pending", "suggestion"].includes(rating)) {
      return jsonResponse({ error: "rating 必須為 accurate、inaccurate、pending 或 suggestion" }, 400);
    }

    const db = env.CONSULT_DB;
    if (!db) return jsonResponse({ error: "資料庫未綁定" }, 500);

    const now = new Date().toISOString();

    const result = await db
      .prepare(
        `UPDATE divination_logs
         SET feedback_rating = ?, feedback_text = ?, feedback_at = ?
         WHERE id = ?`
      )
      .bind(rating, feedbackText || null, now, divinationId)
      .run();

    if (result.meta?.changes === 0) {
      return jsonResponse({ error: "找不到該占卦紀錄" }, 404);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error("[divination/feedback] Error:", err);
    return jsonResponse({ error: err.message || "伺服器錯誤" }, 500);
  }
}
