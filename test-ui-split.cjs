#!/usr/bin/env node
/**
 * 测试 UI 拆分后的模块结构
 * 验证工具函数是否正确导出和导入
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 开始测试 UI 拆分...\n');

// 检查文件是否存在
const filesToCheck = [
  'js/ui/utils/dom-helpers.js',
  'js/ui/utils/render-helpers.js',
  'js/ui.js',
  'index.html'
];

console.log('📁 检查文件存在性:');
let allFilesExist = true;
filesToCheck.forEach(file => {
  const exists = fs.existsSync(file);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.error('\n❌ 部分文件不存在，请先完成文件创建');
  process.exit(1);
}

// 检查导出
console.log('\n📤 检查模块导出:');

// 检查 dom-helpers.js 导出
const domHelpersContent = fs.readFileSync('js/ui/utils/dom-helpers.js', 'utf8');
const domHelpersExports = [
  'animateValue',
  'getCurrentAge',
  'flashPeek',
  'openPalaceSheet',
  'closePalaceSheet',
  'setMobileSheetContent'
];

console.log('\n  window.UiDomHelpers 导出:');
domHelpersExports.forEach(exportName => {
  const hasExport = domHelpersContent.includes(`window.UiDomHelpers = {`) && 
                    domHelpersContent.includes(exportName);
  const status = hasExport ? '✅' : '❌';
  console.log(`    ${status} ${exportName}`);
});

// 检查 render-helpers.js 导出
const renderHelpersContent = fs.readFileSync('js/ui/utils/render-helpers.js', 'utf8');
const renderHelpersExports = [
  'getSihuaForPalace',
  'renderBar',
  'toneClass',
  'wrapForMobile',
  'renderRadarChart',
  'renderFiveElementComment',
  'getColorFromCode',
  'getBorderColorClass',
  'getBgColorClass',
  'getTextColorClass',
  'getStarRating',
  'renderStars',
  'getMutagenBadgeHtml',
  'starWithBadgeHtml'
];

console.log('\n  window.UiRenderHelpers 导出:');
renderHelpersExports.forEach(exportName => {
  const hasExport = renderHelpersContent.includes(`window.UiRenderHelpers = {`) && 
                    renderHelpersContent.includes(exportName);
  const status = hasExport ? '✅' : '❌';
  console.log(`    ${status} ${exportName}`);
});

// 检查 ui.js 导入
console.log('\n📥 检查 ui.js 导入:');
const uiContent = fs.readFileSync('js/ui.js', 'utf8');

const hasDomHelpersImport = uiContent.includes('window.UiDomHelpers');
const hasRenderHelpersImport = uiContent.includes('window.UiRenderHelpers');

console.log(`  ${hasDomHelpersImport ? '✅' : '❌'} 导入 window.UiDomHelpers`);
console.log(`  ${hasRenderHelpersImport ? '✅' : '❌'} 导入 window.UiRenderHelpers`);

// 检查是否使用了工具函数
console.log('\n🔍 检查工具函数使用:');
const usesRenderBar = uiContent.includes('renderBar(');
const usesRenderRadar = uiContent.includes('renderRadarChart(');

console.log(`  ${usesRenderBar ? '✅' : '⚠️'} 使用 renderBar`);
console.log(`  ${usesRenderRadar ? '✅' : '⚠️'} 使用 renderRadarChart`);

// 检查 index.html 加载顺序
console.log('\n📋 检查 index.html 加载顺序:');
const indexContent = fs.readFileSync('index.html', 'utf8');
const domHelpersIndex = indexContent.indexOf('dom-helpers.js');
const renderHelpersIndex = indexContent.indexOf('render-helpers.js');
const uiIndex = indexContent.indexOf('js/ui.js');

const correctOrder = domHelpersIndex < renderHelpersIndex && renderHelpersIndex < uiIndex;
console.log(`  ${correctOrder ? '✅' : '❌'} 加载顺序正确: dom-helpers → render-helpers → ui.js`);

// 统计代码行数
console.log('\n📊 代码统计:');
const domHelpersLines = domHelpersContent.split('\n').length;
const renderHelpersLines = renderHelpersContent.split('\n').length;
const uiLines = uiContent.split('\n').length;

console.log(`  dom-helpers.js: ${domHelpersLines} 行`);
console.log(`  render-helpers.js: ${renderHelpersLines} 行`);
console.log(`  ui.js: ${uiLines} 行`);
console.log(`  总计: ${domHelpersLines + renderHelpersLines + uiLines} 行`);

// 检查是否有重复的函数定义
console.log('\n🔎 检查重复定义:');
const hasAnimateValueInUi = uiContent.includes('function animateValue') && 
                            !uiContent.includes('// animateValue');
const hasRenderBarInUi = uiContent.includes('function renderBar') && 
                         !uiContent.includes('// renderBar');

if (hasAnimateValueInUi) {
  console.log('  ⚠️  animateValue 可能在 ui.js 中仍有定义');
}
if (hasRenderBarInUi) {
  console.log('  ⚠️  renderBar 可能在 ui.js 中仍有定义');
}
if (!hasAnimateValueInUi && !hasRenderBarInUi) {
  console.log('  ✅ 未发现明显的重复定义');
}

// 最终总结
console.log('\n' + '='.repeat(50));
console.log('📝 测试总结:');
console.log('='.repeat(50));

const allChecksPassed = allFilesExist && 
                         hasDomHelpersImport && 
                         hasRenderHelpersImport && 
                         correctOrder &&
                         !hasAnimateValueInUi &&
                         !hasRenderBarInUi;

if (allChecksPassed) {
  console.log('✅ 所有检查通过！UI 拆分工作正常。');
  console.log('\n💡 建议：');
  console.log('  1. 在浏览器中打开页面，测试实际功能');
  console.log('  2. 检查浏览器控制台是否有错误');
  console.log('  3. 测试年龄滑杆、宫位点击、五行图表等功能');
} else {
  console.log('⚠️  部分检查未通过，请检查上述问题。');
}

process.exit(allChecksPassed ? 0 : 1);
