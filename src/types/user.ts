// 用户相关类型定义
import type { User } from "@/db/schema";

export interface UserProfile extends User {
  // 扩展字段（如需要）
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
}
