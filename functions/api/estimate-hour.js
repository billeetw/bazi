/**
 * POST /api/estimate-hour
 * Body: { answers: Record<string, string> } 例如 { answers: { q1: "A", q2: "B", ... } }
 * 回傳：{ topHours: string[], confidence: number } 前三名時辰與可信度，加權數值不暴露於前端。
 */
import { estimateHour } from "../logic/timeEstimator.js";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};

    const result = estimateHour(answers);

    return new Response(JSON.stringify(result), { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    console.error("Error in /api/estimate-hour:", err);
    return new Response(JSON.stringify({ error: "伺服器發生錯誤" }), { status: 500, headers: JSON_HEADERS });
  }
}
