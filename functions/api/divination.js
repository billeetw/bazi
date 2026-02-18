/**
 * POST /api/divination - 儲存占卦紀錄（MVP：匿名可存）
 * Body: { question, mood, primaryIndex, transformedIndex, mutualIndex, lines, changingLines }
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const {
      question,
      mood,
      primaryIndex,
      transformedIndex,
      mutualIndex,
      lines,
      changingLines,
      source,
    } = body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return jsonResponse({ error: "請提供 question" }, 400);
    }
    if (
      typeof primaryIndex !== "number" ||
      typeof transformedIndex !== "number" ||
      typeof mutualIndex !== "number" ||
      !Array.isArray(lines) ||
      lines.length !== 6
    ) {
      return jsonResponse({ error: "卦象資料不完整" }, 400);
    }

    let userId = null;
    if (env.JWT_SECRET) {
      try {
        const { getAuthFromRequest } = await import("../auth/jwt.js");
        const payload = await getAuthFromRequest(request, env.JWT_SECRET);
        if (payload?.sub) userId = payload.sub;
      } catch (_) {}
    }

    const id = uuid();
    const now = new Date().toISOString();
    const linesJson = JSON.stringify(lines);
    const changingLinesJson = changingLines ? JSON.stringify(changingLines) : null;

    const sourceVal = (typeof source === "string" && (source === "Homepage_Entrance" || source === "Result_Save")) ? source : null;
    if (env.CONSULT_DB) {
      await env.CONSULT_DB.prepare(
        `INSERT INTO divination_logs (id, created_at, user_id, question, mood, primary_index, transformed_index, mutual_index, lines_json, changing_lines_json, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          now,
          userId,
          question.trim().slice(0, 500),
          mood || null,
          primaryIndex,
          transformedIndex,
          mutualIndex,
          linesJson,
          changingLinesJson,
          sourceVal
        )
        .run();
    }

    return jsonResponse({ ok: true, id, created_at: now });
  } catch (err) {
    console.error("[divination] Error:", err);
    return jsonResponse({ error: err.message || "伺服器錯誤" }, 500);
  }
}
