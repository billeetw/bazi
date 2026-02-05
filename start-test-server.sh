#!/bin/bash
# 启动本地测试服务器

PORT=8000
PID_FILE="/tmp/bazi-test-server.pid"

# 检查端口是否已被占用
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  端口 $PORT 已被占用"
    echo "正在尝试停止现有进程..."
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        kill $OLD_PID 2>/dev/null
        rm "$PID_FILE"
    fi
    sleep 1
fi

# 启动服务器
echo "🚀 启动本地测试服务器..."
echo "📡 地址: http://localhost:$PORT"
echo "📄 测试页面: http://localhost:$PORT/index.html"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

python3 -m http.server $PORT &
SERVER_PID=$!
echo $SERVER_PID > "$PID_FILE"

# 等待服务器启动
sleep 1

# 检查服务器是否成功启动
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ 服务器已启动 (PID: $SERVER_PID)"
    echo ""
    echo "🧪 开始功能测试..."
    echo "   打开浏览器访问: http://localhost:$PORT/index.html"
    echo ""
    
    # 尝试打开浏览器（macOS）
    if command -v open > /dev/null; then
        open "http://localhost:$PORT/index.html" 2>/dev/null
    fi
    
    # 等待用户中断
    trap "echo ''; echo '🛑 正在停止服务器...'; kill $SERVER_PID 2>/dev/null; rm -f $PID_FILE; echo '✅ 服务器已停止'; exit 0" INT TERM
    
    wait $SERVER_PID
else
    echo "❌ 服务器启动失败"
    rm -f "$PID_FILE"
    exit 1
fi
