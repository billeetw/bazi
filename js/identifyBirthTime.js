/**
 * identifyBirthTime.js (V4：18+1 題)
 * 推算時辰問卷：僅提供題目文本（無權重、無地支說明），推算由後端 POST /api/estimate-hour 完成。
 * 前端不得存放任何加權數值或五行/地支對應。（本地/離線時若 API 不可用，則使用內建 fallback 以利測試。）
 */

(function (global) {
  "use strict";

  /** 遠端 API 基底（同源 /api 失敗時使用，例如本地靜態伺服器無 API） */
  var REMOTE_API_BASE = "https://17gonplay-api.billeetw.workers.dev";

  /** V4 題庫：僅 id、text、options(key+text)；Q1/Q2 為複選最多 2 項，其餘單選 */
  const QUESTIONS = [
    { id: "q1", text: "你一天中「精神最亮、效率最高」的時段是哪些？（可複選，至多 2 項）", options: [{ key: "A", text: "清晨（5–9 點）" }, { key: "B", text: "上午（9–12 點）" }, { key: "C", text: "下午（12–17 點）" }, { key: "D", text: "傍晚（17–20 點）" }, { key: "E", text: "深夜（20–01 點）" }, { key: "F", text: "凌晨（01–05 點）" }], multiSelect: true, maxSelect: 2 },
    { id: "q2", text: "哪些時段你會覺得「比較有動力／比較想行動」？（可複選，至多 2 項）", options: [{ key: "A", text: "清晨" }, { key: "B", text: "上午" }, { key: "C", text: "下午" }, { key: "D", text: "傍晚" }, { key: "E", text: "深夜" }, { key: "F", text: "凌晨" }], multiSelect: true, maxSelect: 2 },
    { id: "q3", text: "若不看外在作息，你的「自然節律」比較像？", options: [{ key: "A", text: "早上自然精神好" }, { key: "B", text: "早餐後才有狀態" }, { key: "C", text: "上午暖機、下午更強" }, { key: "D", text: "晚上精神最好" }, { key: "E", text: "半夜最有靈感" }] },
    { id: "q4", text: "突然遇到亂局或壓力時，你的第一反應是？", options: [{ key: "A", text: "立刻整理、重整" }, { key: "B", text: "想找新方向、突破" }, { key: "C", text: "先觀察再判斷" }, { key: "D", text: "情緒先冒出來" }, { key: "E", text: "先維持當前穩定" }] },
    { id: "q5", text: "你恢復能量最常用的方法是？", options: [{ key: "A", text: "整理或規劃" }, { key: "B", text: "換個地方走走" }, { key: "C", text: "聽音樂／放空" }, { key: "D", text: "和人互動" }, { key: "E", text: "休息或吃東西" }] },
    { id: "q6", text: "做決定時你最依賴？", options: [{ key: "A", text: "資料與邏輯" }, { key: "B", text: "大方向感" }, { key: "C", text: "直覺感受" }, { key: "D", text: "當下情緒" }, { key: "E", text: "風險與安全性" }] },
    { id: "q7", text: "面對「效率低」的情況你會怎麼反應？", options: [{ key: "A", text: "幾乎不能忍" }, { key: "B", text: "有點煩但還能忍" }, { key: "C", text: "取決於狀況" }, { key: "D", text: "可以接受" }, { key: "E", text: "自己有時也會慢" }] },
    { id: "q8", text: "你傾向如何管理資源（時間、金錢、注意力）？", options: [{ key: "A", text: "放在自己掌控裡" }, { key: "B", text: "讓它們流動起來" }, { key: "C", text: "優化、提升效率" }, { key: "D", text: "彈性看狀況調整" }, { key: "E", text: "靠人際協作去運作" }] },
    { id: "q9", text: "啟動行動時，你更像？", options: [{ key: "A", text: "想提升效率" }, { key: "B", text: "想換環境／變化" }] },
    { id: "q10", text: "完成品對你來說比較重要的是？", options: [{ key: "A", text: "好用、順、邏輯通" }, { key: "B", text: "美感、和諧、自然" }] },
    { id: "q11", text: "面對責任時，你更偏向？", options: [{ key: "A", text: "責任要分清楚" }, { key: "B", text: "對重要的人願意扛" }] },
    { id: "q12", text: "你的能量主要來自？", options: [{ key: "A", text: "行動、互動、主動性" }, { key: "B", text: "靜下來、感受、沉澱" }] },
    { id: "q13", text: "開始做一件事時，你更像？", options: [{ key: "A", text: "先做起來再調整" }, { key: "B", text: "先弄清楚方向再開始" }] },
    { id: "q14", text: "你照顧別人的方式更像？", options: [{ key: "A", text: "陪伴、提供情緒支持" }, { key: "B", text: "帮忙把事情安排好" }] },
    { id: "q15", text: "遇到衝突時你通常？", options: [{ key: "A", text: "直接講開" }, { key: "B", text: "換環境或離開一下" }, { key: "C", text: "觀察一下再處理" }, { key: "D", text: "情緒先出來" }, { key: "E", text: "先放著，等穩定再說" }] },
    { id: "q16", text: "你的靈感通常來自？", options: [{ key: "A", text: "舊方式被打破" }, { key: "B", text: "看到新可能" }, { key: "C", text: "放空或夢境" }, { key: "D", text: "情緒飽滿時" }, { key: "E", text: "穩定進行中突然想到" }] },
    { id: "q17", text: "第一次面對陌生情境／陌生人時你的傾向是？", options: [{ key: "A", text: "越互動越順" }, { key: "B", text: "先找共同點" }, { key: "C", text: "先感受對方氣氛" }, { key: "D", text: "很快帶動互動" }, { key: "E", text: "放輕鬆、慢慢來" }] },
    { id: "q18", text: "最直覺地說，你認為自己更像哪種類型？", options: [{ key: "A", text: "執行型" }, { key: "B", text: "觀察型／軍師型" }, { key: "C", text: "推動者／領導型" }, { key: "D", text: "穩定可靠型" }, { key: "E", text: "連結協調型" }, { key: "F", text: "改變與創新型" }] },
    { id: "q19", text: "你一天的精神高峰通常比別人來得早還是晚？", options: [{ key: "A", text: "偏早" }, { key: "B", text: "偏晚" }] },
  ];

  /**
   * 本地 fallback：與後端 V4 邏輯一致，僅在 API 不可用時使用（本地測試／離線）。
   * @param {Object} answers - q1,q2 為 string[]，其餘為 string
   * @returns {{ branch: string, hour_label: string, hour_range: string, half: string }}
   */
  function estimateHourLocal(answers) {
    var BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    var TIE_ORDER = BRANCHES.slice();
    var HOUR_RANGES = { 子: "23:00-01:00", 丑: "01:00-03:00", 寅: "03:00-05:00", 卯: "05:00-07:00", 辰: "07:00-09:00", 巳: "09:00-11:00", 午: "11:00-13:00", 未: "13:00-15:00", 申: "15:00-17:00", 酉: "17:00-19:00", 戌: "19:00-21:00", 亥: "21:00-23:00" };
    function wuxingToBranches(wx, amount) {
      amount = amount === undefined ? 1 : amount;
      var out = {}; BRANCHES.forEach(function (b) { out[b] = 0; });
      if (wx === "金") { out["申"] = amount; out["酉"] = amount; }
      else if (wx === "木") { out["寅"] = amount; out["卯"] = amount; }
      else if (wx === "水") { out["亥"] = amount; out["子"] = amount; }
      else if (wx === "火") { out["巳"] = amount; out["午"] = amount; }
      else if (wx === "土") { out["辰"] = amount * 0.5; out["戌"] = amount * 0.5; out["丑"] = amount * 0.5; out["未"] = amount * 0.5; }
      return out;
    }
    function addTo(scores, delta, weight) {
      weight = weight === undefined ? 1 : weight;
      Object.keys(delta).forEach(function (b) {
        if (BRANCHES.indexOf(b) !== -1) scores[b] = (scores[b] || 0) + (delta[b] || 0) * weight;
      });
    }
    var Q1Q2_MAP = { A: ["寅", "卯", "辰"], B: ["卯", "辰", "巳"], C: ["巳", "午", "未"], D: ["申", "酉", "戌"], E: ["亥", "子", "丑"], F: ["子", "丑", "寅"] };
    var Q3_MAP = { A: ["寅", "卯", "辰"], B: ["卯", "辰", "巳"], C: ["巳", "午", "未"], D: ["申", "酉", "戌"], E: ["亥", "子", "丑"] };
    var WUXING_OPTION = { A: "金", B: "木", C: "水", D: "火", E: "土" };
    var Q7_MAP = { A: { 金: 2 }, B: { 金: 1, 火: 1 }, C: { 水: 2 }, D: { 土: 2 }, E: { 木: 1, 水: 1 } };
    function applyQ8(answers, scores, weight) {
      var v = answers.q8; if (!v) return;
      if (v === "B") { ["寅", "申", "巳", "亥"].forEach(function (b) { scores[b] = (scores[b] || 0) + 1 * weight; }); return; }
      var wx = WUXING_OPTION[v]; if (wx) addTo(scores, wuxingToBranches(wx, 2), weight);
    }
    var DUEL_MAP = { q9: { A: { 申: 2, 寅: -2 }, B: { 寅: 2, 申: -2 } }, q10: { A: { 酉: 2, 卯: -2 }, B: { 卯: 2, 酉: -2 } }, q11: { A: { 辰: 2, 戌: -2 }, B: { 戌: 2, 辰: -2 } }, q12: { A: { 巳: 2, 亥: -2 }, B: { 亥: 2, 巳: -2 } }, q13: { A: { 午: 2, 子: -2 }, B: { 子: 2, 午: -2 } }, q14: { A: { 未: 2, 丑: -2 }, B: { 丑: 2, 未: -2 } } };
    var Q18_MAP = { A: ["申", "午"], B: ["子", "亥"], C: ["寅", "辰"], D: ["戌", "丑"], E: ["卯", "未"], F: ["巳", "酉"] };

    var score = {}, timeSubtotal = {}, duelSubtotal = {};
    BRANCHES.forEach(function (b) { score[b] = 0; timeSubtotal[b] = 0; duelSubtotal[b] = 0; });

    var q1Arr = Array.isArray(answers.q1) ? answers.q1.slice(0, 2) : (answers.q1 ? [answers.q1] : []);
    q1Arr.forEach(function (key) {
      var arr = Q1Q2_MAP[key]; if (arr) arr.forEach(function (b) { score[b] += 3; timeSubtotal[b] += 3; });
    });
    var q2Arr = Array.isArray(answers.q2) ? answers.q2.slice(0, 2) : (answers.q2 ? [answers.q2] : []);
    q2Arr.forEach(function (key) {
      var arr = Q1Q2_MAP[key]; if (arr) arr.forEach(function (b) { score[b] += 3; timeSubtotal[b] += 3; });
    });
    if (answers.q3 && Q3_MAP[answers.q3]) Q3_MAP[answers.q3].forEach(function (b) { score[b] += 3; timeSubtotal[b] += 3; });
    [4, 5, 6].forEach(function (n) {
      var wx = WUXING_OPTION[answers["q" + n]]; if (wx) addTo(score, wuxingToBranches(wx, 1), 2);
    });
    if (answers.q7 && Q7_MAP[answers.q7]) Object.keys(Q7_MAP[answers.q7]).forEach(function (wx) { addTo(score, wuxingToBranches(wx, Q7_MAP[answers.q7][wx]), 2); });
    applyQ8(answers, score, 2);
    [9, 10, 11, 12, 13, 14].forEach(function (n) {
      var qid = "q" + n, key = answers[qid], map = DUEL_MAP[qid];
      if (!map || !key || !map[key]) return;
      Object.keys(map[key]).forEach(function (b) {
        var v = map[key][b] * 3; score[b] += v; duelSubtotal[b] += v;
      });
    });
    [15, 16, 17].forEach(function (n) {
      var wx = WUXING_OPTION[answers["q" + n]]; if (wx) addTo(score, wuxingToBranches(wx, 1), 1);
    });
    if (answers.q18 && Q18_MAP[answers.q18]) Q18_MAP[answers.q18].forEach(function (b) { score[b] += 1; });

    var maxScore = Math.max.apply(null, Object.keys(score).map(function (b) { return score[b]; }));
    var candidates = BRANCHES.filter(function (b) { return score[b] === maxScore; });
    if (candidates.length > 1) {
      var maxTime = Math.max.apply(null, candidates.map(function (b) { return timeSubtotal[b]; }));
      candidates = candidates.filter(function (b) { return timeSubtotal[b] === maxTime; });
    }
    if (candidates.length > 1) {
      var maxDuel = Math.max.apply(null, candidates.map(function (b) { return duelSubtotal[b]; }));
      candidates = candidates.filter(function (b) { return duelSubtotal[b] === maxDuel; });
    }
    if (candidates.length > 1) {
      var first = TIE_ORDER.filter(function (b) { return candidates.indexOf(b) !== -1; })[0];
      candidates = first ? [first] : [candidates[0]];
    }
    var branch = candidates[0] || "子";
    var half = answers.q19 === "B" ? "lower" : "upper";
    return { branch: branch, hour_label: branch + "時", hour_range: HOUR_RANGES[branch] || "", half: half };
  }

  function parseApiResult(data) {
    return {
      branch: data.branch || "子",
      hour_label: data.hour_label || data.branch + "時",
      hour_range: data.hour_range || "",
      half: data.half === "lower" ? "lower" : "upper",
    };
  }

  /**
   * 呼叫後端取得唯一推算時辰（V4：18+1 題）。先試同源 /api，再試遠端，皆失敗則用本地 fallback。
   * @param {Object} answers - q1,q2 為 string[]（最多 2 項），其餘為 string
   * @returns {Promise<{ branch: string, hour_label: string, hour_range: string, half: string }>}
   */
  function identifyBirthTimeFromAPI(answers) {
    var origin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";
    var remoteBase = (typeof window !== "undefined" && window.API_BASE) ? window.API_BASE : REMOTE_API_BASE;
    var body = JSON.stringify({ answers: answers });
    var opts = { method: "POST", headers: { "Content-Type": "application/json" }, body: body };

    function tryFetch(base) {
      if (!base) return Promise.reject(new Error("no base"));
      return fetch(base + "/api/estimate-hour", opts)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.error) throw new Error(data.error);
          return parseApiResult(data || {});
        });
    }

    return tryFetch(origin).catch(function () {
      return tryFetch(remoteBase).catch(function () {
        return Promise.resolve(estimateHourLocal(answers));
      });
    });
  }

  global.IdentifyBirthTime = {
    questions: QUESTIONS,
    identifyBirthTimeFromAPI: identifyBirthTimeFromAPI,
  };
})(typeof window !== "undefined" ? window : this);
