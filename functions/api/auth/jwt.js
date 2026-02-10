/**
 * JWT 簽發與驗證（共用，使用 Web Crypto API，無外部依賴）
 * - sign: 簽發 JWT，payload 含 sub (user_id)、exp
 * - verify: 從 Authorization: Bearer <token> 解析並驗證，回傳 payload；失敗回 null
 */

const DEFAULT_EXPIRY_SEC = 7 * 24 * 3600; // 7 days

function base64UrlEncode(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSha256(key, data) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, data);
}

/**
 * 簽發 JWT（HS256）
 */
export async function sign(payload, secret, expiry = '7d') {
  if (!secret) throw new Error('JWT_SECRET required');
  const now = Math.floor(Date.now() / 1000);
  let sec = DEFAULT_EXPIRY_SEC;
  if (typeof expiry === 'string' && expiry.endsWith('d')) {
    sec = parseInt(expiry.slice(0, -1), 10) * 24 * 3600;
  }
  const fullPayload = { ...payload, iat: now, exp: now + sec };
  const key = new TextEncoder().encode(secret);
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const message = new TextEncoder().encode(headerB64 + '.' + payloadB64);
  const sig = await hmacSha256(key, message);
  const sigB64 = base64UrlEncode(new Uint8Array(sig));
  return headerB64 + '.' + payloadB64 + '.' + sigB64;
}

/**
 * 驗證 JWT，回傳 payload（含 sub = user_id）
 */
export async function verify(token, secret) {
  if (!token || !secret) return null;
  const t = token.replace(/^Bearer\s+/i, '').trim();
  if (!t) return null;
  const parts = t.split('.');
  if (parts.length !== 3) return null;
  try {
    const key = new TextEncoder().encode(secret);
    const message = new TextEncoder().encode(parts[0] + '.' + parts[1]);
    const sig = base64UrlDecode(parts[2]);
    const expectedBuf = await hmacSha256(key, message);
    const expected = new Uint8Array(expectedBuf);
    if (sig.length !== expected.length) return null;
    for (let i = 0; i < sig.length; i++) if (sig[i] !== expected[i]) return null;
    const payloadJson = new TextDecoder().decode(base64UrlDecode(parts[1]));
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp != null && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * 從 Request 取得並驗證 JWT
 */
export async function getAuthFromRequest(request, secret) {
  const auth = request.headers.get('Authorization');
  if (!auth) return null;
  return await verify(auth, secret);
}
