/**
 * 共用：後台 Basic Auth 驗證與 JSON 回應
 * 供 functions/api/admin/* 使用
 */

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  /** 避免 CDN／瀏覽器快取含個資的 JSON；亦避免誤以為「未登入仍看得到資料」 */
  "Cache-Control": "no-store, private",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

export function parseBasicAuth(request) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Basic ")) return null;
  try {
    const base64 = auth.slice(6).trim();
    const decoded = atob(base64);
    const i = decoded.indexOf(":");
    if (i === -1) return null;
    return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
  } catch {
    return null;
  }
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: "請登入" }), {
    status: 401,
    headers: {
      ...JSON_HEADERS,
      "WWW-Authenticate": 'Basic realm="Admin"',
      Vary: "Authorization",
    },
  });
}

/**
 * 驗證後台登入，失敗時回傳 Response，成功時回傳 { user }
 */
export function requireAdmin(request, env) {
  if (!env.ADMIN_USER || !env.ADMIN_PASSWORD) {
    return new Response(
      JSON.stringify({ error: "後台未設定 ADMIN_USER / ADMIN_PASSWORD" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
  const cred = parseBasicAuth(request);
  if (!cred || cred.user !== env.ADMIN_USER || cred.pass !== env.ADMIN_PASSWORD) {
    return unauthorized();
  }
  return { user: cred.user };
}
