/* test-modules.cjs
 * 模块完整性测试脚本
 * 验证所有 UI 模块是否正确导出
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 UI 模块完整性测试\n');
console.log('='.repeat(60));

const tests = [];

// 测试组件模块
const components = [
  { name: 'WuxingMeaning', file: 'js/ui/components/wuxing-meaning.js', exports: ['renderWuxingMeaningBox'] },
  { name: 'BaziPillars', file: 'js/ui/components/bazi-pillars.js', exports: ['renderPillars'] },
  { name: 'ZiweiGrid', file: 'js/ui/components/ziwei-grid.js', exports: ['renderZiwei'] },
  { name: 'PalaceScores', file: 'js/ui/components/palace-scores.js', exports: ['renderZiweiScores'] },
  { name: 'PalaceDetail', file: 'js/ui/components/palace-detail.js', exports: ['selectPalace'] },
  { name: 'LiuyueMonth', file: 'js/ui/components/liuyue-month.js', exports: ['renderLiuyue'] },
  { name: 'WuxingPanel', file: 'js/ui/components/wuxing-panel.js', exports: ['openWuxingMeaningLikePalace'] },
  { name: 'BirthTimeIdentifier', file: 'js/ui/components/birth-time-identifier.js', exports: ['initIdentifyBirthTime'] },
];

components.forEach(({ name, file, exports }) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    tests.push({ type: 'component', name, status: 'missing', file });
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const hasExport = /window\.UiComponents\.[\w]+\s*=\s*\{/.test(content);
  
  if (!hasExport) {
    tests.push({ type: 'component', name, status: 'no_export', file });
    return;
  }
  
  const allExportsFound = exports.every(exp => {
    const pattern = new RegExp(`(function\\s+${exp}|${exp}\\s*[:=]|${exp}\\s*,)`);
    return pattern.test(content);
  });
  
  tests.push({ 
    type: 'component', 
    name, 
    status: allExportsFound ? 'ok' : 'partial', 
    file,
    exports 
  });
});

// 测试服务模块
const services = [
  { name: 'ApiService', file: 'js/ui/services/api-service.js', exports: ['loadDbContent', 'computeAll', 'getPalaceScores'] },
  { name: 'Navigation', file: 'js/ui/services/navigation.js', exports: ['syncNavChipActive', 'initDashboardContentTransition'] },
  { name: 'FormInit', file: 'js/ui/services/form-init.js', exports: ['initSelectors'] },
  { name: 'SoundService', file: 'js/ui/services/sound-service.js', exports: ['playSyncSound'] },
  { name: 'CalculationFlow', file: 'js/ui/services/calculation-flow.js', exports: ['validateInputs', 'updateDashboardUI', 'updateSummary', 'renderTactics'] },
  { name: 'EventBindings', file: 'js/ui/services/event-bindings.js', exports: ['bindLaunchButton', 'bindWuxingClickEvents', 'bindOverloadAdviceModal', 'bindMobileSheetCloseEvents'] },
  { name: 'DataRenderer', file: 'js/ui/services/data-renderer.js', exports: ['renderBaziData', 'renderTenGodCommand', 'renderZiweiAndLiuyue'] },
];

services.forEach(({ name, file, exports }) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    tests.push({ type: 'service', name, status: 'missing', file });
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const hasExport = /window\.UiServices\.[\w]+\s*=\s*\{/.test(content);
  
  if (!hasExport) {
    tests.push({ type: 'service', name, status: 'no_export', file });
    return;
  }
  
  tests.push({ type: 'service', name, status: 'ok', file, exports });
});

// 测试工具模块
const utils = [
  { name: 'UiDomHelpers', file: 'js/ui/utils/dom-helpers.js' },
  { name: 'UiRenderHelpers', file: 'js/ui/utils/render-helpers.js' },
  { name: 'StrategyTags', file: 'js/ui/utils/strategy-tags.js', exports: ['getMonthStrategyTag'] },
];

utils.forEach(({ name, file, exports }) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    tests.push({ type: 'util', name, status: 'missing', file });
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const exportPattern = name === 'UiDomHelpers' 
    ? /window\.UiDomHelpers\s*=\s*\{/
    : name === 'UiRenderHelpers'
    ? /window\.UiRenderHelpers\s*=\s*\{/
    : /window\.UiUtils\.StrategyTags\s*=\s*\{/;
  
  const hasExport = exportPattern.test(content);
  tests.push({ type: 'util', name, status: hasExport ? 'ok' : 'no_export', file, exports });
});

// 测试常量模块
const constants = [
  { name: 'Ceremony', file: 'js/ui/constants/ceremony-constants.js', exports: ['CEREMONY_PERSONALITY_KEYS'] },
];

constants.forEach(({ name, file, exports }) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    tests.push({ type: 'constant', name, status: 'missing', file });
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const hasExport = /window\.UiConstants\.Ceremony\s*=\s*\{/.test(content);
  tests.push({ type: 'constant', name, status: hasExport ? 'ok' : 'no_export', file, exports });
});

// 输出测试结果
let passed = 0;
let failed = 0;

console.log('\n📦 组件模块:');
components.forEach(({ name }) => {
  const test = tests.find(t => t.type === 'component' && t.name === name);
  if (test && test.status === 'ok') {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name} - ${test?.status || 'unknown'}`);
    failed++;
  }
});

console.log('\n🔧 服务模块:');
services.forEach(({ name }) => {
  const test = tests.find(t => t.type === 'service' && t.name === name);
  if (test && test.status === 'ok') {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name} - ${test?.status || 'unknown'}`);
    failed++;
  }
});

console.log('\n🛠️ 工具模块:');
utils.forEach(({ name }) => {
  const test = tests.find(t => t.type === 'util' && t.name === name);
  if (test && test.status === 'ok') {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name} - ${test?.status || 'unknown'}`);
    failed++;
  }
});

console.log('\n📋 常量模块:');
constants.forEach(({ name }) => {
  const test = tests.find(t => t.type === 'constant' && t.name === name);
  if (test && test.status === 'ok') {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name} - ${test?.status || 'unknown'}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`总计: ${passed} 通过, ${failed} 失败`);
console.log('='.repeat(60));

process.exit(failed > 0 ? 1 : 0);
