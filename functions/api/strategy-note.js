/**
 * GET /api/strategy-note 與 POST /api/strategy-note
 * 宮位強度「戰略一句話」：目前回傳預設文案，之後可接資料庫或金句矩陣。
 * 參數：palace, strength, sihuaList（GET 用 query；POST 用 body）
 */

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };
const DEFAULT_NOTE = '（暫無戰略提示）';

function respondNote(note = DEFAULT_NOTE) {
  return new Response(JSON.stringify({ note }), {
    status: 200,
    headers: JSON_HEADERS,
  });
}

export async function onRequestGet(context) {
  // GET: ?palace=命宮&strength=3&sihuaList=化祿,化權
  return respondNote();
}

export async function onRequestPost(context) {
  const { request } = context;
  try {
    const body = await request.json().catch(() => ({}));
    // body: { palace, strength, sihuaList }
    // 之後可依 palace/strength/sihuaList 查金句矩陣或 D1
    return respondNote();
  } catch {
    return respondNote();
  }
}
