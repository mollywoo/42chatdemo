# 🚀 快速同步命令参考

## 一键同步（推荐）

```bash
cd /Users/imolly/2025AIPD/project-template-student-db
./sync-to-repo.sh
```

---

## 手动同步

### 复制文件
```bash
rsync -av --exclude='node_modules/' --exclude='.next/' \
  /Users/imolly/2025AIPD/project-template-student-db/ \
  /Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖/docs/ch6-homework-1/
```

### Git 操作
```bash
cd /Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖
git add docs/ch6-homework-1/
git commit -m "feat: 更新开发进度"
git push origin stu-迷思湖
```

---

## 查看状态

```bash
# Git 状态
cd /Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖
git status

# 当前分支
git branch

# 最近提交
git log --oneline -5

# 查看远程
git remote -v
```

---

## 常用提交信息

```
feat: 完成对话归档功能
feat: 完成对话导出功能
feat: 完成删除对话功能
feat: 实现路由中间件保护
feat: 完成用户注册功能

docs: 更新测试指南
docs: 添加同步脚本说明

fix: 修复归档列表过滤问题
fix: 修复导出文件名编码

refactor: 优化对话列表组件
```

---

## 路径速查

| 项目 | 路径 |
|------|------|
| 开发目录 | `/Users/imolly/2025AIPD/project-template-student-db` |
| 目标仓库 | `/Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖` |
| 同步目标 | `docs/ch6-homework-1/` |
| 远程仓库 | `https://cnb.cool/42edu/42aipr001/project-template-student.git` |
| 当前分支 | `stu-迷思湖` |

---

## 故障排除

### 权限问题
```bash
chmod +x sync-to-repo.sh
```

### 拉取最新代码
```bash
cd /Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖
git pull origin stu-迷思湖
```

### 强制推送（谨慎使用）
```bash
git push origin stu-迷思湖 --force
```

---

## 当前状态

✅ 已完成功能：
- 注册页面
- 路由中间件
- 删除对话
- 导出对话
- 归档对话

📝 相关文件：
- `sync-to-repo.sh` - 同步脚本
- `SYNC_GUIDE.md` - 详细指南
- `ARCHIVE_CONVERSATION_TEST_GUIDE.md` - 归档功能测试
- `EXPORT_CONVERSATION_TEST_GUIDE.md` - 导出功能测试

---

**快速开始**: `./sync-to-repo.sh`
