import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

// 创建 Neon SQL 客户端
const sql = neon(process.env.DATABASE_URL!);

// 导出 Drizzle 实例
export const db = drizzle(sql);
