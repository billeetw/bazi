/* 
 * 浏览器控制台检查脚本
 * 在浏览器开发者工具的控制台中粘贴并执行此脚本
 * 用于快速验证所有模块是否正确加载
 */

(function() {
  console.log('%c🧪 UI 模块加载检查', 'font-size: 16px; font-weight: bold; color: #4CAF50;');
  console.log('='.repeat(60));
  
  const checks = [];
  
  // 检查核心依赖
  console.log('\n📦 核心依赖:');
  const coreDeps = {
    'window.Calc': window.Calc,
    'window.UiDomHelpers': window.UiDomHelpers,
    'window.UiRenderHelpers': window.UiRenderHelpers,
  };
  
  Object.entries(coreDeps).forEach(([name, obj]) => {
    const exists = typeof obj !== 'undefined' && obj !== null;
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${name}:`, exists ? '已加载' : '未找到');
    checks.push({ name, status: exists });
  });
  
  // 检查组件模块
  console.log('\n🎨 UI 组件模块:');
  const components = [
    'WuxingMeaning',
    'BaziPillars',
    'ZiweiGrid',
    'PalaceScores',
    'PalaceDetail',
    'LiuyueMonth',
    'WuxingPanel',
    'BirthTimeIdentifier',
  ];
  
  components.forEach(name => {
    const exists = window.UiComponents && window.UiComponents[name];
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} UiComponents.${name}:`, exists ? '已加载' : '未找到');
    checks.push({ name: `UiComponents.${name}`, status: exists });
  });
  
  // 检查服务模块
  console.log('\n🔧 UI 服务模块:');
  const services = [
    'ApiService',
    'Navigation',
    'FormInit',
    'SoundService',
    'CalculationFlow',
    'EventBindings',
    'DataRenderer',
  ];
  
  services.forEach(name => {
    const exists = window.UiServices && window.UiServices[name];
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} UiServices.${name}:`, exists ? '已加载' : '未找到');
    checks.push({ name: `UiServices.${name}`, status: exists });
  });
  
  // 检查工具模块
  console.log('\n🛠️ UI 工具模块:');
  const utils = [
    { name: 'UiDomHelpers', path: 'window.UiDomHelpers' },
    { name: 'UiRenderHelpers', path: 'window.UiRenderHelpers' },
    { name: 'StrategyTags', path: 'window.UiUtils.StrategyTags' },
  ];
  
  utils.forEach(({ name, path }) => {
    const obj = eval(path);
    const exists = typeof obj !== 'undefined' && obj !== null;
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${path}:`, exists ? '已加载' : '未找到');
    checks.push({ name: path, status: exists });
  });
  
  // 检查常量模块
  console.log('\n📋 UI 常量模块:');
  const constants = {
    'UiConstants.Ceremony': window.UiConstants && window.UiConstants.Ceremony,
  };
  
  Object.entries(constants).forEach(([name, obj]) => {
    const exists = typeof obj !== 'undefined' && obj !== null;
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${name}:`, exists ? '已加载' : '未找到');
    checks.push({ name, status: exists });
  });
  
  // 统计结果
  console.log('\n' + '='.repeat(60));
  const passed = checks.filter(c => c.status).length;
  const failed = checks.filter(c => !c.status).length;
  const total = checks.length;
  
  console.log(`\n📊 检查结果: ${passed}/${total} 通过`);
  
  if (failed > 0) {
    console.log('\n❌ 未加载的模块:');
    checks.filter(c => !c.status).forEach(c => {
      console.log(`   - ${c.name}`);
    });
    console.log('\n💡 建议:');
    console.log('   1. 检查浏览器 Network 标签，确认所有 JS 文件都成功加载');
    console.log('   2. 检查 index.html 中的 <script> 标签顺序');
    console.log('   3. 检查控制台是否有语法错误');
  } else {
    console.log('\n🎉 所有模块都已正确加载！');
  }
  
  // 返回检查结果供进一步使用
  return {
    total,
    passed,
    failed,
    checks,
    allPassed: failed === 0
  };
})();
