/* section-collapse.js
 * 手機版章節折疊、桌機全部展開
 * 導出到 window.UiServices.SectionCollapse
 */

(function () {
  "use strict";

  const MQ = "(min-width: 768px)";

  function initSectionCollapse() {
    const sections = document.querySelectorAll(".workspace-section[data-section]");
    const pillarsAccordion = document.getElementById("pillarsAccordion");
    const media = window.matchMedia(MQ);
    const initKey = "data-section-collapse-inited";
    if (sections.length && sections[0].hasAttribute(initKey)) return;
    sections.forEach((s) => s.setAttribute(initKey, ""));

    function applyDesktop() {
      sections.forEach((sec) => {
        sec.classList.remove("section-collapsed");
        sec.querySelector(".section-body")?.classList.remove("hidden");
        const icon = sec.querySelector(".section-toggle-icon");
        if (icon) icon.textContent = "▼";
      });
      if (pillarsAccordion) pillarsAccordion.setAttribute("open", "");
    }

    function applyMobile() {
      sections.forEach((sec, i) => {
        const body = sec.querySelector(".section-body");
        const icon = sec.querySelector(".section-toggle-icon");
        const sectionId = sec.getAttribute("data-section");
        const isDao = sectionId === "dao";
        const isAct = sectionId === "act";
        if (isDao || isAct) {
          sec.classList.remove("section-collapsed");
          if (body) body.classList.remove("hidden");
          if (icon) icon.textContent = "▼";
        } else {
          sec.classList.add("section-collapsed");
          if (body) body.classList.add("hidden");
          if (icon) icon.textContent = "▶";
        }
      });
      if (pillarsAccordion) pillarsAccordion.removeAttribute("open");
    }

    function toggleSection(sec) {
      if (media.matches) return;
      const body = sec.querySelector(".section-body");
      const icon = sec.querySelector(".section-toggle-icon");
      const collapsed = sec.classList.toggle("section-collapsed");
      if (body) body.classList.toggle("hidden", collapsed);
      if (icon) icon.textContent = collapsed ? "▶" : "▼";
    }

    sections.forEach((sec) => {
      const header = sec.querySelector("[data-section-toggle]");
      if (header) {
        header.addEventListener("click", () => toggleSection(sec));
      }
    });

    function onResize() {
      if (media.matches) applyDesktop();
      else applyMobile();
    }
    media.addEventListener("change", onResize);
    onResize();
  }

  if (!window.UiServices) window.UiServices = {};
  window.UiServices.SectionCollapse = { initSectionCollapse };
})();
