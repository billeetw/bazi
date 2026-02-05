/* feedback-widget.js
 * 用户反馈组件
 * 导出到 window.UiComponents.FeedbackWidget
 * 依赖: window.UiServices.FeedbackService, window.UiDomHelpers
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  // 延迟检查依赖
  if (!window.UiServices?.FeedbackService) {
    console.warn("[feedback-widget.js] window.UiServices.FeedbackService not found yet, will check at runtime");
  }
  if (!window.UiDomHelpers) {
    console.warn("[feedback-widget.js] window.UiDomHelpers not found yet, will check at runtime");
  }

  /**
   * 显示满意度反馈弹窗
   * @param {Object} options - 选项
   * @param {string} options.chartId - 图表ID
   * @param {Function} [options.onSubmitted] - 提交成功回调
   */
  function showSatisfactionDialog(options) {
    const { chartId, onSubmitted } = options || {};
    if (!chartId) {
      console.error("[feedback-widget] chartId is required");
      return;
    }

    const FeedbackService = window.UiServices?.FeedbackService;
    if (!FeedbackService) {
      console.error("[feedback-widget] FeedbackService not available");
      return;
    }

    // 创建弹窗HTML（如果已存在则先移除，确保每次都是全新的）
    const dialogId = 'feedback-satisfaction-dialog';
    let existingDialog = document.getElementById(dialogId);
    if (existingDialog) {
      existingDialog.remove();
    }

    const dialog = document.createElement('div');
    dialog.id = dialogId;
    dialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4';
    dialog.style.zIndex = '10000';
    
    // 使用闭包保存状态
    let selectedRating = 0;
    
    dialog.innerHTML = `
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative text-gray-900">
        <button id="close-feedback-dialog" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <h3 class="text-xl font-bold mb-4 text-gray-900">您的反饋對我們很重要</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2 text-gray-700">整體滿意度</label>
          <div class="flex gap-2" id="satisfaction-stars">
            ${[1, 2, 3, 4, 5].map(i => `
              <button type="button" class="star-btn text-3xl text-gray-300 hover:text-yellow-400 transition-colors cursor-pointer" data-rating="${i}" style="background: none; border: none; padding: 0; outline: none;">
                ★
              </button>
            `).join('')}
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2 text-gray-700">反饋意見（可選）</label>
          <textarea id="feedback-text" class="w-full p-2 border border-gray-300 rounded-lg text-gray-900" rows="3" placeholder="請告訴我們您的想法..." style="resize: vertical;"></textarea>
        </div>
        <div class="flex gap-2">
          <button id="submit-feedback" type="button" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
            提交反饋
          </button>
          <button id="cancel-feedback" type="button" class="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
            稍後再說
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);

    // 获取元素引用
    const stars = dialog.querySelectorAll('.star-btn');
    const textarea = dialog.querySelector('#feedback-text');
    const submitBtn = dialog.querySelector('#submit-feedback');
    const cancelBtn = dialog.querySelector('#cancel-feedback');
    const closeBtn = dialog.querySelector('#close-feedback-dialog');
    const contentDiv = dialog.querySelector('.bg-white');

    // 关闭按钮事件
    const closeDialog = () => {
      dialog.remove();
    };
    if (closeBtn) closeBtn.addEventListener('click', closeDialog);
    if (cancelBtn) cancelBtn.addEventListener('click', closeDialog);
    
    // 点击背景关闭
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        closeDialog();
      }
    });

    // 星星点击事件（使用闭包中的 selectedRating）
    // 注意：不要使用cloneNode，直接绑定事件
    stars.forEach((star, index) => {
      // 清除可能存在的旧事件（通过重新绑定）
      star.onclick = null;
      
      star.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        selectedRating = index + 1;
        console.log('[feedback-widget] 選擇評分:', selectedRating);
        
        // 更新所有星星的样式
        const allStars = dialog.querySelectorAll('.star-btn');
        allStars.forEach((s, i) => {
          if (i < selectedRating) {
            s.classList.remove('text-gray-300');
            s.classList.add('text-yellow-400');
          } else {
            s.classList.remove('text-yellow-400');
            s.classList.add('text-gray-300');
          }
        });
        
        // 启用提交按钮
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
          submitBtn.style.opacity = '1';
          submitBtn.style.cursor = 'pointer';
          console.log('[feedback-widget] 提交按鈕已啟用');
        }
      }, { capture: false, passive: false });
      
      // 添加鼠标悬停效果
      star.addEventListener('mouseenter', function() {
        if (!star.classList.contains('text-yellow-400')) {
          star.style.opacity = '0.7';
        }
      });
      star.addEventListener('mouseleave', function() {
        star.style.opacity = '1';
      });
    });

    // 提交按钮事件
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';
    
    // 使用命名函数以便调试
    const handleSubmit = async function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      console.log('[feedback-widget] 點擊提交按鈕, selectedRating:', selectedRating);
      
      if (selectedRating === 0) {
        alert('請選擇滿意度評分');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '提交中…';
      submitBtn.style.opacity = '0.7';
      submitBtn.style.cursor = 'wait';

      try {
        const feedbackText = textarea ? textarea.value.trim() : '';
        console.log('[feedback-widget] 提交反饋:', { chartId, rating: selectedRating, feedbackText });
        
        const result = await FeedbackService.submitSatisfactionFeedback({
          chartId,
          rating: selectedRating,
          category: 'overall',
          feedbackText: feedbackText || null,
        });

        console.log('[feedback-widget] 反饋提交成功:', result);

        // 保存到本地历史记录
        if (window.UserIdentity?.saveFeedbackToHistory) {
          window.UserIdentity.saveFeedbackToHistory({
            chartId,
            feedbackType: 'satisfaction',
            rating: selectedRating,
            feedbackText: feedbackText || null,
            apiResponseId: result?.id,
          });
        }

        // 显示成功消息
        contentDiv.innerHTML = `
          <div class="text-center py-8">
            <div class="text-4xl mb-4">✅</div>
            <h3 class="text-xl font-bold mb-2 text-gray-900">感謝您的反饋！</h3>
            <p class="text-gray-600 mb-4">您的意見將幫助我們改進系統</p>
            <button type="button" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700" onclick="this.closest('.fixed').remove()">
              關閉
            </button>
          </div>
        `;

        if (onSubmitted) {
          onSubmitted({ rating: selectedRating });
        }

        // 3秒后自动关闭
        setTimeout(() => {
          dialog.remove();
        }, 3000);
      } catch (error) {
        console.error('[feedback-widget] Submit error:', error);
        alert('提交失敗：' + (error.message || '請稍後再試'));
        submitBtn.disabled = false;
        submitBtn.textContent = '提交反饋';
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }
    };
    
    submitBtn.addEventListener('click', handleSubmit, { capture: false, passive: false });

    // 确保文本输入框可以正常输入
    if (textarea) {
      textarea.addEventListener('focus', () => {
        console.log('[feedback-widget] 文字輸入框獲得焦點');
      });
      textarea.addEventListener('input', () => {
        console.log('[feedback-widget] 文字輸入:', textarea.value);
      });
      // 确保可以正常输入
      textarea.readOnly = false;
      textarea.disabled = false;
    }

    // 显示弹窗
    dialog.style.display = 'flex';
    console.log('[feedback-widget] 反饋彈窗已顯示');
    
    // 调试：检查所有元素
    console.log('[feedback-widget] 元素检查:', {
      stars: stars.length,
      textarea: !!textarea,
      submitBtn: !!submitBtn,
      cancelBtn: !!cancelBtn,
    });
  }

  /**
   * 显示预测准确度反馈弹窗
   * @param {Object} options - 选项
   * @param {string} options.chartId - 图表ID
   * @param {string} options.category - 预测类别
   * @param {string} options.target - 预测目标
   * @param {string} options.predictedValue - 预测值
   * @param {Function} [options.onSubmitted] - 提交成功回调
   */
  function showPredictionAccuracyDialog(options) {
    const { chartId, category, target, predictedValue, onSubmitted } = options || {};
    if (!chartId || !category || !target) {
      console.error("[feedback-widget] chartId, category, and target are required");
      return;
    }

    const FeedbackService = window.UiServices?.FeedbackService;
    if (!FeedbackService) {
      console.error("[feedback-widget] FeedbackService not available");
      return;
    }

    // 创建弹窗HTML
    const dialogId = 'feedback-prediction-dialog';
    let dialog = document.getElementById(dialogId);
    
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = dialogId;
      dialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
      dialog.innerHTML = `
        <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
          <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onclick="this.closest('.fixed').remove()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          <h3 class="text-xl font-bold mb-4 text-gray-900">預測準確度反饋</h3>
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">預測內容：<strong id="prediction-target"></strong></p>
            <p class="text-sm text-gray-600 mb-4">預測值：<strong id="prediction-value"></strong></p>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-gray-700">實際發生的情況（可選）</label>
            <textarea id="actual-value" class="w-full p-2 border border-gray-300 rounded-lg text-gray-900" rows="2" placeholder="請描述實際情況..." style="resize: vertical;"></textarea>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-gray-700">準確度評分</label>
            <div class="flex gap-2" id="accuracy-stars">
              ${[1, 2, 3, 4, 5].map(i => `
                <button type="button" class="star-btn text-3xl text-gray-300 hover:text-yellow-400 transition-colors cursor-pointer" data-rating="${i}" style="background: none; border: none; padding: 0; outline: none;">
                  ★
                </button>
              `).join('')}
            </div>
            <p class="text-xs text-gray-500 mt-1">1星=不準確，5星=非常準確</p>
          </div>
          <div class="flex gap-2">
            <button id="submit-accuracy" type="button" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
              提交反饋
            </button>
            <button type="button" class="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300" onclick="this.closest('.fixed').remove()">
              取消
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(dialog);
    }

    // 设置预测信息
    dialog.querySelector('#prediction-target').textContent = target;
    dialog.querySelector('#prediction-value').textContent = predictedValue || '—';

    // 重置状态
    const stars = dialog.querySelectorAll('.star-btn');
    const textarea = dialog.querySelector('#actual-value');
    const submitBtn = dialog.querySelector('#submit-accuracy');
    let selectedRating = 0;

    // 星星点击事件（预测准确度弹窗）
    stars.forEach((star, index) => {
      star.onclick = null; // 清除旧事件
      
      star.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        selectedRating = index + 1;
        console.log('[feedback-widget] 選擇準確度評分:', selectedRating);
        
        // 更新所有星星的样式
        const allStars = dialog.querySelectorAll('#accuracy-stars .star-btn');
        allStars.forEach((s, i) => {
          if (i < selectedRating) {
            s.classList.remove('text-gray-300');
            s.classList.add('text-yellow-400');
          } else {
            s.classList.remove('text-yellow-400');
            s.classList.add('text-gray-300');
          }
        });
        
        // 启用提交按钮
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('disabled:bg-gray-400', 'disabled:cursor-not-allowed');
          submitBtn.style.opacity = '1';
          submitBtn.style.cursor = 'pointer';
          console.log('[feedback-widget] 提交按鈕已啟用');
        }
      }, { capture: false, passive: false });
    });

    // 提交按钮
    submitBtn.disabled = true;
    submitBtn.addEventListener('click', async () => {
      if (selectedRating === 0) {
        alert('請選擇準確度評分');
        return;
      }

      submitBtn.disabled = true;
        submitBtn.textContent = '提交中…';

      try {
        await FeedbackService.submitPredictionFeedback({
          chartId,
          category,
          target,
          predictedValue,
          actualValue: textarea.value.trim() || null,
          accuracyRating: selectedRating,
        });

        // 显示成功消息
        dialog.querySelector('.bg-white').innerHTML = `
          <div class="text-center py-8">
            <div class="text-4xl mb-4">✅</div>
            <h3 class="text-xl font-bold mb-2 text-gray-900">感謝您的反饋！</h3>
            <p class="text-gray-600 mb-4">您的反饋將幫助我們提升預測準確度</p>
            <button type="button" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700" onclick="this.closest('.fixed').remove()">
              關閉
            </button>
          </div>
        `;

        if (onSubmitted) {
          onSubmitted({ rating: selectedRating });
        }

        // 3秒后自动关闭
        setTimeout(() => {
          dialog.remove();
        }, 3000);
      } catch (error) {
        console.error('[feedback-widget] Submit error:', error);
        alert('提交失敗，請稍後再試');
        submitBtn.disabled = false;
        submitBtn.textContent = '提交反饋';
      }
    });

    // 显示弹窗
    dialog.style.display = 'flex';
  }

  /**
   * 创建反馈按钮（浮动按钮）
   * @param {Object} options - 选项
   * @param {string} options.chartId - 图表ID
   */
  function createFeedbackButton(options) {
    const { chartId } = options || {};
    
    console.log("[feedback-widget] createFeedbackButton called, chartId:", chartId);

    // 检查是否已存在，如果存在则先移除
    const existingBtn = document.getElementById('feedback-float-btn');
    if (existingBtn) {
      console.log("[feedback-widget] 移除已存在的反饋按鈕");
      existingBtn.remove();
    }

    // 即使没有chartId也创建按钮（使用临时ID）
    const finalChartId = chartId || 'temp-' + Date.now();
    console.log("[feedback-widget] 使用 chartId:", finalChartId);

    const button = document.createElement('button');
    button.id = 'feedback-float-btn';
    // 移动端优化：调整位置和大小
    const isMobile = window.innerWidth < 1280;
    const bottomPos = isMobile ? 'bottom-4' : 'bottom-6';
    const rightPos = isMobile ? 'right-4' : 'right-6';
    const size = isMobile ? 'p-3' : 'p-4';
    const iconSize = isMobile ? 'w-5 h-5' : 'w-6 h-6';
    
    // 确保z-index足够高，不会被其他元素遮挡
    button.className = `fixed ${bottomPos} ${rightPos} bg-blue-600 text-white rounded-full ${size} shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all z-[9999] touch-manipulation`;
    button.style.zIndex = '9999'; // 确保在最上层
    button.innerHTML = `
      <svg class="${iconSize}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
      </svg>
    `;
    button.title = '提供反饋';
    button.setAttribute('aria-label', '提供反饋');
    
    // 统一使用click事件（touch设备会自动触发click）
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("[feedback-widget] 點擊反饋按鈕, chartId:", finalChartId);
      
      // 检查FeedbackWidget是否可用
      if (!window.UiComponents?.FeedbackWidget) {
        console.error("[feedback-widget] FeedbackWidget not available");
        alert('反饋功能暫不可用，請重新整理頁面重試');
        return;
      }
      
      try {
        // 通过window对象调用，确保作用域正确
        if (window.UiComponents?.FeedbackWidget?.showSatisfactionDialog) {
          window.UiComponents.FeedbackWidget.showSatisfactionDialog({ chartId: finalChartId });
        } else {
          // Fallback: 直接调用（如果在同一作用域）
          showSatisfactionDialog({ chartId: finalChartId });
        }
      } catch (err) {
        console.error("[feedback-widget] Error showing dialog:", err);
        alert('開啟反饋視窗失敗：' + (err.message || '未知錯誤'));
      }
    }, { passive: false });

    document.body.appendChild(button);
    console.log("[feedback-widget] 反饋按鈕已添加到DOM，位置:", button.className);
    
    // 验证按钮是否真的在DOM中
    setTimeout(() => {
      const checkBtn = document.getElementById('feedback-float-btn');
      if (checkBtn) {
        console.log("[feedback-widget] 反饋按鈕確認存在，位置:", checkBtn.getBoundingClientRect());
      } else {
        console.error("[feedback-widget] 反饋按鈕未找到！");
      }
    }, 100);
  }

  // 导出到 window.UiComponents.FeedbackWidget
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  window.UiComponents.FeedbackWidget = {
    showSatisfactionDialog,
    showPredictionAccuracyDialog,
    createFeedbackButton,
  };
})();
