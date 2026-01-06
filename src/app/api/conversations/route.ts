import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { checkApiRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

// 获取对话列表（支持搜索）
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const archivedParam = searchParams.get("archived");
    const showArchived = archivedParam === "true";

    // 基础查询条件：用户自己的对话
    const whereConditions = [eq(conversations.userId, session.user.id)];

    // 如果要查看归档对话，添加归档条件
    if (showArchived) {
      whereConditions.push(eq(conversations.archived, true));
    } else {
      whereConditions.push(eq(conversations.archived, false));
    }

    // 基础查询
    let userConversations = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        modelId: conversations.modelId,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        archived: conversations.archived,
      })
      .from(conversations)
      .where(and(...whereConditions))
      .orderBy(desc(conversations.updatedAt));

    // 如果有搜索关键词，过滤结果
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();

      // 获取消息内容用于搜索
      const conversationIds = userConversations.map((c) => c.id);

      // 获取包含搜索词的消息所属的对话ID
      const matchingMessages = await db
        .select({
          conversationId: messages.conversationId,
        })
        .from(messages)
        .where(
          and(
            inArray(messages.conversationId, conversationIds),
            sql`LOWER(${messages.content}) LIKE ${`%${searchTerm}%`}`,
          ),
        );

      const messageConversationIds = new Set(
        matchingMessages.map((m) => m.conversationId),
      );

      // 过滤：标题匹配 OR 消息内容匹配
      userConversations = userConversations.filter((c) => {
        const titleMatch = c.title?.toLowerCase().includes(searchTerm);
        const messageMatch = messageConversationIds.has(c.id);
        return titleMatch || messageMatch;
      });
    }

    return NextResponse.json(userConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

// 创建新对话
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 速率限制检查
  const rateLimitResult = checkApiRateLimit(session.user.id);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const { title, modelId } = body;

    const newConversation = await db
      .insert(conversations)
      .values({
        userId: session.user.id,
        title: title || "新对话",
        modelId: modelId || "gpt-4o-mini",
      })
      .returning();

    return NextResponse.json(newConversation[0], { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 },
    );
  }
}
