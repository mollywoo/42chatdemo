import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { modelConfigs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

// 删除模型配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("[DELETE] Starting delete request");

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log("[DELETE] Session user ID:", session?.user?.id);

  if (!session?.user?.id) {
    console.log("[DELETE] Unauthorized - no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: configId } = await params;
    console.log("[DELETE] Config ID to delete:", configId);
    console.log("[DELETE] User ID:", session.user.id);

    // 验证所有权
    const [existing] = await db
      .select()
      .from(modelConfigs)
      .where(
        and(
          eq(modelConfigs.id, configId),
          eq(modelConfigs.userId, session.user.id)
        )
      );

    console.log("[DELETE] Existing config found:", existing ? "Yes" : "No");

    if (!existing) {
      console.log("[DELETE] Config not found or not owned by user");
      return NextResponse.json({ error: "Model config not found" }, { status: 404 });
    }

    console.log("[DELETE] Deleting config from database...");
    await db.delete(modelConfigs).where(eq(modelConfigs.id, configId));

    console.log("[DELETE] Delete successful");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE] Error deleting model config:", error);
    return NextResponse.json({ error: "Failed to delete model config" }, { status: 500 });
  }
}
