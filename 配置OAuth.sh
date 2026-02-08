#!/bin/bash
# OAuth 配置脚本 - 交互式配置工具

set -e

echo "🔐 OAuth 配置向导"
echo "=================="
echo ""

# 检查 .dev.vars 是否存在
if [ ! -f ".dev.vars" ]; then
    echo "❌ .dev.vars 文件不存在"
    echo "   请先创建: cp .dev.vars.example .dev.vars"
    exit 1
fi

# 备份现有文件
if [ -f ".dev.vars" ]; then
    cp .dev.vars .dev.vars.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ 已备份现有配置"
fi

# 读取现有配置
ADMIN_USER=""
ADMIN_PASSWORD=""
JWT_SECRET=""

if grep -q "^ADMIN_USER=" .dev.vars; then
    ADMIN_USER=$(grep "^ADMIN_USER=" .dev.vars | cut -d'=' -f2)
fi

if grep -q "^ADMIN_PASSWORD=" .dev.vars; then
    ADMIN_PASSWORD=$(grep "^ADMIN_PASSWORD=" .dev.vars | cut -d'=' -f2)
fi

if grep -q "^JWT_SECRET=" .dev.vars; then
    JWT_SECRET=$(grep "^JWT_SECRET=" .dev.vars | cut -d'=' -f2)
fi

# 如果没有 JWT_SECRET，生成一个
if [ -z "$JWT_SECRET" ]; then
    echo "🔑 生成 JWT Secret..."
    JWT_SECRET=$(openssl rand -hex 32)
    echo "✅ 已生成 JWT Secret"
else
    echo "✅ 使用现有 JWT Secret"
fi

echo ""
echo "📘 Google OAuth 配置"
echo "-------------------"
echo "1. 访问 https://console.cloud.google.com/"
echo "2. 创建项目 → 启用 Google+ API → 创建 OAuth 客户端"
echo "3. 配置回调 URL: http://localhost:8000/api/auth/google/callback"
echo ""
read -p "Google Client ID: " GOOGLE_CLIENT_ID
read -p "Google Client Secret: " GOOGLE_CLIENT_SECRET

echo ""
echo "📘 Facebook OAuth 配置"
echo "----------------------"
echo "1. 访问 https://developers.facebook.com/"
echo "2. 创建应用 → 添加 Facebook Login"
echo "3. 配置回调 URL: http://localhost:8000/api/auth/facebook/callback"
echo ""
read -p "Facebook App ID: " FACEBOOK_APP_ID
read -p "Facebook App Secret: " FACEBOOK_APP_SECRET

# 验证输入
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "⚠️  警告: Google OAuth 配置为空，OAuth 登录将不可用"
fi

if [ -z "$FACEBOOK_APP_ID" ] || [ -z "$FACEBOOK_APP_SECRET" ]; then
    echo "⚠️  警告: Facebook OAuth 配置为空，OAuth 登录将不可用"
fi

# 写入配置
cat > .dev.vars << EOF
# 后台管理配置
ADMIN_USER=${ADMIN_USER}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# OAuth 配置
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
FACEBOOK_APP_SECRET=${FACEBOOK_APP_SECRET}

# JWT Secret（用于生成认证 token）
JWT_SECRET=${JWT_SECRET}
EOF

echo ""
echo "✅ 配置已保存到 .dev.vars"
echo ""
echo "📝 下一步："
echo "1. 运行数据库迁移: npx wrangler d1 migrations apply consult-db --local"
echo "2. 启动服务器: npx wrangler pages dev . --port 8788"
echo "3. 测试 OAuth 登录"
echo ""
echo "💡 提示：如果需要修改配置，可以编辑 .dev.vars 文件"
echo "   或重新运行此脚本: ./配置OAuth.sh"
