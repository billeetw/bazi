#!/bin/bash
# 快速本地测试脚本

echo "🧪 本地测试准备..."
echo ""

cd "$(dirname "$0")"

# 检查版本号
echo "📋 检查版本号..."
VERSION_CHECK=$(grep -E "(baziCore|fourTransformations|overlapAnalysis|calc\.js|ui\.js)\?v=" index.html | grep -v "v=3" | wc -l)
if [ "$VERSION_CHECK" -gt 0 ]; then
    echo "⚠️  警告：发现版本号不是 v=3 的文件"
    grep -E "(baziCore|fourTransformations|overlapAnalysis|calc\.js|ui\.js)\?v=" index.html | grep -v "v=3"
else
    echo "✅ 所有关键文件版本号为 v=3"
fi

# 检查语法
echo ""
echo "🔍 检查语法..."
node -c js/calc/baziCore.js 2>&1 && \
node -c js/calc/fourTransformations.js 2>&1 && \
node -c js/calc/overlapAnalysis.js 2>&1 && \
node -c js/calc.js 2>&1 && \
node -c js/ui.js 2>&1 && \
echo "✅ 语法检查通过" || {
    echo "❌ 语法检查失败"
    exit 1
}

# 检查端口
echo ""
echo "🔌 检查端口 8788..."
if lsof -Pi :8788 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  端口 8788 已被占用"
    echo "   正在尝试停止现有进程..."
    lsof -ti:8788 | xargs kill -9 2>/dev/null
    sleep 1
fi

# 启动服务器
echo ""
echo "🚀 启动 Cloudflare Pages 开发服务器..."
echo "📡 端口: 8788"
echo ""
echo "🌐 访问地址:"
echo "  主页面: http://localhost:8788/index.html"
echo "  API 测试: http://localhost:8788/api/auth/config"
echo ""
echo "💡 提示："
echo "  1. 打开浏览器后，按 F12 打开开发者工具"
echo "  2. 切换到 Network 标签，确认版本号为 ?v=3"
echo "  3. 切换到 Console 标签，确认没有错误"
echo "  4. 清除浏览器缓存（Ctrl+Shift+Delete 或 Cmd+Shift+Delete）"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npx wrangler pages dev . --port 8788
