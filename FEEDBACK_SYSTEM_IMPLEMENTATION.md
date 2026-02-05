# 用户反馈系统实施文档

## ✅ 已完成的工作

### 1. 数据库设计 ✅
- **文件**: `migrations/0003_create_feedback.sql`
- **表结构**: `feedback` 表
- **功能**:
  - 支持多种反馈类型（prediction, satisfaction, accuracy, suggestion）
  - 预测准确度追踪
  - 满意度评分
  - 隐私保护（用户哈希、IP哈希）
  - 统计分析视图

### 2. 后端API ✅
- **文件**: `functions/api/feedback.js`
- **端点**:
  - `POST /api/feedback` - 提交反馈
  - `GET /api/feedback?action=stats` - 获取统计数据
  - `GET /api/feedback` - 获取反馈列表（管理员）

### 3. 前端服务模块 ✅
- **文件**: `js/ui/services/feedback-service.js`
- **功能**:
  - `submitFeedback()` - 通用反馈提交
  - `submitPredictionFeedback()` - 预测准确度反馈
  - `submitSatisfactionFeedback()` - 满意度反馈
  - `getFeedbackStats()` - 获取统计数据
  - `generateUserHash()` - 用户哈希生成（隐私保护）

### 4. UI组件 ✅
- **文件**: `js/ui/components/feedback-widget.js`
- **功能**:
  - `showSatisfactionDialog()` - 显示满意度反馈弹窗
  - `showPredictionAccuracyDialog()` - 显示预测准确度反馈弹窗
  - `createFeedbackButton()` - 创建浮动反馈按钮

### 5. 系统集成 ✅
- **index.html**: 已添加反馈服务和组件脚本
- **ui.js**: 已集成反馈按钮创建逻辑

---

## 🚀 使用方法

### 基本使用

```javascript
// 1. 显示满意度反馈弹窗
window.UiComponents.FeedbackWidget.showSatisfactionDialog({
  chartId: 'chart-123',
  onSubmitted: (result) => {
    console.log('反馈已提交:', result);
  }
});

// 2. 显示预测准确度反馈弹窗
window.UiComponents.FeedbackWidget.showPredictionAccuracyDialog({
  chartId: 'chart-123',
  category: 'palace', // 'palace' | 'liuyue' | 'tactics' | 'overall'
  target: '命宮',
  predictedValue: '事业运势良好',
  onSubmitted: (result) => {
    console.log('反馈已提交:', result);
  }
});

// 3. 创建浮动反馈按钮（自动在计算完成后创建）
window.UiComponents.FeedbackWidget.createFeedbackButton({
  chartId: 'chart-123'
});
```

### 直接调用服务

```javascript
// 提交预测反馈
await window.UiServices.FeedbackService.submitPredictionFeedback({
  chartId: 'chart-123',
  category: 'palace',
  target: '命宮',
  predictedValue: '事业运势良好',
  actualValue: '确实获得了晋升',
  accuracyRating: 5, // 1-5
  contextData: { bazi: {...}, ziwei: {...} }
});

// 提交满意度反馈
await window.UiServices.FeedbackService.submitSatisfactionFeedback({
  chartId: 'chart-123',
  rating: 4, // 1-5
  category: 'overall',
  feedbackText: '整体体验很好',
  positiveAspects: ['界面美观', '预测准确'],
  negativeAspects: ['加载速度稍慢']
});
```

---

## 📊 数据库迁移

### 本地开发环境

```bash
# 应用迁移
npx wrangler d1 migrations apply consult-db --local
```

### 生产环境

```bash
# 应用迁移
npx wrangler d1 migrations apply consult-db
```

---

## 🔍 数据查询示例

### 获取反馈统计

```sql
-- 查看整体统计
SELECT * FROM feedback_accuracy_stats;

-- 查看满意度分布
SELECT 
  satisfaction_rating,
  COUNT(*) as count
FROM feedback
WHERE satisfaction_rating IS NOT NULL
GROUP BY satisfaction_rating
ORDER BY satisfaction_rating DESC;

-- 查看预测准确度
SELECT 
  prediction_category,
  AVG(accuracy_rating) as avg_accuracy,
  COUNT(*) as total_count
FROM feedback
WHERE feedback_type = 'prediction'
GROUP BY prediction_category;
```

---

## 🎯 后续优化建议

### 1. 自动反馈提示
- 在用户查看结果后，延迟3-5秒显示反馈提示
- 基于用户行为（停留时间、交互深度）决定是否显示

### 2. 反馈奖励机制
- 提供积分或优惠券激励用户反馈
- 反馈后解锁更多功能

### 3. 反馈分析面板
- 创建管理员后台查看反馈统计
- 可视化展示准确度趋势
- 识别需要改进的预测类别

### 4. 机器学习集成
- 使用反馈数据训练ML模型
- 自动调整预测权重
- 提升整体准确度

### 5. 反馈验证流程
- 用户标记"已验证"的预测
- 时间验证（预测未来事件，到期后验证）
- 建立可信度评分系统

---

## 📝 API文档

### POST /api/feedback

**请求体**:
```json
{
  "chartId": "chart-123",
  "feedbackType": "prediction", // "prediction" | "satisfaction" | "accuracy" | "suggestion"
  "predictionCategory": "palace",
  "predictionTarget": "命宮",
  "predictedValue": "事业运势良好",
  "actualValue": "确实获得了晋升",
  "accuracyRating": 5,
  "satisfactionRating": 4,
  "satisfactionCategory": "overall",
  "feedbackText": "整体体验很好",
  "positiveAspects": "界面美观,预测准确",
  "negativeAspects": "加载速度稍慢",
  "contextData": {...}
}
```

**响应**:
```json
{
  "ok": true,
  "id": "feedback-uuid"
}
```

### GET /api/feedback?action=stats

**响应**:
```json
{
  "ok": true,
  "overall": {
    "total_feedback": 150,
    "avg_satisfaction": 4.2,
    "avg_accuracy": 3.8
  },
  "byCategory": [
    {
      "prediction_category": "palace",
      "count": 50,
      "avg_accuracy": 4.0
    },
    ...
  ]
}
```

---

## 🔒 隐私保护

- **用户哈希**: 使用SHA256哈希用户标识（email/IP），保护隐私
- **IP哈希**: IP地址也进行哈希处理
- **匿名反馈**: 不强制要求用户登录
- **数据最小化**: 只收集必要的反馈数据

---

## ✅ 测试清单

- [ ] 数据库迁移成功
- [ ] API端点正常工作
- [ ] 前端服务模块加载正常
- [ ] UI组件显示正常
- [ ] 反馈提交成功
- [ ] 统计数据查询正常
- [ ] 移动端适配正常
- [ ] 错误处理正常

---

**完成日期**: 2026-02-04  
**版本**: v1.0
