import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { modelConfigs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getApiKey } from "@/lib/encryption";
import {
  checkModelTestRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limit";

// 测试模型连接
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 速率限制检查（模型测试每分钟最多 5 次）
  const rateLimitResult = checkModelTestRateLimit(session.user.id);
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  const { id } = await params;

  try {
    // 获取模型配置
    const [config] = await db
      .select()
      .from(modelConfigs)
      .where(
        and(eq(modelConfigs.id, id), eq(modelConfigs.userId, session.user.id)),
      );

    if (!config) {
      return NextResponse.json(
        { error: "Model config not found" },
        { status: 404 },
      );
    }

    // 解密 API Key
    let decryptedApiKey: string;
    try {
      decryptedApiKey = getApiKey(config.apiKey);
    } catch (error) {
      console.error("Failed to decrypt API key:", error);
      return NextResponse.json(
        { success: false, error: "无法解密 API 密钥，请重新配置" },
        { status: 400 },
      );
    }

    // 根据提供商测试连接
    const testResult = await testConnection(
      config.provider,
      decryptedApiKey,
      config.modelId,
    );

    if (testResult.success) {
      return NextResponse.json({ success: true, message: "连接成功" });
    } else {
      return NextResponse.json(
        { success: false, error: testResult.error },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error testing model connection:", error);
    return NextResponse.json(
      { success: false, error: "测试连接时发生错误" },
      { status: 500 },
    );
  }
}

async function testConnection(
  provider: string,
  apiKey: string,
  modelId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (provider) {
      case "openai":
        return await testOpenAI(apiKey);
      case "anthropic":
        return await testAnthropic(apiKey);
      case "openrouter":
        return await testOpenRouter(apiKey, modelId);
      case "google":
        return await testGoogle(apiKey);
      default:
        // 默认使用 OpenAI 兼容接口
        return await testOpenAI(apiKey);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

async function testOpenAI(
  apiKey: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { success: true };
    }

    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      return { success: false, error: "API 密钥无效" };
    }
    if (response.status === 429) {
      return { success: false, error: "配额已用尽" };
    }
    return { success: false, error: error.error?.message || "连接失败" };
  } catch {
    return { success: false, error: "网络错误，无法连接到 OpenAI" };
  }
}

async function testAnthropic(
  apiKey: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Anthropic 没有简单的 models 列表 API，使用发送空消息来测试
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1,
        messages: [{ role: "user", content: "test" }],
      }),
    });

    // 401 表示密钥无效
    if (response.status === 401) {
      return { success: false, error: "API 密钥无效" };
    }
    // 429 表示配额问题
    if (response.status === 429) {
      return { success: false, error: "配额已用尽" };
    }
    // 其他状态（包括成功或余额不足但密钥有效）都算连接成功
    return { success: true };
  } catch {
    return { success: false, error: "网络错误，无法连接到 Anthropic" };
  }
}

async function testOpenRouter(
  apiKey: string,
  modelId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { success: true };
    }

    if (response.status === 401) {
      return { success: false, error: "API 密钥无效" };
    }
    if (response.status === 402) {
      return { success: false, error: "余额不足" };
    }
    return { success: false, error: "连接失败" };
  } catch {
    return { success: false, error: "网络错误，无法连接到 OpenRouter" };
  }
}

async function testGoogle(
  apiKey: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );

    if (response.ok) {
      return { success: true };
    }

    if (response.status === 400 || response.status === 403) {
      return { success: false, error: "API 密钥无效" };
    }
    return { success: false, error: "连接失败" };
  } catch {
    return { success: false, error: "网络错误，无法连接到 Google AI" };
  }
}
