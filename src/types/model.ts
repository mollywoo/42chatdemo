// 模型相关类型定义
import type { ModelConfig } from "@/db/schema";

export type AIProvider = "openai" | "anthropic" | "google";

export interface ModelConfigWithoutKey extends Omit<ModelConfig, "apiKey"> {
  apiKeyPreview?: string; // 脱敏后的密钥预览
}

export interface CreateModelConfigInput {
  provider: AIProvider;
  modelId: string;
  name?: string;
  apiKey: string;
}

export interface TestModelConnectionInput {
  provider: AIProvider;
  modelId: string;
  apiKey: string;
}

export interface AvailableModel {
  id: string;
  name: string;
  provider: AIProvider;
  description?: string;
  contextWindow?: number;
}
