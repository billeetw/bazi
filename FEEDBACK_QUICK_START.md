# 🚀 用户反馈系统快速开始

## ✅ 系统已就绪

用户反馈系统已完全集成到应用中，包含以下功能：

1. **满意度反馈** - 用户可以对整体体验评分
2. **预测准确度反馈** - 用户可以验证预测是否准确
3. **浮动反馈按钮** - 计算完成后自动显示

---

## 📋 部署步骤

### 1. 数据库迁移（必需）

```bash
# 本地开发环境
npx wrangler d1 migrations apply consult-db --local

# 生产环境
npx wrangler d1 migrations apply consult-db
```

### 2. 验证部署

启动本地服务器测试：

```bash
python3 -m http.server 8000
```

访问 http://localhost:8000/index.html

---

## 🎯 功能说明

### 自动功能

1. **计算完成后自动显示反馈按钮**
   - 位置：右下角浮动按钮
   - 点击后显示满意度反馈弹窗

### 手动调用

```javascript
// 在浏览器控制台测试

// 1. 显示满意度反馈
window.UiComponents.FeedbackWidget.showSatisfactionDialog({
  chartId: 'test-chart-123'
});

// 2. 显示预测准确度反馈
window.UiComponents.FeedbackWidget.showPredictionAccuracyDialog({
  chartId: 'test-chart-123',
  category: 'palace',
  target: '命宮',
  predictedValue: '事业运势良好'
});
```

---

## 📊 查看反馈数据

### 通过API

```bash
# 获取统计数据
curl "https://17gonplay-api.billeetw.workers.dev/api/feedback?action=stats"

# 获取反馈列表
curl "https://17gonplay-api.billeetw.workers.dev/api/feedback?limit=10"
```

### 通过数据库查询

```sql
-- 查看最近10条反馈
SELECT * FROM feedback ORDER BY created_at DESC LIMIT 10;

-- 查看满意度统计
SELECT 
  satisfaction_rating,
  COUNT(*) as count
FROM feedback
WHERE satisfaction_rating IS NOT NULL
GROUP BY satisfaction_rating;

-- 查看预测准确度统计
SELECT 
  prediction_category,
  AVG(accuracy_rating) as avg_accuracy,
  COUNT(*) as count
FROM feedback
WHERE feedback_type = 'prediction'
GROUP BY prediction_category;
```

---

## 🎨 UI展示

### 反馈按钮
- **位置**: 右下角固定位置
- **样式**: 蓝色圆形按钮，带消息图标
- **触发**: 点击后显示满意度反馈弹窗

### 满意度反馈弹窗
- **评分**: 1-5星评分
- **文本反馈**: 可选的意见输入
- **提交**: 提交后显示成功消息，3秒后自动关闭

### 预测准确度反馈弹窗
- **预测信息**: 显示预测目标和预测值
- **实际值**: 用户可输入实际情况
- **准确度评分**: 1-5星评分
- **提交**: 提交后显示成功消息

---

## 🔧 自定义配置

### 修改反馈按钮位置

编辑 `js/ui/components/feedback-widget.js`:

```javascript
// 修改 createFeedbackButton 函数中的 className
button.className = 'fixed bottom-6 left-6 ...'; // 改为左下角
```

### 修改反馈提示时机

编辑 `js/ui.js`:

```javascript
// 在 calculate 函数中，可以添加延迟显示
setTimeout(() => {
  if (chartId && window.UiComponents?.FeedbackWidget) {
    window.UiComponents.FeedbackWidget.createFeedbackButton({ chartId });
  }
}, 5000); // 5秒后显示
```

---

## 📈 数据分析建议

### 1. 准确度趋势分析

定期查询预测准确度，识别需要改进的类别：

```sql
SELECT 
  DATE(created_at) as date,
  prediction_category,
  AVG(accuracy_rating) as avg_accuracy
FROM feedback
WHERE feedback_type = 'prediction'
GROUP BY DATE(created_at), prediction_category
ORDER BY date DESC;
```

### 2. 满意度分析

分析用户满意度变化：

```sql
SELECT 
  DATE(created_at) as date,
  AVG(satisfaction_rating) as avg_satisfaction,
  COUNT(*) as feedback_count
FROM feedback
WHERE satisfaction_rating IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 3. 反馈文本分析

提取常见问题和建议：

```sql
SELECT 
  feedback_text,
  COUNT(*) as frequency
FROM feedback
WHERE feedback_text IS NOT NULL AND LENGTH(feedback_text) > 10
GROUP BY feedback_text
ORDER BY frequency DESC
LIMIT 20;
```

---

## 🐛 故障排查

### 问题1: 反馈按钮未显示

**检查**:
1. 确认 `chartId` 是否存在
2. 检查浏览器控制台是否有错误
3. 确认反馈组件已加载：`window.UiComponents?.FeedbackWidget`

### 问题2: 提交失败

**检查**:
1. 确认API端点可访问
2. 检查网络请求（F12 → Network）
3. 确认数据库迁移已执行

### 问题3: 数据库错误

**检查**:
1. 确认迁移已执行：`npx wrangler d1 migrations list consult-db`
2. 检查表是否存在：`SELECT name FROM sqlite_master WHERE type='table' AND name='feedback';`

---

## 📝 下一步优化

1. **自动反馈提示** - 基于用户行为智能提示
2. **反馈奖励** - 提供积分或优惠券
3. **分析面板** - 管理员后台可视化
4. **ML集成** - 使用反馈数据训练模型
5. **验证流程** - 时间验证和可信度评分

---

**详细文档**: 查看 `FEEDBACK_SYSTEM_IMPLEMENTATION.md`
