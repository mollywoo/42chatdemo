import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// 显式加载 .env 文件（关键！）
config({ path: '.env' });

export default defineConfig({
  schema: './src/db/schema.ts',      // Schema 文件位置
  out: './src/db/migrations',         // 迁移文件输出目录
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
