// 测试反馈 API 路由
console.log('测试 Cloudflare Pages Functions 路由配置...');
console.log('');
console.log('文件位置: functions/api/feedback.js');
console.log('预期路由: POST /api/feedback');
console.log('');
console.log('检查文件是否存在...');
const fs = require('fs');
const path = require('path');
const feedbackPath = path.join(__dirname, 'functions', 'api', 'feedback.js');
if (fs.existsSync(feedbackPath)) {
  console.log('✅ 文件存在');
  const content = fs.readFileSync(feedbackPath, 'utf8');
  if (content.includes('export async function onRequestPost')) {
    console.log('✅ 正确导出 onRequestPost');
  } else {
    console.log('❌ 未找到 onRequestPost 导出');
  }
  if (content.includes('onRequestGet')) {
    console.log('✅ 包含 onRequestGet');
  }
} else {
  console.log('❌ 文件不存在');
}
