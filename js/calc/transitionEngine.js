/**
 * transitionEngine.js
 * 三步行動 fallback 引擎：轉場 → 卦行動 → 類型模板
 * 第 1 條由 intent 決定，第 2–3 條由本卦+互卦+之卦匹配
 */
(function (global) {
  "use strict";

  function pickIntentAction(intent) {
    switch (intent) {
      case "yesno":
        return "可行但不躁進：先小規模試行驗證，再擴張";
      case "timing":
        return "用月份節點排程：高點推進、轉折保守、風險月收尾";
      case "strategy":
        return "先鎖定最大槓桿：人/錢/流程/客戶其一";
      default:
        return "先穩住基本盤，再逐步加碼";
    }
  }

  function uniq(arr) {
    const seen = new Set();
    return arr.filter(function (x) {
      if (!x || seen.has(x)) return false;
      seen.add(x);
      return true;
    });
  }

  function pickFromArray(arr, n) {
    if (!arr || !arr.length) return [];
    const copy = arr.slice();
    const out = [];
    while (copy.length && out.length < n) {
      const i = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(i, 1)[0]);
    }
    return out;
  }

  function getType(hexName, typesData) {
    if (!typesData || !typesData.types) return "Stabilize";
    return typesData.types[hexName] || "Stabilize";
  }

  function getHexActionCandidates(primaryIndex, actionsData) {
    if (!actionsData || !actionsData.hexagrams) return [];
    const h = actionsData.hexagrams[String(primaryIndex)];
    if (!h) return [];
    const a = [];
    if (Array.isArray(h.learningTasks)) a.push.apply(a, h.learningTasks);
    if (h.solutionKeywords && typeof h.solutionKeywords === "string") {
      h.solutionKeywords.split(/[、,，]/).forEach(function (s) {
        var t = s.trim();
        if (t) a.push(t);
      });
    }
    return a;
  }

  function resolveTransition(main, hu, zhi, transitionsData, typesData, templatesData, actionsData, primaryIndex) {
    if (!main) main = "";
    if (!hu) hu = "";
    if (!zhi) zhi = "";

    var transitions = transitionsData && transitionsData.transitions ? transitionsData.transitions : {};
    var templates = templatesData && templatesData.templates ? templatesData.templates : {};

    var key3 = main + "|" + hu + "|" + zhi;
    if (transitions[key3]) return { source: "transition3", summary: transitions[key3].summary, actions: transitions[key3].actions || [] };

    var keyMainZhi = main + "|*|" + zhi;
    if (transitions[keyMainZhi]) return { source: "transitionMainZhi", summary: transitions[keyMainZhi].summary, actions: transitions[keyMainZhi].actions || [] };

    var keyMainHu = main + "|" + hu + "|*";
    if (transitions[keyMainHu]) return { source: "transitionMainHu", summary: transitions[keyMainHu].summary, actions: transitions[keyMainHu].actions || [] };

    var hexCandidates = getHexActionCandidates(primaryIndex, actionsData);
    if (hexCandidates.length) {
      return { source: "hexActions", summary: "", actions: pickFromArray(hexCandidates, 3) };
    }

    var t = getType(main, typesData);
    var typeArr = templates[t];
    if (typeArr && typeArr.length) {
      return { source: "typeTemplates", summary: "", actions: pickFromArray(typeArr, 3) };
    }

    return { source: "fallback", summary: "", actions: ["先穩住基本盤", "觀察一個週期再做大決策", "把資源集中在最穩的一塊"] };
  }

  /**
   * 建立三步行動
   * @param {Object} opts
   * @param {string} opts.intent - yesno | timing | strategy | trend
   * @param {string} opts.mainName - 本卦名
   * @param {string} opts.huName - 互卦名
   * @param {string} opts.zhiName - 之卦名
   * @param {number} opts.primaryIndex - 本卦 King Wen 序
   * @param {Object} opts.typesData - hexagram-types.json
   * @param {Object} opts.templatesData - type-action-templates.json
   * @param {Object} opts.transitionsData - hexagram-transitions.json
   * @param {Object} opts.actionsData - hexagram-actions.json
   */
  function buildThreeActions(opts) {
    var intent = opts.intent || "trend";
    var mainName = opts.mainName || "";
    var huName = opts.huName || "";
    var zhiName = opts.zhiName || "";
    var primaryIndex = opts.primaryIndex || 1;

    var intentAction = pickIntentAction(intent);
    var resolved = resolveTransition(
      mainName,
      huName,
      zhiName,
      opts.transitionsData,
      opts.typesData,
      opts.templatesData,
      opts.actionsData,
      primaryIndex
    );

    var rest = (resolved.actions || []).filter(function (a) {
      return a && a !== intentAction;
    });
    rest = uniq(rest);
    var actions = [intentAction].concat(rest).slice(0, 3);

    if (actions.length < 3 && opts.templatesData && opts.templatesData.templates) {
      var t = getType(mainName, opts.typesData);
      var typeArr = opts.templatesData.templates[t];
      if (typeArr) {
        var more = pickFromArray(typeArr, 3 - actions.length);
        more.forEach(function (m) {
          if (actions.indexOf(m) < 0) actions.push(m);
        });
      }
    }

    return uniq(actions).slice(0, 3);
  }

  var api = {
    pickIntentAction: pickIntentAction,
    buildThreeActions: buildThreeActions,
    getType: getType,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.TransitionEngine = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
