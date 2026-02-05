#!/bin/bash
# 启动本地测试服务器

PORT=${1:-8000}

echo "🚀 启动本地测试服务器..."
echo "📡 端口: $PORT"
echo ""
echo "🌐 访问地址:"
echo "  主页面: http://localhost:$PORT/index.html"
echo "  UI 测试: http://localhost:$PORT/test-ui-split.html"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 检查 Python 版本
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
elif command -v node &> /dev/null; then
    # 使用 Node.js http-server（如果已安装）
    if command -v npx &> /dev/null; then
        npx http-server -p $PORT
    else
        echo "❌ 未找到 Python 或 Node.js，请安装其中一个"
        exit 1
    fi
else
    echo "❌ 未找到 Python 或 Node.js，请安装其中一个"
    exit 1
fi
