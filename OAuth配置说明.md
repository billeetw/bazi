# OAuth 配置说明

## 📋 当前状态

### ✅ 已完成
1. ✅ `.dev.vars` 文件已更新，添加了 OAuth 配置占位符
2. ✅ JWT Secret 已生成并添加到配置
3. ✅ OAuth 配置 API 端点已创建 (`/api/auth/config`)

### ⏳ 待配置
1. ⏳ Google OAuth Client ID 和 Secret
2. ⏳ Facebook App ID 和 App Secret

---

## 🔧 配置步骤

### 1. 更新 `.dev.vars` 文件

你的 `.dev.vars` 文件已经准备好了，只需要填写 OAuth 配置：

```bash
# 后台管理配置 ✅
ADMIN_USER=billee
ADMIN_PASSWORD=bill0000

# OAuth 配置 ⏳（需要填写）
GOOGLE_CLIENT_ID=你的Google_Client_ID
GOOGLE_CLIENT_SECRET=你的Google_Client_Secret
FACEBOOK_APP_ID=你的Facebook_App_ID
FACEBOOK_APP_SECRET=你的Facebook_App_Secret

# JWT Secret ✅
JWT_SECRET=673a87704cb2a8cd58d1b8f947783a7922d7f123f8b7f43eff78a769febee3e3
```

### 2. 获取 Google OAuth 配置

1. 访问：https://console.cloud.google.com/
2. 创建项目 → 启用 Google+ API
3. 创建 OAuth 2.0 客户端 ID
4. 配置回调 URL：`http://localhost:8000/api/auth/google/callback`
5. 复制 Client ID 和 Client Secret

详细步骤：查看 `快速配置OAuth.md`

### 3. 获取 Facebook OAuth 配置

1. 访问：https://developers.facebook.com/
2. 创建应用 → 添加 Facebook Login
3. 配置回调 URL：`http://localhost:8000/api/auth/facebook/callback`
4. 复制 App ID 和 App Secret

详细步骤：查看 `快速配置OAuth.md`

---

## 🧪 测试配置

### 1. 检查配置

```bash
# 查看 .dev.vars 文件
cat .dev.vars

# 确保所有 OAuth 配置都已填写
```

### 2. 测试 OAuth 配置 API

```bash
# 启动服务器
npx wrangler pages dev . --port 8788

# 测试配置 API
curl http://localhost:8788/api/auth/config
```

应该返回：
```json
{
  "ok": true,
  "config": {
    "google": {
      "clientId": "你的Google_Client_ID"
    },
    "facebook": {
      "appId": "你的Facebook_App_ID"
    }
  }
}
```

### 3. 测试 OAuth 登录

1. 访问：`http://localhost:8788/index.html`
2. 点击「活動報名」或「預約深度諮詢」
3. 在登录模态框中应该能看到 Google 和 Facebook 按钮
4. 点击测试 OAuth 登录

---

## ⚠️ 临时方案（开发阶段）

如果暂时不想配置 OAuth：

1. **系统会自动处理**：
   - 如果 OAuth 未配置，登录模态框只显示邮箱注册/登录
   - OAuth 按钮会自动隐藏
   - 不影响其他功能

2. **测试邮箱注册/登录**：
   - 访问页面
   - 点击需要登录的功能
   - 使用邮箱注册/登录

---

## 📝 配置检查清单

- [ ] Google OAuth Client ID 已填写
- [ ] Google OAuth Client Secret 已填写
- [ ] Facebook App ID 已填写
- [ ] Facebook App Secret 已填写
- [ ] JWT Secret 已配置（✅ 已完成）
- [ ] 数据库迁移已运行
- [ ] OAuth 配置 API 测试通过
- [ ] OAuth 登录测试成功

---

## 🆘 常见问题

### Q: 不配置 OAuth 可以吗？
A: 可以。系统会自动检测，如果未配置，OAuth 按钮会隐藏，用户只能使用邮箱注册/登录。

### Q: 配置后需要重启服务器吗？
A: 是的。修改 `.dev.vars` 后需要重启 Wrangler 服务器。

### Q: 生产环境如何配置？
A: 在 Cloudflare Workers Dashboard 中设置 Secrets，不要使用 `.dev.vars`。

---

**提示**：配置完成后，OAuth 登录功能就可以正常使用了！
