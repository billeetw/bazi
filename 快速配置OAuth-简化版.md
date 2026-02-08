# 🚀 OAuth 快速配置（5分钟完成）

## 当前状态

你的 OAuth 配置尚未完成。按照以下步骤快速配置：

---

## 步骤1：获取 Google OAuth（2分钟）

### 1.1 访问 Google Cloud Console
👉 https://console.cloud.google.com/

### 1.2 快速操作
1. **创建项目**（如果没有）
   - 点击左上角项目选择器
   - 点击「新建项目」
   - 名称：`bazi-project`
   - 点击「创建」

2. **启用 API**
   - 左侧菜单：「API 和服务」>「库」
   - 搜索「Google+ API」
   - 点击「启用」

3. **创建 OAuth 客户端**
   - 「API 和服务」>「凭据」
   - 点击「创建凭据」>「OAuth 客户端 ID」
   - 如果是首次，先配置「OAuth 同意屏幕」：
     - 选择「外部」
     - 应用名称：`一起出來玩`
     - 填写邮箱
     - 保存并继续
   - 创建 OAuth 客户端：
     - 应用类型：**网页应用**
     - 名称：`Bazi Web Client`
     - **已授权的重定向 URI**（重要！）：
       ```
       http://localhost:8000/api/auth/google/callback
       http://localhost:8788/api/auth/google/callback
       ```
   - 点击「创建」
   - **复制 Client ID 和 Client Secret**（只显示一次！）

---

## 步骤2：获取 Facebook OAuth（2分钟）

### 2.1 访问 Facebook Developers
👉 https://developers.facebook.com/

### 2.2 快速操作
1. **创建应用**
   - 点击右上角「我的应用」>「创建应用」
   - 选择「消费者」类型
   - 应用名称：`一起出來玩`
   - 填写邮箱
   - 点击「创建应用」

2. **添加 Facebook Login**
   - 找到「添加产品」
   - 找到「Facebook 登录」>「设置」
   - 选择「网页」平台

3. **配置回调 URL**
   - 「Facebook 登录」>「设置」
   - **有效的 OAuth 重定向 URI**（重要！）：
     ```
     http://localhost:8000/api/auth/facebook/callback
     http://localhost:8788/api/auth/facebook/callback
     ```
   - 保存更改

4. **获取 App ID 和 Secret**
   - 「设置」>「基本」
   - **复制 App ID**
   - 点击「显示」查看 **App Secret**（需要输入密码）

---

## 步骤3：更新配置文件（1分钟）

### 方法1：使用配置脚本（推荐）

```bash
./更新OAuth配置.sh
```

脚本会引导你输入所有配置信息。

### 方法2：手动编辑 `.dev.vars`

打开 `.dev.vars` 文件，添加以下内容：

```bash
# OAuth 配置
GOOGLE_CLIENT_ID=你刚才复制的Google_Client_ID
GOOGLE_CLIENT_SECRET=你刚才复制的Google_Client_Secret
FACEBOOK_APP_ID=你刚才复制的Facebook_App_ID
FACEBOOK_APP_SECRET=你刚才复制的Facebook_App_Secret
JWT_SECRET=自动生成的随机字符串（运行下面的命令生成）

# 后台管理配置（保留现有配置）
ADMIN_USER=billee
ADMIN_PASSWORD=bill0000
```

### 生成 JWT Secret

```bash
openssl rand -hex 32
```

将生成的字符串复制到 `JWT_SECRET=` 后面。

---

## 步骤4：验证配置

```bash
./配置检查.sh
```

如果所有配置都正确，会显示 ✅。

---

## 步骤5：运行数据库迁移

```bash
npx wrangler d1 migrations apply consult-db --local
```

---

## 步骤6：测试 OAuth

```bash
# 启动服务器
npx wrangler pages dev . --port 8788
```

然后访问：`http://localhost:8788/index.html`

点击「活動報名」或「預約深度諮詢」，测试 OAuth 登录。

---

## ⚠️ 常见问题

### Q: Google OAuth 显示 "redirect_uri_mismatch"
**A:** 检查 Google Cloud Console 中的「已授权的重定向 URI」是否包含：
- `http://localhost:8000/api/auth/google/callback`
- `http://localhost:8788/api/auth/google/callback`

### Q: Facebook OAuth 显示 "Invalid OAuth redirect_uri"
**A:** 检查 Facebook Developers 中的「有效的 OAuth 重定向 URI」是否完全匹配（包括协议、端口、路径）

### Q: 本地开发无法使用 OAuth
**A:** 
- Google：确保「已授权的 JavaScript 来源」包含 `http://localhost:8000`
- Facebook：应用需要处于「开发模式」

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 错误信息截图
2. 配置检查脚本的输出
3. 浏览器控制台的错误信息

---

**预计完成时间：5-10分钟**
