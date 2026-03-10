/**
 * Proxy: /api/life-book/* -> bazi-api Worker
 * 支援 generate、generate-section、config (GET/POST)
 */
const REMOTE = "https://bazi-api.billeetw.workers.dev";

function handleRequest(request, path) {
  const url = new URL(request.url);
  const targetUrl = `${REMOTE}/api/life-book/${path}${url.search}`;
  const headers = new Headers(request.headers);
  headers.set("host", new URL(REMOTE).host);

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
  }).then((resp) => {
    const newHeaders = new Headers(resp.headers);
    newHeaders.set("access-control-allow-origin", "*");
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: newHeaders,
    });
  });
}

export async function onRequestGet(context) {
  const { params } = context;
  const path = params.path || "";
  if (path !== "config") return new Response("Not Found", { status: 404 });
  return handleRequest(context.request, path);
}

export async function onRequestPost(context) {
  const { params } = context;
  const path = params.path || "generate";
  return handleRequest(context.request, path);
}
