/* strategic-panel.js
 * 戰略面板組件 - 重構版
 * 實現命主/身主分離、五行可視化、十神戰略卡片、50/30/20 諮詢格式
 * 依賴: window.Calc, window.UiRenderHelpers, window.UiDomHelpers
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  // 延遲檢查依賴
  function getDependencies() {
    if (!window.Calc) {
      throw new Error("strategic-panel.js requires window.Calc");
    }
    if (!window.UiRenderHelpers) {
      throw new Error("strategic-panel.js requires window.UiRenderHelpers");
    }
    if (!window.UiDomHelpers) {
      throw new Error("strategic-panel.js requires window.UiDomHelpers");
    }
    return {
      Calc: window.Calc,
      UiRenderHelpers: window.UiRenderHelpers,
      UiDomHelpers: window.UiDomHelpers,
    };
  }

  /**
   * 獲取命主和身主星曜
   */
  function getMasterStars(ziwei) {
    if (!ziwei || !ziwei.core) return { mingzhu: null, shengong: null };
    
    // 從紫微數據中獲取命主和身主
    const mingzhu = ziwei.core.mingzhu || null;
    const shengong = ziwei.core.shengong || null;
    
    return { mingzhu, shengong };
  }

  /**
   * 獲取星曜核心價值描述
   */
  function getStarCoreValue(starName) {
    // 簡化的星曜核心價值映射（可以擴展）
    const coreValues = {
      "紫微": "權威與領導",
      "天機": "智慧與變通",
      "太陽": "光明與熱情",
      "武曲": "效率與執行",
      "天同": "和諧與享受",
      "廉貞": "複雜與多變",
      "天府": "穩定與包容",
      "太陰": "溫柔與內斂",
      "貪狼": "慾望與創造",
      "巨門": "溝通與分析",
      "天相": "協調與服務",
      "天梁": "穩重與保護",
      "七殺": "果斷與變革",
      "破軍": "破壞與重建",
    };
    return coreValues[starName] || "獨特個性";
  }

  /**
   * 解析五行數據為百分比
   */
  function parseFiveElementsData(wuxing) {
    if (!wuxing) return null;
    
    const elements = ["金", "木", "水", "火", "土"];
    const total = Object.values(wuxing).reduce((sum, val) => sum + (val || 0), 0);
    
    if (total === 0) return null;
    
    return elements.map(name => ({
      name,
      value: wuxing[name] || 0,
      percentage: total > 0 ? Math.round(((wuxing[name] || 0) / total) * 100) : 0,
    }));
  }

  /**
   * 解析十神建議為行動和禁忌清單
   */
  function parseTenGodAdvice(tenGodText) {
    if (!tenGodText) return { actions: [], prohibitions: [] };
    
    const actions = [];
    const prohibitions = [];
    
    // 簡單的正則匹配（可以改進）
    const actionPatterns = [
      /(?:應該|建議|可以|適合).*?[。；]/g,
      /(?:建立|爭取|加強|提升).*?[。；]/g,
    ];
    
    const prohibitionPatterns = [
      /(?:不要|避免|禁止|不適合).*?[。；]/g,
      /(?:避免|拒絕|不要).*?[。；]/g,
    ];
    
    actionPatterns.forEach(pattern => {
      const matches = tenGodText.match(pattern);
      if (matches) {
        actions.push(...matches.map(m => m.replace(/[。；]$/, "")));
      }
    });
    
    prohibitionPatterns.forEach(pattern => {
      const matches = tenGodText.match(pattern);
      if (matches) {
        prohibitions.push(...matches.map(m => m.replace(/[。；]$/, "")));
      }
    });
    
    return { actions, prohibitions };
  }

  /**
   * 渲染戰略面板
   */
  function renderStrategicPanel(params) {
    const { bazi, dbContent, ziweiPalaceMetadata, liuyueData } = params;
    const deps = getDependencies();
    
    const tacticalBox = document.getElementById("tacticalBox");
    if (!tacticalBox) return;
    
    const ziwei = ziweiPalaceMetadata?.ziwei || null;
    const { mingzhu, shengong } = getMasterStars(ziwei);
    
    // 獲取十神主軸
    const dominant = (bazi?.tenGod?.dominant || "").trim();
    const tenGodText = dominant && dbContent?.tenGods?.[dominant] 
      ? dbContent.tenGods[dominant] 
      : "";
    
    // 解析五行數據
    const wuxingData = parseFiveElementsData(bazi?.wuxing?.strategic);
    
    // 解析十神建議
    const { actions, prohibitions } = parseTenGodAdvice(tenGodText);
    
    // 構建 HTML
    let html = '<div class="space-y-6">';
    
    // Section A: 原廠設定與當前武裝 (The DNA)
    html += '<div class="space-y-4">';
    html += '<div class="text-sm font-black text-amber-400 mb-3">Section A: 原廠設定與當前武裝 (The DNA)</div>';
    
    // 命主
    if (mingzhu) {
      const coreValue = getStarCoreValue(mingzhu);
      html += `
        <div class="p-4 rounded-xl border border-amber-400/40 bg-white/5">
          <div class="text-xs text-slate-400 mb-2">本命基因（命主）</div>
          <div class="text-lg font-black text-amber-400 mb-2">${mingzhu}</div>
          <div class="text-sm text-slate-300 leading-relaxed">
            🎯 直擊 (50%)<br>
            「你骨子裡是個 ${mingzhu} 的人，追求的是 ${coreValue}。」
          </div>
        </div>
      `;
    }
    
    // 身主
    if (shengong) {
      const mingzhuCoreValue = mingzhu ? getStarCoreValue(mingzhu) : "核心價值";
      html += `
        <div class="p-4 rounded-xl border border-blue-400/40 bg-white/5 mt-3">
          <div class="text-xs text-slate-400 mb-2">後天工具（身主）</div>
          <div class="text-lg font-black text-blue-400 mb-2">${shengong}</div>
          <div class="text-sm text-slate-300 leading-relaxed">
            💭 啟發 (30%)<br>
            「雖然你靈魂追求 ${mingzhuCoreValue}，但你這幾年越來越習慣用 ${shengong} 的方式來應對世界，這讓你感到更安全還是更疲累？」
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    
    // Section B: 2026 能量天氣預報 (The Environment)
    if (wuxingData) {
      html += '<div class="space-y-4 mt-6">';
      html += '<div class="text-sm font-black text-amber-400 mb-3">Section B: 2026 能量天氣預報 (The Environment)</div>';
      
      // 五行進度條
      wuxingData.forEach(elem => {
        const isHigh = elem.percentage >= 30;
        const colorClass = isHigh ? "bg-red-500" : elem.percentage >= 20 ? "bg-yellow-500" : "bg-green-500";
        html += `
          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-slate-300">${elem.name}能量</span>
              <span class="text-slate-400">${elem.percentage}%</span>
            </div>
            <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full ${colorClass} transition-all duration-300" style="width: ${elem.percentage}%"></div>
            </div>
            ${isHigh ? '<div class="text-xs text-red-400">⚠️ 系統超載預警</div>' : ''}
          </div>
        `;
      });
      
      html += '</div>';
    }
    
    // Section C: 十神戰略 (The Strategy)
    if (dominant && tenGodText) {
      html += '<div class="space-y-4 mt-6">';
      html += `<div class="text-sm font-black text-amber-400 mb-3">Section C: 十神戰略：${dominant}模式 (The Strategy)</div>`;
      
      html += `
        <div class="p-4 rounded-xl border border-emerald-400/40 bg-white/5">
          <div class="text-xs text-slate-400 mb-2">年度主旋律</div>
          <div class="text-sm font-black text-emerald-400 mb-4">「從想做，到必須做。」</div>
          
          ${actions.length > 0 ? `
            <div class="mb-3">
              <div class="text-xs text-green-400 mb-2">✅ 行動清單</div>
              <ul class="text-xs text-slate-300 space-y-1 ml-4">
                ${actions.map(a => `<li>• ${a}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${prohibitions.length > 0 ? `
            <div class="mb-3">
              <div class="text-xs text-red-400 mb-2">❌ 禁忌清單</div>
              <ul class="text-xs text-slate-300 space-y-1 ml-4">
                ${prohibitions.map(p => `<li>• ${p}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="mt-4 pt-4 border-t border-white/10">
            <div class="text-xs text-slate-400 mb-2">📝 採集 (20%)</div>
            <textarea 
              id="tenGodCapture20" 
              class="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
              rows="3"
              placeholder="你對今年的「${dominant}模式」有什麼想法？有什麼具體的計劃或擔憂？"
            ></textarea>
            <div class="text-xs text-slate-500 mt-1" id="tenGodCaptureStatus"></div>
          </div>
        </div>
      `;
      
      html += '</div>';
      
      // 綁定自動保存
      setTimeout(() => {
        const textarea = document.getElementById("tenGodCapture20");
        const statusDiv = document.getElementById("tenGodCaptureStatus");
        if (textarea && statusDiv) {
          let saveTimeout;
          textarea.addEventListener("input", function() {
            clearTimeout(saveTimeout);
            const value = this.value.trim();
            if (value) {
              const chartId = bazi?.chartId || `chart_${Date.now()}`;
              const data = {
                chartId,
                tenGod: dominant,
                answer: value,
                timestamp: new Date().toISOString(),
              };
              try {
                localStorage.setItem(`tenGodCapture_${chartId}`, JSON.stringify(data));
                statusDiv.textContent = "✓ 已保存";
                statusDiv.className = "text-xs text-green-400 mt-1";
                setTimeout(() => {
                  statusDiv.textContent = "";
                }, 2000);
              } catch (e) {
                console.warn("無法保存到 localStorage:", e);
              }
            }
          });
        }
      }, 100);
    }
    
    html += '</div>';
    
    tacticalBox.innerHTML = html;
  }

  // 導出
  if (typeof window !== "undefined") {
    if (!window.UiComponents) {
      window.UiComponents = {};
    }
    window.UiComponents.StrategicPanel = {
      renderStrategicPanel,
    };
  }
})();
