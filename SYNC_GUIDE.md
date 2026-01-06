# 同步开发状态到仓库指南

**创建日期**: 2025-01-03
**用途**: 将本地开发目录的更改同步到 Git 仓库并推送

---

## 📋 目录结构

```
/Users/imolly/2025AIPD/
├── project-template-student-db/          # 当前开发目录（无 Git）
│   ├── src/
│   ├── package.json
│   └── sync-to-repo.sh                    # ← 同步脚本
└── 20251213/
    └── project-template-student-stu-迷思湖/  # Git 仓库
        └── docs/
            └── ch6-homework-1/              # ← 同步目标
```

---

## 🚀 快速开始

### 方法 1：使用同步脚本（推荐）

```bash
# 在当前开发目录执行
cd /Users/imolly/2025AIPD/project-template-student-db
./sync-to-repo.sh
```

**脚本功能**：
1. ✅ 复制所有开发文件到目标仓库
2. ✅ 自动排除 `node_modules`、`.next` 等不必要的文件
3. ✅ 在目标仓库中执行 `git add`
4. ✅ 提示你输入提交信息
5. ✅ 询问是否推送到远程仓库

### 方法 2：手动同步

```bash
# 1. 复制文件
rsync -av --exclude='node_modules/' --exclude='.next/' \
  /Users/imolly/2025AIPD/project-template-student-db/ \
  /Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖/docs/ch6-homework-1/

# 2. 切换到目标仓库
cd /Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖

# 3. 查看状态
git status

# 4. 添加更改
git add docs/ch6-homework-1/

# 5. 提交更改
git commit -m "feat: 更新开发进度"

# 6. 推送到远程
git push origin stu-迷思湖
```

---

## 📝 脚本使用说明

### 运行脚本

```bash
./sync-to-repo.sh
```

### 交互流程

1. **检查目录**
   - 脚本会验证源目录和目标仓库是否存在
   - 显示路径信息

2. **复制文件**
   - 使用 `rsync` 同步文件
   - 自动排除不需要的文件

3. **查看 Git 状态**
   - 显示有更改的文件列表

4. **输入提交信息**
   - 可以输入自定义提交信息
   - 留空则使用默认提交信息

5. **确认推送**
   - 询问是否立即推送到远程
   - 输入 `y` 确认推送
   - 输入 `N` 跳过推送

### 默认排除的文件

脚本会自动排除以下文件/目录：

- `node_modules/` - 依赖包
- `.next/` - Next.js 构建输出
- `dist/` - 打包输出
- `build/` - 构建输出
- `.env` - 环境变量（敏感信息）
- `*.log` - 日志文件
- `.DS_Store` - macOS 系统文件
- `sync-to-repo.sh` - 脚本本身
- `test-*.sh` - 测试脚本
- `dev-*.sh` - 开发脚本

---

## 🔧 常用 Git 命令

### 在目标仓库中

```bash
# 切换到目标仓库
cd /Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖

# 查看当前分支
git branch

# 查看状态
git status

# 查看更改
git diff docs/ch6-homework-1/

# 查看提交历史
git log --oneline -10

# 拉取最新更改
git pull origin stu-迷思湖

# 推送到远程
git push origin stu-迷思湖
```

---

## 📊 当前开发状态

### 已完成功能

- ✅ 注册页面实现
- ✅ 注册功能测试
- ✅ 路由中间件保护
- ✅ 中间件测试
- ✅ 删除对话功能实现
- ✅ 对话导出功能实现
- ✅ 对话归档功能实现

### 核心文件

#### 前端组件
- `src/app/(auth)/register/page.tsx` - 注册页面
- `src/app/chat/[id]/page.tsx` - 对话详情页（含删除、导出按钮）
- `src/components/layout/ConversationList.tsx` - 对话列表（含归档、搜索、重命名）

#### API 路由
- `src/app/api/conversations/route.ts` - 对话列表 API（支持归档过滤）
- `src/app/api/conversations/[id]/route.ts` - 对话 CRUD API
- `src/app/api/export/[id]/route.ts` - 导出对话 API

#### 中间件
- `src/middleware.ts` - 路由保护中间件

#### 测试指南
- `REGISTER_TEST_REPORT.md` - 注册功能测试报告
- `MIDDLEWARE_TEST_GUIDE.md` - 中间件测试指南
- `DELETE_CONVERSATION_TEST_GUIDE.md` - 删除功能测试指南
- `EXPORT_CONVERSATION_TEST_GUIDE.md` - 导出功能测试指南
- `ARCHIVE_CONVERSATION_TEST_GUIDE.md` - 归档功能测试指南

---

## 🎯 推荐工作流程

### 开发 → 同步 → 推送

```bash
# 1. 在开发目录工作
cd /Users/imolly/2025AIPD/project-template-student-db

# 2. 开发完成后，同步到仓库
./sync-to-repo.sh

# 3. 输入提交信息（如：feat: 添加提示词模板功能）

# 4. 确认推送（输入 y）

# 5. 完成！更改已推送到远程仓库
```

### 仅同步不推送

```bash
# 运行脚本
./sync-to-repo.sh

# 输入提交信息

# 推送确认时输入 N

# 稍后手动推送
cd /Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖
git push origin stu-迷思湖
```

---

## 🔍 验证同步结果

### 在远程仓库查看

```bash
# 在目标仓库
cd /Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖

# 查看最近的提交
git log --oneline -5

# 查看 ch6-homework-1 目录
ls -la docs/ch6-homework-1/
```

### 在浏览器查看

访问你的远程仓库：
```
https://cnb.cool/42edu/42aipr001/project-template-student/
```

切换到 `stu-迷思湖` 分支，进入 `docs/ch6-homework-1/` 目录。

---

## 🐛 常见问题

### 问题 1：脚本无法执行

**错误**: `bash: ./sync-to-repo.sh: Permission denied`

**解决**:
```bash
chmod +x sync-to-repo.sh
```

### 问题 2：目标目录不存在

**错误**: `No such file or directory`

**解决**:
```bash
# 创建目标目录
mkdir -p /Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖/docs/ch6-homework-1
```

### 问题 3：Git 推送失败

**错误**: `failed to push some refs`

**解决**:
```bash
cd /Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖

# 先拉取远程更改
git pull origin stu-迷思湖 --rebase

# 解决冲突（如果有）

# 再推送
git push origin stu-迷思湖
```

### 问题 4：文件冲突

**解决**:
```bash
# 查看冲突文件
git status

# 手动解决冲突
# 编辑冲突文件，删除 <<<<<<< ======= >>>>>>> 标记

# 标记为已解决
git add <conflicted-file>

# 提交
git commit
```

---

## 💡 最佳实践

### 1. 定期同步
- 每完成一个功能后同步一次
- 保持提交信息清晰明了
- 避免积压大量更改

### 2. 提交信息规范
```
feat: 添加新功能
fix: 修复问题
docs: 更新文档
test: 测试相关
refactor: 重构代码
style: 代码格式调整
chore: 构建/工具相关
```

### 3. 同步前检查
```bash
# 查看将要同步的文件
rsync -av --dry-run --exclude='node_modules/' \
  /Users/imolly/2025AIPD/project-template-student-db/ \
  /Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖/docs/ch6-homework-1/
```

### 4. 敏感信息保护
- ⚠️ **永远不要提交** `.env` 文件
- ⚠️ **永远不要提交** API 密钥
- ⚠️ **永远不要提交** 用户数据

---

## 📚 相关资源

### Git 文档
- [Git 官方文档](https://git-scm.com/doc)
- [Pro Git 中文版](https://git-scm.com/book/zh/v2)

### 项目文档
- `README.md` - 项目说明
- `STRUCTURE.md` - 项目结构
- `CLAUDE.md` - AI 助手文档

---

## 🎉 开始使用

```bash
# 立即同步
./sync-to-repo.sh
```

**祝你开发顺利！** 🚀
