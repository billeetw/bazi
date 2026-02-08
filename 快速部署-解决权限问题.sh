#!/bin/bash
# 快速部署脚本 - 解决 wrangler 权限问题

echo "🚀 开始部署到生产环境..."
echo ""

# 方法 1: 尝试清理缓存后部署
echo "📦 方法 1: 清理缓存后部署..."
rm -rf ~/.wrangler 2>/dev/null
rm -rf .wrangler 2>/dev/null
echo "✅ 缓存已清理"

# 检查 Git 是否配置
if git remote -v | grep -q "origin"; then
    echo ""
    echo "📦 方法 2: 使用 Git 部署（推荐）..."
    echo "Git 仓库已配置，建议使用 Git 推送："
    echo ""
    echo "  git add js/calc/baziCore.js js/calc/fourTransformations.js js/calc/overlapAnalysis.js js/calc.js js/ui.js index.html"
    echo "  git commit -m 'fix: 修复 JavaScript 语法错误'"
    echo "  git push origin main"
    echo ""
    read -p "是否现在使用 Git 部署？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add js/calc/baziCore.js js/calc/fourTransformations.js js/calc/overlapAnalysis.js js/calc.js js/ui.js index.html
        git commit -m "fix: 修复 JavaScript 语法错误和依赖加载问题" || echo "⚠️  提交失败或没有更改"
        git push origin main && echo "✅ Git 推送成功，Cloudflare Pages 将自动部署" || echo "❌ Git 推送失败"
        exit 0
    fi
fi

# 方法 3: 尝试直接部署
echo ""
echo "📦 方法 3: 尝试直接部署..."
npx wrangler pages deploy . --project-name=bazi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 部署成功！"
    echo "🌐 访问：https://www.17gonplay.com"
else
    echo ""
    echo "❌ 部署失败"
    echo ""
    echo "💡 建议："
    echo "1. 使用 Git 部署（如果已配置 Git 集成）"
    echo "2. 或在 Cloudflare Dashboard 手动上传文件"
    echo "3. 检查 ~/.Trash 权限：ls -la ~/.Trash"
fi
