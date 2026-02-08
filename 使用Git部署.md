# 🚀 使用 Git 部署（推荐方法）

## ✅ 优势

- ✅ 避免 wrangler 权限问题
- ✅ 自动触发 Cloudflare Pages 部署
- ✅ 保留部署历史记录
- ✅ 更安全可靠

## 📋 部署步骤

### 1. 提交所有修复

```bash
cd /Users/bill/bazi-project

# 添加修复的文件
git add js/calc/baziCore.js \
        js/calc/fourTransformations.js \
        js/calc/overlapAnalysis.js \
        js/calc.js \
        js/ui.js \
        index.html

# 提交
git commit -m "fix: 修复 JavaScript 语法错误和依赖加载问题

- 修复 baziCore.js 解构赋值语法错误
- 修复 fourTransformations.js 依赖检查逻辑
- 修复 overlapAnalysis.js 依赖检查逻辑
- 移除 calc.js 中 mingBranch 的冗余赋值
- 改进 ui.js 的 window.Calc 未定义处理
- 更新所有版本号到 ?v=3"
```

### 2. 推送到 GitHub

```bash
git push origin main
```

如果默认分支是 `master`：

```bash
git push origin master
```

### 3. Cloudflare Pages 自动部署

如果 Cloudflare Pages 已连接到 GitHub 仓库，推送后会自动：
1. 检测到新的提交
2. 开始构建和部署
3. 部署到生产环境

通常需要 1-2 分钟完成部署。

## 🔍 检查 Cloudflare Pages Git 集成

1. 访问：https://dash.cloudflare.com/
2. 选择你的 Pages 项目（`bazi`）
3. 查看「Settings」→「Builds & deployments」
4. 确认已连接到 `billeetw/bazi` 仓库

## 📝 如果 Git 集成未配置

### 配置步骤：

1. 在 Cloudflare Dashboard 中
2. 选择你的 Pages 项目
3. 「Settings」→「Builds & deployments」
4. 点击「Connect to Git」
5. 选择 GitHub 并授权
6. 选择仓库：`billeetw/bazi`
7. 配置构建设置：
   - **Framework preset**: None
   - **Build command**: （留空）
   - **Build output directory**: `.`（当前目录）
   - **Root directory**: `/`（根目录）
8. 保存并部署

## 🎯 快速命令（复制粘贴）

```bash
cd /Users/bill/bazi-project

git add js/calc/baziCore.js js/calc/fourTransformations.js js/calc/overlapAnalysis.js js/calc.js js/ui.js index.html

git commit -m "fix: 修复 JavaScript 语法错误和依赖加载问题"

git push origin main
```

## ✅ 部署后验证

1. **等待部署完成**（1-2 分钟）
   - 在 Cloudflare Dashboard 查看部署状态

2. **清除浏览器缓存**
   - `Ctrl + Shift + Delete` (Windows) 或 `Cmd + Shift + Delete` (Mac)
   - 选择「缓存的图片和文件」
   - 时间范围选择「全部时间」

3. **硬刷新页面**
   - `Ctrl + F5` (Windows) 或 `Cmd + Shift + R` (Mac)

4. **检查版本号**
   - 打开开发者工具 (F12) → Network 标签
   - 刷新页面
   - 确认所有文件版本号为 `?v=3`

5. **检查控制台**
   - 确认没有 JavaScript 错误

## 🐛 如果 Git 推送失败

### 检查 Git 配置

```bash
# 检查远程仓库
git remote -v

# 检查当前分支
git branch

# 检查状态
git status
```

### 常见问题

**问题 1**: `Permission denied`
```bash
# 检查 SSH 密钥
ssh -T git@github.com
```

**问题 2**: `branch 'main' has no upstream branch`
```bash
# 设置上游分支
git push -u origin main
```

## 🎉 完成！

部署完成后，访问 `https://www.17gonplay.com` 应该可以正常工作了！
