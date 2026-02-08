#!/bin/bash
# 检查 index.html 中的文件引用是否存在

echo "🔍 检查文件引用..."
echo ""

ERRORS=0
WARNINGS=0

# 提取所有 JavaScript 文件引用（去掉查询参数）
grep -o 'src="[^"]*\.js[^"]*"' index.html | sed 's/src="//;s/\?v=[^"]*"//;s/"//' | while read file; do
  if [ ! -f "$file" ]; then
    echo "❌ 文件不存在: $file"
    ERRORS=$((ERRORS + 1))
  else
    # 检查文件是否为空
    if [ ! -s "$file" ]; then
      echo "⚠️  文件为空: $file"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
done

echo ""
if [ $ERRORS -gt 0 ]; then
  echo "❌ 发现 $ERRORS 个引用错误"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo "⚠️  发现 $WARNINGS 个警告"
  exit 0
else
  echo "✅ 所有文件引用正确"
  exit 0
fi
