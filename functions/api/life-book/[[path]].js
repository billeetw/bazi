/**
 * Proxy: /api/life-book/* -> bazi-api Worker
 * 支援 generate 與 generate-section
 */
const REMOTE = "https://bazi-api.billeetw.workers.dev";

function handleRequest(request, path) {
  const targetUrl = `${REMOTE}/api/life-book/${path}`;
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

export async function onRequestPost(context) {
  const { params } = context;
  const path = params.path || "generate";
  return handleRequest(context.request, path);
}
