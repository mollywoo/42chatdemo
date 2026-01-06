#!/bin/bash
# 启动开发服务器（后台运行）

echo "🚀 启动开发服务器..."

# 检查是否已在运行
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  端口 3000 已被占用"
    echo "💡 请先运行: ./dev-stop.sh"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 启动服务器（后台运行）
nohup npm run dev > logs/server.log 2>&1 &

# 保存进程 ID
echo $! > logs/server.pid

echo "✅ 服务器已启动"
echo "📍 地址: http://localhost:3000"
echo "📝 日志: logs/server.log"
echo ""
echo "查看日志:"
echo "  tail -f logs/server.log"
echo ""
echo "停止服务器:"
echo "  ./dev-stop.sh"
echo ""
echo "等待服务器启动..."
sleep 3

# 检查是否成功启动
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✅ 服务器运行正常！"
else
    echo "❌ 服务器启动失败，请查看日志: logs/server.log"
    exit 1
fi
