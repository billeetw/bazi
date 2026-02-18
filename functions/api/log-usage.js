/**
 * Proxy: POST /api/log-usage -> 遠端 Worker
 */
const REMOTE = "https://bazi-api.billeetw.workers.dev";

export async function onRequestPost(context) {
  const { request } = context;
  const targetUrl = `${REMOTE}/api/log-usage`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  const resp = await fetch(targetUrl, {
    method: "POST",
    headers,
    body: request.body,
  });

  const newHeaders = new Headers(resp.headers);
  newHeaders.set("access-control-allow-origin", "*");
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: newHeaders });
}
