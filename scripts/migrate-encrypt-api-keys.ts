/**
 * API Key 加密迁移脚本
 *
 * 此脚本将数据库中现有的明文 API Key 迁移为加密存储格式。
 *
 * 使用方法：
 *   npx tsx scripts/migrate-encrypt-api-keys.ts
 *
 * 注意事项：
 * 1. 运行前请确保 .env 文件中的 BETTER_AUTH_SECRET 已正确配置
 * 2. 建议在运行前备份数据库
 * 3. 此脚本是幂等的，重复运行不会重复加密已加密的数据
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { modelConfigs } from '../src/db/schema';
import { eq } from 'drizzle-orm';

// 加载环境变量
config();

// 直接实现加密函数（避免路径问题）
import { createCipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET environment variable is required');
  }
  const salt = 'api-key-encryption-salt-v1';
  return scryptSync(secret, salt, KEY_LENGTH);
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

function isEncrypted(data: string): boolean {
  if (!data) return false;
  const parts = data.split(':');
  if (parts.length !== 3) return false;
  try {
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    return iv.length === IV_LENGTH && authTag.length === 16;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔐 API Key 加密迁移脚本\n');

  // 验证环境变量
  if (!process.env.DATABASE_URL) {
    console.error('❌ 错误: DATABASE_URL 环境变量未设置');
    process.exit(1);
  }

  if (!process.env.BETTER_AUTH_SECRET) {
    console.error('❌ 错误: BETTER_AUTH_SECRET 环境变量未设置');
    process.exit(1);
  }

  console.log('📦 连接数据库...');
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    // 获取所有模型配置
    console.log('📋 获取所有模型配置...');
    const configs = await db.select().from(modelConfigs);

    console.log(`   找到 ${configs.length} 条配置记录\n`);

    let encrypted = 0;
    let skipped = 0;
    let failed = 0;

    for (const config of configs) {
      const apiKey = config.apiKey;

      // 检查是否已加密
      if (isEncrypted(apiKey)) {
        console.log(`⏭️  跳过 [${config.id}] - 已加密`);
        skipped++;
        continue;
      }

      // 加密 API Key
      try {
        const encryptedKey = encrypt(apiKey);

        await db
          .update(modelConfigs)
          .set({ apiKey: encryptedKey })
          .where(eq(modelConfigs.id, config.id));

        console.log(`✅ 加密 [${config.id}] ${config.provider}/${config.modelId}`);
        encrypted++;
      } catch (error) {
        console.error(`❌ 失败 [${config.id}]:`, error);
        failed++;
      }
    }

    console.log('\n📊 迁移完成统计:');
    console.log(`   ✅ 已加密: ${encrypted}`);
    console.log(`   ⏭️  已跳过: ${skipped}`);
    console.log(`   ❌ 失败: ${failed}`);
    console.log(`   📋 总计: ${configs.length}`);

    if (failed > 0) {
      console.log('\n⚠️  有部分记录加密失败，请检查日志');
      process.exit(1);
    }

    console.log('\n🎉 迁移成功完成！');
  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    process.exit(1);
  }
}

main();
