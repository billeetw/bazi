/* ui.js
 * 負責 DOM 綁定與 UI 狀態（bottom sheet / scroll / click 宮位）
 * 依賴 calc.js（window.Calc）。
 */

(function () {
  "use strict";

  if (typeof window === "undefined" || !window.Calc) {
    throw new Error("Missing dependency: js/calc.js (window.Calc not found)");
  }

  const {
    PALACE_DEFAULT,
    STAR_WUXING_MAP,
    CANGGAN_DATA,
    FIVE_ELEMENTS_ORDER,
    SHICHEN_ORDER,
    pad2,
    resolveBirthTime,
    toTraditionalStarName,
    getStarsForPalace,
    buildSlotsFromZiwei,
    computeRelatedPalaces,
    normalizeWxByMax,
    generateFiveElementComment,
    computeDynamicTactics,
    getHoroscopeFromAge,
    getMutagenStars,
    getPalaceScoreWithWeights,
  } = window.Calc;

  // ====== CONFIG ======
  const API_BASE = "https://17gonplay-api.billeetw.workers.dev";

  /** 取得該宮位觸發的四化列表（祿/權/科/忌）。mutagenStars = { 祿: "廉貞", 權: "破軍", ... } */
  function getSihuaForPalace(ziwei, palaceName, mutagenStars) {
    if (!ziwei || !palaceName || !mutagenStars || typeof mutagenStars !== "object") return [];
    const rawStars = getStarsForPalace(ziwei, palaceName);
    const stars = rawStars.map(toTraditionalStarName);
    const out = [];
    ["祿", "權", "科", "忌"].forEach((hua) => {
      const star = mutagenStars[hua];
      if (star && stars.includes(star)) out.push(hua);
    });
    return out;
  }

  const DEFAULT_WUXING_MEANINGS = {
    "木": { headline: "成長與規劃", content: "木代表生長、延展、規劃、學習與人際連結。木旺多主主動、願意推進；木弱常需補策略與長期布局。" },
    "火": { headline: "能見度與動能", content: "火代表表達、曝光、熱情、推動與決策速度。火旺易衝過頭、情緒決策；火弱則行動與自信不足。" },
    "土": { headline: "承接與系統", content: "土代表穩定、容器、流程、規範與持久力。土旺易沉重保守；土弱則難落地、缺乏承載。" },
    "金": { headline: "結構與界線", content: "金代表規則、切割、效率、標準與風險控制。金旺容易苛刻、壓迫；金弱則界線鬆散、執行標準不穩。" },
    "水": { headline: "流動與洞察", content: "水代表資訊、資源流動、洞察與適應。水旺常多想多變；水弱則視野變窄、資源調度不順。" },
  };

  // ====== STATE ======
  let dbContent = { palaces: {}, stars: {}, tenGods: {}, wuxing: {} };
  let contract = null;
  let selectedPalace = "命宮";
  let lastBirthYear = null;
  let lastGender = null;

  // 宮位環（以命宮為起點的 12 宮順序）
  let PALACE_RING = PALACE_DEFAULT.slice();

  /** 取得當前年齡（虛歲）：從 #currentAgeSlider 或依出生年推算 */
  function getCurrentAge() {
    const slider = document.getElementById("currentAgeSlider");
    if (slider && slider.value !== "" && Number.isFinite(Number(slider.value))) {
      return Math.max(1, Math.min(120, Number(slider.value)));
    }
    if (lastBirthYear != null) {
      return Math.max(1, new Date().getFullYear() - Number(lastBirthYear));
    }
    return 38;
  }

  /** 同步小限滑桿顯示與數值 */
  function syncAgeSliderDisplay(age) {
    const slider = document.getElementById("currentAgeSlider");
    const display = document.getElementById("currentAgeDisplay");
    const a = Math.max(1, Math.min(120, Number(age) || 38));
    if (slider) slider.value = String(a);
    if (display) display.textContent = String(a);
  }

  // ====== DOM HELPERS ======
  /** 數值緩動：僅在值實際變更時從 0（或當前值）動到目標值，支援 prefers-reduced-motion */
  function animateValue(el, to, opts) {
    if (!el || typeof to !== "number" || !Number.isFinite(to)) return;
    const duration = (opts && opts.duration != null) ? opts.duration : 450;
    const decimals = (opts && opts.decimals != null) ? opts.decimals : 1;
    const prev = el.getAttribute("data-animated-value");
    const from = prev !== null && prev !== "" ? Number(prev) : 0;
    if (from === to && prev !== null) return;
    el.setAttribute("data-animated-value", String(to));
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduced ? 0 : duration;
    const start = performance.now();
    function tick(now) {
      const t = dur <= 0 ? 1 : Math.min((now - start) / dur, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const current = from + (to - from) * eased;
      el.textContent = current.toFixed(decimals);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = to.toFixed(decimals);
    }
    requestAnimationFrame(tick);
  }

  /** 橫向五行能量條，可標記 [最強] [最弱]；數值使用 AnimatedNumber 緩動 */
  function renderBar(targetId, data, max, opts) {
    const box = document.getElementById(targetId);
    if (!box) return;
    const strongest = opts?.strongest ?? null;
    const weakest = opts?.weakest ?? null;
    box.innerHTML = "";
    ["木", "火", "土", "金", "水"].forEach((e) => {
      const v = Number(data?.[e] || 0);
      const w = max ? Math.max(3, (v / max) * 100) : 0;
      const tag = e === strongest ? " <span class=\"text-amber-400 text-[10px] font-black\">[ 最強 ]</span>" : e === weakest ? " <span class=\"text-slate-400 text-[10px] font-black\">[ 最弱 ]</span>" : "";
      box.innerHTML += `
        <div class="mb-1 wx-row">
          <div class="flex justify-between text-xs text-slate-300">
            <span class="font-bold">${e}${tag}</span>
            <span class="font-mono wx-value" data-value="${v}">0</span>
          </div>
          <div class="h-2 bg-white/10 rounded overflow-hidden">
            <div class="h-full wuxing-${e} wx-bar-inner" style="width:${w}%"></div>
          </div>
        </div>
      `;
    });
    box.querySelectorAll(".wx-value").forEach((span, i) => {
      const v = Number(data?.[["木", "火", "土", "金", "水"][i]] || 0);
      animateValue(span, v, { duration: 400, decimals: 1 });
    });
  }

  function toneClass(tone) {
    if (tone === "red") return "border-red-400/60 bg-red-500/10 text-red-100";
    if (tone === "blue") return "border-blue-400/60 bg-blue-500/10 text-blue-100";
    if (tone === "green") return "border-emerald-400/60 bg-emerald-500/10 text-emerald-100";
    if (tone === "slate") return "border-slate-400/40 bg-white/5 text-slate-100";
    return "border-amber-400/60 bg-amber-500/10 text-amber-100";
  }

  function renderWuxingMeaningBox() {
    const box = document.getElementById("wuxingMeaningBox");
    if (!box) return;
    box.innerHTML = "";
    const src = (dbContent.wuxing && Object.keys(dbContent.wuxing).length) ? dbContent.wuxing : DEFAULT_WUXING_MEANINGS;

    ["木", "火", "土", "金", "水"].forEach((el) => {
      const item = src[el] || DEFAULT_WUXING_MEANINGS[el];
      box.innerHTML += `
        <div class="p-3 rounded-xl border border-white/10 bg-white/5">
          <div class="flex items-center justify-between">
            <div class="font-black text-slate-100">${el}</div>
            <div class="text-[10px] text-slate-400">${item?.headline || ""}</div>
          </div>
          <div class="text-xs text-slate-300 mt-2 leading-relaxed">${item?.content || ""}</div>
        </div>
      `;
    });
  }

  // ====== Radar Chart (SVG) ======
  function renderRadarChart(containerId, wx) {
    const box = document.getElementById(containerId);
    if (!box) return;

    const { order, raw, normalized } = normalizeWxByMax(wx, FIVE_ELEMENTS_ORDER);

    const size = 220;
    const cx = size / 2;
    const cy = size / 2;
    const r = 78;

    const startAngle = -Math.PI / 2; // 由上方開始
    const step = (Math.PI * 2) / order.length;

    function polar(angle, radius) {
      return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
    }

    function pointsForLevel(levelPct) {
      return order
        .map((_, i) => {
          const a = startAngle + step * i;
          const p = polar(a, (r * levelPct) / 100);
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        })
        .join(" ");
    }

    const gridLevels = [20, 40, 60, 80, 100];
    const gridPolys = gridLevels
      .map((lvl) => `<polygon points="${pointsForLevel(lvl)}" fill="none" stroke="rgba(148,163,184,0.18)" stroke-width="1"/>`)
      .join("");

    const axisLines = order
      .map((_, i) => {
        const a = startAngle + step * i;
        const p = polar(a, r);
        return `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="rgba(148,163,184,0.18)" stroke-width="1" />`;
      })
      .join("");

    const dataPoints = order
      .map((k, i) => {
        const a = startAngle + step * i;
        const pct = Math.max(0, Math.min(100, Number(normalized[k] || 0)));
        const p = polar(a, (r * pct) / 100);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");

    const labels = order
      .map((k, i) => {
        const a = startAngle + step * i;
        const p = polar(a, r + 18);
        const v = Number(raw[k] || 0);
        return `
          <text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}"
                fill="rgba(226,232,240,0.92)" font-size="11" font-weight="800"
                text-anchor="middle" dominant-baseline="middle">
            ${k}
          </text>
          <text x="${p.x.toFixed(1)}" y="${(p.y + 12).toFixed(1)}"
                fill="rgba(148,163,184,0.9)" font-size="10"
                text-anchor="middle" dominant-baseline="middle">
            ${Number.isFinite(v) ? v.toFixed(1) : "0.0"}
          </text>
        `;
      })
      .join("");

    box.innerHTML = `
      <svg viewBox="0 0 ${size} ${size}" width="100%" height="auto" role="img" aria-label="五行雷達圖">
        ${gridPolys}
        ${axisLines}
        <polygon points="${dataPoints}"
                 fill="rgba(251,191,36,0.12)"
                 stroke="rgba(251,191,36,0.75)"
                 stroke-width="2" />
        ${labels}
      </svg>
    `;
  }

  /** 手機適配：每段不超過 20 字、增加間距，易讀 */
  function wrapForMobile(text, maxCharsPerLine) {
    if (!text) return "";
    const max = maxCharsPerLine || 20;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const segments = String(text).split("\n").map((s) => s.trim()).filter(Boolean);
    const out = [];
    segments.forEach((seg) => {
      if (!isMobile || seg.length <= max) {
        out.push(seg);
        return;
      }
      for (let i = 0; i < seg.length; i += max) {
        out.push(seg.slice(i, i + max));
      }
    });
    return out;
  }

  /** 伯彥戰略看板：一橫條（標 [最強][最弱]）+ 本局屬性 / 戰略亮點 / 系統風險 / 伯彥助推，總字數 ≤150 */
  function renderFiveElementComment(containerId, wx, kind) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (typeof window.Calc?.getBoyanBoard !== "function") {
      const c = generateFiveElementComment(wx || {});
      el.innerHTML = `<div class="text-slate-100">本局五行：最強【${c.strongest}】、最弱【${c.weakest}】。</div><div class="text-slate-300 mt-1">${c.strongComment} ${c.weakComment}</div>`;
      return;
    }

    let board;
    try {
      board = window.Calc.getBoyanBoard(wx || {});
    } catch (err) {
      console.warn("getBoyanBoard error:", err);
      const c = generateFiveElementComment(wx || {});
      el.innerHTML = `<div class="text-slate-100">本局五行：最強【${c.strongest}】、最弱【${c.weakest}】。</div><div class="text-slate-300 mt-1">${c.strongComment} ${c.weakComment}</div>`;
      return;
    }

    function escapeHtml(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    el.innerHTML = `
      <div class="boyan-board text-[11px] text-slate-200 space-y-2 leading-relaxed">
        <div class="boyan-attr">${escapeHtml(board.本局屬性 || "")}</div>
        <div class="boyan-highlight">${escapeHtml(board.戰略亮點 || "")}</div>
        <div class="boyan-risk">${escapeHtml(board.系統風險 || "")}</div>
        <div class="boyan-push text-amber-200/95 font-semibold">${escapeHtml(board.伯彥助推 || "")}</div>
      </div>
    `;
  }

  // ====== RENDER: BAZI ======
  function renderPillars(bazi) {
    const grid = document.getElementById("pillarsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const disp = bazi?.display || {};
    const cols = [
      { label: "年", g: disp.yG, z: disp.yZ, dim: false },
      { label: "月", g: disp.mG, z: disp.mZ, dim: false },
      { label: "日", g: disp.dG, z: disp.dZ, dim: true },
      { label: "時", g: disp.hG, z: disp.hZ, dim: false },
    ];

    cols.forEach((c) => {
      grid.innerHTML += `
        <div class="p-3 rounded-xl border border-white/10 bg-white/5">
          <div class="text-[10px] text-slate-500 font-black tracking-widest">${c.label}</div>
          <div class="bazi-char ${c.dim ? "text-amber-400" : ""}">${c.g || "—"}</div>
          <div class="text-sm text-slate-300">${c.z || "—"}</div>
        </div>
      `;
    });

    const cgBox = document.getElementById("cangganGrid");
    if (!cgBox) return;
    cgBox.innerHTML = "";

    const branches = [
      { label: "年支", z: disp.yZ },
      { label: "月支", z: disp.mZ },
      { label: "日支", z: disp.dZ },
      { label: "時支", z: disp.hZ },
    ];

    branches.forEach((b) => {
      const cg = CANGGAN_DATA[b.z] || null;
      const rows = cg
        ? Object.entries(cg)
            .sort((a, bb) => (bb[1] || 0) - (a[1] || 0))
            .map(([stem, w]) => {
              const pct = Math.round((Number(w) || 0) * 100);
              return `<span class="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-black/30 border border-white/10 text-xs">
                <span class="font-black">${stem}</span><span class="text-slate-400">${pct}%</span>
              </span>`;
            })
            .join(" ")
        : `<span class="text-slate-500 italic text-xs">（無藏干資料）</span>`;

      cgBox.innerHTML += `
        <div class="p-3 rounded-xl border border-white/10 bg-white/5">
          <div class="text-xs text-slate-400 mb-2">${b.label}：<span class="font-black text-slate-200">${b.z || "—"}</span></div>
          <div class="flex flex-wrap gap-2">${rows}</div>
        </div>
      `;
    });
  }

  /** 流月戰略標籤：隱藏十神術語，改以戰略標籤 */
  function getMonthStrategyTag(b) {
    const risk = Number(b.riskScore) || 0;
    const isHigh = risk >= 55 || b.light === "RED";
    const reasons = (b.reasonTags || []).join("");
    const hasCai = /財|才|偏財|正財/.test(reasons);
    const hasGuanSha = /官|殺|七殺|正官|偏官/.test(reasons);
    if (isHigh && (hasGuanSha || risk >= 70)) return "🚨 壓力監測";
    if (!isHigh && hasCai) return "💰 資源收割";
    if (!isHigh) return "🟢 穩進";
    return "🟡 節奏調整";
  }

  function parseMonthFromRange(range) {
    if (!range) return 0;
    const s = String(range).trim();
    const m1 = s.match(/^(\d{1,2})[/.-]/);
    if (m1) return Math.min(12, Math.max(1, parseInt(m1[1], 10)));
    const m2 = s.match(/^0?(\d)\./);
    if (m2) return Math.min(12, Math.max(1, parseInt(m2[1], 10)));
    return 0;
  }

  /** 副標：一句話當月重點（取 strategy 第一句或前段） */
  function getMonthSubtitle(b) {
    const s = (b.strategy || "").trim();
    if (!s) return "本月宜依個人命盤調整節奏。";
    const dot = s.indexOf("。");
    const period = s.indexOf(".");
    const end = dot >= 0 ? (period >= 0 ? Math.min(dot, period) : dot) : (period >= 0 ? period : s.length);
    const one = s.slice(0, end + 1).trim() || s.slice(0, 36);
    return one.length > 50 ? one.slice(0, 47) + "…" : one;
  }

  /** 危險指數 0–100 對應能量條顏色：0-35 綠、36-65 黃、66-100 紅 */
  function riskToEnergyColor(risk) {
    const r = Math.max(0, Math.min(100, Number(risk) || 0));
    if (r <= 35) return "rgb(34, 197, 94)";   // 綠
    if (r <= 65) return "rgb(234, 179, 8)";   // 黃
    return "rgb(239, 68, 68)";                 // 紅
  }

  /** 狀態標籤：risk >= 65 高壓警示；risk <= 35 且財星 → 資源收割 */
  function getMonthBadge(b) {
    const risk = Math.max(0, Math.min(100, Number(b.riskScore) || 0));
    const reasons = (b.reasonTags || []).join("");
    const hasCai = /財|才|偏財|正財/.test(reasons);
    if (risk >= 65) return { text: "⚠️ 高壓警示", type: "high" };
    if (risk <= 35 && hasCai) return { text: "💰 資源收割", type: "cai" };
    return null;
  }

  // ====== RENDER: LIUYUE（年度賽季導航：單一垂直列表、能量條、展開詳情）======
  function renderLiuyue(bazi) {
    const mGrid = document.getElementById("monthGrid");
    const consultCta = document.getElementById("liuyueConsultCta");
    if (!mGrid) return;

    const bounds = bazi?.liuyue2026?.bounds || [];
    mGrid.innerHTML = "";

    if (!bounds.length) {
      mGrid.innerHTML = `<div class="text-xs text-slate-400 italic">（暫無流月資料）</div>`;
      if (consultCta) consultCta.innerHTML = "";
      return;
    }

    const now = new Date();
    const currentMonth2026 = now.getFullYear() === 2026 ? now.getMonth() + 1 : null;
    const ordered = bounds.slice().sort((a, b) => {
      const ma = parseMonthFromRange(a.range) || 99;
      const mb = parseMonthFromRange(b.range) || 99;
      if (currentMonth2026 != null) {
        const da = ma === currentMonth2026 ? 0 : 1;
        const db = mb === currentMonth2026 ? 0 : 1;
        if (da !== db) return da - db;
      }
      return ma - mb;
    });

    function collapseAll() {
      mGrid.querySelectorAll(".liuyue-expand").forEach((el) => {
        el.style.maxHeight = "0";
        el.setAttribute("aria-hidden", "true");
      });
      mGrid.querySelectorAll(".liuyue-card").forEach((c) => c.classList.remove("is-expanded"));
    }

    ordered.forEach((b) => {
      const monthNum = parseMonthFromRange(b.range);
      const isCurrent = currentMonth2026 != null && monthNum === currentMonth2026;
      const isRed = b.light === "RED";
      const risk = Math.max(0, Math.min(100, Number(b.riskScore) || 0));
      const badge = getMonthBadge(b);
      const subtitle = getMonthSubtitle(b);
      const barColor = riskToEnergyColor(risk);

      const wrap = document.createElement("div");
      wrap.className = "liuyue-month-wrap";

      const card = document.createElement("button");
      card.type = "button";
      card.className =
        "liuyue-card monthly-flow-card w-full text-left flex flex-col gap-1.5 p-3 rounded-xl border border-white/15 transition " +
        (isCurrent ? " is-current" : "") +
        (isRed ? " hover:border-amber-500/30 hover:bg-amber-500/5" : " hover:border-amber-400/20 hover:bg-white/5");

      const badgeHtml = badge
        ? `<span class="liuyue-badge liuyue-badge-${badge.type} shrink-0 text-[10px] font-bold px-2 py-1 rounded-md border">${badge.text}</span>`
        : "";

      card.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="font-black text-sm text-slate-50">
              ${monthNum ? monthNum + "月" : ""} ${b.gz || ""}
              ${isCurrent ? "<span class=\"text-amber-400 text-[10px] ml-1\">（當月）</span>" : ""}
            </div>
          </div>
          ${badgeHtml}
        </div>
        <div class="liuyue-energy-bar mt-1.5" title="風險指數 ${risk}">
          <div class="liuyue-energy-fill" style="width:${risk}%; background:${barColor};"></div>
        </div>
      `;

      const expand = document.createElement("div");
      expand.className = "liuyue-expand";
      expand.style.maxHeight = "0";
      expand.setAttribute("aria-hidden", "true");

      const reasons = (b.reasonTags || []).join("．");
      expand.innerHTML = `
        <div class="p-3 mt-1 rounded-xl border border-amber-400/20 bg-black/30 text-[11px] leading-relaxed space-y-2">
          <p class="text-amber-200/90 font-medium">${subtitle}</p>
          <div class="text-slate-400 uppercase tracking-wider">十神技術參數</div>
          <div class="text-slate-200">干 ${b.ssStem || "—"} ／ 支 ${b.ssBranch || "—"}${reasons ? " · " + reasons : ""}</div>
          <div class="text-amber-200/90 font-medium pt-1 border-t border-white/10">李伯彥老師助推建議</div>
          <div class="text-slate-100">${b.strategy || "（尚未撰寫戰術建議）"}</div>
        </div>
      `;

      card.addEventListener("click", (e) => {
        e.stopPropagation();
        const isExpanded = card.classList.contains("is-expanded");
        collapseAll();
        if (!isExpanded) {
          expand.style.maxHeight = expand.scrollHeight + "px";
          expand.setAttribute("aria-hidden", "false");
          card.classList.add("is-expanded");
          expand.scrollIntoView({ behavior: "smooth", block: "nearest" });
          const closeOnOut = (ev2) => {
            if (!wrap.contains(ev2.target)) {
              collapseAll();
              document.removeEventListener("click", closeOnOut);
            }
          };
          setTimeout(() => document.addEventListener("click", closeOnOut), 0);
        }
      });

      wrap.appendChild(card);
      wrap.appendChild(expand);
      mGrid.appendChild(wrap);
    });

    if (currentMonth2026 != null) {
      const firstCurrent = mGrid.querySelector(".liuyue-card.is-current");
      if (firstCurrent) firstCurrent.scrollIntoView({ behavior: "auto", block: "start" });
    }

    if (consultCta) {
      consultCta.innerHTML = `
        <a href="consultation.html" class="inline-flex items-center gap-1.5 text-[11px] text-amber-400/90 hover:text-amber-300 font-medium">
          📘 獲取更精細的 1:1 詳細攻略
        </a>
      `;
    }
  }

  // ====== Mobile Bottom Sheet 控制 ======
  function openPalaceSheet() {
    const sheet = document.getElementById("palaceSheet");
    const backdrop = document.getElementById("palaceSheetBackdrop");
    if (!sheet) return;
    sheet.classList.add("open");
    if (backdrop) backdrop.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closePalaceSheet() {
    const sheet = document.getElementById("palaceSheet");
    const backdrop = document.getElementById("palaceSheetBackdrop");
    if (!sheet) return;
    sheet.classList.remove("open");
    if (backdrop) backdrop.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // ====== Generic "sheet" content (reuse palace bottom sheet) ======
  function setMobileSheetContent({ title, sub, bodyHtml }) {
    const mTitle = document.getElementById("mobilePalaceTitle");
    const mSub = document.getElementById("mobilePalaceSub");
    const mBody = document.getElementById("mobilePalaceBody");
    if (mTitle) mTitle.textContent = title || "";
    if (mSub) mSub.textContent = sub || "";
    if (mBody) mBody.innerHTML = bodyHtml || "";
  }

  function flashPeek(el) {
    if (!el) return;
    el.classList.add("peek-highlight");
    window.setTimeout(() => el.classList.remove("peek-highlight"), 1200);
  }

  function openWuxingMeaningLikePalace() {
    const meaningBox = document.getElementById("wuxingMeaningBox");
    const meaningSection = document.getElementById("wuxingMeaningSection");

    if (window.innerWidth < 1280) {
      setMobileSheetContent({
        title: "金木水火土 · 基本意義",
        sub: "點五行雷達圖展開（內容優先來自資料庫：wuxing_meanings）",
        bodyHtml: meaningBox ? meaningBox.innerHTML : `<div class="text-slate-500 italic">（五行解釋暫不可用）</div>`,
      });
      openPalaceSheet();
    } else {
      meaningSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      flashPeek(meaningSection);
    }
  }

  /** 四化 Badge 的 HTML（祿紅/權橙/科綠/忌灰），無則回傳空字串 */
  function getMutagenBadgeHtml(starName, mutagenStars) {
    if (!mutagenStars || typeof mutagenStars !== "object") return "";
    const badge = [];
    if (mutagenStars["祿"] === starName) badge.push('<span class="zw-badge zw-badge-lu">祿</span>');
    if (mutagenStars["權"] === starName) badge.push('<span class="zw-badge zw-badge-quan">權</span>');
    if (mutagenStars["科"] === starName) badge.push('<span class="zw-badge zw-badge-ke">科</span>');
    if (mutagenStars["忌"] === starName) badge.push('<span class="zw-badge zw-badge-ji">忌</span>');
    return badge.join("");
  }

  /** 星名 + 四化 Badge（用於宮格內一行顯示） */
  function starWithBadgeHtml(starName, mutagenStars) {
    const badge = getMutagenBadgeHtml(starName, mutagenStars);
    return badge ? starName + " " + badge : starName;
  }

  // ====== RENDER: ZIWEI GRID ======
  function renderZiwei(ziwei, horoscope) {
    const container = document.getElementById("ziweiGrid");
    const hint = document.getElementById("ziweiHint");
    if (!container) return;

    container.innerHTML = "";
    if (!ziwei) {
      container.innerHTML = `
        <div class="col-span-4 flex items-center justify-center text-xs text-slate-500 text-center">
          紫微資料暫不可用（後端 iztro 出錯或未回傳）。請稍後重試。
        </div>`;
      if (hint) hint.textContent = "";
      return;
    }

    const slots = buildSlotsFromZiwei(ziwei, horoscope);
    const gridAreas = window.Calc.gridAreas;
    const mutagenStars = horoscope?.mutagenStars || {};

    slots.forEach((slot) => {
      const isKey = ["命宮", "官祿", "財帛"].includes(slot.palaceName);
      const glowClass = slot.mainElement ? `palace-glow-${slot.mainElement}` : "";
      const activeLimitClass = slot.isActiveLimit ? " is-active-limit" : "";

      const starsHtml = slot.stars.length
        ? slot.stars
            .map((s) => {
              const wx = STAR_WUXING_MAP[s] || "";
              const withBadge = starWithBadgeHtml(s, mutagenStars);
              return `<span class="${wx ? "star-wx-" + wx : ""}">${withBadge}</span>`;
            })
            .join("<br>")
        : `<span class="text-slate-600 text-xs italic font-normal">空宮</span>`;

      let title = slot.palaceName + " " + slot.branch;
      if (slot.isMing && slot.isShen) title += "（命身同宮）";
      else if (slot.isMing) title += "（命）";
      else if (slot.isShen) title += "（身）";
      if (slot.isActiveLimit) title += " · 小限命宮";

      const el = document.createElement("div");
      el.className = `zw-palace ${isKey ? "zw-palace-key" : ""} ${glowClass}${activeLimitClass}`;
      el.style.gridArea = gridAreas[slot.index];
      el.setAttribute("data-palace-name", slot.palaceName);

      const dl = slot.decadalLimit || {};
      const decadalText = (dl.start != null && dl.end != null) ? `大限 ${dl.start}–${dl.end}` : "";

      el.innerHTML = `
        <div class="text-[13px] font-black text-slate-300 leading-snug mb-1">
          ${title}
        </div>
        <div class="text-[11px] text-slate-500 mb-1">
          ${decadalText}
        </div>
        <div class="text-[13px] font-black leading-snug tracking-wide">
          ${starsHtml}
        </div>
      `;

      el.addEventListener("click", () => {
        selectPalace(slot.palaceName);

        if (window.innerWidth < 1280) {
          openPalaceSheet();
        } else {
          document.getElementById("detailPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      container.appendChild(el);
    });

    // 中央 core：命主、身主（繁體）。iztro 放在 basic.masterStar / basic.bodyStar，後端可能放在 core
    const center = document.createElement("div");
    center.className = "zw-center-block";
    const core = ziwei.core || {};
    const basic = ziwei.basic || {};
    const bazi = contract?.bazi;
    const yearStem = (bazi?.display?.yG || "").toString().trim();
    const birthMutagen = yearStem ? (getMutagenStars(yearStem) || {}) : {};
    const stripStarLabel = (s) => String(s || "").replace(/^\d+\.?\s*/, "").trim();
    const mingzhuRaw = basic.masterStar ?? core.mingzhu ?? core.命主 ?? core.minggong ?? "";
    const shengongRaw = basic.bodyStar ?? core.shengong ?? core.身主 ?? "";
    const mingzhu = toTraditionalStarName(stripStarLabel(mingzhuRaw));
    const shengong = toTraditionalStarName(stripStarLabel(shengongRaw));
    const siHuaText =
      birthMutagen.祿 && birthMutagen.權 && birthMutagen.科 && birthMutagen.忌
        ? `${birthMutagen.祿}化祿 · ${birthMutagen.權}化權 · ${birthMutagen.科}化科 · ${birthMutagen.忌}化忌`
        : "—";
    center.innerHTML = `
      <div class="text-[10px] tracking-[0.18em] text-slate-500 font-black">DESTINY CORE</div>
      <div class="text-amber-400 font-black text-xl tracking-wide mt-2">${mingzhu || "—"}</div>
      <div class="text-slate-300 text-[11px] mt-1">身主：${shengong || "—"}</div>
      <div class="text-[10px] text-slate-500 mt-2 font-black">生年四化</div>
      <div class="text-slate-300 text-[10px] leading-tight mt-0.5">${siHuaText}</div>
      <div class="text-[11px] text-slate-400 mt-2">五行局：${core.wuxingju || "—"}</div>
      <div class="text-[10px] text-slate-500 mt-1">命宮支：${core.minggongBranch || "—"} ｜ 身宮支：${core.shengongBranch || "—"}</div>
    `;
    container.appendChild(center);

    if (hint) {
      hint.innerHTML = "提示：命宮位置會依命宮地支旋轉排盤；三方四正＝本宮＋對宮＋三合兩宮（點宮位自動標示）。";
    }
  }

  // ====== Palace Detail (DB-driven) ======
  function selectPalace(name) {
    selectedPalace = name;

    const { related } = computeRelatedPalaces(PALACE_RING, name);
    const relatedNames = new Set(related);

    document.querySelectorAll(".zw-palace").forEach((el) => {
      const pName = el.getAttribute("data-palace-name") || "";
      el.classList.remove("is-active", "is-related");
      if (pName === name) el.classList.add("is-active");
      else if (relatedNames.has(pName)) el.classList.add("is-related");
    });

    const ziwei = contract?.ziwei;
    const bazi = contract?.bazi;
    const horoscope = ziwei?.horoscope || getHoroscopeFromAge(getCurrentAge(), lastGender, ziwei, bazi);
    const mutagenStars = horoscope?.mutagenStars || {};

    const rawStars = ziwei ? getStarsForPalace(ziwei, name) : [];
    const stars = rawStars.map(toTraditionalStarName);

    const titleText = `2026 ${name} · 作戰面板`;
    const subText = "三方四正已標示：本宮＋對宮＋三合（共四宮）。";

    document.getElementById("palaceTitle").textContent = titleText;
    document.getElementById("palaceSub").textContent = subText;

    const palaceText = (dbContent.palaces && dbContent.palaces[name]) ? dbContent.palaces[name] : "（資料庫尚未填入此宮位解釋）";

    const Strategy = typeof window.StrategyConfig !== "undefined" ? window.StrategyConfig : null;
    let strategyHtml = '<div id="palaceStrategyBlock" class="mb-4 text-xs text-slate-500">載入戰略金句…</div>';
    if (Strategy && window.ziweiScores?.palaceScores) {
      const baseScore = Number(window.ziweiScores.palaceScores[name]) || 0;
      const yearlyStem = horoscope?.yearlyStem ?? null;
      let displayScore = baseScore;
      if (name === (horoscope?.activeLimitPalaceName ?? null) && yearlyStem && ziwei) {
        const rawStars = getStarsForPalace(ziwei, name);
        const stars = rawStars.map(toTraditionalStarName);
        displayScore = getPalaceScoreWithWeights(baseScore, stars, yearlyStem);
      }
      const maxScore = Math.max(...Object.values(window.ziweiScores.palaceScores).map(Number), 0.01);
      const strength = Strategy.scoreToStrength(displayScore, maxScore);
      const sihuaList = getSihuaForPalace(ziwei, name, horoscope?.mutagenStars || {});
      Strategy.getStrategyNoteFromAPI(name, strength, sihuaList).then(function (advice) {
        const block = document.getElementById("palaceStrategyBlock");
        if (!block) return;
        if (advice && advice !== "（暫無戰略提示）") {
          const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
          block.outerHTML = "<div class=\"p-4 rounded-xl border border-amber-400/30 bg-amber-500/10 mb-4\"><div class=\"text-[10px] text-amber-200 font-black tracking-widest uppercase mb-2\">戰略金句</div><div class=\"text-sm text-amber-100/95 leading-relaxed\">" + esc(advice) + "</div></div>";
        } else {
          block.textContent = "";
        }
      }).catch(function () {
        const block = document.getElementById("palaceStrategyBlock");
        if (block) block.textContent = "";
      });
    } else {
      strategyHtml = "";
    }

    let starCards = "";
    if (stars.length) {
      starCards = stars
        .map((s) => {
          const wx = STAR_WUXING_MAP[s] || "";
          const explain = (dbContent.stars && dbContent.stars[s]) ? dbContent.stars[s] : "（資料庫尚未填入此星曜解釋）";
          const badgeHtml = getMutagenBadgeHtml(s, mutagenStars);
          const titleDisplay = badgeHtml ? `【${s}】 ${badgeHtml}` : `【${s}】`;
          return `
            <div class="p-4 rounded-xl border border-white/10 bg-white/5">
              <div class="flex items-center justify-between gap-3">
                <div class="font-black text-base ${wx ? "star-wx-" + wx : "text-slate-200"}">${titleDisplay}</div>
                <div class="text-[10px] text-slate-500">${wx ? "五行：" + wx : ""}</div>
              </div>
              <div class="text-xs text-slate-300 mt-2 leading-relaxed">${explain}</div>
            </div>
          `;
        })
        .join("");
    } else {
      starCards = `
        <div class="p-4 rounded-xl border border-white/10 bg-white/5">
          <div class="text-sm text-slate-300 font-black">空宮</div>
          <div class="text-xs text-slate-400 mt-2">空宮不等於沒有事件，重點是看三方四正與流月節奏如何引動。</div>
        </div>
      `;
    }

    const detailHtml = `
      ${strategyHtml}
      <div class="p-4 rounded-xl border border-amber-400/25 bg-amber-500/10">
        <div class="text-[10px] text-amber-200 font-black tracking-widest uppercase mb-2">資料庫宮位解釋</div>
        <div class="text-sm text-slate-100 leading-relaxed">${palaceText}</div>
      </div>

      <div>
        <div class="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-3">星曜解釋（資料庫）</div>
        <div class="space-y-3">${starCards}</div>
      </div>
    `;

    const body = document.getElementById("palaceDetailBody");
    body.innerHTML = detailHtml;

    const mTitle = document.getElementById("mobilePalaceTitle");
    const mSub = document.getElementById("mobilePalaceSub");
    const mBody = document.getElementById("mobilePalaceBody");
    if (mTitle) mTitle.textContent = titleText;
    if (mSub) mSub.textContent = subText;
    if (mBody) mBody.innerHTML = detailHtml;
  }

  // ====== Load DB Content ======
  async function loadDbContent() {
    try {
      const r = await fetch(`${API_BASE}/content/2026`, { method: "GET" });
      const j = await r.json();
      if (j?.ok) dbContent = j;
    } catch (e) {
      console.warn("loadDbContent failed", e);
    } finally {
      renderWuxingMeaningBox();
    }
  }

  /** 依當前 hash 同步導航／戰略標籤的 aria-current，並套用 amber 強調樣式 */
  function syncNavChipActive() {
    const hash = (window.location.hash || "").trim() || "#ws-ziwei";
    document.querySelectorAll(".nav-chip[href^=\"#\"]").forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      if (href === hash) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  /** 戰略維度切換：點擊 nav-chip 時先淡出再滾動，再淡入（150–250ms） */
  function initDashboardContentTransition() {
    const content = document.getElementById("dashboardMainContent");
    if (!content || content.hasAttribute("data-transition-bound")) return;
    content.setAttribute("data-transition-bound", "1");
    function bindHashLink(a) {
      a.addEventListener("click", function (e) {
        const href = (this.getAttribute("href") || "").trim();
        if (!href || href === "#") return;
        const id = href.slice(1);
        if (!document.getElementById(id)) return;
        e.preventDefault();
        content.classList.add("dashboard-content-fade");
        const dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 180;
        setTimeout(() => {
          window.location.hash = href;
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            content.classList.remove("dashboard-content-fade");
          }, dur);
        }, dur);
      });
    }
    document.querySelectorAll(".nav-chip[href^=\"#\"]").forEach(bindHashLink);
    document.querySelectorAll(".bottom-nav a[href^=\"#\"]").forEach(bindHashLink);
    window.addEventListener("hashchange", syncNavChipActive);
  }

  // ====== Calculate ======
  async function calculate(skipStartupSequence) {
    const btn = document.getElementById("btnLaunch");
    const hint = document.getElementById("hint");
    const original = btn.textContent;

    const vy = Number(document.getElementById("birthYear").value);
    const vm = Number(document.getElementById("birthMonth").value);
    const vd = Number(document.getElementById("birthDay").value);
    const gender = (document.getElementById("gender")?.value || "").trim(); // "M" | "F"
    const timeMode = (document.getElementById("timeMode")?.value || "exact").trim(); // "exact" | "shichen"
    const vh = Number(document.getElementById("birthHour")?.value);
    const vmin = Number(document.getElementById("birthMinute")?.value);
    const shichen = (document.getElementById("birthShichen")?.value || "").trim();
    const shichenHalf = (document.getElementById("birthShichenHalf")?.value || "").trim(); // "upper" | "lower"

    if (!skipStartupSequence && typeof window.showStartupSequence === "function" && timeMode === "shichen" && shichen) {
      window.showStartupSequence({
        branchLabel: shichen + "時",
        personaLine: CEREMONY_PERSONALITY_KEYS[shichen] || CEREMONY_PERSONALITY_KEYS["子"],
        enableSound: true,
        onFinished: function () { calculate(true); },
      });
      return;
    }

    try {
      if (![vy, vm, vd].every((n) => Number.isFinite(n))) {
        throw new Error("請先選完整出生年／月／日。若不確定時辰，可點「不確定出生時間？點我推算時辰」。");
      }

      if (timeMode !== "exact" && timeMode !== "shichen") {
        throw new Error("時間模式錯誤，請重新選擇");
      }

      if (timeMode === "exact") {
        if (![vh, vmin].every((n) => Number.isFinite(n))) {
          throw new Error("請先選完整出生時間（時、分）");
        }
      } else {
        if (!shichen) {
          throw new Error("請先選時辰，或不確定時間可點「不確定出生時間？點我推算時辰」");
        }
        if (shichenHalf !== "upper" && shichenHalf !== "lower") {
          throw new Error("請先選上半/下半時辰");
        }
      }

      const resolved = resolveBirthTime({ mode: timeMode, hour: vh, minute: vmin, shichen, shichenHalf });

      btn.disabled = true;
      btn.textContent = "計算中…";
      hint.textContent = "正在連線後端計算（八字＋紫微＋流月＋十神）…";

      const baseBody = { year: vy, month: vm, day: vd, hour: resolved.hour, minute: resolved.minute };
      const bodyWithGender = gender ? { ...baseBody, gender } : baseBody;

      let resp = await fetch(`${API_BASE}/compute/all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyWithGender),
      });

      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        // 若後端不支援 gender 欄位，做一次降級重試（避免整個系統卡死）
        if (gender && resp.status === 400 && /gender|sex/i.test(t)) {
          resp = await fetch(`${API_BASE}/compute/all`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(baseBody),
          });
        } else {
          throw new Error(`API HTTP ${resp.status} ${t}`.trim());
        }
      }

      if (!resp.ok) {
        const t2 = await resp.text().catch(() => "");
        throw new Error(`API HTTP ${resp.status} ${t2}`.trim());
      }

      const payload = await resp.json();
      console.log("compute/all payload:", payload);
      console.log("chartId from payload:", payload.chartId);

      if (!payload?.ok) throw new Error(payload?.error || "API error");

      contract = payload.features;
      if (!contract || contract.version !== "strategic_features_v1") {
        throw new Error("features 格式錯誤（不是 strategic_features_v1）");
      }

      lastBirthYear = vy;
      lastGender = gender;
      syncAgeSliderDisplay(Math.max(1, new Date().getFullYear() - vy));

      const chartId = payload.chartId || contract.chartId || null;
      const bazi = contract.bazi;
      const ziwei = contract.ziwei;

      if (!bazi) throw new Error("後端未回傳 bazi");

      let ziweiScores = null;
      if (chartId) {
        try {
          const scoreResp = await fetch(`${API_BASE}/charts/${encodeURIComponent(chartId)}/scores`, { method: "GET" });
          if (scoreResp.ok) {
            ziweiScores = await scoreResp.json();
            window.ziweiScores = ziweiScores; // debug
            console.log("ziweiScores from API:", ziweiScores);
          } else {
            console.warn("scores API HTTP", scoreResp.status, await scoreResp.text().catch(() => ""));
          }
        } catch (err) {
          console.warn("scores API error:", err);
        }
      } else {
        console.warn("No chartId in payload, scores API 無法呼叫");
      }

      // 宮位環：維持固定的「命、兄、夫、子…」順序，不再用後端覆蓋
      PALACE_RING = PALACE_DEFAULT.slice();

      // ===== 進入系統 UI =====
      const sysEl = document.getElementById("system");
      const navEl = document.getElementById("workspaceNav");
      const navCta = document.getElementById("navCta");
      const inputEl = document.getElementById("inputCard");

      if (sysEl) {
        sysEl.classList.remove("hidden");
        document.body.classList.add("dashboard-visible");
        if (!sysEl.hasAttribute("data-dashboard-entered")) {
          sysEl.setAttribute("data-dashboard-entered", "1");
          sysEl.classList.add("dashboard-enter");
          const delayStep = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.06;
          sysEl.querySelectorAll(".dashboard-card").forEach((card, i) => {
            card.style.animationDelay = `${i * delayStep}s`;
          });
        }
      }
      if (navEl) navEl.classList.remove("hidden");
      if (navCta) navCta.classList.remove("hidden");
      if (inputEl) inputEl.classList.add("hidden");

      syncNavChipActive();
      initDashboardContentTransition();

      // summary
      const summaryBirthEl = document.getElementById("summaryBirth");
      const summaryDMEl = document.getElementById("summaryDM");
      const summaryDominantEl = document.getElementById("summaryDominant");
      const summaryRedMonthsEl = document.getElementById("summaryRedMonths");

      if (summaryBirthEl) {
        const genderText = gender === "M" ? "男" : gender === "F" ? "女" : "";
        const timeText =
          timeMode === "shichen"
            ? `時辰：${resolved.shichen}${resolved.shichenHalf === "lower" ? "下" : "上"}（約 ${pad2(resolved.hour)}:${pad2(resolved.minute)}）`
            : `${pad2(resolved.hour)}:${pad2(resolved.minute)}`;

        summaryBirthEl.textContent =
          `${vy}/${pad2(vm)}/${pad2(vd)} · ${timeText}（公曆）` + (genderText ? ` · ${genderText}` : "");
      }
      if (summaryDMEl) summaryDMEl.textContent = bazi.dmElement || "—";
      if (summaryDominantEl) summaryDominantEl.textContent = (bazi.tenGod?.dominant || "—").trim() || "—";
      if (summaryRedMonthsEl) {
        const reds = bazi.liuyue2026?.redMonths || [];
        summaryRedMonthsEl.textContent = reds.length ? reds.join("、") : "偏少（可穩推）";
      }

      // bazi + canggan + bars
      renderPillars(bazi);
      const surfaceBoard = typeof window.Calc?.getBoyanBoard === "function" ? (() => { try { return window.Calc.getBoyanBoard(bazi.wuxing?.surface || {}); } catch (_) { return null; } })() : null;
      const strategicBoard = typeof window.Calc?.getBoyanBoard === "function" ? (() => { try { return window.Calc.getBoyanBoard(bazi.wuxing?.strategic || {}); } catch (_) { return null; } })() : null;
      renderBar("surfaceWxBars", bazi.wuxing?.surface, 4, surfaceBoard ? { strongest: surfaceBoard.strongest, weakest: surfaceBoard.weakest } : undefined);
      renderRadarChart("surfaceWxRadar", bazi.wuxing?.surface);
      renderFiveElementComment("surfaceWxComment", bazi.wuxing?.surface, "surface");
      renderBar("strategicWxBars", bazi.wuxing?.strategic, bazi.wuxing?.maxStrategic || 1, strategicBoard ? { strongest: strategicBoard.strongest, weakest: strategicBoard.weakest } : undefined);
      renderRadarChart("strategicWxRadar", bazi.wuxing?.strategic);
      renderFiveElementComment("strategicWxComment", bazi.wuxing?.strategic, "strategic");

      // tenGod command box (DB first)
      const dominant = (bazi.tenGod?.dominant || "").trim();
      const cmd = dominant && dbContent.tenGods?.[dominant] ? dbContent.tenGods[dominant] : "";
      const tenGodEl = document.getElementById("tenGodCommand");
      if (tenGodEl) {
        tenGodEl.textContent =
          cmd || `（資料庫尚未填入「${dominant || "—"}」的十神指令。你可以先在 ten_god_analysis 補上 2026 內容。）`;
      }

      // liuyue
      renderLiuyue(bazi);

      // 小限／四化（可與後端 iztro horoscope 並用）
      const horoscope = ziwei?.horoscope || getHoroscopeFromAge(getCurrentAge(), lastGender, ziwei, bazi);

      // ziwei grid
      renderZiwei(ziwei, horoscope);

      // 紫微分數（小限宮位依 SI_HUA_MAP 權重聯動 + Progress Bar）
      if (ziweiScores && ziweiScores.palaceScores) {
        renderZiweiScores(ziweiScores, horoscope, ziwei);
      } else {
        const palaceBox = document.getElementById("ziweiPalaceScores");
        if (palaceBox) palaceBox.innerHTML = `<div class="text-xs text-slate-400">（暫無分數資料）</div>`;
        renderBar("ziweiWxBars", { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }, 1);
        renderRadarChart("ziweiWxRadar", { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 });
        renderFiveElementComment("ziweiWxComment", { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 }, "ziwei");
      }

      // tactical panel
      const tenGodText = dominant && dbContent.tenGods?.[dominant] ? dbContent.tenGods[dominant] : "";
      const tactics = computeDynamicTactics(bazi, tenGodText);
      const tacticalBox = document.getElementById("tacticalBox");
      tacticalBox.innerHTML = tactics.length
        ? tactics.map((x) => `<div class="p-4 rounded-xl border ${toneClass(x.tone)} text-sm leading-relaxed">${x.text}</div>`).join("")
        : `<div class="text-sm text-slate-400 italic">（戰術提示暫不可用）</div>`;

      // default select 命宮
      if (ziwei) {
        selectPalace("命宮");
      } else {
        document.getElementById("palaceTitle").textContent = "紫微暫不可用";
        document.getElementById("palaceDetailBody").innerHTML = `<div class="p-4 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300">
          後端 iztro 可能出錯（或打包問題）。請先確認 worker build/依賴，再重試。
        </div>`;
      }

      document.getElementById("ws-summary")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      console.error(e);
      alert("系統忙碌中或資料有誤，請稍後再試。\n\n詳細：" + (e?.message || e));
    } finally {
      btn.disabled = false;
      btn.textContent = original;
      hint.textContent = "";
    }
  }

  async function renderZiweiScores(scores, horoscope, ziwei) {
    const palaceBox = document.getElementById("ziweiPalaceScores");
    const wuxingBox = document.getElementById("ziweiWuxingScores");

    if (!palaceBox || !wuxingBox) {
      console.warn("ziwei score boxes not found in DOM");
      return;
    }

    const baseEntries = Object.entries(scores?.palaceScores || {});
    if (!baseEntries.length) {
      palaceBox.innerHTML = `<div class="text-xs text-slate-400">（尚未計算宮位權重）</div>`;
    } else {
      const activeLimitPalaceName = horoscope?.activeLimitPalaceName ?? null;
      const yearlyStem = horoscope?.yearlyStem ?? null;
      const mutagenStars = horoscope?.mutagenStars ?? {};

      const rows = baseEntries.map(([name, val]) => {
        const baseScore = Number(val) || 0;
        let displayScore = baseScore;
        if (activeLimitPalaceName != null && name === activeLimitPalaceName && yearlyStem && ziwei) {
          const rawStars = getStarsForPalace(ziwei, name);
          const stars = rawStars.map(toTraditionalStarName);
          displayScore = getPalaceScoreWithWeights(baseScore, stars, yearlyStem);
        }
        return { name, baseScore, displayScore, isActiveLimit: name === activeLimitPalaceName };
      });

      const sorted = rows.sort((a, b) => b.displayScore - a.displayScore);
      const maxScore = Math.max(...sorted.map((r) => r.displayScore), 0.01);
      const Strategy = typeof window.StrategyConfig !== "undefined" ? window.StrategyConfig : null;

      let notes = [];
      if (Strategy) {
        notes = await Promise.all(sorted.map((r) => {
          const strength = Strategy.scoreToStrength(r.displayScore, maxScore);
          const sihuaList = getSihuaForPalace(ziwei, r.name, mutagenStars);
          return Strategy.getStrategyNoteFromAPI(r.name, strength, sihuaList);
        }));
      }

      const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      palaceBox.innerHTML = sorted
        .map((r, i) => {
          const pct = maxScore ? (r.displayScore / maxScore) * 100 : 0;
          const advice = notes[i] && notes[i] !== "（暫無戰略提示）" ? esc(notes[i]) : "";
          const labelClass = r.isActiveLimit ? "text-amber-200" : "text-slate-300";
          const labelSuffix = r.isActiveLimit ? " · 小限命宮" : "";
          const barClass = r.isActiveLimit ? "bg-amber-400" : "bg-amber-500/70";
          return `
            <div class="py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors palace-score-row" data-palace-name="${esc(r.name)}" role="button" tabindex="0">
              <div class="flex justify-between text-xs mb-0.5">
                <span class="${labelClass}">${r.name}${labelSuffix}</span>
              </div>
              <div class="h-2 bg-white/10 rounded overflow-hidden">
                <div class="h-full ${barClass} rounded transition-all duration-300" style="width:${pct}%"></div>
              </div>
              ${advice ? `<div class="text-[11px] text-amber-200/95 mt-1 leading-snug strategy-advice">${advice}</div>` : ""}
            </div>
          `;
        })
        .join("");

      if (!palaceBox.hasAttribute("data-palace-click-bound")) {
        palaceBox.setAttribute("data-palace-click-bound", "1");
        palaceBox.addEventListener("click", function (e) {
          var row = e.target.closest("[data-palace-name]");
          if (!row) return;
          var name = row.getAttribute("data-palace-name");
          if (!name) return;
          selectPalace(name);
          if (window.innerWidth < 1280) {
            openPalaceSheet();
          } else {
            document.getElementById("detailPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
        palaceBox.addEventListener("keydown", function (e) {
          if (e.key !== "Enter" && e.key !== " ") return;
          var row = e.target.closest("[data-palace-name]");
          if (!row) return;
          e.preventDefault();
          var name = row.getAttribute("data-palace-name");
          if (!name) return;
          selectPalace(name);
          if (window.innerWidth < 1280) {
            openPalaceSheet();
          } else {
            document.getElementById("detailPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      }
    }

    const ratios = scores?.elementRatios || {};
    console.log("[renderZiweiScores] elementRatios =", ratios);

    const wxForBar = {
      木: (Number(ratios["木"]) || 0) * 100,
      火: (Number(ratios["火"]) || 0) * 100,
      土: (Number(ratios["土"]) || 0) * 100,
      金: (Number(ratios["金"]) || 0) * 100,
      水: (Number(ratios["水"]) || 0) * 100,
    };

    renderBar("ziweiWxBars", wxForBar, 100);
    renderRadarChart("ziweiWxRadar", wxForBar);
    renderFiveElementComment("ziweiWxComment", wxForBar, "ziwei");
  }

  // ====== INIT SELECTORS ======
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

    const nowY = new Date().getFullYear();
    for (let i = nowY; i >= 1940; i--) y.add(new Option(i + " 年", i));
    for (let i = 1; i <= 12; i++) m.add(new Option(i + " 月", i));
    for (let i = 0; i < 24; i++) h.add(new Option(pad2(i) + " 時", i));
    for (let i = 0; i < 60; i++) {
      const v = pad2(i);
      min.add(new Option(v + " 分", v));
    }

    if (gender) {
      gender.add(new Option("性別：男", "M"));
      gender.add(new Option("性別：女", "F"));
    }

    if (timeMode) {
      timeMode.add(new Option("時間：時分（精確）", "exact"));
      timeMode.add(new Option("時間：時辰（子丑寅…）", "shichen"));
    }

    if (shichen) {
      SHICHEN_ORDER.forEach((c) => {
        shichen.add(new Option(`時辰：${c}`, c));
      });
    }

    if (shichenHalf) {
      shichenHalf.add(new Option("上半時辰", "upper"));
      shichenHalf.add(new Option("下半時辰", "lower"));
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
      for (let i = 1; i <= days; i++) d.add(new Option(i + " 日", i));
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

  /** 12 時辰人格鑰匙文案（座標鎖定儀式用） */
  const CEREMONY_PERSONALITY_KEYS = {
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

  /** 低沈合成器音效：模擬系統同步完成（Web Audio API） */
  function playSyncSound() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.6);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.02, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }

  // ====== 不確定時辰？問卷 Modal（一題一題顯示 + 進度條）======
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

    function openModal() {
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
      pendingCeremonyResult = { branch: branch, half: half, hour_label: result && result.hour_label, hour_range: result && result.hour_range };

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
            return;
          }
          if (ceremonyLine2) ceremonyLine2.textContent = text.slice(0, idx + 1);
          idx += 1;
          ceremonyTypewriterTimer = setTimeout(tick, step);
        }
        ceremonyTypewriterTimer = setTimeout(tick, step);
      }, 500);
    }

    function esc(s) {
      if (s == null) return "";
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

    /** 目前題目選項變更時更新按鈕（下一題／推算並填入 可否點擊） */
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

    /** 目前題目是否已填答（單選至少一個、複選至少一個） */
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
      var submitBtnEl = document.getElementById("identifyBirthTimeSubmit");
      if (submitBtnEl) submitBtnEl.disabled = true;
      window.IdentifyBirthTime.identifyBirthTimeFromAPI(answers)
        .then(function (result) {
          openCeremony(result);
        })
        .catch(function (err) {
          var hint = document.getElementById("hint");
          if (hint) hint.textContent = "推算失敗（" + (err && err.message ? err.message : "請稍後再試") + "）。";
        })
        .finally(function () {
          if (submitBtnEl) submitBtnEl.disabled = false;
        });
    });
  }

  // ====== BOOT ======
  document.addEventListener("DOMContentLoaded", async () => {
    initSelectors();
    initIdentifyBirthTime();
    syncNavChipActive();
    document.getElementById("btnLaunch").addEventListener("click", calculate);
    await loadDbContent();

    // Click radar/bars → show Five Elements meanings (same behavior as palace click)
    [
      "ziweiWxRadar",
      "surfaceWxRadar",
      "strategicWxRadar",
      "ziweiWxBars",
      "surfaceWxBars",
      "strategicWxBars",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.cursor = "pointer";
      el.addEventListener("click", openWuxingMeaningLikePalace);
    });

    // 小限滑桿 → 重算小限、重繪方盤與宮位強度、更新詳解四化 Badge
    const currentAgeSlider = document.getElementById("currentAgeSlider");
    const currentAgeDisplay = document.getElementById("currentAgeDisplay");
    if (currentAgeSlider) {
      currentAgeSlider.addEventListener("input", () => {
        const age = Math.max(1, Math.min(120, Number(currentAgeSlider.value) || 38));
        if (currentAgeDisplay) currentAgeDisplay.textContent = String(age);
        if (!contract?.ziwei) return;
        const bazi = contract.bazi;
        const horoscope = contract.ziwei.horoscope || getHoroscopeFromAge(getCurrentAge(), lastGender, contract.ziwei, bazi);
        renderZiwei(contract.ziwei, horoscope);
        if (window.ziweiScores?.palaceScores) renderZiweiScores(window.ziweiScores, horoscope, contract.ziwei);
        selectPalace(selectedPalace);
      });
    }

    // Mobile Bottom Sheet 關閉事件
    const closeBtn = document.getElementById("palaceSheetClose");
    const backdrop = document.getElementById("palaceSheetBackdrop");
    if (closeBtn) closeBtn.addEventListener("click", closePalaceSheet);
    if (backdrop) backdrop.addEventListener("click", closePalaceSheet);
  });
})();

