#!/bin/bash
# 查看开发服务器日志

if [ -f logs/server.log ]; then
    echo "📝 实时日志 (Ctrl+C 退出):"
    echo ""
    tail -f logs/server.log
else
    echo "❌ 日志文件不存在"
    echo "💡 请先启动服务器: ./dev-start.sh"
fi
