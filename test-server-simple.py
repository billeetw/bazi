#!/usr/bin/env python3
"""
简单的 HTTP 服务器
用于测试 UI
"""

import http.server
import socketserver
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        # 简化日志输出
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print("=" * 60)
            print("🚀 本地测试服务器已启动")
            print("=" * 60)
            print(f"📡 端口: {PORT}")
            print()
            print("🌐 访问地址:")
            print(f"  主页面:     http://localhost:{PORT}/index.html")
            print(f"  UI 测试:    http://localhost:{PORT}/test-ui-split.html")
            print()
            print("按 Ctrl+C 停止服务器")
            print("=" * 60)
            print()
            
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 错误: 端口 {PORT} 已被占用")
            print(f"💡 尝试使用其他端口: python3 test-server-simple.py {PORT + 1}")
        else:
            print(f"❌ 错误: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n🛑 服务器已停止")
        sys.exit(0)

if __name__ == "__main__":
    main()
