import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { modelConfigs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { encrypt, maskApiKey } from "@/lib/encryption";
import { checkApiRateLimit, createRateLimitResponse } from "@/lib/rate-limit";

// 获取用户的模型配置列表
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const configs = await db
      .select({
        id: modelConfigs.id,
        provider: modelConfigs.provider,
        modelId: modelConfigs.modelId,
        name: modelConfigs.name,
        apiKey: modelConfigs.apiKey, // 用于生成掩码
        enabled: modelConfigs.enabled,
        createdAt: modelConfigs.createdAt,
      })
      .from(modelConfigs)
      .where(eq(modelConfigs.userId, session.user.id))
      .orderBy(desc(modelConfigs.createdAt));

    // 返回掩码后的 API Key（不返回真实值）
    const maskedConfigs = configs.map((config) => ({
      ...config,
      apiKey: maskApiKey(config.apiKey || ""),
      hasApiKey: !!config.apiKey,
    }));

    return NextResponse.json(maskedConfigs);
  } catch (error) {
    console.error("Error fetching model configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch model configs" },
      { status: 500 },
    );
  }
}

// 创建新的模型配置
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
    const { provider, modelId, name, apiKey } = body;

    if (!provider || !modelId || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields: provider, modelId, apiKey" },
        { status: 400 },
      );
    }

    // 加密 API Key 后存储
    const encryptedApiKey = encrypt(apiKey);

    const newConfig = await db
      .insert(modelConfigs)
      .values({
        userId: session.user.id,
        provider,
        modelId,
        name: name || `${provider} - ${modelId}`,
        apiKey: encryptedApiKey,
        enabled: true,
      })
      .returning({
        id: modelConfigs.id,
        provider: modelConfigs.provider,
        modelId: modelConfigs.modelId,
        name: modelConfigs.name,
        enabled: modelConfigs.enabled,
        createdAt: modelConfigs.createdAt,
      });

    // 返回时使用掩码 API Key
    return NextResponse.json(
      {
        ...newConfig[0],
        apiKey: maskApiKey(apiKey),
        hasApiKey: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating model config:", error);
    return NextResponse.json(
      { error: "Failed to create model config" },
      { status: 500 },
    );
  }
}
