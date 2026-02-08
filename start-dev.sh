#!/bin/bash
echo "🚀 启动 Cloudflare Pages 开发服务器..."
echo "📡 端口: 8788"
echo ""
echo "🌐 访问地址:"
echo "  主页面: http://localhost:8788/index.html"
echo "  API 测试: http://localhost:8788/api/auth/config"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""
cd "$(dirname "$0")"
npx wrangler pages dev . --port 8788
