/* calc/tactics.js
 * 动态战术建议生成模块
 * 从 calc.js 中提取，用于模块化架构
 * 依赖 calc/constants.js, calc/helpers.js, calc/ziweiOutput.js
 */

(function () {
  "use strict";

  // 检查依赖
  if (typeof window === "undefined" || !window.CalcHelpers) {
    throw new Error("calc/tactics.js requires calc/helpers.js to be loaded first");
  }
  if (typeof window === "undefined" || !window.CalcOutput) {
    throw new Error("calc/tactics.js requires calc/ziweiOutput.js to be loaded first");
  }

  // 从 helpers.js 解构需要的函数
  const {
    pctFromWx,
  } = window.CalcHelpers;

  // 从 CalcOutput 解构需要的函数
  const {
    parseMonthFromRange,
    mapScoreToInternalLevel,
  } = window.CalcOutput;

  /**
   * 動態戰術提示：保持「計算」本體；十神解釋文字由 UI 傳入（避免 calc.js 依賴 dbContent）
   * 增強版：整合紫微宮位分級和流月數據
   * 
   * @param {Object} bazi 八字資料
   * @param {string} tenGodText 十神解釋文字（由 UI 傳入）
   * @param {Object} ziweiPalaceMetadata 紫微宮位元數據（可選）
   * @param {Object} liuyueData 流月數據（可選）
   * @returns {Array<{tone: string, text: string}>} 戰術建議陣列
   */
  function computeDynamicTactics(bazi, tenGodText, ziweiPalaceMetadata = null, liuyueData = null) {
    const out = [];
    const dominant = (bazi?.tenGod?.dominant || "").trim();
    const wx = bazi?.wuxing?.strategic || null;
    
    // 1. 五行佔比建議（增強版：結合紫微宮位和流月數據）
    if (wx) {
      const { pct } = pctFromWx(wx);
      
      // 獲取高風險月份數量（用於個人化建議）
      const highRiskMonths = liuyueData?.bounds?.filter(m => {
        const risk = Number(m.riskScore) || 0;
        return risk >= 65; // 風險指數 >= 65 視為高風險
      }) || [];
      const highRiskMonthNames = highRiskMonths.length > 0 
        ? highRiskMonths.map(m => {
            const monthNum = parseMonthFromRange(m.range);
            return monthNum ? monthNum + "月" : "";
          }).filter(Boolean).join("、")
        : "";
      
      // 獲取最強和最弱宮位（用於個人化建議）
      let topPalaceName = "";
      let weakPalaceName = "";
      if (ziweiPalaceMetadata && typeof ziweiPalaceMetadata === 'object') {
        const palaceEntries = Object.entries(ziweiPalaceMetadata)
          .filter(([name, data]) => data && typeof data === 'object' && data.internalLevel != null)
          .map(([name, data]) => ({ name, internalLevel: data.internalLevel || 3 }))
          .sort((a, b) => b.internalLevel - a.internalLevel);
        if (palaceEntries.length > 0) {
          topPalaceName = palaceEntries[0]?.name || "";
          weakPalaceName = palaceEntries[palaceEntries.length - 1]?.name || "";
        }
      }
      
      // 火佔比偏高：結合高風險月份和弱勢宮位
      if (pct["火"] >= 0.35) {
        let fireAdvice = "🔥 火佔比偏高：今年做重大決策建議「冷卻 48 小時」，先寫下風險清單再拍板。";
        if (highRiskMonthNames) {
          fireAdvice += `特別注意${highRiskMonthNames}，這幾個月火氣最旺，建議提前規劃緩衝機制。`;
        }
        if (weakPalaceName && (weakPalaceName === "疾厄" || weakPalaceName === "父母")) {
          fireAdvice += `你的${weakPalaceName}能量較弱，火旺年容易過勞，建議設定「健康紅線」：每週至少休息一天，避免連續熬夜。`;
        }
        out.push({ tone: "red", text: fireAdvice });
      }
      
      // 水佔比偏低：結合最強宮位和流月高能月份
      if (pct["水"] <= 0.10) {
        let waterAdvice = "💧 水佔比偏低：需要刻意補充資訊與資源流動（跨界交流、建立資料庫、做現金流緩衝）。";
        if (topPalaceName === "財帛" || topPalaceName === "官祿") {
          waterAdvice += `你的${topPalaceName}能量強，但水不足容易讓資源流動卡住。建議建立「資訊中轉站」：定期整理知識庫、建立人脈檔案，讓資源能持續流動。`;
        }
        out.push({ tone: "blue", text: waterAdvice });
      }
      
      // 金佔比偏高：結合官祿宮和執行月份
      if (pct["金"] >= 0.35) {
        let metalAdvice = "⚔️ 金佔比偏高：執行標準強，但易讓合作壓力上升。建議用流程取代情緒，先對齊規格再要求速度。";
        if (topPalaceName === "官祿") {
          metalAdvice += `你的官祿宮能量強，但金過多容易讓合作關係變硬。建議在流程中保留「彈性窗口」：每週留 20% 時間處理突發狀況，避免過度僵化。`;
        }
        out.push({ tone: "slate", text: metalAdvice });
      }
      
      // 土佔比偏高：結合田宅宮和穩定月份
      if (pct["土"] >= 0.40) {
        let earthAdvice = "⛰️ 土佔比偏高：承載力強但節奏易鈍。建議把大目標拆成週節點，用儀表板推進而不是靠意志力。";
        if (topPalaceName === "田宅" || topPalaceName === "父母") {
          earthAdvice += `你的${topPalaceName}能量強，土多代表穩定，但要注意「慣性陷阱」。建議設定「突破日」：每月選一天嘗試新方法，避免被既有模式綁住。`;
        }
        out.push({ tone: "amber", text: earthAdvice });
      }
      
      // 木佔比偏高：結合遷移宮和擴張月份
      if (pct["木"] >= 0.35) {
        let woodAdvice = "🌲 木佔比偏高：擴張與規劃很強，但注意戰線過多。建議做『剪枝』：砍掉 20% 不必要任務，成果會更大。";
        if (topPalaceName === "遷移" || topPalaceName === "子女") {
          woodAdvice += `你的${topPalaceName}能量強，木多代表成長動能，但容易「開花不結果」。建議設定「收成日」：每季選一個專案完成到 100%，而不是同時推進多個到 60%。`;
        }
        out.push({ tone: "green", text: woodAdvice });
      }
    }

    // 2. 十神主軸建議（增強版：結合紫微宮位和流月數據，提供個人化建議）
    if (dominant) {
      // 獲取關鍵數據用於個人化
      let topPalaces = [];
      let weakPalaces = [];
      let highEnergyMonths = [];
      let lowEnergyMonths = [];
      let subjectivePalace = null;
      
      if (ziweiPalaceMetadata && typeof ziweiPalaceMetadata === 'object') {
        const palaceEntries = Object.entries(ziweiPalaceMetadata)
          .filter(([name, data]) => data && typeof data === 'object' && data.internalLevel != null)
          .map(([name, data]) => ({
            name,
            internalLevel: data.internalLevel || 3,
            stars: data.stars || 3.0,
            isSubjectiveFocus: data.isSubjectiveFocus || false
          }))
          .sort((a, b) => b.internalLevel - a.internalLevel);
        
        topPalaces = palaceEntries.filter(p => p.internalLevel >= 4).slice(0, 3);
        weakPalaces = palaceEntries.filter(p => p.internalLevel <= 2).slice(-3).reverse();
        subjectivePalace = palaceEntries.find(p => p.isSubjectiveFocus);
      }
      
      if (liuyueData && Array.isArray(liuyueData.bounds) && liuyueData.bounds.length > 0) {
        const monthlyRatings = [];
        liuyueData.bounds.forEach((month, index) => {
          const monthNum = parseMonthFromRange(month.range) || (index + 1);
          const riskScore = Number(month.riskScore) || 0;
          const energyScore = 100 - riskScore;
          const allEnergyScores = {};
          liuyueData.bounds.forEach((m, idx) => {
            const mNum = parseMonthFromRange(m.range) || (idx + 1);
            const mRisk = Number(m.riskScore) || 0;
            allEnergyScores[mNum] = 100 - mRisk;
          });
          const internalLevel = mapScoreToInternalLevel(energyScore, allEnergyScores);
          monthlyRatings.push({ monthNum, monthName: monthNum + "月", internalLevel });
        });
        highEnergyMonths = monthlyRatings.filter(m => m.internalLevel >= 4).slice(0, 3);
        lowEnergyMonths = monthlyRatings.filter(m => m.internalLevel <= 2).slice(0, 3);
      }
      
      // 構建個人化建議
      let personalizedAdvice = "";
      
      // 根據最強宮位提供建議
      if (topPalaces.length > 0) {
        const topNames = topPalaces.map(p => p.name).join("、");
        personalizedAdvice += `你的優勢領域（${topNames}）能量強，建議在這些領域設定「年度目標」，用${dominant}的規則化方式推進。`;
      }
      
      // 根據最弱宮位提供建議
      if (weakPalaces.length > 0) {
        const weakNames = weakPalaces.map(p => p.name).join("、");
        personalizedAdvice += `你的調整領域（${weakNames}）能量較弱，${dominant}年建議優先處理這些領域的風險控管，避免過度擴張。`;
      }
      
      // 根據高能月份提供建議
      if (highEnergyMonths.length > 0) {
        const highMonthNames = highEnergyMonths.map(m => m.monthName).join("、");
        personalizedAdvice += `年度高能月份（${highMonthNames}）適合執行重要決策，建議提前規劃，用${dominant}的系統化方式推進。`;
      }
      
      // 根據低能月份提供建議
      if (lowEnergyMonths.length > 0) {
        const lowMonthNames = lowEnergyMonths.map(m => m.monthName).join("、");
        personalizedAdvice += `年度調整月份（${lowMonthNames}）建議優先守成，避免在這些月份做出重大變動。`;
      }
      
      // 根據小限宮位提供建議
      if (subjectivePalace) {
        personalizedAdvice += `你的年度生命重心在${subjectivePalace.name}，${dominant}能量會在這個領域特別明顯，建議特別關注並適時調整節奏。`;
      }
      
      // 組合完整建議
      if (tenGodText) {
        // 如果有完整的十神文字，在開頭加入個人化建議
        const personalizedPrefix = personalizedAdvice 
          ? `【個人化建議】${personalizedAdvice}\n\n`
          : "";
        out.push({ 
          tone: "amber", 
          text: `🧭 十神主軸（${dominant}）：${personalizedPrefix}${tenGodText}` 
        });
      } else {
        // 如果沒有完整文字，提供基礎建議 + 個人化建議
        const baseAdvice = `今年用「流程化、規則化」方式推進，壓力月先守規則再談突破。`;
        const fullAdvice = personalizedAdvice 
          ? `${baseAdvice} ${personalizedAdvice}`
          : baseAdvice;
        out.push({ 
          tone: "amber", 
          text: `🧭 十神主軸（${dominant}）：${fullAdvice}` 
        });
      }
    }

    // 3. 紫微宮位分級建議（新增）
    if (ziweiPalaceMetadata && typeof ziweiPalaceMetadata === 'object') {
      const palaceEntries = Object.entries(ziweiPalaceMetadata)
        .filter(([name, data]) => data && typeof data === 'object' && data.internalLevel != null)
        .map(([name, data]) => ({
          name,
          internalLevel: data.internalLevel || 3,
          stars: data.stars || 3.0,
          statusLabel: data.statusLabel || (typeof window !== "undefined" && window.I18n && window.I18n.t("ui.statusStable")) || "平穩",
          oneLiner: data.oneLiner || name,
          isSubjectiveFocus: data.isSubjectiveFocus || false
        }))
        .sort((a, b) => b.internalLevel - a.internalLevel); // 按等級降序排列

      if (palaceEntries.length > 0) {
        // 找出最強的3個宮位（等級5或4）
        const topPalaces = palaceEntries.filter(p => p.internalLevel >= 4).slice(0, 3);
        if (topPalaces.length > 0) {
          const topNames = topPalaces.map(p => p.name).join("、");
          const topStars = topPalaces.map(p => p.stars.toFixed(1)).join("、");
          out.push({ 
            tone: "emerald", 
            text: `⭐ 年度優勢領域（${topNames}）：這三個宮位能量最強（${topStars}星），建議優先投入資源，把握優勢時機推進重要計畫。` 
          });
        }

        // 找出最弱的3個宮位（等級1或2）
        const weakPalaces = palaceEntries.filter(p => p.internalLevel <= 2).slice(-3).reverse();
        if (weakPalaces.length > 0) {
          const weakNames = weakPalaces.map(p => p.name).join("、");
          const weakStars = weakPalaces.map(p => p.stars.toFixed(1)).join("、");
          out.push({ 
            tone: "slate", 
            text: `⚡ 年度調整領域（${weakNames}）：這三個宮位能量較弱（${weakStars}星），建議優先處理風險控管，避免在這些領域做過度擴張。` 
          });
        }

        // 小限宮位特別提醒
        const subjectivePalace = palaceEntries.find(p => p.isSubjectiveFocus);
        if (subjectivePalace) {
          out.push({ 
            tone: "amber", 
            text: `🎯 年度生命重心（${subjectivePalace.name}）：此領域為你本年度的生命重心，波動感將會特別強烈，建議特別關注並適時調整節奏。` 
          });
        }
      }
    }

    // 4. 流月分級建議（新增）
    if (liuyueData && Array.isArray(liuyueData.bounds) && liuyueData.bounds.length > 0) {
      // 計算所有月份的評級
      const monthlyRatings = [];
      liuyueData.bounds.forEach((month, index) => {
        const monthNum = parseMonthFromRange(month.range) || (index + 1);
        const riskScore = Number(month.riskScore) || 0;
        const energyScore = 100 - riskScore;
        
        // 使用相對排名計算等級（與流月計算邏輯一致）
        const allEnergyScores = {};
        liuyueData.bounds.forEach((m, idx) => {
          const mNum = parseMonthFromRange(m.range) || (idx + 1);
          const mRisk = Number(m.riskScore) || 0;
          allEnergyScores[mNum] = 100 - mRisk;
        });
        
        const internalLevel = mapScoreToInternalLevel(energyScore, allEnergyScores);
        monthlyRatings.push({
          monthNum,
          monthName: monthNum + "月",
          range: month.range,
          internalLevel,
          energyScore,
          riskScore
        });
      });

      // 找出能量最高的3個月（等級5或4）
      const topMonths = monthlyRatings
        .filter(m => m.internalLevel >= 4)
        .sort((a, b) => b.internalLevel - a.internalLevel)
        .slice(0, 3);
      
      if (topMonths.length > 0) {
        const topMonthNames = topMonths.map(m => m.monthName).join("、");
        out.push({ 
          tone: "green", 
          text: `📅 年度高能月份（${topMonthNames}）：這幾個月能量通道完全開啟，適合執行高槓桿計畫、啟動重要專案或做出重大決策。` 
        });
      }

      // 找出能量最低的3個月（等級1或2）
      const lowMonths = monthlyRatings
        .filter(m => m.internalLevel <= 2)
        .sort((a, b) => a.internalLevel - b.internalLevel)
        .slice(0, 3);
      
      if (lowMonths.length > 0) {
        const lowMonthNames = lowMonths.map(m => m.monthName).join("、");
        out.push({ 
          tone: "orange", 
          text: `⚠️ 年度調整月份（${lowMonthNames}）：這幾個月系統負荷較高，建議優先執行風險控管，暫緩重大決策，保持穩定節奏。` 
        });
      }
    }

    return out;
  }

  // ====== 導出 ======

  // 導出到 window.CalcTactics（如果 window 存在）
  if (typeof window !== "undefined") {
    window.CalcTactics = {
      computeDynamicTactics,
    };
  } else if (typeof globalThis !== "undefined") {
    // 讓 Node / 測試環境也能引用
    globalThis.CalcTactics = {
      computeDynamicTactics,
    };
  }
})();
