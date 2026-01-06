import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

/**
 * 导出对话 API
 * GET /api/export/:id?format=md&desensitize=true
 *
 * 参数：
 * - format: 导出格式（目前只支持 md/markdown）
 * - desensitize: 是否脱敏（true/false）
 */

// 脱敏函数：隐藏敏感信息
function desensitizeContent(content: string): string {
  return content
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[邮箱已隐藏]")
    .replace(/\b\d{11}\b/g, "[手机号已隐藏]")
    .replace(/\b\d{3,4}-\d{7,8}\b/g, "[电话已隐藏]")
    .replace(/\b\d{18}\b/g, "[身份证已隐藏]")
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "[API密钥已隐藏]")
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/g, "[Token已隐藏]");
}

// 格式化为 Markdown
function formatAsMarkdown(conversation: any, messageList: any[], desensitize: boolean): string {
  const lines: string[] = [];

  // 标题
  lines.push(`# ${conversation.title || "未命名对话"}`);
  lines.push("");
  lines.push(`**导出时间**: ${new Date().toLocaleString("zh-CN")}`);
  lines.push(`**创建时间**: ${new Date(conversation.createdAt).toLocaleString("zh-CN")}`);
  lines.push(`**最后更新**: ${new Date(conversation.updatedAt).toLocaleString("zh-CN")}`);
  if (conversation.modelId) {
    lines.push(`**模型**: ${conversation.modelId}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // 消息列表
  messageList.forEach((msg, index) => {
    const role = msg.role === "user" ? "用户" : "AI";
    lines.push(`## ${role} (${new Date(msg.createdAt).toLocaleString("zh-CN")})`);
    lines.push("");

    const content = desensitize ? desensitizeContent(msg.content) : msg.content;
    lines.push(content);
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "md";
    const desensitize = searchParams.get("desensitize") === "true";

    // 验证格式
    if (format !== "md" && format !== "markdown") {
      return NextResponse.json({ error: "Unsupported format. Only 'md' is supported." }, { status: 400 });
    }

    // 获取对话信息
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, session.user.id)
        )
      );

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // 获取消息列表
    const messageList = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    // 格式化为 Markdown
    const markdown = formatAsMarkdown(conversation, messageList, desensitize);

    // 生成文件名
    const filename = `${conversation.title || "对话"}_${conversationId.slice(0, 8)}.md`;

    // 返回文件下载
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting conversation:", error);
    return NextResponse.json({ error: "Failed to export conversation" }, { status: 500 });
  }
}
