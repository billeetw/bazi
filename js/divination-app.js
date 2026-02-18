    (function () {
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
        fetch("/api/divination", {
          method: "POST",
          headers: Object.assign({ "Content-Type": "application/json" }, authHeaders),
          body: JSON.stringify({
            question: pending.question,
            mood: pending.mood,
            primaryIndex: pending.primaryIndex,
            transformedIndex: pending.transformedIndex,
            mutualIndex: pending.mutualIndex,
            lines: pending.lines,
            changingLines: pending.changingLines,
            source: pending.source,
          }),
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
      let currentResult = null;
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
        stalksContainer.innerHTML = "";
        for (var i = 0; i < 49; i++) {
          var s = document.createElement("div");
          s.className = "stalk";
          stalksContainer.appendChild(s);
        }
      }

      btnStart.addEventListener("click", function () {
        var q = document.getElementById("question").value.trim();
        if (!q) {
          alert("請先寫下你的問題");
          return;
        }
        var tp = document.querySelector('input[name="timePeriod"]:checked');
        timePeriod = tp ? tp.value : "6months";
        step1.classList.add("hidden");
        ritualReminder.classList.remove("hidden");
      });
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
        ritualReminder.classList.add("hidden");
        step2.classList.remove("hidden");
        document.body.classList.remove("wuxing-金", "wuxing-木", "wuxing-水", "wuxing-火", "wuxing-土");
        changeProgress.textContent = "長按開始";
        holdLabel.textContent = "長按";
        linesPreview.innerHTML = "";
        linesPreview.classList.remove("lines-complete");
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
          showResult();
          // 手機版：結果區在下方，延遲滾動確保 DOM 已渲染，避免用戶以為沒有結果
          var scrollToResult = function () {
            try {
              step3.scrollIntoView({ behavior: "smooth", block: "start" });
            } catch (e) {
              step3.scrollIntoView(true);
            }
          };
          setTimeout(scrollToResult, 150);
          setTimeout(scrollToResult, 500);
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
        var transformed = DayanDivination.getTransformedLines(lineValues);
        var mutualBin = DayanDivination.getMutualHexagram(lineValues);

        const primary = getHexagram(result.primaryIndex);
        const transformedH = getHexagram(result.transformedIndex);
        const mutual = getHexagram(result.mutualIndex);

        document.getElementById("primaryName").textContent = (primary ? primary.name : "—") + "卦";
        document.getElementById("transformedName").textContent = (transformedH ? transformedH.name : "—") + "卦";
        document.getElementById("mutualName").textContent = (mutual ? mutual.name : "—") + "卦";

        var contextWrap = document.getElementById("contextToggleWrap");
        contextWrap.classList.remove("hidden");
        contextWrap.classList.add("flex");
        var ctxBtns = contextWrap.querySelectorAll(".context-btn");
        ctxBtns.forEach(function (b) {
          b.classList.remove("border-amber-400", "text-amber-300", "bg-amber-500/20");
          b.classList.add("border-slate-600", "text-slate-400");
          if (b.dataset.context === "career") {
            b.classList.add("border-amber-400", "text-amber-300", "bg-amber-500/20");
            b.classList.remove("border-slate-600", "text-slate-400");
          }
        });
        currentResult = result;

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
        applyInsight(result, "career", primary, primaryWuxing);

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
          var ctx = "career";
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
            var alerts = typeof DivinationReminders !== "undefined" ? DivinationReminders.getAlertsForMonths(trend.months, 0) : [];
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
        fetch("/api/divination", {
            method: "POST",
            headers: Object.assign({ "Content-Type": "application/json" }, authHeaders),
            body: JSON.stringify({
              question: document.getElementById("question").value.trim(),
              mood: (document.querySelector('input[name="mood"]:checked') || {}).value || null,
              primaryIndex: result.primaryIndex,
              transformedIndex: result.transformedIndex,
              mutualIndex: result.mutualIndex,
              lines: lineValues,
              changingLines: result.changingLines,
              source: source,
            }),
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
          var ctxBtn = document.querySelector("#contextToggleWrap .context-btn.border-amber-400");
          var context = ctxBtn && ctxBtn.dataset.context ? ctxBtn.dataset.context : "career";
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

      document.getElementById("contextToggleWrap").addEventListener("click", function (e) {
        var btn = e.target.closest(".context-btn");
        if (!btn || !currentResult) return;
        var ctx = btn.dataset.context;
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
        document.querySelectorAll("#contextToggleWrap .context-btn").forEach(function (b) {
          b.classList.remove("border-amber-400", "text-amber-300", "bg-amber-500/20");
          b.classList.add("border-slate-600", "text-slate-400");
        });
        btn.classList.add("border-amber-400", "text-amber-300", "bg-amber-500/20");
        btn.classList.remove("border-slate-600", "text-slate-400");
      });

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
        if (fbThank) fbThank.classList.add("hidden");
        var sugOnly = document.getElementById("feedbackSuggestionOnly");
        var btnSug = document.getElementById("btnSuggestionOnlySubmit");
        if (sugOnly) sugOnly.value = "";
        if (btnSug) { btnSug.textContent = "送出建議"; btnSug.classList.remove("text-emerald-400"); }
        if (ritualReminder) ritualReminder.classList.add("hidden");
        if (linesPreview) linesPreview.classList.remove("lines-complete");
        var rlp = document.getElementById("resultLoginPrompt");
        if (rlp) rlp.classList.add("hidden");
        document.getElementById("contextToggleWrap").classList.add("hidden");
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
      document.getElementById("btnSuggestionOnlySubmit").addEventListener("click", function () {
        var text = (document.getElementById("feedbackSuggestionOnly") || {}).value || "";
        if (!text.trim()) { alert("請輸入建議或意見"); return; }
        if (!lastDivinationId) { alert("無法送出，請稍後再試。"); return; }
        var btn = document.getElementById("btnSuggestionOnlySubmit");
        btn.disabled = true;
        btn.textContent = "送出中…";
        fetch("/api/divination/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ divination_id: lastDivinationId, rating: "suggestion", feedback_text: text.trim() }),
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
        fetch("/api/divination/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ divination_id: lastDivinationId, rating: selectedFeedbackRating, feedback_text: text }),
        })
          .then(function (r) { return r.json().catch(function () { return {}; }); })
          .then(function (data) {
            document.getElementById("feedbackButtons").classList.add("hidden");
            document.getElementById("feedbackSuggestionWrap").classList.add("hidden");
            document.getElementById("feedbackThankYou").classList.remove("hidden");
            if (typeof window.gtag === "function" && window.GA_MEASUREMENT_ID) {
              window.gtag("event", "divination_feedback", { rating: selectedFeedbackRating });
            }
          })
          .catch(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = "送出回饋";
            alert("送出失敗，請稍後再試。");
          });
      });

      Promise.all([
        loadHexagrams(),
        loadPalace(),
        loadCommentaries(),
        loadStructure(),
        loadOpeningWisdom(),
        loadActions(),
        typeof DivinationScore !== "undefined" ? DivinationScore.loadLines384() : Promise.resolve(),
        typeof DivinationInterpretation !== "undefined" ? DivinationInterpretation.loadSummaries() : Promise.resolve(),
      ]).then(function (arr) {
        hexagramsData = arr[0];
        palaceData = arr[1];
        commentariesData = arr[2];
        structureData = arr[3];
        openingWisdomData = arr[4];
        actionsData = arr[5];
      });

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
                      };
                      step1.classList.add("hidden");
                      step2.classList.add("hidden");
                      step3.classList.remove("hidden");
                      var sh = document.getElementById("resultSavedHint");
                      if (sh) sh.classList.add("hidden");
                      lastDivinationId = rec.id || null;
                      currentResult = res;
                      showResult(res);
                      document.getElementById("resultTimestamp").textContent = "占卦時間：" + (rec.created_at ? new Date(rec.created_at).toLocaleString("zh-TW", { dateStyle: "medium", timeStyle: "short" }) : "—");
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
    })();
