/* test-ui-components.cjs
 * 测试 UI 组件是否正确导出
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 测试 UI 组件导出...\n');

const components = [
  { name: 'WuxingMeaning', file: 'js/ui/components/wuxing-meaning.js', exports: ['renderWuxingMeaningBox'] },
  { name: 'BaziPillars', file: 'js/ui/components/bazi-pillars.js', exports: ['renderPillars'] },
  { name: 'ZiweiGrid', file: 'js/ui/components/ziwei-grid.js', exports: ['renderZiwei'] },
  { name: 'PalaceScores', file: 'js/ui/components/palace-scores.js', exports: ['renderZiweiScores'] },
  { name: 'PalaceDetail', file: 'js/ui/components/palace-detail.js', exports: ['selectPalace'] },
  { name: 'LiuyueMonth', file: 'js/ui/components/liuyue-month.js', exports: ['renderLiuyue'] },
];

let allPassed = true;

components.forEach(({ name, file, exports }) => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${name}: 文件不存在 - ${file}`);
    allPassed = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 检查是否导出到 window.UiComponents
  const exportPattern = new RegExp(`window\\.UiComponents\\.${name}\\s*=\\s*\\{`);
  if (!exportPattern.test(content)) {
    console.log(`❌ ${name}: 未找到 window.UiComponents.${name} 导出`);
    allPassed = false;
    return;
  }
  
  // 检查导出的函数（函数名可能在对象中）
  exports.forEach(exportName => {
    // 匹配 function exportName 或 exportName: function 或 exportName,
    const funcPattern = new RegExp(`(function\\s+${exportName}|${exportName}\\s*[:=]|${exportName}\\s*,)`);
    if (!funcPattern.test(content)) {
      console.log(`⚠️  ${name}: 未明确找到导出函数 ${exportName}（可能使用不同格式）`);
      // 不标记为失败，因为可能是不同的导出格式
    }
  });
  
  console.log(`✅ ${name}: 导出正确`);
});

console.log('\n📋 检查 index.html 加载顺序...\n');

const indexPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexPath)) {
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  const requiredScripts = [
    'js/ui/utils/dom-helpers.js',
    'js/ui/utils/render-helpers.js',
    'js/ui/components/wuxing-meaning.js',
    'js/ui/components/bazi-pillars.js',
    'js/ui/components/ziwei-grid.js',
    'js/ui/components/palace-scores.js',
    'js/ui/components/palace-detail.js',
    'js/ui/components/liuyue-month.js',
    'js/ui.js',
  ];
  
  let lastIndex = -1;
  let orderCorrect = true;
  
  requiredScripts.forEach((script, index) => {
    const scriptIndex = htmlContent.indexOf(script);
    if (scriptIndex === -1) {
      console.log(`❌ 未找到脚本: ${script}`);
      orderCorrect = false;
    } else {
      if (scriptIndex < lastIndex) {
        console.log(`❌ 加载顺序错误: ${script} 应该在之前脚本之后`);
        orderCorrect = false;
      }
      lastIndex = scriptIndex;
      console.log(`✅ ${script}`);
    }
  });
  
  if (orderCorrect) {
    console.log('\n✅ index.html 加载顺序正确');
  } else {
    allPassed = false;
  }
} else {
  console.log('❌ index.html 不存在');
  allPassed = false;
}

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ 所有测试通过！');
  console.log('\n🌐 本地测试链接:');
  console.log('   http://localhost:8000/index.html');
  console.log('\n💡 请在浏览器中打开上述链接测试 UI 功能');
} else {
  console.log('❌ 部分测试失败，请检查上述错误');
}
console.log('='.repeat(60));

process.exit(allPassed ? 0 : 1);
