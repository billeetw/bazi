# 🔧 修复 StateManager 警告

## 📋 问题描述

线上测试时出现多个 `[StateManager] Unknown state key` 警告：

1. `overlapAnalysis` - 叠宫分析数据
2. `luckIndex` - 好命指数
3. `monthlyHealthRisk` - 月度健康风险
4. `healthWarning` - 健康预警
5. `aiPrompt` - AI Prompt
6. `structuredData` - 结构化数据

## 🔍 问题原因

`js/state.js` 中的 `state` 对象只定义了少数几个状态键：
- `ziweiPalaceMetadata`
- `ziweiScores`
- `currentSelectedPalace`

但是 `calc.js` 和其他组件中尝试设置的其他状态键没有在 `state` 对象中定义，导致 StateManager 发出警告。

## ✅ 修复内容

### 1. 更新 `js/state.js`

添加了所有缺失的状态键到 `state` 对象：

```javascript
const state = {
  // 原有状态
  ziweiPalaceMetadata: null,
  ziweiScores: null,
  currentSelectedPalace: null,
  
  // 新增状态
  overlapAnalysis: null,        // 叠宫分析数据
  luckIndex: null,              // 好命指数
  monthlyHealthRisk: null,      // 月度健康风险
  healthWarning: null,          // 健康预警
  aiPrompt: null,               // AI Prompt
  structuredData: null,         // 结构化数据
  geolocation: null,            // 地理位置数据
  expertQuestionnaire: null,    // 专家问卷答案
};
```

### 2. 优化 `resetState` 方法

将硬编码的重置逻辑改为动态遍历所有状态键：

```javascript
resetState(keys = null) {
  if (keys === null) {
    // 重置所有狀態（动态遍历）
    Object.keys(state).forEach(key => {
      state[key] = null;
    });
  } else {
    // 重置指定狀態
    keys.forEach(key => {
      if (key in state) {
        state[key] = null;
      }
    });
  }
}
```

### 3. 更新版本号

- `index.html`: `js/state.js?v=1` → `js/state.js?v=2`

## 🎯 修复效果

修复后：
- ✅ 所有状态键都已注册
- ✅ 不再出现 `Unknown state key` 警告
- ✅ 状态管理更加完整和统一
- ✅ `resetState` 方法更加灵活

## 📝 相关文件

- `js/state.js` - 状态管理器
- `js/calc.js` - 使用 StateManager 设置状态
- `js/ui/components/geolocation-calibration.js` - 使用 StateManager
- `js/ui/components/expert-questionnaire.js` - 使用 StateManager

## 🚀 部署状态

- ✅ 已提交到 Git
- ✅ 已推送到远程仓库
- ⏳ Cloudflare Pages 自动部署中（1-2 分钟）

部署完成后，线上环境将不再出现这些警告。
