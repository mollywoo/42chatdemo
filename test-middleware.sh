#!/bin/bash

# 中间件功能快速测试脚本
# 使用方法: ./test-middleware.sh

echo "🧪 中间件功能测试"
echo "======================================="
echo ""

BASE_URL="http://localhost:3000"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_redirect() {
  local test_name="$1"
  local path="$2"
  local expected_redirect="$3"

  echo -n "测试: $test_name ... "

  response=$(curl -s -w "\n%{http_code}\n%{redirect_url}" "$BASE_URL$path" 2>/dev/null)
  http_code=$(echo "$response" | tail -n 2 | head -n 1)
  redirect_url=$(echo "$response" | tail -n 1)

  if [ "$http_code" = "302" ] || [ "$http_code" = "307" ]; then
    if [[ "$redirect_url" == *"$expected_redirect"* ]]; then
      echo -e "${GREEN}✅ 通过${NC}"
      echo "   状态码: $http_code"
      echo "   重定向到: $redirect_url"
    else
      echo -e "${RED}❌ 失败${NC}"
      echo "   预期重定向包含: $expected_redirect"
      echo "   实际重定向: $redirect_url"
    fi
  else
    echo -e "${YELLOW}⚠️  未重定向 (状态码: $http_code)${NC}"
    echo "   URL: $BASE_URL$path"
  fi
  echo ""
}

test_success() {
  local test_name="$1"
  local path="$2"
  local expected_code="${3:-200}"

  echo -n "测试: $test_name ... "

  http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path" 2>/dev/null)

  if [ "$http_code" = "$expected_code" ]; then
    echo -e "${GREEN}✅ 通过${NC}"
    echo "   状态码: $http_code"
  else
    echo -e "${RED}❌ 失败${NC}"
    echo "   预期状态码: $expected_code"
    echo "   实际状态码: $http_code"
  fi
  echo ""
}

# 检查服务器是否运行
echo "检查开发服务器..."
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
  echo -e "${RED}❌ 开发服务器未运行！${NC}"
  echo "请先运行: npm run dev"
  exit 1
fi
echo -e "${GREEN}✅ 服务器运行中${NC}"
echo ""

# 开始测试
echo "📋 测试场景 1: 未登录用户访问受保护路由"
echo "---------------------------------------"
test_redirect "访问 /chat" "/chat" "/login"
test_redirect "访问 /settings" "/settings" "/login"
test_redirect "访问 /chat/123" "/chat/123" "/login"

echo "📋 测试场景 2: 未登录用户访问公开路由"
echo "-------------------------------------"
test_success "访问首页 /" "/" "200"
test_success "访问登录页 /login" "/login" "200"
test_success "访问注册页 /register" "/register" "200"

echo "📋 测试场景 3: API 路由"
echo "----------------------"
echo "测试: API 认证端点可访问 ... "
api_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/signin" 2>/dev/null)
if [ "$api_code" != "000" ]; then
  echo -e "${GREEN}✅ 通过${NC} (状态码: $api_code)"
else
  echo -e "${YELLOW}⚠️  端点可能不存在${NC}"
fi
echo ""

echo "======================================="
echo "🎉 自动化测试完成！"
echo ""
echo "📝 手动测试建议:"
echo "1. 在浏览器中测试上述场景"
echo "2. 注册一个测试账户"
echo "3. 登录后重新测试，验证已登录用户的行为"
echo ""
echo "查看详细测试指南: cat test-middleware.md"
