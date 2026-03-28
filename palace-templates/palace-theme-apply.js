/**
 * Applies palace-theme-presets.json: sets html[data-palace], SVG path d, title/subtitle/symbol.
 * Expects path ids: pmso-yang-trunk, pmso-yang-flow, pmso-yin-trunk, pmso-yin-flow
 * and elements: #vm-title, #vm-subtitle, #vm-palace-symbol (optional)
 */
(function () {
  const PATH_IDS = [
    ["pmso-yang-trunk", "yangTrunk"],
    ["pmso-yang-flow", "yangFlow"],
    ["pmso-yin-trunk", "yinTrunk"],
    ["pmso-yin-flow", "yinFlow"],
  ];

  /** Vite dev serves only `public/` at `/`; repo-root `palace-templates/` works with `npx serve .` */
  function presetUrls() {
    var href = window.location.href;
    return [
      new URL("palace-templates/palace-theme-presets.json", href).href,
      new URL("/palace-templates/palace-theme-presets.json", window.location.origin).href,
    ];
  }

  function initialPalaceId(keys) {
    var q = new URLSearchParams(window.location.search).get("palace");
    if (q && keys.indexOf(q) !== -1) return q;
    var h = window.location.hash.replace(/^#/, "");
    if (h && keys.indexOf(h) !== -1) return h;
    return keys.indexOf("ming") !== -1 ? "ming" : keys[0];
  }

  function apply(data, palaceId) {
    var row = data.palaces[palaceId];
    if (!row) return;
    var fam = data.lifelineFamilies[row.lifelineFamily];
    if (!fam) return;

    document.documentElement.setAttribute("data-palace", palaceId);

    PATH_IDS.forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el) el.setAttribute("d", fam[pair[1]]);
    });

    var title = document.getElementById("vm-title");
    if (title) title.textContent = row.displayNameZh;

    var sub = document.getElementById("vm-subtitle");
    if (sub) sub.textContent = row.subtitleZh;

    var sym = document.getElementById("vm-palace-symbol");
    if (sym) sym.textContent = row.symbolGlyph || "";

    document.title = row.displayNameZh + " · 宮位視覺預覽";

    var sel = document.getElementById("palace-theme-select");
    if (sel && sel.value !== palaceId) sel.value = palaceId;

    try {
      var next = new URL(window.location.href);
      next.searchParams.set("palace", palaceId);
      window.history.replaceState({}, "", next.toString());
    } catch (e) {
      /* file:// or restricted */
    }
  }

  function fillSelect(data) {
    var sel = document.getElementById("palace-theme-select");
    if (!sel) return;
    var keys = Object.keys(data.palaces);
    keys.forEach(function (id) {
      var opt = document.createElement("option");
      opt.value = id;
      opt.textContent = data.palaces[id].displayNameZh;
      sel.appendChild(opt);
    });
  }

  window.applyPalaceThemeFromPresets = function (data, palaceId) {
    apply(data, palaceId);
  };

  window.initPalaceThemeSwitcher = function (data) {
    var keys = Object.keys(data.palaces);
    fillSelect(data);
    var palaceId = initialPalaceId(keys);
    apply(data, palaceId);

    var sel = document.getElementById("palace-theme-select");
    if (sel) {
      sel.addEventListener("change", function () {
        apply(data, sel.value);
      });
    }
  };

  function fetchPresetsSequential(urls, index) {
    if (index >= urls.length) {
      return Promise.reject(new Error("palace-theme-presets.json: all URLs failed"));
    }
    return fetch(urls[index], { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) return fetchPresetsSequential(urls, index + 1);
        return r.json();
      })
      .catch(function () {
        return fetchPresetsSequential(urls, index + 1);
      });
  }

  window.loadPalaceThemePresets = function () {
    return fetchPresetsSequential(presetUrls(), 0)
      .then(function (data) {
        var errEl = document.getElementById("palace-theme-load-error");
        if (errEl) errEl.textContent = "";
        if (typeof window.initPalaceThemeSwitcher === "function") {
          window.initPalaceThemeSwitcher(data);
        }
        return data;
      })
      .catch(function (err) {
        console.warn("[palace-theme]", err.message);
        var errEl = document.getElementById("palace-theme-load-error");
        if (errEl) {
          errEl.textContent =
            "主題設定載入失敗（生命線／標題可能未更新）。Vite 請執行：npm run sync:palace-static。詳情：" +
            (err && err.message ? err.message : String(err));
        }
      });
  };
})();
