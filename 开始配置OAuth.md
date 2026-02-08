# 🚀 开始配置 OAuth

## 📋 配置前准备

在运行配置脚本之前，你需要先获取以下信息：

### 需要准备的信息

1. **Google OAuth**
   - Google Client ID
   - Google Client Secret

2. **Facebook OAuth**
   - Facebook App ID
   - Facebook App Secret

---

## 🎯 配置流程

### 步骤1：获取 Google OAuth 配置

#### 1.1 访问 Google Cloud Console
👉 **https://console.cloud.google.com/**

#### 1.2 创建项目（如果还没有）
- 点击左上角项目选择器
- 点击「新建项目」
- 项目名称：`bazi-project`
- 点击「创建」

#### 1.3 启用 Google+ API
- 左侧菜单：「API 和服务」>「库」
- 搜索「Google+ API」
- 点击「启用」

#### 1.4 配置 OAuth 同意屏幕
- 「API 和服务」>「OAuth 同意屏幕」
- 选择「外部」
- 应用名称：`一起出來玩`
- 用户支持电子邮件：填写你的邮箱
- 开发者联系信息：填写你的邮箱
- 点击「保存并继续」
- 作用域：直接点击「保存并继续」
- 测试用户：直接点击「保存并继续」
- 摘要：点击「返回仪表板」

#### 1.5 创建 OAuth 客户端
- 「API 和服务」>「凭据」
- 点击「创建凭据」>「OAuth 客户端 ID」
- 应用类型：**网页应用**
- 名称：`Bazi Web Client`
- **已授权的 JavaScript 来源**：
  ```
  http://localhost:8000
  http://localhost:8788
  ```
- **已授权的重定向 URI**（重要！）：
  ```
  http://localhost:8000/api/auth/google/callback
  http://localhost:8788/api/auth/google/callback
  ```
- 点击「创建」
- **复制 Client ID 和 Client Secret**（只显示一次！）

---

### 步骤2：获取 Facebook OAuth 配置

#### 2.1 访问 Facebook Developers
👉 **https://developers.facebook.com/**

#### 2.2 创建应用
- 点击右上角「我的应用」>「创建应用」
- 选择「消费者」类型
- 应用名称：`一起出來玩`
- 应用联系电子邮件：填写你的邮箱
- 点击「创建应用」

#### 2.3 添加 Facebook Login
- 在应用仪表板中，找到「添加产品」
- 找到「Facebook 登录」并点击「设置」
- 选择「网页」平台

#### 2.4 配置回调 URL
- 「Facebook 登录」>「设置」
- **有效的 OAuth 重定向 URI**（重要！）：
  ```
  http://localhost:8000/api/auth/facebook/callback
  http://localhost:8788/api/auth/facebook/callback
  ```
- 点击「保存更改」

#### 2.5 获取 App ID 和 App Secret
- 「设置」>「基本」
- **复制 App ID**（在页面顶部）
- 找到「App Secret」，点击「显示」
- 输入你的 Facebook 密码
- **复制 App Secret**

---

### 步骤3：运行配置脚本

准备好以上信息后，运行：

```bash
./配置OAuth.sh
```

脚本会依次询问：
1. Google Client ID
2. Google Client Secret
3. Facebook App ID
4. Facebook App Secret

输入完成后，配置会自动保存到 `.dev.vars` 文件。

---

### 步骤4：验证配置

配置完成后，检查：

```bash
cat .dev.vars | grep -E "GOOGLE_CLIENT_ID|FACEBOOK_APP_ID"
```

应该显示具体的值，而不是空值。

---

### 步骤5：运行数据库迁移

```bash
npx wrangler d1 migrations apply consult-db --local
```

---

### 步骤6：测试 OAuth

```bash
# 启动服务器
npx wrangler pages dev . --port 8788
```

然后访问：`http://localhost:8788/index.html`

点击「活動報名」或「預約深度諮詢」，测试 OAuth 登录。

---

## ⚠️ 重要提醒

1. **回调 URL 必须完全匹配**
   - 包括协议（http）、域名（localhost）、端口（8000 或 8788）、路径（/api/auth/.../callback）
   - 一个字符都不能错

2. **本地开发限制**
   - Google：需要配置 `localhost` 为授权域名
   - Facebook：应用需要处于「开发模式」

3. **如果遇到错误**
   - Google：检查「已授权的重定向 URI」是否完全匹配
   - Facebook：检查「有效的 OAuth 重定向 URI」是否完全匹配
   - 保存后可能需要等待几分钟生效

---

## 📞 需要帮助？

如果遇到问题：
1. 检查浏览器控制台的错误信息
2. 检查服务器日志
3. 确认回调 URL 配置正确

---

**准备好了吗？开始获取 OAuth 配置吧！** 🚀
