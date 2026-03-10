/**
 * 太歲狀態卡片：顯示值/沖/刑/害/破/無，未登入 CTA，已登入點燈按鈕
 * 2A 流程：未登入時暫存 formData 到 sessionStorage，登入後自動儲存並點燈
 */

(function () {
  "use strict";

  const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";
  const PENDING_LAMP_FORM = "pendingLampFormData";
  const PENDING_LAMP_ACTION = "pendingLampAction";
  const PENDING_LAMP_YEAR = "pendingLampYear";

  function getApiUrl(path) {
    return ORIGIN + (path.startsWith("/") ? path : "/" + path);
  }

  function getAuthHeaders() {
    const AuthService = window.UiServices?.AuthService;
    if (AuthService && typeof AuthService.getAuthHeaders === "function") {
      return AuthService.getAuthHeaders();
    }
    const t = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;
    return t ? { Authorization: "Bearer " + t } : {};
  }

  function isLoggedIn() {
    const AuthService = window.UiServices?.AuthService;
    if (AuthService && typeof AuthService.isLoggedIn === "function") {
      return AuthService.isLoggedIn();
    }
    return !!(typeof localStorage !== "undefined" && localStorage.getItem("auth_token"));
  }

  function triggerLogin() {
    const AuthService = window.UiServices?.AuthService;
    if (AuthService && typeof AuthService.triggerLogin === "function") {
      AuthService.triggerLogin();
    } else {
      const btn = document.getElementById("btnGoogleLogin");
      if (btn) btn.click();
    }
  }

  function getFormData() {
    const svc = window.MyChartsService;
    return svc && typeof svc.getCurrentFormData === "function" ? svc.getCurrentFormData() : null;
  }

  function clearPendingLamp() {
    try {
      sessionStorage.removeItem(PENDING_LAMP_FORM);
      sessionStorage.removeItem(PENDING_LAMP_ACTION);
      sessionStorage.removeItem(PENDING_LAMP_YEAR);
    } catch (_) {}
  }

  function storePendingLamp(formData, year) {
    try {
      sessionStorage.setItem(PENDING_LAMP_FORM, JSON.stringify(formData));
      sessionStorage.setItem(PENDING_LAMP_ACTION, "1");
      sessionStorage.setItem(PENDING_LAMP_YEAR, String(year || 2026));
    } catch (_) {}
  }

  function getPendingLamp() {
    try {
      const raw = sessionStorage.getItem(PENDING_LAMP_FORM);
      const year = sessionStorage.getItem(PENDING_LAMP_YEAR);
      if (!raw) return null;
      const formData = JSON.parse(raw);
      if (!formData || !formData.birth_date || !formData.birth_time) return null;
      return { formData, year: parseInt(year || "2026", 10) };
    } catch (_) {
      return null;
    }
  }

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function renderTaisuiCard(birthYear, year = 2026, options = {}) {
    const el = document.getElementById("taisuiCard");
    if (!el) return;

    el.innerHTML = '<div class="text-amber-400/80 animate-pulse">載入中…</div>';

    const params = new URLSearchParams({ year: String(year) });
    if (birthYear) params.set("birthYear", String(birthYear));
    const birthDate = options?.birth_date && /^\d{4}-\d{2}-\d{2}$/.test(String(options.birth_date).trim()) ? options.birth_date.trim() : null;
    if (birthDate) params.set("birth_date", birthDate);

    try {
      const url = getApiUrl("/api/taisui/status?" + params.toString());
      console.log("📡 API REQUEST", url, JSON.stringify({ year: options?.year, birthYear: options?.birth_year }, null, 2));
      const r = await fetch(url, { headers: getAuthHeaders() });
      const data = await r.json();

      if (!r.ok) {
        el.innerHTML =
          '<p class="text-slate-500">' +
          escapeHtml(data.error || "無法取得太歲狀態") +
          "</p>";
        return;
      }

      const loggedIn = isLoggedIn();
      const label = data.label || "無";
      const relation = data.relation || "";
      const explain = data.explain || "";
      const zodiac = data.zodiac ? data.zodiac + " " : "";
      const flowStemBranch = data.flowStemBranch || "";

      let html = "";
      html += '<div class="rounded-xl border border-amber-400/30 bg-amber-500/5 p-4">';
      html += '<div class="text-2xl font-black text-amber-400 mb-1">' + escapeHtml(label) + "</div>";
      if (relation) html += '<div class="text-sm text-slate-400 mb-2">' + escapeHtml(relation) + "</div>";
      html += '<p class="text-slate-300 text-sm leading-relaxed">' + escapeHtml(explain) + "</p>";
      html += '<p class="text-xs text-slate-500 mt-2">' + escapeHtml(year) + " " + escapeHtml(flowStemBranch) + " · 生肖 " + escapeHtml(zodiac) + "</p>";
      html += "</div>";

      if (!loggedIn) {
        html += '<div class="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 space-y-3">';
        html += '<div class="font-semibold text-amber-300">登入點亮年度光明燈</div>';
        html += '<ul class="text-sm text-slate-300 space-y-1">';
        html += "<li>🏮 點燈動畫儀式</li>";
        html += "<li>✨ 取得你的年度守護語</li>";
        html += "<li>🖼️ 生成年度守護圖片（流年／生肖／守護語／網站 logo）</li>";
        html += "</ul>";
        html += '<p class="text-xs text-slate-400">點亮後，你的帳號狀態會顯示「光明燈勳章」。</p>';
        html +=
          '<button type="button" class="mt-3 w-full md:w-auto px-6 py-3 rounded-xl bg-amber-500/90 text-slate-900 font-bold text-sm hover:bg-amber-400 transition" id="taisuiLoginBtn">登入並點光明燈</button>';
        html += "</div>";
      } else {
        html += '<div class="flex flex-wrap gap-2" id="taisuiLampArea">';
        html +=
          '<button type="button" class="px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-sm hover:bg-amber-500/30 transition" id="taisuiLampBtn">點光明燈</button>';
        html += "</div>";
      }

      el.innerHTML = html;

      if (!loggedIn) {
        const loginBtn = document.getElementById("taisuiLoginBtn");
        if (loginBtn) {
          loginBtn.addEventListener("click", function () {
            const formData = getFormData();
            if (!formData || !formData.birth_date || !formData.birth_time) {
              alert("請先輸入出生資料並計算，再點光明燈。");
              return;
            }
            storePendingLamp(formData, year);
            triggerLogin();
          });
        }
      } else {
        const lampBtn = document.getElementById("taisuiLampBtn");
        if (lampBtn) {
          lampBtn.addEventListener("click", function () {
            onLampClick(year);
          });
        }
      }
    } catch (err) {
      console.error("[taisui-card] Error:", err);
      el.innerHTML =
        '<p class="text-slate-500">無法載入太歲狀態，請稍後再試。</p>';
    }
  }

  function openLampModal() {
    const backdrop = document.getElementById("lampModalBackdrop");
    const modal = document.getElementById("lampModal");
    const lampEl = document.getElementById("lampModalLamp");
    const phraseEl = document.getElementById("lampModalPhrase");
    const actionsEl = document.getElementById("lampModalActions");
    const closeBtn = document.getElementById("lampModalClose");
    if (!backdrop || !modal) return;

    phraseEl.classList.add("hidden");
    phraseEl.textContent = "";
    actionsEl.classList.add("hidden");
    const lampIcon = lampEl?.querySelector(".lamp-icon");
    if (lampIcon) {
      lampIcon.classList.remove("lit");
      lampIcon.style.opacity = "0.3";
    }

    modal.classList.remove("lamp-lit");
    document.body.classList.remove("lamp-guardian-active");
    backdrop.classList.remove("hidden");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    function closeModal() {
      closeLampModal();
    }

    if (closeBtn) closeBtn.onclick = closeModal;
    backdrop.onclick = closeModal;
    var escHandler = function (e) {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  function closeLampModal() {
    const backdrop = document.getElementById("lampModalBackdrop");
    const modal = document.getElementById("lampModal");
    if (backdrop) backdrop.classList.add("hidden");
    if (modal) {
      modal.classList.remove("lamp-lit");
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "";
  }

  function showLampResult(data) {
    const guardianPhrase = data.guardianPhrase;
    const imageUrl = data.imageUrl;
    const year = data.year;
    const flowStemBranch = data.flowStemBranch || "";
    const zodiac = data.zodiac || "";

    const modal = document.getElementById("lampModal");
    if (modal) modal.classList.add("lamp-lit");
    document.body.classList.add("lamp-guardian-active");

    const phraseEl = document.getElementById("lampModalPhrase");
    const actionsEl = document.getElementById("lampModalActions");
    const shareEl = document.getElementById("lampModalShare");
    const shareFbEl = document.getElementById("lampModalShareFb");
    const shareDlEl = document.getElementById("lampModalShareDl");
    const shareHintEl = document.getElementById("lampModalShareHint");
    const closeBtn = document.getElementById("lampModalClose");

    if (phraseEl) {
      phraseEl.textContent = guardianPhrase ? guardianPhrase + "\n\n今年已被守護。" : "今年已被守護。";
      phraseEl.classList.remove("hidden");
    }
    if (actionsEl) actionsEl.classList.remove("hidden");

    function getImageDataUrl() {
      return imageUrl || (function () {
        var gen = window.UiUtils?.LampImage?.generateLampImage;
        return gen ? gen({ year, flowStemBranch, zodiac, guardianPhrase }) : null;
      })();
    }
    function doDownload() {
      var dataUrl = getImageDataUrl();
      if (dataUrl) {
        var a = document.createElement("a");
        a.href = dataUrl;
        a.download = "lamp-" + year + ".png";
        a.click();
      }
    }
    function doShareFb() {
      var u = encodeURIComponent((typeof window !== "undefined" && window.location.origin) || "https://www.17gonplay.com");
      window.open("https://www.facebook.com/sharer/sharer.php?u=" + u, "_blank", "width=600,height=400");
    }

    if (shareEl) {
      shareEl.onclick = async function () {
        var dataUrl = getImageDataUrl();
        if (!dataUrl) return;
        if (navigator.share && navigator.canShare) {
          try {
            var res = await fetch(dataUrl);
            var blob = await res.blob();
            var file = new File([blob], "lamp-" + year + ".png", { type: "image/png" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: year + " 光明燈已點亮", text: "今年已被守護。" });
              return;
            }
          } catch (e) { /* fallback to download */ }
        }
        doDownload();
      };
    }
    if (shareFbEl) shareFbEl.onclick = doShareFb;
    if (shareDlEl) shareDlEl.onclick = doDownload;
    if (closeBtn) closeBtn.focus();
  }

  async function onLampClick(year) {
    const area = document.getElementById("taisuiLampArea");
    const btn = document.getElementById("taisuiLampBtn");
    if (!area || !btn) return;

    btn.disabled = true;
    btn.textContent = "點燈中…";

    openLampModal();

    const lampIcon = document.querySelector("#lampModalLamp .lamp-icon");
    if (lampIcon) {
      requestAnimationFrame(function () {
        lampIcon.classList.add("lit");
      });
    }

    const ANIMATION_MS = 1500;

    try {
      var lampUrlFirst = getApiUrl("/api/taisui/lamp");
      var lampBody = { year };
      console.log("📡 API REQUEST", lampUrlFirst, JSON.stringify(lampBody, null, 2));
      const r = await fetch(lampUrlFirst, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(lampBody),
      });
      const data = await r.json();

      if (!r.ok) {
        if (r.status === 400 && (data.error || "").indexOf("請先建立命盤") !== -1) {
          const formData = getFormData();
          if (formData && formData.birth_date && formData.birth_time) {
            const svc = window.MyChartsService;
            if (svc && typeof svc.saveChartWithData === "function") {
              const saveResult = await svc.saveChartWithData(formData, "本人");
              if (saveResult.ok) {
                console.log("📡 API REQUEST", getApiUrl("/api/taisui/lamp"), "(retry)", JSON.stringify({ year }, null, 2));
                const r2 = await fetch(getApiUrl("/api/taisui/lamp"), {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                  body: JSON.stringify({ year }),
                });
                const data2 = await r2.json();
                if (r2.ok) {
                  setTimeout(function () {
                    showLampResult({
                      guardianPhrase: data2.guardianPhrase,
                      imageUrl: data2.imageUrl || null,
                      year,
                      flowStemBranch: data2.flowStemBranch || "",
                      zodiac: data2.zodiac || "",
                    });
                  }, ANIMATION_MS);
                  btn.textContent = "已點亮 ✅";
                  btn.classList.add("opacity-75");
                  var auth = window.AuthService || window.UiServices?.AuthService;
                  if (auth && typeof auth.refreshBadges === "function") auth.refreshBadges();
                  if (data2.guardianPhrase) {
                    const phraseEl = document.createElement("p");
                    phraseEl.className = "text-amber-300/90 font-medium mt-2 w-full";
                    phraseEl.textContent = data2.guardianPhrase;
                    area.appendChild(phraseEl);
                  }
                  var shareBtn = document.createElement("button");
                  shareBtn.type = "button";
                  shareBtn.className = "inline-flex px-4 py-2 rounded-lg border border-amber-400/40 text-amber-300 text-sm hover:bg-amber-500/20 transition";
                  shareBtn.textContent = "分享年度圖片";
                  shareBtn.onclick = function () {
                    var gen = window.UiUtils?.LampImage?.generateLampImage;
                    if (gen) {
                      var dataUrl = gen({ year, flowStemBranch: data2.flowStemBranch || "", zodiac: data2.zodiac || "", guardianPhrase: data2.guardianPhrase });
                      if (dataUrl) { var a = document.createElement("a"); a.href = dataUrl; a.download = "lamp-" + year + ".png"; a.click(); }
                    }
                  };
                  area.appendChild(shareBtn);
                  return;
                }
              }
            }
          }
        }
        closeLampModal();
        btn.disabled = false;
        btn.textContent = "點光明燈";
        alert(data.error || "點燈失敗");
        return;
      }

      setTimeout(function () {
        showLampResult({
          guardianPhrase: data.guardianPhrase,
          imageUrl: data.imageUrl || null,
          year,
          flowStemBranch: data.flowStemBranch || "",
          zodiac: data.zodiac || "",
        });
      }, ANIMATION_MS);

      btn.textContent = "已點亮 ✅";
      btn.classList.add("opacity-75");
      var auth = window.AuthService || window.UiServices?.AuthService;
      if (auth && typeof auth.refreshBadges === "function") auth.refreshBadges();
      if (data.guardianPhrase) {
        const phraseEl = document.createElement("p");
        phraseEl.className = "text-amber-300/90 font-medium mt-2 w-full";
        phraseEl.textContent = data.guardianPhrase;
        area.appendChild(phraseEl);
      }
      var shareBtn = document.createElement("button");
      shareBtn.type = "button";
      shareBtn.className = "inline-flex px-4 py-2 rounded-lg border border-amber-400/40 text-amber-300 text-sm hover:bg-amber-500/20 transition";
      shareBtn.textContent = "分享年度圖片";
      shareBtn.onclick = function () {
        var gen = window.UiUtils?.LampImage?.generateLampImage;
        if (gen) {
          var dataUrl = gen({
            year,
            flowStemBranch: data.flowStemBranch || "",
            zodiac: data.zodiac || "",
            guardianPhrase: data.guardianPhrase,
          });
          if (dataUrl) {
            var a = document.createElement("a");
            a.href = dataUrl;
            a.download = "lamp-" + year + ".png";
            a.click();
          }
        }
      };
      area.appendChild(shareBtn);
    } catch (err) {
      console.error("[taisui-card] Lamp error:", err);
      closeLampModal();
      btn.disabled = false;
      btn.textContent = "點光明燈";
      alert("點燈失敗，請稍後再試");
    }
  }

  async function claimPendingLamp() {
    const pending = getPendingLamp();
    if (!pending) return;
    clearPendingLamp();

    const { formData, year } = pending;
    const svc = window.MyChartsService;
    if (!svc || typeof svc.saveChartWithData !== "function") {
      alert("儲存命盤失敗，請稍後再試。");
      return;
    }

    const saveResult = await svc.saveChartWithData(formData, "本人");
    if (!saveResult.ok) {
      alert(saveResult.error || "儲存命盤失敗");
      return;
    }

    openLampModal();
    const lampIcon = document.querySelector("#lampModalLamp .lamp-icon");
    if (lampIcon) requestAnimationFrame(function () { lampIcon.classList.add("lit"); });

    try {
      var lampPayload2 = { year };
      var lampUrl2 = getApiUrl("/api/taisui/lamp");
      console.log("📡 API REQUEST", lampUrl2, JSON.stringify(lampPayload2, null, 2));
      const r = await fetch(lampUrl2, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(lampPayload2),
      });
      const data = await r.json();

      if (!r.ok) {
        closeLampModal();
        alert(data.error || "點燈失敗");
        return;
      }

      setTimeout(function () {
        showLampResult({
          guardianPhrase: data.guardianPhrase,
          imageUrl: data.imageUrl || null,
          year,
          flowStemBranch: data.flowStemBranch || "",
          zodiac: data.zodiac || "",
        });
      }, 1500);

      var auth = window.AuthService || window.UiServices?.AuthService;
      if (auth && typeof auth.refreshBadges === "function") auth.refreshBadges();

      if (window.UiComponents?.TaisuiCard?.renderTaisuiCard) {
        const vy = formData.birth_date ? parseInt(String(formData.birth_date).slice(0, 4), 10) : null;
        const birthDate = formData.birth_date && /^\d{4}-\d{2}-\d{2}$/.test(String(formData.birth_date).trim()) ? formData.birth_date.trim() : null;
        window.UiComponents.TaisuiCard.renderTaisuiCard(vy, year, { birth_date: birthDate });
      }
    } catch (err) {
      console.error("[taisui-card] claimPendingLamp error:", err);
      closeLampModal();
      alert("點燈失敗，請稍後再試");
    }
  }

  window.addEventListener("auth-state-changed", function (e) {
    if (e.detail && e.detail.loggedIn) {
      try {
        if (sessionStorage.getItem(PENDING_LAMP_ACTION)) {
          claimPendingLamp();
        }
      } catch (_) {}
    }
  });

  window.UiComponents = window.UiComponents || {};
  window.UiComponents.TaisuiCard = {
    renderTaisuiCard,
  };
})();
