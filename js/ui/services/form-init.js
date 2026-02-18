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
    console.warn("[form-init.js] window.Calc not found, using fallback for form init");
  }

  const SHICHEN_ORDER = (window.Calc && window.Calc.SHICHEN_ORDER) || ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const pad2 = (window.Calc && window.Calc.pad2) || function (n) { return String(n).padStart(2, "0"); };
  const PLACEHOLDER_VAL = "__";

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

    if (!y || !m || !d) {
      console.warn("[form-init.js] Form elements (birthYear/Month/Day) not found, skip init");
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
    if (h) {
      h.add(new Option(t("ui.hourPlaceholder", "請選擇時"), PLACEHOLDER_VAL));
      for (let i = 0; i < 24; i++) h.add(new Option(pad2(i) + hourSuf, i));
    }
    if (min) {
      min.add(new Option(t("ui.minutePlaceholder", "請選擇分"), PLACEHOLDER_VAL));
      for (let i = 0; i < 60; i++) {
        const v = pad2(i);
        min.add(new Option(v + minSuf, v));
      }
    }

    if (gender) {
      gender.add(new Option(t("ui.genderMale", "性別：男"), "M"));
      gender.add(new Option(t("ui.genderFemale", "性別：女"), "F"));
    }

    if (timeMode) {
      timeMode.add(new Option(t("ui.timeExact", "時間：時分（精確）"), "exact"));
      timeMode.add(new Option(t("ui.timeShichen", "時間：時辰（子丑寅…）"), "shichen"));
    }

    var timeModeToggle = document.getElementById("timeModeToggle");
    var timeModeBtns = timeModeToggle ? timeModeToggle.querySelectorAll(".time-mode-btn") : [];

    if (shichen && SHICHEN_ORDER) {
      const shichenLab = t("ui.shichenLabel", "時辰：");
      shichen.add(new Option(t("ui.shichenPlaceholder", "請選擇時辰"), PLACEHOLDER_VAL));
      SHICHEN_ORDER.forEach((c) => {
        shichen.add(new Option(shichenLab + c, c));
      });
    }

    if (shichenHalf) {
      shichenHalf.add(new Option(t("ui.shichenUpper", "上半時辰"), "upper"));
      shichenHalf.add(new Option(t("ui.shichenLower", "下半時辰"), "lower"));
    }

    function updateTimeModeUI(forceMode) {
      const mode = forceMode ?? timeMode?.value ?? "shichen";
      if (!exactRow || !shichenRow) return;
      if (timeMode) timeMode.value = mode;
      if (mode === "shichen") {
        exactRow.classList.add("hidden");
        shichenRow.classList.remove("hidden");
      } else {
        shichenRow.classList.add("hidden");
        exactRow.classList.remove("hidden");
      }
      timeModeBtns.forEach(function (btn) {
        var active = btn.getAttribute("data-value") === mode;
        btn.classList.toggle("time-mode-active", active);
      });
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
    if (h) h.value = "12";
    if (min) min.value = "00";
    if (gender) gender.value = "F";
    if (timeMode) timeMode.value = "shichen";
    if (shichen) shichen.value = PLACEHOLDER_VAL;
    if (shichenHalf) shichenHalf.value = "upper";
    updateDays();
    updateTimeModeUI();

    y.addEventListener("change", updateDays);
    m.addEventListener("change", updateDays);
    timeMode?.addEventListener("change", updateTimeModeUI);

    timeModeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var val = btn.getAttribute("data-value");
        if (timeMode && val) {
          timeMode.value = val;
          updateTimeModeUI(val);
          timeMode.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });
  }

  if (!window.UiServices) {
    window.UiServices = {};
  }

  window.UiServices.FormInit = {
    initSelectors,
  };
})();
