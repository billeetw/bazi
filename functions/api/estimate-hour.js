/**
 * POST /api/estimate-hour (V4：18+1 題)
 * Body: { answers: { q1?: string[], q2?: string[], q3?: string, ... q19?: string } }  q1/q2 可複選最多 2 項
 * 回傳：{ branch, hour_label, hour_range, half: "upper"|"lower" } 唯一地支與上半/下半，供紫微排盤用。
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
