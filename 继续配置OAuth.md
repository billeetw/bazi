# 🔐 继续配置 OAuth

## ✅ 已配置

- ✅ **Google Client ID**: `600329304958-me8iui2q7ec5k7ajhjijf939os6vann3.apps.googleusercontent.com`
- ❌ **Google Client Secret**: 还需要配置
- ❌ **Facebook App ID**: 还需要配置
- ❌ **Facebook App Secret**: 还需要配置

---

## 📝 下一步：获取 Google Client Secret

### 方法1：从 Google Cloud Console 获取

1. 访问：https://console.cloud.google.com/
2. 选择你的项目
3. 「API 和服务」>「凭据」
4. 找到你刚才创建的 OAuth 客户端（Client ID: `600329304958-me8iui2q7ec5k7ajhjijf939os6vann3`）
5. 点击客户端名称进入详情
6. 找到「客户端密钥」部分
7. 如果显示「已隐藏」，点击「显示」按钮
8. **复制 Client Secret**

### 方法2：如果找不到 Client Secret

如果 Client Secret 只显示一次后无法再查看，你需要：
1. 删除现有的 OAuth 客户端
2. 重新创建一个新的 OAuth 客户端
3. **这次一定要复制并保存 Client Secret**

---

## 🔧 更新配置

获取到 Google Client Secret 后，有两种方式更新：

### 方式1：手动编辑 `.dev.vars`

打开 `.dev.vars` 文件，找到：
```bash
GOOGLE_CLIENT_SECRET=
```

填入你的 Client Secret：
```bash
GOOGLE_CLIENT_SECRET=你的Google_Client_Secret
```

### 方式2：运行配置脚本

```bash
./配置OAuth.sh
```

脚本会保留已配置的 Google Client ID，只询问其他配置。

---

## 📋 配置检查清单

- [x] Google Client ID ✅
- [ ] Google Client Secret ⏳
- [ ] Facebook App ID ⏳
- [ ] Facebook App Secret ⏳
- [x] JWT Secret ✅

---

## 💡 提示

1. **Google Client Secret 很重要**：一旦丢失，需要重新创建 OAuth 客户端
2. **回调 URL 配置**：确保在 Google Cloud Console 中已配置：
   - `http://localhost:8000/api/auth/google/callback`
   - `http://localhost:8788/api/auth/google/callback`
3. **可以分步配置**：先完成 Google，再配置 Facebook

---

**获取到 Google Client Secret 后，告诉我，我会帮你更新配置！** 🚀
