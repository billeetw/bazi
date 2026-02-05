# 🚀 开始功能测试

## 第一步：启动服务器

在终端执行以下命令：

```bash
cd /Users/bill/bazi-project
python3 -m http.server 8000
```

或者使用启动脚本：

```bash
./start-test-server.sh
```

## 第二步：打开测试页面

在浏览器中访问：
**http://localhost:8000/index.html**

## 第三步：检查模块加载

1. 打开浏览器开发者工具（按 `F12` 或 `Cmd+Option+I`）
2. 切换到 **Console** 标签
3. 复制下面的代码并粘贴到控制台执行：

```javascript
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
  const components = ['WuxingMeaning', 'BaziPillars', 'ZiweiGrid', 'PalaceScores', 'PalaceDetail', 'LiuyueMonth', 'WuxingPanel', 'BirthTimeIdentifier'];
  components.forEach(name => {
    const exists = window.UiComponents && window.UiComponents[name];
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} UiComponents.${name}:`, exists ? '已加载' : '未找到');
    checks.push({ name: `UiComponents.${name}`, status: exists });
  });
  
  // 检查服务模块
  console.log('\n🔧 UI 服务模块:');
  const services = ['ApiService', 'Navigation', 'FormInit', 'SoundService', 'CalculationFlow', 'EventBindings', 'DataRenderer'];
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
  } else {
    console.log('\n🎉 所有模块都已正确加载！');
  }
  
  return { total, passed, failed, checks, allPassed: failed === 0 };
})();
```

## 第四步：执行功能测试

按照 `FUNCTIONAL_TEST_CHECKLIST.md` 中的清单逐项测试：

1. ✅ 输入表单初始化
2. ✅ 计算流程
3. ✅ 八字数据渲染
4. ✅ 十神指令
5. ✅ 紫微斗数网格
6. ✅ 宫位分数
7. ✅ 宫位详情
8. ✅ 流月数据
9. ✅ 战术建议
10. ✅ 导航和仪表板
11. ✅ 摘要信息
12. ✅ 五行含义面板
13. ✅ 年龄滑块
14. ✅ 出生时间识别
15. ✅ 启动序列
16. ✅ 音效服务
17. ✅ 移动端适配

## 第五步：记录测试结果

在 `FUNCTIONAL_TEST_CHECKLIST.md` 中：
- 勾选已测试的项目
- 记录发现的问题
- 填写测试报告

---

## 💡 快速命令参考

```bash
# 启动服务器
python3 -m http.server 8000

# 停止服务器（在另一个终端）
lsof -ti:8000 | xargs kill

# 检查服务器状态
curl -I http://localhost:8000/index.html
```

---

**测试链接**: http://localhost:8000/index.html
