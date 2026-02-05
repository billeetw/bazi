/**
 * identifyBirthTime.js
 * 不確定時辰問卷：僅提供題目文案（無權重），推算由後端 POST /api/estimate-hour 完成。
 * 前端不得存放任何加權數值。
 */
(function (global) {
  "use strict";

  /** 問卷題目：僅 id、text、options(key+text)，無 weights */
  const QUESTIONS = [
    { id: "q1", text: "頭頂髮旋位置（可問家人）", options: [{ key: "A", text: "偏左" }, { key: "B", text: "偏右" }, { key: "C", text: "頭頂正中" }, { key: "D", text: "不確定" }] },
    { id: "q2", text: "家中排行", options: [{ key: "A", text: "老大" }, { key: "B", text: "老么" }, { key: "C", text: "中間" }, { key: "D", text: "獨生子女" }] },
    { id: "q3", text: "行為傾向較像", options: [{ key: "A", text: "喜歡變動、嘗試新事物" }, { key: "B", text: "重視人際、社交" }, { key: "C", text: "喜歡穩定、規律" }] },
    { id: "q4", text: "一天中精神最好的時段", options: [{ key: "A", text: "早上" }, { key: "B", text: "中午前後" }, { key: "C", text: "下午到傍晚" }, { key: "D", text: "晚上" }] },
    { id: "q5", text: "做決定時較常", options: [{ key: "A", text: "分析後再動" }, { key: "B", text: "直覺、先做再說" }, { key: "C", text: "問別人意見" }] },
    { id: "q6", text: "壓力大時傾向", options: [{ key: "A", text: "整理計畫、按步驟" }, { key: "B", text: "直接行動、先做再說" }, { key: "C", text: "先休息、觀察再動" }] },
    { id: "q7", text: "別人對你的第一印象通常是", options: [{ key: "A", text: "穩重、可靠" }, { key: "B", text: "有活力、有主見" }, { key: "C", text: "溫和、好相處" }] },
  ];

  /**
   * 呼叫後端取得推算時辰（加權邏輯僅在後端）
   * @param {Record<string, string>} answers - 題 id → 選項 key
   * @returns {Promise<{ topHours: string[], confidence: number }>}
   */
  function identifyBirthTimeFromAPI(answers) {
    const base = typeof window !== "undefined" && window.location && window.location.origin ? window.location.origin : "";
    return fetch(base + "/api/estimate-hour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        return { topHours: data.topHours || [], confidence: data.confidence ?? 0 };
      });
  }

  global.IdentifyBirthTime = {
    questions: QUESTIONS,
    identifyBirthTimeFromAPI: identifyBirthTimeFromAPI,
  };
})(typeof window !== "undefined" ? window : this);
