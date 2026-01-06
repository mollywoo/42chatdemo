// AI Provider Configuration
// 支持多个 AI 提供商：OpenAI, Anthropic, Google
// 参考 sys.spec.md 中的架构设计

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

export type AIProvider = "openai" | "anthropic" | "google" | "openrouter";

export interface AIModelConfig {
  provider: AIProvider;
  modelId: string;
  apiKey?: string;
}

/**
 * 获取 AI 模型实例
 * @param config - 模型配置
 * @returns AI SDK 模型实例
 */
export function getAIModel(config: AIModelConfig) {
  const { provider, modelId, apiKey } = config;

  switch (provider) {
    case "openai":
      return createOpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY,
      })(modelId);

    case "anthropic":
      return createAnthropic({
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
      })(modelId);

    case "google":
      // Google AI 使用 OpenAI 兼容接口
      return createOpenAI({
        baseURL: "https://generativelanguage.googleapis.com/v1beta",
        apiKey: apiKey || process.env.GOOGLE_API_KEY,
      })(modelId);

    case "openrouter":
      // OpenRouter 使用 OpenAI 兼容接口
      return createOpenAI({
        apiKey: apiKey || process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
      })(modelId);

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * 默认模型配置
 */
export const DEFAULT_MODEL: AIModelConfig = {
  provider: "openai",
  modelId: "gpt-4o-mini",
};
