#!/bin/bash
echo "🚀 启动本地测试服务器..."
echo ""
cd "$(dirname "$0")"
python3 -m http.server 8000
