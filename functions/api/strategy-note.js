/**
 * POST /api/strategy-note
 * Body: { palace: string, strength: 1|2|3|4, sihuaList: string[] }
 * 回傳：{ note: string } 戰略一句話（金句拼接），核心算法不暴露於前端。
 */
import { getStrategyNote } from "../logic/strategyEngine.js";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const palace = body.palace && String(body.palace).trim();
    const strength = Math.min(4, Math.max(1, Number(body.strength) || 1));
    const sihuaList = Array.isArray(body.sihuaList) ? body.sihuaList.map((h) => String(h).trim()).filter(Boolean) : [];

    if (!palace) {
      return new Response(JSON.stringify({ error: "缺少參數 palace" }), { status: 400, headers: JSON_HEADERS });
    }

    const note = getStrategyNote(palace, strength, sihuaList);

    return new Response(JSON.stringify({ note }), { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    console.error("Error in /api/strategy-note:", err);
    return new Response(JSON.stringify({ error: "伺服器發生錯誤" }), { status: 500, headers: JSON_HEADERS });
  }
}
