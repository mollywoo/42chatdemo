# 浏览器开发者工具使用指南

## 🎯 如何打开开发者工具

### 方法 1: 快捷键（推荐）
- **Mac**: `Cmd + Option + I`
- **Windows/Linux**: `Ctrl + Shift + I` 或 `F12`

### 方法 2: 右键菜单
1. 在页面任意位置点击右键
2. 选择"检查"或"Inspect"

## 📊 查看控制台日志

### Console 标签（控制台）
这是最重要查看错误的地方！

**打开方式：**
1. 打开开发者工具后，点击顶部的 **"Console"** 标签
2. 或者直接按 `Cmd/Ctrl + Shift + J`（Mac用Option）

**你应该看到的内容：**

#### ✅ 正常情况（成功）
```
[DEBUG] Received chunk: 15 chars
[DEBUG] Received chunk: 23 chars
[DEBUG] Received chunk: 18 chars
[DEBUG] Stream finished, total length: 56 chars
```

#### ❌ 异常情况（错误）
```
[ERROR] Failed to read stream: TypeError: ...
Error sending message: ...
```

## 🔍 查看 Network 请求

### Network 标签（网络）
查看 API 请求和响应的详细信息

**步骤：**
1. 点击 **"Network"** 标签
2. 勾选 **"Preserve log"**（保留日志，防止页面刷新后丢失）
3. 在对话框中发送消息
4. 在列表中找到 **`/api/chat`** 请求
5. 点击该请求，查看：
   - **Headers**: 请求头和响应头
   - **Preview**: 预览响应内容
   - **Response**: 完整响应内容

**重点查看：**
- **Status Code**: 应该是 `200`（成功），`500` 表示服务器错误
- **Response**: 查看是否有错误信息

## 📸 如何截图保存

### Mac
1. `Cmd + Shift + 4` - 选择区域截图
2. `Cmd + Shift + 4` 然后 `空格` - 截图当前窗口
3. 截图保存在桌面上

### Windows
1. `Win + Shift + S` - 打开截图工具
2. 选择区域截图
3. 截图会复制到剪贴板，可以粘贴（Ctrl+V）

### Windows 全屏截图
1. `PrtScn` (Print Screen) - 截取整个屏幕到剪贴板
2. `Win + PrtScn` - 截图并保存到 `Pictures/Screenshots` 文件夹

## 🎨 过滤控制台日志

### 只查看特定类型的日志

在 Console 顶部的过滤器中输入：
```
debug      # 只显示调试信息
error      # 只显示错误
warn       # 只显示警告
```

### 查看特定日志
```
[DEBUG]    # 搜索所有调试日志
[ERROR]    # 搜索所有错误日志
Received   # 搜索包含"Received"的日志
```

## 🐛 调试技巧

### 1. 清除控制台
- 点击控制台左上角的清除按钮 🚫
- 或按 `Cmd/Ctrl + L`

### 2. 保存日志
右键点击控制台 → **"Save as..."** 保存为文件

### 3. 复制日志内容
1. 选中要复制的文本
2. 右键 → **"Copy"**
3. 或直接选中后按 `Cmd/Ctrl + C`

### 4. 查看对象详情
点击日志中的对象或数组，可以展开查看详细信息

## 📋 测试检查清单

打开开发者工具后，按以下步骤测试：

### 测试步骤：

1. **打开控制台**（Console 标签）
   - [ ] 清除旧日志（点击清除按钮）
   - [ ] 确认过滤器是 `All levels`

2. **发送第一条消息**
   - [ ] 在对话框输入消息
   - [ ] 观察控制台输出
   - [ ] 截图保存或复制日志

3. **发送第二条消息**
   - [ ] 继续输入第二条消息
   - [ ] 观察控制台输出
   - [ ] 截图保存或复制日志

4. **查看 Network 请求**
   - [ ] 切换到 Network 标签
   - [ ] 找到 `/api/chat` 请求
   - [ ] 查看响应状态和内容
   - [ ] 截图保存

## 💡 常见问题

### Q: 控制台是空的？
A: 确保你已经发送了消息，如果没有触发任何操作，控制台可能是空的

### Q: 看不到 [DEBUG] 日志？
A: 检查：
1. 是否刷新了页面（确保加载了最新代码）
2. 是否在 Console 标签（不是其他标签）
3. 过滤器是否设置了隐藏 debug 日志

### Q: Network 标签没有 /api/chat 请求？
A: 说明请求根本没有发送，可能是前端有错误，查看 Console 是否有 JavaScript 错误

## 📤 如何发送给我

### 方式 1: 直接复制文本
1. 选中控制台中的日志
2. 复制（Cmd/Ctrl + C）
3. 粘贴到聊天中

### 方式 2: 截图
1. 截取控制台和 Network 标签
2. 发送图片给我

### 方式 3: 保存日志文件
1. 右键控制台 → Save as...
2. 保存后文件名改为 `console-log.txt`
3. 发送文件内容

## 🔧 实时监控

### 保持控制台打开
在测试时，保持开发者工具打开，这样可以看到实时的日志输出

### 自动滚动
确保"Auto-scroll"选项已勾选（控制台右上角的图标），这样新日志会自动滚动到可见区域

---

## 📝 快速命令参考

| 操作 | Mac | Windows/Linux |
|------|-----|---------------|
| 打开开发者工具 | `Cmd + Option + I` | `F12` 或 `Ctrl + Shift + I` |
| 切换到控制台 | `Cmd + Option + J` | `Ctrl + Shift + J` |
| 清除控制台 | `Cmd + K` | `Ctrl + L` |
| 切换到 Network | `Cmd + Option + I` 然后点 Network | `F12` 然后点 Network |

---

准备好了吗？打开浏览器，按 `F12`（或 `Cmd+Option+I`），然后开始测试！🚀
