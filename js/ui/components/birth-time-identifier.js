/* birth-time-identifier.js
 * 出生时间识别组件
 * 导出到 window.UiComponents.BirthTimeIdentifier
 * 依赖: window.IdentifyBirthTime, window.UiServices.SoundService, window.UiConstants.Ceremony
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  /**
   * 初始化出生时间识别功能
   */
  function initIdentifyBirthTime() {
    if (typeof window.IdentifyBirthTime === "undefined") return;

    const btn = document.getElementById("btnIdentifyBirthTime");
    const modal = document.getElementById("identifyBirthTimeModal");
    const backdrop = document.getElementById("identifyBirthTimeBackdrop");
    const form = document.getElementById("identifyBirthTimeForm");
    const questionsEl = document.getElementById("identifyBirthTimeQuestions");
    const progressText = document.getElementById("identifyBirthTimeProgressText");
    const progressBar = document.getElementById("identifyBirthTimeProgressBar");
    const prevBtn = document.getElementById("identifyBirthTimePrev");
    const nextBtn = document.getElementById("identifyBirthTimeNext");
    const submitBtn = document.getElementById("identifyBirthTimeSubmit");
    const closeBtn = document.getElementById("identifyBirthTimeClose");

    const timeMode = document.getElementById("timeMode");
    const exactRow = document.getElementById("exactTimeRow");
    const shichenRow = document.getElementById("shichenRow");
    const birthShichen = document.getElementById("birthShichen");
    const birthShichenHalf = document.getElementById("birthShichenHalf");

    const ceremonyBackdrop = document.getElementById("ceremonyBackdrop");
    const ceremonyModal = document.getElementById("ceremonyModal");
    const ceremonyLine0 = document.getElementById("ceremonyLine0");
    const ceremonyLine1 = document.getElementById("ceremonyLine1");
    const ceremonyLine2 = document.getElementById("ceremonyLine2");
    const ceremonyConfirm = document.getElementById("ceremonyConfirm");

    var pendingCeremonyResult = null;
    var ceremonyTypewriterTimer = null;

    if (!modal || !backdrop || !form || !questionsEl) return;

    var questions = window.IdentifyBirthTime.questions;
    var total = questions.length;
    var currentIndex = 0;
    var answers = {};

    // 获取依赖
    const SoundService = window.UiServices?.SoundService || {};
    const playSyncSound = SoundService.playSyncSound || function() {};
    const Ceremony = window.UiConstants?.Ceremony || {};
    const CEREMONY_PERSONALITY_KEYS = Ceremony.CEREMONY_PERSONALITY_KEYS || {
      "子": "在世界安靜下來的瞬間，你能看見別人忽略的真相；這份深邃的洞察，讓你在人群中永遠不會被混淆。",
      "丑": "在壓力逼近的瞬間，你反而能站得更穩、扛得更久；這份沈穩的韌性，讓你在人群中永遠不會被混淆。",
      "寅": "在一切還沒開始的瞬間，你已經踏上荒野；這份開拓的爆發力，讓你在人群中永遠不會被混淆。",
      "卯": "在情緒開始流動的瞬間，你讓人安心敞開；這份優雅的共感，讓你在人群中永遠不會被混淆。",
      "辰": "在混亂剛要發生的瞬間，你看見更高的全局；這份遼闊的視野，讓你在人群中永遠不會被混淆。",
      "巳": "在變化降臨的瞬間，你能立刻切換生存模式；這份極致的靈活，讓你在人群中永遠不會被混淆。",
      "午": "在所有目光聚來的瞬間，你自然站在光線中心；這份天生的光芒，讓你在人群中永遠不會被混淆。",
      "未": "在資源開始累積的瞬間，你默默讓荒蕪成形；這份安定的力量，讓你在人群中永遠不會被混淆。",
      "申": "在任務變得複雜的瞬間，你能將所有邏輯重排；這份理性的精準，讓你在人群中永遠不會被混淆。",
      "酉": "在細節浮現的瞬間，你一眼就能找到缺口；這份銳利的品味，讓你在人群中永遠不會被混淆。",
      "戌": "在界線被踩到的瞬間，你明確守護自己的立場；這份堅定的原則，讓你在人群中永遠不會被混淆。",
      "亥": "在靈感閃過的瞬間，你將碎片拼湊成整體；這份超然的直覺，讓你在人群中永遠不會被混淆。",
    };

    function esc(s) {
      if (window.Utils?.escHtml) {
        return window.Utils.escHtml(s);
      }
      if (s == null) return "";
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function openModal() {
      var auth = window.AuthService;
      if (!auth || !auth.isLoggedIn || !auth.isLoggedIn()) {
        try { sessionStorage.setItem("openEstimateHourAfterLogin", "1"); } catch (_) {}
        if (auth && auth.triggerLogin) auth.triggerLogin();
        return;
      }
      currentIndex = 0;
      answers = {};
      if (timeMode && timeMode.value !== "shichen") {
        timeMode.value = "shichen";
        timeMode.dispatchEvent(new Event("change"));
      }
      if (exactRow) exactRow.classList.add("hidden");
      if (shichenRow) shichenRow.classList.remove("hidden");
      backdrop.classList.remove("hidden");
      backdrop.setAttribute("aria-hidden", "false");
      modal.classList.remove("hidden");
      renderQuestion(0);
      updateProgress(0);
      updateButtons();
    }

    function closeModal() {
      backdrop.classList.add("hidden");
      backdrop.setAttribute("aria-hidden", "true");
      modal.classList.add("hidden");
    }

    function closeCeremony() {
      if (ceremonyBackdrop) ceremonyBackdrop.classList.remove("ceremony-visible");
      if (ceremonyModal) ceremonyModal.classList.remove("ceremony-visible");
      if (ceremonyTypewriterTimer) {
        clearTimeout(ceremonyTypewriterTimer);
        ceremonyTypewriterTimer = null;
      }
    }

    function openCeremony(result) {
      var branch = result && result.branch ? result.branch : "子";
      var half = result && result.half === "lower" ? "lower" : "upper";
      var text = CEREMONY_PERSONALITY_KEYS[branch] || CEREMONY_PERSONALITY_KEYS["子"];
      pendingCeremonyResult = {
        branch: branch,
        half: half,
        hour_label: result && result.hour_label,
        hour_range: result && result.hour_range,
        log_id: result && result.log_id,
      };

      var feedbackWrap = document.getElementById("ceremonyFeedbackWrap");
      var feedbackActualWrap = document.getElementById("ceremonyFeedbackActualWrap");
      if (feedbackWrap) feedbackWrap.classList.add("hidden");
      if (feedbackActualWrap) feedbackActualWrap.classList.add("hidden");

      closeModal();
      var hourLabel = (result && result.hour_label) ? result.hour_label : branch + "時";
      if (ceremonyLine0) ceremonyLine0.textContent = "推算結果：你是" + hourLabel;
      if (ceremonyLine1) ceremonyLine1.textContent = "";
      if (ceremonyLine2) ceremonyLine2.textContent = "";
      if (ceremonyConfirm) {
        ceremonyConfirm.style.opacity = "0";
        ceremonyConfirm.disabled = true;
      }

      if (ceremonyBackdrop) ceremonyBackdrop.classList.add("ceremony-visible");
      if (ceremonyModal) ceremonyModal.classList.add("ceremony-visible");

      if (ceremonyLine1) ceremonyLine1.textContent = "[ 系統鑑定 ]";
      ceremonyTypewriterTimer = setTimeout(function () {
        ceremonyTypewriterTimer = null;
        var idx = 0;
        var step = 55;
        function tick() {
          if (idx >= text.length) {
            if (ceremonyConfirm) {
              ceremonyConfirm.style.opacity = "1";
              ceremonyConfirm.disabled = false;
            }
            if (pendingCeremonyResult && pendingCeremonyResult.log_id && feedbackWrap) {
              feedbackWrap.classList.remove("hidden");
            }
            return;
          }
          if (ceremonyLine2) ceremonyLine2.textContent = text.slice(0, idx + 1);
          idx += 1;
          ceremonyTypewriterTimer = setTimeout(tick, step);
        }
        ceremonyTypewriterTimer = setTimeout(tick, step);
      }, 500);
    }

    function saveCurrentAnswer() {
      var q = questions[currentIndex];
      if (!q) return;
      if (q.multiSelect && q.maxSelect) {
        var checked = form.querySelectorAll('input[name="' + q.id + '"]:checked');
        answers[q.id] = Array.prototype.slice.call(checked, 0, q.maxSelect).map(function (el) { return el.value; });
      } else {
        var input = form.querySelector('input[name="' + q.id + '"]:checked');
        answers[q.id] = input ? input.value : undefined;
      }
    }

    function renderQuestion(index) {
      if (index < 0 || index >= total) return;
      var q = questions[index];
      var saved = answers[q.id];
      var isMulti = q.multiSelect && q.maxSelect;
      var html = '<fieldset class="border border-white/10 rounded-xl p-3"><legend class="text-xs font-bold text-slate-300 mb-2">' + esc(q.text) + "</legend>";
      if (isMulti) html += '<p class="text-[10px] text-slate-500 mb-2">可複選，最多 ' + q.maxSelect + ' 項</p>';
      q.options.forEach(function (opt) {
        var id = "identify_" + q.id + "_" + opt.key;
        var checked = false;
        if (isMulti && Array.isArray(saved)) checked = saved.indexOf(opt.key) !== -1;
        else if (!isMulti) checked = saved === opt.key;
        var checkedAttr = checked ? ' checked="checked"' : "";
        var type = isMulti ? "checkbox" : "radio";
        html += '<label class="flex items-center gap-2 py-1 cursor-pointer"><input type="' + type + '" name="' + q.id + '" value="' + opt.key + '" id="' + id + '" class="rounded-full"' + checkedAttr + ' />';
        html += '<span class="text-xs text-slate-200">' + esc(opt.text) + "</span></label>";
      });
      html += "</fieldset>";
      questionsEl.innerHTML = html;
      if (isMulti) {
        form.querySelectorAll('input[name="' + q.id + '"]').forEach(function (input) {
          input.addEventListener("change", function () {
            var checked = form.querySelectorAll('input[name="' + q.id + '"]:checked');
            if (checked.length > q.maxSelect) this.checked = false;
            updateButtons();
          });
        });
      }
      bindCurrentQuestionChange();
    }

    function bindCurrentQuestionChange() {
      var q = questions[currentIndex];
      if (!q || q.multiSelect) return;
      form.querySelectorAll('input[name="' + q.id + '"]').forEach(function (input) {
        input.addEventListener("change", updateButtons);
      });
    }

    function updateProgress(index) {
      var n = index + 1;
      var pct = total > 0 ? Math.round((n / total) * 100) : 0;
      if (progressText) progressText.textContent = "第 " + n + " / " + total + " 題";
      if (progressBar) progressBar.style.width = pct + "%";
    }

    function hasCurrentAnswer() {
      var q = questions[currentIndex];
      if (!q) return false;
      if (q.multiSelect && q.maxSelect) {
        var checked = form.querySelectorAll('input[name="' + q.id + '"]:checked');
        return checked.length > 0;
      }
      var input = form.querySelector('input[name="' + q.id + '"]:checked');
      return !!input;
    }

    function updateButtons() {
      if (prevBtn) prevBtn.disabled = currentIndex <= 0;
      if (nextBtn) {
        nextBtn.classList.toggle("hidden", currentIndex >= total - 1);
        nextBtn.disabled = currentIndex >= total - 1 || !hasCurrentAnswer();
      }
      if (submitBtn) {
        submitBtn.classList.toggle("hidden", currentIndex < total - 1);
        submitBtn.disabled = currentIndex < total - 1 || !hasCurrentAnswer();
      }
    }

    function goNext() {
      if (!hasCurrentAnswer()) return;
      saveCurrentAnswer();
      if (currentIndex >= total - 1) return;
      currentIndex++;
      renderQuestion(currentIndex);
      updateProgress(currentIndex);
      updateButtons();
      bindCurrentQuestionChange();
    }

    function goPrev() {
      if (currentIndex <= 0) return;
      saveCurrentAnswer();
      currentIndex--;
      renderQuestion(currentIndex);
      updateProgress(currentIndex);
      updateButtons();
    }

    if (prevBtn) prevBtn.addEventListener("click", goPrev);
    if (nextBtn) nextBtn.addEventListener("click", goNext);

    if (btn) btn.addEventListener("click", openModal);
    var btnGlobal = document.getElementById("btnIdentifyBirthTimeGlobal");
    if (btnGlobal) btnGlobal.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);

    window.addEventListener("auth-state-changed", function (e) {
      if (e.detail && e.detail.loggedIn) {
        try {
          if (sessionStorage.getItem("openEstimateHourAfterLogin")) {
            sessionStorage.removeItem("openEstimateHourAfterLogin");
            setTimeout(openModal, 100);
          }
        } catch (_) {}
      }
    });

    if (ceremonyConfirm) {
      ceremonyConfirm.addEventListener("click", function () {
        playSyncSound();
        if (pendingCeremonyResult) {
          if (birthShichen) birthShichen.value = pendingCeremonyResult.branch;
          if (birthShichenHalf) birthShichenHalf.value = pendingCeremonyResult.half;
          var hint = document.getElementById("hint");
          var r = pendingCeremonyResult;
          if (hint) hint.textContent = "推算結果：" + (r.hour_label || r.branch + "時") + (r.hour_range ? "（" + r.hour_range + "）" : "") + "，已選" + (r.half === "lower" ? "下半" : "上半") + "時辰。可改選後再排盤。";
          pendingCeremonyResult = null;
        }
        closeCeremony();
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      saveCurrentAnswer();
      var auth = window.AuthService;
      var headers = auth && auth.getAuthHeaders ? auth.getAuthHeaders() : {};
      if (!headers.Authorization) {
        window.alert("請先登入以使用推算時辰功能。");
        return;
      }
      var submitBtnEl = document.getElementById("identifyBirthTimeSubmit");
      if (submitBtnEl) submitBtnEl.disabled = true;
      var origin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";
      fetch(origin + "/api/me/estimate-hour", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, headers),
        body: JSON.stringify({ answers: answers }),
      })
        .then(function (res) {
          return res.text().then(function (text) {
            var data = null;
            if (text && text.trim()) {
              try { data = JSON.parse(text); } catch (_) {}
            }
            if (!res.ok) throw new Error(data && data.error ? data.error : "推算失敗（" + res.status + (text ? ": " + text.slice(0, 80) : "") + "）");
            if (!data) throw new Error("伺服器未回傳有效資料（" + res.status + "）");
            return data;
          });
        })
        .then(function (data) {
          openCeremony({
            branch: data.branch,
            hour_label: data.hour_label,
            hour_range: data.hour_range,
            half: data.half,
            log_id: data.log_id,
          });
        })
        .catch(function (err) {
          var hint = document.getElementById("hint");
          if (hint) hint.textContent = "推算失敗（" + (err && err.message ? err.message : "請稍後再試") + "）。";
        })
        .finally(function () {
          if (submitBtnEl) submitBtnEl.disabled = false;
        });
    });

    function sendFeedback(correct, actualBranch, actualHalf) {
      if (!pendingCeremonyResult || !pendingCeremonyResult.log_id) return;
      var auth = window.AuthService;
      var headers = auth && auth.getAuthHeaders ? auth.getAuthHeaders() : {};
      if (!headers.Authorization) return;
      var origin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";
      var body = { correct: correct };
      if (correct === false && actualBranch) body.actual_branch = actualBranch;
      if (correct === false && actualHalf) body.actual_half = actualHalf;
      fetch(origin + "/api/me/estimate-hour/logs/" + encodeURIComponent(pendingCeremonyResult.log_id), {
        method: "PATCH",
        headers: Object.assign({ "Content-Type": "application/json" }, headers),
        body: JSON.stringify(body),
      }).then(function () {
        var feedbackWrap = document.getElementById("ceremonyFeedbackWrap");
        var feedbackActualWrap = document.getElementById("ceremonyFeedbackActualWrap");
        if (feedbackActualWrap) feedbackActualWrap.classList.add("hidden");
        if (feedbackWrap) feedbackWrap.classList.add("hidden");
      }).catch(function () {});
    }

    var ceremonyFeedbackCorrect = document.getElementById("ceremonyFeedbackCorrect");
    var ceremonyFeedbackIncorrect = document.getElementById("ceremonyFeedbackIncorrect");
    var ceremonyFeedbackActualWrap = document.getElementById("ceremonyFeedbackActualWrap");
    var ceremonyFeedbackSubmitActual = document.getElementById("ceremonyFeedbackSubmitActual");
    if (ceremonyFeedbackCorrect) {
      ceremonyFeedbackCorrect.addEventListener("click", function () {
        sendFeedback(true);
      });
    }
    if (ceremonyFeedbackIncorrect) {
      ceremonyFeedbackIncorrect.addEventListener("click", function () {
        if (ceremonyFeedbackActualWrap) ceremonyFeedbackActualWrap.classList.remove("hidden");
      });
    }
    if (ceremonyFeedbackSubmitActual) {
      ceremonyFeedbackSubmitActual.addEventListener("click", function () {
        var branchEl = document.getElementById("ceremonyFeedbackActualBranch");
        var halfEl = document.getElementById("ceremonyFeedbackActualHalf");
        var actualBranch = branchEl ? branchEl.value : "";
        var actualHalf = halfEl ? halfEl.value : "upper";
        sendFeedback(false, actualBranch, actualHalf);
      });
    }
  }

  // 导出到 window.UiComponents.BirthTimeIdentifier
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  window.UiComponents.BirthTimeIdentifier = {
    initIdentifyBirthTime,
  };
})();
