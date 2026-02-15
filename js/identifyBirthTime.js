/**
 * identifyBirthTime.js (V4：18+1 題)
 * 推算時辰問卷：僅提供題目文本（無權重、無地支說明），推算由後端 POST /api/me/estimate-hour 完成。
 * 前端不得存放任何加權數值或五行/地支對應。（本地/離線時若 API 不可用，則使用內建 fallback 以利測試。）
 */

import { estimateHourFromAnswers } from "./calc/shichen-logic.js";

(function (global) {
  "use strict";

  /** 遠端 API 基底：優先從 Config；同源 /api 失敗時使用，例如本地靜態伺服器無 API */
  function getApiBase() {
    return (typeof window !== "undefined" && window.Config?.API_BASE)
      ? window.Config.API_BASE
      : "https://17gonplay-api.billeetw.workers.dev";
  }

  /** V4 題庫：僅 id、text、options(key+text)；Q1/Q2 為複選最多 2 項，其餘單選（i18n 未載入時使用） */
  const QUESTIONS_FALLBACK = [
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
   * 從 i18n 組出題目陣列；若無 I18n 或資料不完整則回傳 QUESTIONS_FALLBACK
   */
  function getQuestions() {
    var I18n = typeof global !== "undefined" && global.I18n ? global.I18n : (typeof window !== "undefined" && window.I18n ? window.I18n : null);
    if (!I18n || typeof I18n.tObject !== "function") return QUESTIONS_FALLBACK;
    var data = I18n.tObject("estimateHour");
    if (!data || typeof data !== "object") return QUESTIONS_FALLBACK;
    var arr = [];
    for (var i = 1; i <= 19; i++) {
      var qid = "q" + i;
      var q = data[qid];
      if (!q || !q.text) {
        arr.push(QUESTIONS_FALLBACK[i - 1]);
        continue;
      }
      var opts = [];
      if (q.options && typeof q.options === "object") {
        Object.keys(q.options).forEach(function (k) {
          opts.push({ key: k, text: q.options[k] });
        });
      }
      var multi = (i === 1 || i === 2);
      arr.push({
        id: qid,
        text: q.text,
        options: opts.length ? opts : QUESTIONS_FALLBACK[i - 1].options,
        multiSelect: multi,
        maxSelect: multi ? 2 : undefined,
      });
    }
    return arr;
  }

  /**
   * 本地 fallback：與後端 vNext 邏輯一致，僅在 API 不可用時使用（本地測試／離線）。
   * @param {Object} answers - q1,q2 為 string[]，其餘為 string
   * @returns {{ branch, hour_label, hour_range, half, score, debug, uiHint }}
   */
  function estimateHourLocal(answers) {
    var result = estimateHourFromAnswers(answers, {});
    return {
      branch: result.branch,
      hour_label: result.hour_label,
      hour_range: result.hour_range,
      half: result.half,
      score: result.score,
      debug: result.debug,
      uiHint: result.uiHint,
    };
  }

  function parseApiResult(data) {
    return {
      branch: data.branch || "子",
      hour_label: data.hour_label || (data.branch ? data.branch + "時" : "子時"),
      hour_range: data.hour_range || "",
      half: data.half === "lower" ? "lower" : "upper",
      uiHint: data.uiHint || null,
    };
  }

  /**
   * 呼叫後端取得唯一推算時辰（V4：18+1 題）。先試同源 /api，再試遠端，皆失敗則用本地 fallback。
   * @param {Object} answers - q1,q2 為 string[]（最多 2 項），其餘為 string
   * @returns {Promise<{ branch: string, hour_label: string, hour_range: string, half: string }>}
   */
  function identifyBirthTimeFromAPI(answers) {
    var origin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";
    var remoteBase = getApiBase();
    var body = JSON.stringify({ answers: answers });
    var auth = (typeof window !== "undefined" && window.AuthService && window.AuthService.getAuthHeaders) ? window.AuthService.getAuthHeaders() : {};
    var headers = Object.assign({ "Content-Type": "application/json" }, auth);
    var optsWithAuth = { method: "POST", headers: headers, body: body };
    function tryFetchWithOpts(base, fetchOpts) {
      if (!base) return Promise.reject(new Error("no base"));
      return fetch(base + "/api/me/estimate-hour", fetchOpts)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.error) throw new Error(data.error);
          return parseApiResult(data || {});
        });
    }
    return tryFetchWithOpts(origin, optsWithAuth).catch(function () {
      return tryFetchWithOpts(remoteBase, optsWithAuth).catch(function () {
        return Promise.resolve(estimateHourLocal(answers));
      });
    });
  }

  global.IdentifyBirthTime = {
    questions: QUESTIONS_FALLBACK,
    getQuestions: getQuestions,
    identifyBirthTimeFromAPI: identifyBirthTimeFromAPI,
  };
})(typeof window !== "undefined" ? window : this);
