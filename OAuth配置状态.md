# OAuth 配置状态

## 📊 当前状态

✅ **配置文件已存在**：`.dev.vars`
✅ **JWT Secret 已生成**
❌ **Google OAuth 未配置**：`GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 为空
❌ **Facebook OAuth 未配置**：`FACEBOOK_APP_ID` 和 `FACEBOOK_APP_SECRET` 为空

---

## 🚀 快速配置（3个步骤）

### 步骤1：运行配置脚本

```bash
./配置OAuth.sh
```

脚本会引导你输入：
1. Google Client ID 和 Secret
2. Facebook App ID 和 Secret
3. 自动保留现有的后台管理配置和 JWT Secret

### 步骤2：获取 OAuth 配置

#### Google OAuth（2分钟）
1. 访问：https://console.cloud.google.com/
2. 创建项目 → 启用 Google+ API → 创建 OAuth 客户端
3. **重要**：配置回调 URL
   ```
   http://localhost:8000/api/auth/google/callback
   http://localhost:8788/api/auth/google/callback
   ```
4. 复制 Client ID 和 Client Secret

#### Facebook OAuth（2分钟）
1. 访问：https://developers.facebook.com/
2. 创建应用 → 添加 Facebook Login
3. **重要**：配置回调 URL
   ```
   http://localhost:8000/api/auth/facebook/callback
   http://localhost:8788/api/auth/facebook/callback
   ```
4. 复制 App ID 和 App Secret

### 步骤3：验证配置

配置完成后，运行：

```bash
# 检查配置
cat .dev.vars | grep -E "GOOGLE_CLIENT_ID|FACEBOOK_APP_ID"

# 应该显示：
# GOOGLE_CLIENT_ID=你的Google_Client_ID
# FACEBOOK_APP_ID=你的Facebook_App_ID
```

---

## 📋 详细配置指南

### 方法1：使用配置脚本（推荐）

```bash
./配置OAuth.sh
```

### 方法2：手动编辑 `.dev.vars`

打开 `.dev.vars` 文件，填入以下信息：

```bash
# 后台管理配置（已存在，保留）
ADMIN_USER=billee
ADMIN_PASSWORD=bill0000

# OAuth 配置（需要填写）
GOOGLE_CLIENT_ID=你的Google_Client_ID
GOOGLE_CLIENT_SECRET=你的Google_Client_Secret
FACEBOOK_APP_ID=你的Facebook_App_ID
FACEBOOK_APP_SECRET=你的Facebook_App_Secret

# JWT Secret（已生成，保留）
JWT_SECRET=673a87704cb2a8cd58d1b8f947783a7922d7f123f8b7f43eff78a769febee3e3
```

---

## 🔍 配置检查

运行以下命令检查配置：

```bash
# 检查 OAuth 配置
grep -E "GOOGLE_CLIENT_ID|FACEBOOK_APP_ID" .dev.vars

# 如果显示空值，说明未配置
# 如果显示具体值，说明已配置
```

---

## ⚠️ 注意事项

1. **回调 URL 必须完全匹配**
   - Google：`http://localhost:8000/api/auth/google/callback`
   - Facebook：`http://localhost:8000/api/auth/facebook/callback`

2. **本地开发限制**
   - Google：需要配置 `localhost` 为授权域名
   - Facebook：应用需要处于「开发模式」

3. **生产环境配置**
   - 需要在 Cloudflare Workers Dashboard 中设置 Secrets
   - 回调 URL 需要改为生产域名

---

## 📚 相关文档

- `快速配置OAuth-简化版.md` - 5分钟快速配置指南
- `OAuth配置步骤.md` - 详细配置步骤
- `setup-oauth-guide.md` - 完整配置指南

---

**当前状态**：OAuth 未配置，需要完成配置后才能使用 OAuth 登录功能。
