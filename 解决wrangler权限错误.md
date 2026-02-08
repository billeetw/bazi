# 🔧 解决 Wrangler 权限错误

## ⚠️ 错误信息

```
✘ [ERROR] A permission error occurred while accessing the file system.
Affected path: /Users/bill/.Trash
```

## ✅ 解决方案

### 方法 1：清理 Wrangler 缓存（推荐）

```bash
# 清理 wrangler 缓存
rm -rf ~/.wrangler
rm -rf .wrangler

# 然后重新部署
npx wrangler pages deploy . --project-name=bazi
```

### 方法 2：使用 Git 部署（最简单）

如果项目已连接到 Cloudflare Pages 的 Git 集成，直接推送即可：

```bash
# 提交修复
git commit -m "fix: 修复 JavaScript 语法错误和依赖加载问题"

# 推送到远程（会自动触发 Cloudflare Pages 部署）
git push origin main
```

### 方法 3：修复 .Trash 权限

```bash
# 检查 .Trash 权限
ls -la ~/.Trash

# 如果需要，修复权限（谨慎操作）
chmod 755 ~/.Trash
```

### 方法 4：使用 sudo（不推荐，但可以尝试）

```bash
sudo npx wrangler pages deploy . --project-name=bazi
```

⚠️ **注意**：使用 sudo 可能不安全，建议先尝试其他方法。

### 方法 5：指定不同的输出目录

```bash
# 创建临时目录
mkdir -p /tmp/wrangler-deploy
cd /tmp/wrangler-deploy

# 复制项目文件（排除不需要的文件）
rsync -av --exclude='.git' --exclude='node_modules' --exclude='.wrangler' /Users/bill/bazi-project/ .

# 部署
npx wrangler pages deploy . --project-name=bazi
```

## 🎯 推荐方案：使用 Git 部署

这是最简单且最可靠的方法：

```bash
cd /Users/bill/bazi-project

# 1. 检查状态
git status

# 2. 提交所有修复
git add js/calc/baziCore.js js/calc/fourTransformations.js js/calc/overlapAnalysis.js js/calc.js js/ui.js index.html

git commit -m "fix: 修复 JavaScript 语法错误和依赖加载问题

- 修复 baziCore.js 解构赋值语法错误
- 修复 fourTransformations.js 依赖检查逻辑
- 修复 overlapAnalysis.js 依赖检查逻辑
- 移除 calc.js 中 mingBranch 的冗余赋值
- 改进 ui.js 的 window.Calc 未定义处理
- 更新所有版本号到 ?v=3"

# 3. 推送到远程
git push origin main
```

如果 Cloudflare Pages 已配置 Git 集成，推送后会自动部署。

## 🔍 检查 Cloudflare Pages Git 集成

1. 访问：https://dash.cloudflare.com/
2. 选择你的 Pages 项目
3. 查看「Settings」→「Builds & deployments」
4. 确认已连接到 Git 仓库

## 📝 如果 Git 集成未配置

### 选项 A：配置 Git 集成（推荐）

1. 在 Cloudflare Dashboard 中
2. 选择你的 Pages 项目
3. 「Settings」→「Builds & deployments」
4. 连接你的 Git 仓库（GitHub/GitLab/Bitbucket）
5. 配置构建设置：
   - Build command: （留空，因为这是静态站点）
   - Build output directory: `.`（当前目录）

### 选项 B：手动上传（临时方案）

如果 Git 集成有问题，可以：
1. 在 Cloudflare Dashboard 中
2. 选择你的 Pages 项目
3. 「Upload assets」
4. 上传整个项目文件夹（压缩为 zip）

## 🚀 快速操作

**最简单的方法**：

```bash
cd /Users/bill/bazi-project

# 清理缓存
rm -rf ~/.wrangler .wrangler

# 使用 Git 部署（如果已配置）
git add .
git commit -m "fix: 修复 JavaScript 语法错误"
git push origin main
```

如果 Git 未配置，尝试：

```bash
# 清理缓存后重试
rm -rf ~/.wrangler .wrangler
npx wrangler pages deploy . --project-name=bazi --compatibility-date=2026-02-05
```
