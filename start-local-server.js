#!/usr/bin/env node
/**
 * 简单的本地 HTTP 服务器
 * 用于测试 UI 拆分后的功能
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || 8000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // 解析 URL
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  // 获取文件扩展名
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // 读取文件
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('🚀 本地测试服务器已启动');
  console.log('');
  console.log('📡 端口:', PORT);
  console.log('');
  console.log('🌐 访问地址:');
  console.log(`  主页面:     http://localhost:${PORT}/index.html`);
  console.log(`  UI 测试:    http://localhost:${PORT}/test-ui-split.html`);
  console.log('');
  console.log('按 Ctrl+C 停止服务器');
  console.log('');
});
