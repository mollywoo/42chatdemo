# 开发工作流程指南

## 🔄 推荐的工作流程

### 方案 1：开发服务器在后台运行（推荐）

**终端 A（开发终端）- 用于 AI 辅助开发**
```bash
# 1. 进入项目目录
cd /Users/imolly/2025AIPD/project-template-student-db

# 2. 启动开发服务器（后台运行）
nohup npm run dev > logs/server.log 2>&1 &

# 3. 记录进程 ID
echo $! > logs/server.pid

# 4. 查看服务器日志
tail -f logs/server.log

# 5. 停止服务器（需要时）
kill $(cat logs/server.pid)
```

**终端 B（测试终端）- 用于手动测试**
```bash
# 1. 打开新的终端窗口

# 2. 创建日志目录
mkdir -p logs

# 3. 记录测试结果
cat > logs/test-notes.md << EOF
# 测试记录

## 测试时间
$(date)

## 测试项目
注册功能测试

## 测试结果
EOF

# 4. 打开浏览器测试
open http://localhost:3000/register

# 5. 查看服务器日志（另一个标签页）
tail -f /Users/imolly/2025AIPD/project-template-student-db/logs/server.log
```

---

### 方案 2：使用 screen 或 tmux（最佳）

**使用 screen（适合初学者）**

终端 A：
```bash
# 创建名为 "dev" 的 screen 会话
screen -S dev

# 在 screen 会话中启动服务器
cd /Users/imolly/2025AIPD/project-template-student-db
npm run dev

# 按 Ctrl+A 然后按 D 来分离会话（服务器继续运行）
```

终端 B：
```bash
# 继续开发工作
cd /Users/imolly/2025AIPD/project-template-student-db

# 测试功能
open http://localhost:3000/register

# 需要查看服务器日志时，重新连接到 screen 会话
screen -r dev

# 按 Ctrl+A 然后按 D 再次分离
```

**使用 tmux（更强大）**

```bash
# 创建新会话
tmux new-session -d -s dev 'npm run dev'

# 查看会话列表
tmux list-sessions

# 连接到会话
tmux attach-session -t dev

# 分离会话（在 tmux 内按 Ctrl+B 然后按 D）
```

---

### 方案 3：简单直接（快速测试）

**终端 A（开发终端）**
```bash
# 只需保持开发服务器运行
cd /Users/imolly/2025AIPD/project-template-student-db
npm run dev

# AI 助手在这个终端继续开发任务
# 服务器会持续运行并输出日志
```

**终端 B（测试终端）**
```bash
# 打开新的终端窗口或标签页
# 无需任何命令，只需打开浏览器测试

# 记录测试结果（可选）
cat >> test-results.md << EOF

## 测试 - $(date)
- 注册功能：✅ 通过
- 登录功能：⏳ 待测试
EOF
```

---

## 📋 快速命令参考

### 查看服务器是否运行
```bash
lsof -ti:3000
# 如果有输出，说明服务器正在运行
```

### 停止服务器
```bash
# 方法 1：使用 lsof
kill $(lsof -ti:3000)

# 方法 2：使用 pkill
pkill -f "next dev"

# 方法 3：如果使用了 screen
screen -S dev -X stuff "^C"  # 发送 Ctrl+C

# 方法 4：如果使用了 pid 文件
kill $(cat logs/server.pid)
```

### 重启服务器
```bash
# 停止并重启
kill $(lsof -ti:3000)
sleep 2
npm run dev
```

### 查看实时日志
```bash
# 如果使用 nohup
tail -f logs/server.log

# 如果使用 screen（先连接）
screen -r dev

# 直接运行（查看当前终端输出）
# 日志会直接显示在运行 npm run dev 的终端
```

---

## 🎯 当前推荐设置

基于您的情况，我推荐使用**方案 3（简单直接）**：

### 设置步骤：

**1. 在当前终端（终端 A）**
```bash
# 开发服务器已经在后台运行（进程 ID: d536ae）
# 继续使用这个终端进行开发工作
```

**2. 打开新的终端（终端 B）进行测试**
```bash
# 新建一个终端窗口（Command+T 或 Cmd+T）

# 进入项目目录（可选）
cd /Users/imolly/2025AIPD/project-template-student-db

# 查看服务器日志（可选）
tail -f logs/server.log 2>/dev/null || echo "日志文件不存在，使用 screen 方式查看"

# 或者直接打开浏览器测试
open http://localhost:3000/register
```

**3. 在浏览器中测试**
- 打开：http://localhost:3000/register
- 填写表单测试注册功能
- 观察结果

**4. 记录测试结果**
```bash
# 在终端 B 中
cat >> REGISTER_TEST_RESULTS.md << EOF

## 测试记录 - $(date +'%Y-%m-%d %H:%M:%S')

### 测试用例 1：正常注册
- 姓名：张三
- 邮箱：zhangsan@test.com
- 密码：test123456
- 结果：✅ 成功 / ❌ 失败
- 备注：

EOF
```

---

## 🛠️ 当前状态

### 运行中的服务
- ✅ 开发服务器：http://localhost:3000（进程 ID: d536ae）
- ✅ 数据库：Neon PostgreSQL（已连接）

### 已完成的测试
从日志中可以看到：
- ✅ 密码验证正常（太短的密码被拒绝）
- ✅ 注册成功（200 状态码）
- ✅ 自动登录并跳转首页
- ✅ 会话创建成功
- ⚠️ 有数据库连接偶尔断开（网络问题）

---

## 💡 最佳实践建议

1. **开发时保持服务器运行**
   - 在一个终端持续运行 `npm run dev`
   - AI 助手在这个终端工作
   - 修改代码后自动热重载

2. **测试时使用新终端或浏览器**
   - 打开新终端查看日志
   - 使用浏览器实际测试功能
   - 记录测试结果

3. **查看日志**
   ```bash
   # 实时查看所有日志
   tail -f logs/server.log

   # 查看错误日志
   grep ERROR logs/server.log

   # 查看特定请求
   grep "POST /api/auth/sign-up" logs/server.log
   ```

4. **管理后台进程**
   ```bash
   # 查看所有 Node.js 进程
   ps aux | grep node

   # 查看端口占用
   lsof -i:3000

   # 查看后台任务
   jobs -l
   ```

---

## 🚀 下一步

**在终端 A（继续开发）**：
您可以让 AI 助手继续实现下一个功能，例如：
- 路由中间件保护
- 删除对话功能
- 对话搜索功能

**在终端 B（测试功能）**：
- 手动测试注册功能
- 查看 `REGISTER_TEST_REPORT.md` 了解详细测试步骤
- 记录测试结果

---

**创建时间**：2025-01-03
**用途**：多终端开发测试工作流程
