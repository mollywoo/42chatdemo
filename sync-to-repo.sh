#!/bin/bash

# 同步开发状态到仓库脚本
# 用法: ./sync-to-repo.sh

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 路径配置
SOURCE_DIR="/Users/imolly/2025AIPD/project-template-student-db"
TARGET_REPO="/Users/imolly/2025AIPD/20251213/project-template-student-stu-迷思湖"
TARGET_DIR="$TARGET_REPO/docs/ch6-homework-1"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  同步开发状态到仓库${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# 检查源目录
if [ ! -d "$SOURCE_DIR" ]; then
  echo -e "${RED}❌ 源目录不存在: $SOURCE_DIR${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 源目录: $SOURCE_DIR${NC}"

# 检查目标仓库
if [ ! -d "$TARGET_REPO/.git" ]; then
  echo -e "${RED}❌ 目标仓库不存在: $TARGET_REPO${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 目标仓库: $TARGET_REPO${NC}"
echo ""

# 步骤 1: 创建目标目录
echo -e "${YELLOW}📁 创建目标目录...${NC}"
mkdir -p "$TARGET_DIR"
echo -e "${GREEN}✅ 目标目录: $TARGET_DIR${NC}"
echo ""

# 步骤 2: 复制文件（排除不需要的）
echo -e "${YELLOW}📋 复制开发文件...${NC}"

# 使用 rsync 复制，排除不必要的文件
rsync -av \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='dist/' \
  --exclude='build/' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='npm-debug.log*' \
  --exclude='yarn-debug.log*' \
  --exclude='yarn-error.log*' \
  --exclude='.turbo' \
  --exclude='*.tgz' \
  --exclude='sync-to-repo.sh' \
  --exclude='test-*.sh' \
  --exclude='dev-*.sh' \
  --exclude='.swp' \
  --exclude='.swo' \
  "$SOURCE_DIR/" "$TARGET_DIR/"

echo -e "${GREEN}✅ 文件复制完成${NC}"
echo ""

# 步骤 3: 切换到目标仓库
cd "$TARGET_REPO"

# 步骤 4: 检查 Git 状态
echo -e "${YELLOW}🔍 检查 Git 状态...${NC}"
git status --short

if [ -z "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  没有需要提交的更改${NC}"
  exit 0
fi

echo ""
echo -e "${YELLOW}📝 Git 状态摘要：${NC}"
git status --short | head -20
if [ $(git status --short | wc -l) -gt 20 ]; then
  echo "... 还有更多文件"
fi
echo ""

# 步骤 5: 添加文件到 Git
echo -e "${YELLOW}➕ 添加文件到 Git...${NC}"
git add docs/ch6-homework-1/
echo -e "${GREEN}✅ 文件已添加${NC}"
echo ""

# 步骤 6: 显示更改统计
echo -e "${YELLOW}📊 更改统计：${NC}"
git diff --cached --stat

# 步骤 7: 提交更改
echo ""
echo -e "${YELLOW}💬 提交信息${NC}"
echo "请输入提交信息（留空使用默认信息）:"
read -r COMMIT_MESSAGE

if [ -z "$COMMIT_MESSAGE" ]; then
  COMMIT_MESSAGE="feat: 更新 ch6-homework-1 开发进度

- 完成对话归档功能
- 完成对话导出功能
- 完成删除对话功能
- 完成路由中间件保护
- 完成注册功能

$(date '+%Y-%m-%d %H:%M:%S')"
fi

echo ""
echo -e "${YELLOW}📝 提交更改...${NC}"
git commit -m "$COMMIT_MESSAGE"
echo -e "${GREEN}✅ 提交成功${NC}"
echo ""

# 步骤 8: 推送到远程
echo -e "${YELLOW}🚀 推送到远程仓库...${NC}"
echo -e "当前分支: ${BLUE}$(git branch --show-current)${NC}"
echo -e "远程仓库: ${BLUE}$(git remote get-url origin)${NC}"
echo ""

read -p "是否推送到远程仓库? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  git push origin stu-迷思湖
  echo -e "${GREEN}✅ 推送成功${NC}"
else
  echo -e "${YELLOW}⏸️  已跳过推送${NC}"
  echo -e "${YELLOW}💡 稍后可以使用以下命令推送:${NC}"
  echo -e "   cd $TARGET_REPO"
  echo -e "   git push origin stu-迷思湖"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  ✅ 同步完成！${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${BLUE}📁 目标位置:${NC} $TARGET_DIR"
echo -e "${BLUE}🔗 仓库位置:${NC} $TARGET_REPO"
echo -e "${BLUE}📌 分支:${NC} stu-迷思湖"
echo ""
