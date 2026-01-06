#!/bin/bash
# 记录测试结果

TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')
TEST_FILE="logs/test-results.md"

# 创建测试文件（如果不存在）
if [ ! -f $TEST_FILE ]; then
    cat > $TEST_FILE << EOF
# 测试结果记录

---

EOF
fi

# 追加测试记录
cat >> $TEST_FILE << EOF

## 测试记录 - $TIMESTAMP

**测试项目**: $1
**测试结果**: $2

**详细信息**:
$3

EOF

echo "✅ 测试结果已记录到: $TEST_FILE"
echo ""
echo "查看所有测试结果:"
echo "  cat $TEST_FILE"
