/**
 * 讀取 Node／Vitest 的 process.env。
 * Cloudflare Workers 沒有全域 `process`，寫 `process.env.X` 會拋 ReferenceError，須經此函式。
 */
export function getNodeProcessEnv(name: string): string | undefined {
  try {
    const p = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
    if (p == null || typeof p !== "object") return undefined;
    const env = p.env;
    if (env == null || typeof env !== "object") return undefined;
    const v = env[name];
    return typeof v === "string" ? v : undefined;
  } catch {
    return undefined;
  }
}
