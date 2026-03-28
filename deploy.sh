#!/bin/bash
echo "🚀 部署到生產環境..."
echo ""

# 載入部署用環境變數（CLOUDFLARE_API_TOKEN）
if [ -f ".env.deploy" ]; then
    set -a
    source .env.deploy
    set +a
    echo "✅ 已載入 .env.deploy"
else
    echo "⚠️  未找到 .env.deploy，請確認 CLOUDFLARE_API_TOKEN 已設定"
    echo "   複製 .env.deploy.example 為 .env.deploy 並填入 token"
fi

# 檢查 Git 狀態（DEPLOY_SKIP_CONFIRM=1 或 -y 可略過確認）
SKIP_CONFIRM="${DEPLOY_SKIP_CONFIRM:-0}"
for arg in "$@"; do
    if [ "$arg" = "-y" ] || [ "$arg" = "--yes" ]; then
        SKIP_CONFIRM=1
        break
    fi
done
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  有未提交的變更"
    if [ "$SKIP_CONFIRM" = "1" ]; then
        echo "    (略過確認，繼續部署)"
    else
        read -p "是否繼續部署？(y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# 建置主 bundle（index.html 依賴 dist/app.js）
echo "📦 建置主 bundle..."
npm run build:main || { echo "❌ build:main 失敗"; exit 1; }
echo "✅ 主 bundle 建置完成"

# 建置啟動動畫（選填，失敗不阻擋部署）
echo "📦 建置啟動動畫..."
npm run build:startup 2>/dev/null || echo "⚠️  build:startup 略過（可選）"

# 建置專家後台 bundle
echo "📦 建置專家後台 bundle..."
npm run build:expert-admin || { echo "❌ build:expert-admin 失敗"; exit 1; }
echo "✅ 專家後台 bundle 建置完成"

# 建置占卦頁 bundle
echo "📦 建置占卦頁 bundle..."
npm run build:divination || { echo "❌ build:divination 失敗"; exit 1; }
echo "✅ 占卦頁 bundle 建置完成"

# 建置命書 Viewer
echo "📦 建置命書 Viewer..."
npm run build:lifebook-viewer || { echo "❌ build:lifebook-viewer 失敗"; exit 1; }
echo "✅ 命書 Viewer 建置完成"

# 檢查 dist/app.js 存在
if [ ! -f "dist/app.js" ]; then
    echo "❌ dist/app.js 不存在"
    exit 1
fi

# 命書 viewer：避免未更新 dist 卻 deploy，導致線上永遠是舊 HTML（見 docs/lifebook-viewer-deploy-verification.md）
if [ ! -f "dist/lifebook-viewer.html" ]; then
    echo "❌ dist/lifebook-viewer.html 不存在（請先 npm run build:lifebook-viewer）"
    exit 1
fi
if ! grep -q 'searchParams.set("view", "timeline")' dist/lifebook-viewer.html 2>/dev/null; then
    echo "❌ dist/lifebook-viewer.html 內缺少補 view=timeline 的內嵌腳本，請勿部署。"
    echo "   請確認 lifebook-viewer.html 源碼已更新，並執行: npm run build:lifebook-viewer"
    exit 1
fi
echo "✅ dist/lifebook-viewer.html 已含 view=timeline 內嵌腳本"

# 執行 D1 migrations（consult-db）
echo "📦 執行 D1 migrations..."
npx wrangler d1 migrations apply consult-db --remote || { echo "❌ migrations 失敗"; exit 1; }
echo "✅ migrations 完成"

# 部署 Worker（API）
echo "📦 部署 Worker (bazi-api)..."
npm run deploy:worker || { echo "❌ Worker 部署失敗"; exit 1; }
echo "✅ Worker 部署完成"

# 部署 Pages
echo "📦 部署 Cloudflare Pages..."
npx wrangler pages deploy . --project-name=bazi --commit-dirty=true

echo ""
echo "✅ 部署完成！"
echo "🌐 網站：https://www.17gonplay.com"
