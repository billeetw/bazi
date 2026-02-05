# 反馈系统界面整合指南

## 🎯 整合方案

反馈系统现在已整合到界面的多个位置，提供多种反馈入口：

### 1. 浮动按钮（默认）✅
- **位置**: 右下角固定位置
- **样式**: 蓝色圆形按钮，带消息图标
- **触发**: 点击后显示满意度反馈弹窗
- **优势**: 始终可见，不占用主要内容空间

### 2. 摘要区域反馈链接 ✅
- **位置**: `ws-summary` 区域的导航芯片区域
- **样式**: 与其他导航芯片一致的样式
- **文本**: "💬 反馈"
- **触发**: 点击后显示满意度反馈弹窗

### 3. 顶部导航栏反馈链接 ✅
- **位置**: `workspaceNav` 导航栏
- **样式**: 与其他导航芯片一致的样式
- **文本**: "💬 反馈"
- **触发**: 点击后显示满意度反馈弹窗
- **显示**: 仅在桌面端显示（md以上）

### 4. 移动端底部导航反馈链接 ✅
- **位置**: `.bottom-nav` 底部导航栏
- **样式**: 与其他导航链接一致的样式
- **文本**: "💬 反馈"
- **触发**: 点击后显示满意度反馈弹窗
- **显示**: 仅在移动端显示（md以下）

---

## 🔧 配置选项

在 `ui.js` 中可以配置整合选项：

```javascript
window.UiComponents.FeedbackIntegration.integrateFeedback(chartId, {
  showInSummary: true,      // 在摘要区域添加反馈链接
  showInNav: true,          // 在导航栏添加反馈链接
  showInBottomNav: true,    // 在移动端底部导航添加
  showPrompts: false,       // 不在各个section添加提示
  showDelayedPrompt: false, // 不显示延迟提示
});
```

### 选项说明

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showInSummary` | boolean | true | 在摘要区域添加反馈链接 |
| `showInNav` | boolean | true | 在顶部导航栏添加反馈链接 |
| `showInBottomNav` | boolean | true | 在移动端底部导航添加反馈链接 |
| `showPrompts` | boolean | false | 在各个section添加反馈提示 |
| `showDelayedPrompt` | boolean | false | 延迟显示反馈提示（30秒后） |
| `delaySeconds` | number | 30 | 延迟提示的延迟秒数 |

---

## 📍 整合位置详情

### 摘要区域 (`ws-summary`)

```html
<section id="ws-summary" class="glass dashboard-card">
  <div class="flex flex-wrap gap-2">
    <a href="#ws-ziwei" class="nav-chip">去紫微</a>
    <a href="#ws-bazi" class="nav-chip">去八字五行</a>
    <a href="#ws-liuyue" class="nav-chip">去流月</a>
    <a href="#ws-consult" class="nav-chip bg-white/15">諮詢</a>
    <a href="#" class="nav-chip feedback-link">💬 反馈</a> <!-- 新增 -->
  </div>
</section>
```

### 顶部导航栏 (`workspaceNav`)

```html
<div id="workspaceNav" class="hidden md:flex items-center gap-2">
  <a class="nav-chip" href="#ws-ziwei">紫微</a>
  <a class="nav-chip" href="#ws-bazi">八字五行</a>
  <a class="nav-chip" href="#ws-liuyue">流月節奏</a>
  <a class="nav-chip" href="#ws-strategy">戰略面板</a>
  <a class="nav-chip" href="#ws-consult">諮詢</a>
  <a href="#" class="nav-chip feedback-nav-link">💬 反馈</a> <!-- 新增 -->
</div>
```

### 移动端底部导航 (`.bottom-nav`)

```html
<nav class="bottom-nav">
  <a href="#ws-ziwei">紫微</a>
  <a href="#ws-bazi">八字</a>
  <a href="#ws-liuyue">流月</a>
  <a href="#ws-consult">諮詢</a>
  <a href="#" class="feedback-bottom-link">💬 反馈</a> <!-- 新增 -->
</nav>
```

---

## 🎨 样式定制

### 修改反馈链接样式

在 `index.html` 的 `<style>` 标签中添加：

```css
/* 反馈链接样式 */
.feedback-link,
.feedback-nav-link {
  background: rgba(59, 130, 246, 0.2); /* 蓝色背景 */
  border-color: rgba(59, 130, 246, 0.4);
}

.feedback-link:hover,
.feedback-nav-link:hover {
  background: rgba(59, 130, 246, 0.3);
}

/* 移动端反馈链接 */
.feedback-bottom-link {
  flex: 0 0 auto;
  min-width: 60px;
}
```

---

## 🚀 高级功能

### 1. 在各个Section添加反馈提示

启用后，会在各个section底部添加反馈提示：

```javascript
integrateFeedback(chartId, {
  showPrompts: true, // 启用section提示
});
```

**效果**:
- 紫微section: "对紫微预测的准确度有反馈？"
- 流月section: "对流月预测有反馈？"
- 战略面板: "对战术建议有反馈？"

### 2. 延迟显示反馈提示

在用户浏览一段时间后显示不打扰的提示：

```javascript
integrateFeedback(chartId, {
  showDelayedPrompt: true,
  delaySeconds: 30, // 30秒后显示
});
```

**效果**:
- 30秒后显示一个小提示框
- 10秒后自动消失
- 可以点击"反馈"或"稍后"

---

## 📱 响应式设计

### 桌面端（≥1280px）
- ✅ 浮动按钮（右下角）
- ✅ 摘要区域反馈链接
- ✅ 顶部导航栏反馈链接

### 移动端（<1280px）
- ✅ 浮动按钮（右下角，较小）
- ✅ 摘要区域反馈链接
- ✅ 底部导航反馈链接

---

## 🔍 调试

### 检查整合状态

在浏览器控制台执行：

```javascript
// 检查模块是否加载
console.log('FeedbackWidget:', window.UiComponents?.FeedbackWidget);
console.log('FeedbackIntegration:', window.UiComponents?.FeedbackIntegration);

// 检查反馈链接是否存在
console.log('Summary feedback link:', document.querySelector('.feedback-link'));
console.log('Nav feedback link:', document.querySelector('.feedback-nav-link'));
console.log('Bottom nav feedback link:', document.querySelector('.feedback-bottom-link'));
```

---

## ✅ 当前整合状态

- ✅ 浮动按钮（默认）
- ✅ 摘要区域反馈链接
- ✅ 顶部导航栏反馈链接
- ✅ 移动端底部导航反馈链接
- ⚪ Section提示（可选）
- ⚪ 延迟提示（可选）

---

**最后更新**: 2026-02-04
