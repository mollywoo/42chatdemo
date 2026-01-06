# 中间件功能测试指南

## 📋 测试场景

### 场景 1: 未登录用户访问受保护路由
**预期行为**: 重定向到登录页面，并携带回调URL

#### 测试步骤:
1. 确保未登录状态（清除cookies或使用隐私窗口）
2. 直接访问: http://localhost:3000/chat
3. **预期结果**: 自动重定向到 `http://localhost:3000/login?redirect=/chat`
4. 点击浏览器返回按钮，URL应保持 `/login?redirect=/chat`

**测试命令:**
```bash
# 使用 curl 测试（无 cookies）
curl -I http://localhost:3000/chat
# 应返回 302 重定向到 /login
```

---

### 场景 2: 未登录用户访问设置页面
**预期行为**: 重定向到登录页面

#### 测试步骤:
1. 确保未登录状态
2. 直接访问: http://localhost:3000/settings
3. **预期结果**: 自动重定向到 `http://localhost:3000/login?redirect=/settings`

---

### 场景 3: 已登录用户访问登录/注册页面
**预期行为**: 重定向到首页

#### 测试步骤:
1. 先注册/登录一个账户
2. 访问: http://localhost:3000/login
3. **预期结果**: 自动重定向到 `http://localhost:3000/`
4. 访问: http://localhost:3000/register
5. **预期结果**: 自动重定向到 `http://localhost:3000/`

---

### 场景 4: 已登录用户访问受保护路由
**预期行为**: 正常访问页面

#### 测试步骤:
1. 确保已登录
2. 访问: http://localhost:3000/chat
3. **预期结果**: 正常显示聊天页面
4. 访问: http://localhost:3000/settings
5. **预期结果**: 正常显示设置页面

---

### 场景 5: 未登录用户访问公开路由
**预期行为**: 正常访问

#### 测试步骤:
1. 确保未登录状态
2. 访问: http://localhost:3000/
3. **预期结果**: 正常显示首页
4. 访问: http://localhost:3000/login
5. **预期结果**: 正常显示登录页面
6. 访问: http://localhost:3000/register
7. **预期结果**: 正常显示注册页面

---

### 场景 6: API 路由和静态资源
**预期行为**: 不受中间件影响

#### 测试步骤:
1. 访问: http://localhost:3000/api/auth/...
2. **预期结果**: API 正常工作
3. 访问静态资源（如 favicon.ico）
4. **预期结果**: 正常加载

---

## 🛠️ 快速测试脚本

创建一个测试脚本来快速验证所有场景：

```bash
#!/bin/bash
# test-middleware.sh

echo "🧪 测试中间件功能..."
echo ""

# 测试 1: 未登录访问受保护路由
echo "测试 1: 未登录访问 /chat"
curl -s -o /dev/null -w "状态码: %{http_code} | 重定向: %{redirect_url}\n" http://localhost:3000/chat
echo ""

# 测试 2: 未登录访问 /settings
echo "测试 2: 未登录访问 /settings"
curl -s -o /dev/null -w "状态码: %{http_code} | 重定向: %{redirect_url}\n" http://localhost:3000/settings
echo ""

# 测试 3: 访问公开路由
echo "测试 3: 访问首页 /"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost:3000/
echo ""

# 测试 4: 访问登录页
echo "测试 4: 访问登录页 /login"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost:3000/login
echo ""

echo "✅ 测试完成！"
echo ""
echo "💡 手动测试说明:"
echo "1. 在浏览器中测试上述场景"
echo "2. 测试已登录状态：先注册用户，然后重新访问 /login 和 /register"
echo "3. 测试登录后重定向：访问 /chat → 被重定向到 /login?redirect=/chat → 登录后应返回 /chat"
```

---

## 🔍 浏览器开发者工具测试

### 1. 查看 Network 标签
```
1. 打开开发者工具 (F12)
2. 切换到 Network 标签
3. 访问受保护路由
4. 查看重定向响应:
   - 状态码应该是 302 或 307
   - Location header 应该指向 /login
```

### 2. 查看 Application > Cookies
```
1. 查看当前 cookies
2. 找到 better-auth.session_token
3. 删除它来模拟未登录状态
4. 刷新页面测试中间件
```

### 3. Console 测试
```javascript
// 在浏览器控制台执行
fetch('/chat').then(r => console.log('重定向到:', r.url))
fetch('/settings').then(r => console.log('状态:', r.status))
```

---

## 📊 测试检查清单

### 未登录状态测试
- [ ] 访问 `/chat` → 重定向到 `/login?redirect=/chat`
- [ ] 访问 `/settings` → 重定向到 `/login?redirect=/settings`
- [ ] 访问 `/` → 正常显示
- [ ] 访问 `/login` → 正常显示
- [ ] 访问 `/register` → 正常显示

### 已登录状态测试
- [ ] 访问 `/login` → 重定向到 `/`
- [ ] 访问 `/register` → 重定向到 `/`
- [ ] 访问 `/chat` → 正常显示
- [ ] 访问 `/settings` → 正常显示
- [ ] 访问 `/` → 正常显示

### 边缘情况测试
- [ ] 直接访问 `/chat/123` → 重定向到 `/login?redirect=/chat/123`
- [ ] API 路由不受影响
- [ ] 静态资源不受影响

---

## 🐛 常见问题排查

### 问题 1: 中间件不生效
**解决方法:**
```bash
# 重启开发服务器
# 按 Ctrl+C 停止当前服务器
npm run dev
```

### 问题 2: 无法登录
**检查:**
1. 数据库是否正确配置 (`.env` 文件)
2. 运行迁移: `npm run db:migrate`
3. 查看终端控制台的错误信息

### 问题 3: 登录后仍被重定向
**检查:**
1. 浏览器开发者工具 > Application > Cookies
2. 确认 `better-auth.session_token` cookie 存在
3. 检查 cookie 的 domain 和 path 设置

---

## 🎯 自动化测试建议

如果需要自动化测试，可以考虑使用 Playwright:

```bash
npm install -D @playwright/test
```

创建测试文件 `tests/middleware.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Auth Middleware', () => {
  test('should redirect unauthenticated users from /chat to /login', async ({ page }) => {
    await page.goto('/chat');
    await expect(page).toHaveURL(/\/login.*/);
  });

  test('should allow authenticated users to access /chat', async ({ page }) => {
    // 先登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 然后访问受保护路由
    await page.goto('/chat');
    await expect(page).toHaveURL('/chat');
  });
});
```

---

## 📝 测试记录模板

```
测试日期: _______________
测试环境: □ 开发环境  □ 生产环境
浏览器: _______________

| 场景 | 预期结果 | 实际结果 | 状态 |
|------|---------|---------|------|
| 未登录访问 /chat | 重定向到 /login |  | ✅ / ❌ |
| 未登录访问 /settings | 重定向到 /login |  | ✅ / ❌ |
| 已登录访问 /login | 重定向到 / |  | ✅ / ❌ |
| 已登录访问 /chat | 正常显示 |  | ✅ / ❌ |

备注: _________________________________________
```
