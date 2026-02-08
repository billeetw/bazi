#!/bin/bash
# 部署前检查脚本

set -e

echo "🔍 部署前检查..."
echo ""

ERRORS=0

# 1. 语法检查
echo "1️⃣  检查语法..."
for file in js/calc/baziCore.js js/calc/fourTransformations.js js/calc/overlapAnalysis.js js/calc.js js/ui.js; do
  if node -c "$file" 2>&1; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo "❌ 语法检查失败"
  exit 1
fi

# 2. 文件引用检查
echo ""
echo "2️⃣  检查文件引用..."
if [ -f "scripts/check-references.sh" ]; then
  bash scripts/check-references.sh || ERRORS=$((ERRORS + 1))
else
  echo "  ⚠️  check-references.sh 不存在，跳过"
fi

# 3. 版本号检查（可选）
echo ""
echo "3️⃣  检查版本号..."
VERSION_MISMATCH=$(grep -E "(baziCore|fourTransformations|overlapAnalysis|calc\.js|ui\.js)\?v=" index.html | grep -v "v=3" | wc -l)
if [ $VERSION_MISMATCH -gt 0 ]; then
  echo "  ⚠️  发现版本号不一致的文件："
  grep -E "(baziCore|fourTransformations|overlapAnalysis|calc\.js|ui\.js)\?v=" index.html | grep -v "v=3"
else
  echo "  ✅ 关键文件版本号一致"
fi

# 4. Git 状态检查
echo ""
echo "4️⃣  检查 Git 状态..."
if [ -n "$(git status --porcelain)" ]; then
  echo "  ⚠️  有未提交的更改"
  git status --short | head -5
else
  echo "  ✅ 工作目录干净"
fi

echo ""
if [ $ERRORS -gt 0 ]; then
  echo "❌ 检查失败，请修复后重试"
  exit 1
else
  echo "✅ 所有检查通过，可以部署"
  exit 0
fi
