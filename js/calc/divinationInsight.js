/**
 * divinationInsight.js
 * 64 卦情境化解釋引擎：事業/財運/感情 自動生成
 * generateInsight 串接 [卦象關鍵字] + [流年加權] + [位應狀態] + [空間指南]
 */
(function (global) {
  "use strict";

  const CONTEXT_LABEL = { career: "事業", wealth: "財運", love: "感情", neutral: "" };

  /**
   * 爻性標籤：當位/正應 vs 不當位/不應
   * @param {boolean} isCorrect - 當位（陽居陽位、陰居陰位）
   * @param {boolean} isResonance - 正應（初四、二五、三六陰陽配對）
   * @returns {string[]} 形容詞陣列：當位/正應→穩定、得助、正面、順利；反之→磨合、孤軍、壓力、需守
   */
  function getLineQuality(isCorrect, isResonance) {
    const positive = ["穩定", "得助", "正面", "順利"];
    const negative = ["磨合", "孤軍", "壓力", "需守"];
    const count = (isCorrect ? 1 : 0) + (isResonance ? 1 : 0);
    if (count >= 1) return positive;
    return negative;
  }

  /** 情境矩陣：卦名 -> context -> 轉譯關鍵字（大壯->事業:職權鼎盛） */
  const CONTEXT_MATRIX = {
    乾: { career: "剛健領導", wealth: "資源豐沛", love: "主導關係" },
    坤: { career: "柔順承載", wealth: "穩健累積", love: "包容接納" },
    屯: { career: "萌芽待時", wealth: "蓄勢待發", love: "初識謹慎" },
    蒙: { career: "虛心受教", wealth: "學習理財", love: "彼此了解" },
    需: { career: "守候時機", wealth: "等待進場", love: "耐心經營" },
    訟: { career: "以和為貴", wealth: "避開爭端", love: "溝通化解" },
    師: { career: "師出以律", wealth: "紀律理財", love: "有原則的愛" },
    比: { career: "比輔得吉", wealth: "合作生財", love: "親密連結" },
    小畜: { career: "密雲不雨", wealth: "小額累積", love: "醞釀感情" },
    履: { career: "慎行得亨", wealth: "步步為營", love: "謹慎交往" },
    泰: { career: "天地和諧", wealth: "小往大來", love: "關係順遂" },
    否: { career: "閉塞待時", wealth: "守財為上", love: "溝通為先" },
    同人: { career: "同人于野", wealth: "合伙得利", love: "志同道合" },
    大有: { career: "大有豐收", wealth: "收益可期", love: "豐盈滿足" },
    謙: { career: "謙遜則吉", wealth: "穩健理財", love: "以退為進" },
    豫: { career: "豫樂有備", wealth: "預備充足", love: "愉悅相處" },
    隨: { career: "隨順得吉", wealth: "順勢投資", love: "跟隨心意" },
    蠱: { career: "幹蠱有終", wealth: "整頓財務", love: "修復關係" },
    臨: { career: "咸臨進取", wealth: "積極理財", love: "主動表達" },
    觀: { career: "觀而後動", wealth: "觀察再進", love: "審慎選擇" },
    噬嗑: { career: "噬嗑除礙", wealth: "清除障礙", love: "化解衝突" },
    賁: { career: "賁飾有度", wealth: "適度包裝", love: "外在得體" },
    剝: { career: "剝落宜守", wealth: "守住根本", love: "修補裂痕" },
    復: { career: "七日來復", wealth: "循環再起", love: "重新開始" },
    无妄: { career: "無妄則吉", wealth: "不貪不躁", love: "真誠以對" },
    無妄: { career: "無妄則吉", wealth: "不貪不躁", love: "真誠以對" },
    大畜: { career: "大畜待發", wealth: "大額蓄積", love: "厚積薄發" },
    頤: { career: "觀頤自養", wealth: "養財有道", love: "滋養彼此" },
    大過: { career: "棟橈慎行", wealth: "過度風險", love: "壓力考驗" },
    坎: { career: "習坎有孚", wealth: "險中求存", love: "考驗信任" },
    離: { career: "離明畜牝", wealth: "依附得利", love: "光明相待" },
    咸: { career: "咸感相應", wealth: "感應時機", love: "心心相印" },
    恆: { career: "恆久有終", wealth: "長期持有", love: "持之以恆" },
    遯: { career: "遯退得亨", wealth: "見好就收", love: "留有空間" },
    大壯: { career: "職權鼎盛", wealth: "槓桿強勁", love: "熱情高昂" },
    晉: { career: "晉升有得", wealth: "收益可期", love: "關係升溫" },
    明夷: { career: "明夷艱貞", wealth: "韜光養晦", love: "低調相處" },
    家人: { career: "家人和樂", wealth: "家業興旺", love: "家庭和睦" },
    睽: { career: "睽而求同", wealth: "異中求利", love: "求同存異" },
    蹇: { career: "蹇難待援", wealth: "守待轉機", love: "共度難關" },
    解: { career: "解危夙吉", wealth: "解套獲利", love: "化解心結" },
    損: { career: "損而有孚", wealth: "捨得捨得", love: "為愛付出" },
    益: { career: "益而利往", wealth: "增益獲利", love: "相互滋養" },
    夬: { career: "決斷是非", wealth: "果斷止損", love: "斬斷牽掛" },
    姤: { career: "姤遇防陰", wealth: "邂逅機會", love: "相遇相知" },
    萃: { career: "萃聚得亨", wealth: "匯聚資源", love: "群聚歡樂" },
    升: { career: "升階有終", wealth: "階梯成長", love: "步步高升" },
    困: { career: "困而亨貞", wealth: "困中守正", love: "共患難" },
    井: { career: "井養不窮", wealth: "源源不絕", love: "持續付出" },
    革: { career: "革故鼎新", wealth: "轉型獲利", love: "破舊立新" },
    鼎: { career: "鼎立元吉", wealth: "穩固獲利", love: "安定關係" },
    震: { career: "震懼得亨", wealth: "震盪佈局", love: "激情警覺" },
    艮: { career: "艮止無咎", wealth: "止損為上", love: "適可而止" },
    漸: { career: "漸進有終", wealth: "緩步累積", love: "循序發展" },
    歸妹: { career: "歸妹征凶", wealth: "名分不正", love: "不當契合" },
    豐: { career: "豐大宜中", wealth: "豐收節制", love: "滿而不溢" },
    旅: { career: "旅貞小亨", wealth: "旅外小利", love: "漂泊慎守" },
    巽: { career: "巽入利往", wealth: "順勢進出", love: "柔順相待" },
    兌: { career: "兌悅亨貞", wealth: "和悅得利", love: "愉悅交流" },
    渙: { career: "渙散復聚", wealth: "分散再聚", love: "散後重圓" },
    節: { career: "節制有度", wealth: "節流開源", love: "適度相處" },
    中孚: { career: "合夥得吉", wealth: "誠信生財", love: "誠意相待" },
    小過: { career: "小過宜下", wealth: "小利可圖", love: "小事順遂" },
    既濟: { career: "守成轉型", wealth: "獲利配置", love: "感情穩定" },
    未濟: { career: "未竟之功", wealth: "見好就收", love: "耐心經營" },
  };

  /** 爻位情境關鍵字：位置(0-5) -> context -> 階段描述 */
  const LINE_POSITION_KEYWORDS = {
    career: ["基層起步期", "中階磨練期", "轉型關鍵期", "高層決策期", "頂峰守成期", "功成身退期"],
    wealth: ["初階累積", "穩健佈局", "擴張關鍵", "收成階段", "配置優化", "傳承規劃"],
    love: ["初識試探", "深入了解", "關係轉折", "承諾階段", "穩定經營", "圓滿或轉型"],
    neutral: ["初始階段", "發展階段", "轉折階段", "考驗階段", "頂峰階段", "收官階段"],
  };

  /** 2026 丙午火年：卦宮五行 vs 流年 → 加權描述 */
  const FLOW_YEAR_2026 = {
    金: "火剋金，壓力與磨練並存，宜守不宜攻。",
    木: "木生火，才華雖能發揮但消耗較大，需注意收支平衡。",
    水: "水克火，雖能制衡但競爭激烈，辛苦經營可得。",
    火: "同氣比和，能量旺盛，利於擴張與名聲，但需防火氣過旺。",
    土: "火生土，受生得助，資源穩定，貴人提攜。",
  };

  /** 2026 空間指南：context -> 方位 + 建議 */
  const SPACE_GUIDE_2026 = {
    career: { dir: "西北方", label: "文昌位", desc: "四綠文曲星飛臨，適合在西北方放置綠色植物、書籍，有助考運、合約、創意工作。" },
    wealth: { dir: "正北方", label: "財位", desc: "一白貪狼星飛臨，若臥室或辦公桌在正北，可強化財氣；可擺放流水或金屬飾品。" },
    love: { dir: "西南方", label: "桃花位", desc: "九紫右弼星主姻緣，西南方宜保持整潔、可點綴紅色或粉色，營造溫暖氛圍。" },
  };

  function getContextKeyword(hexagramName, context) {
    if (context === "neutral") return null;
    const m = CONTEXT_MATRIX[hexagramName] || CONTEXT_MATRIX[hexagramName?.replace(/卦$/, "")];
    if (!m) return null;
    return m[context] || null;
  }

  /**
   * 產生完整情境化解釋
   * @param {Object} opts
   * @param {number} opts.primaryIndex - 本卦序
   * @param {string} opts.primaryName - 本卦名
   * @param {string} opts.wuxing - 卦宮五行
   * @param {string} opts.context - career | wealth | love
   * @param {number[]} opts.changingLines - 動爻索引
   * @param {Array} opts.line384Data - 該卦 6 爻的 { yang, correct, resonance, text, hint }
   * @param {Object} opts.summary - { summary, character }
   * @returns {{ globalInsight: string, lineInsights: Array<{ lineName: string, insight: string }>, spaceGuide: string, lineQualities: Object }}
   */
  function generateInsight(opts) {
    const { primaryIndex, primaryName, wuxing, context, changingLines = [], line384Data = [], summary = {} } = opts;
    const name = (primaryName || "").replace(/卦$/, "");
    const ctxLabel = context === "neutral" ? "" : (CONTEXT_LABEL[context] || "事業");

    // 1. 大局解析 Global Insight（neutral 時不套用情境轉譯，用卦辭 character）
    const keyword = getContextKeyword(name, context) || summary.character || name;
    const flowYearText = FLOW_YEAR_2026[wuxing] || "";
    const prefix = ctxLabel ? "【" + ctxLabel + "】" : "";
    const globalInsight = `${prefix}${name}卦代表你問事當下的整體格局${ctxLabel ? "，轉譯為「" + keyword + "」" : "，大局指向「" + keyword + "」"}。${summary.summary ? "卦辭：" + summary.summary : ""}${flowYearText ? " 2026 丙午年火旺，" + flowYearText : ""}`;

    // 2. 動爻深度解析 Line Insight：[情境關鍵字] + [位應狀態] + [爻辭含義]
    const names = ["初", "二", "三", "四", "五", "上"];
    const lineInsights = [];
    changingLines.forEach((idx) => {
      const ld = line384Data[idx];
      const posKw = LINE_POSITION_KEYWORDS[context]?.[idx] || "此階段";
      const isCorrect = ld && ld.correct > 0;
      const isResonance = ld && ld.resonance > 0;
      const qualities = getLineQuality(isCorrect, isResonance);
      const qualityStr = qualities.join("、");
      const lineText = ld?.text || "";
      const hintParts = (ld?.hint || "").split("：");
      const hintPart = hintParts.length > 1 ? hintParts.slice(1).join("：").trim() : (hintParts[0] || "").trim();
      const isPositive = qualities[0] === "穩定" || qualities[0] === "得助";
      const meaning = hintPart || lineText;
      const insight = isPositive
        ? `${posKw}，位應${qualityStr}。爻辭「${lineText}」。轉譯：${meaning}`
        : `${posKw}，位應${qualityStr}。爻辭「${lineText}」。轉譯：${meaning} 宜守不宜進，避免衝動擴張。`;
      lineInsights.push({ lineName: names[idx] + "爻", insight });
    });

    // 3. 空間指南（neutral 時不顯示情境專屬方位）
    const space = context !== "neutral" ? SPACE_GUIDE_2026[context] : null;
    const spaceGuide = space ? `${space.label}（${space.dir}）：${space.desc}` : "";

    return { globalInsight, lineInsights, spaceGuide };
  }

  const api = {
    getLineQuality,
    generateInsight,
    CONTEXT_MATRIX,
    LINE_POSITION_KEYWORDS,
    FLOW_YEAR_2026,
    SPACE_GUIDE_2026,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.DivinationInsight = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
