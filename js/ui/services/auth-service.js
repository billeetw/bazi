/**
 * 登入服務：Google OAuth code → POST /api/auth/google → 存 JWT
 * - 提供 getToken()、getAuthHeaders()、isLoggedIn()、logout()、handle401()
 * - 呼叫 init() 後會渲染導覽列登入/登出區塊並綁定 Google 登入
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'bazi_jwt';
  var USER_KEY = 'bazi_user';

  function getToken() {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function getUser() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setAuth(token, user) {
    try {
      localStorage.setItem(STORAGE_KEY, token || '');
      localStorage.setItem(USER_KEY, user ? JSON.stringify(user) : '');
    } catch (e) {}
    updateUI();
  }

  function clearAuth() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {}
    updateUI();
  }

  /**
   * 供 /api/me/* 的 fetch 使用：回傳 { Authorization: 'Bearer <token>' } 或 {}
   */
  function getAuthHeaders() {
    var t = getToken();
    if (!t) return {};
    return { Authorization: 'Bearer ' + t };
  }

  /**
   * 收到 401 時呼叫：清除 token 並更新 UI
   */
  function handle401() {
    clearAuth();
  }

  function isLoggedIn() {
    return !!getToken();
  }

  /** 17gonplay 專用的 fallback，當 /api/auth/config 無法取得時使用（Client ID 為公開值） */
  var FALLBACK_CLIENT_ID = '600329304958-me8iui2q7ec5k7ajhjijf939os6vann3.apps.googleusercontent.com';
  var googleClientId = null;
  var googleCodeClient = null;
  var configFetchPromise = null;

  function renderLampBadge(containerId, isMobile) {
    var el = document.getElementById(containerId);
    if (!el || !getToken()) return;
    var existing = el.querySelector('.lamp-badge');
    if (existing) existing.remove();
    var origin = window.location.origin || '';
    var badgesUrl = origin + '/api/me/badges?year=2026';
    console.log('📡 API REQUEST', badgesUrl, JSON.stringify({ year: 2026 }, null, 2));
    fetch(badgesUrl, { headers: getAuthHeaders() })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.badges || data.badges.length === 0) return;
        var badge = document.createElement('span');
        badge.className = 'lamp-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/20 border border-amber-400/40 text-amber-300';
        badge.textContent = '\uD83C\uDFEE 2026';
        badge.title = '2026 光明燈已點亮';
        badge.setAttribute('aria-label', '2026 光明燈已點亮');
        if (isMobile) {
          el.insertBefore(badge, el.firstChild);
        } else {
          var userSpan = el.querySelector('.auth-user');
          if (userSpan && userSpan.nextSibling) {
            el.insertBefore(badge, userSpan.nextSibling);
          } else {
            el.insertBefore(badge, el.querySelector('.auth-btn-logout') || el.firstChild);
          }
        }
      })
      .catch(function () {});
  }

  function renderAuthNav(containerId, isMobile) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.textContent = '';
    var user = getUser();
    var token = getToken();
    if (token) {
      var name = (user && (user.name || user.email)) ? (user.name || user.email).trim() : '使用者';
      var userSpan = document.createElement('span');
      userSpan.className = 'auth-user';
      userSpan.textContent = '登入為 ' + name;
      var logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = isMobile ? 'mobile-nav-link w-full text-left border-none bg-transparent cursor-pointer text-inherit font-inherit py-3 px-4' : 'auth-btn-logout';
      logoutBtn.textContent = isMobile ? '登出（' + name + '）' : '登出';
      logoutBtn.setAttribute('aria-label', '登出');
      logoutBtn.addEventListener('click', function () {
        clearAuth();
      });
      if (isMobile) {
        el.appendChild(logoutBtn);
      } else {
        el.appendChild(userSpan);
        el.appendChild(logoutBtn);
      }
      renderLampBadge(containerId, isMobile);
    } else {
      var loginBtn = document.createElement('button');
      loginBtn.type = 'button';
      loginBtn.id = 'btnGoogleLogin';
      loginBtn.className = isMobile ? 'mobile-nav-link w-full text-left border-none bg-transparent cursor-pointer text-amber-300 hover:bg-amber-500/20 py-3 px-4' : 'auth-btn-login';
      loginBtn.textContent = '登入';
      loginBtn.setAttribute('aria-label', '使用 Google 登入');
      loginBtn.addEventListener('click', function () {
        loginWithGoogle();
      });
      el.appendChild(loginBtn);
    }
  }

  function updateUI() {
    renderAuthNav('authNav', false);
    renderAuthNav('authNavMobile', true);
    if (typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { loggedIn: isLoggedIn() } }));
      } catch (e) {}
    }
  }

  function fetchConfig() {
    if (configFetchPromise) return configFetchPromise;
    console.log('📡 API REQUEST', '/api/auth/config', JSON.stringify({}, null, 2));
    configFetchPromise = fetch('/api/auth/config')
      .then(function (res) {
        if (!res.ok) throw new Error('config ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && data.config && data.config.google && data.config.google.clientId) {
          googleClientId = data.config.google.clientId;
        } else {
          if (data) console.warn('[AuthService] config missing clientId:', data);
          if (FALLBACK_CLIENT_ID) googleClientId = FALLBACK_CLIENT_ID;
        }
        return googleClientId;
      })
      .catch(function (err) {
        console.warn('[AuthService] config fetch failed:', err);
        if (FALLBACK_CLIENT_ID) googleClientId = FALLBACK_CLIENT_ID;
        return googleClientId;
      });
    return configFetchPromise;
  }

  function ensureConfig(cb) {
    if (googleClientId && typeof cb === 'function') {
      cb();
      return;
    }
    fetchConfig().then(function () {
      if (typeof cb === 'function') cb();
    });
  }

  function loginWithGoogle() {
    function doLogin() {
      if (!googleClientId && FALLBACK_CLIENT_ID) {
        googleClientId = FALLBACK_CLIENT_ID;
      }
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        alert('Google 登入尚未載入，請稍候幾秒或重新整理頁面後再試。');
        return;
      }
      if (!googleClientId) {
        console.warn('[AuthService] Google Client ID 未設定（API 無法取得且無 fallback）');
        alert(
          '登入功能尚未設定。\n\n' +
          '本機測試：在專案根目錄建立 .dev.vars，加入：\n' +
          'GOOGLE_CLIENT_ID=你的Google用戶端ID\n' +
          'GOOGLE_CLIENT_SECRET=你的密鑰\n' +
          'JWT_SECRET=至少32字元隨機字串\n\n' +
          '正式環境：在 Cloudflare Pages → Settings → Environment variables 設定上述變數。\n\n' +
          '詳見：本地測試-登入與我的命盤.md'
        );
        return;
      }
      try {
        googleCodeClient = window.google.accounts.oauth2.initCodeClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          ux_mode: 'popup',
          callback: function (response) {
            if (response.error) {
              console.warn('[AuthService] Google 登入錯誤:', response.error);
              if (response.error === 'popup_closed_by_user') return;
              alert('Google 登入失敗，請再試一次。');
              return;
            }
            var code = response.code;
            if (!code) {
              alert('未取得授權碼，請再試一次。');
              return;
            }
            var apiBase = window.location.origin;
            var googlePayload = { code: code, redirect_uri: window.location.origin };
            console.log('📡 API REQUEST', apiBase + '/api/auth/google', JSON.stringify({ ...googlePayload, code: (code || '').slice(0, 20) + '...' }, null, 2));
            fetch(apiBase + '/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(googlePayload),
            })
              .then(function (res) {
                return res.json().then(function (data) {
                  return { ok: res.ok, status: res.status, data: data };
                });
              })
              .then(function (result) {
                if (!result.ok) {
                  var msg = (result.data && result.data.error) || '登入失敗';
                  alert(msg);
                  return;
                }
                var token = result.data && result.data.token;
                var user = (result.data && result.data.user) || null;
                if (!token) {
                  console.error('[AuthService] API 未回傳 token:', result.data);
                  alert('登入失敗：伺服器未回傳 token');
                  return;
                }
                setAuth(token, user);
              })
              .catch(function (err) {
                console.error('[AuthService] POST /api/auth/google 錯誤:', err);
                alert('登入失敗，請稍後再試。');
              });
          },
        });
      } catch (e) {
        console.error('[AuthService] initCodeClient 錯誤:', e);
        alert('Google 登入尚未載入，請重新整理頁面再試。');
        return;
      }
      try {
        googleCodeClient.requestCode();
      } catch (e) {
        console.error('[AuthService] requestCode 錯誤:', e);
        alert('無法開啟登入視窗，請再試一次。');
      }
    }
    ensureConfig(doLogin);
  }

  /**
   * 頁面載入後呼叫：取得 OAuth 設定、渲染登入/登出、綁定按鈕
   */
  function init() {
    updateUI();
    fetchConfig();
  }

  window.AuthService = {
    getToken: getToken,
    getUser: getUser,
    getAuthHeaders: getAuthHeaders,
    isLoggedIn: isLoggedIn,
    logout: clearAuth,
    handle401: handle401,
    init: init,
    updateUI: updateUI,
    refreshBadges: function () { renderLampBadge('authNav', false); renderLampBadge('authNavMobile', true); },
    /** 直接觸發 Google 登入（供「點我推算時辰」等未登入時一鍵打開登入 popup） */
    triggerLogin: loginWithGoogle,
  };
  if (typeof window.UiServices !== 'undefined') {
    window.UiServices.AuthService = window.AuthService;
  }
})();
