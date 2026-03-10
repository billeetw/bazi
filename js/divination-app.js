    (function () {
      if (typeof console !== "undefined" && console.log) console.log("[divination] script loaded");
      var urlParams = typeof URLSearchParams !== "undefined" ? new URLSearchParams(window.location.search) : null;
      var isEmbed = urlParams && urlParams.get("embed") === "1";
      if (isEmbed) {
        var navLinks = document.getElementById("divinationNavLinks");
        if (navLinks) navLinks.classList.add("hidden");
      }

      function updateDivinationAuthHint() {
        var hint = document.getElementById("divinationAuthHint");
        var loggedIn = document.getElementById("divinationAuthLoggedIn");
        var historySection = document.getElementById("divinationHistorySection");
        if (!hint || !loggedIn) return;
        var ok = window.AuthService && window.AuthService.isLoggedIn && window.AuthService.isLoggedIn();
        hint.classList.toggle("hidden", !!ok);
        loggedIn.classList.toggle("hidden", !ok);
        if (historySection) historySection.classList.toggle("hidden", !ok);
      }
      updateDivinationAuthHint();
      window.addEventListener("auth-state-changed", updateDivinationAuthHint);

      var PENDING_DIVINATION_KEY = "pendingDivinationSave";
      function savePendingDivinationToStorage(result, question, mood, context, source) {
        try {
          sessionStorage.setItem(PENDING_DIVINATION_KEY, JSON.stringify({
            question: question || "",
            mood: mood || null,
            primaryIndex: result.primaryIndex,
            transformedIndex: result.transformedIndex,
            mutualIndex: result.mutualIndex,
            lines: result.lines,
            changingLines: result.changingLines || [],
            context: context || "career",
            source: source || "Result_Save",
          }));
        } catch (e) { console.warn("[divination] sessionStorage write failed:", e); }
      }
      function getPendingDivination() {
        try {
          var raw = sessionStorage.getItem(PENDING_DIVINATION_KEY);
          if (!raw) return null;
          return JSON.parse(raw);
        } catch (_) { return null; }
      }
      function clearPendingDivination() {
        try { sessionStorage.removeItem(PENDING_DIVINATION_KEY); } catch (_) {}
      }
      function bindPendingDivinationAfterLogin() {
        var pending = getPendingDivination();
        if (!pending || !pending.lines || pending.lines.length !== 6) return;
        var authHeaders = (window.AuthService && window.AuthService.getAuthHeaders) ? window.AuthService.getAuthHeaders() : {};
        if (!authHeaders.Authorization) return;
        var pendingPayload = {
          question: pending.question,
          mood: pending.mood,
          primaryIndex: pending.primaryIndex,
          transformedIndex: pending.transformedIndex,
          mutualIndex: pending.mutualIndex,
          lines: pending.lines,
          changingLines: pending.changingLines,
          source: pending.source,
        };
        console.log("📡 API REQUEST", "/api/divination", JSON.stringify(pendingPayload, null, 2));
        fetch("/api/divination", {
          method: "POST",
          headers: Object.assign({ "Content-Type": "application/json" }, authHeaders),
          body: JSON.stringify(pendingPayload),
        })
          .then(function (res) { return res.json().catch(function () { return {}; }); })
          .then(function (data) {
            clearPendingDivination();
            if (data && data.ok && data.id) {
              lastDivinationId = data.id;
              var savedHint = document.getElementById("resultSavedHint");
              if (savedHint) savedHint.classList.remove("hidden");
              var promptEl = document.getElementById("resultLoginPrompt");
              if (promptEl) promptEl.classList.add("hidden");
            }
          })
          .catch(function () {});
      }
      window.addEventListener("auth-state-changed", function (e) {
        if (e.detail && e.detail.loggedIn) bindPendingDivinationAfterLogin();
      });

      function runDivinationUI() {
        try {
          if (typeof console !== "undefined" && console.log) console.log("[divination] runDivinationUI start");
      const step1 = document.getElementById("step1");
      const step2 = document.getElementById("step2");
      const step3 = document.getElementById("step3");
      const btnStart = document.getElementById("btnStart");
      const holdZone = document.getElementById("holdZone");
      const btnHold = document.getElementById("btnHold");
      const holdLabel = document.getElementById("holdLabel");
      const stalksContainer = document.getElementById("stalksContainer");
      const btnAgain = document.getElementById("btnAgain");
      const changeProgress = document.getElementById("changeProgress");
      const linesPreview = document.getElementById("linesPreview");
      const progressDots = document.getElementById("progressDots");

      let hexagramsData = null;
      let palaceData = null;
      let commentariesData = null;
      let structureData = null;
      let openingWisdomData = null;
      let actionsData = null;
      let typesData = null;
      let templatesData = null;
      let transitionsData = null;
      let currentResult = null;
      let currentContext = "career";
      let timePeriod = "6months";
      let lastDivinationId = null;
      const ritualReminder = document.getElementById("ritualReminder");
      const btnRitualOk = document.getElementById("btnRitualOk");

      var LINE_STAGES = ["起步", "開始有聲譽", "多變動", "戒慎恐懼", "如日中天", "逐步引退或局外觀察"];
      function getTimeLabel(lineIndex, period) {
        if (period === "stages") return LINE_STAGES[lineIndex] || "此階段";
        if (period === "6months") return "第" + (lineIndex + 1) + "月";
        if (period === "1year") return [2, 4, 6, 8, 10, 12][lineIndex] + "月";
        if (period === "6years") return "第" + (lineIndex + 1) + "年";
        return "第" + (lineIndex + 1) + "月";
      }

      function getPositionCorrectLabel(yang, correct) {
        if (!yang && correct > 0) return "當位（陰居陰位）";
        if (!yang && correct < 0) return "不當位（陰居陽位）";
        if (yang && correct > 0) return "當位（陽居陽位）";
        if (yang && correct < 0) return "不當位（陽居陰位）";
        return correct > 0 ? "當位" : "不當位";
      }

      function getResonanceLabel(resonance, lineIndex) {
        var pairs = [[0, 3], [1, 4], [2, 5]];
        var names = ["初", "二", "三", "四", "五", "上"];
        var pair = pairs.find(function (p) { return p[0] === lineIndex || p[1] === lineIndex; });
        var pairStr = pair ? names[pair[0]] + names[pair[1]] : "";
        if (resonance > 0) return "應與（" + pairStr + "陰陽配對）";
        if (resonance < 0) return "不應（" + pairStr + "不配）";
        return "";
      }

      function renderChangingLines(result, primary, ctx, changingContent, period) {
        var line384 = typeof DivinationScore !== "undefined" && DivinationScore.getLines384 ? DivinationScore.getLines384() : null;
        var line384Data = line384 && line384.lines ? line384.lines[String(result.primaryIndex)] : null;
        var engine = typeof ScenarioEngine !== "undefined" ? ScenarioEngine : (typeof DivinationInsight !== "undefined" ? DivinationInsight : null);
        var useInsight = engine && line384Data && result.changingLines && result.changingLines.length > 0;
        var insightResult = useInsight ? engine.generateInsight({
          primaryIndex: result.primaryIndex,
          primaryName: primary ? primary.name : null,
          wuxing: palaceData ? (palaceData.palaceWuxing[palaceData.hexagramToPalace[String(result.primaryIndex)]] || "") : "",
          context: ctx,
          changingLines: result.changingLines,
          line384Data: line384Data,
          summary: typeof DivinationInterpretation !== "undefined" ? DivinationInterpretation.getSummary(result.primaryIndex) : {},
        }) : null;
        if (useInsight && insightResult && insightResult.lineInsights && insightResult.lineInsights.length > 0) {
          insightResult.lineInsights.forEach(function (item, i) {
            var idx = result.changingLines[i];
            var timeLabel = getTimeLabel(idx, period);
            var p = document.createElement("p");
            p.innerHTML = "<span class='text-amber-400/90'>" + item.lineName + " (" + timeLabel + ")</span> <span class='text-slate-300 block mt-0.5 text-sm leading-relaxed'>" + item.insight + "</span>";
            changingContent.appendChild(p);
          });
        } else {
          var hints = typeof DivinationScore !== "undefined" ? DivinationScore.getChangingLineHints(result.primaryIndex, result.changingLines) : [];
          result.changingLines.forEach(function (idx, i) {
            var p = document.createElement("p");
            var names = ["初", "二", "三", "四", "五", "上"];
            var timeLabel = getTimeLabel(idx, period);
            var lineName = names[idx] + "爻 (" + timeLabel + ")";
            var text = hints[i] && hints[i].text ? hints[i].text : (primary.lines && primary.lines[idx] ? primary.lines[idx] : "");
            var hint = hints[i] && hints[i].hint ? hints[i].hint : "";
            var hintPart = hint && hint.indexOf("：") >= 0 ? hint.substring(hint.indexOf("：") + 1) : hint;
            var posCorrect = "";
            var resLabel = "";
            if (line384Data && line384Data[idx]) {
              var ld = line384Data[idx];
              posCorrect = getPositionCorrectLabel(ld.yang, ld.correct);
              resLabel = getResonanceLabel(ld.resonance, idx);
            }
            var metaLine = (posCorrect || resLabel) ? "<span class='text-slate-500 block mt-1 text-xs'>" + posCorrect + (posCorrect && resLabel ? " · " : "") + resLabel + "</span>" : "";
            p.innerHTML = "<span class='text-amber-400/90'>" + lineName + "</span> " + (text || "") + (hintPart ? "<span class='text-slate-400 block mt-0.5 text-xs'>" + hintPart + "</span>" : "") + metaLine;
            changingContent.appendChild(p);
          });
        }
      }

      function applyInsight(result, ctx, primary, primaryWuxing) {
        primary = primary || getHexagram(result.primaryIndex);
        primaryWuxing = primaryWuxing || (palaceData && palaceData.hexagramToPalace[String(result.primaryIndex)] ? palaceData.palaceWuxing[palaceData.hexagramToPalace[String(result.primaryIndex)]] : null);
        var engine = typeof ScenarioEngine !== "undefined" ? ScenarioEngine : (typeof DivinationInsight !== "undefined" ? DivinationInsight : null);
        if (engine) {
          var line384 = typeof DivinationScore !== "undefined" && DivinationScore.getLines384 ? DivinationScore.getLines384() : null;
          var line384Data = line384 && line384.lines ? line384.lines[String(result.primaryIndex)] : null;
          var insight = engine.generateInsight({
            primaryIndex: result.primaryIndex,
            primaryName: primary ? primary.name : null,
            wuxing: primaryWuxing || "",
            context: ctx,
            changingLines: result.changingLines || [],
            line384Data: line384Data || [],
            summary: typeof DivinationInterpretation !== "undefined" ? DivinationInterpretation.getSummary(result.primaryIndex) : {},
          });
          document.getElementById("primaryInterpretationText").textContent = insight.globalInsight;
          var spaceBlock = document.getElementById("spaceGuideBlock");
          var spaceText = document.getElementById("spaceGuideText");
          if (insight.spaceGuide && spaceBlock && spaceText) {
            spaceText.textContent = insight.spaceGuide;
            spaceBlock.classList.remove("hidden");
          } else if (spaceBlock) {
            spaceBlock.classList.add("hidden");
          }
          var changingContent = document.getElementById("changingLinesContent");
          if (result.changingLines && result.changingLines.length > 0 && changingContent) {
            changingContent.innerHTML = "";
            renderChangingLines(result, primary, ctx, changingContent, timePeriod);
          }
        } else if (typeof DivinationInterpretation !== "undefined") {
          document.getElementById("primaryInterpretationText").textContent = DivinationInterpretation.getPrimaryInterpretation(result.primaryIndex, primary ? primary.name : null, primaryWuxing || "", ctx);
          document.getElementById("spaceGuideBlock").classList.add("hidden");
        } else {
          document.getElementById("primaryInterpretationText").textContent = "";
          document.getElementById("spaceGuideBlock").classList.add("hidden");
        }
      }

      function loadCommentaries() {
        if (commentariesData) return Promise.resolve(commentariesData);
        return fetch("data/iching/hexagram-commentaries.json").then((r) => r.json()).then((d) => { commentariesData = d; return d; });
      }

      function loadHexagrams() {
        return fetch("data/iching/hexagrams.json").then((r) => r.json());
      }

      function loadPalace() {
        return fetch("data/iching/hexagram-palace.json").then((r) => r.json());
      }

      function loadStructure() {
        if (structureData) return Promise.resolve(structureData);
        return fetch("data/iching/hexagram-structure.json").then((r) => r.json()).then((d) => { structureData = d; return d; });
      }
      function loadOpeningWisdom() {
        if (openingWisdomData) return Promise.resolve(openingWisdomData);
        return fetch("data/iching/hexagram-opening-wisdom.json").then((r) => r.json()).then((d) => { openingWisdomData = d; return d; });
      }
      function loadActions() {
        if (actionsData) return Promise.resolve(actionsData);
        return fetch("data/iching/hexagram-actions.json").then((r) => r.json()).then((d) => { actionsData = d; return d; });
      }
      function loadTypes() {
        if (typesData) return Promise.resolve(typesData);
        return fetch("data/iching/hexagram-types.json").then((r) => r.json()).then((d) => { typesData = d; return d; });
      }
      function loadTemplates() {
        if (templatesData) return Promise.resolve(templatesData);
        return fetch("data/iching/type-action-templates.json").then((r) => r.json()).then((d) => { templatesData = d; return d; });
      }
      function loadTransitions() {
        if (transitionsData) return Promise.resolve(transitionsData);
        return fetch("data/iching/hexagram-transitions.json").then((r) => r.json()).then((d) => { transitionsData = d; return d; });
      }

      function getHexagram(i) {
        if (!hexagramsData) return null;
        return hexagramsData.hexagrams.find((h) => h.i === i) || null;
      }

      function getLineLabel(i, value) {
        var posNames = ["初", "二", "三", "四", "五", "上"];
        var num = (value === 7 || value === 9) ? "九" : "六";
        if (i === 0) return "初" + num;
        if (i === 5) return "上" + num;
        return num + posNames[i];
      }

      function renderLines(container, lines, primaryIndexForTooltip, changingLineIndices, animate) {
        container.innerHTML = "";
        var line384 = (typeof DivinationScore !== "undefined" && DivinationScore.getLines384) ? DivinationScore.getLines384() : null;
        line384 = line384 && line384.lines ? line384.lines : line384;
        var changingSet = changingLineIndices && changingLineIndices.length ? new Set(changingLineIndices) : null;
        for (var i = 5; i >= 0; i--) {
          var div = document.createElement("div");
          div.className = "flex items-center gap-2" + (animate ? " line-enter" : "");
          if (animate) div.style.animationDelay = i * 0.08 + "s";
          var span = document.createElement("span");
          span.className = "w-8 text-xs text-slate-500" + (changingSet && changingSet.has(i) ? " line-label-changing" : "");
          span.textContent = getLineLabel(i, lines[i]);
          div.appendChild(span);
          var lineWrap = document.createElement("div");
          lineWrap.className = "line-with-tooltip relative inline-block";
          var line = document.createElement("div");
          line.className = (lines[i] === 7 || lines[i] === 9 ? "line-yang" : "line-yin") + " w-16" + (changingSet && changingSet.has(i) ? " line-changing" : "");
          lineWrap.appendChild(line);
          if (primaryIndexForTooltip != null && line384 && line384[String(primaryIndexForTooltip)] && line384[String(primaryIndexForTooltip)][i]) {
            var ld = line384[String(primaryIndexForTooltip)][i];
            var tooltip = document.createElement("span");
            tooltip.className = "line-tooltip";
            var tl = getTimeLabel(i, timePeriod);
            tooltip.textContent = (ld.correct > 0 ? "當位" : "不當位") + " " + (ld.resonance > 0 ? "正應" : "不應") + " " + tl + " 量級" + (ld.mag || (i + 1));
            lineWrap.appendChild(tooltip);
          }
          div.appendChild(lineWrap);
          container.appendChild(div);
        }
      }

      function linesToBinary(lines) {
        return lines.map((v) => (v === 7 || v === 9 ? 1 : 0));
      }

      function renderStalks() {
        if (!stalksContainer) return;
        stalksContainer.innerHTML = "";
        for (var i = 0; i < 49; i++) {
          var s = document.createElement("div");
          s.className = "stalk";
          stalksContainer.appendChild(s);
        }
      }

      var fullDataPromise = null;
      function ensureFullData() {
        if (fullDataPromise) return fullDataPromise;
        fullDataPromise = Promise.all([
          loadCommentaries(),
          loadStructure(),
          loadOpeningWisdom(),
          loadActions(),
          loadTypes(),
          loadTemplates(),
          loadTransitions(),
          typeof DivinationScore !== "undefined" ? DivinationScore.loadLines384() : Promise.resolve(),
          typeof DivinationInterpretation !== "undefined" ? DivinationInterpretation.loadSummaries() : Promise.resolve(),
        ]).then(function (arr) {
          commentariesData = arr[0];
          structureData = arr[1];
          openingWisdomData = arr[2];
          actionsData = arr[3];
          typesData = arr[4];
          templatesData = arr[5];
          transitionsData = arr[6];
        });
        return fullDataPromise;
      }

      function onStartDivination() {
        try {
          var q = document.getElementById("question").value.trim();
          if (!q) {
            alert("請先寫下你的問題");
            return;
          }
          ensureFullData();
          var tp = document.querySelector('input[name="timePeriod"]:checked');
          timePeriod = tp ? tp.value : "6months";
          if (step1) step1.classList.add("hidden");
          if (ritualReminder) {
            ritualReminder.classList.remove("hidden");
          } else if (step2) {
            document.body.classList.remove("wuxing-金", "wuxing-木", "wuxing-水", "wuxing-火", "wuxing-土");
            if (changeProgress) changeProgress.textContent = "長按開始";
            if (holdLabel) holdLabel.textContent = "長按";
            if (linesPreview) { linesPreview.innerHTML = ""; linesPreview.classList.remove("lines-complete"); }
            clearProgressDots();
            lineValues = [];
            renderStalks();
            step2.classList.remove("hidden");
          }
        } catch (err) {
          console.error("[divination] 進入占卦錯誤:", err);
          alert("操作時發生錯誤，請重新整理頁面再試。");
        }
      }
      if (btnStart) {
        btnStart.addEventListener("click", onStartDivination);
        if (typeof console !== "undefined" && console.log) console.log("[divination] btnStart listener attached");
      } else {
        console.warn("[divination] btnStart not found, will bind on DOMContentLoaded");
        document.addEventListener("DOMContentLoaded", function () {
          var el = document.getElementById("btnStart");
          if (el) { el.addEventListener("click", onStartDivination); console.log("[divination] btnStart listener attached (after DOMContentLoaded)"); }
        });
      }
      function clearProgressDots() {
        if (!progressDots) return;
        progressDots.querySelectorAll(".divination-progress-dot").forEach(function (d) { d.classList.remove("active"); });
      }
      function updateProgressDots(count) {
        if (!progressDots) return;
        progressDots.querySelectorAll(".divination-progress-dot").forEach(function (d, i) {
          if (i < count) d.classList.add("active"); else d.classList.remove("active");
        });
      }
      if (btnRitualOk) btnRitualOk.addEventListener("click", function () {
        if (ritualReminder) ritualReminder.classList.add("hidden");
        if (step2) step2.classList.remove("hidden");
        document.body.classList.remove("wuxing-金", "wuxing-木", "wuxing-水", "wuxing-火", "wuxing-土");
        if (changeProgress) changeProgress.textContent = "長按開始";
        if (holdLabel) holdLabel.textContent = "長按";
        if (linesPreview) { linesPreview.innerHTML = ""; linesPreview.classList.remove("lines-complete"); }
        clearProgressDots();
        lineValues = [];
        renderStalks();
      });

      var lineValues = [];
      var holdTimer = null;
      var isHolding = false;

      function onHoldStart(e) {
        e.preventDefault();
        if (lineValues.length >= 6) return;
        isHolding = true;
        holdZone.classList.add("divination-holding");
        if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
          window.gtag("event", "divination_hold_start", { lines_done: lineValues.length });
        }
        holdLabel.textContent = "蓄力中…";
        stalksContainer.classList.remove("opacity-60");
        stalksContainer.classList.add("opacity-100");
        holdTimer = setInterval(function () {
          if (lineValues.length >= 6) {
            clearInterval(holdTimer);
            holdTimer = null;
            return;
          }
          var value = (DayanDivination.getOneLine && DayanDivination.getOneLine(49)) || 7;
          lineValues.push(value);
          updateProgressDots(lineValues.length);
          if (navigator.vibrate) navigator.vibrate(50);
          var posNames = ["初", "二", "三", "四", "五", "上"];
          var pos = lineValues.length - 1;
          var num = (value === 7 || value === 9) ? "九" : "六";
          var label = (pos === 0 ? "初" + num : pos === 5 ? "上" + num : num + posNames[pos]);
          var div = document.createElement("div");
          div.className = "flex items-center gap-2 line-enter";
          div.innerHTML = "<span class='w-8 text-xs text-slate-500'>" + label + "</span><div class='" + (value === 7 || value === 9 ? "line-yang" : "line-yin") + " w-16'></div>";
          linesPreview.insertBefore(div, linesPreview.firstChild);
          changeProgress.textContent = "第 " + lineValues.length + " 爻 / 6";
          if (lineValues.length >= 6) {
            clearInterval(holdTimer);
            holdTimer = null;
            holdLabel.textContent = "完成";
            stalksContainer.classList.add("opacity-40");
            linesPreview.classList.add("lines-complete");
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
            setTimeout(function () {
              applyWuxingThemeAndShowResult();
            }, 800);
          }
        }, 1200);
      }

      function onHoldEnd(e) {
        e.preventDefault();
        if (!isHolding) return;
        isHolding = false;
        holdZone.classList.remove("divination-holding");
        if (lineValues.length < 6 && typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
          window.gtag("event", "divination_hold_abandon", { lines_done: lineValues.length });
        }
        holdLabel.textContent = "長按";
        stalksContainer.classList.remove("opacity-100");
        stalksContainer.classList.add("opacity-60");
        if (holdTimer) {
          clearInterval(holdTimer);
          holdTimer = null;
        }
      }

      function applyWuxingThemeAndShowResult() {
        var idx = DayanDivination.getKingWenIndex(lineValues);
        var palace = palaceData ? palaceData.hexagramToPalace[String(idx)] : null;
        var wuxing = palace && palaceData ? palaceData.palaceWuxing[palace] : null;
        if (wuxing) document.body.classList.add("wuxing-" + wuxing);
        step2.classList.add("hidden");
        step3.classList.remove("hidden");
        setTimeout(function () {
          ensureFullData().then(function () {
            showResult();
            var scrollToResult = function () {
              try {
                step3.scrollIntoView({ behavior: "smooth", block: "start" });
              } catch (e) {
                step3.scrollIntoView(true);
              }
            };
            setTimeout(scrollToResult, 150);
            setTimeout(scrollToResult, 500);
          });
        }, 100);
      }

      btnHold.addEventListener("mousedown", onHoldStart);
      btnHold.addEventListener("mouseup", onHoldEnd);
      btnHold.addEventListener("mouseleave", onHoldEnd);
      btnHold.addEventListener("touchstart", onHoldStart, { passive: false });
      btnHold.addEventListener("touchend", onHoldEnd, { passive: false });
      btnHold.addEventListener("touchcancel", onHoldEnd, { passive: false });

      function showResult(prebuiltResult) {
        var result;
        if (prebuiltResult && prebuiltResult.lines && prebuiltResult.primaryIndex != null) {
          result = prebuiltResult;
          lineValues = result.lines.slice();
        } else {
          result = {};
          result.lines = lineValues.slice();
          result.primaryIndex = DayanDivination.getKingWenIndex(lineValues);
          result.transformedIndex = DayanDivination.getKingWenIndex(DayanDivination.getTransformedLines(lineValues));
          result.mutualIndex = BINARY_TO_KING_WEN[DayanDivination.getMutualHexagram(lineValues).slice().reverse().join("")] || 1;
          result.changingLines = lineValues.map(function (v, i) { return (v === 6 || v === 9 ? i : -1); }).filter(function (i) { return i >= 0; });
        }
        var question = (prebuiltResult && prebuiltResult.question) ? String(prebuiltResult.question) : (document.getElementById("question") ? document.getElementById("question").value.trim() : "");
        var analysis = typeof window.analyzeQuestion === "function" ? window.analyzeQuestion(question) : null;
        var defaultContext = "career";
        if (analysis && analysis.category) {
          if (analysis.category === "wealth") defaultContext = "wealth";
          else if (analysis.category === "love") defaultContext = "love";
          else if (analysis.category === "health" || analysis.category === "general") defaultContext = "neutral";
        }
        var transformed = DayanDivination.getTransformedLines(lineValues);
        var mutualBin = DayanDivination.getMutualHexagram(lineValues);

        const primary = getHexagram(result.primaryIndex);
        const transformedH = getHexagram(result.transformedIndex);
        const mutual = getHexagram(result.mutualIndex);

        document.getElementById("primaryName").textContent = (primary ? primary.name : "—") + "卦";
        document.getElementById("transformedName").textContent = (transformedH ? transformedH.name : "—") + "卦";
        document.getElementById("mutualName").textContent = (mutual ? mutual.name : "—") + "卦";

        var contextLabelMap = { career: "事業", wealth: "財運", love: "感情", neutral: "無特定" };
        var contextWrap = document.getElementById("contextToggleWrap");
        var contextCurrentEl = document.getElementById("contextCurrentLabel");
        var contextButtonsWrap = document.getElementById("contextButtonsWrap");
        if (contextWrap) {
          contextWrap.classList.remove("hidden");
          contextWrap.classList.add("flex");
        }
        if (contextCurrentEl) contextCurrentEl.textContent = contextLabelMap[defaultContext] || defaultContext;
        if (contextButtonsWrap) contextButtonsWrap.classList.add("hidden");
        var ctxBtns = contextButtonsWrap ? contextButtonsWrap.querySelectorAll(".context-btn") : [];
        ctxBtns.forEach(function (b) {
          b.classList.remove("border-amber-400", "text-amber-300", "bg-amber-500/20");
          b.classList.add("border-slate-600", "text-slate-400");
          if (b.dataset.context === defaultContext) {
            b.classList.add("border-amber-400", "text-amber-300", "bg-amber-500/20");
            b.classList.remove("border-slate-600", "text-slate-400");
          }
        });
        currentResult = result;
        currentContext = defaultContext;

        var timeRangeEl = document.getElementById("resultTimeRange");
        if (timeRangeEl) {
          var rangeLabels = { "6months": "半年（1–6 月）", "1year": "一年（2、4、6、8、10、12 月）", "6years": "六年（第1–6 年）", "stages": "無特定區間（六階段）" };
          timeRangeEl.textContent = "問事範圍：" + (rangeLabels[timePeriod] || rangeLabels["6months"]);
        }

        var primaryPalaceForResp = palaceData ? palaceData.hexagramToPalace[String(result.primaryIndex)] : null;
        var primaryWuxingForResp = primaryPalaceForResp && palaceData ? palaceData.palaceWuxing[primaryPalaceForResp] : null;
        var monthlyResult = typeof DivinationScore !== "undefined" && DivinationScore.computeMonthlyScores
          ? DivinationScore.computeMonthlyScores(result.primaryIndex, result.changingLines, primaryWuxingForResp)
          : { months: [], totalTrend: "" };
        var readingForSummary = {
          primaryIndex: result.primaryIndex,
          primaryName: primary ? primary.name : null,
          mutualName: mutual ? mutual.name : null,
          transformedName: transformedH ? transformedH.name : null,
          monthlyScores: monthlyResult.months || [],
          totalTrend: monthlyResult.totalTrend || "平",
          changingLines: result.changingLines || [],
          timePeriod: timePeriod || "6months",
        };
        function escapeHtml(s) {
          return String(s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c;
          });
        }
        var summary = typeof BuildCoreSummary !== "undefined" && BuildCoreSummary.buildCoreSummary
          ? BuildCoreSummary.buildCoreSummary({
              questionText: question,
              analysis: analysis || {},
              reading: readingForSummary,
              typesData: typesData,
              templatesData: templatesData,
              transitionsData: transitionsData,
              actionsData: actionsData,
            })
          : null;
        if (summary) {
          var askedEl = document.getElementById("coreSummaryAsked");
          var tagsEl = document.getElementById("coreSummaryTags");
          var conclusionEl = document.getElementById("coreSummaryConclusion");
          var actionsEl = document.getElementById("coreSummaryActions");
          var bestEl = document.getElementById("coreSummaryBest");
          var turningEl = document.getElementById("coreSummaryTurning");
          var riskEl = document.getElementById("coreSummaryRisk");
          if (askedEl) askedEl.textContent = summary.header.asked;
          if (tagsEl) {
            tagsEl.innerHTML = (summary.header.tags || []).map(function (t) {
              return '<span class="text-xs px-2 py-1 rounded-full bg-white/10 text-slate-300">' + escapeHtml(t) + "</span>";
            }).join("");
          }
          if (conclusionEl) conclusionEl.textContent = summary.header.conclusion;
          if (actionsEl) {
            actionsEl.innerHTML = (summary.actions || []).map(function (a) {
              return "<li>" + escapeHtml(a) + "</li>";
            }).join("");
          }
          var tw = summary.timeWindows || {};
          if (bestEl) bestEl.innerHTML = (tw.best || []).map(function (x) {
            return '<span class="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">' + escapeHtml(x.label) + " +" + (x.score || 0) + "</span>";
          }).join("") || '<span class="text-xs text-slate-500">無</span>';
          if (turningEl) turningEl.innerHTML = (tw.turning || []).length ? (tw.turning || []).map(function (x) {
            return '<span class="text-xs px-2 py-1 rounded-full bg-sky-500/20 text-sky-300">' + escapeHtml(x.label) + " ★</span>";
          }).join("") : '<span class="text-xs text-slate-500">無</span>';
          if (riskEl) riskEl.innerHTML = (tw.risk || []).length ? (tw.risk || []).map(function (x) {
            return '<span class="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">' + escapeHtml(x.label) + " " + (x.score || 0) + "</span>";
          }).join("") : '<span class="text-xs text-slate-500">無</span>';
          var fbSection = document.getElementById("feedbackSection");
          var verifiableBlock = document.getElementById("feedbackVerifiableBlock");
          var verifiableText = document.getElementById("feedbackVerifiableText");
          var checkboxesContainer = document.getElementById("feedbackVerifiableCheckboxes");
          if (fbSection && summary.verifiablePoint) {
            fbSection.dataset.verifiablePoint = summary.verifiablePoint;
            if (verifiableBlock && verifiableText) {
              verifiableText.textContent = summary.verifiablePoint;
              verifiableBlock.classList.remove("hidden");
              if (checkboxesContainer && summary.verifiableCheckboxes && summary.verifiableCheckboxes.length > 0) {
                checkboxesContainer.innerHTML = summary.verifiableCheckboxes.map(function (label, i) {
                  return '<label class="flex items-center gap-2 text-slate-400 text-xs cursor-pointer"><input type="checkbox" class="verifiable-checkbox rounded" data-index="' + i + '"><span>' + escapeHtml(label) + "</span></label>";
                }).join("");
              } else if (checkboxesContainer) {
                checkboxesContainer.innerHTML = "";
              }
            }
          } else if (verifiableBlock) {
            verifiableBlock.classList.add("hidden");
          }
          var safetyBlock = document.getElementById("safetyDisclaimerBlock");
          var safetyText = document.getElementById("safetyDisclaimerText");
          if (safetyBlock && safetyText) {
            var cat = analysis ? analysis.category : "general";
            var q = (question || "").toLowerCase();
            var needsLegal = /法律|官司|訴訟|律師|判決/.test(q);
            var needsHealth = cat === "health";
            var needsWealth = cat === "wealth" || /投資|股票|基金|標的/.test(q);
            var parts = [];
            if (needsHealth) parts.push("健康問題請依醫師建議就醫，本解讀僅供趨勢參考。");
            if (needsWealth) parts.push("投資理財有風險，請勿依此單一依據做決策。");
            if (needsLegal) parts.push("法律事務請諮詢專業律師。");
            if (parts.length > 0) {
              safetyText.textContent = parts.join(" ");
              safetyBlock.classList.remove("hidden");
            } else {
              safetyBlock.classList.add("hidden");
            }
          }
        }

        renderLines(document.getElementById("primaryLines"), lineValues, result.primaryIndex, result.changingLines, true);
        renderLines(document.getElementById("transformedLines"), transformed, null, null, true);
        const mutualLines = mutualBin.map((b) => (b === 1 ? 7 : 8));
        renderLines(document.getElementById("mutualLines"), mutualLines, null, null, true);

        if (primary) {
          document.getElementById("judgment").textContent = primary.judgment;
        }
        var ow = openingWisdomData && openingWisdomData.hexagrams ? openingWisdomData.hexagrams[String(result.primaryIndex)] : null;
        var owBlock = document.getElementById("openingWisdomBlock");
        if (ow && owBlock) {
          document.getElementById("openingWisdomText").textContent = ow.modernMeaning;
          document.getElementById("cultivationCoreText").textContent = "👉 修養核心：" + (ow.cultivationCore || "");
          owBlock.classList.remove("hidden");
        } else if (owBlock) owBlock.classList.add("hidden");
        var st = structureData && structureData.hexagrams ? structureData.hexagrams[String(result.primaryIndex)] : null;
        var stCard = document.getElementById("structureLearningCard");
        if (st && stCard && palaceData) {
          var upperWx = palaceData.palaceWuxing[st.upper] || "";
          var lowerWx = palaceData.palaceWuxing[st.lower] || "";
          document.getElementById("structureUpperLower").textContent = "上卦：" + st.upper + (upperWx ? "（" + upperWx + "）" : "") + "　下卦：" + st.lower + (lowerWx ? "（" + lowerWx + "）" : "");
          document.getElementById("structureDesc").textContent = st.structureDesc;
          document.getElementById("structureContradiction").textContent = st.contradiction;
          document.getElementById("structureLearningHintText").textContent = st.learningHint;
          stCard.classList.remove("hidden");
        } else if (stCard) stCard.classList.add("hidden");
        var comm = commentariesData && commentariesData.commentaries ? commentariesData.commentaries[String(result.primaryIndex)] : null;
        var tuanEl = document.getElementById("tuanText");
        var daxiangEl = document.getElementById("daxiangText");
        if (comm && comm.tuan) {
          document.getElementById("tuanContent").textContent = comm.tuan;
          tuanEl.classList.remove("hidden");
        } else {
          tuanEl.classList.add("hidden");
        }
        if (comm && comm.daxiang) {
          document.getElementById("daxiangContent").textContent = comm.daxiang;
          daxiangEl.classList.remove("hidden");
        } else {
          daxiangEl.classList.add("hidden");
        }
        var primaryPalace = palaceData ? palaceData.hexagramToPalace[String(result.primaryIndex)] : null;
        var primaryWuxing = primaryPalace && palaceData ? palaceData.palaceWuxing[primaryPalace] : null;
        applyInsight(result, defaultContext, primary, primaryWuxing);

        var mutualInterpSection = document.getElementById("mutualInterpretationSection");
        var transformedInterpSection = document.getElementById("transformedInterpretationSection");
        if (typeof DivinationInterpretation !== "undefined" && palaceData) {
          var mutualPalace = palaceData.hexagramToPalace[String(result.mutualIndex)];
          var mutualWuxing = mutualPalace ? palaceData.palaceWuxing[mutualPalace] : null;
          var transformedPalace = palaceData.hexagramToPalace[String(result.transformedIndex)];
          var transformedWuxing = transformedPalace ? palaceData.palaceWuxing[transformedPalace] : null;
          mutualInterpSection.classList.remove("hidden");
          transformedInterpSection.classList.remove("hidden");
          var mutualHint = document.getElementById("mutualInterpretationHint");
          var transformedHint = document.getElementById("transformedInterpretationHint");
          if (timePeriod === "stages") {
            if (mutualHint) mutualHint.textContent = "由本卦二三四、三四五爻重組，代表「多變動」與「戒慎恐懼」階段的轉型期。";
            if (transformedHint) transformedHint.textContent = "由動爻變換產生，代表發展的歸宿。";
          } else if (timePeriod === "6years") {
            if (mutualHint) mutualHint.textContent = "由本卦二三四、三四五爻重組，代表第 3–4 年的轉型期。";
            if (transformedHint) transformedHint.textContent = "由動爻變換產生，代表第 6 年後的定調。";
          } else if (timePeriod === "1year") {
            if (mutualHint) mutualHint.textContent = "由本卦二三四、三四五爻重組，代表 6月、8月 的轉型期。";
            if (transformedHint) transformedHint.textContent = "由動爻變換產生，代表 12月 後的定調。";
          } else {
            if (mutualHint) mutualHint.textContent = "由本卦二三四、三四五爻重組，代表第 3–4 月的轉型期。";
            if (transformedHint) transformedHint.textContent = "由動爻變換產生，代表第 6 月後的定調。";
          }
          var ctx = defaultContext;
          document.getElementById("mutualInterpretation").textContent = DivinationInterpretation.getMutualInterpretation(result.mutualIndex, mutual ? mutual.name : null, mutualWuxing || "", ctx, timePeriod);
          document.getElementById("transformedInterpretation").textContent = DivinationInterpretation.getTransformedInterpretation(result.transformedIndex, transformedH ? transformedH.name : null, transformedWuxing || "", ctx, timePeriod);
          var act = actionsData && actionsData.hexagrams ? actionsData.hexagrams[String(result.mutualIndex)] : null;
          var mutTasks = document.getElementById("mutualLearningTasks");
          var mutList = document.getElementById("mutualLearningTasksList");
          if (act && act.learningTasks && act.learningTasks.length > 0 && mutTasks && mutList) {
            mutList.innerHTML = "";
            act.learningTasks.forEach(function (t) {
              var li = document.createElement("li");
              li.textContent = t;
              mutList.appendChild(li);
            });
            mutTasks.classList.remove("hidden");
          } else if (mutTasks) mutTasks.classList.add("hidden");
        } else {
          mutualInterpSection.classList.add("hidden");
          transformedInterpSection.classList.add("hidden");
        }

        var hints = [];
        const changingContent = document.getElementById("changingLinesContent");
        const periodHintEl = document.getElementById("changingLinesPeriodHint");
        var periodHint = "";
        if (timePeriod === "stages") periodHint = "初爻＝起步、二爻＝開始有聲譽、三爻＝多變動、四爻＝戒慎恐懼、五爻＝如日中天、上爻＝逐步引退或局外觀察。";
        else if (timePeriod === "6months") periodHint = "初爻＝第1月、二爻＝第2月…上爻＝第6月。";
        else if (timePeriod === "1year") periodHint = "初爻＝2月、二爻＝4月、三爻＝6月、四爻＝8月、五爻＝10月、上爻＝12月。";
        else if (timePeriod === "6years") periodHint = "初爻＝第1年、二爻＝第2年…上爻＝第6年。";
        periodHintEl.textContent = periodHint;
        changingContent.innerHTML = "";
        if (result.changingLines && result.changingLines.length > 0 && primary) {
          renderChangingLines(result, primary, "career", changingContent, timePeriod);
        } else {
          changingContent.innerHTML = "<p class='text-slate-500 text-sm'>本卦無動爻，六爻皆靜，代表事情發展較為穩定。</p>";
        }

        var trendSection = document.getElementById("trendSection");
        var shareSection = document.getElementById("shareSection");
        if (typeof DivinationScore !== "undefined" && palaceData) {
          var palace = palaceData.hexagramToPalace[String(result.primaryIndex)];
          var wuxing = palace ? palaceData.palaceWuxing[palace] : null;
          if (wuxing) {
            var trend = DivinationScore.computeMonthlyScores(result.primaryIndex, result.changingLines, wuxing);
            trendSection.classList.remove("hidden");
            var trendTitle = document.getElementById("trendSectionTitle");
            var trendHint = document.getElementById("trendSectionHint");
            if (timePeriod === "stages") {
              trendTitle.textContent = "六階段趨勢";
              trendHint.textContent = "依當位、應與、流年加權運算。動爻所在階段為轉折點。";
            } else if (timePeriod === "6months") {
              trendTitle.textContent = "半年趨勢（1–6 月）";
              trendHint.textContent = "依當位、應與、流年加權運算。動爻月為轉折點。";
            } else if (timePeriod === "1year") {
              trendTitle.textContent = "年度趨勢（2、4、6、8、10、12 月）";
              trendHint.textContent = "依當位、應與、流年加權運算。動爻月為轉折點。";
            } else {
              trendTitle.textContent = "六年趨勢（第1–6 年）";
              trendHint.textContent = "依當位、應與、流年加權運算。動爻年為轉折點。";
            }
            var trendMonths = document.getElementById("trendMonths");
            trendMonths.innerHTML = "";
            trend.months.forEach(function (m) {
              var div = document.createElement("div");
              div.className = "flex items-center gap-3";
              var label = document.createElement("span");
              label.className = "w-20 text-xs text-slate-500";
              var periodLabel = timePeriod === "stages" ? (LINE_STAGES[m.month - 1] || "階段" + m.month) : (timePeriod === "6months" ? "第" + m.month + "月" : (timePeriod === "1year" ? [2, 4, 6, 8, 10, 12][m.month - 1] + "月" : "第" + m.month + "年"));
              label.textContent = periodLabel + (m.isChanging ? " ★" : "");
              var bar = document.createElement("div");
              bar.className = "flex-1 h-4 rounded bg-slate-700 overflow-hidden";
              var fill = document.createElement("div");
              fill.style.width = Math.min(100, Math.max(0, 50 + m.score)) + "%";
              fill.style.height = "100%";
              fill.style.background = m.score >= 0 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#64748b,#94a3b8)";
              bar.appendChild(fill);
              var scoreSpan = document.createElement("span");
              scoreSpan.className = "w-8 text-xs text-slate-400";
              scoreSpan.textContent = m.score >= 0 ? "+" + m.score : m.score;
              div.appendChild(label);
              div.appendChild(bar);
              div.appendChild(scoreSpan);
              trendMonths.appendChild(div);
            });
            document.getElementById("trendSummary").textContent = "整體趨勢：" + trend.totalTrend;
            var lowestIdx = 0;
            for (var mi = 1; mi < trend.months.length; mi++) {
              if (trend.months[mi].score < trend.months[lowestIdx].score) lowestIdx = mi;
            }
            var lowestMonth = trend.months[lowestIdx];
            var changingSet = new Set(result.changingLines || []);
            var lowestIsChanging = changingSet.has(lowestIdx);
            var lowestInMutual = (lowestIdx === 2 || lowestIdx === 3);
            var explainEl = document.getElementById("trendLowestExplain");
            if (explainEl && lowestMonth) {
              if (lowestIsChanging) {
                explainEl.textContent = "谷底不是結束，是換軌時刻。本月為動爻轉折點，卦象在此處發生實質變化，舊結構尚未完成，新方向尚未穩定。能量下探不代表失敗，而是轉型未完成的過渡期。關鍵不在進攻，而在校準。";
                explainEl.classList.remove("hidden");
              } else if (lowestInMutual) {
                explainEl.textContent = "不是外部卡住，是內部尚未對齊。本月對應互卦能量，互卦代表內在機制與隱性因果。當內部秩序尚未完成，外在推進必然受阻。能量下降是提醒你：先整頓內部，再談突破。";
                explainEl.classList.remove("hidden");
              } else {
                explainEl.classList.add("hidden");
              }
            }
            var alerts = typeof DivinationReminders !== "undefined" ? DivinationReminders.getAlertsForMonths(trend.months, 0, timePeriod) : [];
            var alertSection = document.getElementById("alertSection");
            if (alerts.length > 0 && alertSection) {
              alertSection.classList.remove("hidden");
              var alertHintEl = document.getElementById("alertSectionHint");
              if (alertHintEl) alertHintEl.textContent = timePeriod === "stages" ? "以下階段分數偏低，卦象提醒宜守不宜進。" : (timePeriod === "6years" ? "以下年份分數偏低，卦象提醒宜守不宜進。" : "以下月份分數偏低，卦象提醒宜守不宜進。");
              var alertContent = document.getElementById("alertContent");
              alertContent.innerHTML = "";
              alerts.forEach(function (a) {
                var card = document.createElement("div");
                card.className = "p-3 rounded-lg border border-amber-400/20 bg-amber-500/5";
                card.innerHTML = "<p class='font-semibold text-amber-300 text-sm'>" + a.title + "</p><p class='text-slate-400 text-sm mt-1 leading-relaxed'>" + a.body + "</p>";
                alertContent.appendChild(card);
              });
              var consultCta = document.getElementById("alertConsultCta");
              if (consultCta) {
                consultCta.classList.remove("hidden");
                consultCta.href = "consultation.html?from=divination_alert";
              }
            } else if (alertSection) {
              alertSection.classList.add("hidden");
            }
          }
          shareSection.classList.remove("hidden");
          var changingHint = "";
          if (result.changingLines && result.changingLines.length > 0 && hints[0]) {
            var firstHint = (hints[0].hint || "").split("：")[0];
            var firstTimeLabel = getTimeLabel(result.changingLines[0], timePeriod);
            changingHint = "系統提醒：" + firstTimeLabel + "要懂得「" + firstHint + "」。";
          }
          var shareText = DivinationScore.getShareTemplate(
            primary ? primary.name : "—",
            transformedH ? transformedH.name : "—",
            changingHint
          );
          shareSection.dataset.shareText = shareText;
          var btnShareNative = document.getElementById("btnShareNative");
          var btnShareLine = document.getElementById("btnShareLine");
          if (btnShareNative) {
            btnShareNative.classList.toggle("hidden", !(navigator.share && typeof navigator.share === "function"));
          }
          if (btnShareLine) {
            btnShareLine.href = "https://line.me/R/msg/text/" + encodeURIComponent(shareText);
            btnShareLine.classList.remove("hidden");
          }
        } else {
          trendSection.classList.add("hidden");
          shareSection.classList.add("hidden");
        }

        const now = new Date();
        document.getElementById("resultTimestamp").textContent = "占卦時間：" + now.toLocaleString("zh-TW", { dateStyle: "medium", timeStyle: "short" });

        var flowYearSection = document.getElementById("flowYearSection");
        var directionsSection = document.getElementById("directionsSection");
        if (typeof DivinationWuxing !== "undefined" && palaceData) {
          var palace = palaceData.hexagramToPalace[String(result.primaryIndex)];
          var wuxing = palace ? palaceData.palaceWuxing[palace] : null;
          if (wuxing) {
            var advice = DivinationWuxing.getFlowYearAdvice(wuxing, DivinationWuxing.FLOW_2026);
            if (advice) {
              flowYearSection.classList.remove("hidden");
              document.getElementById("flowYearAdvice").textContent = advice.name + "：" + advice.summary;
            } else {
              flowYearSection.classList.add("hidden");
            }
          } else {
            flowYearSection.classList.add("hidden");
          }
          var dirs = DivinationWuxing.DIRECTIONS_2026;
          if (dirs) {
            directionsSection.classList.remove("hidden");
            var ul = document.getElementById("directionsContent");
            ul.innerHTML = "";
            ["wealth", "wen chang", "sha"].forEach(function (k) {
              var d = dirs[k];
              if (d) {
                var li = document.createElement("li");
                li.textContent = d.label + " " + d.dir + "：" + d.desc;
                ul.appendChild(li);
              }
            });
          } else {
            directionsSection.classList.add("hidden");
          }
        } else {
          flowYearSection.classList.add("hidden");
          directionsSection.classList.add("hidden");
        }

        step2.classList.add("hidden");
        step3.classList.remove("hidden");

        var authHeaders = (window.AuthService && window.AuthService.getAuthHeaders) ? window.AuthService.getAuthHeaders() : {};
        var isLoggedIn = (window.AuthService && window.AuthService.isLoggedIn) ? window.AuthService.isLoggedIn() : false;
        var urlParams = typeof URLSearchParams !== "undefined" ? new URLSearchParams(window.location.search) : null;
        var source = (urlParams && urlParams.get("from") === "homepage") ? "Homepage_Entrance" : "Result_Save";
        var divPayload = {
          question: document.getElementById("question").value.trim(),
          mood: (document.querySelector('input[name="mood"]:checked') || {}).value || null,
          primaryIndex: result.primaryIndex,
          transformedIndex: result.transformedIndex,
          mutualIndex: result.mutualIndex,
          lines: lineValues,
          changingLines: result.changingLines,
          source: source,
        };
        console.log("📡 API REQUEST", "/api/divination", JSON.stringify(divPayload, null, 2));
        fetch("/api/divination", {
            method: "POST",
            headers: Object.assign({ "Content-Type": "application/json" }, authHeaders),
            body: JSON.stringify(divPayload),
          })
          .then(function (res) { return res.json().catch(function () { return {}; }); })
          .then(function (data) {
            if (data && data.ok && data.id) lastDivinationId = data.id;
            var savedHint = document.getElementById("resultSavedHint");
            if (savedHint && isLoggedIn && data && data.ok) savedHint.classList.remove("hidden");
          })
          .catch(function () {});

        if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
          window.gtag("event", "divination_complete", { hexagram: result.primaryIndex });
        }

        var resultLoginPrompt = document.getElementById("resultLoginPrompt");
        var btnResultSaveLogin = document.getElementById("btnResultSaveLogin");
        if (resultLoginPrompt) resultLoginPrompt.classList.add("hidden");
        if (!isLoggedIn && resultLoginPrompt && btnResultSaveLogin) {
          setTimeout(function () {
            if (!(window.AuthService && window.AuthService.isLoggedIn && window.AuthService.isLoggedIn())) {
              resultLoginPrompt.classList.remove("hidden");
            }
          }, 3000);
        }
      }

      var btnResultSaveLogin = document.getElementById("btnResultSaveLogin");
      if (btnResultSaveLogin) {
        btnResultSaveLogin.addEventListener("click", function () {
          if (!currentResult) return;
          var question = document.getElementById("question") ? document.getElementById("question").value.trim() : "";
          var moodEl = document.querySelector('input[name="mood"]:checked');
          var mood = moodEl ? moodEl.value : null;
          var context = currentContext || "career";
          var urlParams = typeof URLSearchParams !== "undefined" ? new URLSearchParams(window.location.search) : null;
          var source = (urlParams && urlParams.get("from") === "homepage") ? "Homepage_Entrance" : "Result_Save";
          savePendingDivinationToStorage(currentResult, question, mood, context, source);
          if (window.AuthService && window.AuthService.triggerLogin) {
            window.AuthService.triggerLogin();
          } else {
            window.location.href = "index.html";
          }
        });
      }

      const BINARY_TO_KING_WEN = {
        "111111": 1, "000000": 2, "010001": 3, "100010": 4, "010111": 5, "111010": 6,
        "000010": 7, "010000": 8, "110111": 9, "111011": 10, "000111": 11, "111000": 12,
        "111101": 13, "101111": 14, "000100": 15, "001000": 16, "011001": 17, "100110": 18,
        "000011": 19, "110000": 20, "101001": 21, "100101": 22, "100000": 23, "000001": 24,
        "111001": 25, "100111": 26, "100001": 27, "011110": 28, "010010": 29, "101101": 30,
        "011100": 31, "001110": 32, "111100": 33, "001111": 34, "101000": 35, "000101": 36,
        "110101": 37, "101011": 38, "010100": 39, "001010": 40, "100011": 41, "110001": 42,
        "011111": 43, "111110": 44, "011000": 45, "000110": 46, "011010": 47, "010110": 48,
        "011101": 49, "101110": 50, "001001": 51, "100100": 52, "110100": 53, "001011": 54,
        "001101": 55, "101100": 56, "110110": 57, "011011": 58, "110010": 59, "010011": 60,
        "110011": 61, "001100": 62, "010101": 63, "101010": 64,
      };

      var btnToggleContext = document.getElementById("btnToggleContext");
      if (btnToggleContext) {
        btnToggleContext.addEventListener("click", function () {
          var wrap = document.getElementById("contextButtonsWrap");
          if (wrap) wrap.classList.toggle("hidden");
        });
      }
      var contextButtonsWrapEl = document.getElementById("contextButtonsWrap");
      if (contextButtonsWrapEl) {
        contextButtonsWrapEl.addEventListener("click", function (e) {
          var btn = e.target.closest(".context-btn");
          if (!btn || !currentResult) return;
          var ctx = btn.dataset.context;
          currentContext = ctx;
          var contextLabelMap = { career: "事業", wealth: "財運", love: "感情", neutral: "無特定" };
          var contextCurrentEl = document.getElementById("contextCurrentLabel");
          if (contextCurrentEl) contextCurrentEl.textContent = contextLabelMap[ctx] || ctx;
          contextButtonsWrapEl.classList.add("hidden");
          if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
            window.gtag("event", "divination_context_switch", { scenario: ctx, hexagram: currentResult.primaryIndex });
          }
          var primary = getHexagram(currentResult.primaryIndex);
          var mutual = getHexagram(currentResult.mutualIndex);
          var transformedH = getHexagram(currentResult.transformedIndex);
          var primaryPalace = palaceData ? palaceData.hexagramToPalace[String(currentResult.primaryIndex)] : null;
          var primaryWuxing = primaryPalace && palaceData ? palaceData.palaceWuxing[primaryPalace] : null;
          var mutualPalace = palaceData ? palaceData.hexagramToPalace[String(currentResult.mutualIndex)] : null;
          var mutualWuxing = mutualPalace && palaceData ? palaceData.palaceWuxing[mutualPalace] : null;
          var transformedPalace = palaceData ? palaceData.hexagramToPalace[String(currentResult.transformedIndex)] : null;
          var transformedWuxing = transformedPalace && palaceData ? palaceData.palaceWuxing[transformedPalace] : null;
          applyInsight(currentResult, ctx, primary, primaryWuxing);
          if (typeof DivinationInterpretation !== "undefined") {
            document.getElementById("mutualInterpretation").textContent = DivinationInterpretation.getMutualInterpretation(currentResult.mutualIndex, mutual ? mutual.name : null, mutualWuxing || "", ctx, timePeriod);
            document.getElementById("transformedInterpretation").textContent = DivinationInterpretation.getTransformedInterpretation(currentResult.transformedIndex, transformedH ? transformedH.name : null, transformedWuxing || "", ctx, timePeriod);
          }
          contextButtonsWrapEl.querySelectorAll(".context-btn").forEach(function (b) {
            b.classList.remove("border-amber-400", "text-amber-300", "bg-amber-500/20");
            b.classList.add("border-slate-600", "text-slate-400");
          });
          btn.classList.add("border-amber-400", "text-amber-300", "bg-amber-500/20");
          btn.classList.remove("border-slate-600", "text-slate-400");
        });
      }

      var btnToChart = document.getElementById("btnToChart");
      if (btnToChart) btnToChart.addEventListener("click", function (e) {
        if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
          window.gtag("event", "divination_click_chart", { from: "result" });
        }
        if (isEmbed && window.parent !== window) {
          e.preventDefault();
          try {
            window.parent.postMessage({ type: "divination-close-overlay" }, "*");
          } catch (_) {}
        }
      });
      var alertConsultCta = document.getElementById("alertConsultCta");
      if (alertConsultCta) alertConsultCta.addEventListener("click", function () {
        if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
          var alertContent = document.getElementById("alertContent");
          var count = alertContent ? alertContent.children.length : 0;
          window.gtag("event", "divination_consult_cta", { from: "alert", alert_count: count });
        }
      });
      btnAgain.addEventListener("click", function () {
        step3.classList.add("hidden");
        step1.classList.remove("hidden");
        var savedHint = document.getElementById("resultSavedHint");
        if (savedHint) savedHint.classList.add("hidden");
        lastDivinationId = null;
        selectedFeedbackRating = null;
        var fbButtons = document.getElementById("feedbackButtons");
        var fbWrap = document.getElementById("feedbackSuggestionWrap");
        var fbThank = document.getElementById("feedbackThankYou");
        if (fbButtons) { fbButtons.classList.remove("hidden"); fbButtons.querySelectorAll(".feedback-btn").forEach(function (b) { b.classList.remove("opacity-50", "border-amber-400", "bg-amber-500/20"); }); }
        if (fbWrap) { fbWrap.classList.add("hidden"); var ta = document.getElementById("feedbackSuggestion"); if (ta) ta.value = ""; }
        selectedFeedbackRating = null;
        selectedVerification = null;
        document.querySelectorAll(".verification-btn").forEach(function (b) { b.classList.remove("border-emerald-500/50", "text-emerald-300", "border-red-500/50", "text-red-300", "border-amber-500/50", "text-amber-300"); b.classList.add("border-slate-600", "text-slate-400"); });
        document.querySelectorAll(".verifiable-checkbox").forEach(function (cb) { cb.checked = false; });
        if (fbThank) fbThank.classList.add("hidden");
        var thankExtra = document.getElementById("feedbackThankYouExtra");
        if (thankExtra) thankExtra.innerHTML = "<a href='index.html' class='text-amber-400/90 hover:text-amber-300 underline'>登入</a> 後可在「我的占卦紀錄」查看此回饋。";
        var sugOnly = document.getElementById("feedbackSuggestionOnly");
        var btnSug = document.getElementById("btnSuggestionOnlySubmit");
        if (sugOnly) sugOnly.value = "";
        if (btnSug) { btnSug.textContent = "送出建議"; btnSug.classList.remove("text-emerald-400"); }
        if (ritualReminder) ritualReminder.classList.add("hidden");
        if (linesPreview) linesPreview.classList.remove("lines-complete");
        var rlp = document.getElementById("resultLoginPrompt");
        if (rlp) rlp.classList.add("hidden");
        var ctxWrap = document.getElementById("contextToggleWrap");
        if (ctxWrap) ctxWrap.classList.add("hidden");
        var ctxBtnsWrap = document.getElementById("contextButtonsWrap");
        if (ctxBtnsWrap) ctxBtnsWrap.classList.add("hidden");
        currentResult = null;
        document.getElementById("question").value = "";
        var tp6 = document.querySelector('input[name="timePeriod"][value="6months"]');
        if (tp6) tp6.checked = true;
        timePeriod = "6months";
        document.querySelectorAll('input[name="mood"]').forEach(function (r) {
          if (r.value === "calm") r.checked = true;
        });
        lineValues = [];
        renderStalks();
      });

      var btnShareNative = document.getElementById("btnShareNative");
      if (btnShareNative) btnShareNative.addEventListener("click", function () {
        var shareSection = document.getElementById("shareSection");
        var text = shareSection && shareSection.dataset.shareText ? shareSection.dataset.shareText : "";
        if (text && navigator.share) {
          navigator.share({
            title: "人生說明書 · 易經學習＋占卦服務",
            text: text,
            url: window.location.href,
          }).then(function () {
            if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
              window.gtag("event", "divination_share_native", { method: "web_share" });
            }
          }).catch(function () {});
        }
      });
      var btnShareLine = document.getElementById("btnShareLine");
      if (btnShareLine) btnShareLine.addEventListener("click", function () {
        if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
          window.gtag("event", "divination_line_share", {});
        }
      });
      document.getElementById("btnCopyShare").addEventListener("click", function () {
        var shareSection = document.getElementById("shareSection");
        var text = shareSection && shareSection.dataset.shareText ? shareSection.dataset.shareText : "";
        if (text && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
              window.gtag("event", "divination_copy_share", { method: "clipboard" });
            }
            var btn = document.getElementById("btnCopyShare");
            var orig = btn.textContent;
            btn.textContent = "已複製！";
            setTimeout(function () { btn.textContent = orig; }, 2000);
          }).catch(function () { alert("複製失敗"); });
        } else {
          var ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
            window.gtag("event", "divination_copy_share", { method: "fallback" });
          }
          var btn = document.getElementById("btnCopyShare");
          var orig = btn.textContent;
          btn.textContent = "已複製！";
          setTimeout(function () { btn.textContent = orig; }, 2000);
        }
      });

      var selectedFeedbackRating = null;
      var selectedVerification = null;
      document.querySelectorAll(".feedback-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (selectedFeedbackRating) return;
          selectedFeedbackRating = btn.dataset.rating;
          document.querySelectorAll(".feedback-btn").forEach(function (b) {
            b.classList.remove("border-amber-400", "bg-amber-500/20");
            b.classList.add("opacity-50");
          });
          btn.classList.remove("opacity-50");
          btn.classList.add("border-amber-400", "bg-amber-500/20");
          document.getElementById("feedbackSuggestionWrap").classList.remove("hidden");
        });
      });
      document.querySelectorAll(".verification-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          selectedVerification = btn.dataset.verification;
          document.querySelectorAll(".verification-btn").forEach(function (b) {
            b.classList.remove("border-emerald-500/50", "text-emerald-300", "border-red-500/50", "text-red-300", "border-amber-500/50", "text-amber-300");
            b.classList.add("border-slate-600", "text-slate-400");
          });
          btn.classList.remove("border-slate-600", "text-slate-400");
          if (selectedVerification === "yes") btn.classList.add("border-emerald-500/50", "text-emerald-300");
          else if (selectedVerification === "no") btn.classList.add("border-red-500/50", "text-red-300");
          else btn.classList.add("border-amber-500/50", "text-amber-300");
        });
      });
      function downloadIcalReminder(weeks) {
        var now = new Date();
        var d = new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, "0");
        var day = String(d.getDate()).padStart(2, "0");
        var dateStr = "" + y + m + day;
        var hexName = currentResult && hexagramsData ? (hexagramsData.hexagrams[currentResult.primaryIndex] || {}).name || "卦" : "卦";
        var title = "占卦驗證提醒：" + hexName + "卦";
        var ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//17gonplay//Divination//ZH\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:" + dateStr + "\r\nDTEND;VALUE=DATE:" + dateStr + "\r\nSUMMARY:" + title + "\r\nDESCRIPTION:4-8週後回來驗證占卦結果\r\nEND:VEVENT\r\nEND:VCALENDAR";
        var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "divination-reminder-" + weeks + "w.ics";
        a.click();
        URL.revokeObjectURL(a.href);
        if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
          window.gtag("event", "divination_ical_download", { weeks: weeks });
        }
      }
      var btnIcal4 = document.getElementById("btnIcal4w");
      var btnIcal8 = document.getElementById("btnIcal8w");
      if (btnIcal4) btnIcal4.addEventListener("click", function () { downloadIcalReminder(4); });
      if (btnIcal8) btnIcal8.addEventListener("click", function () { downloadIcalReminder(8); });

      ["coreSummaryTimeDetails", "learningSectionDetails"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
          el.addEventListener("toggle", function () {
            if (el.open) window.gtag("event", "divination_details_expand", { details_id: id });
          });
        }
      });
      document.getElementById("btnSuggestionOnlySubmit").addEventListener("click", function () {
        var text = (document.getElementById("feedbackSuggestionOnly") || {}).value || "";
        if (!text.trim()) { alert("請輸入建議或意見"); return; }
        if (!lastDivinationId) { alert("無法送出，請稍後再試。"); return; }
        var btn = document.getElementById("btnSuggestionOnlySubmit");
        btn.disabled = true;
        btn.textContent = "送出中…";
        var fbPayload1 = { divination_id: lastDivinationId, rating: "suggestion", feedback_text: text.trim() };
        console.log("📡 API REQUEST", "/api/divination/feedback", JSON.stringify(fbPayload1, null, 2));
        fetch("/api/divination/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fbPayload1),
        })
          .then(function (r) { return r.json().catch(function () { return {}; }); })
          .then(function (data) {
            if (data && data.ok) {
              document.getElementById("feedbackSuggestionOnly").value = "";
              btn.textContent = "已送出";
              btn.classList.add("text-emerald-400");
            }
            btn.disabled = false;
            if (btn.textContent !== "已送出") btn.textContent = "送出建議";
          })
          .catch(function () {
            btn.disabled = false;
            btn.textContent = "送出建議";
            alert("送出失敗，請稍後再試。");
          });
      });
      document.getElementById("btnFeedbackSubmit").addEventListener("click", function () {
        if (!selectedFeedbackRating || !lastDivinationId) return;
        var submitBtn = document.getElementById("btnFeedbackSubmit");
        submitBtn.disabled = true;
        submitBtn.textContent = "送出中…";
        var text = (document.getElementById("feedbackSuggestion") || {}).value || "";
        if (selectedVerification) {
          var vLabel = selectedVerification === "yes" ? "有" : (selectedVerification === "no" ? "沒有" : "部分");
          text = "【驗證:" + vLabel + "】" + (text ? " " + text : "");
        }
        var checkedIndices = [];
        document.querySelectorAll(".verifiable-checkbox:checked").forEach(function (cb) {
          checkedIndices.push(cb.dataset.index);
        });
        if (checkedIndices.length > 0) {
          text = (text ? text + " " : "") + "【指標:" + checkedIndices.join(",") + "】";
        }
        var fbPayload2 = { divination_id: lastDivinationId, rating: selectedFeedbackRating, feedback_text: text };
        console.log("📡 API REQUEST", "/api/divination/feedback", JSON.stringify(fbPayload2, null, 2));
        fetch("/api/divination/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fbPayload2),
        })
          .then(function (r) { return r.json().catch(function () { return {}; }); })
          .then(function (data) {
            document.getElementById("feedbackButtons").classList.add("hidden");
            document.getElementById("feedbackSuggestionWrap").classList.add("hidden");
            var verifiableBlock = document.getElementById("feedbackVerifiableBlock");
            if (verifiableBlock) verifiableBlock.classList.add("hidden");
            var thankEl = document.getElementById("feedbackThankYou");
            var thankExtra = document.getElementById("feedbackThankYouExtra");
            if (thankEl) thankEl.classList.remove("hidden");
            if (thankExtra) {
              var loggedIn = window.AuthService && window.AuthService.isLoggedIn && window.AuthService.isLoggedIn();
              if (selectedFeedbackRating === "pending") {
                if (loggedIn) {
                  thankExtra.innerHTML = "儲存後可在「我的占卦紀錄」查看，4–8 週後回來驗證。";
                } else {
                  thankExtra.innerHTML = "建議儲存，4–8 週後回來對照驗證。<br><a href='index.html' class='text-amber-400/90 hover:text-amber-300 underline mt-1 inline-block'>登入</a> 後可儲存至「我的占卦紀錄」。";
                }
              } else {
                thankExtra.innerHTML = "<a href='index.html' class='text-amber-400/90 hover:text-amber-300 underline'>登入</a> 後可在「我的占卦紀錄」查看此回饋。";
              }
            }
            if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
              window.gtag("event", "divination_feedback", { rating: selectedFeedbackRating, verification: selectedVerification || "" });
            }
          })
          .catch(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = "送出回饋";
            alert("送出失敗，請稍後再試。");
          });
      });

      Promise.all([loadHexagrams(), loadPalace()]).then(function (arr) {
        hexagramsData = arr[0];
        palaceData = arr[1];
      });

      var questionInputTimer = null;
      var questionEl = document.getElementById("question");
      var clarificationPrompt = document.getElementById("questionClarificationPrompt");
      var clarificationText = document.getElementById("questionClarificationText");
      if (questionEl && clarificationPrompt && clarificationText && typeof window.analyzeQuestion === "function") {
        questionEl.addEventListener("input", function () {
          clearTimeout(questionInputTimer);
          questionInputTimer = setTimeout(function () {
            var q = questionEl.value.trim();
            if (!q) {
              clarificationPrompt.classList.add("hidden");
              return;
            }
            var analysis = window.analyzeQuestion(q);
            if (analysis.needsClarification && analysis.suggestedFollowUp) {
              clarificationText.textContent = analysis.suggestedFollowUp;
              clarificationPrompt.classList.remove("hidden");
              clarificationPrompt.dataset.suggestedFollowUp = analysis.suggestedFollowUp;
            } else {
              clarificationPrompt.classList.add("hidden");
              delete clarificationPrompt.dataset.suggestedFollowUp;
            }
          }, 400);
        });
      }
      var btnFillTemplate = document.getElementById("btnFillTemplate");
      if (btnFillTemplate && questionEl && clarificationPrompt) {
        btnFillTemplate.addEventListener("click", function () {
          var template = clarificationPrompt.dataset.suggestedFollowUp || clarificationText.textContent || "";
          if (template) {
            var cur = questionEl.value.trim();
            questionEl.value = cur ? cur + " " + template : template;
            if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
              window.gtag("event", "divination_fill_template", {});
            }
          }
        });
      }

      var historyExpanded = false;
      var historyLoaded = false;
      var btnToggleHistory = document.getElementById("btnToggleHistory");
      var historyList = document.getElementById("divinationHistoryList");
      var historyEmpty = document.getElementById("divinationHistoryEmpty");
      var historyLoading = document.getElementById("divinationHistoryLoading");
      var historyChevron = document.getElementById("historyChevron");
      if (btnToggleHistory) {
        btnToggleHistory.addEventListener("click", function () {
          historyExpanded = !historyExpanded;
          historyList.classList.toggle("hidden", !historyExpanded);
          historyChevron.textContent = historyExpanded ? "▲" : "▼";
          if (historyExpanded && !historyLoaded) {
            historyLoading.classList.remove("hidden");
            historyEmpty.classList.add("hidden");
            historyList.classList.add("hidden");
            var authHeaders = (window.AuthService && window.AuthService.getAuthHeaders) ? window.AuthService.getAuthHeaders() : {};
            console.log("📡 API REQUEST", "/api/me/divinations", JSON.stringify({}, null, 2));
            fetch("/api/me/divinations", { headers: authHeaders })
              .then(function (r) { return r.json().catch(function () { return {}; }); })
              .then(function (data) {
                historyLoaded = true;
                historyLoading.classList.add("hidden");
                var list = data && data.divinations ? data.divinations : [];
                if (list.length === 0) {
                  historyEmpty.classList.remove("hidden");
                } else {
                  historyList.classList.remove("hidden");
                  historyList.innerHTML = "";
                  list.forEach(function (d) {
                    var primary = getHexagram(d.primary_index);
                    var name = primary ? primary.name : ("卦 #" + d.primary_index);
                    var dateStr = "";
                    try {
                      if (d.created_at) dateStr = new Date(d.created_at).toLocaleDateString("zh-TW", { month: "short", day: "numeric", year: "numeric" });
                    } catch (_) {}
                    var q = (d.question || "").slice(0, 24);
                    if ((d.question || "").length > 24) q += "…";
                    var btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "w-full text-left p-3 rounded-lg border border-slate-600/50 bg-slate-800/30 hover:bg-slate-700/40 transition text-sm";
                    btn.innerHTML = "<span class='text-amber-400 font-medium'>" + name + "</span><span class='text-slate-500 block mt-0.5'>" + (q || "（無問題）") + "</span><span class='text-slate-600 text-xs block mt-1'>" + dateStr + "</span>";
                    btn.dataset.record = JSON.stringify(d);
                    btn.addEventListener("click", function () {
                      var rec = JSON.parse(btn.dataset.record || "{}");
                      var res = {
                        lines: rec.lines || [],
                        primaryIndex: rec.primary_index,
                        transformedIndex: rec.transformed_index,
                        mutualIndex: rec.mutual_index,
                        changingLines: rec.changing_lines || [],
                        question: rec.question || "",
                      };
                      step1.classList.add("hidden");
                      step2.classList.add("hidden");
                      step3.classList.remove("hidden");
                      var sh = document.getElementById("resultSavedHint");
                      if (sh) sh.classList.add("hidden");
                      lastDivinationId = rec.id || null;
                      currentResult = res;
                      ensureFullData().then(function () {
                        showResult(res);
                        document.getElementById("resultTimestamp").textContent = "占卦時間：" + (rec.created_at ? new Date(rec.created_at).toLocaleString("zh-TW", { dateStyle: "medium", timeStyle: "short" }) : "—");
                      });
                    });
                    historyList.appendChild(btn);
                  });
                }
              })
              .catch(function () {
                historyLoaded = true;
                historyLoading.classList.add("hidden");
                historyEmpty.classList.remove("hidden");
                historyEmpty.textContent = "載入失敗，請稍後再試。";
              });
          }
        });
      }
        } catch (e) {
          if (typeof window !== "undefined") window.__divinationError = e && (e.message || String(e));
          if (typeof console !== "undefined" && console.error) console.error("[divination] runDivinationUI error", e);
          throw e;
        }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        try { runDivinationUI(); } catch (e) { console.error("[divination] init error", e); }
      });
    } else {
      try { runDivinationUI(); } catch (e) { console.error("[divination] init error", e); }
    }
    })();
