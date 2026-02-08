# 📘 继续配置 Facebook OAuth

## ✅ 已配置

- ✅ **Facebook App Secret**: `438019083017310eea88a4bcc4fc7dff1ddd22c765acc6d`
- ❌ **Facebook App ID**: 还需要配置

---

## 📝 获取 Facebook App ID

### 步骤1：访问 Facebook Developers

👉 **https://developers.facebook.com/**

### 步骤2：找到你的应用

1. 登录 Facebook Developers
2. 点击右上角「我的应用」
3. 找到你的应用（名称应该是「一起出來玩」或类似）

### 步骤3：获取 App ID

1. 点击你的应用进入应用仪表板
2. 在「设置」>「基本」页面
3. **App ID** 会显示在页面顶部（通常是一个数字，如：`1234567890123456`）
4. **复制 App ID**

---

## 🔧 更新配置

获取到 Facebook App ID 后，告诉我，我会帮你更新配置。

或者你可以：

### 方式1：手动编辑 `.dev.vars`

打开 `.dev.vars` 文件，找到：
```bash
FACEBOOK_APP_ID=
```

填入你的 App ID：
```bash
FACEBOOK_APP_ID=你的Facebook_App_ID
```

### 方式2：运行配置脚本

```bash
./配置OAuth.sh
```

脚本会保留已配置的信息，只询问缺失的配置。

---

## ⚠️ 重要提醒

### 回调 URL 配置

请确认在 Facebook Developers 中已配置以下回调 URL：

1. 访问：https://developers.facebook.com/
2. 选择你的应用
3. 「Facebook 登录」>「设置」
4. 检查「有效的 OAuth 重定向 URI」是否包含：
   ```
   http://localhost:8000/api/auth/facebook/callback
   http://localhost:8788/api/auth/facebook/callback
   ```
5. 如果没有，请添加并保存

---

## 📋 配置检查清单

- [x] Google Client ID ✅
- [x] Google Client Secret ✅
- [ ] Facebook App ID ⏳
- [x] Facebook App Secret ✅
- [x] JWT Secret ✅
- [ ] Facebook 回调 URL 配置（需要在 Facebook Developers 中检查）

---

**获取到 Facebook App ID 后告诉我，我会帮你完成配置！** 🚀
