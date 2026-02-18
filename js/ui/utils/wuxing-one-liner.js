/* wuxing-one-liner.js
 * 五行一句話註解與陰陽節奏計算
 * 導出到 window.UiUtils.WuxingOneLiner
 */

(function () {
  "use strict";

  /**
   * 從 strategic 五行計算陰陽比例
   * yang = 木+火；yin = 金+水+土
   * @param {Object} wxStrategic - { 木, 火, 土, 金, 水 }
   * @returns {{ yangPct: number, yinPct: number }}
   */
  function computeYinYangFromWuxing(wxStrategic) {
    if (!wxStrategic || typeof wxStrategic !== "object") {
      return { yangPct: 50, yinPct: 50 };
    }
    const 木 = Number(wxStrategic["木"]) || 0;
    const 火 = Number(wxStrategic["火"]) || 0;
    const 金 = Number(wxStrategic["金"]) || 0;
    const 水 = Number(wxStrategic["水"]) || 0;
    const 土 = Number(wxStrategic["土"]) || 0;
    const yang = 木 + 火;
    const yin = 金 + 水 + 土;
    const total = yang + yin;
    if (total <= 0) return { yangPct: 50, yinPct: 50 };
    return {
      yangPct: Math.round((yang / total) * 100),
      yinPct: Math.round((yin / total) * 100),
    };
  }

  /** 弱項固定建議句庫 */
  const WEAK_ADVICE = {
    火: "補火＝把行動拆小、提高曝光頻率：每天一個小輸出（貼文/簡報/提案），用節奏把熱度養回來。",
    水: "補水＝建立資訊與資源緩衝：做決策前先補三份資料、保留現金流/時間緩衝，讓你不必硬扛。",
    木: "補木＝加強長線規劃與人脈養分：每週固定學一件事、連結一個人，把成長變成制度。",
    金: "補金＝先定規則再談感受：把標準寫下來（界線/交付/時程），用流程取代情緒消耗。",
    土: "補土＝先做容器再做擴張：把任務收進週節點、固定回顧與結案，讓成果能堆疊而不是散掉。",
  };

  /** 弱項 baseDesc + 旺項修飾 */
  const WEAK_DESC = {
    火: {
      base: "想很多、規劃不差，但啟動與曝光常常慢半拍",
      mod: { 水: "，容易卡在安全感或完美才出手", 土: "，容易卡在安全感或完美才出手", 木: "，點子多但容易只停在規劃" },
    },
    水: {
      base: "行動與輸出可以很強，但資訊緩衝與資源流動不足，容易硬扛",
      mod: { 火: "，衝太快時更需要補資料與備案", 金: "，標準很高但容易缺少彈性調度" },
    },
    木: {
      base: "執行與收斂可能很強，但長期布局與人脈/學習線容易斷",
      mod: { 金: "，做事很有效率但不一定有長線養分", 土: "，能扛責任但容易保守、擴張不足" },
    },
    金: {
      base: "情感與想法流動，但界線、規格與風險控制較鬆，容易被人事拖累",
      mod: { 木: "，心軟或想太多時更容易失去標準", 水: "，心軟或想太多時更容易失去標準", 火: "，衝動決策時更需要規則護欄" },
    },
    土: {
      base: "想法與動能都有，但承載與落地不足，容易開太多線最後疲乏",
      mod: { 火: "，熱起來很快但不易持久", 水: "，資訊多但容易散，缺少收束容器" },
    },
  };

  /**
   * 根據五行強弱自動輸出一句繁體中文註解
   * @param {Object} wxStrategic - { 木, 火, 土, 金, 水 }
   * @returns {string}
   */
  function generateWuxingOneLiner(wxStrategic) {
    if (!wxStrategic || typeof wxStrategic !== "object") {
      return "五行資料不足：請先完成八字計算後再生成註解。";
    }
    const entries = Object.entries(wxStrategic)
      .filter(([, v]) => Number(v) > 0)
      .map(([k, v]) => [k, Number(v)]);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    if (total <= 0) return "五行資料不足：請先完成八字計算後再生成註解。";

    const sorted = entries.slice().sort((a, b) => b[1] - a[1]);
    const top1 = sorted[0];
    const top2 = sorted[1];
    const bottom = sorted[sorted.length - 1];
    if (!top1 || !bottom) return "五行資料不足：請先完成八字計算後再生成註解。";

    const top1Val = top1[1];
    const top2Val = top2 ? top2[1] : 0;
    const bottomVal = bottom[1];
    const useTwoWang = top2 && top2Val >= top1Val * 0.9;

    const wangLabel = useTwoWang ? top1[0] + top2[0] + "偏旺" : top1[0] + "旺";
    const weakLabel = bottom[0] + (useTwoWang ? "偏弱" : "弱");

    const weakDesc = WEAK_DESC[bottom[0]];
    if (!weakDesc) return wangLabel + weakLabel + "；" + (WEAK_ADVICE[bottom[0]] || "");

    let desc = weakDesc.base;
    if (useTwoWang && top2) {
      if (weakDesc.mod[top1[0]]) desc += weakDesc.mod[top1[0]];
      else if (weakDesc.mod[top2[0]]) desc += weakDesc.mod[top2[0]];
    } else if (weakDesc.mod[top1[0]]) {
      desc += weakDesc.mod[top1[0]];
    }
    const advice = WEAK_ADVICE[bottom[0]] || "";
    return wangLabel + weakLabel + "：" + desc + "；" + advice;
  }

  /** 五行超載固定句庫：普通超載、嚴重超載、戰術指令 */
  const OVERLOAD_LIB = {
    火: {
      normal: "火勢過旺＝行動與消耗過快。你會衝得很前面，但後續承載跟不上，容易疲乏或人際摩擦升高。",
      severe: "火勢嚴重超載＝先衝再補制度。高曝光、高消耗、高情緒輸出同時發生，若不減速，容易透支與決策失準。",
      tactic: "降火＝減少同時進行的專案數量，設定『冷卻日』與無輸出日，讓節奏重新回到可承載範圍。",
    },
    水: {
      normal: "水勢過旺＝思考與資訊流動過多。你會看得很遠，但行動被延後，猶豫與焦慮感上升。",
      severe: "水勢嚴重超載＝資訊過量壓制決策。你會一直優化方案，但遲遲不落地。",
      tactic: "降水＝限制資訊攝取時間，做『48小時決策制』：兩天內必須做出行動版本，而不是最佳版本。",
    },
    木: {
      normal: "木勢過旺＝持續擴張與推進，但資源分散，容易同時開太多線。",
      severe: "木勢嚴重超載＝過度成長導致結構鬆動。你會一直向外延伸，但內部未同步強化。",
      tactic: "降木＝停止新增專案 30 天，只優化既有主線，砍掉最耗能卻最低回報的一項。",
    },
    土: {
      normal: "土勢過旺＝過度穩定與保守。你會守得很好，但機會窗口可能被錯過。",
      severe: "土勢嚴重超載＝安全感優先壓制變化。你會傾向維持現狀，即使外部節奏已改變。",
      tactic: "降土＝設定『實驗比例』：每月保留 15% 資源做嘗試，不求穩定，只求突破。",
    },
    金: {
      normal: "金勢過旺＝標準與控制強烈。效率高，但彈性與人情流動降低。",
      severe: "金勢嚴重超載＝規則壓過創造。你會傾向完美與精準，但團隊或人際會感到壓力。",
      tactic: "降金＝允許 20% 不完美，將流程改為『迭代制』而非一次到位。",
    },
  };

  /**
   * 五行超載判定與建議
   * @param {Object} wxObj - { 木, 火, 土, 金, 水 }
   * @returns {{ overloadElement: string, level: "normal"|"severe", adviceText: string } | null}
   */
  function getOverloadAdvice(wxObj) {
    if (!wxObj || typeof wxObj !== "object") return null;
    const keys = ["木", "火", "土", "金", "水"];
    const values = keys.map((k) => Number(wxObj[k]) || 0);
    const total = values.reduce((a, b) => a + b, 0);
    if (total <= 0) return null;

    const pcts = keys.map((k, i) => ({ key: k, pct: values[i] / total }));
    const overloaded = pcts.filter((p) => p.pct >= 0.33).sort((a, b) => b.pct - a.pct);
    if (overloaded.length === 0) return null;

    const top = overloaded[0];
    const second = overloaded[1];
    const isSevere = top.pct >= 0.4;
    const isDual = second && second.pct >= 0.33;

    const elem = isDual ? top.key + second.key : top.key;
    const lib = OVERLOAD_LIB[top.key];
    if (!lib) return null;

    const desc = isSevere ? lib.severe : lib.normal;
    const adviceText = desc + "\n\n" + lib.tactic;
    if (isDual && second) {
      const lib2 = OVERLOAD_LIB[second.key];
      const desc2 = lib2 ? (top.pct >= 0.4 ? lib2.severe : lib2.normal) : "";
      const tactic2 = lib2 ? lib2.tactic : "";
      return {
        overloadElement: elem,
        level: isSevere ? "severe" : "normal",
        adviceText: `${desc}\n\n${lib.tactic}${desc2 ? "\n\n" + desc2 + "\n\n" + tactic2 : ""}`,
      };
    }
    return {
      overloadElement: elem,
      level: isSevere ? "severe" : "normal",
      adviceText,
    };
  }

  if (!window.UiUtils) window.UiUtils = {};
  window.UiUtils.WuxingOneLiner = {
    computeYinYangFromWuxing,
    generateWuxingOneLiner,
    getOverloadAdvice,
  };
})();
