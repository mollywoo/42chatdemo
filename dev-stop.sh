#!/bin/bash
# 停止开发服务器

echo "🛑 停止开发服务器..."

# 方法 1：使用 pid 文件
if [ -f logs/server.pid ]; then
    PID=$(cat logs/server.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo "✅ 已停止进程 $PID"
    else
        echo "⚠️  进程 $PID 不存在"
    fi
    rm logs/server.pid
fi

# 方法 2：查找并停止所有 next dev 进程
pkill -f "next dev" 2>/dev/null

# 等待进程完全停止
sleep 2

# 验证是否停止
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  端口 3000 仍被占用"
    echo "💡 强制停止: kill -9 \$(lsof -ti:3000)"
else
    echo "✅ 服务器已完全停止"
fi
