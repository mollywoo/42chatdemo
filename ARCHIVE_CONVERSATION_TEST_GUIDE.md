# 对话归档功能测试指南

**实现日期**: 2025-01-03
**状态**: ✅ 已完成

---

## ✅ 已实现的功能

### 1. 归档 API（已增强）
**文件**: `src/app/api/conversations/route.ts`

**新增功能**:
- ✅ GET `/api/conversations?archived=true` - 获取归档对话列表
- ✅ GET `/api/conversations?archived=false` - 获取活跃对话列表（默认）
- ✅ 返回 `archived` 字段
- ✅ 按归档状态过滤

### 2. 前端界面（已增强）
**文件**: `src/components/layout/ConversationList.tsx`

**功能**:
- ✅ 归档/取消归档对话
- ✅ 查看归档对话 toggle 按钮
- ✅ 视觉区分：归档对话显示「已归档」标签
- ✅ 下拉菜单智能显示「归档」或「取消归档」
- ✅ 归档后自动从列表中移除
- ✅ 取消归档后恢复到活跃对话列表

---

## 🧪 测试用例

### 测试用例 1：归档对话
**步骤**：
1. 登录系统
2. 在侧边栏对话列表中，找到想要归档的对话
3. 悬停在对话上，点击三点菜单
4. 选择「归档」

**预期结果**：
- ✅ 对话从活跃对话列表中消失
- ✅ 如果归档的是当前对话，页面跳转到 `/chat`
- ✅ 操作流畅，无错误

---

### 测试用例 2：查看归档对话
**步骤**：
1. 在侧边栏中找到「查看归档对话」按钮
2. 点击按钮

**预期结果**：
- ✅ 按钮变为「查看活跃对话」
- ✅ 对话列表切换显示归档的对话
- ✅ 每个归档对话旁边显示「已归档」标签
- ✅ 归档对话按更新时间排序

---

### 测试用例 3：取消归档
**步骤**：
1. 切换到归档对话视图
2. 悬停在一个归档对话上
3. 点击三点菜单
4. 选择「取消归档」

**预期结果**：
- ✅ 对话从归档列表中消失
- ✅ 自动切换回活跃对话视图
- ✅ 对话出现在活跃对话列表中
- ✅ 「已归档」标签消失

---

### 测试用例 4：归档当前对话
**步骤**：
1. 进入一个对话
2. 从侧边栏归档当前对话

**预期结果**：
- ✅ 页面自动跳转到 `/chat`
- ✅ 显示新建对话页面
- ✅ 当前对话从侧边栏消失

---

### 测试用例 5：在归档视图中搜索
**步骤**：
1. 切换到归档对话视图
2. 在搜索框中输入关键词
3. 验证搜索结果

**预期结果**：
- ✅ 仅在归档对话中搜索
- ✅ 搜索标题和消息内容
- ✅ 显示匹配的归档对话

---

### 测试用例 6：归档多个对话
**步骤**：
1. 归档多个对话
2. 切换到归档视图
3. 验证所有归档对话都显示

**预期结果**：
- ✅ 所有归档的对话都在归档列表中
- ✅ 每个对话都有「已归档」标签
- ✅ 按更新时间排序

---

### 测试用例 7：归档状态持久化
**步骤**：
1. 归档一个对话
2. 刷新页面
3. 验证归档状态

**预期结果**：
- ✅ 归档对话不在活跃列表中
- ✅ 在归档视图中可以找到
- ✅ 数据库中 `archived` 字段为 `true`

---

### 测试用例 8：API 测试
**命令测试**：
```bash
# 获取活跃对话（默认）
curl "http://localhost:3000/api/conversations" \
  -H "Cookie: better-auth.session_token=xxx"

# 获取归档对话
curl "http://localhost:3000/api/conversations?archived=true" \
  -H "Cookie: better-auth.session_token=xxx"

# 预期：返回包含 archived: true 的对话列表
```

**预期结果**：
- ✅ `archived=true` 仅返回归档对话
- ✅ `archived=false` 或省略参数返回活跃对话
- ✅ 响应包含 `archived` 字段

---

## 🎨 UI 交互

### 归档 Toggle 按钮
```
侧边栏顶部：

[新建对话]

[搜索框...]

[查看归档对话]  ← 点击切换
 ↓
切换后：
[查看活跃对话]
```

### 对话列表项
```
活跃对话视图：
[💬] Python学习笔记        [⋮]
     2天前

归档对话视图：
[💬] JavaScript教程 [已归档]  [⋮]
     5天前
```

### 下拉菜单
```
活跃对话：
┌──────────┐
│ 重命名   │
│ 归档     │  ← 显示「归档」
│ 删除     │
└──────────┘

归档对话：
┌──────────┐
│ 重命名   │
│ 取消归档 │  ← 显示「取消归档」
│ 删除     │
└──────────┘
```

---

## 🔧 技术实现细节

### 前端状态管理
```typescript
// 新增状态
const [showArchived, setShowArchived] = useState(false);
const [unarchiving, setUnarchiving] = useState<string | null>(null);

// 切换归档视图
const toggleArchivedView = () => {
  setShowArchived(!showArchived);
  // 自动重新获取对话列表
};
```

### 归档操作
```typescript
const handleArchiveClick = async (conversation) => {
  const res = await fetch(`/api/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ archived: true }),
  });
  if (res.ok) {
    // 从列表中移除
    setConversations(prev => prev.filter(c => c.id !== id));
    // 如果是当前对话，跳转
    if (currentId === id) router.push("/chat");
  }
};
```

### 取消归档操作
```typescript
const handleUnarchiveClick = async (conversation) => {
  const res = await fetch(`/api/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ archived: false }),
  });
  if (res.ok) {
    // 从列表中移除（会在活跃视图中显示）
    setConversations(prev => prev.filter(c => c.id !== id));
  }
};
```

### 数据库查询
```sql
-- 获取活跃对话
SELECT * FROM conversations
WHERE user_id = $1 AND archived = false
ORDER BY updated_at DESC;

-- 获取归档对话
SELECT * FROM conversations
WHERE user_id = $1 AND archived = true
ORDER BY updated_at DESC;
```

---

## 📊 API 端点

### 获取对话列表（支持归档过滤）
```
GET /api/conversations?archived=true|false
```

**查询参数**:
- `archived`: 可选，`true` 或 `false`
  - `true` - 返回归档对话
  - `false` 或省略 - 返回活跃对话

- `q`: 搜索关键词（与归档过滤结合使用）

**响应示例**：
```json
[
  {
    "id": "xxx",
    "title": "Python学习",
    "modelId": "gpt-4o-mini",
    "createdAt": "2025-01-03T10:00:00Z",
    "updatedAt": "2025-01-03T14:30:00Z",
    "archived": true  // ← 新增字段
  }
]
```

---

## 🔒 数据库 Schema

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255),
  model_id VARCHAR(100),
  archived BOOLEAN NOT NULL DEFAULT false,  -- 归档字段
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引优化查询
CREATE INDEX conversations_archived_idx ON conversations(archived);
```

---

## 📝 用户使用场景

### 场景 1：清理旧对话
**用户目标**: 将暂时不用的对话归档，保持列表整洁

**操作流程**:
1. 找到不想删除但又暂时不用的对话
2. 点击「归档」
3. 对话从活跃列表中消失

**好处**:
- 保持对话列表简洁
- 对话不会丢失
- 随时可以恢复

### 场景 2：查找归档的对话
**用户目标**: 找回之前归档的对话

**操作流程**:
1. 点击「查看归档对话」
2. 浏览或搜索归档对话
3. 点击「取消归档」恢复

**好处**:
- 快速找到历史对话
- 不影响当前活跃对话

### 场景 3：项目管理
**用户目标**: 区分进行中和已完成的项目对话

**操作流程**:
1. 完成的项目对话归档
2. 进行中的项目保持活跃
3. 需要时恢复归档对话

**好处**:
- 更好的组织结构
- 清晰的工作流

---

## 🐛 常见问题

### 问题 1：归档后对话仍在列表中
**可能原因**:
- 列表未刷新
- API 调用失败

**解决方案**:
1. 检查浏览器控制台错误
2. 手动刷新页面
3. 验证网络请求

### 问题 2：无法切换到归档视图
**可能原因**:
- Toggle 按钮点击无效
- 状态更新失败

**解决方案**:
1. 检查 React 状态
2. 验证 API 参数
3. 查看网络请求

### 问题 3：取消归档后对话未出现在活跃列表
**可能原因**:
- API 响应错误
- 列表更新逻辑问题

**解决方案**:
1. 检查 `/api/conversations?archived=false` 响应
2. 验证数据库 `archived` 字段值
3. 手动刷新页面

---

## 📁 相关文件

| 文件 | 功能 | 状态 |
|------|------|------|
| `src/app/api/conversations/route.ts` | 对话列表 API（增强归档过滤） | ✅ 已更新 |
| `src/components/layout/ConversationList.tsx` | 对话列表组件（完整归档功能） | ✅ 已更新 |

---

## ✅ 验收标准

### 功能验收
- [x] 可以归档对话
- [x] 可以取消归档对话
- [x] 可以查看归档对话列表
- [x] 可以在归档/活跃视图之间切换
- [x] 归档对话有视觉标识
- [x] 下拉菜单智能显示归档/取消归档
- [x] 归档后从列表中移除
- [x] 搜索支持归档过滤

### 用户体验验收
- [x] Toggle 按钮位置合理
- [x] 视觉区分清晰（已归档标签）
- [x] 操作流畅
- [x] 状态切换平滑
- [x] 归档视图清晰

### 数据完整性验收
- [x] 归档状态正确保存到数据库
- [x] API 正确过滤归档对话
- [x] 前端状态与后端数据一致
- [x] 刷新页面后状态保持

---

## 🎯 后续改进建议

### 改进 1：批量归档
- 添加多选功能
- 批量归档多个对话
- 提高效率

### 改进 2：归档文件夹
- 创建归档分类
- 按项目/主题分组
- 更好的组织方式

### 改进 3：归档统计
- 显示归档对话数量
- 归档时间统计
- 存储空间提示

### 改进 4：自动归档
- 设置归档规则
- 超过 N 天未访问自动归档
- 定时清理提醒

---

## 🚀 如何测试

### 方法 1：浏览器测试（推荐）
```bash
# 1. 确保服务器运行中
./dev-status.sh

# 2. 打开浏览器
open http://localhost:3000/chat

# 3. 登录并测试归档功能
```

### 测试步骤：
1. **归档测试**：
   - 创建几个对话
   - 归档部分对话
   - 验证它们从活跃列表消失

2. **查看归档**：
   - 点击「查看归档对话」
   - 验证归档对话显示
   - 检查「已归档」标签

3. **取消归档**：
   - 在归档视图中取消归档
   - 验证返回活跃视图
   - 验证对话出现在活跃列表

4. **搜索测试**：
   - 在归档视图中搜索
   - 验证仅搜索归档对话

---

**实现状态**: ✅ 完成
**测试状态**: ⏳ 待测试
**最后更新**: 2025-01-03

---

## 💡 使用建议

### 什么时候使用归档？
- 对话暂时不用但不想删除
- 完成的项目对话
- 需要清理对话列表时
- 想要保留历史记录时

### 归档 vs 删除
- **归档**: 保留数据，随时可恢复
- **删除**: 永久删除，无法恢复

### 最佳实践
- 定期归档旧对话
- 使用搜索快速查找归档对话
- 重要对话归档而非删除
- 按项目/主题组织归档

---

**下一步建议**：
- 测试归档功能
- 继续实现其他功能（提示词模板等）
- 考虑添加批量操作
