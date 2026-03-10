/**
 * buildCoreSummary.js
 * 建立第一屏對題摘要：一句話結論、三步行動、時間窗
 * 不依賴 LLM，純規則產出
 */
(function (global) {
  "use strict";

  var MONTHS_1YEAR = [2, 4, 6, 8, 10, 12];
  var STAGES = ["起步", "開始有聲譽", "多變動", "戒慎恐懼", "如日中天", "逐步引退或局外觀察"];

  function formatMonthLabel(month, timePeriod) {
    if (!month || month < 1 || month > 6) return "第" + (month || 1) + "月";
    switch (timePeriod) {
      case "1year":
        return (MONTHS_1YEAR[month - 1] || month) + "月";
      case "6years":
        return "第" + month + "年";
      case "stages":
        return STAGES[month - 1] || "階段" + month;
      default:
        return "第" + month + "月";
    }
  }

  function formatMonthLabelFromIndex(lineIndex, timePeriod) {
    return formatMonthLabel(lineIndex + 1, timePeriod);
  }

  function buildOneLineConclusion(opts) {
    var totalTrend = opts.totalTrend || "平";
    var monthlyScores = opts.monthlyScores || [];
    var changingLines = opts.changingLines || [];
    var timePeriod = opts.timePeriod || "6months";

    var parts = [totalTrend];

    var turningLabels = [];
    var changingSet = new Set(changingLines);
    if (changingSet.size > 0) {
      changingLines.slice(0, 2).forEach(function (idx) {
        turningLabels.push(formatMonthLabelFromIndex(idx, timePeriod));
      });
      if (turningLabels.length) {
        parts.push("但" + turningLabels.join("、") + "需守");
      }
    } else {
      var lowScoreMonths = monthlyScores.filter(function (m) {
        return (m.score || 0) <= 20;
      });
      if (lowScoreMonths.length > 0) {
        lowScoreMonths.slice(0, 2).forEach(function (m) {
          turningLabels.push(formatMonthLabel(m.month, timePeriod));
        });
        if (turningLabels.length) {
          parts.push("但" + turningLabels.join("、") + "宜慎");
        }
      }
    }

    var minMonth = null;
    var minScore = 999;
    monthlyScores.forEach(function (m) {
      var s = m.score != null ? m.score : 0;
      if (s < minScore) {
        minScore = s;
        minMonth = m;
      }
    });
    if (minMonth && minScore <= 0) {
      parts.push("；" + formatMonthLabel(minMonth.month, timePeriod) + "慎收尾");
    }

    return parts.join("，");
  }

  function buildTimeWindows(monthlyScores, changingLines, timePeriod) {
    var scores = monthlyScores || [];
    var changingSet = new Set(changingLines || []);

    var withIdx = scores.map(function (m, i) {
      return {
        month: m.month,
        score: m.score != null ? m.score : 0,
        isChanging: changingSet.has(i),
        lineIndex: i,
      };
    });

    var sorted = withIdx.slice().sort(function (a, b) {
      return (b.score || 0) - (a.score || 0);
    });
    var best = sorted.slice(0, 3).map(function (x) {
      return {
        label: formatMonthLabel(x.month, timePeriod),
        score: x.score,
      };
    });

    var turning = withIdx
      .filter(function (x) {
        return x.isChanging;
      })
      .map(function (x) {
        return {
          label: formatMonthLabel(x.month, timePeriod),
          score: x.score,
        };
      });

    var risk = withIdx
      .filter(function (x) {
        return (x.score || 0) <= 0;
      })
      .sort(function (a, b) {
        return (a.score || 0) - (b.score || 0);
      })
      .slice(0, 2)
      .map(function (x) {
        return {
          label: formatMonthLabel(x.month, timePeriod),
          score: x.score,
        };
      });

    return { best: best, turning: turning, risk: risk };
  }

  var CATEGORY_LABEL = {
    career: "事業",
    wealth: "財運",
    love: "感情",
    health: "健康",
    general: "無特定",
  };
  var INTENT_LABEL = {
    yesno: "是否",
    timing: "時間",
    strategy: "策略",
    trend: "整體趨勢",
  };

  /**
   * 建立第一屏摘要
   * @param {Object} opts
   * @param {string} opts.questionText - 使用者問題
   * @param {Object} opts.analysis - { category, intent }
   * @param {Object} opts.reading - { primaryIndex, primaryName, mutualName, transformedName, monthlyScores, totalTrend, changingLines, timePeriod }
   * @param {Object} opts.typesData - hexagram-types.json
   * @param {Object} opts.templatesData - type-action-templates.json
   * @param {Object} opts.transitionsData - hexagram-transitions.json
   * @param {Object} opts.actionsData - hexagram-actions.json
   */
  function buildCoreSummary(opts) {
    var questionText = (opts.questionText || "").trim();
    var analysis = opts.analysis || {};
    var reading = opts.reading || {};
    var category = analysis.category || "general";
    var intent = analysis.intent || "trend";

    var categoryLabel = CATEGORY_LABEL[category] || "無特定";
    var intentLabel = INTENT_LABEL[intent] || "整體趨勢";

    var asked = questionText ? "你問的具體問題是：「" + questionText + "」" : "【" + categoryLabel + "】" + intentLabel;

    var conclusion = buildOneLineConclusion({
      totalTrend: reading.totalTrend || "平",
      monthlyScores: reading.monthlyScores || [],
      changingLines: reading.changingLines || [],
      timePeriod: reading.timePeriod || "6months",
    });

    var actions = [];
    if (typeof TransitionEngine !== "undefined" && TransitionEngine.buildThreeActions) {
      actions = TransitionEngine.buildThreeActions({
        intent: intent,
        mainName: reading.primaryName || "",
        huName: reading.mutualName || "",
        zhiName: reading.transformedName || "",
        primaryIndex: reading.primaryIndex || 1,
        typesData: opts.typesData,
        templatesData: opts.templatesData,
        transitionsData: opts.transitionsData,
        actionsData: opts.actionsData,
      });
    } else {
      actions = ["先穩住基本盤，再逐步加碼", "觀察一個週期再做大決策", "把資源集中在最穩的一塊"];
    }

    var timeWindows = buildTimeWindows(
      reading.monthlyScores || [],
      reading.changingLines || [],
      reading.timePeriod || "6months"
    );

    var verifiable = buildVerifiablePoint(reading, actions, category);

    return {
      header: {
        asked: asked,
        questionText: questionText,
        tags: [categoryLabel, intentLabel],
        conclusion: conclusion,
      },
      actions: actions,
      timeWindows: timeWindows,
      verifiablePoint: verifiable ? verifiable.text : null,
      verifiableCheckboxes: verifiable ? verifiable.checkboxes : [],
    };
  }

  var VERIFIABLE_CHECKBOXES = {
    career: ["需要重新分工／重談合約", "角色或責任邊界有變動", "團隊或合作關係有調整"],
    wealth: ["理財或投資決策有變化", "收入或支出結構有變動", "合約或款項有進展"],
    love: ["關係狀態有變化", "溝通或相處模式有調整", "承諾或下一步有進展"],
    health: ["就醫或檢查有進展", "作息或習慣有調整", "身心狀態有變化"],
    general: ["預期的事有發生", "決策或行動有進展", "人際或環境有變化"],
  };

  function buildVerifiablePoint(reading, actions, category) {
    if (!reading || !actions || actions.length === 0) return null;
    var timePeriod = reading.timePeriod || "6months";
    var changingLines = reading.changingLines || [];
    var MONTHS_1YEAR = [2, 4, 6, 8, 10, 12];
    var formatMonth = function (idx) {
      if (timePeriod === "1year") return (MONTHS_1YEAR[idx] || idx + 1) + "月";
      return "第" + (idx + 1) + "月";
    };
    var firstChanging = changingLines.length > 0 ? formatMonth(changingLines[0]) : null;
    var base = "合作角色或責任邊界需要重新談一次";
    if (firstChanging) {
      base = "接下來 " + firstChanging + " 前後，你最可能遇到：" + base;
    } else {
      base = "接下來 4–8 週，你最可能遇到：" + base;
    }
    var checkboxes = VERIFIABLE_CHECKBOXES[category] || VERIFIABLE_CHECKBOXES.general;
    return { text: base, checkboxes: checkboxes };
  }

  var api = {
    buildCoreSummary: buildCoreSummary,
    buildOneLineConclusion: buildOneLineConclusion,
    buildTimeWindows: buildTimeWindows,
    formatMonthLabel: formatMonthLabel,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.BuildCoreSummary = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
