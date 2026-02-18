/**
 * Proxy: /content/* -> 遠端 Worker
 */
const REMOTE = "https://bazi-api.billeetw.workers.dev";

export async function onRequest(context) {
  const { request, params } = context;
  const path = params.path || "";
  const url = new URL(request.url);
  const targetUrl = `${REMOTE}/content/${path}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  const resp = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
  });

  const newHeaders = new Headers(resp.headers);
  newHeaders.set("access-control-allow-origin", "*");
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: newHeaders });
}
