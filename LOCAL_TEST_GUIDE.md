# 🧪 本地测试指南

## 快速启动

### 方法 1: 使用 Shell 脚本（推荐）

```bash
# 使用默认端口 8000
./start-local-server.sh

# 或指定端口
./start-local-server.sh 3000
```

### 方法 2: 使用 Node.js 脚本

```bash
# 使用默认端口 8000
node start-local-server.js

# 或指定端口
node start-local-server.js 3000
```

### 方法 3: 使用 Python（如果已安装）

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### 方法 4: 使用 npx（如果已安装 Node.js）

```bash
npx http-server -p 8000
```

## 🌐 测试链接

启动服务器后，在浏览器中访问：

### 主页面
```
http://localhost:8000/index.html
```

### UI 拆分测试页面
```
http://localhost:8000/test-ui-split.html
```

## 📋 测试检查清单

### 1. 基础功能测试
- [ ] 页面正常加载，无控制台错误
- [ ] 表单输入正常（年/月/日/时/分）
- [ ] 启动按钮可以点击
- [ ] 计算结果正常显示

### 2. UI 工具函数测试
- [ ] 年龄滑杆可以拖动
- [ ] 宫位点击可以打开详情
- [ ] 五行图表正常渲染（雷达图、条形图）
- [ ] 移动端底部面板可以打开/关闭

### 3. 渲染功能测试
- [ ] 紫微盘正常显示
- [ ] 宫位强度列表正常显示
- [ ] 流月卡片正常显示
- [ ] 五行能量条动画正常

### 4. 浏览器控制台检查
打开浏览器开发者工具（F12），检查：
- [ ] 无 JavaScript 错误
- [ ] 无模块加载错误
- [ ] 工具函数正确导出和使用

## 🔍 常见问题

### 问题 1: 端口被占用
**解决**: 使用其他端口
```bash
./start-local-server.sh 3000
```

### 问题 2: 模块未找到错误
**检查**:
1. 确认所有文件都在正确位置
2. 检查 `index.html` 中的脚本加载顺序
3. 查看浏览器控制台的错误信息

### 问题 3: CORS 错误
**解决**: 使用本地服务器而不是直接打开文件（file://）
- ✅ 使用 `http://localhost:8000/index.html`
- ❌ 不使用 `file:///path/to/index.html`

## 📝 测试报告模板

测试完成后，可以记录：

```
测试日期: YYYY-MM-DD
浏览器: Chrome/Firefox/Safari
版本: XX.XX

✅ 通过的功能:
- 年龄滑杆
- 宫位点击
- 五行图表

❌ 失败的功能:
- (如果有)

⚠️ 注意事项:
- (如果有)
```

---

**提示**: 如果遇到问题，检查浏览器控制台的错误信息，并确认所有依赖文件都已正确加载。
