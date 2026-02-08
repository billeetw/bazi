# 🧪 本地测试 - Strategic Panel 组件

## 🌐 访问地址

**主页面**: http://localhost:8788/index.html

## ✅ 测试重点：Strategic Panel 组件完整性

### 1. 清除浏览器缓存
- Mac: `Cmd + Shift + Delete`
- 或硬刷新：`Cmd + Shift + R`

### 2. 填写信息并启动计算
1. 填写完整的出生信息
2. 点击「啟動 · 人生戰略引擎」
3. 等待计算完成

### 3. 检查 Strategic Panel（十神戰略）组件

滚动到 **"2026 戰術建議（動態決策）"** 区域，应该看到：

#### ✅ Section A: 原廠設定與當前武裝 (The DNA)
- **命主（本命基因）**
  - 星曜名称（如：武曲）
  - 🎯 直擊 (50%) 话术
  - 核心价值描述

- **身主（後天工具）**
  - 星曜名称（如：天機）
  - 💭 啟發 (30%) 话术
  - 反思问题

#### ✅ Section B: 2026 能量天氣預報 (The Environment)
- **五行進度條**
  - 金、木、水、火、土 五个元素的进度条
  - 百分比显示
  - 颜色编码（红色≥30%，黄色≥20%，绿色<20%）
  - 超载预警（如果有）

#### ✅ Section C: 十神戰略 (The Strategy)
- **年度主旋律**
  - 主题文字（如：「從想做，到必須做。」）

- **行動清單**（✅ 绿色）
  - 多个行动建议项目
  - 列表格式

- **禁忌清單**（❌ 红色）
  - 多个禁忌项目
  - 列表格式

- **採集 (20%)**
  - 文本输入框
  - 占位符提示
  - 自动保存功能

### 4. 检查浏览器控制台

打开开发者工具（F12），查看 Console：

**应该看到**：
- ✅ 没有错误
- ✅ `[strategic-panel.js]` 相关日志（如果有）
- ✅ `[calculation-flow.js] renderTactics` 相关日志

**不应该看到**：
- ❌ `strategic-panel.js` 加载失败
- ❌ `renderStrategicPanel` 未定义
- ❌ `tacticalBox` 元素未找到

### 5. 检查组件是否完整显示

**如果缺少组件**，可能的原因：

1. **Section A 缺失**
   - 检查 `ziweiPalaceMetadata` 是否传递
   - 检查 `mingzhu` 和 `shengong` 是否有值

2. **Section B 缺失**
   - 检查 `bazi.wuxing.strategic` 是否有数据
   - 检查 `parseFiveElementsData` 是否返回数据

3. **Section C 缺失或内容不完整**
   - 检查 `dbContent.tenGods[dominant]` 是否有数据
   - 检查 `parseTenGodAdvice` 是否正确解析
   - 检查行动清单和禁忌清单是否被正确提取

### 6. 调试信息

如果组件不完整，请在控制台运行：

```javascript
// 检查 StrategicPanel 是否加载
console.log("StrategicPanel:", window.UiComponents?.StrategicPanel);

// 检查数据
console.log("bazi:", window.contract?.bazi);
console.log("ziweiPalaceMetadata:", window.ziweiPalaceMetadata);
console.log("dbContent:", window.dbContent);

// 检查 tacticalBox 元素
console.log("tacticalBox:", document.getElementById("tacticalBox"));
```

## 📋 需要的信息

请提供：
1. **哪些组件显示了**（Section A/B/C）
2. **哪些组件缺失了**
3. **控制台是否有错误**
4. **调试信息的输出**

## 🛑 停止服务器

在终端按 `Ctrl + C` 停止服务器
