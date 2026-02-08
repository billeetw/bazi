# 🧪 OAuth 本地测试指南

## 📋 测试前检查

### 1. 确认 OAuth 配置

```bash
cat .dev.vars | grep -E "GOOGLE_CLIENT_ID|FACEBOOK_APP_ID"
```

应该显示：
- `GOOGLE_CLIENT_ID=600329304958-me8iui2q7ec5k7ajhjijf939os6vann3.apps.googleusercontent.com`
- `FACEBOOK_APP_ID=438019083017310`

### 2. 检查回调 URL 配置

#### Google OAuth 回调 URL
- 访问：https://console.cloud.google.com/
- 「API 和服务」>「凭据」
- 找到你的 OAuth 客户端
- 确认「已授权的重定向 URI」包含：
  ```
  http://localhost:8000/api/auth/google/callback
  http://localhost:8788/api/auth/google/callback
  ```

#### Facebook OAuth 回调 URL
- 访问：https://developers.facebook.com/
- 选择应用（App ID: `438019083017310`）
- 「Facebook 登录」>「设置」
- 确认「有效的 OAuth 重定向 URI」包含：
  ```
  http://localhost:8000/api/auth/facebook/callback
  http://localhost:8788/api/auth/facebook/callback
  ```

---

## 🚀 启动测试服务器

### 步骤1：运行数据库迁移

```bash
npx wrangler d1 migrations apply consult-db --local
```

**预期输出**：
```
✅ Applied migration 0001_create_consultations.sql
✅ Applied migration 0002_create_event_registrations.sql
✅ Applied migration 0003_create_feedback.sql
✅ Applied migration 0004_create_users.sql
```

### 步骤2：启动服务器

```bash
npx wrangler pages dev . --port 8788
```

**预期输出**：
```
 ⛅️ wrangler 3.x.x
───────────────────
[wrangler:inf] Ready on http://localhost:8788
```

---

## 🧪 测试步骤

### 测试1：访问主页面

1. 打开浏览器访问：`http://localhost:8788/index.html`
2. 页面应该正常加载
3. 检查浏览器控制台（F12）是否有错误

### 测试2：测试 Google OAuth

1. 点击「活動報名」或「預約深度諮詢」
2. 应该弹出登录模态框
3. 点击「Google」按钮
4. 应该打开 Google 授权页面
5. 选择 Google 账号并授权
6. 授权后应该自动关闭弹窗并登录
7. 应该跳转到目标页面

**预期结果**：
- ✅ 弹出登录模态框
- ✅ Google 授权页面正常打开
- ✅ 授权后自动登录
- ✅ 跳转到目标页面

### 测试3：测试 Facebook OAuth

1. 点击「活動報名」或「預約深度諮詢」
2. 如果已登录，先登出
3. 点击「Facebook」按钮
4. 应该打开 Facebook 授权页面
5. 选择 Facebook 账号并授权
6. 授权后应该自动关闭弹窗并登录
7. 应该跳转到目标页面

**预期结果**：
- ✅ 弹出登录模态框
- ✅ Facebook 授权页面正常打开
- ✅ 授权后自动登录
- ✅ 跳转到目标页面

### 测试4：测试邮箱注册/登录

1. 点击「活動報名」或「預約深度諮詢」
2. 在登录模态框中：
   - 点击「还没有账号？立即注册」
   - 填写 Email、密码、姓名
   - 点击「注册」
3. 注册成功后应该自动登录
4. 登出后测试登录功能

**预期结果**：
- ✅ 注册成功
- ✅ 自动登录
- ✅ 登录功能正常

---

## 🔍 故障排除

### 问题1：Google OAuth 显示 "redirect_uri_mismatch"

**原因**：回调 URL 未在 Google Cloud Console 中配置

**解决**：
1. 访问 Google Cloud Console
2. 检查「已授权的重定向 URI」
3. 确保包含：`http://localhost:8788/api/auth/google/callback`
4. 保存后等待几分钟生效

### 问题2：Facebook OAuth 显示 "Invalid OAuth redirect_uri"

**原因**：回调 URL 未在 Facebook Developers 中配置

**解决**：
1. 访问 Facebook Developers
2. 检查「有效的 OAuth 重定向 URI」
3. 确保包含：`http://localhost:8788/api/auth/facebook/callback`
4. 保存后立即生效

### 问题3：OAuth 弹窗无法打开

**原因**：浏览器阻止了弹窗

**解决**：
1. 检查浏览器弹窗设置
2. 允许 `localhost:8788` 的弹窗
3. 或使用浏览器开发者工具查看错误信息

### 问题4：授权后无法登录

**原因**：后端 API 可能有问题

**解决**：
1. 查看服务器日志（Wrangler 输出）
2. 查看浏览器控制台错误
3. 检查网络请求（Network 标签）
4. 确认数据库迁移已运行

### 问题5：数据库错误

**错误**：`Table 'users' doesn't exist`

**解决**：
```bash
npx wrangler d1 migrations apply consult-db --local
```

---

## 📊 测试检查清单

### 配置检查
- [ ] OAuth 配置已完整（Google + Facebook）
- [ ] Google 回调 URL 已配置
- [ ] Facebook 回调 URL 已配置
- [ ] 数据库迁移已运行

### 功能测试
- [ ] 主页面正常加载
- [ ] 登录模态框正常显示
- [ ] Google OAuth 登录成功
- [ ] Facebook OAuth 登录成功
- [ ] 邮箱注册成功
- [ ] 邮箱登录成功
- [ ] 登录后跳转正常
- [ ] 登出功能正常

### 错误检查
- [ ] 浏览器控制台无错误
- [ ] 服务器日志无错误
- [ ] 网络请求正常（200/201 状态码）

---

## 🎯 快速测试命令

```bash
# 1. 运行数据库迁移
npx wrangler d1 migrations apply consult-db --local

# 2. 启动服务器
npx wrangler pages dev . --port 8788

# 3. 在浏览器中访问
# http://localhost:8788/index.html
```

---

## 💡 测试提示

1. **使用无痕模式**：避免浏览器缓存和已登录状态影响测试
2. **检查控制台**：打开浏览器开发者工具（F12）查看错误
3. **检查网络**：在 Network 标签中查看 API 请求
4. **测试不同浏览器**：Chrome、Firefox、Safari

---

**准备好开始测试了吗？运行上面的命令启动服务器！** 🚀
