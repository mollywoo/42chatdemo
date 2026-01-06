#!/bin/bash
# 检查开发服务器状态

echo "🔍 检查开发服务器状态..."
echo ""

# 检查端口
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✅ 端口 3000: 使用中"
    echo ""
    echo "📊 进程信息:"
    ps aux | grep "next dev" | grep -v grep
    echo ""
    echo "🌐 访问地址:"
    echo "   http://localhost:3000"
    echo ""
    echo "📝 日志文件:"
    if [ -f logs/server.pid ]; then
        PID=$(cat logs/server.pid)
        echo "   PID: $PID (logs/server.pid)"
    fi
    if [ -f logs/server.log ]; then
        echo "   大小: $(wc -l < logs/server.log) 行"
        echo "   查看: tail -f logs/server.log"
    fi
else
    echo "❌ 端口 3000: 未使用"
    echo ""
    echo "💡 启动服务器:"
    echo "   ./dev-start.sh"
    echo "   或"
    echo "   npm run dev"
fi
