#!/bin/bash
PORT=${1:-8789}
echo "🚀 启动 Cloudflare Pages 开发服务器..."
echo "📡 端口: $PORT"
echo ""
echo "🌐 访问地址:"
echo "  主页面: http://localhost:$PORT/"
echo "  API 测试: http://localhost:$PORT/api/auth/config"
echo ""
echo "按 Ctrl+C 停止服务器（若 8788 被占用可执行: ./start-dev.sh 8790）"
echo ""
cd "$(dirname "$0")"
npx wrangler pages dev . --port "$PORT"
