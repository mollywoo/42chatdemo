# 快速开始指南

## 🚀 当前状态

- ✅ **开发服务器**: 已在后台运行
- 🌐 **访问地址**: http://localhost:3000
- 📝 **日志位置**: 实时在此终端查看

---

## 📋 两个终端的工作方式

### 📍 终端 A（当前终端）- 开发专用
**用途**：AI 助手继续开发新功能
**状态**：开发服务器运行中
**无需操作**：保持打开即可

### 🔍 终端 B（新终端）- 测试专用
**用途**：您手动测试功能
**打开方式**：
```bash
# macOS: Command+T (新标签页) 或 Command+N (新窗口)
# 或者在 iTerm2: Command+T

# 进入项目目录
cd /Users/imolly/2025AIPD/project-template-student-db
```

---

## 🛠️ 管理开发服务器的命令

在新终端（终端 B）中可以使用这些命令：

### 查看服务器状态
```bash
./dev-status.sh
```

### 查看实时日志
```bash
./dev-logs.sh
```

### 停止服务器
```bash
./dev-stop.sh
```

### 重启服务器
```bash
./dev-stop.sh && ./dev-start.sh
```

---

## 🧪 测试注册功能

### 方法 1：使用浏览器
```bash
# 在终端 B 中
open http://localhost:3000/register
```

### 方法 2：记录测试结果
```bash
# 测试成功时
./test-record.sh "注册功能" "✅ 通过" "使用邮箱 zhangsan@test.com 成功注册"

# 测试失败时
./test-record.sh "注册功能" "❌ 失败" "错误信息：..."
```

### 查看所有测试结果
```bash
cat logs/test-results.md
```

---

## 📊 测试检查清单

访问 http://localhost:3000/register 并测试：

### ✅ 正常注册
- [ ] 填写表单：姓名、邮箱、密码
- [ ] 点击"注册"显示"注册中..."
- [ ] 成功后跳转到首页
- [ ] 首页显示"欢迎回来，[姓名]！"

### ⚠️ 重复注册
- [ ] 使用相同邮箱再次注册
- [ ] 显示错误提示
- [ ] 不会创建重复账户

### 🔒 表单验证
- [ ] 无效邮箱被浏览器拒绝
- [ ] 短密码（<6字符）被浏览器拒绝
- [ ] 空字段无法提交

---

## 💡 推荐的工作流程

### 1️⃣ 在终端 B（新终端）
```bash
# 打开新终端（Command+T）

# 进入项目目录
cd /Users/imolly/2025AIPD/project-template-student-db

# 查看服务器状态
./dev-status.sh

# 打开浏览器测试
open http://localhost:3000/register
```

### 2️⃣ 在浏览器中
- 测试注册功能
- 观察结果
- 如有问题，查看终端 B 的日志：`./dev-logs.sh`

### 3️⃣ 记录测试结果
```bash
# 在终端 B 中
./test-record.sh "注册功能正常流程" "✅ 通过" "用户注册成功，自动登录并跳转"
```

### 4️⃣ 回到终端 A
- 告诉 AI 助手测试结果
- 继续开发下一个功能

---

## 📝 相关文档

- `WORKFLOW_GUIDE.md` - 详细工作流程说明
- `REGISTER_TEST_REPORT.md` - 注册功能测试报告
- `QUICK_TEST_GUIDE.md` - 快速测试指南

---

## ⚡ 快速参考

| 任务 | 命令 |
|------|------|
| 查看服务器状态 | `./dev-status.sh` |
| 查看实时日志 | `./dev-logs.sh` |
| 打开注册页面 | `open http://localhost:3000/register` |
| 记录测试成功 | `./test-record.sh "项目名" "✅ 通过" "详情"` |
| 停止服务器 | `./dev-stop.sh` |

---

**创建时间**: 2025-01-03
**状态**: ✅ 服务器运行中，准备测试
