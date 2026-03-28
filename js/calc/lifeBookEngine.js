/* calc/lifeBookEngine.js
 * 命書生成引擎
 * 依賴: calc/constants.js, calc/fourTransformations.js
 *
 * 流程: chart_json → weight_analysis() → 逐章生成 → renderHTML()
 * 禁止一次生成 20 章，禁止跳過權重分析
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("lifeBookEngine.js requires browser environment");
  }
  if (!window.CalcConstants) {
    throw new Error("lifeBookEngine.js requires calc/constants.js");
  }

  const PALACE_DEFAULT = window.CalcConstants?.PALACE_DEFAULT || [
    "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
    "遷移", "僕役", "官祿", "田宅", "福德", "父母",
  ];

  /** 與 js/lifebook-version.js 保持一致；後台與 viewer 共用 */
  const LIFEBOOK_SCHEMA_VERSION = "1.0";
  const LIFEBOOK_GENERATOR_VERSION = "gpt-4.1-lifebook-v1";

  /** 嚴格章節順序 — 由 npm run sync:section-order 自 worker/data/lifebook-section-order.json 寫入，勿手改 */
  // LIFEBOOK_SECTION_ORDER_SYNC_START
  const SECTION_ORDER = [
    "s00", "s03", "s04", "s02", "s10", "s01", "s05", "s06", "s07", "s08", "s09", "s11", "s12", "s13", "s14", "s15", "s15a", "s16", "s17", "s18", "s19", "s20", "s22", "s23", "s21",
  ];
// LIFEBOOK_SECTION_ORDER_SYNC_END

  /** 章節標題與宮位映射（人話描述（技術名稱）） */
  const SECTION_CONFIG = {
    s00: { title: "這一局，你為什麼要來？（靈魂行前簡報）", palace: null },
    s01: { title: "你的心靈休息站（福德宮）", palace: "福德" },
    s02: { title: "你是帶著什麼狀態上場？（命宮）", palace: "命宮" },
    s03: { title: "你的底層程式碼（五行氣勢與生剋）", palace: null },
    s04: { title: "你為這具身體準備了什麼？（命主・身主・身宮・身體使用說明）", palace: "命宮" },
    s05: { title: "學習看自己的鏡子（父母宮）", palace: "父母" },
    s06: { title: "互相成就課題（兄弟宮）", palace: "兄弟" },
    s07: { title: "服務他人、團隊默契（僕役宮）", palace: "僕役" },
    s08: { title: "穩定成長區（官祿宮）", palace: "官祿" },
    s09: { title: "生活根基與安全基地（田宅宮）", palace: "田宅" },
    s10: { title: "你怎麼看錢、用錢、創造錢？（財帛宮）", palace: "財帛" },
    s11: { title: "身體訊號與修復課題（疾厄宮）", palace: "疾厄" },
    s12: { title: "對外舞台與社會運勢（遷移宮）", palace: "遷移" },
    s13: { title: "重要調整區（夫妻宮）", palace: "夫妻" },
    s14: { title: "紅燈高壓區（子女宮）", palace: "子女" },
    s15: { title: "你的一生章節（十年大限總覽）", palace: null },
    s15a: { title: "各宮位小限年份與疊宮引爆分析", palace: null },
    s16: { title: "今年的主線任務與心理濾鏡（流年・小限）", palace: null },
    s17: { title: "此生核心功課（靈魂使命）", palace: null },
    s18: { title: "未完成的必修課（業力議題）", palace: null },
    s19: { title: "三條立刻可做・三條長期累積・三條避開折損（短期・長期・避凶）", palace: null },
    s20: { title: "三盤疊加診斷（流年 × 大限 × 本命）", palace: null },
    s22: { title: "你的結構格局（對宮線）", palace: null },
    s23: { title: "你怎麼把人生用出來（轉化流）", palace: null },
    s21: { title: "你往何處去（靈魂總結）", palace: null },
  };

  /**
   * 權重分析（必須先執行）
   * 宮位分數 = (化忌×3) + (化祿×2) + (化權×1.5) + (化科×1) + (疊宮係數×2) + (五行失衡×2)
   */
  function weightAnalysis(chartJson) {
    const overlap = chartJson?.overlapAnalysis || chartJson?.overlap;
    const palaceMap = overlap?.palaceMap;
    const criticalRisks = overlap?.criticalRisks || [];
    const maxOpportunities = overlap?.maxOpportunities || [];
    const volatileAmbivalences = overlap?.volatileAmbivalences || [];
    const fiveElements = chartJson?.fiveElements || chartJson?.wuxingData || {};

    const scores = {};
    const getPalaceData = (name) => {
      if (!palaceMap) return null;
      if (palaceMap instanceof Map) return palaceMap.get(name);
      return palaceMap[name];
    };

    PALACE_DEFAULT.forEach((palace) => {
      const p = getPalaceData(palace);
      const ji = (p?.jiCount || 0) * 3;
      const lu = (p?.luCount || 0) * 2;
      const quan = (p?.quanCount || 0) * 1.5;
      const ke = (p?.keCount || 0) * 1;
      let overlapCoef = 0;
      if (criticalRisks.some((r) => r.palace === palace)) overlapCoef += 2;
      if (maxOpportunities.some((o) => o.palace === palace)) overlapCoef += 2;
      if (volatileAmbivalences.some((v) => v.palace === palace)) overlapCoef += 2;
      const wxCoef = (fiveElements?.raw && Object.keys(fiveElements.raw).length > 0)
        ? 2
        : 0;
      scores[palace] = ji + lu + quan + ke + overlapCoef * 2 + wxCoef * 2;
    });

    const sorted = PALACE_DEFAULT.map((p) => ({ palace: p, score: scores[p] || 0 }))
      .sort((a, b) => b.score - a.score);

    const top3 = sorted.slice(0, 3).map((x) => x.palace);
    const bottom3 = sorted.slice(-3).map((x) => x.palace);
    const palaceImportance = {};
    sorted.forEach((s, i) => {
      if (top3.includes(s.palace)) palaceImportance[s.palace] = "high";
      else if (bottom3.includes(s.palace)) palaceImportance[s.palace] = "low";
      else palaceImportance[s.palace] = "medium";
    });

    const importance_map = {};
    SECTION_ORDER.forEach((key) => {
      const cfg = SECTION_CONFIG[key];
      if (cfg?.palace && palaceImportance[cfg.palace]) {
        importance_map[key] = palaceImportance[cfg.palace];
      } else if (["s15", "s16", "s17", "s19", "s20", "s22", "s23"].includes(key)) {
        importance_map[key] = "high";
      } else if (key === "s03" || key === "s18" || key === "s01") {
        importance_map[key] = "medium";
      } else {
        importance_map[key] = "medium";
      }
    });

    const riskPalaces = criticalRisks.map((r) => r.palace);
    const traffic_signals = {};
    PALACE_DEFAULT.forEach((palace) => {
      if (riskPalaces.includes(palace)) {
        traffic_signals[palace] = "red";
      } else if (top3.includes(palace)) {
        traffic_signals[palace] = "yellow";
      } else if (bottom3.includes(palace)) {
        traffic_signals[palace] = "green";
      } else {
        traffic_signals[palace] = "yellow";
      }
    });

    return {
      top_focus_palaces: top3,
      risk_palaces: riskPalaces,
      stable_palaces: bottom3,
      importance_map,
      palace_scores: scores,
      sorted_palaces: sorted,
      traffic_signals,
    };
  }

  /**
   * 章節 JSON 結構（嚴格固定）
   */
  const SECTION_JSON_SCHEMA = [
    "section_key", "title", "importance_level",
    "structure_analysis", "behavior_pattern", "blind_spots", "strategic_advice",
  ];

  function validateSectionJson(obj) {
    if (!obj || typeof obj !== "object") return false;
    const has = (k) => typeof obj[k] === "string";
    return (
      has("section_key") && has("title") &&
      ["high", "medium", "low"].includes(obj.importance_level) &&
      has("structure_analysis") && has("behavior_pattern") &&
      has("blind_spots") && has("strategic_advice")
    );
  }

  /**
   * 解析 AI 輸出為章節 JSON（含 retry）
   */
  function parseSectionOutput(rawOutput, sectionKey) {
    try {
      const str = String(rawOutput || "").trim();
      let parsed = null;
      const jsonMatch = str.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
      if (parsed && validateSectionJson(parsed)) {
        return parsed;
      }
    } catch (_) {}
    return null;
  }

  /**
   * 篇幅指引（依 importance_level）
   */
  function getWordRange(importance) {
    switch (importance) {
      case "high": return "1200–1600";
      case "low": return "500–800";
      default: return "800–1200";
    }
  }

  /**
   * 組裝 HTML 命書
   */
  function renderHTML(weightAnalysisData, sections, chartJson = {}) {
    const w = weightAnalysisData || {};
    const birthInfo = chartJson?.birthInfo || {};
    const year = birthInfo.year || "";
    const month = birthInfo.month || "";
    const day = birthInfo.day || "";

    let html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>人生說明書 · 個人命書</title>
  <style>
    body { font-family: 'Noto Sans TC', system-ui, sans-serif; line-height: 1.7; color: #1e293b; max-width: 700px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 1.5rem; color: #0f172a; margin-bottom: 0.5rem; }
    h2 { font-size: 1.15rem; color: #334155; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
    p { margin: 0.75rem 0; }
    .cover { text-align: center; padding: 4rem 0; }
    .meta { color: #64748b; font-size: 0.9rem; }
    .module-title { font-size: 1rem; color: #475569; margin-top: 2.5rem; margin-bottom: 0.75rem; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>人生說明書</h1>
    <p class="meta">個人命書 · ${year}年${month}月${day}日</p>
  </div>

  <h2>權重摘要</h2>
  <p><strong>優先關注宮位：</strong>${(w.top_focus_palaces || []).join("、") || "—"}</p>
  <p><strong>風險宮位：</strong>${(w.risk_palaces || []).join("、") || "—"}</p>
  <p><strong>相對穩定宮位：</strong>${(w.stable_palaces || []).join("、") || "—"}</p>
`;

    const moduleMap = {
      "開場": ["s00"],
      "模組一：核心作業系統": ["s03", "s02", "s10", "s01"],
      "人生十二課題": ["s05", "s06", "s07", "s08", "s04", "s09", "s11", "s12", "s13", "s14"],
      "模組二：時間主線與功課": ["s15", "s16", "s17", "s18", "s19", "s20", "s22", "s23"],
      "收束": ["s21"],
    };

    Object.entries(moduleMap).forEach(([modTitle, keys]) => {
      html += `<div class="module-title">${modTitle}</div>`;
      keys.forEach((key) => {
        const sec = sections[key];
        if (!sec) return;
        html += `  <h2>${sec.title || key}</h2>`;
        if (sec.star_palace_quotes && typeof sec.star_palace_quotes === "object" && Object.keys(sec.star_palace_quotes).length > 0) {
          html += '  <p><strong>【星曜宮位評語（會直接顯示給當事人）】</strong></p>';
          Object.entries(sec.star_palace_quotes).forEach(([k, v]) => {
            html += `  <p><strong>${k}</strong>：${(v || "").replace(/\n/g, "</p><p>")}</p>`;
          });
          html += '  <p><strong>【綜合分析】</strong></p>';
        }
        html += `  <p>${(sec.structure_analysis || "").replace(/\n/g, "</p><p>")}</p>`;
        html += `  <p>${(sec.behavior_pattern || "").replace(/\n/g, "</p><p>")}</p>`;
        html += `  <p>${(sec.blind_spots || "").replace(/\n/g, "</p><p>")}</p>`;
        html += `  <p>${(sec.strategic_advice || "").replace(/\n/g, "</p><p>")}</p>`;
      });
    });

    html += `
  <h2>總結</h2>
  <p>以上內容依命盤結構化數據生成，供諮詢參考使用。</p>
</body>
</html>`;

    return html;
  }

  /** 與 worker SECTION_TEMPLATES 一致：section_key → 該章宮位列表（用於組 star_palace_quotes） */
  var SECTION_PALACE_FOCUS = {
    s00: undefined, s01: ["福德"], s02: ["命宮"], s03: undefined, s04: ["命宮", "福德"], s05: ["父母"],
    s06: ["兄弟"], s07: ["僕役"], s08: ["官祿"], s09: ["田宅"], s10: ["財帛"],
    s11: ["疾厄"], s12: ["遷移"], s13: ["夫妻"], s14: ["子女"],
    s15: undefined, s16: undefined, s17: undefined, s18: undefined, s19: undefined, s20: undefined, s22: undefined, s23: undefined, s21: undefined,
  };

  /**
   * 組裝 LifeBookDocument：chartJson + contentDb（可選）+ lifeBookJson + meta
   * 標準 pipeline：命書資料 = LifeBookDocument，HTML 僅為 doc 的一種呈現。
   * @param {Object} opts - { chartJson, contentDb?, lifeBookJson, meta? }
   * @returns {Object} doc - { meta: { schema_version, generator_version, created_at, ... }, chart_json, weight_analysis, sections }
   */
  function buildLifeBookDocument(opts) {
    var chartJson = opts && opts.chartJson;
    var contentDb = opts && opts.contentDb;
    var lifeBookJson = opts && opts.lifeBookJson || {};
    var meta = (opts && opts.meta && typeof opts.meta === "object") ? opts.meta : {};
    var rawSections = lifeBookJson.sections || {};
    var mainStars = {};
    if (chartJson && chartJson.ziwei && chartJson.ziwei.mainStars && typeof chartJson.ziwei.mainStars === "object") {
      mainStars = chartJson.ziwei.mainStars;
    }
    function getUsedKeys(sectionKey) {
      var palaces = SECTION_PALACE_FOCUS[sectionKey];
      if (!palaces || !palaces.length) return [];
      var keys = [];
      palaces.forEach(function (palace) {
        var stars = mainStars[palace];
        if (!Array.isArray(stars)) return;
        stars.forEach(function (star) { if (star) keys.push(star + "_" + palace); });
      });
      return keys;
    }
    function pickQuotes(usedKeys) {
      if (!contentDb || !contentDb.starPalaces || typeof contentDb.starPalaces !== "object") return {};
      var out = {};
      usedKeys.forEach(function (k) {
        if (contentDb.starPalaces[k]) out[k] = contentDb.starPalaces[k];
      });
      return out;
    }
    var sections = {};
    SECTION_ORDER.forEach(function (sectionKey) {
      var raw = rawSections[sectionKey] || {};
      var section = {
        section_key: raw.section_key || sectionKey,
        title: raw.title || "[" + sectionKey + "]",
        importance_level: ["high", "medium", "low"].indexOf(raw.importance_level) >= 0 ? raw.importance_level : "medium",
        structure_analysis: String(raw.structure_analysis || ""),
        behavior_pattern: String(raw.behavior_pattern || ""),
        blind_spots: String(raw.blind_spots || ""),
        strategic_advice: String(raw.strategic_advice || ""),
      };
      if (contentDb) {
        var quotes = pickQuotes(getUsedKeys(sectionKey));
        if (Object.keys(quotes).length > 0) section.star_palace_quotes = quotes;
      } else if (raw.star_palace_quotes && typeof raw.star_palace_quotes === "object") {
        section.star_palace_quotes = raw.star_palace_quotes;
      }
      sections[sectionKey] = section;
    });
    var weight_analysis = (lifeBookJson.weight_analysis && typeof lifeBookJson.weight_analysis === "object") ? lifeBookJson.weight_analysis : null;
    var metaFromJson = (lifeBookJson.meta && typeof lifeBookJson.meta === "object") ? lifeBookJson.meta : {};
    var metaOut = {
      schema_version: meta.schema_version || LIFEBOOK_SCHEMA_VERSION,
      generator_version: meta.generator_version || LIFEBOOK_GENERATOR_VERSION,
      created_at: meta.created_at || new Date().toISOString(),
      id: meta.id,
      chart_id: meta.chart_id,
      locale: meta.locale || metaFromJson.locale,
      client_name: meta.client_name != null ? meta.client_name : metaFromJson.client_name,
      birth_info: meta.birth_info != null ? meta.birth_info : metaFromJson.birth_info,
    };
    var doc = {
      meta: metaOut,
      chart_json: chartJson && typeof chartJson === "object" ? chartJson : null,
      weight_analysis: weight_analysis,
      sections: sections,
    };
    if (lifeBookJson.expert != null) doc.expert = lifeBookJson.expert;
    return doc;
  }

  /**
   * 由 LifeBookDocument 產出 HTML（與 src/lifebook-viewer/utils/html-renderer.ts 結構一致）
   * 後台一鍵輸出與前台匯出共用「命書資料 = LifeBookDocument，HTML 僅為呈現形式」。
   * @param {Object} doc - { meta, sections, weight_analysis, chart_json }
   */
  function renderLifeBookDocumentToHtml(doc) {
    if (!doc || typeof doc !== "object") return "";
    const w = doc.weight_analysis || {};
    const sections = doc.sections || {};
    const birthInfo = (doc.chart_json && doc.chart_json.birthInfo) || {};
    const year = birthInfo.year || "";
    const month = birthInfo.month || "";
    const day = birthInfo.day || "";

    function esc(s) {
      if (typeof s !== "string") return "";
      var div = document.createElement("div");
      div.textContent = s;
      return div.innerHTML;
    }

    var html = "<!DOCTYPE html>\n<html lang=\"zh-TW\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>人生說明書 · 個人命書</title>\n  <style>\n    body { font-family: 'Noto Sans TC', system-ui, sans-serif; line-height: 1.7; color: #1e293b; max-width: 700px; margin: 0 auto; padding: 2rem; }\n    h1 { font-size: 1.5rem; color: #0f172a; margin-bottom: 0.5rem; }\n    h2 { font-size: 1.15rem; color: #334155; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }\n    p { margin: 0.75rem 0; }\n    .cover { text-align: center; padding: 4rem 0; }\n    .meta { color: #64748b; font-size: 0.9rem; }\n    .module-title { font-size: 1rem; color: #475569; margin-top: 2.5rem; margin-bottom: 0.75rem; }\n  </style>\n</head>\n<body>\n  <div class=\"cover\">\n    <h1>人生說明書</h1>\n    <p class=\"meta\">個人命書 · " + year + "年" + month + "月" + day + "日</p>\n  </div>\n\n  <h2>權重摘要</h2>\n  <p><strong>優先關注宮位：</strong>" + ((w.top_focus_palaces || []).join("、") || "—") + "</p>\n  <p><strong>風險宮位：</strong>" + ((w.risk_palaces || []).join("、") || "—") + "</p>\n  <p><strong>相對穩定宮位：</strong>" + ((w.stable_palaces || []).join("、") || "—") + "</p>\n";

    var moduleMap = {
      "開場": ["s00"],
      "模組一：核心作業系統": ["s03", "s02", "s10", "s01"],
      "人生十二課題": ["s05", "s06", "s07", "s08", "s04", "s09", "s11", "s12", "s13", "s14"],
      "模組二：時間主線與功課": ["s15", "s16", "s17", "s18", "s19", "s20", "s22", "s23"],
      "收束": ["s21"],
    };
    Object.keys(moduleMap).forEach(function (modTitle) {
      var keys = moduleMap[modTitle];
      html += "<div class=\"module-title\">" + esc(modTitle) + "</div>";
      keys.forEach(function (key) {
        var sec = sections[key];
        if (!sec) return;
        html += "  <h2>" + esc(sec.title || key) + "</h2>";
        if (sec.star_palace_quotes && typeof sec.star_palace_quotes === "object" && Object.keys(sec.star_palace_quotes).length > 0) {
          html += "  <p><strong>【星曜宮位評語（會直接顯示給當事人）】</strong></p>";
          Object.keys(sec.star_palace_quotes).forEach(function (k) {
            html += "  <p><strong>" + esc(k) + "</strong>：" + (sec.star_palace_quotes[k] || "").replace(/\n/g, "</p><p>") + "</p>";
          });
          html += "  <p><strong>【綜合分析】</strong></p>";
        }
        html += "  <p>" + (sec.structure_analysis || "").replace(/\n/g, "</p><p>") + "</p>";
        html += "  <p>" + (sec.behavior_pattern || "").replace(/\n/g, "</p><p>") + "</p>";
        html += "  <p>" + (sec.blind_spots || "").replace(/\n/g, "</p><p>") + "</p>";
        html += "  <p>" + (sec.strategic_advice || "").replace(/\n/g, "</p><p>") + "</p>";
      });
    });

    html += "\n  <h2>總結</h2>\n  <p>以上內容依命盤結構化數據生成，供諮詢參考使用。</p>\n</body>\n</html>";
    return html;
  }

  /**
   * 生成單章 prompt 上下文（供外部 API 使用）
   */
  function buildSectionContext(sectionKey, chartJson, weightAnalysisData) {
    const cfg = SECTION_CONFIG[sectionKey];
    const importance = weightAnalysisData?.importance_map?.[sectionKey] || "medium";
    const wordRange = getWordRange(importance);
    return {
      section_key: sectionKey,
      title: cfg?.title || sectionKey,
      importance_level: importance,
      word_range: wordRange,
      palace: cfg?.palace,
      chart_summary: {
        top_palaces: weightAnalysisData?.top_focus_palaces || [],
        risk_palaces: weightAnalysisData?.risk_palaces || [],
        ziwei: chartJson?.ziwei ? "有" : "無",
        overlap: chartJson?.overlapAnalysis || chartJson?.overlap ? "有" : "無",
        fourTransformations: chartJson?.fourTransformations ? "有" : "無",
        fiveElements: chartJson?.fiveElements || chartJson?.wuxingData ? "有" : "無",
      },
      output_schema: {
        section_key: "string",
        title: "string",
        importance_level: "high|medium|low",
        structure_analysis: "string",
        behavior_pattern: "string",
        blind_spots: "string",
        strategic_advice: "string",
      },
    };
  }

  /** 章節主題說明（供 SECTION_DESCRIPTION 替換） */
  const SECTION_DESCRIPTIONS = {
    s01: "命主・身主・身宮・福德：顯意識與潛意識的交織、表面的行為模式與潛意識推動。",
    s02: "命宮綜合分析：人生的主軸力量與格局高度、思維/行為/命運的慣性。",
    s03: "五行氣勢與生剋：能量循環與最大瓶頸、相生相剋、陰陽比例、補與收的建議。",
    s04: "父母宮綜合分析：原生家庭的印記、權威議題與公家系統緣。",
    s05: "兄弟宮綜合分析：人際塑形與私庫位（財庫）、手足戰友關係。",
    s06: "交友宮綜合分析：眾生緣／資源／團隊／部屬、社交磁場。",
    s07: "官祿宮綜合分析：職涯軌道與競爭力、適合行業與階位。",
    s08: "財帛宮綜合分析：賺錢模式與財務行為、正財偏財結構。",
    s09: "田宅宮綜合分析：資產、購屋、土地緣、穩定與流動。",
    s10: "福德宮綜合分析：精神世界與深層享受感、靈魂休息與晚年質地。",
    s11: "疾厄宮綜合分析 + 五行：健康體質與風險點、中晚年注意事項。",
    s12: "遷移宮綜合分析：外界磁場與異地運、社交面具。",
    s13: "夫妻宮綜合分析：婚姻結構與關係模式、配偶特質與離合訊號。",
    s14: "子女宮綜合分析：下一代緣分／創造力／投資與合夥緣。",
    s15: "十年大限：每十年的人生課題與轉折點、壓力與機會。",
    s16: "流年：小限疊宮飛星（2026）、今年主軸與最強月份。",
    s17: "靈魂使命：此生為什麼而來、根本課題與要補什麼。",
    s18: "業力議題：化忌、空、煞的深層提醒、容易重複的痛。",
    s19: "行動建議（整合版）：三條馬上做、三條長期累積、三條避凶。",
    s20: "總結：身份定盤、外部劇本、內心濾鏡、戰略指令。",
  };

  /**
   * 系統 Prompt（固定不變，作為 system 角色內容）
   */
  const SYSTEM_PROMPT = `你是一位資深命理諮詢顧問，同時具備心理洞察與戰略思維。

你的任務是根據使用者提供的命盤數據，撰寫一章「人生戰略命書」。

請遵守以下規則：

【語氣規範】
稱呼當事人使用「你」；若有提供當事人姓名，可適度以姓名稱呼。
多用直述句、肯定句，具體說明「是什麼」「會如何」，詳細解釋。
省略「你的命盤中」「在你的命盤裡」等說法，直接陳述分析內容。
口吻溫和、深度、引導式；可使用提問句，但不得審判。
禁止宿命論語氣、恐嚇式表述、絕對語氣（如「必定」「註定」）。強調節奏與選擇，而非命定。

【結構規範】
每一章必須包含四個段落欄位：
structure_analysis：綜合分析（本宮+對宮+夾宮／星曜／五行），直述句、肯定句，詳細解釋；須考慮對宮與夾宮影響，結合五行強弱校正星曜亮度
behavior_pattern：說明心理與行為模式，解釋為何會如此
blind_spots：說明潛在盲點與衝突，分析化忌或失衡處
strategic_advice：給出具體可行方向，不得抽象，必須可實踐

【輸出格式】
必須只輸出 JSON。
禁止額外說明文字。
格式必須為：
{
  "section_key": "",
  "title": "",
  "importance_level": "high | medium | low",
  "structure_analysis": "",
  "behavior_pattern": "",
  "blind_spots": "",
  "strategic_advice": ""
}
不得新增欄位。
不得省略欄位。`;

  /**
   * 建單章 User Prompt（供 generateSection 呼叫 API 時使用）
   * 替換：SECTION_KEY, IMPORTANCE_LEVEL, SECTION_DESCRIPTION, CHART_JSON, WEIGHT_ANALYSIS_JSON
   */
  function buildSectionUserPrompt(sectionKey, chartJson, weightAnalysisData) {
    const cfg = SECTION_CONFIG[sectionKey];
    const importance = weightAnalysisData?.importance_map?.[sectionKey] || "medium";
    const wordRange = getWordRange(importance);
    const description = SECTION_DESCRIPTIONS[sectionKey] || cfg?.title || sectionKey;

    const chartForPrompt = JSON.stringify({
      ziwei: chartJson?.ziwei,
      bazi: chartJson?.bazi,
      overlapAnalysis: chartJson?.overlapAnalysis || chartJson?.overlap,
      fourTransformations: chartJson?.fourTransformations,
      fiveElements: chartJson?.fiveElements || chartJson?.wuxingData,
    }, null, 2);

    const weightForPrompt = JSON.stringify({
      importance_map: weightAnalysisData?.importance_map,
      top_focus_palaces: weightAnalysisData?.top_focus_palaces,
      risk_palaces: weightAnalysisData?.risk_palaces,
      stable_palaces: weightAnalysisData?.stable_palaces,
    }, null, 2);

    return `請生成章節：${sectionKey}

本章重要度為：${importance}

篇幅要求：
high：1200–1600字
medium：800–1200字
low：500–800字

請依照重要度調整篇幅。

本章主題說明：
${description}

命盤數據如下：
${chartForPrompt}

權重摘要如下：
${weightForPrompt}

分析規則：
必須做綜合分析（本宮+對宮+夾宮），不寫「三方四正」一詞，改以綜合分析表述
必須考慮對宮與夾宮影響
必須結合五行強弱、生年四化
若有疊宮或引爆區，必須說明其心理與行為影響
若本章非核心章節，請保持精簡但完整
語氣：稱呼用「你」或當事人姓名；多用直述句、肯定句；省略「你的命盤中」；詳細解釋

請開始生成。
只輸出 JSON。`;
  }

  /**
   * 權重分析 User Prompt（在生成 20 章前，可選用 AI 計算權重）
   * 若使用本地 weightAnalysis() 則不需呼叫此 prompt
   */
  function buildWeightAnalysisUserPrompt(chartJson) {
    const chartForPrompt = JSON.stringify({
      ziwei: chartJson?.ziwei,
      bazi: chartJson?.bazi,
      overlapAnalysis: chartJson?.overlapAnalysis || chartJson?.overlap,
      fourTransformations: chartJson?.fourTransformations,
      fiveElements: chartJson?.fiveElements || chartJson?.wuxingData,
    }, null, 2);

    return `請根據以下命盤數據，計算各宮位的重要度。

命盤資料：
${chartForPrompt}

請依照以下規則：

宮位分數 =
(化忌數 × 3) +
(化祿數 × 2) +
(化權數 × 1.5) +
(化科數 × 1) +
(疊宮係數 × 2) +
(五行失衡係數 × 2)

排序後：
前3名 → high
中段 → medium
最低3名 → low

輸出格式：
{
  "importance_map": {
    "s01": "",
    "s02": "",
    "s03": "",
    "s04": "",
    "s05": "",
    "s06": "",
    "s07": "",
    "s08": "",
    "s09": "",
    "s10": "",
    "s11": "",
    "s12": "",
    "s13": "",
    "s14": "",
    "s15": "",
    "s16": "",
    "s17": "",
    "s18": "",
    "s19": "",
    "s20": "",
    "s22": "",
    "s23": "",
    "s21": ""
  },
  "top_focus_palaces": [],
  "risk_palaces": [],
  "stable_palaces": []
}

只輸出 JSON。`;
  }

  if (!window.LifeBookEngine) {
    window.LifeBookEngine = {};
  }
  window.LifeBookEngine = {
    LIFEBOOK_SCHEMA_VERSION,
    LIFEBOOK_GENERATOR_VERSION,
    SECTION_ORDER,
    SECTION_CONFIG,
    SECTION_DESCRIPTIONS,
    weightAnalysis,
    buildLifeBookDocument,
    renderHTML,
    renderLifeBookDocumentToHtml,
    buildSectionContext,
    buildSectionUserPrompt,
    buildWeightAnalysisUserPrompt,
    SYSTEM_PROMPT,
  };
})();
