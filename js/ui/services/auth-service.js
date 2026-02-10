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

  var googleClientId = null;
  var googleCodeClient = null;

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

  function loginWithGoogle() {
    if (!googleCodeClient) {
      if (!googleClientId) {
        console.warn('[AuthService] Google Client ID 未設定');
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
            fetch(apiBase + '/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: code, redirect_uri: window.location.origin }),
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
    }
    try {
      googleCodeClient.requestCode();
    } catch (e) {
      console.error('[AuthService] requestCode 錯誤:', e);
      alert('無法開啟登入視窗，請再試一次。');
    }
  }

  /**
   * 頁面載入後呼叫：取得 OAuth 設定、渲染登入/登出、綁定按鈕
   */
  function init() {
    updateUI();
    fetch(window.location.origin + '/api/auth/config')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.config && data.config.google && data.config.google.clientId) {
          googleClientId = data.config.google.clientId;
        }
      })
      .catch(function () {});
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
    /** 直接觸發 Google 登入（供「點我推算時辰」等未登入時一鍵打開登入 popup） */
    triggerLogin: loginWithGoogle,
  };
})();
