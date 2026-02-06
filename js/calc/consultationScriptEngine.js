/* calc/consultationScriptEngine.js
 * 15宮位戰略導引腳本引擎
 * 針對15個維度生成導引話術，每個維度讀取對應的命盤數據（星曜、四化、疊宮）
 * 依賴: calc/constants.js, calc/helpers.js, calc/fourTransformations.js
 */

(function () {
  "use strict";

  // 檢查依賴
  if (typeof window === "undefined" || !window.CalcConstants) {
    throw new Error("calc/consultationScriptEngine.js requires calc/constants.js to be loaded first");
  }
  if (typeof window === "undefined" || !window.CalcHelpers) {
    throw new Error("calc/consultationScriptEngine.js requires calc/helpers.js to be loaded first");
  }

  const { PALACE_DEFAULT } = window.CalcConstants;

  // ====== 星曜分類系統 ======
  const STAR_CATEGORIES = {
    MAIN_STARS: [
      "紫微", "天機", "太陽", "武曲", "天同", "廉貞", 
      "天府", "太陰", "貪狼", "巨門", "天相", "天梁", 
      "七殺", "破軍"
    ],
    
    MALEFIC_STARS: {
      "火星": { trait: "爆發力", feeling: "急躁、衝動、憤怒的積累" },
      "擎羊": { trait: "攻擊性", feeling: "防衛機制、尖銳的保護殼" },
      "陀羅": { trait: "糾結", feeling: "拖延、無法釋放的壓力" },
      "地空": { trait: "虛無感", feeling: "不安全感、對現實的逃避" },
      "地劫": { trait: "失去感", feeling: "破滅感、對擁有的恐懼" },
      "鈴星": { trait: "焦慮", feeling: "不安、持續的緊張感" },
      "天刑": { trait: "自我懲罰", feeling: "內疚感、道德枷鎖" }
    },
    
    ASSISTANT_STARS: {
      "左輔": { trait: "外在貴人", feeling: "社會資源、對他人的依賴" },
      "右弼": { trait: "內在支持", feeling: "自我調節、對完美的追求" },
      "文昌": { trait: "外在學識", feeling: "文憑、社會認可的追求" },
      "文曲": { trait: "內在才華", feeling: "藝術天賦、對美的渴望" },
      "天魁": { trait: "外在貴人", feeling: "機會、對權威的依賴" },
      "天鉞": { trait: "內在貴人", feeling: "直覺、對靈性的追求" },
      "祿存": { trait: "穩定資源", feeling: "安全感、對物質的依賴" },
      "天馬": { trait: "變動", feeling: "遷移、對自由的渴望" }
    },
    
    MINOR_STARS: {
      "天虛": { trait: "空虛感", feeling: "不真實感、對存在的質疑" },
      "破碎": { trait: "破碎感", feeling: "不完整、對完美的執著" },
      "旬空": { trait: "虛無感", feeling: "不確定感、對未來的恐懼" },
      "截空": { trait: "失落", feeling: "中斷感、對連續性的渴望" },
      "孤辰": { trait: "孤獨感", feeling: "疏離感、對連結的渴望" },
      "寡宿": { trait: "寂寞感", feeling: "被遺棄感、對歸屬的渴望" },
      "天哭": { trait: "悲傷", feeling: "失落感、對過去的執著" },
      "天姚": { trait: "浪漫", feeling: "對愛的渴望、對完美的幻想" }
    }
  };

  // 對宮映射表
  const OPPOSITE_PALACE_MAP = {
    "命宮": "遷移",
    "遷移": "命宮",
    "兄弟": "僕役",
    "僕役": "兄弟",
    "夫妻": "官祿",
    "官祿": "夫妻",
    "子女": "田宅",
    "田宅": "子女",
    "財帛": "福德",
    "福德": "財帛",
    "疾厄": "父母",
    "父母": "疾厄"
  };

  /**
   * 獲取對宮名稱
   */
  function getOppositePalace(palaceName) {
    return OPPOSITE_PALACE_MAP[palaceName] || null;
  }

  /**
   * 獲取宮位的主星描述
   * 改進：正確處理空宮情況，避免返回空數組導致顯示"主星"占位符
   */
  function getPalaceMainStars(ziwei, palaceName) {
    if (!ziwei || !ziwei.mainStars) return [];
    
    const getStarsForPalaceHelper = window.CalcHelpers?.getStarsForPalace;
    const toTraditionalStarNameHelper = window.CalcHelpers?.toTraditionalStarName;
    
    if (!getStarsForPalaceHelper) return [];

    const stars = getStarsForPalaceHelper(ziwei, palaceName);
    if (!stars || stars.length === 0) {
      // 空宮：返回空數組，調用方應處理為"空宮"而非"主星"
      return [];
    }
    
    const mainStars = [];
    
    // 使用 STAR_CATEGORIES.MAIN_STARS（已在文件開頭定義）
    
    stars.forEach(star => {
      let starName;
      if (typeof star === 'string') {
        starName = toTraditionalStarNameHelper ? toTraditionalStarNameHelper(star) : star;
      } else if (star && typeof star === 'object') {
        const name = star.name || star.id || star;
        starName = toTraditionalStarNameHelper ? toTraditionalStarNameHelper(name) : name;
      } else {
        starName = String(star);
      }
      
      // 標準化星名後再比對
      const normalizedName = starName.trim();
      if (STAR_CATEGORIES.MAIN_STARS.includes(normalizedName)) {
        mainStars.push(normalizedName);
      }
    });

    return mainStars;
  }

  /**
   * 獲取宮位的特質描述
   */
  /**
   * 獲取宮位特質描述
   * 改進：空宮時返回"空宮"而非"獨特"
   */
  function getPalaceTrait(mainStars) {
    if (!mainStars || mainStars.length === 0) return '空宮';
    
    const TRAIT_MAP = {
      "紫微": "領導統御",
      "天機": "機智靈活",
      "太陽": "光明熱情",
      "武曲": "剛毅果決",
      "天同": "溫和包容",
      "廉貞": "複雜多變",
      "天府": "穩重務實",
      "太陰": "溫柔細膩",
      "貪狼": "多才多藝",
      "巨門": "深思熟慮",
      "天相": "協調平衡",
      "天梁": "穩重可靠",
      "七殺": "果斷勇猛",
      "破軍": "開創變革"
    };

    return TRAIT_MAP[mainStars[0]] || '獨特';
  }

  /**
   * 獲取宮位的四化信息
   */
  function getPalaceTransformations(overlapAnalysis, palaceName) {
    if (!overlapAnalysis || !overlapAnalysis.palaceMap) return null;
    
    const palaceMap = overlapAnalysis.palaceMap;
    const palaceData = palaceMap instanceof Map 
      ? palaceMap.get(palaceName)
      : palaceMap[palaceName];
    
    return palaceData || null;
  }

  /**
   * 檢測宮位是否為空宮（無主星）
   */
  function isPalaceEmpty(ziwei, palaceName) {
    const mainStars = getPalaceMainStars(ziwei, palaceName);
    return mainStars.length === 0;
  }

  /**
   * 獲取宮位的所有星曜（包括主星、煞星、輔星、雜曜）
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱
   * @returns {Object} 分類後的星曜 { mainStars, maleficStars, assistantStars, minorStars }
   */
  function classifyPalaceStars(ziwei, palaceName) {
    const getStarsForPalaceHelper = window.CalcHelpers?.getStarsForPalace;
    const toTraditionalStarNameHelper = window.CalcHelpers?.toTraditionalStarName;
    
    if (!getStarsForPalaceHelper) {
      return { mainStars: [], maleficStars: [], assistantStars: [], minorStars: [] };
    }
    
    const stars = getStarsForPalaceHelper(ziwei, palaceName);
    const mainStars = [];
    const maleficStars = [];
    const assistantStars = [];
    const minorStars = [];
    
    stars.forEach(star => {
      let starName;
      if (typeof star === 'string') {
        starName = toTraditionalStarNameHelper ? toTraditionalStarNameHelper(star) : star;
      } else if (star && typeof star === 'object') {
        const name = star.name || star.id || star;
        starName = toTraditionalStarNameHelper ? toTraditionalStarNameHelper(name) : name;
      } else {
        starName = String(star);
      }
      
      const normalizedName = starName.trim();
      
      if (STAR_CATEGORIES.MAIN_STARS.includes(normalizedName)) {
        mainStars.push(normalizedName);
      } else if (STAR_CATEGORIES.MALEFIC_STARS[normalizedName]) {
        maleficStars.push(normalizedName);
      } else if (STAR_CATEGORIES.ASSISTANT_STARS[normalizedName]) {
        assistantStars.push(normalizedName);
      } else if (STAR_CATEGORIES.MINOR_STARS[normalizedName]) {
        minorStars.push(normalizedName);
      }
    });
    
    return { mainStars, maleficStars, assistantStars, minorStars };
  }

  /**
   * 生成宮位的三段式諮詢腳本（統一入口，處理空宮）
   * 改進：空宮時優先考慮本宮的輔星、雜曜、煞星，對宮主星影響較小
   * @param {Object} ziwei 紫微命盤資料
   * @param {string} palaceName 宮位名稱
   * @param {Object} overlapAnalysis 疊宮分析資料（可選）
   * @returns {Object} { hook50, reflection30, capture20, isEmpty, oppositePalace, stars }
   */
  function generatePalaceConsultationScript(ziwei, palaceName, overlapAnalysis) {
    const isEmpty = isPalaceEmpty(ziwei, palaceName);
    // 獲取本宮的所有星曜（包括煞星、輔星、雜曜）
    const localStars = classifyPalaceStars(ziwei, palaceName);
    let oppositePalace = null;
    let borrowedMainStar = null;
    
    // 如果是空宮，借對宮的主星（但影響較小，僅作參考）
    if (isEmpty) {
      oppositePalace = getOppositePalace(palaceName);
      if (oppositePalace) {
        const oppositeStars = classifyPalaceStars(ziwei, oppositePalace);
        // 只借用對宮的主星作為參考，不替換本宮的星曜分類
        borrowedMainStar = oppositeStars.mainStars.length > 0 ? oppositeStars.mainStars[0] : null;
      }
    }
    
    // 空宮時，重點關注本宮的煞星、輔星、雜曜
    const { mainStars, maleficStars, assistantStars, minorStars } = isEmpty 
      ? { mainStars: [], maleficStars: localStars.maleficStars, assistantStars: localStars.assistantStars, minorStars: localStars.minorStars }
      : localStars;
    
    // 生成話術
    let hook50, reflection30, capture20;
    
    if (isEmpty) {
      // 空宮話術：優先考慮本宮的煞星、輔星、雜曜，對宮主星僅作次要參考
      const PALACE_EMPTY_TRAITS = {
        "命宮": "容易受環境影響",
        "兄弟": "對關係的依賴",
        "夫妻": "受伴侶影響",
        "子女": "對成果的依賴",
        "財帛": "對資源的依賴",
        "疾厄": "對健康的焦慮",
        "遷移": "受外界影響",
        "僕役": "對關係的依賴",
        "官祿": "受職場影響",
        "田宅": "對穩定的渴望",
        "福德": "對內在平靜的渴望",
        "父母": "對權威的依賴"
      };
      
      const emptyTrait = PALACE_EMPTY_TRAITS[palaceName] || "受環境影響";
      
      // 🎯 直擊 (50%)：如果有對宮主星，輕描淡寫地提到，重點強調空宮特質和環境影響
      if (borrowedMainStar) {
        hook50 = `你的${palaceName}是空宮，借對宮的${borrowedMainStar}，代表你在這個領域${emptyTrait}，對吧？你覺得你現在的狀態，有多少是環境塑造的？`;
      } else {
        hook50 = `你的${palaceName}是空宮，代表你在這個領域${emptyTrait}，對吧？你覺得你現在的狀態，有多少是環境塑造的？`;
      }
      
      // 💭 啟發 (30%)：重點強調空宮的「變色龍」特質，並優先提及本宮的煞星和雜曜
      reflection30 = "空宮的人往往有一種『變色龍』的特質。你會不會有時候覺得，你在不同場合表現出來的自己，好像不太一樣？那種內在的矛盾感，你怎麼看待？";
      
      // 優先顯示煞星（權重最高）
      if (maleficStars.length > 0) {
        const firstMalefic = maleficStars[0];
        const maleficInfo = STAR_CATEGORIES.MALEFIC_STARS[firstMalefic];
        if (maleficInfo) {
          reflection30 += ` 你的${firstMalefic}，那種${maleficInfo.trait}和${maleficInfo.feeling}，你覺得它是在保護你，還是在限制你？`;
        }
      }
      
      // 其次顯示雜曜（如果有且沒有煞星，或有多個星曜時）
      if (minorStars.length > 0 && maleficStars.length === 0) {
        const firstMinor = minorStars[0];
        const minorInfo = STAR_CATEGORIES.MINOR_STARS[firstMinor];
        if (minorInfo) {
          reflection30 += ` 那種${minorInfo.feeling}，你覺得它是在提醒你什麼？還是只是在折磨你？`;
        }
      }
      
      // 📝 採集 (20%)：結合輔星，如果沒有輔星則使用通用話術
      if (assistantStars.length > 0) {
        const firstAssistant = assistantStars[0];
        const assistantInfo = STAR_CATEGORIES.ASSISTANT_STARS[firstAssistant];
        if (assistantInfo) {
          capture20 = `你的${palaceName}有${firstAssistant}，代表你在這個領域會${assistantInfo.trait}。那個讓你${assistantInfo.feeling}的資源或人，現在對你來說，它的意義是什麼？`;
        } else {
          capture20 = `在你做這個領域的決定時，那個『說不出理由，但就是覺得應該這樣做』的感覺，通常會出現在什麼時候？`;
        }
      } else {
        capture20 = `在你做這個領域的決定時，那個『說不出理由，但就是覺得應該這樣做』的感覺，通常會出現在什麼時候？`;
      }
    } else if (mainStars.length > 0) {
      // 一般宮位話術
      const mainStar = mainStars[0]; // 獲取第一個主星
      const trait = getPalaceTrait(mainStars); // 獲取宮位特質
      
      const PALACE_CONTEXTS = {
        "命宮": "你天生就有種",
        "兄弟": "你在這個領域有一種",
        "夫妻": "你在這個領域有一種",
        "子女": "你在這個領域有一種",
        "財帛": "你對這個領域有一種",
        "疾厄": "你的這個領域有一種",
        "遷移": "你出外運有一種",
        "僕役": "你在這個領域有一種",
        "官祿": "你在職場上有一種",
        "田宅": "你對這個領域有一種",
        "福德": "你內心最深處追求的是一種",
        "父母": "你在這個領域有一種"
      };
      
      const context = PALACE_CONTEXTS[palaceName] || "你在這個領域有一種";
      hook50 = `你的${palaceName}坐${mainStar}，${context}${trait}的氣場，對吧？`;
      
      // 啟發：結合煞星和雜曜
      if (maleficStars.length > 0) {
        const firstMalefic = maleficStars[0];
        const maleficInfo = STAR_CATEGORIES.MALEFIC_STARS[firstMalefic];
        if (maleficInfo) {
          reflection30 = `那種${maleficInfo.trait}和${maleficInfo.feeling}，你覺得它是在保護你，還是在限制你？你什麼時候開始意識到，你其實一直在用這種方式保護自己？`;
        } else {
          reflection30 = "這種特質在你意識不到的時候影響著你的選擇。你覺得你現在的人生軌跡，有多少是這種潛意識在推動的？";
        }
      } else if (minorStars.length > 0) {
        const firstMinor = minorStars[0];
        const minorInfo = STAR_CATEGORIES.MINOR_STARS[firstMinor];
        if (minorInfo) {
          reflection30 = `那種${minorInfo.feeling}，你覺得它是在提醒你什麼？還是只是在折磨你？`;
        } else {
          reflection30 = "這種特質在你意識不到的時候影響著你的選擇。你覺得你現在的人生軌跡，有多少是這種潛意識在推動的？";
        }
      } else {
        reflection30 = "這種特質在你意識不到的時候影響著你的選擇。你覺得你現在的人生軌跡，有多少是這種潛意識在推動的？";
      }
      
      // 採集：結合輔星
      if (assistantStars.length > 0) {
        const firstAssistant = assistantStars[0];
        const assistantInfo = STAR_CATEGORIES.ASSISTANT_STARS[firstAssistant];
        if (assistantInfo) {
          capture20 = `你的${palaceName}有${firstAssistant}，代表你在這個領域會${assistantInfo.trait}。那個讓你${assistantInfo.feeling}的資源或人，現在對你來說，它的意義是什麼？`;
        } else {
          capture20 = `在你做這個領域的決定時，那個『說不出理由，但就是覺得應該這樣做』的感覺，通常會出現在什麼時候？`;
        }
      } else {
        capture20 = `在你做這個領域的決定時，那個『說不出理由，但就是覺得應該這樣做』的感覺，通常會出現在什麼時候？`;
      }
    } else {
      // 完全空宮（對宮也無主星）：重點關注本宮的煞星、輔星、雜曜
      hook50 = `你的${palaceName}是空宮，代表你在這個領域容易受環境影響，對吧？`;
      
      // 💭 啟發 (30%)：優先顯示煞星和雜曜
      reflection30 = "空宮的人往往有一種『變色龍』的特質。你會不會有時候覺得，你在不同場合表現出來的自己，好像不太一樣？那種內在的矛盾感，你怎麼看待？";
      
      // 優先顯示煞星（權重最高）
      if (maleficStars.length > 0) {
        const firstMalefic = maleficStars[0];
        const maleficInfo = STAR_CATEGORIES.MALEFIC_STARS[firstMalefic];
        if (maleficInfo) {
          reflection30 += ` 你的${firstMalefic}，那種${maleficInfo.trait}和${maleficInfo.feeling}，你覺得它是在保護你，還是在限制你？`;
        }
      }
      
      // 其次顯示雜曜（如果有且沒有煞星）
      if (minorStars.length > 0 && maleficStars.length === 0) {
        const firstMinor = minorStars[0];
        const minorInfo = STAR_CATEGORIES.MINOR_STARS[firstMinor];
        if (minorInfo) {
          reflection30 += ` 那種${minorInfo.feeling}，你覺得它是在提醒你什麼？還是只是在折磨你？`;
        }
      }
      
      // 📝 採集 (20%)：結合輔星
      if (assistantStars.length > 0) {
        const firstAssistant = assistantStars[0];
        const assistantInfo = STAR_CATEGORIES.ASSISTANT_STARS[firstAssistant];
        if (assistantInfo) {
          capture20 = `你的${palaceName}有${firstAssistant}，代表你在這個領域會${assistantInfo.trait}。那個讓你${assistantInfo.feeling}的資源或人，現在對你來說，它的意義是什麼？`;
        } else {
          capture20 = `在你做這個領域的決定時，那個『說不出理由，但就是覺得應該這樣做』的感覺，通常會出現在什麼時候？`;
        }
      } else {
        capture20 = `在你做這個領域的決定時，那個『說不出理由，但就是覺得應該這樣做』的感覺，通常會出現在什麼時候？`;
      }
    }
    
    return {
      hook50,
      reflection30,
      capture20,
      isEmpty,
      oppositePalace,
      stars: {
        mainStars: isEmpty ? [] : mainStars, // 空宮時返回空數組，不包含借來的對宮主星
        maleficStars,
        assistantStars,
        minorStars
      }
    };
  }

  /**
   * Q1: 命宮（原廠設定）
   * 改進：使用統一的空宮處理邏輯
   */
  function generateQ1(ziwei, overlapAnalysis, fourTransformations) {
    const palaceData = getPalaceTransformations(overlapAnalysis, "命宮");
    const script = generatePalaceConsultationScript(ziwei, "命宮", overlapAnalysis);
    
    let hook50 = script.hook50;
    let reflection30 = script.reflection30;
    let capture20 = script.capture20;
    
    // 如果有化忌疊加，調整話術
    if (palaceData && palaceData.jiCount > 0) {
      reflection30 = `這種氣場讓你贏得尊重，但${palaceData.jiCount}重化忌疊加，也讓你很難在人前示弱。你覺得這份堅強是在保護誰？`;
      capture20 = `在你內心最深處，有沒有哪個時刻是你想徹底放下這些，去做回一個普通人的？`;
    }

    return {
      id: 'Q1',
      palace: '命宮',
      dimension: '核心本質',
      title: '命宮（原廠設定）',
      hook50,
      reflection30,
      capture20,
      data: {
        mainStars: script.stars.mainStars,
        isEmpty: script.isEmpty,
        oppositePalace: script.oppositePalace,
        trait: getPalaceTrait(script.stars.mainStars),
        transformations: palaceData?.transformations || null
      }
    };
  }

  /**
   * Q2: 福德宮（靈魂底色）
   * 改進：使用統一的空宮處理邏輯
   */
  function generateQ2(ziwei, overlapAnalysis, fourTransformations) {
    const palaceData = getPalaceTransformations(overlapAnalysis, "福德");
    const script = generatePalaceConsultationScript(ziwei, "福德", overlapAnalysis);
    
    let hook50 = script.hook50;
    let reflection30 = script.reflection30;
    let capture20 = script.capture20;
    
    // 如果有化祿疊加，調整話術
    if (palaceData && palaceData.luCount >= 2) {
      reflection30 = `你的福德宮有${palaceData.luCount}重化祿疊加，代表你精神層面非常富足。但這種富足，是否讓你對現實世界的挑戰產生了距離感？`;
      capture20 = `在你最放鬆的時刻，你內心最常出現的那個畫面或感受是什麼？`;
    }

    return {
      id: 'Q2',
      palace: '福德',
      dimension: '核心本質',
      title: '福德宮（靈魂底色）',
      hook50,
      reflection30,
      capture20,
      data: {
        mainStars: script.stars.mainStars,
        isEmpty: script.isEmpty,
        oppositePalace: script.oppositePalace,
        trait: getPalaceTrait(script.stars.mainStars),
        transformations: palaceData?.transformations || null
      }
    };
  }

  /**
   * 根據身宮地支找到身宮所在的宮位名稱
   * @param {Object} ziwei 紫微命盤資料
   * @returns {string|null} 身宮所在的宮位名稱（如"福德"、"命宮"等），如果找不到則返回 null
   */
  function findShengongPalace(ziwei) {
    if (!ziwei || !ziwei.core) return null;
    
    const shengongBranch = ziwei.core.shengongBranch;
    const minggongBranch = ziwei.core.minggongBranch || "寅";
    
    if (!shengongBranch) return null;
    
    // 使用與 buildSlotsFromZiwei 相同的邏輯
    const BRANCH_RING = window.CalcConstants?.BRANCH_RING || [
      "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"
    ];
    
    let mingIdx = BRANCH_RING.indexOf(minggongBranch);
    if (mingIdx < 0) {
      mingIdx = 0;
    }
    
    // 找到身宮地支在 BRANCH_RING 中的索引
    const shenIdx = BRANCH_RING.indexOf(shengongBranch);
    if (shenIdx < 0) return null;
    
    // 計算身宮在 PALACE_DEFAULT 中的索引
    // 公式：palaceIndex = (mingIdx - branchIdx + 12) % 12
    const palaceIndex = (mingIdx - shenIdx + 12) % 12;
    
    return PALACE_DEFAULT[palaceIndex] || null;
  }

  /**
   * Q3: 身宮（後半生趨勢）
   * 修復：身宮是12宮位中的一個，不是獨立宮位
   */
  function generateQ3(ziwei, overlapAnalysis, fourTransformations) {
    // 找到身宮所在的宮位名稱
    const shengongPalaceName = findShengongPalace(ziwei);
    
    // 如果找不到身宮，fallback 到福德宮（常見的身宮位置）
    const targetPalace = shengongPalaceName || "福德";
    
    const mainStars = getPalaceMainStars(ziwei, targetPalace);
    const trait = getPalaceTrait(mainStars);
    const palaceData = getPalaceTransformations(overlapAnalysis, targetPalace);

    // 如果身宮和命宮同宮，話術需要調整
    const minggongBranch = ziwei?.core?.minggongBranch || "寅";
    const shengongBranch = ziwei?.core?.shengongBranch;
    const isMingShenSame = minggongBranch === shengongBranch;
    
    let hook50;
    if (isMingShenSame) {
      hook50 = `你的身宮和命宮同宮（都在${targetPalace}），代表你35歲後會在這個領域展現 ${trait} 的特質，對吧？`;
    } else {
      hook50 = `你的身宮在${targetPalace}，坐 ${mainStars.length > 0 ? mainStars[0] : "空宮"}，代表35歲後你會逐漸展現 ${trait} 的特質，對吧？`;
    }
    
    const reflection30 = `這種轉變會讓你後半生更接近真實的自己，但也意味著你要放下前半生建立的那些習慣。你覺得這種轉變是自然的，還是被逼的？`;

    const capture20 = `如果35歲後的你，可以重新選擇一個人生方向，你最想往哪個領域發展？`;

    return {
      id: 'Q3',
      palace: targetPalace,
      dimension: '核心本質',
      title: `身宮（後半生趨勢）${shengongPalaceName ? `- ${shengongPalaceName}` : ''}`,
      hook50,
      reflection30,
      capture20,
      data: {
        shengongPalaceName: targetPalace,
        isMingShenSame,
        mainStars,
        trait,
        transformations: palaceData?.transformations || null
      }
    };
  }

  /**
   * Q4: 命主/身主（隱藏動能）
   * 改進：正確計算並分開顯示命主和身主
   */
  function generateQ4(ziwei, overlapAnalysis, fourTransformations) {
    // 獲取命主和身主
    const core = ziwei?.core || {};
    const basic = ziwei?.basic || {};
    const mingBranch = core.minggongBranch || "寅";
    
    // 嘗試從後端數據獲取，否則計算
    let mingzhu = basic.masterStar || core.mingzhu || core.命主 || "";
    let shengong = basic.bodyStar || core.shengong || core.身主 || "";
    
    // 如果後端沒有提供，嘗試計算（需要年支）
    const contract = window.contract || null;
    const bazi = contract?.bazi || null;
    const yearBranch = (bazi?.display?.yZ || "").toString().trim();
    
    if (!mingzhu && window.CalcHelpers?.calculateMingzhu) {
      mingzhu = window.CalcHelpers.calculateMingzhu(mingBranch) || "";
    }
    if (!shengong && yearBranch && window.CalcHelpers?.calculateShengong) {
      shengong = window.CalcHelpers.calculateShengong(yearBranch) || "";
    }
    
    // 標準化星名
    const toTraditionalStarNameHelper = window.CalcHelpers?.toTraditionalStarName;
    if (mingzhu && toTraditionalStarNameHelper) {
      mingzhu = toTraditionalStarNameHelper(mingzhu);
    }
    if (shengong && toTraditionalStarNameHelper) {
      shengong = toTraditionalStarNameHelper(shengong);
    }
    
    const mingzhuText = mingzhu || "—";
    const shengongText = shengong || "—";
    
    const hook50 = `你的命主是 ${mingzhuText}，身主是 ${shengongText}。命主代表你潛意識的驅動力，身主代表你後天的行動模式。你覺得這兩者在你身上是如何互動的？`;
    
    const reflection30 = `命主 ${mingzhuText} 影響你的精神層面，身主 ${shengongText} 影響你的實際行動。當這兩者一致時，你會感到順暢；當它們衝突時，你會感到內在拉扯。你現在處於哪種狀態？`;

    const capture20 = `在你做重大決定時，那個「說不出理由，但就是覺得應該這樣做」的感覺，通常會出現在什麼時候？`;

    return {
      id: 'Q4',
      palace: '命主/身主',
      dimension: '核心本質',
      title: '命主/身主（隱藏動能）',
      hook50,
      reflection30,
      capture20,
      data: {
        mingzhu: mingzhuText,
        shengong: shengongText,
        mingBranch: mingBranch,
        yearBranch: yearBranch
      }
    };
  }

  /**
   * Q5: 事業宮（生存戰略）
   * 改進：使用統一的空宮處理邏輯
   */
  function generateQ5(ziwei, overlapAnalysis, fourTransformations) {
    const palaceData = getPalaceTransformations(overlapAnalysis, "官祿");
    
    // 使用統一的空宮處理邏輯
    const script = generatePalaceConsultationScript(ziwei, "官祿", overlapAnalysis);
    let hook50 = script.hook50;
    let reflection30 = script.reflection30;
    let capture20 = script.capture20;
    
    // 如果有四化特殊情況，優先顯示
    if (palaceData) {
      if (palaceData.jiCount > 0) {
        hook50 = `你的官祿宮見${palaceData.jiCount}重化忌疊加，代表你在職場上總是處於一種「高壓待命」的狀態。`;
        reflection30 = `這份壓力讓你精進，但也讓你變成了目標的奴隸。你覺得現在的成就感是真的，還是只是怕停下來的焦慮？`;
        capture20 = `如果不考慮收入，你現在最想解雇哪一個部分的自己？`;
      } else if (palaceData.transformations?.dalimit?.type === '權') {
        hook50 = `你的官祿宮見大限化權，代表你在職場上總是處於一種「高壓待命」的狀態。`;
        reflection30 = `這份壓力讓你精進，但也讓你變成了目標的奴隸。你覺得現在的成就感是真的，還是只是怕停下來的焦慮？`;
        capture20 = `如果不考慮收入，你現在最想解雇哪一個部分的自己？`;
      }
    }

    return {
      id: 'Q5',
      palace: '官祿',
      dimension: '空間配置',
      title: '事業宮（生存戰略）',
      hook50,
      reflection30,
      capture20,
      data: {
        mainStars: script.stars.mainStars,
        isEmpty: script.isEmpty,
        oppositePalace: script.oppositePalace,
        transformations: palaceData?.transformations || null
      }
    };
  }

  /**
   * Q6: 財帛宮（價值交換）
   * 改進：使用統一的空宮處理邏輯
   */
  function generateQ6(ziwei, overlapAnalysis, fourTransformations) {
    const palaceData = getPalaceTransformations(overlapAnalysis, "財帛");
    const volatile = overlapAnalysis?.volatileAmbivalences?.find(v => v.palace === "財帛");
    const risk = overlapAnalysis?.criticalRisks?.find(r => r.palace === "財帛");
    
    // 使用統一的空宮處理邏輯
    const script = generatePalaceConsultationScript(ziwei, "財帛", overlapAnalysis);
    let hook50 = script.hook50;
    let reflection30 = script.reflection30;
    let capture20 = script.capture20;
    
    // 如果有疊宮特殊情況，優先顯示（但保留空宮處理的基礎話術結構）
    if (volatile) {
      hook50 = `你的財帛宮同時有${volatile.jiCount}重化忌和${volatile.luCount}重化祿疊加，處於「成敗一線間」。你對金錢既渴望又恐懼，對吧？`;
      reflection30 = `這種對金錢的態度，影響了你做決定的方式。你覺得你現在賺錢的模式，是在滿足需求，還是在填補某種不安全感？`;
      capture20 = `關於財務，那個讓你最猶豫不決的決定是什麼？現況如何？`;
    } else if (risk) {
      hook50 = `你的財帛宮有${risk.jiCount}重化忌疊加，代表你對資源的匱乏感才是你焦慮的根源，對吧？`;
      reflection30 = `這種對金錢的態度，影響了你做決定的方式。你覺得你現在賺錢的模式，是在滿足需求，還是在填補某種不安全感？`;
      capture20 = `關於財務，那個讓你最猶豫不決的決定是什麼？現況如何？`;
    } else if (palaceData && palaceData.luCount > 0) {
      hook50 = `你的財帛宮有${palaceData.luCount}重化祿疊加，代表你天生有賺錢的運勢，但你對金錢的態度是什麼？`;
      reflection30 = `這種對金錢的態度，影響了你做決定的方式。你覺得你現在賺錢的模式，是在滿足需求，還是在填補某種不安全感？`;
      capture20 = `關於財務，那個讓你最猶豫不決的決定是什麼？現況如何？`;
    }
    // 如果沒有特殊疊宮情況，使用 script 中已經處理好的空宮話術（包含借對宮主星、輔星、雜曜）

    return {
      id: 'Q6',
      palace: '財帛',
      dimension: '空間配置',
      title: '財帛宮（價值交換）',
      hook50,
      reflection30,
      capture20,
      data: {
        mainStars: script.stars.mainStars,
        isEmpty: script.isEmpty,
        oppositePalace: script.oppositePalace,
        transformations: palaceData?.transformations || null,
        isVolatile: !!volatile,
        isRisk: !!risk
      }
    };
  }

  /**
   * Q7: 遷移宮（外在機遇）
   * 改進：使用統一的空宮處理邏輯
   */
  function generateQ7(ziwei, overlapAnalysis, fourTransformations) {
    const palaceData = getPalaceTransformations(overlapAnalysis, "遷移");
    const script = generatePalaceConsultationScript(ziwei, "遷移", overlapAnalysis);
    
    let hook50 = script.hook50;
    let reflection30 = script.reflection30;
    let capture20 = script.capture20;
    
    // 可以根據四化調整
    if (palaceData && palaceData.luCount > 0) {
      reflection30 = `這種特質讓你在外面能展現不同的自己，但也讓你對「家」和「外面」產生了不同的期待。你覺得你在外面戴的那個面具，是保護還是偽裝？`;
      capture20 = `關於遷移或環境變動，那個讓你最猶豫不決的決定是什麼？現況如何？`;
    }

    return {
      id: 'Q7',
      palace: '遷移',
      dimension: '空間配置',
      title: '遷移宮（外在機遇）',
      hook50,
      reflection30,
      capture20,
      data: {
        mainStars: script.stars.mainStars,
        isEmpty: script.isEmpty,
        oppositePalace: script.oppositePalace,
        transformations: palaceData?.transformations || null
      }
    };
  }

  /**
   * Q8: 疾厄宮（系統負擔）
   * 改進：使用統一的空宮處理邏輯
   */
  function generateQ8(ziwei, overlapAnalysis, fourTransformations) {
    const palaceData = getPalaceTransformations(overlapAnalysis, "疾厄");
    const script = generatePalaceConsultationScript(ziwei, "疾厄", overlapAnalysis);
    
    let hook50 = script.hook50;
    let reflection30 = script.reflection30;
    let capture20 = script.capture20;
    
    // 如果有化忌疊加，優先顯示
    if (palaceData && palaceData.jiCount > 0) {
      hook50 = `你的疾厄宮有${palaceData.jiCount}重化忌疊加，代表你的身體和情緒都處於高壓狀態。`;
      reflection30 = `這種壓力會在你最累的時候爆發。你覺得你現在的身體狀況，是在警告你什麼？`;
      capture20 = `關於健康，那個讓你最擔心的症狀或狀態是什麼？現況如何？`;
    }

    return {
      id: 'Q8',
      palace: '疾厄',
      dimension: '空間配置',
      title: '疾厄宮（系統負擔）',
      hook50,
      reflection30,
      capture20,
      data: {
        mainStars: script.stars.mainStars,
        isEmpty: script.isEmpty,
        oppositePalace: script.oppositePalace,
        transformations: palaceData?.transformations || null
      }
    };
  }

  /**
   * Q9: 夫妻宮（情感依附）
   * 改進：使用統一的空宮處理邏輯
   */
  function generateQ9(ziwei, overlapAnalysis, fourTransformations) {
    const palaceData = getPalaceTransformations(overlapAnalysis, "夫妻");
    const script = generatePalaceConsultationScript(ziwei, "夫妻", overlapAnalysis);
    
    let hook50 = script.hook50;
    let reflection30 = script.reflection30;
    let capture20 = script.capture20;
    
    // 可以根據四化調整
    if (palaceData && palaceData.luCount > 0) {
      reflection30 = `這種投射讓你在關係中尋找特定的特質，但也可能讓你忽略了對方的真實樣貌。你覺得你在關係中尋找的，是對方還是自己的影子？`;
      capture20 = `關於感情或親密關係，那個讓你最猶豫不決的決定是什麼？現況如何？`;
    }

    return {
      id: 'Q9',
      palace: '夫妻',
      dimension: '空間配置',
      title: '夫妻宮（情感依附）',
      hook50,
      reflection30,
      capture20,
      data: {
        mainStars: script.stars.mainStars,
        isEmpty: script.isEmpty,
        oppositePalace: script.oppositePalace,
        transformations: palaceData?.transformations || null
      }
    };
  }

  /**
   * Q10: 田宅宮（安全邊界）
   * 改進：使用統一的空宮處理邏輯
   */
  function generateQ10(ziwei, overlapAnalysis, fourTransformations) {
    const palaceData = getPalaceTransformations(overlapAnalysis, "田宅");
    const liunian = fourTransformations?.liunian;
    const script = generatePalaceConsultationScript(ziwei, "田宅", overlapAnalysis);
    
    let hook50 = script.hook50;
    let reflection30 = script.reflection30;
    let capture20 = script.capture20;
    
    // 如果有流年變動，優先顯示
    if (liunian && liunian.palace === "田宅") {
      hook50 = `2026年你的「田宅宮」有變動。你對「家」和「歸屬」的期待，在今年會面臨考驗。`;
      reflection30 = `這種期待影響了你對安全感的定義。你覺得你現在擁有的那些「穩定」，是真的安全，還是只是習慣？`;
      capture20 = `關於房產或家庭，那個讓你猶豫不決的決定是什麼？現況如何？`;
    } else if (palaceData && palaceData.luCount > 0) {
      hook50 = `你的田宅宮有${palaceData.luCount}重化祿疊加，代表你對「家」和「歸屬」有強烈的渴望。`;
      reflection30 = `這種期待影響了你對安全感的定義。你覺得你現在擁有的那些「穩定」，是真的安全，還是只是習慣？`;
      capture20 = `關於房產或家庭，那個讓你猶豫不決的決定是什麼？現況如何？`;
    }

    return {
      id: 'Q10',
      palace: '田宅',
      dimension: '空間配置',
      title: '田宅宮（安全邊界）',
      hook50,
      reflection30,
      capture20,
      data: {
        mainStars: script.stars.mainStars,
        isEmpty: script.isEmpty,
        oppositePalace: script.oppositePalace,
        transformations: palaceData?.transformations || null,
        hasLiunianChange: liunian?.palace === "田宅"
      }
    };
  }

  /**
   * Q11: 十年大限（賽季主題）
   * 改進：正確獲取大限信息，並加入生年、大限、小限四化，顯示大限宮位的主星
   */
  function generateQ11(ziwei, overlapAnalysis, fourTransformations) {
    const dalimit = fourTransformations?.dalimit;
    const benming = fourTransformations?.benming;
    const xiaoxian = fourTransformations?.xiaoxian;
    const summary = fourTransformations?.summary;
    
    // 優先從 summary 獲取，否則從 dalimit 獲取
    const dalimitPalace = summary?.dalimitPalace || dalimit?.palace || null;
    const dalimitStem = summary?.dalimitStem || dalimit?.stem || "";
    
    // 如果無法獲取大限宮位，返回錯誤提示
    if (!dalimitPalace) {
      return {
        id: 'Q11',
        palace: '未知',
        dimension: '時間座標',
        title: '十年大限（賽季主題）',
        hook50: '無法獲取大限信息，請檢查計算數據',
        reflection30: '請確認年齡和命盤數據是否正確',
        capture20: '這十年你最想完成的一件「大事」是什麼？',
        data: {
          error: '無法獲取大限宮位'
        }
      };
    }
    
    // 獲取大限宮位的主星信息
    const dalimitMainStars = getPalaceMainStars(ziwei, dalimitPalace);
    const dalimitMainStar = dalimitMainStars.length > 0 ? dalimitMainStars[0] : null;
    const dalimitTrait = getPalaceTrait(dalimitMainStars);
    
    // 獲取四化信息
    const benmingSiHua = benming?.mutagenStars || {};
    const dalimitSiHua = dalimit?.mutagenStars || {};
    const xiaoxianSiHua = xiaoxian?.mutagenStars || {};
    
    // 構建四化描述
    let sihuaText = "";
    const sihuaParts = [];
    if (benmingSiHua.祿) sihuaParts.push(`生年${benmingSiHua.祿}化祿`);
    if (dalimitSiHua.祿) sihuaParts.push(`大限${dalimitSiHua.祿}化祿`);
    if (xiaoxianSiHua.祿) sihuaParts.push(`小限${xiaoxianSiHua.祿}化祿`);
    if (benmingSiHua.忌) sihuaParts.push(`生年${benmingSiHua.忌}化忌`);
    if (dalimitSiHua.忌) sihuaParts.push(`大限${dalimitSiHua.忌}化忌`);
    if (xiaoxianSiHua.忌) sihuaParts.push(`小限${xiaoxianSiHua.忌}化忌`);
    
    if (sihuaParts.length > 0) {
      sihuaText = `（${sihuaParts.slice(0, 3).join("、")}${sihuaParts.length > 3 ? "..." : ""}）`;
    }

    // 構建大限描述：包含宮位名稱和主星
    let dalimitDescription = `${dalimitPalace}宮`;
    if (dalimitMainStar) {
      dalimitDescription = `${dalimitPalace}宮走${dalimitMainStar}`;
    }
    
    let hook50 = `這十年走 ${dalimitDescription}（${dalimitStem}${sihuaText}），你的主題是「重新定義自我」。`;
    
    if (!dalimitStem) {
      hook50 = `這十年走 ${dalimitDescription}，你的主題是「重新定義自我」。`;
    }

    let reflection30 = `過去那些你引以為傲的工具，在這十年似乎失效了。`;
    
    // 根據四化調整啟發話術
    if (dalimitSiHua.忌) {
      reflection30 += ` 大限${dalimitSiHua.忌}化忌疊加，代表這十年你會面臨${dalimitPalace}宮的挑戰。`;
    }
    if (dalimitSiHua.祿) {
      reflection30 += ` 但大限${dalimitSiHua.祿}化祿也代表這十年在${dalimitPalace}宮有機會。`;
    }
    
    // 如果有主星，加入主星特質的描述
    if (dalimitMainStar) {
      reflection30 += ` ${dalimitMainStar}的${dalimitTrait}特質，會在這十年更加明顯。`;
    }
    
    reflection30 += ` 你覺得這是系統在逼你升級，還是在逼你轉行？`;

    const capture20 = `這十年你最想完成的一件「大事」是什麼？`;

    return {
      id: 'Q11',
      palace: dalimitPalace,
      dimension: '時間座標',
      title: '十年大限（賽季主題）',
      hook50,
      reflection30,
      capture20,
      data: {
        dalimitPalace,
        dalimitStem,
        dalimitMainStar,
        dalimitTrait,
        benmingSiHua,
        dalimitSiHua,
        xiaoxianSiHua,
        transformations: dalimit?.mutagenStars || null
      }
    };
  }

  /**
   * Q12: 當年流年（2026 丙午戰略）
   * 改進：正確獲取流年信息，並加入生年、大限、流年、小限四化，顯示流年宮位的主星
   */
  function generateQ12(ziwei, overlapAnalysis, fourTransformations, currentYear = 2026) {
    const liunian = fourTransformations?.liunian;
    const benming = fourTransformations?.benming;
    const dalimit = fourTransformations?.dalimit;
    const xiaoxian = fourTransformations?.xiaoxian;
    const summary = fourTransformations?.summary;
    
    // 優先從 summary 獲取，否則從 liunian 獲取
    const liunianStem = summary?.liunianStem || liunian?.stem || "";
    const liunianBranch = summary?.liunianBranch || liunian?.branch || "";
    const liunianPalace = summary?.liunianPalace || liunian?.palace || null;
    
    // 如果無法獲取流年宮位，嘗試從命盤計算
    let finalLiunianPalace = liunianPalace;
    if (!finalLiunianPalace && ziwei && liunianBranch) {
      // 如果前端能正確顯示，說明數據應該存在，這裡作為備用方案
      // 可以嘗試從命宮地支計算流年宮位
      const mingBranch = ziwei?.core?.minggongBranch || "寅";
      if (window.BaziCore && window.BaziCore.computeLiunianPalace) {
        finalLiunianPalace = window.BaziCore.computeLiunianPalace(liunianBranch, mingBranch);
      }
    }
    
    // 如果仍然無法獲取，返回錯誤提示
    if (!finalLiunianPalace) {
      return {
        id: 'Q12',
        palace: '未知',
        dimension: '時間座標',
        title: `當年流年（${currentYear} ${liunianStem}${liunianBranch}戰略）`,
        hook50: `無法獲取流年宮位信息，請檢查計算數據`,
        reflection30: '請確認流年數據是否正確',
        capture20: `關於今年流年的變動，那個讓你最猶豫不決的決定是什麼？現況如何？`,
        data: {
          error: '無法獲取流年宮位',
          liunianStem,
          liunianBranch
        }
      };
    }
    
    // 獲取流年宮位的主星信息
    const liunianMainStars = getPalaceMainStars(ziwei, finalLiunianPalace);
    const liunianMainStar = liunianMainStars.length > 0 ? liunianMainStars[0] : null;
    const liunianTrait = getPalaceTrait(liunianMainStars);
    
    // 獲取小限信息
    const xiaoxianPalace = summary?.xiaoxianPalace || xiaoxian?.palace || null;
    const xiaoxianStem = summary?.xiaoxianStem || xiaoxian?.stem || "";
    
    // 獲取四化信息
    const benmingSiHua = benming?.mutagenStars || {};
    const dalimitSiHua = dalimit?.mutagenStars || {};
    const liunianSiHua = liunian?.mutagenStars || {};
    const xiaoxianSiHua = xiaoxian?.mutagenStars || {};
    
    // 構建四化描述（重點顯示流年四化）
    let sihuaText = "";
    const sihuaParts = [];
    if (liunianSiHua.祿) sihuaParts.push(`流年${liunianSiHua.祿}化祿`);
    if (liunianSiHua.忌) sihuaParts.push(`流年${liunianSiHua.忌}化忌`);
    if (dalimitSiHua.祿 && dalimitSiHua.祿 !== liunianSiHua.祿) sihuaParts.push(`大限${dalimitSiHua.祿}化祿`);
    if (xiaoxianSiHua.祿) sihuaParts.push(`小限${xiaoxianSiHua.祿}化祿`);
    
    if (sihuaParts.length > 0) {
      sihuaText = `（${sihuaParts.slice(0, 3).join("、")}${sihuaParts.length > 3 ? "..." : ""}）`;
    }

    // 構建流年描述：包含宮位名稱和主星
    let liunianDescription = `「${finalLiunianPalace}宮」`;
    if (liunianMainStar) {
      liunianDescription = `「${finalLiunianPalace}宮」走${liunianMainStar}`;
    }

    let hook50 = `${currentYear}年是${liunianStem}${liunianBranch}年，流年在${liunianDescription}${sihuaText}，代表你今年的爆發點和陷阱都在這個領域。`;
    
    if (!liunianStem || !liunianBranch) {
      hook50 = `${currentYear}年流年在${liunianDescription}${sihuaText}，代表你今年的爆發點和陷阱都在這個領域。`;
    }
    
    // 如果有小限信息，加入小限宮位
    if (xiaoxianPalace) {
      hook50 += ` 小限在「${xiaoxianPalace}宮」，代表你個人化的年度重點也在這個領域。`;
    }

    let reflection30 = `這個領域會讓你看到機會，但也會讓你看到自己的極限。`;
    
    // 根據四化調整啟發話術
    if (liunianSiHua.忌) {
      reflection30 += ` 流年${liunianSiHua.忌}化忌代表今年在${finalLiunianPalace}宮會有壓力，`;
    }
    if (liunianSiHua.祿) {
      reflection30 += ` 但流年${liunianSiHua.祿}化祿也代表有機會。`;
    }
    
    // 如果有主星，加入主星特質的描述
    if (liunianMainStar) {
      reflection30 += ` ${liunianMainStar}的${liunianTrait}特質，會在今年更加明顯。`;
    }
    
    reflection30 += ` 你覺得今年你最大的挑戰是什麼？`;

    const capture20 = `關於今年${finalLiunianPalace}宮的變動，那個讓你最猶豫不決的決定是什麼？現況如何？`;

    return {
      id: 'Q12',
      palace: finalLiunianPalace,
      dimension: '時間座標',
      title: `當年流年（${currentYear} ${liunianStem}${liunianBranch}戰略）`,
      hook50,
      reflection30,
      capture20,
      data: {
        liunianStem,
        liunianBranch,
        liunianPalace: finalLiunianPalace,
        liunianMainStar,
        liunianTrait,
        xiaoxianPalace,
        xiaoxianStem,
        benmingSiHua,
        dalimitSiHua,
        liunianSiHua,
        xiaoxianSiHua,
        transformations: liunian?.mutagenStars || null
      }
    };
  }

  /**
   * Q13: 流年關鍵宮位（年度決戰點）
   * 改進：加入四化信息讓問題層次更精確
   */
  function generateQ13(ziwei, overlapAnalysis, fourTransformations) {
    const volatile = overlapAnalysis?.volatileAmbivalences?.[0];
    const risk = overlapAnalysis?.criticalRisks?.[0];
    const opportunity = overlapAnalysis?.maxOpportunities?.[0];
    
    const benming = fourTransformations?.benming;
    const dalimit = fourTransformations?.dalimit;
    const liunian = fourTransformations?.liunian;
    const xiaoxian = fourTransformations?.xiaoxian;
    
    // 獲取目標宮位的四化信息
    const targetPalace = volatile?.palace || risk?.palace || opportunity?.palace || null;
    const palaceData = targetPalace ? getPalaceTransformations(overlapAnalysis, targetPalace) : null;

    let hook50 = `今年流年的關鍵宮位，是你需要特別關注的領域。`;
    let reflection30 = `這個領域會讓你看到機會，但也會讓你看到自己的極限。`;
    let capture20 = `關於這個關鍵宮位的變動，那個讓你最猶豫不決的決定是什麼？現況如何？`;

    if (volatile) {
      hook50 = `今年「${volatile.palace}宮」同時有${volatile.jiCount}重化忌和${volatile.luCount}重化祿疊加，處於「成敗一線間」，是你年度決戰點。`;
      
      // 加入四化層次信息
      const sihuaDetails = [];
      if (palaceData?.transformations?.benming) {
        const bm = palaceData.transformations.benming;
        if (bm.type === '忌') sihuaDetails.push(`生年${bm.star}化忌`);
        if (bm.type === '祿') sihuaDetails.push(`生年${bm.star}化祿`);
      }
      if (palaceData?.transformations?.dalimit) {
        const dl = palaceData.transformations.dalimit;
        if (dl.type === '忌') sihuaDetails.push(`大限${dl.star}化忌`);
        if (dl.type === '祿') sihuaDetails.push(`大限${dl.star}化祿`);
      }
      if (palaceData?.transformations?.liunian) {
        const ln = palaceData.transformations.liunian;
        if (ln.type === '忌') sihuaDetails.push(`流年${ln.star}化忌`);
        if (ln.type === '祿') sihuaDetails.push(`流年${ln.star}化祿`);
      }
      
      if (sihuaDetails.length > 0) {
        hook50 += `（${sihuaDetails.slice(0, 4).join("、")}${sihuaDetails.length > 4 ? "..." : ""}）`;
      }
      
      reflection30 = `這個領域會讓你看到巨大的機會，但也伴隨系統性崩潰風險。你覺得你現在準備好了嗎？`;
      capture20 = `關於${volatile.palace}宮的那個懸而未決的決定，現況如何？`;
    } else if (risk) {
      hook50 = `今年「${risk.palace}宮」有${risk.jiCount}重化忌疊加，是你年度最需要避開的地雷區。`;
      
      // 加入四化層次信息
      const sihuaDetails = [];
      if (palaceData?.transformations?.benming && palaceData.transformations.benming.type === '忌') {
        sihuaDetails.push(`生年${palaceData.transformations.benming.star}化忌`);
      }
      if (palaceData?.transformations?.dalimit && palaceData.transformations.dalimit.type === '忌') {
        sihuaDetails.push(`大限${palaceData.transformations.dalimit.star}化忌`);
      }
      if (palaceData?.transformations?.liunian && palaceData.transformations.liunian.type === '忌') {
        sihuaDetails.push(`流年${palaceData.transformations.liunian.star}化忌`);
      }
      
      if (sihuaDetails.length > 0) {
        hook50 += `（${sihuaDetails.join("、")}）`;
      }
      
      reflection30 = `這個領域會讓你看到自己的弱點。你覺得你現在能避開這個陷阱嗎？`;
      capture20 = `關於${risk.palace}宮的那個讓你最擔心的問題，現況如何？`;
    } else if (opportunity) {
      hook50 = `今年「${opportunity.palace}宮」有${opportunity.luCount}重化祿疊加，是你年度大發財機會。`;
      
      // 加入四化層次信息
      const sihuaDetails = [];
      if (palaceData?.transformations?.benming && palaceData.transformations.benming.type === '祿') {
        sihuaDetails.push(`生年${palaceData.transformations.benming.star}化祿`);
      }
      if (palaceData?.transformations?.dalimit && palaceData.transformations.dalimit.type === '祿') {
        sihuaDetails.push(`大限${palaceData.transformations.dalimit.star}化祿`);
      }
      if (palaceData?.transformations?.liunian && palaceData.transformations.liunian.type === '祿') {
        sihuaDetails.push(`流年${palaceData.transformations.liunian.star}化祿`);
      }
      
      if (sihuaDetails.length > 0) {
        hook50 += `（${sihuaDetails.join("、")}）`;
      }
      
      reflection30 = `這個領域會讓你看到巨大的機會。你覺得你現在能把握住嗎？`;
      capture20 = `關於${opportunity.palace}宮的那個讓你最期待的機會，現況如何？`;
    }

    return {
      id: 'Q13',
      palace: volatile?.palace || risk?.palace || opportunity?.palace || "關鍵宮位",
      dimension: '時間座標',
      title: '流年關鍵宮位（年度決戰點）',
      hook50,
      reflection30,
      capture20,
      data: {
        isVolatile: !!volatile,
        isRisk: !!risk,
        isOpportunity: !!opportunity,
        palaceData: palaceData?.transformations || null
      }
    };
  }

  /**
   * Q14: 遷移/田宅變動（環境誘因）
   */
  function generateQ14(ziwei, overlapAnalysis, fourTransformations) {
    const liunian = fourTransformations?.liunian;
    const qianyiData = getPalaceTransformations(overlapAnalysis, "遷移");
    const tianzhaiData = getPalaceTransformations(overlapAnalysis, "田宅");

    let hook50 = `今年你的遷移宮和田宅宮，代表環境變動的誘因。`;
    
    if (liunian && (liunian.palace === "遷移" || liunian.palace === "田宅")) {
      hook50 = `今年流年在「${liunian.palace}宮」，代表你今年會有環境變動的誘因。`;
    }

    const reflection30 = `這種變動會讓你看到新的可能性，但也會讓你失去原有的安全感。你覺得這種變動是機會還是威脅？`;

    const capture20 = `關於遷移或田宅的變動，那個讓你最猶豫不決的決定是什麼？現況如何？`;

    return {
      id: 'Q14',
      palace: '遷移/田宅',
      dimension: '時間座標',
      title: '遷移/田宅變動（環境誘因）',
      hook50,
      reflection30,
      capture20,
      data: {
        qianyiTransformations: qianyiData?.transformations || null,
        tianzhaiTransformations: tianzhaiData?.transformations || null,
        hasLiunianChange: liunian && (liunian.palace === "遷移" || liunian.palace === "田宅")
      }
    };
  }

  /**
   * Q15: 能量收束（最後一問）
   */
  function generateQ15(ziwei, overlapAnalysis, fourTransformations, currentYear = 2026) {
    const hook50 = `綜合來看，你的系統在今年底會進入一個收縮期。`;

    const reflection30 = `這個收縮是為了明年的跳躍。你覺得你現在捨不得放下的那樣東西，真的能帶進下一個階段嗎？`;

    const capture20 = `今天我們聊完，你最想立刻做出改變的一個行動是什麼？`;

    return {
      id: 'Q15',
      palace: '綜合',
      dimension: '時間座標',
      title: '能量收束（最後一問）',
      hook50,
      reflection30,
      capture20,
      data: {
        currentYear
      }
    };
  }

  /**
   * 生成完整的15個戰略導引腳本
   */
  function generateConsultationScript(options = {}) {
    const {
      ziweiData,
      overlapAnalysis,
      fourTransformations,
      currentYear = new Date().getFullYear()
    } = options;

    if (!ziweiData || !overlapAnalysis || !fourTransformations) {
      return {
        error: '缺少必要數據',
        questions: []
      };
    }

    const questions = [
      generateQ1(ziweiData, overlapAnalysis, fourTransformations),
      generateQ2(ziweiData, overlapAnalysis, fourTransformations),
      generateQ3(ziweiData, overlapAnalysis, fourTransformations),
      generateQ4(ziweiData, overlapAnalysis, fourTransformations),
      generateQ5(ziweiData, overlapAnalysis, fourTransformations),
      generateQ6(ziweiData, overlapAnalysis, fourTransformations),
      generateQ7(ziweiData, overlapAnalysis, fourTransformations),
      generateQ8(ziweiData, overlapAnalysis, fourTransformations),
      generateQ9(ziweiData, overlapAnalysis, fourTransformations),
      generateQ10(ziweiData, overlapAnalysis, fourTransformations),
      generateQ11(ziweiData, overlapAnalysis, fourTransformations),
      generateQ12(ziweiData, overlapAnalysis, fourTransformations, currentYear),
      generateQ13(ziweiData, overlapAnalysis, fourTransformations),
      generateQ14(ziweiData, overlapAnalysis, fourTransformations),
      generateQ15(ziweiData, overlapAnalysis, fourTransformations, currentYear)
    ];

    return {
      questions,
      summary: {
        totalQuestions: questions.length,
        dimensions: {
          core: questions.filter(q => q.dimension === '核心本質').length,
          space: questions.filter(q => q.dimension === '空間配置').length,
          time: questions.filter(q => q.dimension === '時間座標').length
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 生成諮詢精華摘要（基於記錄的回答）
   */
  function generateConsultationSummary(script, answers) {
    if (!script || !script.questions) {
      return {
        error: '缺少腳本數據'
      };
    }

    const summary = {
      totalAnswered: 0,
      keyInsights: [],
      actionItems: [],
      emotionalPatterns: [],
      decisionPoints: [],
      timestamp: new Date().toISOString()
    };

    script.questions.forEach((q, index) => {
      const answer = answers[q.id] || answers[`Q${index + 1}`] || null;
      
      if (answer && answer.trim()) {
        summary.totalAnswered++;
        
        // 提取關鍵洞察（從20% capture回答中）
        if (q.id === 'Q15' || index === 14) {
          summary.actionItems.push({
            question: q.title,
            answer: answer
          });
        } else if (q.dimension === '時間座標') {
          summary.decisionPoints.push({
            question: q.title,
            answer: answer
          });
        } else {
          summary.keyInsights.push({
            question: q.title,
            answer: answer
          });
        }
      }
    });

    return summary;
  }

  // ====== 導出 ======

  if (typeof window !== "undefined") {
    window.ConsultationScriptEngine = {
      generateConsultationScript,
      generateConsultationSummary,
      generateQ1,
      generateQ2,
      generateQ3,
      generateQ4,
      generateQ5,
      generateQ6,
      generateQ7,
      generateQ8,
      generateQ9,
      generateQ10,
      generateQ11,
      generateQ12,
      generateQ13,
      generateQ14,
      generateQ15
    };
  } else if (typeof globalThis !== "undefined") {
    globalThis.ConsultationScriptEngine = {
      generateConsultationScript,
      generateConsultationSummary,
      generateQ1,
      generateQ2,
      generateQ3,
      generateQ4,
      generateQ5,
      generateQ6,
      generateQ7,
      generateQ8,
      generateQ9,
      generateQ10,
      generateQ11,
      generateQ12,
      generateQ13,
      generateQ14,
      generateQ15
    };
  }
})();
