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

# 建置主 bundle（index.html 依賴 dist/app.js）
echo "📦 建置主 bundle..."
npm run build:main || {
    echo "❌ build:main 失败"
    exit 1
}
echo "✅ bundle 建置完成"

# 检查 dist/app.js 存在
if [ ! -f "dist/app.js" ]; then
    echo "❌ dist/app.js 不存在"
    exit 1
fi

# 部署
echo "📦 部署到 Cloudflare Pages..."
npx wrangler pages deploy . --project-name=bazi

echo ""
echo "✅ 部署完成！"
echo "🌐 访问：https://www.17gonplay.com"
