/* form-init.js
 * 表单初始化模块
 * 导出到 window.UiServices.FormInit
 * 依赖: window.Calc (SHICHEN_ORDER, pad2)
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  if (!window.Calc) {
    console.warn("[form-init.js] window.Calc not found, some features may not work");
  }

  const { SHICHEN_ORDER, pad2 } = window.Calc || {};

  function t(key, fallback) {
    if (window.I18n && typeof window.I18n.t === "function") return window.I18n.t(key);
    return fallback != null ? fallback : key;
  }

  /**
   * 初始化表单选择器（年、月、日、时、分、性别、时间模式等；選項文字依 i18n）
   */
  function initSelectors() {
    const y = document.getElementById("birthYear");
    const m = document.getElementById("birthMonth");
    const d = document.getElementById("birthDay");
    const h = document.getElementById("birthHour");
    const min = document.getElementById("birthMinute");
    const gender = document.getElementById("gender");
    const timeMode = document.getElementById("timeMode");
    const shichen = document.getElementById("birthShichen");
    const shichenHalf = document.getElementById("birthShichenHalf");
    const exactRow = document.getElementById("exactTimeRow");
    const shichenRow = document.getElementById("shichenRow");

    if (!pad2) {
      console.error("[form-init.js] pad2 not available from window.Calc");
      return;
    }

    const yearSuf = t("ui.yearSuffix", " 年");
    const monthSuf = t("ui.monthSuffix", " 月");
    const daySuf = t("ui.daySuffix", " 日");
    const hourSuf = t("ui.hourSuffix", " 時");
    const minSuf = t("ui.minuteSuffix", " 分");

    const nowY = new Date().getFullYear();
    for (let i = nowY; i >= 1940; i--) y.add(new Option(i + yearSuf, i));
    for (let i = 1; i <= 12; i++) m.add(new Option(i + monthSuf, i));
    for (let i = 0; i < 24; i++) h.add(new Option(pad2(i) + hourSuf, i));
    for (let i = 0; i < 60; i++) {
      const v = pad2(i);
      min.add(new Option(v + minSuf, v));
    }

    if (gender) {
      gender.add(new Option(t("ui.genderMale", "性別：男"), "M"));
      gender.add(new Option(t("ui.genderFemale", "性別：女"), "F"));
    }

    if (timeMode) {
      timeMode.add(new Option(t("ui.timeExact", "時間：時分（精確）"), "exact"));
      timeMode.add(new Option(t("ui.timeShichen", "時間：時辰（子丑寅…）"), "shichen"));
    }

    if (shichen && SHICHEN_ORDER) {
      const shichenLab = t("ui.shichenLabel", "時辰：");
      SHICHEN_ORDER.forEach((c) => {
        shichen.add(new Option(shichenLab + c, c));
      });
    }

    if (shichenHalf) {
      shichenHalf.add(new Option(t("ui.shichenUpper", "上半時辰"), "upper"));
      shichenHalf.add(new Option(t("ui.shichenLower", "下半時辰"), "lower"));
    }

    function updateTimeModeUI() {
      const mode = timeMode?.value || "exact";
      if (!exactRow || !shichenRow) return;
      if (mode === "shichen") {
        exactRow.classList.add("hidden");
        shichenRow.classList.remove("hidden");
      } else {
        shichenRow.classList.add("hidden");
        exactRow.classList.remove("hidden");
      }
    }

    function updateDays() {
      const year = Number(y.value);
      const month = Number(m.value);
      const cur = d.value;

      d.innerHTML = "";
      const days = new Date(year, month, 0).getDate();
      for (let i = 1; i <= days; i++) d.add(new Option(i + daySuf, i));
      if (cur && Number(cur) <= days) d.value = cur;
    }

    y.value = "1990";
    m.value = "1";
    h.value = "12";
    min.value = "00";
    if (gender) gender.value = "M";
    if (timeMode) timeMode.value = "exact";
    if (shichen) shichen.value = "子";
    if (shichenHalf) shichenHalf.value = "upper";
    updateDays();
    updateTimeModeUI();

    y.addEventListener("change", updateDays);
    m.addEventListener("change", updateDays);
    timeMode?.addEventListener("change", updateTimeModeUI);
  }

  // 导出到 window.UiServices.FormInit
  if (!window.UiServices) {
    window.UiServices = {};
  }

  window.UiServices.FormInit = {
    initSelectors,
  };
})();
