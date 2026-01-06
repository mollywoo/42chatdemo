# 路由中间件测试指南

**创建日期**: 2025-01-03
**功能**: 路由保护中间件已实现
**状态**: ✅ 已完成

---

## 📋 中间件功能说明

### 🛡️ 保护的路由
- `/chat` - 对话页面（需要登录）
- `/settings` - 设置页面（需要登录）
- `/chat/*` - 所有对话相关页面（需要登录）
- `/settings/*` - 所有设置相关页面（需要登录）

### 🔓 公开路由
- `/` - 首页（公开）
- `/login` - 登录页面（公开）
- `/register` - 注册页面（公开）

### 🔄 重定向逻辑

#### 未登录用户访问受保护路由
```
访问: /chat
↓
重定向到: /login?redirect=/chat
↓
登录后返回: /chat
```

#### 已登录用户访问登录/注册页面
```
访问: /login (已登录)
↓
重定向到: /
```

---

## 🧪 测试用例

### 测试用例 1：未登录访问 /chat
**步骤**：
1. 确保未登录（清除 Cookie 或打开无痕窗口）
2. 访问：http://localhost:3000/chat
3. 观察是否重定向到登录页

**预期结果**：
- ✅ 自动重定向到 `/login`
- ✅ URL 包含 `?redirect=/chat` 参数
- ✅ 登录后返回到 `/chat`

**命令测试**：
```bash
# 在新终端中
curl -I http://localhost:3000/chat
# 应该返回 302 重定向到 /login
```

---

### 测试用例 2：未登录访问 /settings
**步骤**：
1. 确保未登录
2. 访问：http://localhost:3000/settings
3. 观察重定向

**预期结果**：
- ✅ 重定向到 `/login?redirect=/settings`

---

### 测试用例 3：已登录访问 /login
**步骤**：
1. 登录账户
2. 访问：http://localhost:3000/login
3. 观察重定向

**预期结果**：
- ✅ 重定向到首页 `/`

---

### 测试用例 4：已登录访问 /register
**步骤**：
1. 登录账户
2. 访问：http://localhost:3000/register
3. 观察重定向

**预期结果**：
- ✅ 重定向到首页 `/`

---

### 测试用例 5：正常访问公开页面
**步骤**：
1. 未登录状态访问 `/`
2. 未登录状态访问 `/login`
3. 未登录状态访问 `/register`

**预期结果**：
- ✅ 所有页面正常访问，无重定向

---

### 测试用例 6：登录后返回原页面
**步骤**：
1. 未登录访问 `/chat`
2. 自动重定向到 `/login?redirect=/chat`
3. 输入凭证登录
4. 点击登录按钮

**预期结果**：
- ✅ 登录成功后自动返回 `/chat`

---

## 🔍 测试方法

### 方法 1：浏览器测试（推荐）

#### 清除 Cookie（未登录状态）
```javascript
// 在浏览器控制台执行
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] +
    '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
});
location.reload();
```

#### 测试步骤
1. 打开浏览器开发者工具（F12）
2. 打开 Application → Cookies
3. 清除所有 Cookie（或使用无痕窗口）
4. 访问受保护路由：http://localhost:3000/chat
5. 观察地址栏变化

---

### 方法 2：curl 命令测试

```bash
# 测试未登录访问 /chat
curl -v http://localhost:3000/chat

# 预期：302 重定向到 /login

# 测试重定向跟随
curl -L http://localhost:3000/chat

# 预期：最终返回登录页面内容
```

---

### 方法 3：使用测试脚本

创建文件 `test-middleware.sh`：

```bash
#!/bin/bash

echo "🧪 测试路由中间件"
echo ""

# 测试 1：未登录访问 /chat
echo "测试 1: 未登录访问 /chat"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost:3000/chat
echo ""

# 测试 2：未登录访问 /settings
echo "测试 2: 未登录访问 /settings"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost:3000/settings
echo ""

# 测试 3：访问公开页面
echo "测试 3: 访问公开页面 /"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost:3000/
echo ""

echo "✅ 测试完成"
```

运行测试：
```bash
chmod +x test-middleware.sh
./test-middleware.sh
```

---

## 📊 验收标准

### 功能验收
- [ ] 未登录无法访问 /chat
- [ ] 未登录无法访问 /settings
- [ ] 未登录访问受保护路由时重定向到 /login
- [ ] 重定向 URL 包含 redirect 参数
- [ ] 已登录无法访问 /login 和 /register
- [ ] 已登录访问认证页面时重定向到 /
- [ ] 登录后正确返回原页面

### 用户体验验收
- [ ] 重定向流畅无闪烁
- [ ] URL 参数清晰可见
- [ ] 登录后自动跳转
- [ ] 无死循环重定向

---

## 🐛 常见问题

### 问题 1：中间件未生效
**症状**：访问受保护路由没有重定向

**可能原因**：
- 中间件文件位置错误
- Next.js 未重启

**解决方案**：
```bash
# 1. 检查文件位置
ls -la src/middleware.ts

# 2. 重启开发服务器
./dev-stop.sh
./dev-start.sh

# 3. 检查 Next.js 是否识别中间件
# 查看终端输出，应该看到中间件相关信息
```

---

### 问题 2：重定向循环
**症状**：浏览器显示 "重定向次数过多"

**可能原因**：
- 中间件逻辑错误
- 会话验证失败

**解决方案**：
```javascript
// 在 middleware.ts 中添加调试日志
export default auth.middleware((req) => {
  console.log('路径:', req.nextUrl.pathname);
  console.log('用户:', req.user);
  // ... 其余代码
});
```

---

### 问题 3：登录后没有返回原页面
**症状**：登录后总是跳转到首页

**可能原因**：
- redirect 参数未传递
- 登录页面未处理 redirect 参数

**解决方案**：
检查登录页面是否正确读取 `redirectTo` 参数：
```typescript
const searchParams = useSearchParams();
const redirectTo = searchParams.get("redirect") || ROUTES.HOME;
```

---

## 🔧 调试技巧

### 1. 查看中间件日志
在浏览器控制台查看 Network 标签：
- 查看请求的响应状态码
- 302 = 重定向
- 200 = 正常访问

### 2. 添加调试日志
在 `src/middleware.ts` 中添加：
```typescript
export default auth.middleware((req) => {
  console.log('[Middleware] 路径:', req.nextUrl.pathname);
  console.log('[Middleware] 用户:', req.user ? '已登录' : '未登录');
  // ... 其余代码
});
```

### 3. 检查 Better Auth 会话
访问：http://localhost:3000/api/auth/get-session
应该返回当前会话信息或 null

---

## 📁 相关文件

- `src/middleware.ts` - 路由中间件（核心文件）
- `src/app/(auth)/login/page.tsx` - 登录页面（已更新 redirect 处理）
- `src/lib/auth/index.ts` - Better Auth 配置
- `src/constants/config.ts` - 路由常量

---

## ✅ 测试检查清单

### 基础功能
- [ ] 中间件已创建并生效
- [ ] 未登录访问 /chat 重定向到 /login
- [ ] 未登录访问 /settings 重定向到 /login
- [ ] 已登录访问 /login 重定向到 /
- [ ] 已登录访问 /register 重定向到 /

### 高级功能
- [ ] redirect 参数正确传递
- [ ] 登录后返回原页面
- [ ] 无重定向循环
- [ ] 公开页面正常访问

---

## 🎯 下一步

中间件测试通过后，可以继续实现：
1. 会话过期处理（显示友好提示）
2. 删除对话功能
3. 对话搜索功能
4. 对话导出功能

---

**测试状态**: ⏳ 等待测试
**最后更新**: 2025-01-03
