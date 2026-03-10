/* strategicLinkEngine.js (M7) — 版本 1.5
 * 戰略聯動引擎：在現有 compute/all 結果上找「連動關係」，產出 StrategicLink[] 供命書依 key 抓文案。
 * v1.5：加入化祿複利（lu_entry、lu_flow：祿入口、祿流向、複利/漏洞）。
 * PalaceId 與 OPPOSITE_PALACE_MAP 引用專案現有定義（CalcConstants.PALACE_NAME_TO_ID_MAP、CalcConstants.OPPOSITE_PALACE_MAP）。
 * 依賴: calc/constants.js (PALACE_DEFAULT, BRANCH_RING, PALACE_NAME_TO_ID_MAP, OPPOSITE_PALACE_MAP)
 */

(function () {
  "use strict";

  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("strategicLinkEngine.js requires CalcConstants (PALACE_DEFAULT, BRANCH_RING, PALACE_NAME_TO_ID_MAP, OPPOSITE_PALACE_MAP)");
  }

  const PALACE_DEFAULT = window.CalcConstants.PALACE_DEFAULT || [
    "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
    "遷移", "僕役", "官祿", "田宅", "福德", "父母",
  ];
  const BRANCH_RING = window.CalcConstants.BRANCH_RING || [
    "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑",
  ];
  /** 專案現有定義：中文宮位名 → PalaceId（英文標識） */
  const PALACE_NAME_TO_ID_MAP = window.CalcConstants.PALACE_NAME_TO_ID_MAP || {};
  /** 專案現有定義：中文宮位名 → 對宮中文宮位名 */
  const OPPOSITE_PALACE_MAP = window.CalcConstants.OPPOSITE_PALACE_MAP || {};

  /** PalaceId 順序與 PALACE_DEFAULT 一致（引用 PALACE_NAME_TO_ID_MAP） */
  const PALACE_IDS = PALACE_DEFAULT.map(function (zh) {
    return PALACE_NAME_TO_ID_MAP[zh] || zh;
  });

  /** 對宮：PalaceId → PalaceId（由專案 OPPOSITE_PALACE_MAP + PALACE_NAME_TO_ID_MAP 推導） */
  const OPPOSITE_PALACE_ID_MAP = (function () {
    const out = {};
    for (let i = 0; i < PALACE_DEFAULT.length; i++) {
      const zh = PALACE_DEFAULT[i];
      const id = PALACE_NAME_TO_ID_MAP[zh];
      const oppZh = OPPOSITE_PALACE_MAP[zh];
      const oppId = oppZh ? PALACE_NAME_TO_ID_MAP[oppZh] : null;
      if (id && oppId) out[id] = oppId;
    }
    return out;
  })();

  /** bodyPalaceReport 可能來自 bodyPalaceEngine（小寫 PalaceId），正規化為專案 PalaceId（首字大寫 / Karma） */
  const BODY_PALACE_TO_PROJECT_ID = {
    self: "Self", siblings: "Siblings", spouse: "Spouse", children: "Children",
    wealth: "Wealth", health: "Health", travel: "Travel", friends: "Friends",
    career: "Career", property: "Property", fortune: "Karma", parents: "Parents",
  };
  function normalizeBodyPalaceId(id) {
    if (!id) return "Karma";
    return BODY_PALACE_TO_PROJECT_ID[id] || (id.charAt(0).toUpperCase() + id.slice(1));
  }

  /** 暗合組合：使用專案 PalaceId（與 PALACE_NAME_TO_ID_MAP 一致） */
  const HIDDEN_MERGE_PAIRS = [
    ["Children", "Spouse"],
    ["Siblings", "Karma"],
    ["Parents", "Property"],
    ["Wealth", "Travel"],
    ["Career", "Health"],
    ["Friends", "Self"],
  ];

  function isEarthlyBranchMerge(branchA, branchB) {
    const pair = [String(branchA || "").trim(), String(branchB || "").trim()].sort().join("");
    const MERGE_SET = new Set([
      "子丑", "丑子", "寅亥", "亥寅", "卯戌", "戌卯",
      "巳申", "申巳", "午未", "未午", "酉辰", "辰酉",
    ]);
    return MERGE_SET.has(pair);
  }

  /**
   * 從命宮地支 + 流年地支建「流年宮位 → 原命宮位」overlayMap（key/value 皆為專案 PalaceId）
   */
  function buildOverlayMap(mingBranch, yearBranch) {
    const mingIdx = BRANCH_RING.indexOf(mingBranch);
    const yearIdx = BRANCH_RING.indexOf(yearBranch);
    if (mingIdx < 0 || yearIdx < 0) return {};
    const out = {};
    for (let k = 0; k < 12; k++) {
      const j = ((mingIdx - yearIdx - k) % 12 + 12) % 12;
      out[PALACE_IDS[k]] = PALACE_IDS[j];
    }
    return out;
  }

  /**
   * 從原命命宮地支建 base.palaces（每宮 PalaceId → { branch }）
   */
  function buildBasePalaces(mingBranch) {
    const mingIdx = BRANCH_RING.indexOf(mingBranch);
    if (mingIdx < 0) return {};
    const out = {};
    for (let j = 0; j < 12; j++) {
      out[PALACE_IDS[j]] = { branch: BRANCH_RING[(mingIdx - j + 12) % 12] };
    }
    return out;
  }

  /**
   * 從 overlapAnalysis.palaceMap 建 transit.palaces（PalaceId → { hasJi, hasLu }）
   * palaceMap key 為中文宮位名，value 為 { transformations: { liunian: { type } } }
   */
  function buildTransitPalaces(overlapAnalysis) {
    const out = {};
    PALACE_IDS.forEach(function (id) { out[id] = { hasJi: false, hasLu: false }; });
    if (!overlapAnalysis || !overlapAnalysis.palaceMap) return out;
    const map = overlapAnalysis.palaceMap;
    const entries = map instanceof Map ? Array.from(map.entries()) : Object.entries(map || {});
    entries.forEach(function (entry) {
      const palaceName = entry[0];
      const data = entry[1];
      const id = PALACE_NAME_TO_ID_MAP[palaceName];
      if (!id) return;
      const t = data && data.transformations;
      const liunianType = t && t.liunian ? t.liunian.type : null;
      out[id] = {
        hasJi: liunianType === "忌",
        hasLu: liunianType === "祿",
      };
    });
    return out;
  }

  /**
   * 建 StrategicContext（從 ziwei、overlapAnalysis、bodyPalaceReport、userBehavior、luEvents）
   * bodyPalace 正規化為專案 PalaceId（Travel、Career、Karma 等）
   * luEvents 由上游（紫微盤計算邏輯）提供；若未提供則為 []，buildLuLinks 僅回傳空陣列。
   */
  function buildStrategicContext(ziwei, overlapAnalysis, bodyPalaceReport, userBehavior, luEvents) {
    const mingBranch = (ziwei && ziwei.core && ziwei.core.minggongBranch) ? String(ziwei.core.minggongBranch).trim() : "寅";
    const yearBranch = (ziwei && ziwei.horoscope && ziwei.horoscope.yearlyBranch) ? String(ziwei.horoscope.yearlyBranch).trim() : "";
    const yearBranchResolved = yearBranch || mingBranch;
    const rawBodyPalace = (bodyPalaceReport && bodyPalaceReport.bodyPalace) ? bodyPalaceReport.bodyPalace : "Karma";
    const bodyPalace = normalizeBodyPalaceId(rawBodyPalace);

    const palaces = buildTransitPalaces(overlapAnalysis);
    const overlayMap = buildOverlayMap(mingBranch, yearBranchResolved);

    return {
      base: {
        palaces: buildBasePalaces(mingBranch),
        bodyPalace: bodyPalace,
      },
      transit: {
        palaces: palaces,
        overlayMap: overlayMap,
        luEvents: Array.isArray(luEvents) ? luEvents : [],
      },
      userBehavior: userBehavior || {},
    };
  }

  function buildOverlayLinks(ctx) {
    const res = [];
    const overlayMap = ctx.transit.overlayMap;
    const interesting = ["Wealth", "Career", "Travel", "Property", "Self", "Spouse", "Children", "Karma"];
    interesting.forEach(function (from) {
      const to = overlayMap[from];
      if (!to) return;
      res.push({ type: "overlay", from: from, to: to, key: "overlay." + from + "_over_" + to });
    });
    return res;
  }

  function buildJiClashLinks(ctx) {
    const res = [];
    const palaces = ctx.transit.palaces;
    Object.keys(palaces).forEach(function (id) {
      if (!palaces[id].hasJi) return;
      const opposite = OPPOSITE_PALACE_ID_MAP[id];
      if (!opposite) return;
      res.push({ type: "ji_clash", from: id, to: opposite, key: "ji_clash." + id + "_to_" + opposite });
    });
    return res;
  }

  function buildHiddenMergeLinks(ctx) {
    const res = [];
    const base = ctx.base.palaces;
    HIDDEN_MERGE_PAIRS.forEach(function (pair) {
      const a = pair[0];
      const b = pair[1];
      const pa = base[a];
      const pb = base[b];
      if (!pa || !pb) return;
      if (isEarthlyBranchMerge(pa.branch, pb.branch)) {
        res.push({ type: "hidden_merge", from: a, to: b, key: "hidden_merge." + a + "_" + b });
      }
    });
    return res;
  }

  function buildBodyMoveHints(ctx) {
    const res = [];
    const bodyPalace = ctx.base.bodyPalace;
    const behavior = ctx.userBehavior || {};
    if (bodyPalace === "Travel") {
      if (!behavior.recentMoves || behavior.recentMoves === 0) {
        res.push({ type: "body_move_hint", palace: "Travel", key: "body_move_hint.travel_static" });
      }
    }
    if (bodyPalace === "Career") {
      if (!behavior.recentJobChanges || behavior.recentJobChanges === 0) {
        res.push({ type: "body_move_hint", palace: "Career", key: "body_move_hint.career_static" });
      }
    }
    return res;
  }

  /**
   * 化祿複利：祿入口（lu_gain）+ 祿流向與複利/漏洞（lu_flow）
   * 僅消費 ctx.transit.luEvents（由上游提供）；若為 undefined / 空陣列則回傳 []。
   */
  function buildLuLinks(ctx) {
    const res = [];
    const luEvents = ctx.transit.luEvents || [];
    const transitPalaces = ctx.transit.palaces;

    for (var i = 0; i < luEvents.length; i++) {
      var evt = luEvents[i];
      var from = evt.palace;

      res.push({
        type: "lu_gain",
        palace: from,
        key: "lu_gain." + from,
      });

      if (evt.flowTo != null && evt.flowTo !== "") {
        var to = evt.flowTo;
        var target = transitPalaces[to];
        var hasJiOnTarget = target && target.hasJi === true;
        var isLeak = !!hasJiOnTarget;
        var isCompound = !hasJiOnTarget;

        res.push({
          type: "lu_flow",
          from: from,
          to: to,
          key: "lu_flow." + from + "_to_" + to,
          isLeak: isLeak,
          isCompound: isCompound,
        });
      }
    }
    return res;
  }

  /**
   * 主入口：從 ctx 產出 StrategicLink[]
   */
  function buildStrategicLinks(ctx) {
    const links = [];
    links.push.apply(links, buildOverlayLinks(ctx));
    links.push.apply(links, buildJiClashLinks(ctx));
    links.push.apply(links, buildHiddenMergeLinks(ctx));
    links.push.apply(links, buildBodyMoveHints(ctx));
    links.push.apply(links, buildLuLinks(ctx));
    return links;
  }

  if (typeof window !== "undefined") {
    window.StrategicLinkEngine = {
      buildStrategicContext: buildStrategicContext,
      buildStrategicLinks: buildStrategicLinks,
      buildOverlayMap: buildOverlayMap,
      buildBasePalaces: buildBasePalaces,
      buildTransitPalaces: buildTransitPalaces,
      buildLuLinks: buildLuLinks,
      OPPOSITE_PALACE_ID_MAP: OPPOSITE_PALACE_ID_MAP,
      HIDDEN_MERGE_PAIRS: HIDDEN_MERGE_PAIRS,
      PALACE_IDS: PALACE_IDS,
      PALACE_NAME_TO_ID_MAP: PALACE_NAME_TO_ID_MAP,
      OPPOSITE_PALACE_MAP: OPPOSITE_PALACE_MAP,
    };
  }
})();
