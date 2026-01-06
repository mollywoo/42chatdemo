import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { conversations, messages, modelConfigs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { getApiKey } from "@/lib/encryption";
import {
  checkChatRateLimit,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rate-limit";

// Get the model function for a provider
// AI SDK v6 defaults to "responses" API, but OpenRouter only supports "chat completions" API
// We must use .chat() method for OpenRouter to work correctly with conversation history
function getModel(provider: string, modelId: string, apiKey: string) {
  switch (provider) {
    case "openai":
      // For OpenAI, use the default (responses API) as they support it
      return createOpenAI({ apiKey })(modelId);
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "openrouter": {
      // OpenRouter requires chat completions API, not responses API
      // Cast modelId to bypass TypeScript's model ID validation
      const openrouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        headers: {
          "HTTP-Referer": "https://42chat.local", // Required by OpenRouter
          "X-Title": "42Chat", // Optional, shows in OpenRouter dashboard
        },
      });
      // Use .chat() to force chat completions format instead of responses API
      return openrouter.chat(modelId as Parameters<typeof openrouter.chat>[0]);
    }
    case "google":
      // Google AI also needs chat completions format
      return createOpenAI({
        baseURL: "https://generativelanguage.googleapis.com/v1beta",
        apiKey,
      })(modelId);
    default:
      // Default to OpenAI
      return createOpenAI({ apiKey })(modelId);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 速率限制检查
  const rateLimitResult = checkChatRateLimit(session.user.id);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json();
    const { conversationId, messages: chatMessages } = body;

    if (!conversationId) {
      return new Response("Missing conversationId", { status: 400 });
    }

    // Get the latest user message from the request
    const userMessage = chatMessages?.[chatMessages.length - 1]?.content;
    if (!userMessage) {
      return new Response("Missing message content", { status: 400 });
    }

    // Verify conversation ownership and get model info
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, session.user.id),
        ),
      );

    if (!conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    // Get the modelId from conversation or use default
    const modelId = conversation.modelId || "gpt-4o-mini";

    // Get conversation history (before adding new message)
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    console.log(`[DEBUG] Conversation ${conversationId} has ${history.length} messages in history`);

    // Log each history message for debugging
    history.forEach((msg, idx) => {
      console.log(`[DEBUG] History[${idx}]: role=${msg.role}, contentType=${typeof msg.content}, contentPreview=${String(msg.content).substring(0, 100)}`);
    });

    // Add user message to history
    // Ensure all content is string (handle corrupted data)
    const historyWithUser = [
      ...history.map((msg) => {
        let content: string;

        // Handle different content types
        if (typeof msg.content === "string") {
          content = msg.content;
        } else if (Array.isArray(msg.content)) {
          // If content is an array, try to extract text or stringify
          console.warn(
            `[WARN] Message ${msg.id} has array content, attempting to extract text`,
          );
          // Try to extract text from array elements
          content = (msg.content as any[])
            .map((item: any) => {
              if (typeof item === "string") return item;
              if (item?.text) return item.text;
              if (item?.content) return item.content;
              return JSON.stringify(item);
            })
            .join("\n");
        } else {
          // For objects or other types, stringify them
          console.warn(
            `[WARN] Message ${msg.id} has ${typeof msg.content} content, stringifying`,
          );
          content = JSON.stringify(msg.content);
        }

        return {
          role: msg.role as "user" | "assistant" | "system",
          content,
        };
      }),
      {
        role: "user" as const,
        content: userMessage,
      },
    ];

    // Final validation: ensure ALL messages have string content
    const validatedMessages = historyWithUser.map((msg, index) => {
      if (typeof msg.content !== "string") {
        console.error(`[ERROR] Message ${index} still has non-string content:`, typeof msg.content);
        return {
          ...msg,
          content: JSON.stringify(msg.content),
        };
      }
      return msg;
    });

    console.log(`[DEBUG] Sending ${validatedMessages.length} messages to AI model`);

    // Save user message to database
    await db.insert(messages).values({
      conversationId,
      role: "user",
      content: userMessage,
    });

    // Update conversation title (use first message)
    if (history.length === 1) {
      const title =
        userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
      await db
        .update(conversations)
        .set({ title, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    } else {
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }

    // Get API key from user config - search by modelId
    const [userConfig] = await db
      .select()
      .from(modelConfigs)
      .where(
        and(
          eq(modelConfigs.userId, session.user.id),
          eq(modelConfigs.modelId, modelId),
          eq(modelConfigs.enabled, true),
        ),
      )
      .limit(1);

    // 解密用户配置的 API Key，或使用环境变量
    let apiKey: string;
    let provider: string;

    if (userConfig?.apiKey) {
      try {
        apiKey = getApiKey(userConfig.apiKey);
        provider = userConfig.provider;
      } catch (error) {
        console.error("Failed to decrypt user API key:", error);
        return new Response(
          JSON.stringify({
            error: "无法解密 API 密钥，请在设置中重新配置。",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    } else {
      // 使用环境变量的 API Key（OpenRouter）
      apiKey = process.env.OPENAI_API_KEY || "";
      provider = "openrouter";
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "No API key configured. Please add your API key in settings.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Use Vercel AI SDK for streaming
    console.log(`[DEBUG] Starting streamText with model ${modelId}, provider ${provider}`);
    console.log(`[DEBUG] Messages being sent:`, JSON.stringify(validatedMessages.map(m => ({ role: m.role, contentLength: m.content?.length })), null, 2));

    try {
      const result = streamText({
        model: getModel(provider, modelId, apiKey),
        messages: validatedMessages,
        async onFinish({ text, finishReason, usage }) {
          // Store the complete message after streaming finishes
          console.log(`[DEBUG] onFinish triggered - reason: ${finishReason}, text length: ${text?.length || 0}, usage: ${JSON.stringify(usage)}`);
          try {
            if (text) {
              // Ensure text is a string (convert if needed)
              const contentString =
                typeof text === "string" ? text : JSON.stringify(text);

              await db.insert(messages).values({
                conversationId,
                role: "assistant",
                content: contentString,
                modelId,
              });

              console.log(
                `[DEBUG] Successfully saved assistant message (${contentString.length} chars) to conversation ${conversationId}`,
              );
            } else {
              console.warn(`[DEBUG] onFinish called but text is empty! Finish reason: ${finishReason}`);
            }
          } catch (err) {
            console.error("Failed to store assistant message:", err);
          }
        },
      });

      console.log(`[DEBUG] streamText returned result, calling toTextStreamResponse()...`);

      // Return text stream response for client
      // Note: We use toTextStreamResponse for plain text streaming
      const response = result.toTextStreamResponse();
      console.log(`[DEBUG] Response created, type: ${response.constructor.name}`);
      return response;
    } catch (streamError) {
      console.error("[ERROR] streamText failed:", streamError);
      return new Response(JSON.stringify({ error: `AI 调用失败: ${String(streamError)}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
