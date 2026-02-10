/**
 * 我的命盤：列表、切換、儲存、刪除
 * - 依賴 AuthService（getAuthHeaders、isLoggedIn、handle401、updateUI）
 * - 依賴 window.runCalculation（填入表單後觸發計算）
 */
(function () {
  "use strict";

  var API_ME_CHARTS = "/api/me/charts";

  function pad2(n) {
    n = Number(n);
    return n < 10 ? "0" + n : String(n);
  }

  /** 從表單讀取 birth_date（YYYY-MM-DD）、birth_time（exact:HH:mm 或 shichen:子:upper）、gender */
  function getCurrentFormData() {
    var y = document.getElementById("birthYear");
    var m = document.getElementById("birthMonth");
    var d = document.getElementById("birthDay");
    var timeMode = document.getElementById("timeMode");
    var h = document.getElementById("birthHour");
    var min = document.getElementById("birthMinute");
    var shichen = document.getElementById("birthShichen");
    var shichenHalf = document.getElementById("birthShichenHalf");
    var gender = document.getElementById("gender");
    if (!y || !m || !d || !timeMode || !gender) return null;
    var vy = Number(y.value);
    var vm = Number(m.value);
    var vd = Number(d.value);
    var birthDate = y.value + "-" + pad2(vm) + "-" + pad2(vd);
    var birthTime;
    if ((timeMode.value || "").trim() === "shichen" && shichen && shichenHalf) {
      birthTime = "shichen:" + (shichen.value || "子") + ":" + (shichenHalf.value || "upper");
    } else {
      var vh = Number(h && h.value !== undefined ? h.value : 12);
      var vmin = Number(min && min.value !== undefined ? min.value : 0);
      birthTime = "exact:" + pad2(vh) + ":" + pad2(vmin);
    }
    var g = (gender.value || "").trim();
    return { birth_date: birthDate, birth_time: birthTime, gender: g || "M" };
  }

  /** 解析 birth_time 字串 */
  function parseBirthTime(bt) {
    if (!bt || typeof bt !== "string") return { mode: "exact", hour: 12, minute: 0 };
    if (bt.indexOf("shichen:") === 0) {
      var parts = bt.split(":");
      return {
        mode: "shichen",
        shichen: parts[1] || "子",
        half: parts[2] || "upper",
      };
    }
    if (bt.indexOf("exact:") === 0) {
      var p = bt.slice(6).split(":");
      return {
        mode: "exact",
        hour: parseInt(p[0], 10) || 12,
        minute: parseInt(p[1], 10) || 0,
      };
    }
    return { mode: "exact", hour: 12, minute: 0 };
  }

  /** 將一筆命盤帶入表單（並觸發日數/時間模式 UI 更新） */
  function setFormFromChart(chart) {
    var birthDate = chart.birth_date || "";
    var birthTime = chart.birth_time || "";
    var gender = (chart.gender || "M").trim();

    var yEl = document.getElementById("birthYear");
    var mEl = document.getElementById("birthMonth");
    var dEl = document.getElementById("birthDay");
    var timeModeEl = document.getElementById("timeMode");
    var hEl = document.getElementById("birthHour");
    var minEl = document.getElementById("birthMinute");
    var shichenEl = document.getElementById("birthShichen");
    var shichenHalfEl = document.getElementById("birthShichenHalf");
    var genderEl = document.getElementById("gender");

    if (!yEl || !mEl || !dEl || !timeModeEl || !genderEl) return;

    var dateParts = birthDate.split("-");
    if (dateParts.length >= 3) {
      yEl.value = dateParts[0];
      mEl.value = String(Number(dateParts[1]));
      yEl.dispatchEvent(new Event("change", { bubbles: true }));
      mEl.dispatchEvent(new Event("change", { bubbles: true }));
      dEl.value = String(Number(dateParts[2]));
    }

    var parsed = parseBirthTime(birthTime);
    if (parsed.mode === "shichen") {
      timeModeEl.value = "shichen";
      if (shichenEl) shichenEl.value = parsed.shichen || "子";
      if (shichenHalfEl) shichenHalfEl.value = parsed.half || "upper";
    } else {
      timeModeEl.value = "exact";
      if (hEl) hEl.value = String(parsed.hour);
      if (minEl) minEl.value = pad2(parsed.minute);
    }
    timeModeEl.dispatchEvent(new Event("change", { bubbles: true }));
    genderEl.value = gender;
  }

  /** 帶入表單並觸發計算 */
  function loadChart(chart) {
    setFormFromChart(chart);
    if (typeof window.runCalculation === "function") {
      window.runCalculation();
    }
  }

  function fetchCharts() {
    var auth = window.AuthService;
    if (!auth || !auth.getAuthHeaders) return Promise.resolve([]);
    var headers = auth.getAuthHeaders();
    if (!headers.Authorization) return Promise.resolve([]);
    var base = window.location.origin;
    return fetch(base + API_ME_CHARTS, { method: 'GET', headers })
      .then(function (res) {
        if (res.status === 401) {
          console.warn('[MyCharts] GET /api/me/charts 回傳 401，請確認正式機已設定 JWT_SECRET');
          return [];
        }
        return res.json().then(function (data) {
          return (data && data.charts) || [];
        });
      })
      .catch(function () {
        return [];
      });
  }

  function renderList(charts) {
    var listEl = document.getElementById("myChartsList");
    var emptyEl = document.getElementById("myChartsEmpty");
    if (!listEl) return;
    listEl.innerHTML = "";
    if (emptyEl) {
      emptyEl.classList.toggle("hidden", charts.length > 0);
    }
    charts.forEach(function (chart) {
      var row = document.createElement("div");
      row.className = "flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-white/5 border border-amber-400/20";
      var labelBtn = document.createElement("button");
      labelBtn.type = "button";
      labelBtn.className = "flex-1 text-left text-amber-200 hover:text-amber-300 font-medium truncate cursor-pointer py-2 px-3 rounded-lg hover:bg-amber-500/10 border border-transparent hover:border-amber-400/30 transition";
      labelBtn.textContent = (chart.label || "未命名") + "　→ 點我載入";
      labelBtn.setAttribute("aria-label", "載入命盤：" + (chart.label || "未命名"));
      labelBtn.addEventListener("click", function () {
        loadChart(chart);
      });
      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "text-slate-400 hover:text-red-400 text-sm px-2 py-1 rounded";
      delBtn.textContent = "刪除";
      delBtn.setAttribute("aria-label", "刪除此命盤");
      delBtn.addEventListener("click", function () {
        if (window.confirm("確定要刪除「" + (chart.label || "此筆") + "」嗎？")) {
          deleteChart(chart.id);
        }
      });
      row.appendChild(labelBtn);
      row.appendChild(delBtn);
      listEl.appendChild(row);
    });
  }

  function refreshList() {
    fetchCharts().then(renderList);
  }

  function saveCurrentChart(label) {
    var auth = window.AuthService;
    if (!auth || !auth.getAuthHeaders) return;
    var formData = getCurrentFormData();
    if (!formData) return;
    var body = {
      label: (label || "").trim() || "未命名",
      birth_date: formData.birth_date,
      birth_time: formData.birth_time,
      gender: formData.gender,
    };
    var base = window.location.origin;
    fetch(base + API_ME_CHARTS, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, auth.getAuthHeaders()),
      body: JSON.stringify(body),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (result.status === 401) {
          window.alert("儲存失敗，登入可能已過期，請試著登出後重新登入。");
          return;
        }
        if (!result.ok) {
          if (result.data && result.data.error === "MAX_CHARTS") {
            window.alert("最多 5 筆命盤，請先刪除舊的再儲存。");
          } else {
            window.alert((result.data && result.data.message) || (result.data && result.data.error) || "儲存失敗");
          }
          return;
        }
        refreshList();
      })
      .catch(function () {
        window.alert("儲存失敗，請稍後再試。");
      });
  }

  function deleteChart(id) {
    var auth = window.AuthService;
    if (!auth || !auth.getAuthHeaders) return;
    var base = window.location.origin;
    fetch(base + API_ME_CHARTS + "/" + encodeURIComponent(id), {
      method: "DELETE",
      headers: auth.getAuthHeaders(),
    })
      .then(function (res) {
        if (res.status === 401) {
          window.alert("刪除失敗，登入可能已過期，請試著登出後重新登入。");
          return;
        }
        if (res.ok || res.status === 204) refreshList();
      })
      .catch(function () {
        window.alert("刪除失敗，請稍後再試。");
      });
  }

  function setSectionVisibility(loggedIn) {
    var section = document.getElementById("myChartsSection");
    var saveWrap = document.getElementById("saveChartWrap");
    if (section) section.classList.toggle("hidden", !loggedIn);
    if (saveWrap) saveWrap.classList.toggle("hidden", !loggedIn);
    if (loggedIn) refreshList();
  }

  function init() {
    var auth = window.AuthService;
    if (!auth) return;
    setSectionVisibility(auth.isLoggedIn());

    window.addEventListener("auth-state-changed", function (e) {
      setSectionVisibility(e.detail && e.detail.loggedIn);
    });

    var btnSave = document.getElementById("btnSaveChart");
    if (btnSave) {
      btnSave.addEventListener("click", function () {
        if (!auth.isLoggedIn()) return;
        var label = window.prompt("為這份命盤取個名稱（例如：本人、媽媽）", "本人");
        if (label === null) return;
        saveCurrentChart(label || "未命名");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 100);
    });
  } else {
    setTimeout(init, 100);
  }

  window.MyChartsService = {
    getCurrentFormData: getCurrentFormData,
    setFormFromChart: setFormFromChart,
    loadChart: loadChart,
    fetchCharts: fetchCharts,
    renderList: renderList,
    refreshList: refreshList,
    saveCurrentChart: saveCurrentChart,
    deleteChart: deleteChart,
    init: init,
  };
})();
