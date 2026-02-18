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

  /** 嚴格章節順序（禁止變更） */
  const SECTION_ORDER = [
    "s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09", "s10",
    "s11", "s12", "s13", "s14", "s15", "s16", "s17", "s18", "s19", "s20",
  ];

  /** 章節標題與宮位映射 */
  const SECTION_CONFIG = {
    s01: { title: "[1/20] 命主、身主、身宮、福德：顯意識與潛意識…", palace: "命宮" },
    s02: { title: "[2/20] 命宮三方四正：性格基調、格局高度…", palace: "命宮" },
    s03: { title: "[3/20] 五行氣勢、能量、生剋＋生年四化…", palace: null },
    s04: { title: "[4/20] 父母宮三方四正…", palace: "父母" },
    s05: { title: "[5/20] 兄弟宮三方四正…", palace: "兄弟" },
    s06: { title: "[6/20] 交友宮三方四正…", palace: "僕役" },
    s07: { title: "[7/20] 官祿宮三方四正…", palace: "官祿" },
    s08: { title: "[8/20] 財帛宮三方四正…", palace: "財帛" },
    s09: { title: "[9/20] 田宅宮三方四正…", palace: "田宅" },
    s10: { title: "[10/20] 福德宮三方四正…", palace: "福德" },
    s11: { title: "[11/20] 疾厄宮三方四正…", palace: "疾厄" },
    s12: { title: "[12/20] 遷移宮三方四正…", palace: "遷移" },
    s13: { title: "[13/20] 夫妻宮三方四正…", palace: "夫妻" },
    s14: { title: "[14/20] 子女宮三方四正…", palace: "子女" },
    s15: { title: "[15/20] 十年大限分析", palace: null },
    s16: { title: "[16/20] 2026 流年：小限疊宮飛星…", palace: null },
    s17: { title: "[17/20] 靈魂使命：此生為何而來…", palace: null },
    s18: { title: "[18/20] 人生主線任務：把使命落到行動", palace: null },
    s19: { title: "[19/20] 業力與未完成課題：化忌與業力宮位…", palace: null },
    s20: { title: "[20/20] 總和分析：全盤優化建議與避凶指引", palace: null },
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
      } else if (["s15", "s16", "s17", "s19", "s20"].includes(key)) {
        importance_map[key] = "high";
      } else if (key === "s03" || key === "s18") {
        importance_map[key] = "medium";
      } else {
        importance_map[key] = "medium";
      }
    });

    return {
      top_focus_palaces: top3,
      risk_palaces: criticalRisks.map((r) => r.palace),
      stable_palaces: bottom3,
      importance_map,
      palace_scores: scores,
      sorted_palaces: sorted,
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
      "模組一：核心作業系統": ["s01", "s02", "s03", "s10", "s19"],
      "模組二：生存與成就結構": ["s07", "s08", "s09", "s05", "s15"],
      "模組三：人際與環境場": ["s04", "s06", "s12", "s17"],
      "模組四：情感與依附課題": ["s13", "s14", "s11"],
      "模組五：時間與節奏": ["s16", "s18", "s20"],
    };

    Object.entries(moduleMap).forEach(([modTitle, keys]) => {
      html += `<div class="module-title">${modTitle}</div>`;
      keys.forEach((key) => {
        const sec = sections[key];
        if (!sec) return;
        html += `  <h2>${sec.title || key}</h2>`;
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
    s01: "命主／身主／身宮：核心作業系統、顯意識與潛意識的定位。",
    s02: "命宮三方四正：性格基調、格局高度、人生主軸。",
    s03: "五行氣勢與四化：能量流動、生剋關係、生年四化對命盤的影響。",
    s04: "父母宮三方四正：與權威、規則、長輩的互動模式。",
    s05: "兄弟宮三方四正：手足、同儕、近親資源。",
    s06: "交友宮（僕役宮）三方四正：社交網絡、人際緣分、眾生相。",
    s07: "官祿宮三方四正：事業軌道、執行強度、成就結構。",
    s08: "財帛宮三方四正：金錢獲取、理財邏輯、資源流動。",
    s09: "田宅宮三方四正：資產根基、穩定堡壘、歸屬感。",
    s10: "福德宮三方四正：精神底蘊、內心平衡、價值觀。",
    s11: "疾厄宮三方四正：生理硬體、身心基石、健康議題。",
    s12: "遷移宮三方四正：外部接口、外界觀感、移動與發展。",
    s13: "夫妻宮三方四正：親密連結、合夥狀態、情感課題。",
    s14: "子女宮三方四正：產出效能、創造力、傳承。",
    s15: "十年大限分析：當前十年運限主題、宮位、四化影響。",
    s16: "2026 流年：小限疊宮飛星、年度節奏、關鍵宮位。",
    s17: "靈魂使命：此生為何而來、核心任務與方向。",
    s18: "人生主線任務：把使命落到行動、具體節奏與選擇。",
    s19: "業力與未完成課題：化忌與業力宮位、需面對的課題。",
    s20: "總結導航：全盤優化建議與避凶指引、下一步行動。",
  };

  /**
   * 系統 Prompt（固定不變，作為 system 角色內容）
   */
  const SYSTEM_PROMPT = `你是一位資深命理諮詢顧問，同時具備心理洞察與戰略思維。

你的任務是根據使用者提供的命盤數據，撰寫一章「人生戰略命書」。

請遵守以下規則：

【語氣規範】
使用第二人稱（你）
口吻溫和、深度、引導式
可使用提問句，但不得審判
禁止宿命論語氣
禁止恐嚇式表述
不得使用絕對語氣（例如「必定」、「註定」）
強調節奏與選擇，而非命定

【結構規範】
每一章必須包含四個段落欄位：
structure_analysis：解釋命盤結構事實，必須包含三方四正分析，必須考慮對宮衝擊，必須考慮夾宮影響，必須結合五行強弱校正星曜亮度
behavior_pattern：說明心理與行為模式，解釋你為何會如此
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
必須分析三方四正
必須考慮對宮與夾宮
必須結合五行強弱
必須結合生年四化
若有疊宮或引爆區，必須說明其心理與行為影響
若本章非核心章節，請保持精簡但完整

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
    "s20": ""
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
    SECTION_ORDER,
    SECTION_CONFIG,
    SECTION_DESCRIPTIONS,
    weightAnalysis,
    validateSectionJson,
    parseSectionOutput,
    getWordRange,
    renderHTML,
    buildSectionContext,
    buildSectionUserPrompt,
    buildWeightAnalysisUserPrompt,
    SYSTEM_PROMPT,
  };
})();
