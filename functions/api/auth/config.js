/**
 * OAuth Configuration API
 * GET /api/auth/config
 * 返回前端需要的 OAuth 配置（仅包含公开的 Client ID）
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 只返回公开的 Client ID，不返回 Secret
    const config = {
      google: {
        clientId: env.GOOGLE_CLIENT_ID || null,
      },
      facebook: {
        appId: env.FACEBOOK_APP_ID || null,
      },
    };

    return new Response(
      JSON.stringify({ ok: true, config }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=3600', // 缓存1小时
        },
      }
    );

  } catch (err) {
    console.error('Error in /api/auth/config:', err);
    return new Response(
      JSON.stringify({ error: '獲取配置失敗' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }
}
