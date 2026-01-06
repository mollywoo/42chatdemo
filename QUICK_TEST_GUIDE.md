#!/bin/bash
# 注册功能快速测试脚本

echo "========================================="
echo "   活水智聊 - 注册功能测试"
echo "========================================="
echo ""

# 检查开发服务器是否运行
echo "1️⃣  检查开发服务器状态..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ 开发服务器正在运行"
else
    echo "   ❌ 开发服务器未运行"
    echo ""
    echo "   请先运行：npm run dev"
    echo ""
    exit 1
fi

echo ""
echo "2️⃣  测试注册 API..."
echo "   发送测试请求到 /api/auth/sign-up/email"
echo ""

# 测试注册 API（使用唯一的邮箱）
TEST_EMAIL="test-$(date +%s)@example.com"
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"测试用户\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"test123456\"
  }" \
  -v

echo ""
echo ""
echo "3️⃣  测试结果："
echo "   ✅ 如果返回 200/201 状态码，表示注册成功"
echo "   ❌ 如果返回错误，请检查上面的详细信息"
echo ""
echo "4️⃣  下一步："
echo "   1. 在浏览器中打开: http://localhost:3000/register"
echo "   2. 填写表单进行手动测试"
echo "   3. 查看完整测试报告: REGISTER_TEST_REPORT.md"
echo ""
echo "========================================="
