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
    pad2,
    toTraditionalStarName,
    getStarsForPalace,
    buildSlotsFromZiwei,
    computeRelatedPalaces,
    normalizeWxByMax,
    generateFiveElementComment,
    computeDynamicTactics,
  } = window.Calc;

  // ====== CONFIG ======
  const API_BASE = "https://17gonplay-api.billeetw.workers.dev";

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

  // 宮位環（以命宮為起點的 12 宮順序）
  let PALACE_RING = PALACE_DEFAULT.slice();

  // ====== DOM HELPERS ======
  function renderBar(targetId, data, max) {
    const box = document.getElementById(targetId);
    if (!box) return;
    box.innerHTML = "";
    ["木", "火", "土", "金", "水"].forEach((e) => {
      const v = Number(data?.[e] || 0);
      const w = max ? Math.max(3, (v / max) * 100) : 0;
      box.innerHTML += `
        <div class="mb-1 wx-row">
          <div class="flex justify-between text-xs text-slate-300">
            <span class="font-bold">${e}</span>
            <span class="font-mono">${v.toFixed(1)}</span>
          </div>
          <div class="h-2 bg-white/10 rounded overflow-hidden">
            <div class="h-full wuxing-${e} wx-bar-inner" style="width:${w}%"></div>
          </div>
        </div>
      `;
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

  function renderFiveElementComment(containerId, wx, kind) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const c = generateFiveElementComment(wx);
    const prefix =
      kind === "surface"
        ? `你在人前的操作風格：最強【${c.strongest}】、最弱【${c.weakest}】。`
        : kind === "strategic"
          ? `你真正扛住人生的實戰資源：最強【${c.strongest}】、最弱【${c.weakest}】。`
          : `本局五行：最強【${c.strongest}】、最弱【${c.weakest}】。`;

    // 一句話（用分號串起 strongest/weakest + 生/剋）
    el.innerHTML = `
      <div class="text-slate-100">${prefix}</div>
      <div class="text-slate-300 mt-1">${c.strongComment} ${c.weakComment}</div>
      <div class="text-slate-400 mt-1">${c.shengComment} ${c.keComment}</div>
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

  // ====== RENDER: LIUYUE ======
  function renderLiuyue(bazi) {
    const mGrid = document.getElementById("monthGrid");
    const detail = document.getElementById("monthDetailBox");
    const rhythm = document.getElementById("monthlyRhythmBox");
    if (!mGrid || !rhythm) return;

    const bounds = bazi?.liuyue2026?.bounds || [];
    mGrid.innerHTML = "";
    rhythm.innerHTML = "";
    if (detail) {
      detail.innerHTML = `
        <div class="text-slate-400/80">
          點任一個月份，這裡會顯示：對你個人而言的
          <span class="text-amber-300 font-bold">危險指數＋觸發原因＋戰術指令</span>。
        </div>
      `;
    }

    if (!bounds.length) {
      mGrid.innerHTML = `<div class="text-xs text-slate-400 italic">（暫無流月資料）</div>`;
      if (detail) detail.innerHTML = `<div class="text-xs text-slate-400 italic">（暫無流月資料）</div>`;
      return;
    }

    bounds.forEach((b) => {
      const isRed = b.light === "RED";
      const tag = isRed ? "🔴 壓力" : "🟢 穩進";

      const card = document.createElement("button");
      card.type = "button";
      card.className =
        "w-full text-left flex flex-col gap-1 p-3 rounded-xl border-l-4 transition " +
        (isRed ? "border-red-500 bg-red-500/10 hover:bg-red-500/20" : "border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20");

      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <div class="font-black text-sm text-slate-50">
              ${b.gz}
              <span class="text-[10px] text-slate-300 ml-2 font-mono">${b.range || ""}</span>
            </div>
            <div class="text-[11px] text-slate-200 mt-1">
              十神：干 ${b.ssStem || "—"} ／ 支 ${b.ssBranch || "—"}
            </div>
          </div>
          <div class="text-right">
            <div class="text-[11px] font-black px-3 py-1 rounded-full bg-black/40">
              ${tag}
            </div>
            <div class="text-[10px] text-slate-400 mt-1">
              危險指數：
              <span class="${isRed ? "text-red-300" : "text-emerald-300"} font-mono">
                ${b.riskScore ?? "—"}
              </span> / 100
            </div>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        if (!detail) return;
        const reasons = (b.reasonTags || []).join("．");

        detail.innerHTML = `
          <div class="p-4 rounded-xl border ${isRed ? "border-red-400/60 bg-red-500/10" : "border-emerald-400/60 bg-emerald-500/10"} text-sm leading-relaxed space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[11px] uppercase tracking-[0.18em] text-slate-300">Personalized Month Radar</div>
                <div class="font-black text-base text-slate-50 mt-1">
                  ${b.gz}（${b.range}）
                </div>
              </div>
              <div class="text-right text-[11px] text-slate-200">
                危險指數
                <div class="text-lg font-mono ${isRed ? "text-red-300" : "text-emerald-300"}">
                  ${b.riskScore ?? "—"}/100
                </div>
              </div>
            </div>

            <div class="text-[11px] text-slate-200">
              個性化觸發：
              <span class="text-slate-100">${reasons || "（尚未標註觸發原因）"}</span>
            </div>

            <div class="text-[11px] text-amber-100 mt-1">
              戰術指令：
              <span class="text-amber-50">${b.strategy || "（尚未撰寫戰術建議）"}</span>
            </div>
          </div>
        `;

        detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });

      mGrid.appendChild(card);

      rhythm.innerHTML += `
        <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <div class="flex items-center">
            <span class="month-dot ${isRed ? "bg-red-light" : "bg-green-light"}"></span>
            <span class="text-[11px] font-black text-slate-200">${b.gz}</span>
            <span class="text-[9px] text-slate-500 ml-2 font-mono">${b.range || ""}</span>
          </div>
          <div class="text-right">
            <div class="text-[10px] font-black ${isRed ? "text-red-300" : "text-emerald-300"}">
              ${isRed ? "守規則" : "推進"}
            </div>
            <div class="text-[9px] text-slate-400">危險 ${b.riskScore ?? "—"}</div>
          </div>
        </div>
      `;
    });
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

  // ====== RENDER: ZIWEI GRID ======
  function renderZiwei(ziwei) {
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

    const slots = buildSlotsFromZiwei(ziwei);
    const gridAreas = window.Calc.gridAreas;

    slots.forEach((slot) => {
      const isKey = ["命宮", "官祿", "財帛"].includes(slot.palaceName);
      const glowClass = slot.mainElement ? `palace-glow-${slot.mainElement}` : "";

      const starsHtml = slot.stars.length
        ? slot.stars
            .map((s) => {
              const wx = STAR_WUXING_MAP[s] || "";
              return `<span class="${wx ? "star-wx-" + wx : ""}">${s}</span>`;
            })
            .join("<br>")
        : `<span class="text-slate-600 text-xs italic font-normal">空宮</span>`;

      let title = slot.palaceName;
      if (slot.isMing && slot.isShen) title += "（命身同宮）";
      else if (slot.isMing) title += "（命）";
      else if (slot.isShen) title += "（身）";

      const el = document.createElement("div");
      el.className = `zw-palace ${isKey ? "zw-palace-key" : ""} ${glowClass}`;
      el.style.gridArea = gridAreas[slot.index];
      el.setAttribute("data-palace-name", slot.palaceName);

      el.innerHTML = `
        <div class="text-[10px] font-black text-slate-500 mb-1">
          ${title}
        </div>
        <div class="text-[11px] text-slate-400 mb-1">
          ${slot.branch}宮
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

    // 中央 core
    const center = document.createElement("div");
    center.className = "zw-center-block";
    const core = ziwei.core || {};
    center.innerHTML = `
      <div class="text-[10px] tracking-[0.18em] text-slate-500 font-black">DESTINY CORE</div>
      <div class="text-amber-400 font-black text-xl tracking-widest mt-1">${core.minggong || "—"}</div>
      <div class="text-[11px] text-slate-300 mt-1">
        身主：${core.shengong || "—"}
      </div>
      <div class="text-[11px] text-slate-400 mt-1">
        五行局：${core.wuxingju || "—"}
      </div>
      <div class="text-[10px] text-slate-500 mt-1">
        命宮支：${core.minggongBranch || "—"} ｜ 身宮支：${core.shengongBranch || "—"}
      </div>
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
    const rawStars = ziwei ? getStarsForPalace(ziwei, name) : [];
    const stars = rawStars.map(toTraditionalStarName);

    const titleText = `2026 ${name} · 作戰面板`;
    const subText = "三方四正已標示：本宮＋對宮＋三合（共四宮）。";

    document.getElementById("palaceTitle").textContent = titleText;
    document.getElementById("palaceSub").textContent = subText;

    const palaceText = (dbContent.palaces && dbContent.palaces[name]) ? dbContent.palaces[name] : "（資料庫尚未填入此宮位解釋）";

    let starCards = "";
    if (stars.length) {
      starCards = stars
        .map((s) => {
          const wx = STAR_WUXING_MAP[s] || "";
          const explain = (dbContent.stars && dbContent.stars[s]) ? dbContent.stars[s] : "（資料庫尚未填入此星曜解釋）";
          return `
            <div class="p-4 rounded-xl border border-white/10 bg-white/5">
              <div class="flex items-center justify-between gap-3">
                <div class="font-black text-base ${wx ? "star-wx-" + wx : "text-slate-200"}">【${s}】</div>
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

  // ====== Calculate ======
  async function calculate() {
    const btn = document.getElementById("btnLaunch");
    const hint = document.getElementById("hint");
    const original = btn.textContent;

    const vy = Number(document.getElementById("birthYear").value);
    const vm = Number(document.getElementById("birthMonth").value);
    const vd = Number(document.getElementById("birthDay").value);
    const vh = Number(document.getElementById("birthHour").value);
    const vmin = Number(document.getElementById("birthMinute").value);

    try {
      if (![vy, vm, vd, vh, vmin].every((n) => Number.isFinite(n))) {
        throw new Error("請先選完整出生資料");
      }

      btn.disabled = true;
      btn.textContent = "計算中…";
      hint.textContent = "正在連線後端計算（八字＋紫微＋流月＋十神）…";

      const resp = await fetch(`${API_BASE}/compute/all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: vy, month: vm, day: vd, hour: vh, minute: vmin }),
      });

      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        throw new Error(`API HTTP ${resp.status} ${t}`.trim());
      }

      const payload = await resp.json();
      console.log("compute/all payload:", payload);
      console.log("chartId from payload:", payload.chartId);

      if (!payload?.ok) throw new Error(payload?.error || "API error");

      contract = payload.features;
      if (!contract || contract.version !== "strategic_features_v1") {
        throw new Error("features 格式錯誤（不是 strategic_features_v1）");
      }

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

      if (sysEl) sysEl.classList.remove("hidden");
      if (navEl) navEl.classList.remove("hidden");
      if (navCta) navCta.classList.remove("hidden");
      if (inputEl) inputEl.classList.add("hidden");

      // summary
      const summaryBirthEl = document.getElementById("summaryBirth");
      const summaryDMEl = document.getElementById("summaryDM");
      const summaryDominantEl = document.getElementById("summaryDominant");
      const summaryRedMonthsEl = document.getElementById("summaryRedMonths");

      if (summaryBirthEl) {
        summaryBirthEl.textContent = `${vy}/${pad2(vm)}/${pad2(vd)} · ${pad2(vh)}:${pad2(vmin)}（公曆）`;
      }
      if (summaryDMEl) summaryDMEl.textContent = bazi.dmElement || "—";
      if (summaryDominantEl) summaryDominantEl.textContent = (bazi.tenGod?.dominant || "—").trim() || "—";
      if (summaryRedMonthsEl) {
        const reds = bazi.liuyue2026?.redMonths || [];
        summaryRedMonthsEl.textContent = reds.length ? reds.join("、") : "偏少（可穩推）";
      }

      // bazi + canggan + bars
      renderPillars(bazi);
      renderBar("surfaceWxBars", bazi.wuxing?.surface, 4);
      renderRadarChart("surfaceWxRadar", bazi.wuxing?.surface);
      renderFiveElementComment("surfaceWxComment", bazi.wuxing?.surface, "surface");

      renderBar("strategicWxBars", bazi.wuxing?.strategic, bazi.wuxing?.maxStrategic || 1);
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

      // ziwei grid
      renderZiwei(ziwei);

      // 紫微分數
      if (ziweiScores && ziweiScores.palaceScores) {
        renderZiweiScores(ziweiScores);
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

  function renderZiweiScores(scores) {
    const palaceBox = document.getElementById("ziweiPalaceScores");
    const wuxingBox = document.getElementById("ziweiWuxingScores");

    if (!palaceBox || !wuxingBox) {
      console.warn("ziwei score boxes not found in DOM");
      return;
    }

    console.log("[renderZiweiScores] raw scores =", scores);

    const entries = Object.entries(scores?.palaceScores || {});
    console.log("[renderZiweiScores] palace entries =", entries);
    const sortedPalaces = entries.sort((a, b) => Number(b[1]) - Number(a[1]));

    if (!sortedPalaces.length) {
      palaceBox.innerHTML = `<div class="text-xs text-slate-400">（尚未計算宮位權重）</div>`;
    } else {
      palaceBox.innerHTML = sortedPalaces
        .map(([name, val]) => {
          const n = Number(val) || 0;
          return `
            <div class="flex justify-between text-xs py-1 border-b border-white/5">
              <span class="text-slate-300">${name}</span>
              <span class="text-slate-100 font-mono">${n.toFixed(2)}</span>
            </div>
          `;
        })
        .join("");
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

    const nowY = new Date().getFullYear();
    for (let i = nowY; i >= 1940; i--) y.add(new Option(i + " 年", i));
    for (let i = 1; i <= 12; i++) m.add(new Option(i + " 月", i));
    for (let i = 0; i < 24; i++) h.add(new Option(pad2(i) + " 時", i));
    ["00", "15", "30", "45"].forEach((v) => min.add(new Option(v + " 分", v)));

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
    updateDays();

    y.addEventListener("change", updateDays);
    m.addEventListener("change", updateDays);
  }

  // ====== BOOT ======
  document.addEventListener("DOMContentLoaded", async () => {
    initSelectors();
    document.getElementById("btnLaunch").addEventListener("click", calculate);
    await loadDbContent();

    // Mobile Bottom Sheet 關閉事件
    const closeBtn = document.getElementById("palaceSheetClose");
    const backdrop = document.getElementById("palaceSheetBackdrop");
    if (closeBtn) closeBtn.addEventListener("click", closePalaceSheet);
    if (backdrop) backdrop.addEventListener("click", closePalaceSheet);
  });
})();

