# 🧪 UI 功能测试指南

## 📋 快速开始

### 方法 1: 使用启动脚本（推荐）

```bash
# 在项目根目录执行
./start-test-server.sh
```

脚本会自动：
- 启动本地 HTTP 服务器（端口 8000）
- 打开浏览器访问测试页面
- 显示服务器状态

### 方法 2: 手动启动

```bash
# 在项目根目录执行
python3 -m http.server 8000
```

然后在浏览器中访问：
- **测试页面**: http://localhost:8000/index.html

### 方法 3: 使用其他工具

**Node.js (http-server)**:
```bash
npx http-server -p 8000
```

**PHP**:
```bash
php -S localhost:8000
```

**Ruby**:
```bash
ruby -run -e httpd . -p 8000
```

---

## ✅ 功能测试清单

请按照 `FUNCTIONAL_TEST_CHECKLIST.md` 中的清单逐项测试。

### 核心测试流程

1. **打开测试页面**
   - 访问 http://localhost:8000/index.html
   - 检查页面是否正常加载
   - 检查浏览器控制台是否有错误

2. **测试输入表单**
   - 填写出生年月日
   - 选择性别
   - 切换时间模式（精确时间/时辰）
   - 验证所有选择器正常工作

3. **测试计算功能**
   - 点击"启动人生战略引擎"按钮
   - 观察加载状态
   - 验证数据正确返回和渲染

4. **测试各个模块**
   - 八字数据渲染
   - 紫微网格显示
   - 宫位详情面板
   - 流月数据显示
   - 战术建议更新

5. **测试交互功能**
   - 点击宫位查看详情
   - 拖动年龄滑块
   - 点击五行图表查看含义
   - 测试移动端适配

---

## 🔍 浏览器控制台检查

打开浏览器开发者工具（F12），检查：

### 1. 控制台错误
```javascript
// 应该没有红色错误信息
// 检查是否有：
// - SyntaxError
// - ReferenceError
// - TypeError
// - 模块加载失败
```

### 2. 网络请求
```javascript
// 检查 API 请求是否成功
// - /compute/all (POST)
// - /charts/{chartId}/scores (GET)
// - /db/content (GET)
```

### 3. 模块加载
```javascript
// 在控制台执行，检查模块是否正确加载
console.log('UiComponents:', window.UiComponents);
console.log('UiServices:', window.UiServices);
console.log('UiUtils:', window.UiUtils);
console.log('UiConstants:', window.UiConstants);
```

### 4. 全局对象检查
```javascript
// 检查核心依赖
console.log('Calc:', typeof window.Calc);
console.log('UiDomHelpers:', typeof window.UiDomHelpers);
console.log('UiRenderHelpers:', typeof window.UiRenderHelpers);
```

---

## 🐛 常见问题排查

### 问题 1: 页面无法加载
**可能原因**:
- 服务器未启动
- 端口被占用
- 文件路径错误

**解决方法**:
```bash
# 检查端口占用
lsof -i :8000

# 停止占用进程
kill -9 <PID>

# 重新启动服务器
python3 -m http.server 8000
```

### 问题 2: 模块未定义错误
**可能原因**:
- 模块加载顺序错误
- 文件路径错误
- 语法错误导致模块未执行

**解决方法**:
1. 检查 `index.html` 中的 `<script>` 标签顺序
2. 检查浏览器 Network 标签，确认所有 JS 文件都成功加载
3. 检查控制台是否有语法错误

### 问题 3: API 请求失败
**可能原因**:
- 后端服务未运行
- CORS 问题
- 网络连接问题

**解决方法**:
1. 检查 API_BASE 配置是否正确
2. 检查后端服务是否运行
3. 查看 Network 标签中的请求详情

### 问题 4: UI 渲染异常
**可能原因**:
- DOM 元素未找到
- 数据格式不正确
- CSS 样式问题

**解决方法**:
1. 检查控制台是否有 DOM 相关错误
2. 检查数据格式是否符合预期
3. 检查元素 ID 是否正确

---

## 📊 性能测试

### 1. 页面加载时间
- 打开 Network 标签
- 刷新页面
- 记录总加载时间
- 检查各模块文件大小

### 2. 运行时性能
- 打开 Performance 标签
- 录制计算流程
- 检查是否有性能瓶颈

### 3. 内存使用
- 打开 Memory 标签
- 检查是否有内存泄漏
- 多次计算后检查内存增长

---

## 📝 测试报告模板

```markdown
# 测试报告 - [日期]

## 测试环境
- 浏览器: [Chrome/Firefox/Safari] [版本]
- 操作系统: [macOS/Windows/Linux] [版本]
- 测试时间: [YYYY-MM-DD HH:MM]

## 测试结果
- 总测试项: 17
- 通过: X
- 失败: Y
- 跳过: Z

## 详细结果
[按照 FUNCTIONAL_TEST_CHECKLIST.md 填写]

## 发现的问题
1. [问题描述]
   - 严重程度: [高/中/低]
   - 重现步骤: 
   - 预期行为: 
   - 实际行为: 

## 建议
[改进建议]
```

---

## 🚀 下一步

测试完成后：
1. 记录测试结果到 `FUNCTIONAL_TEST_CHECKLIST.md`
2. 如有问题，创建 issue 或修复
3. 考虑添加自动化测试（Jest/Playwright）
