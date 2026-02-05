/* feedback-service.js
 * 用户反馈服务模块
 * 导出到 window.UiServices.FeedbackService
 * 依赖: window.UiServices.ApiService
 */

(function () {
  "use strict";

  if (typeof window === "undefined") {
    throw new Error("window object not available");
  }

  // 使用相对路径访问 Cloudflare Pages Functions
  // 如果部署在 Cloudflare Pages，Functions 会自动处理 /api/* 路由
  // 注意：反馈 API 使用相对路径，不使用 ApiService 的 API_BASE（因为它是 Workers URL）
  const API_BASE = "";

  /**
   * 生成用户哈希（隐私保护）
   * @param {string} identifier - 标识符（email或IP）
   * @returns {Promise<string>} SHA256哈希值
   */
  async function generateUserHash(identifier) {
    if (!identifier) return null;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(identifier);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('[feedback-service] Failed to generate hash:', e);
      return null;
    }
  }

  /**
   * 提交反馈
   * @param {Object} feedbackData - 反馈数据
   * @param {string} feedbackData.chartId - 图表ID
   * @param {string} feedbackData.feedbackType - 反馈类型: 'prediction' | 'satisfaction' | 'accuracy' | 'suggestion'
   * @param {Object} [feedbackData.prediction] - 预测反馈数据
   * @param {Object} [feedbackData.satisfaction] - 满意度反馈数据
   * @param {string} [feedbackData.feedbackText] - 自由文本反馈
   * @param {Object} [feedbackData.contextData] - 上下文数据（bazi, ziwei等）
   * @returns {Promise<Object>} API响应
   */
  async function submitFeedback(feedbackData) {
    const {
      chartId,
      feedbackType,
      prediction,
      satisfaction,
      feedbackText,
      positiveAspects,
      negativeAspects,
      contextData,
    } = feedbackData;

    if (!chartId) {
      throw new Error('chartId 是必填項');
    }

    if (!feedbackType) {
      throw new Error('feedbackType 是必填項');
    }

    // 获取用户ID（如果可用）
    const userId = window.UserIdentity?.getOrCreateUserId?.() || null;
    const userHash = userId ? await generateUserHash(userId) : null;

    // 构建请求体
    const body = {
      chartId,
      feedbackType,
      feedbackText: feedbackText || null,
      positiveAspects: positiveAspects || null,
      negativeAspects: negativeAspects || null,
      contextData: contextData || null,
      userHash, // 添加用户哈希（隐私保护）
    };

    // 添加预测相关数据
    if (prediction) {
      body.predictionCategory = prediction.category || null;
      body.predictionTarget = prediction.target || null;
      body.predictedValue = prediction.predictedValue || null;
      body.actualValue = prediction.actualValue || null;
      body.accuracyRating = prediction.accuracyRating || null;
    }

    // 添加满意度相关数据
    if (satisfaction) {
      body.satisfactionRating = satisfaction.rating || null;
      body.satisfactionCategory = satisfaction.category || null;
    }

    // 生成用户哈希（可选，保护隐私）
    // 注意：实际应用中可能需要从cookie或localStorage获取用户标识
    // 这里暂时跳过，由后端处理

    try {
      // 使用相对路径，Cloudflare Pages Functions 会自动处理
      const apiUrl = API_BASE ? `${API_BASE}/api/feedback` : '/api/feedback';
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errorText = await resp.text().catch(() => '');
        throw new Error(`API HTTP ${resp.status}: ${errorText}`);
      }

      const result = await resp.json();
      if (!result.ok) {
        throw new Error(result.error || '提交反饋失敗');
      }

      return result;
    } catch (error) {
      console.error('[feedback-service] submitFeedback error:', error);
      throw error;
    }
  }

  /**
   * 提交预测准确度反馈
   * @param {Object} params - 参数
   * @param {string} params.chartId - 图表ID
   * @param {string} params.category - 预测类别: 'palace' | 'liuyue' | 'tactics' | 'overall'
   * @param {string} params.target - 预测目标（如：'命宮', '2026-03'）
   * @param {string} params.predictedValue - 预测值
   * @param {string} [params.actualValue] - 实际值（用于验证）
   * @param {number} params.accuracyRating - 准确度评分 1-5
   * @param {Object} [params.contextData] - 上下文数据
   * @returns {Promise<Object>} API响应
   */
  async function submitPredictionFeedback(params) {
    return submitFeedback({
      chartId: params.chartId,
      feedbackType: 'prediction',
      prediction: {
        category: params.category,
        target: params.target,
        predictedValue: params.predictedValue,
        actualValue: params.actualValue,
        accuracyRating: params.accuracyRating,
      },
      contextData: params.contextData,
    });
  }

  /**
   * 提交满意度反馈
   * @param {Object} params - 参数
   * @param {string} params.chartId - 图表ID
   * @param {number} params.rating - 满意度评分 1-5
   * @param {string} [params.category] - 满意度类别: 'ui' | 'accuracy' | 'usefulness' | 'overall'
   * @param {string} [params.feedbackText] - 反馈文本
   * @param {string[]} [params.positiveAspects] - 积极方面
   * @param {string[]} [params.negativeAspects] - 消极方面
   * @returns {Promise<Object>} API响应
   */
  async function submitSatisfactionFeedback(params) {
    return submitFeedback({
      chartId: params.chartId,
      feedbackType: 'satisfaction',
      satisfaction: {
        rating: params.rating,
        category: params.category || 'overall',
      },
      feedbackText: params.feedbackText,
      positiveAspects: params.positiveAspects?.join(', ') || null,
      negativeAspects: params.negativeAspects?.join(', ') || null,
    });
  }

  /**
   * 获取反馈统计（需要管理员权限）
   * @returns {Promise<Object>} 统计数据
   */
  async function getFeedbackStats() {
    try {
      // 使用相对路径，Cloudflare Pages Functions 会自动处理
      const apiUrl = API_BASE ? `${API_BASE}/api/feedback?action=stats` : '/api/feedback?action=stats';
      const resp = await fetch(apiUrl, {
        method: 'GET',
      });

      if (!resp.ok) {
        throw new Error(`API HTTP ${resp.status}`);
      }

      const result = await resp.json();
      if (!result.ok) {
        throw new Error(result.error || '獲取統計數據失敗');
      }

      return result;
    } catch (error) {
      console.error('[feedback-service] getFeedbackStats error:', error);
      throw error;
    }
  }

  // 导出到 window.UiServices.FeedbackService
  if (!window.UiServices) {
    window.UiServices = {};
  }

  window.UiServices.FeedbackService = {
    submitFeedback,
    submitPredictionFeedback,
    submitSatisfactionFeedback,
    getFeedbackStats,
    generateUserHash,
  };
})();
