/**
 * 清理空对话脚本
 * 删除没有任何消息的对话记录
 */

import { config } from 'dotenv';
// 加载环境变量
config({ path: '.env' });

import { db } from '../src/db';
import { conversations, messages } from '../src/db/schema';
import { sql } from 'drizzle-orm';

async function cleanupEmptyConversations() {
  console.log('🔍 正在查找空对话...');

  try {
    // 查找所有没有消息的对话
    const emptyConversations = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .leftJoin(messages, sql`${conversations.id} = ${messages.conversationId}`)
      .groupBy(conversations.id, conversations.title, conversations.createdAt)
      .having(sql`COUNT(${messages.id}) = 0`);

    if (emptyConversations.length === 0) {
      console.log('✅ 没有找到空对话！');
      return;
    }

    console.log(`📊 找到 ${emptyConversations.length} 个空对话：`);
    emptyConversations.forEach((conv, index) => {
      console.log(`  ${index + 1}. ID: ${conv.id}, 标题: ${conv.title}, 创建时间: ${conv.createdAt}`);
    });

    // 删除空对话
    const ids = emptyConversations.map(c => c.id);

    for (const id of ids) {
      await db.delete(conversations).where(sql`${conversations.id} = ${id}`);
    }

    console.log(`✅ 成功删除 ${emptyConversations.length} 个空对话！`);
  } catch (error) {
    console.error('❌ 清理失败:', error);
    throw error;
  }
}

// 执行清理
cleanupEmptyConversations()
  .then(() => {
    console.log('🎉 清理完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 清理过程中出错:', error);
    process.exit(1);
  });
