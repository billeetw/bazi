/* ui/components/expert-questionnaire.js
 * 15題專家問卷組件
 * 用於後台管理界面，採集心理原型、行為偏好、抗壓機制
 * 用於判讀和命書輸出（未來收費服務）
 */

(function () {
  "use strict";

  /**
   * 15題專家問卷題目定義
   * 分為三類：心理原型（5題）、行為偏好（5題）、抗壓機制（5題）
   */
  const EXPERT_QUESTIONNAIRE = [
    // ====== 心理原型（5題）======
    {
      id: "eq1",
      category: "psychology",
      categoryName: "心理原型",
      text: "在面對重大決策時，你的核心驅動力來自？",
      options: [
        { key: "A", text: "邏輯分析與數據支撐" },
        { key: "B", text: "直覺感受與內在聲音" },
        { key: "C", text: "他人意見與社會共識" },
        { key: "D", text: "過往經驗與成功模式" }
      ]
    },
    {
      id: "eq2",
      category: "psychology",
      categoryName: "心理原型",
      text: "你認為自己最核心的人格特質是？",
      options: [
        { key: "A", text: "執行力強，說到做到" },
        { key: "B", text: "觀察力敏銳，善於分析" },
        { key: "C", text: "創造力豐富，敢於突破" },
        { key: "D", text: "穩定可靠，承載力強" }
      ]
    },
    {
      id: "eq3",
      category: "psychology",
      categoryName: "心理原型",
      text: "當你感到壓力時，內心的第一反應是？",
      options: [
        { key: "A", text: "立刻整理資訊，制定計劃" },
        { key: "B", text: "先退後觀察，等待時機" },
        { key: "C", text: "直接行動，邊做邊調整" },
        { key: "D", text: "尋求支持，與他人討論" }
      ]
    },
    {
      id: "eq4",
      category: "psychology",
      categoryName: "心理原型",
      text: "你認為自己最擅長的領域是？",
      options: [
        { key: "A", text: "策略規劃與系統思考" },
        { key: "B", text: "人際連結與情感支持" },
        { key: "C", text: "創新突破與開拓新局" },
        { key: "D", text: "穩定執行與持續優化" }
      ]
    },
    {
      id: "eq5",
      category: "psychology",
      categoryName: "心理原型",
      text: "你的人生目標更傾向於？",
      options: [
        { key: "A", text: "建立影響力與聲望" },
        { key: "B", text: "獲得內在平靜與智慧" },
        { key: "C", text: "創造價值與改變世界" },
        { key: "D", text: "建立穩定與安全感" }
      ]
    },

    // ====== 行為偏好（5題）======
    {
      id: "eq6",
      category: "behavior",
      categoryName: "行為偏好",
      text: "在團隊合作中，你更傾向於？",
      options: [
        { key: "A", text: "主導方向，制定規則" },
        { key: "B", text: "協調溝通，促進共識" },
        { key: "C", text: "執行任務，專注細節" },
        { key: "D", text: "提供創意，突破框架" }
      ]
    },
    {
      id: "eq7",
      category: "behavior",
      categoryName: "行為偏好",
      text: "面對衝突時，你的處理方式是？",
      options: [
        { key: "A", text: "直接溝通，講道理訂規則" },
        { key: "B", text: "先避開，找適當時機再處理" },
        { key: "C", text: "快速解決，速戰速決" },
        { key: "D", text: "尋求第三方協助或調解" }
      ]
    },
    {
      id: "eq8",
      category: "behavior",
      categoryName: "行為偏好",
      text: "學習新事物時，你更偏好？",
      options: [
        { key: "A", text: "系統性學習，建立完整架構" },
        { key: "B", text: "實作中學習，邊做邊學" },
        { key: "C", text: "與他人討論，從交流中學習" },
        { key: "D", text: "觀察模仿，從案例中學習" }
      ]
    },
    {
      id: "eq9",
      category: "behavior",
      categoryName: "行為偏好",
      text: "完成一件大事後，你傾向於？",
      options: [
        { key: "A", text: "立即規劃下一步，持續推進" },
        { key: "B", text: "休息沉澱，整理經驗" },
        { key: "C", text: "分享成果，獲得認可" },
        { key: "D", text: "尋找新挑戰，開拓新領域" }
      ]
    },
    {
      id: "eq10",
      category: "behavior",
      categoryName: "行為偏好",
      text: "面對不確定性時，你的第一反應是？",
      options: [
        { key: "A", text: "蒐集更多資訊，降低不確定性" },
        { key: "B", text: "先試一點，邊做邊調整" },
        { key: "C", text: "觀望等待，等局勢明朗" },
        { key: "D", text: "尋求他人建議，參考經驗" }
      ]
    },

    // ====== 抗壓機制（5題）======
    {
      id: "eq11",
      category: "resilience",
      categoryName: "抗壓機制",
      text: "當你感到疲憊或壓力過大時，最有效的恢復方式是？",
      options: [
        { key: "A", text: "獨處靜心，整理思緒" },
        { key: "B", text: "運動或身體活動" },
        { key: "C", text: "與親友交流，獲得支持" },
        { key: "D", text: "轉換環境，暫時離開壓力源" }
      ]
    },
    {
      id: "eq12",
      category: "resilience",
      categoryName: "抗壓機制",
      text: "面對失敗或挫折時，你的內在對話是？",
      options: [
        { key: "A", text: "分析原因，找出改進方法" },
        { key: "B", text: "接受現實，調整期待" },
        { key: "C", text: "重新出發，尋找新機會" },
        { key: "D", text: "尋求支持，與他人討論" }
      ]
    },
    {
      id: "eq13",
      category: "resilience",
      categoryName: "抗壓機制",
      text: "當你感到能量耗盡時，你會優先？",
      options: [
        { key: "A", text: "減少工作量，保護核心任務" },
        { key: "B", text: "尋求協助，分擔責任" },
        { key: "C", text: "改變方法，提高效率" },
        { key: "D", text: "暫時休息，恢復後再戰" }
      ]
    },
    {
      id: "eq14",
      category: "resilience",
      categoryName: "抗壓機制",
      text: "面對長期壓力時，你的應對策略是？",
      options: [
        { key: "A", text: "建立規律，維持穩定節奏" },
        { key: "B", text: "尋找意義，連結長期目標" },
        { key: "C", text: "適度調整，保持彈性" },
        { key: "D", text: "尋求專業協助或指導" }
      ]
    },
    {
      id: "eq15",
      category: "resilience",
      categoryName: "抗壓機制",
      text: "你認為自己最需要加強的抗壓能力是？",
      options: [
        { key: "A", text: "情緒管理與內在穩定" },
        { key: "B", text: "時間管理與效率提升" },
        { key: "C", text: "人際支持與資源整合" },
        { key: "D", text: "目標設定與執行力" }
      ]
    }
  ];

  /**
   * 問卷答案數據結構
   */
  let questionnaireAnswers = {};

  /**
   * 渲染問卷題目
   * @param {HTMLElement} container 容器元素
   * @param {Array} questions 題目陣列
   */
  function renderQuestions(container, questions) {
    container.innerHTML = '';

    questions.forEach((question, index) => {
      const questionDiv = document.createElement('div');
      questionDiv.className = 'expert-question';
      questionDiv.dataset.questionId = question.id;
      questionDiv.dataset.category = question.category;

      questionDiv.innerHTML = `
        <div class="question-header">
          <span class="question-number">${index + 1}</span>
          <span class="question-category">${question.categoryName}</span>
          <p class="question-text">${question.text}</p>
        </div>
        <div class="question-options">
          ${question.options.map(option => `
            <label class="option-label">
              <input 
                type="radio" 
                name="${question.id}" 
                value="${option.key}"
                class="option-input"
              />
              <span class="option-text">${option.key}. ${option.text}</span>
            </label>
          `).join('')}
        </div>
      `;

      container.appendChild(questionDiv);

      // 綁定事件監聽器
      const inputs = questionDiv.querySelectorAll('.option-input');
      inputs.forEach(input => {
        input.addEventListener('change', function() {
          questionnaireAnswers[question.id] = {
            answer: this.value,
            category: question.category,
            questionText: question.text,
            optionText: question.options.find(opt => opt.key === this.value)?.text || ''
          };
          updateProgress();
          saveAnswers();
        });
      });
    });
  }

  /**
   * 更新進度條
   */
  function updateProgress() {
    const totalQuestions = EXPERT_QUESTIONNAIRE.length;
    const answeredQuestions = Object.keys(questionnaireAnswers).length;
    const progress = (answeredQuestions / totalQuestions) * 100;

    const progressBar = document.getElementById('expert-questionnaire-progress');
    const progressText = document.getElementById('expert-questionnaire-progress-text');
    
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    
    if (progressText) {
      progressText.textContent = `已完成 ${answeredQuestions}/${totalQuestions} 題`;
    }
  }

  /**
   * 保存答案到本地存儲
   */
  function saveAnswers() {
    try {
      localStorage.setItem('expertQuestionnaireAnswers', JSON.stringify(questionnaireAnswers));
      
      // 同時存儲到全局狀態
      if (typeof window !== "undefined") {
        if (window.BaziApp?.State) {
          window.BaziApp.State.setState("expertQuestionnaire", questionnaireAnswers);
        }
        window.expertQuestionnaire = questionnaireAnswers;
      }
    } catch (err) {
      console.warn('[expert-questionnaire] 保存答案失敗:', err);
    }
  }

  /**
   * 從本地存儲載入答案
   */
  function loadAnswers() {
    try {
      const saved = localStorage.getItem('expertQuestionnaireAnswers');
      if (saved) {
        questionnaireAnswers = JSON.parse(saved);
        
        // 恢復選中的選項
        Object.keys(questionnaireAnswers).forEach(questionId => {
          const answer = questionnaireAnswers[questionId];
          const input = document.querySelector(`input[name="${questionId}"][value="${answer.answer}"]`);
          if (input) {
            input.checked = true;
          }
        });
        
        updateProgress();
      }
    } catch (err) {
      console.warn('[expert-questionnaire] 載入答案失敗:', err);
    }
  }

  /**
   * 獲取問卷答案摘要
   * @returns {Object} 問卷答案摘要
   */
  function getQuestionnaireSummary() {
    const answeredCount = Object.keys(questionnaireAnswers).length;
    const totalCount = EXPERT_QUESTIONNAIRE.length;
    
    const categorySummary = {
      psychology: { answered: 0, total: 5 },
      behavior: { answered: 0, total: 5 },
      resilience: { answered: 0, total: 5 }
    };

    Object.values(questionnaireAnswers).forEach(answer => {
      if (categorySummary[answer.category]) {
        categorySummary[answer.category].answered++;
      }
    });

    return {
      totalAnswered: answeredCount,
      totalQuestions: totalCount,
      completionRate: totalCount > 0 ? (answeredCount / totalCount) * 100 : 0,
      categorySummary: categorySummary,
      answers: questionnaireAnswers,
      isComplete: answeredCount === totalCount
    };
  }

  /**
   * 清空問卷答案
   */
  function clearAnswers() {
    questionnaireAnswers = {};
    localStorage.removeItem('expertQuestionnaireAnswers');
    
    // 清空選中的選項
    document.querySelectorAll('.option-input:checked').forEach(input => {
      input.checked = false;
    });
    
    updateProgress();
    
    // 清空全局狀態
    if (typeof window !== "undefined") {
      if (window.BaziApp?.State) {
        window.BaziApp.State.setState("expertQuestionnaire", {});
      }
      window.expertQuestionnaire = {};
    }
  }

  /**
   * 初始化專家問卷組件
   * @param {HTMLElement|string} container 容器元素或選擇器
   * @param {Object} options 選項
   */
  function initExpertQuestionnaire(container, options = {}) {
    const containerEl = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;

    if (!containerEl) {
      console.error('[expert-questionnaire] 容器元素不存在');
      return;
    }

    // 創建問卷容器結構
    containerEl.innerHTML = `
      <div class="expert-questionnaire-container">
        <div class="expert-questionnaire-header">
          <h3>15題專家問卷</h3>
          <p class="questionnaire-description">
            此問卷用於採集心理原型、行為偏好、抗壓機制，用於後台判讀和命書輸出（未來收費服務）。
          </p>
          <div class="progress-container">
            <div class="progress-bar">
              <div id="expert-questionnaire-progress" class="progress-fill" style="width: 0%"></div>
            </div>
            <span id="expert-questionnaire-progress-text" class="progress-text">已完成 0/15 題</span>
          </div>
        </div>
        <div class="expert-questionnaire-questions" id="expert-questionnaire-questions"></div>
        <div class="expert-questionnaire-actions">
          <button id="expert-questionnaire-clear" class="btn-clear">清空答案</button>
          <button id="expert-questionnaire-submit" class="btn-submit">提交問卷</button>
        </div>
      </div>
    `;

    // 渲染問卷題目
    const questionsContainer = document.getElementById('expert-questionnaire-questions');
    renderQuestions(questionsContainer, EXPERT_QUESTIONNAIRE);

    // 載入已保存的答案
    loadAnswers();

    // 綁定清空按鈕
    const clearBtn = document.getElementById('expert-questionnaire-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        if (confirm('確定要清空所有答案嗎？')) {
          clearAnswers();
        }
      });
    }

    // 綁定提交按鈕
    const submitBtn = document.getElementById('expert-questionnaire-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        const summary = getQuestionnaireSummary();
        if (!summary.isComplete) {
          alert(`請完成所有題目（目前完成 ${summary.totalAnswered}/${summary.totalQuestions} 題）`);
          return;
        }

        // 觸發提交事件
        const event = new CustomEvent('expertQuestionnaireSubmit', {
          detail: {
            answers: questionnaireAnswers,
            summary: summary
          }
        });
        containerEl.dispatchEvent(event);

        // 如果有回調函數，調用它
        if (options.onSubmit) {
          options.onSubmit(questionnaireAnswers, summary);
        }
      });
    }
  }

  // ====== 導出 ======

  // 導出到 window.ExpertQuestionnaire（如果 window 存在）
  if (typeof window !== "undefined") {
    window.ExpertQuestionnaire = {
      init: initExpertQuestionnaire,
      getAnswers: () => questionnaireAnswers,
      getSummary: getQuestionnaireSummary,
      clearAnswers: clearAnswers,
      loadAnswers: loadAnswers,
      saveAnswers: saveAnswers,
      EXPERT_QUESTIONNAIRE: EXPERT_QUESTIONNAIRE
    };
  } else if (typeof globalThis !== "undefined") {
    globalThis.ExpertQuestionnaire = {
      init: initExpertQuestionnaire,
      getAnswers: () => questionnaireAnswers,
      getSummary: getQuestionnaireSummary,
      clearAnswers: clearAnswers,
      loadAnswers: loadAnswers,
      saveAnswers: saveAnswers,
      EXPERT_QUESTIONNAIRE: EXPERT_QUESTIONNAIRE
    };
  }
})();
