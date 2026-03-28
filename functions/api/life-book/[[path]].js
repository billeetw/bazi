/**
 * Proxy: /api/life-book/* -> bazi-api Worker
 * 支援 generate、generate-section、daily-flow、config (GET/POST)
 *
 * POST 須先 await request.text() 再轉發。若直接把 request.body 串流丟給 fetch，
 * 在部分 Pages 環境下遠端可能收到空 body，Worker 無法 parse JSON → 前端整批章節顯示「失敗」。
 */
const REMOTE = "https://bazi-api.billeetw.workers.dev";

/**
 * 從實際 URL 取 `/api/life-book/` 之後的子路徑（不依賴 `[[path]]` params，避免 Pages 對多段 path 解析不一致 → Worker 收到錯誤路徑而 404 Not found）。
 */
function extractLifeBookSubpath(request) {
  try {
    const url = new URL(request.url);
    const prefix = "/api/life-book/";
    if (!url.pathname.startsWith(prefix)) return "";
    return url.pathname.slice(prefix.length).replace(/\/$/, "") || "";
  } catch {
    return "";
  }
}

/**
 * @param {Request} request
 * @param {string} path
 */
async function proxyLifeBook(request, path) {
  const url = new URL(request.url);
  const targetUrl = `${REMOTE}/api/life-book/${path}${url.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("host", new URL(REMOTE).host);

  let body;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  let resp;
  try {
    resp = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body !== undefined ? body : undefined,
    });
  } catch (e) {
    const msg = e && e.message ? String(e.message) : String(e);
    return new Response(JSON.stringify({ ok: false, error: `代理連線失敗: ${msg}` }), {
      status: 502,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
      },
    });
  }

  const newHeaders = new Headers(resp.headers);
  newHeaders.set("access-control-allow-origin", "*");
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: newHeaders,
  });
}

export async function onRequestGet(context) {
  const path = extractLifeBookSubpath(context.request) || context.params.path || "";
  if (path !== "config") return new Response("Not Found", { status: 404 });
  return proxyLifeBook(context.request, path);
}

export async function onRequestPost(context) {
  const path = extractLifeBookSubpath(context.request) || context.params.path || "generate";
  return proxyLifeBook(context.request, path);
}
