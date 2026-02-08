# 🚀 OAuth 快速配置指南

## 当前状态

你的 `.dev.vars` 文件已更新，但 OAuth 配置还是空的。需要填写以下信息：

---

## 📝 配置步骤

### 步骤1：获取 Google OAuth 配置

1. **访问 Google Cloud Console**
   - 网址：https://console.cloud.google.com/
   - 如果没有账号，先注册（免费）

2. **创建项目**
   - 点击左上角项目选择器 → 「新建项目」
   - 项目名称：`bazi-project`
   - 点击「创建」

3. **启用 Google+ API**
   - 左侧菜单：「API 和服务」>「库」
   - 搜索「Google+ API」→ 点击「启用」

4. **配置 OAuth 同意屏幕**
   - 「API 和服务」>「OAuth 同意屏幕」
   - 选择「外部」→ 填写应用名称：`一起出來玩`
   - 填写邮箱 → 保存并继续

5. **创建 OAuth 客户端**
   - 「API 和服务」>「凭据」→「创建凭据」>「OAuth 客户端 ID」
   - 应用类型：**网页应用**
   - 名称：`Bazi Web Client`
   - **已授权的重定向 URI**：
     ```
     http://localhost:8000/api/auth/google/callback
     http://localhost:8788/api/auth/google/callback
     ```
   - 点击「创建」
   - **复制 Client ID 和 Client Secret**

---

### 步骤2：获取 Facebook OAuth 配置

1. **访问 Facebook Developers**
   - 网址：https://developers.facebook.com/
   - 如果没有账号，先注册（免费）

2. **创建应用**
   - 点击「我的应用」>「创建应用」
   - 选择「消费者」类型
   - 应用名称：`一起出來玩`
   - 填写邮箱 → 点击「创建应用」

3. **添加 Facebook Login**
   - 找到「添加产品」→「Facebook 登录」>「设置」
   - 选择「网页」平台

4. **配置回调 URL**
   - 「Facebook 登录」>「设置」
   - **有效的 OAuth 重定向 URI**：
     ```
     http://localhost:8000/api/auth/facebook/callback
     http://localhost:8788/api/auth/facebook/callback
     ```
   - 保存更改

5. **获取 App ID 和 Secret**
   - 「设置」>「基本」
   - **复制 App ID**
   - 点击「显示」查看 **App Secret**

---

### 步骤3：更新 `.dev.vars` 文件

打开 `.dev.vars` 文件，填入你刚才获取的信息：

```bash
# 后台管理配置
ADMIN_USER=billee
ADMIN_PASSWORD=bill0000

# OAuth 配置
GOOGLE_CLIENT_ID=你复制的Google_Client_ID
GOOGLE_CLIENT_SECRET=你复制的Google_Client_Secret
FACEBOOK_APP_ID=你复制的Facebook_App_ID
FACEBOOK_APP_SECRET=你复制的Facebook_App_Secret

# JWT Secret（已自动生成）
JWT_SECRET=673a87704cb2a8cd58d1b8f947783a7922d7f123f8b7f43eff78a769febee3e3
```

---

### 步骤4：运行数据库迁移

```bash
npx wrangler d1 migrations apply consult-db --local
```

---

### 步骤5：测试配置

```bash
# 启动服务器
npx wrangler pages dev . --port 8788

# 测试 OAuth 配置 API
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

---

## ⚠️ 临时解决方案（开发阶段）

如果暂时不想配置 OAuth，可以：

1. **禁用 OAuth 按钮**：在 `auth-modal.js` 中隐藏 OAuth 按钮
2. **仅使用邮箱注册/登录**：OAuth 按钮不显示，用户只能使用邮箱注册

需要我帮你实现临时方案吗？

---

## 🆘 遇到问题？

### Google OAuth 错误：redirect_uri_mismatch
- 检查 Google Cloud Console 中的「已授权的重定向 URI」
- 确保包含：`http://localhost:8000/api/auth/google/callback`
- 保存后等待几分钟生效

### Facebook OAuth 错误：Invalid OAuth redirect_uri
- 检查 Facebook Developers 中的「有效的 OAuth 重定向 URI」
- 确保 URL 完全匹配
- 保存后立即生效

---

**提示**：配置完成后，OAuth 登录功能就可以正常使用了！
