/* user-identity.js
 * 用户标识服务模块
 * 导出到 window.UserIdentity
 * 提供匿名用户ID管理和反馈历史功能
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  const USER_ID_KEY = 'bazi_user_id';
  const FEEDBACK_HISTORY_PREFIX = 'feedback_history_';

  /**
   * 获取或创建用户ID
   * @returns {string} 用户唯一ID
   */
  function getOrCreateUserId() {
    try {
      let userId = localStorage.getItem(USER_ID_KEY);
      if (!userId) {
        // 生成唯一ID: user_timestamp_random
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        userId = `user_${timestamp}_${random}`;
        localStorage.setItem(USER_ID_KEY, userId);
        console.log('[user-identity] 创建新用户ID:', userId);
      }
      return userId;
    } catch (e) {
      console.warn('[user-identity] localStorage不可用，使用临时ID:', e);
      return 'temp_' + Date.now();
    }
  }

  /**
   * 获取用户ID（不创建）
   * @returns {string|null} 用户ID或null
   */
  function getUserId() {
    try {
      return localStorage.getItem(USER_ID_KEY);
    } catch (e) {
      return null;
    }
  }

  /**
   * 获取用户反馈历史
   * @param {string} [chartId] - 可选的图表ID过滤
   * @returns {Array} 反馈历史数组
   */
  function getFeedbackHistory(chartId) {
    try {
      const userId = getOrCreateUserId();
      const historyKey = `${FEEDBACK_HISTORY_PREFIX}${userId}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      if (chartId) {
        return history.filter(item => item.chartId === chartId);
      }
      
      return history;
    } catch (e) {
      console.warn('[user-identity] 获取反馈历史失败:', e);
      return [];
    }
  }

  /**
   * 保存反馈到历史记录
   * @param {Object} feedbackData - 反馈数据
   */
  function saveFeedbackToHistory(feedbackData) {
    try {
      const userId = getOrCreateUserId();
      const historyKey = `${FEEDBACK_HISTORY_PREFIX}${userId}`;
      const history = getFeedbackHistory();
      
      const historyItem = {
        ...feedbackData,
        userId,
        timestamp: new Date().toISOString(),
        id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      };
      
      history.push(historyItem);
      
      // 只保留最近100条记录
      const maxHistory = 100;
      if (history.length > maxHistory) {
        history.splice(0, history.length - maxHistory);
      }
      
      localStorage.setItem(historyKey, JSON.stringify(history));
      console.log('[user-identity] 反馈已保存到历史记录');
      
      return historyItem;
    } catch (e) {
      console.warn('[user-identity] 保存反馈历史失败:', e);
      return null;
    }
  }

  /**
   * 清除用户数据（用于测试或重置）
   */
  function clearUserData() {
    try {
      const userId = getUserId();
      if (userId) {
        localStorage.removeItem(USER_ID_KEY);
        localStorage.removeItem(`${FEEDBACK_HISTORY_PREFIX}${userId}`);
        console.log('[user-identity] 用户数据已清除');
      }
    } catch (e) {
      console.warn('[user-identity] 清除用户数据失败:', e);
    }
  }

  /**
   * 获取用户统计信息
   * @returns {Object} 统计信息
   */
  function getUserStats() {
    const history = getFeedbackHistory();
    const stats = {
      totalFeedback: history.length,
      averageRating: 0,
      lastFeedbackTime: null,
      feedbackByType: {},
    };

    if (history.length > 0) {
      const ratings = history
        .filter(item => item.rating)
        .map(item => item.rating);
      
      if (ratings.length > 0) {
        stats.averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      }

      stats.lastFeedbackTime = history[history.length - 1]?.timestamp || null;

      history.forEach(item => {
        const type = item.feedbackType || 'unknown';
        stats.feedbackByType[type] = (stats.feedbackByType[type] || 0) + 1;
      });
    }

    return stats;
  }

  // 导出到 window.UserIdentity
  window.UserIdentity = {
    getOrCreateUserId,
    getUserId,
    getFeedbackHistory,
    saveFeedbackToHistory,
    clearUserData,
    getUserStats,
  };
})();
