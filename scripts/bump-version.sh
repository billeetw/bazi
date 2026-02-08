#!/bin/bash
# 统一更新所有 JavaScript 文件的版本号

VERSION=${1:-$(date +%s)}
echo "📦 更新版本号到: $VERSION"
echo ""

# 备份原文件
cp index.html index.html.bak

# 更新所有 ?v= 版本号
sed -i.bak "s/\?v=[0-9]\+/\?v=$VERSION/g" index.html

# 显示更改
echo "已更新的文件引用："
grep -o 'src="[^"]*\.js\?v=[^"]*"' index.html | head -10

echo ""
echo "✅ 版本号已更新到 v=$VERSION"
echo "💡 提示：可以使用 'git diff index.html' 查看更改"
