/* feedback-history.js
 * 反馈历史查看组件
 * 导出到 window.UiComponents.FeedbackHistory
 * 依赖: window.UserIdentity
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  /**
   * 显示反馈历史弹窗
   */
  function showFeedbackHistory() {
    if (!window.UserIdentity) {
      alert('反馈历史功能暂不可用');
      return;
    }

    const history = window.UserIdentity.getFeedbackHistory();
    const stats = window.UserIdentity.getUserStats();

    const dialogId = 'feedback-history-dialog';
    let dialog = document.getElementById(dialogId);
    
    if (dialog) {
      dialog.remove();
    }

    dialog = document.createElement('div');
    dialog.id = dialogId;
    dialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4';
    dialog.style.zIndex = '10000';
    
    dialog.innerHTML = `
      <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col text-gray-900">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold">我的反馈历史</h3>
            <button id="close-history-dialog" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="mt-4 flex gap-4 text-sm">
            <div>
              <span class="text-gray-500">总反馈数：</span>
              <span class="font-bold">${stats.totalFeedback}</span>
            </div>
            ${stats.averageRating > 0 ? `
              <div>
                <span class="text-gray-500">平均评分：</span>
                <span class="font-bold">${stats.averageRating.toFixed(1)} ⭐</span>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          ${history.length === 0 ? `
            <div class="text-center py-12 text-gray-500">
              <div class="text-4xl mb-4">📝</div>
              <p>还没有反馈记录</p>
              <p class="text-sm mt-2">完成计算后提供反馈，记录会显示在这里</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${history.slice().reverse().map((item, index) => {
                const date = new Date(item.timestamp);
                const dateStr = date.toLocaleString('zh-TW', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                
                return `
                  <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-2">
                      <div>
                        <div class="font-semibold text-sm text-gray-700">
                          ${item.feedbackType === 'satisfaction' ? '满意度反馈' : 
                            item.feedbackType === 'prediction' ? '预测准确度反馈' : 
                            '其他反馈'}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">${dateStr}</div>
                      </div>
                      ${item.rating ? `
                        <div class="text-yellow-400 text-xl">
                          ${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}
                        </div>
                      ` : ''}
                    </div>
                    ${item.feedbackText ? `
                      <div class="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        ${item.feedbackText}
                      </div>
                    ` : ''}
                    ${item.chartId ? `
                      <div class="mt-2 text-xs text-gray-400">
                        图表ID: ${item.chartId.substring(0, 20)}...
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
        <div class="p-6 border-t border-gray-200 flex gap-2">
          <button id="close-history-btn" class="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
            关闭
          </button>
          ${history.length > 0 ? `
            <button id="clear-history-btn" class="px-4 py-2 text-red-600 hover:text-red-700 text-sm">
              清除历史
            </button>
          ` : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);

    // 关闭按钮
    const closeDialog = () => dialog.remove();
    dialog.querySelector('#close-history-dialog').addEventListener('click', closeDialog);
    dialog.querySelector('#close-history-btn').addEventListener('click', closeDialog);
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeDialog();
    });

    // 清除历史按钮
    const clearBtn = dialog.querySelector('#clear-history-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('确定要清除所有反馈历史吗？此操作不可恢复。')) {
          window.UserIdentity.clearUserData();
          dialog.remove();
          alert('反馈历史已清除');
        }
      });
    }
  }

  // 导出到 window.UiComponents.FeedbackHistory
  if (!window.UiComponents) {
    window.UiComponents = {};
  }

  window.UiComponents.FeedbackHistory = {
    showFeedbackHistory,
  };
})();
