#!/bin/bash
echo "🚀 开始部署到生产环境..."
echo ""

# 检查 Git 状态
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  有未提交的更改"
    read -p "是否继续部署？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查语法
echo "🔍 检查语法..."
node -c js/calc/baziCore.js && \
node -c js/calc/fourTransformations.js && \
node -c js/calc/overlapAnalysis.js && \
node -c js/calc.js && \
node -c js/ui.js && \
echo "✅ 语法检查通过" || {
    echo "❌ 语法检查失败"
    exit 1
}

# 部署
echo "📦 部署到 Cloudflare Pages..."
npx wrangler pages deploy . --project-name=bazi

echo ""
echo "✅ 部署完成！"
echo "🌐 访问：https://www.17gonplay.com"
