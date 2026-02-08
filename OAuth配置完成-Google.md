# ✅ Google OAuth 配置完成

## 📊 配置状态

- ✅ **Google Client ID**: （已移除，請在 .dev.vars 或環境變數中設定 GOOGLE_CLIENT_ID）
- ✅ **Google Client Secret**: （已移除，請在 .dev.vars 或環境變數中設定 GOOGLE_CLIENT_SECRET）
- ❌ **Facebook App ID**: 还需要配置（可选）
- ❌ **Facebook App Secret**: 还需要配置（可选）
- ✅ **JWT Secret**: 已生成

---

## 🎉 Google OAuth 已可用！

现在你可以：
1. ✅ 使用 Google 账号登录
2. ✅ 测试 Google OAuth 流程
3. ⏳ Facebook OAuth 可以稍后配置（可选）

---

## 🧪 测试 Google OAuth

### 步骤1：运行数据库迁移

```bash
npx wrangler d1 migrations apply consult-db --local
```

### 步骤2：启动服务器

```bash
npx wrangler pages dev . --port 8788
```

### 步骤3：测试登录

1. 访问：`http://localhost:8788/index.html`
2. 点击「活動報名」或「預約深度諮詢」
3. 在登录模态框中点击「Google」按钮
4. 完成 Google 授权
5. 应该自动登录并跳转

---

## ⚠️ 重要检查

### 回调 URL 配置

请确认在 Google Cloud Console 中已配置以下回调 URL：

1. 访问：https://console.cloud.google.com/
2. 「API 和服务」>「凭据」
3. 找到你的 OAuth 客户端
4. 检查「已授权的重定向 URI」是否包含：
   ```
   http://localhost:8000/api/auth/google/callback
   http://localhost:8788/api/auth/google/callback
   ```

如果没有配置，请添加这些 URL 并保存。

---

## 📝 下一步（可选）

### 配置 Facebook OAuth

如果你也想使用 Facebook 登录：

1. 访问：https://developers.facebook.com/
2. 创建应用 → 添加 Facebook Login
3. 配置回调 URL：
   ```
   http://localhost:8000/api/auth/facebook/callback
   http://localhost:8788/api/auth/facebook/callback
   ```
4. 获取 App ID 和 App Secret
5. 运行 `./配置OAuth.sh` 或手动编辑 `.dev.vars`

---

## 🔍 故障排除

### 如果 Google OAuth 不工作

1. **检查回调 URL**
   - 确保在 Google Cloud Console 中已配置
   - URL 必须完全匹配（包括协议、端口、路径）

2. **检查控制台错误**
   - 打开浏览器开发者工具（F12）
   - 查看 Console 和 Network 标签
   - 查看错误信息

3. **检查服务器日志**
   - 查看 Wrangler 服务器的输出
   - 查找错误信息

4. **常见错误**
   - `redirect_uri_mismatch`: 回调 URL 未配置或配置错误
   - `invalid_client`: Client ID 或 Secret 错误
   - `access_denied`: 用户拒绝了授权

---

## ✅ 配置检查清单

- [x] Google Client ID 已配置
- [x] Google Client Secret 已配置
- [ ] Google 回调 URL 已配置（需要在 Google Cloud Console 中检查）
- [ ] 数据库迁移已运行
- [ ] 服务器已启动
- [ ] Google OAuth 登录测试成功

---

**Google OAuth 配置完成！可以开始测试了！** 🚀
