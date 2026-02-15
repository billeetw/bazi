/**
 * wuxingFlowPipeline.js
 * 五行生剋管線：從四柱向量化 → 月令加權 → 生剋流量／瓶頸／制衡壓力 → 三層報告
 * 依賴：KB 由 loadKB() 載入或呼叫端注入；無依賴 constants.js（可獨立跑）
 */

(function (global) {
  "use strict";

  const ELEMENT_IDS = ["wood", "fire", "earth", "metal", "water"];

  /** 五行生剋「描述層」Normal Spec：相生順流優勢（不可改字義） */
  const GEN_TYPE_MAP = {
    "water->wood": { name: "滋養成長", summary: "水生木，代表資源、資訊、情緒或直覺能順利支持成長、探索與決策。" },
    "wood->fire": { name: "助燃行動", summary: "木生火，代表計畫、知識與準備能順利轉化為行動、動力與表現。" },
    "fire->earth": { name: "行動奠基", summary: "火生土，代表投入與努力能沉澱為成果、資產或穩固地基。" },
    "earth->metal": { name: "淬煉方法", summary: "土生金，代表經驗與累積能轉化為制度、工具、方法論。" },
    "metal->water": { name: "規則生智", summary: "金生水，代表邏輯、規則或分工能產生新的流動性、想法與智慧。" },
  };

  /** 五行生剋「描述層」Normal Spec：相剋壓力類型（不可更動 wording） */
  const CONTROL_TYPE_MAP = {
    "earthxwater": { name: "感覺卡卡型", summary: "土剋水，流動性被壓住，行動、資金、現金流、情緒容易被卡住。" },
    "metalxwood": { name: "刀口餘生型", summary: "金剋木，規則、制度、合約，容易扼殺創意，成長受箝制。" },
    "firexmetal": { name: "改革衝撞型", summary: "火剋金，行動熱度強度壓過制度，流程可能來不及跟上或配合。" },
    "waterxfire": { name: "常想太多型", summary: "水剋火，顧慮、情緒與過度思考澆熄行動力，不容易啟動。" },
    "woodxearth": { name: "基礎空虛型", summary: "木剋土，成長速度快於地基與資源承載，基礎易不穩。" },
  };

  /** 相生優勢：對外顯示用自然語擴寫（純中文、無代號） */
  const GEN_DISPLAY = {
    "water->wood": { name: "滋養成長", body: "水生木，代表你的資源、資訊與直覺能順利支持成長與決策，不容易空想而無法落地，而是有機會把感受轉成實際的探索與選擇。" },
    "wood->fire": { name: "助燃行動", body: "木生火，代表你的想法、計畫與準備能順利轉化為行動與表現，不容易卡在只想不做，而是想到就有機會去實際推進。" },
    "fire->earth": { name: "行動奠基", body: "火生土，代表你的投入與努力能沉澱為成果與地基，做得動、也留得下，有機會累積成實質的資產或穩固的基礎。" },
    "earth->metal": { name: "淬煉方法", body: "土生金，代表經驗與累積能轉化為制度、工具或方法論，做得不少，也有機會整理成可複製的模式與流程。" },
    "metal->water": { name: "規則生智", body: "金生水，代表邏輯與規則能帶來新的流動與想法，結構與分工有助於產生靈感與智慧，而不是壓死創意。" },
  };

  /** 相生瓶頸：定性描述（轉化瓶頸／供應不足），不顯示數值 */
  const BOTTLENECK_DISPLAY = {
    "water->wood": { transform: "資源與直覺不少，但要化為實際的成長與決策時，會覺得較難推進。", supply: "成長與探索的需求大，但滋養的資源或情緒支持相對不足。" },
    "wood->fire": { transform: "計畫與準備不少，但要化為行動與表現時，容易卡在啟動。", supply: "行動與表現的需求強，但計畫與準備的基礎相對不足。" },
    "fire->earth": { transform: "投入與努力不少，但要沉澱為成果或地基時，會覺得整理得比較吃力。", supply: "對成果與穩固的需求大，但行動與熱情的供給相對不足。" },
    "earth->metal": { transform: "做得不少，但要把經驗沉澱成制度、方法或工具時，會覺得整理得比較吃力，難以完全變成可複製的模式。", supply: "對制度與方法的需求大，但經驗與累積的基礎相對不足。" },
    "metal->water": { transform: "規則與結構不少，但要化為新的流動與想法時，容易覺得卡卡的。", supply: "對流動與靈感的需求大，但邏輯與分工帶來的供給相對不足。" },
  };

  /** 最大制衡壓力：對外顯示用自然語擴寫（純中文、無代號與數值） */
  const CONTROL_DISPLAY = {
    "earthxwater": { name: "感覺卡卡型", body: "土剋水，流動性被壓住，行動、資金、現金流或情緒容易覺得卡卡的，想動卻動得不順。" },
    "metalxwood": { name: "刀口餘生型", body: "金剋木，規則、制度與合約容易壓過創意，成長與探索會覺得受箝制，需要刻意保留彈性。" },
    "firexmetal": { name: "改革衝撞型", body: "行動與熱度的力量明顯壓過制度與結構，容易出現先衝先做、流程與規則事後才來補的情況，行動節奏快，但制度承載感偏緊繃。" },
    "waterxfire": { name: "常想太多型", body: "顧慮、情緒與過度思考容易澆熄行動力，想得多、啟動難，需要刻意為行動留出空間。" },
    "woodxearth": { name: "基礎空虛型", body: "木剋土，成長與擴張的速度快於地基與資源的承載，基礎容易顯得空虛，需要回頭補強。" },
  };

  /** 英文版：相生優勢 */
  const GEN_DISPLAY_EN = {
    "water->wood": { name: "Nurturing Growth", body: "Water generates Wood: your resources, information, and intuition can support growth and decisions. You can turn feelings into exploration and choices." },
    "wood->fire": { name: "Fueling Action", body: "Wood generates Fire: your ideas and plans can turn into action. You can move from thinking to doing." },
    "fire->earth": { name: "Action Foundation", body: "Fire generates Earth: your effort can become results and a solid base. You build tangible assets." },
    "earth->metal": { name: "Refining Methods", body: "Earth generates Metal: experience becomes systems, tools, and methodology. You can replicate patterns." },
    "metal->water": { name: "Rules Generate Wisdom", body: "Metal generates Water: logic and structure bring new flow and ideas. Structure supports creativity." },
  };

  /** 英文版：相生瓶頸 */
  const BOTTLENECK_DISPLAY_EN = {
    "water->wood": { transform: "Resources exist, but turning them into growth and decisions feels harder.", supply: "Demand for growth is high, but nurturing resources or emotional support is relatively insufficient." },
    "wood->fire": { transform: "Plans exist, but turning them into action tends to stall at the start.", supply: "Demand for action is strong, but the foundation of planning is relatively insufficient." },
    "fire->earth": { transform: "Effort exists, but consolidating into results feels harder.", supply: "Demand for results is high, but the supply of action and drive is relatively insufficient." },
    "earth->metal": { transform: "Experience exists, but turning it into systems and methods feels harder.", supply: "Demand for systems is high, but the foundation of experience is relatively insufficient." },
    "metal->water": { transform: "Structure exists, but turning it into new flow and ideas feels stuck.", supply: "Demand for flow is high, but the supply from logic and structure is relatively insufficient." },
  };

  /** 英文版：最大制衡壓力 */
  const CONTROL_DISPLAY_EN = {
    "earthxwater": { name: "Feeling Stuck", body: "Earth controls Water: flow is suppressed. Action, capital, cash flow, or emotions feel stuck." },
    "metalxwood": { name: "Rules Over Creativity", body: "Metal controls Wood: rules and systems can stifle creativity. Growth feels constrained." },
    "firexmetal": { name: "Action Over Structure", body: "Fire controls Metal: action and heat override systems. Process may lag behind." },
    "waterxfire": { name: "Overthinking", body: "Water controls Fire: worry and overthinking dampen action. Hard to start." },
    "woodxearth": { name: "Growth Over Base", body: "Wood controls Earth: growth outpaces foundation. Base feels hollow." },
  };

  const ELEM_EN = { wood: "Wood", fire: "Fire", earth: "Earth", metal: "Metal", water: "Water" };

  function zeroVector() {
    const v = {};
    ELEMENT_IDS.forEach((e) => { v[e] = 0; });
    return v;
  }

  function copyVector(v) {
    const out = {};
    ELEMENT_IDS.forEach((e) => { out[e] = Number(v[e]) || 0; });
    return out;
  }

  /**
   * 載入 KB（瀏覽器可傳 baseUrl 用 fetch；或直接傳入已載好的 kb 物件）
   * @param {string} [baseUrl] - 例如 '' 或 '/data/wuxing'
   * @returns {Promise<Object>} kb
   */
  async function loadKB(baseUrl) {
    baseUrl = baseUrl || "/data/wuxing";
    const [elements, stems, branches, monthBranches, flowDesc] = await Promise.all([
      fetch(baseUrl + "/elements.json").then((r) => r.json()),
      fetch(baseUrl + "/stems.json").then((r) => r.json()),
      fetch(baseUrl + "/branches.json").then((r) => r.json()),
      fetch(baseUrl + "/month_branches.json").then((r) => r.json()),
      fetch(baseUrl + "/flow_descriptions.json").then((r) => r.json()),
    ]);
    return {
      elements: elements.elements || [],
      gen_edges: elements.gen_edges || [],
      ctl_edges: elements.ctl_edges || [],
      stems: stems.stems || [],
      branches: branches.branches || [],
      month_branches: monthBranches.month_branches || [],
      flow_descriptions: flowDesc,
    };
  }

  function buildStemToElem(stems) {
    const m = {};
    (stems || []).forEach((s) => { m[s.zh] = s.elem; });
    return m;
  }

  function buildBranchLookup(branches) {
    const byZh = {};
    const zhToId = {};
    (branches || []).forEach((b) => {
      byZh[b.zh] = b;
      zhToId[b.zh] = b.id;
    });
    return { byZh, zhToId };
  }

  function buildMonthMultipliers(monthBranches) {
    const byBranchId = {};
    (monthBranches || []).forEach((mb) => { byBranchId[mb.branch] = mb.seasonal_multiplier; });
    return byBranchId;
  }

  /**
   * 四柱 → 五行向量（原始）
   * @param {Object} pillars - { year, month, day, hour } 各 { stem, branch }（中文）
   * @param {Object} kb - 知識庫
   * @param {number} stem_w - 天干權重
   * @param {number} branch_w - 地支權重
   */
  function vectorize(pillars, kb, stem_w, branch_w) {
    stem_w = stem_w != null ? stem_w : 1.0;
    branch_w = branch_w != null ? branch_w : 1.0;
    const v = zeroVector();
    const stemToElem = buildStemToElem(kb.stems);
    const { byZh: branchByZh } = buildBranchLookup(kb.branches);

    function addStem(zh) {
      const elem = stemToElem[zh];
      if (elem) v[elem] += stem_w;
    }

    function addBranch(br) {
      const b = typeof br === "string" ? branchByZh[br] : null;
      if (!b || !b.hidden) return;
      b.hidden.forEach((pair) => {
        const stemZh = pair[0];
        const weight = pair[1];
        const elem = stemToElem[stemZh];
        if (elem) v[elem] += branch_w * weight;
      });
    }

    ["year", "month", "day", "hour"].forEach((key) => {
      const col = pillars[key];
      if (!col) return;
      if (col.stem) addStem(col.stem);
      if (col.branch) addBranch(col.branch);
    });

    return v;
  }

  /**
   * 月令加權
   * @param {string} monthBranchZh - 月柱地支中文（如 "寅"）
   * @param {Object} v_raw - 原始向量
   * @param {Object} kb
   */
  function applySeason(monthBranchZh, v_raw, kb) {
    const { zhToId } = buildBranchLookup(kb.branches);
    const multipliers = buildMonthMultipliers(kb.month_branches);
    const branchId = zhToId[monthBranchZh] || monthBranchZh;
    const m = multipliers[branchId];
    if (!m) return copyVector(v_raw);
    const v_season = {};
    ELEMENT_IDS.forEach((e) => {
      v_season[e] = (Number(v_raw[e]) || 0) * (m[e] != null ? m[e] : 1);
    });
    return v_season;
  }

  /**
   * 相生／相剋流量
   */
  function computeFlows(v, kb, alpha, beta) {
    alpha = alpha != null ? alpha : 1.0;
    beta = beta != null ? beta : 1.0;
    const production = {};
    const control = {};
    (kb.gen_edges || []).forEach((edge) => {
      const key = edge.from + "->" + edge.to;
      production[key] = Math.min(Number(v[edge.from]) || 0, Number(v[edge.to]) || 0) * alpha;
    });
    (kb.ctl_edges || []).forEach((edge) => {
      const key = edge.from + "x" + edge.to;
      control[key] = Math.min(Number(v[edge.from]) || 0, Number(v[edge.to]) || 0) * beta;
    });
    return { production, control };
  }

  /** 相生鏈順序（水→木→火→土→金→水） */
  const GEN_CHAIN = [
    ["water", "wood"],
    ["wood", "fire"],
    ["fire", "earth"],
    ["earth", "metal"],
    ["metal", "water"],
  ];

  function analyzeBottlenecks(v, kb) {
    const stats = GEN_CHAIN.map(([up, down]) => {
      const upVal = Number(v[up]) || 0;
      const downVal = Number(v[down]) || 0;
      const ratio = upVal > 0 ? downVal / upVal : null;
      const throughput = Math.min(upVal, downVal);
      return { link: up + "->" + down, up, down, ratio, throughput, upVal, downVal };
    });
    let bottleneck_by_throughput = stats[0];
    let bottleneck_by_ratio = stats[0];
    stats.forEach((s) => {
      if (s.throughput < bottleneck_by_throughput.throughput) bottleneck_by_throughput = s;
      if (s.ratio != null && bottleneck_by_ratio.ratio != null) {
        const dev = Math.abs(s.ratio - 1);
        const devPrev = Math.abs(bottleneck_by_ratio.ratio - 1);
        if (dev > devPrev) bottleneck_by_ratio = s;
      }
    });
    return { stats, bottleneck_by_throughput, bottleneck_by_ratio };
  }

  /** 相剋對 (ctl, to) */
  const CTL_PAIRS = [
    ["wood", "earth"],
    ["earth", "water"],
    ["water", "fire"],
    ["fire", "metal"],
    ["metal", "wood"],
  ];

  function analyzeControl(v, kb) {
    const stats = CTL_PAIRS.map(([ctl, to]) => {
      const ctlVal = Number(v[ctl]) || 0;
      const toVal = Number(v[to]) || 0;
      const control_ratio = toVal > 0 ? ctlVal / toVal : null;
      return { link: ctl + "x" + to, ctl, to, control_ratio };
    });
    let max_pressure = stats[0];
    stats.forEach((s) => {
      if (s.control_ratio != null && (max_pressure.control_ratio == null || s.control_ratio > max_pressure.control_ratio)) {
        max_pressure = s;
      }
    });
    return { stats, max_pressure };
  }

  /**
   * 排序向量（強→弱），回傳 [elem, value][] 與 top2 / bottom2
   */
  function sortVector(v) {
    const arr = ELEMENT_IDS.map((e) => [e, Number(v[e]) || 0]).sort((a, b) => b[1] - a[1]);
    return {
      ordered: arr,
      top2: arr.slice(0, 2),
      bottom2: arr.slice(-2).reverse(),
    };
  }

  function findFlowDescription(kb, id, kind) {
    const list = kind === "gen" ? (kb.flow_descriptions && kb.flow_descriptions.gen) : (kb.flow_descriptions && kb.flow_descriptions.ctl);
    if (!list) return null;
    return list.find((d) => d.id === id) || null;
  }

  function elemToZh(kb, elemId) {
    const el = (kb.elements || []).find((e) => e.id === elemId);
    return el ? el.zh : elemId;
  }

  /**
   * 組裝三層報告 ＋ 病例欄位 ＋ Normal Spec 五段式全文
   * @param {string} [locale] - 'en' 時使用英文內容
   */
  function buildReport(v_raw, v_season, flows, bottleneckResult, controlResult, kb, locale) {
    const isEn = locale === "en";
    const sorted_raw = sortVector(v_raw);
    const sorted_season = sortVector(v_season);
    const desc = (kb.elements || []).reduce((acc, e) => {
      acc[e.id] = isEn ? (ELEM_EN[e.id] || e.zh) : e.zh;
      return acc;
    }, {});

    const layer1 = {
      v_raw: copyVector(v_raw),
      v_season: copyVector(v_season),
      sorted_raw: sorted_raw.ordered.map(([e, val]) => ({ elem: e, zh: desc[e], value: val })),
      sorted_season: sorted_season.ordered.map(([e, val]) => ({ elem: e, zh: desc[e], value: val })),
      top2: sorted_season.top2.map(([e, val]) => ({ elem: e, zh: desc[e], value: val })),
      bottom2: sorted_season.bottom2.map(([e, val]) => ({ elem: e, zh: desc[e], value: val })),
    };

    const b = bottleneckResult.bottleneck_by_throughput;
    const flowDescGen = findFlowDescription(kb, b ? b.link : "", "gen");
    const layer2 = {
      production: flows.production,
      control: flows.control,
      chain_stats: bottleneckResult.stats,
      bottleneck: b ? { link: b.link, ratio: b.ratio, throughput: b.throughput } : null,
      bottleneck_explanation: flowDescGen ? (b && b.ratio != null && b.ratio < 0.7 ? flowDescGen.stress : flowDescGen.positive) : null,
    };

    const mp = controlResult.max_pressure;
    const ctlDesc = mp && mp.link ? findFlowDescription(kb, mp.link, "ctl") : null;
    const layer3 = {
      control_stats: controlResult.stats,
      max_pressure: mp ? { link: mp.link, control_ratio: mp.control_ratio } : null,
      max_pressure_explanation: ctlDesc ? ctlDesc.stress : null,
    };

    const top2Zh = layer1.top2.map((x) => x.zh);
    const bottom2Zh = layer1.bottom2.map((x) => x.zh);

    /** 相生 link 轉中文，如 wood->fire → 木生火 */
    function genLinkToZh(link, descMap) {
      if (!link || link.indexOf("->") === -1) return "";
      const [up, down] = link.split("->");
      return (descMap[up] || up) + "生" + (descMap[down] || down);
    }
    /** 相剋 link 轉中文，如 firexmetal → 火剋金 */
    function ctrlLinkToZh(link, descMap) {
      if (!link || link.indexOf("x") === -1) return "";
      const [ctl, to] = link.split("x");
      return (descMap[ctl] || ctl) + "剋" + (descMap[to] || to);
    }

    // ---- 一、氣勢 ----
    const momentumText = isEn
      ? "Overall momentum is strongest in " + top2Zh[0] + " and " + top2Zh[1] + ".\n" +
        top2Zh[0] + " and " + top2Zh[1] + " are the main rhythm of your natal chart.\n" +
        "By contrast, " + bottom2Zh[0] + " and " + bottom2Zh[1] + " are weaker. Strengthening them would balance the five-phase cycle."
      : "整體氣勢以" + top2Zh[0] + "、" + top2Zh[1] + "最為突出：\n" +
        top2Zh[0] + "與" + top2Zh[1] + "的力量明顯，是本命盤的主要節奏。\n" +
        "相對而言，" + bottom2Zh[0] + "、" + bottom2Zh[1] + "的力量較弱，若能加以補強，五行之間的循環會更加平衡。";

    // ---- 二、相生優勢 ----
    const genStats = bottleneckResult.stats || [];
    let bestGen = genStats[0];
    genStats.forEach((s) => {
      if (s.throughput > (bestGen ? bestGen.throughput : -1)) bestGen = s;
    });
    const genDisplayMap = isEn ? GEN_DISPLAY_EN : GEN_DISPLAY;
    const genDisplay = bestGen ? genDisplayMap[bestGen.link] : null;
    const genSegZh = bestGen ? genLinkToZh(bestGen.link, desc) : "";
    const genPositiveText = genDisplay && genSegZh
      ? (isEn ? "The smoothest generative cycle in your chart is \"" + genSegZh + "\".\n\n\"" + genDisplay.name + "\":\n" + genDisplay.body : "本命盤最順暢的一段相生在「" + genSegZh + "」。\n\n「" + genDisplay.name + "」：\n" + genDisplay.body)
      : (isEn ? "No clearly dominant positive flow segment yet." : "本命盤目前尚無明顯最順暢的相生段。");

    // ---- 三、相生瓶頸 ----
    const bottleneckDisplayMap = isEn ? BOTTLENECK_DISPLAY_EN : BOTTLENECK_DISPLAY;
    const bottleneckDisplay = b ? bottleneckDisplayMap[b.link] : null;
    const bottleneckSegZh = b ? genLinkToZh(b.link, desc) : "";
    let bottleneckText = "";
    if (b && bottleneckDisplay && bottleneckSegZh) {
      bottleneckText = isEn ? "The main generative bottleneck is in \"" + bottleneckSegZh + "\".\n\n" : "主要的相生瓶頸出現在「" + bottleneckSegZh + "」這一段。\n\n";
      if (b.ratio != null && b.ratio < 1) {
        bottleneckText += (isEn ? "Upstream " + (desc[b.up] || b.up) + " is sufficient, but " + (desc[b.down] || b.down) + " is relatively weak (transformation bottleneck):\n" : "上游的" + (desc[b.up] || b.up) + "力量充足，但" + (desc[b.down] || b.down) + "的力量相對不足，形成典型的「轉化瓶頸」：\n") + bottleneckDisplay.transform;
      } else if (b.ratio != null && b.ratio > 1) {
        bottleneckText += (isEn ? "Downstream " + (desc[b.down] || b.down) + " demand is high, but upstream " + (desc[b.up] || b.up) + " supply is insufficient:\n" : "下游的" + (desc[b.down] || b.down) + "需求大，但上游的" + (desc[b.up] || b.up) + "供給相對不足，形成「供應不足」：\n") + bottleneckDisplay.supply;
      } else {
        bottleneckText += (isEn ? "Upstream and downstream are close; this segment remains the main bottleneck:\n" : "此段上下游比例接近，整體轉化仍以這段為相對卡關處：\n") + bottleneckDisplay.transform;
      }
    } else if (b && bottleneckSegZh) {
      bottleneckText = isEn ? "The main bottleneck is in \"" + bottleneckSegZh + "\"; upstream and downstream are imbalanced." : "主要的相生瓶頸出現在「" + bottleneckSegZh + "」這一段，上游與下游的搭配較不均衡，轉化效率受限。";
    } else {
      bottleneckText = isEn ? "No clear bottleneck segment yet." : "目前尚無明顯的相生瓶頸段。";
    }

    // ---- 四、最大制衡壓力 ----
    const ctrlDisplayMap = isEn ? CONTROL_DISPLAY_EN : CONTROL_DISPLAY;
    const ctrlDisplay = mp && mp.link ? ctrlDisplayMap[mp.link] : null;
    const ctrlSegZh = mp && mp.link ? ctrlLinkToZh(mp.link, desc) : "";
    const controlText = ctrlDisplay && ctrlSegZh
      ? (isEn ? "The strongest control pressure in your chart is \"" + ctrlSegZh + "\".\n\n\"" + ctrlDisplay.name + "\":\n" + ctrlDisplay.body : "本命盤壓力最強的剋線在「" + ctrlSegZh + "」。\n\n「" + ctrlDisplay.name + "」：\n" + ctrlDisplay.body)
      : (isEn ? "No clear control pressure yet." : "目前尚無明顯的制衡壓力。");

    // ---- 五、下一步建議 ----
    const ctrlLeft = mp && mp.link ? mp.link.split("x")[0] : "";
    const ctrlRight = mp && mp.link ? mp.link.split("x")[1] : "";
    const ctrlLeftZh = ctrlLeft ? (desc[ctrlLeft] || ctrlLeft) : "";
    const ctrlRightZh = ctrlRight ? (desc[ctrlRight] || ctrlRight) : "";
    let predictionText = "";
    if (ctrlLeftZh && ctrlRightZh) {
      predictionText = isEn
        ? "For this chart, strong " + ctrlLeftZh + " and weak " + ctrlRightZh + " are the main pressure source.\n\n" +
          "If " + ctrlRightZh + " strengthens in annual or monthly cycles, it can improve system stability and help your actions be received and organized.\n\n" +
          "Conversely, if " + ctrlLeftZh + " amplifies without " + ctrlRightZh + " catching up, action gains momentum but systemic pressure rises. Consider adjusting pace and strengthening structure.\n\n" +
          "To turn these energy shifts into practical decisions, consider a consultation for a full birth chart and annual fortune analysis."
        : "就這張命盤而言，" + ctrlLeftZh + "勢旺、" + ctrlRightZh + "勢弱，是目前最明顯的壓力來源。\n\n" +
          "若未來在流年或流月中，" + ctrlRightZh + "的力量被增強，通常有助於提升制度與結構的穩定度，讓你的行動不只快，還能被好好承接與整理。\n\n" +
          "相反地，若" + ctrlLeftZh + "再度被放大，而" + ctrlRightZh + "沒有跟上，行動雖然更有氣勢，但制度層面的壓力也會同步增加，比較適合搭配「調整步調、補強結構」一起處理。\n\n" +
          "如果你希望把這些能量變化落實到實際決策與未來規劃，可以進一步透過與李伯彥老師的諮詢，拿到完整個人命書與流年運勢解析，把這些訊息整理成真正能用的行動指引。";
    } else {
      predictionText = isEn ? "To turn five-phase insights into practical decisions, consider a consultation for a full birth chart and annual fortune analysis." : "若希望把五行生剋的訊息落實到實際決策與未來規劃，可以透過與李伯彥老師的諮詢，拿到完整個人命書與流年運勢解析，整理成真正能用的行動指引。";
    }

    // ---- 五段式全文（純中文標題、無英文與數值）----
    const fullReportText =
      "【五行生剋診斷】\n\n" +
      "一、氣勢\n" + momentumText + "\n\n" +
      "二、相生優勢\n" + genPositiveText + "\n\n" +
      "三、相生瓶頸\n" + bottleneckText + "\n\n" +
      "四、最大制衡壓力\n" + controlText + "\n\n" +
      "五、下一步我們能為你做什麼？\n" + predictionText;

    // 向後相容：卡片用欄位（純中文、無數值）
    const chief_complaint = momentumText;
    const findings = [];
    const diagnosis = ctrlDisplay && ctrlSegZh ? "「" + ctrlDisplay.name + "」：" + ctrlDisplay.body : "";
    const falsifiable_predictions = predictionText;

    return {
      layer1,
      layer2,
      layer3,
      chief_complaint,
      findings,
      diagnosis,
      falsifiable_predictions,
      fullReportText,
      momentumText,
      genPositiveText,
      bottleneckText,
      controlText,
      predictionText,
    };
  }

  /**
   * 從現有 bazi 物件組出四柱（供 runPipeline 使用）
   * 支援兩種格式：
   * 1. bazi.display: { yG, yZ, mG, mZ, dG, dZ, hG?, hZ? }
   * 2. bazi.year/month/day/hour: 各 { stem, branch }
   * @param {Object} bazi - contract.bazi
   * @returns {Object|null} pillars 或 null（缺欄位時）
   */
  function buildPillarsFromBazi(bazi) {
    if (!bazi) return null;
    let yS, yZ, mS, mZ, dS, dZ, hS, hZ;
    const d = bazi.display;
    if (d && d.yG && d.yZ && d.mG && d.mZ && d.dG && d.dZ) {
      yS = d.yG; yZ = d.yZ; mS = d.mG; mZ = d.mZ; dS = d.dG; dZ = d.dZ;
      hS = d.hG || ""; hZ = d.hZ || "";
    } else if (bazi.year && bazi.month && bazi.day) {
      yS = bazi.year.stem || ""; yZ = bazi.year.branch || "";
      mS = bazi.month.stem || ""; mZ = bazi.month.branch || "";
      dS = bazi.day.stem || ""; dZ = bazi.day.branch || "";
      const hr = bazi.hour || {};
      hS = hr.stem || ""; hZ = hr.branch || "";
    } else {
      return null;
    }
    if (!yS || !yZ || !mS || !mZ || !dS || !dZ) return null;
    return {
      year: { stem: yS, branch: yZ },
      month: { stem: mS, branch: mZ },
      day: { stem: dS, branch: dZ },
      hour: { stem: hS, branch: hZ },
    };
  }

  /**
   * 一鍵執行管線
   * @param {Object} pillars - { year, month, day, hour } 各 { stem, branch }
   * @param {Object} kb - 知識庫（若未傳則需事先 setKB 或由呼叫端 loadKB 後傳入）
   * @param {Object} [opts] - stem_w, branch_w, alpha, beta, locale
   */
  function runPipeline(pillars, kb, opts) {
    if (!kb) throw new Error("wuxingFlowPipeline: kb required");
    opts = opts || {};
    const locale = opts.locale || (typeof global !== "undefined" && global.I18n?.getLocale?.()) || (typeof window !== "undefined" && window.I18n?.getLocale?.()) || "zh-TW";
    const v_raw = vectorize(pillars, kb, opts.stem_w, opts.branch_w);
    const monthBranch = (pillars.month && pillars.month.branch) || "寅";
    const v_season = applySeason(monthBranch, v_raw, kb);
    const flows = computeFlows(v_season, kb, opts.alpha, opts.beta);
    const bottleneckResult = analyzeBottlenecks(v_season, kb);
    const controlResult = analyzeControl(v_season, kb);
    const report = buildReport(v_raw, v_season, flows, bottleneckResult, controlResult, kb, locale === "en" ? "en" : "zh-TW");
    return {
      v_raw,
      v_season,
      production: flows.production,
      control: flows.control,
      bottleneckResult,
      controlResult,
      report,
    };
  }

  const api = {
    ELEMENT_IDS,
    zeroVector,
    loadKB,
    buildPillarsFromBazi,
    vectorize,
    applySeason,
    computeFlows,
    analyzeBottlenecks,
    analyzeControl,
    sortVector,
    buildReport,
    runPipeline,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.WuxingFlowPipeline = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
