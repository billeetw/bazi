/* feedback-integration.js
 * 反馈系统界面整合模块
 * 导出到 window.UiComponents.FeedbackIntegration
 * 提供多种反馈入口整合方案
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  /**
   * 在摘要区域添加反馈入口
   * @param {string} chartId - 图表ID
   */
  function addFeedbackToSummary(chartId) {
    const summarySection = document.getElementById("ws-summary");
    if (!summarySection || !chartId) return;

    // 检查是否已存在
    if (summarySection.querySelector('.feedback-link')) return;

    const navChips = summarySection.querySelector('.flex.flex-wrap.gap-2');
    if (!navChips) return;

    const feedbackLink = document.createElement('a');
    feedbackLink.href = '#';
    feedbackLink.className = 'nav-chip feedback-link';
    feedbackLink.innerHTML = '💬 反馈';
    feedbackLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[feedback-integration] 点击摘要区域反馈链接');
      if (window.UiComponents?.FeedbackWidget) {
        try {
          window.UiComponents.FeedbackWidget.showSatisfactionDialog({ chartId });
        } catch (err) {
          console.error('[feedback-integration] Error:', err);
          alert('打开反馈窗口失败');
        }
      } else {
        console.error('[feedback-integration] FeedbackWidget not available');
        alert('反馈功能暂不可用');
      }
    });

    navChips.appendChild(feedbackLink);
  }

  /**
   * 在导航栏添加反馈入口
   * @param {string} chartId - 图表ID
   */
  function addFeedbackToNav(chartId) {
    const workspaceNav = document.getElementById("workspaceNav");
    if (!workspaceNav || !chartId) return;

    // 检查是否已存在
    if (workspaceNav.querySelector('.feedback-nav-link')) return;

    const feedbackNav = document.createElement('a');
    feedbackNav.href = '#';
    feedbackNav.className = 'nav-chip feedback-nav-link';
    feedbackNav.innerHTML = '💬 反馈';
    feedbackNav.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[feedback-integration] 点击导航栏反馈链接');
      if (window.UiComponents?.FeedbackWidget) {
        try {
          window.UiComponents.FeedbackWidget.showSatisfactionDialog({ chartId });
        } catch (err) {
          console.error('[feedback-integration] Error:', err);
          alert('打开反馈窗口失败');
        }
      } else {
        console.error('[feedback-integration] FeedbackWidget not available');
        alert('反馈功能暂不可用');
      }
    });

    workspaceNav.appendChild(feedbackNav);
  }

  /**
   * 在移动端底部导航添加反馈入口
   * @param {string} chartId - 图表ID
   */
  function addFeedbackToBottomNav(chartId) {
    const bottomNav = document.querySelector('.bottom-nav');
    if (!bottomNav || !chartId) return;

    // 检查是否已存在
    if (bottomNav.querySelector('.feedback-bottom-link')) return;

    const feedbackLink = document.createElement('a');
    feedbackLink.href = '#';
    feedbackLink.className = 'feedback-bottom-link';
    feedbackLink.innerHTML = '💬 反馈';
    feedbackLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[feedback-integration] 点击底部导航反馈链接');
      if (window.UiComponents?.FeedbackWidget) {
        try {
          window.UiComponents.FeedbackWidget.showSatisfactionDialog({ chartId });
        } catch (err) {
          console.error('[feedback-integration] Error:', err);
          alert('打开反馈窗口失败');
        }
      } else {
        console.error('[feedback-integration] FeedbackWidget not available');
        alert('反馈功能暂不可用');
      }
    });

    bottomNav.appendChild(feedbackLink);
  }

  /**
   * 在各个section添加反馈提示
   * @param {string} chartId - 图表ID
   */
  function addFeedbackPrompts(chartId) {
    if (!chartId) return;

    // 在紫微section添加
    const ziweiSection = document.getElementById("ws-ziwei");
    if (ziweiSection && !ziweiSection.querySelector('.feedback-prompt')) {
      const prompt = createFeedbackPrompt('对紫微预测的准确度有反馈？', chartId, 'palace');
      ziweiSection.appendChild(prompt);
    }

    // 在流月section添加
    const liuyueSection = document.getElementById("ws-liuyue");
    if (liuyueSection && !liuyueSection.querySelector('.feedback-prompt')) {
      const prompt = createFeedbackPrompt('对流月预测有反馈？', chartId, 'liuyue');
      liuyueSection.appendChild(prompt);
    }

    // 在战略面板添加
    const strategySection = document.getElementById("ws-strategy");
    if (strategySection && !strategySection.querySelector('.feedback-prompt')) {
      const prompt = createFeedbackPrompt('对战术建议有反馈？', chartId, 'tactics');
      strategySection.appendChild(prompt);
    }
  }

  /**
   * 创建反馈提示元素
   * @param {string} text - 提示文本
   * @param {string} chartId - 图表ID
   * @param {string} category - 反馈类别
   */
  function createFeedbackPrompt(text, chartId, category) {
    const prompt = document.createElement('div');
    prompt.className = 'feedback-prompt mt-4 pt-4 border-t border-white/10';
    prompt.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-400">${text}</span>
        <button class="text-xs text-amber-400 hover:text-amber-300 underline feedback-prompt-btn">
          提供反馈
        </button>
      </div>
    `;

    const btn = prompt.querySelector('.feedback-prompt-btn');
    btn.addEventListener('click', () => {
      if (window.UiComponents?.FeedbackWidget) {
        window.UiComponents.FeedbackWidget.showSatisfactionDialog({ chartId });
      }
    });

    return prompt;
  }

  /**
   * 延迟显示反馈提示（在用户浏览一段时间后）
   * @param {string} chartId - 图表ID
   * @param {number} delaySeconds - 延迟秒数（默认30秒）
   */
  function showDelayedFeedbackPrompt(chartId, delaySeconds = 30) {
    if (!chartId) return;

    setTimeout(() => {
      // 检查用户是否还在页面上
      if (document.getElementById('ws-summary')) {
        // 显示一个不打扰的提示
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-20 right-6 bg-amber-500/20 border border-amber-400/40 rounded-lg p-3 shadow-lg z-[9998] max-w-xs';
        toast.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="text-xs text-amber-300">您的反馈对我们很重要</span>
            <button class="text-xs text-amber-400 hover:text-amber-300 underline" onclick="this.closest('.fixed').remove()">
              稍后
            </button>
            <button class="text-xs bg-amber-500/30 px-2 py-1 rounded hover:bg-amber-500/40 feedback-toast-btn">
              反馈
            </button>
          </div>
        `;

        const feedbackBtn = toast.querySelector('.feedback-toast-btn');
        feedbackBtn.addEventListener('click', () => {
          toast.remove();
          if (window.UiComponents?.FeedbackWidget) {
            window.UiComponents.FeedbackWidget.showSatisfactionDialog({ chartId });
          }
        });

        document.body.appendChild(toast);

        // 10秒后自动消失
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 10000);
      }
    }, delaySeconds * 1000);
  }

  /**
   * 完整整合反馈系统到界面
   * @param {string} chartId - 图表ID
   * @param {Object} options - 选项
   */
  function integrateFeedback(chartId, options = {}) {
    const {
      showInSummary = true,
      showInNav = true,
      showInBottomNav = true,
      showPrompts = false,
      showDelayedPrompt = false,
      delaySeconds = 30,
      showHistoryLink = true, // 新增：显示历史记录链接
    } = options;

    if (!chartId) {
      console.warn('[feedback-integration] chartId is required');
      return;
    }

    // 创建浮动按钮（默认）
    if (window.UiComponents?.FeedbackWidget) {
      window.UiComponents.FeedbackWidget.createFeedbackButton({ chartId });
    }

    // 在摘要区域添加
    if (showInSummary) {
      addFeedbackToSummary(chartId);
    }

    // 在导航栏添加
    if (showInNav) {
      addFeedbackToNav(chartId);
    }

    // 在移动端底部导航添加
    if (showInBottomNav) {
      addFeedbackToBottomNav(chartId);
    }

    // 添加反馈历史链接（如果有历史记录）
    if (showHistoryLink && window.UserIdentity && window.UiComponents?.FeedbackHistory) {
      const history = window.UserIdentity.getFeedbackHistory();
      if (history.length > 0) {
        addFeedbackHistoryLink();
      }
    }

    // 在各个section添加提示
    if (showPrompts) {
      addFeedbackPrompts(chartId);
    }

    // 延迟显示提示
    if (showDelayedPrompt) {
      showDelayedFeedbackPrompt(chartId, delaySeconds);
    }
  }

  /**
   * 添加反馈历史链接
   */
  function addFeedbackHistoryLink() {
    // 在摘要区域添加历史链接
    const summarySection = document.getElementById("ws-summary");
    if (!summarySection) return;

    if (summarySection.querySelector('.feedback-history-link')) return;

    const navChips = summarySection.querySelector('.flex.flex-wrap.gap-2');
    if (!navChips) return;

    const historyLink = document.createElement('a');
    historyLink.href = '#';
    historyLink.className = 'nav-chip feedback-history-link text-xs';
    historyLink.innerHTML = '📋 我的反馈';
    historyLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.UiComponents?.FeedbackHistory) {
        window.UiComponents.FeedbackHistory.showFeedbackHistory();
      }
    });

    navChips.appendChild(historyLink);
  }

  // 导出到 window.UiComponents.FeedbackIntegration
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  window.UiComponents.FeedbackIntegration = {
    integrateFeedback,
    addFeedbackToSummary,
    addFeedbackToNav,
    addFeedbackToBottomNav,
    addFeedbackPrompts,
    showDelayedFeedbackPrompt,
  };
})();
