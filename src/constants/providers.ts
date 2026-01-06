// AI 提供商配置
import type { AIProvider, AvailableModel } from '@/types/model';

export const AI_PROVIDERS: Record<AIProvider, { name: string; baseUrl?: string }> = {
  openai: {
    name: 'OpenAI',
  },
  anthropic: {
    name: 'Anthropic',
  },
  google: {
    name: 'Google',
  },
};

export const AVAILABLE_MODELS: AvailableModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Most capable GPT-4 model',
    contextWindow: 128000,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'openai',
    description: 'Fast and affordable',
    contextWindow: 128000,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Latest GPT-4 Turbo',
    contextWindow: 128000,
  },
  // Anthropic Models
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Most intelligent Claude model',
    contextWindow: 200000,
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Fastest and most compact',
    contextWindow: 200000,
  },
  // Google Models
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Most capable Gemini model',
    contextWindow: 1000000,
  },
];

export function getModelsByProvider(provider: AIProvider): AvailableModel[] {
  return AVAILABLE_MODELS.filter((model) => model.provider === provider);
}

export function getModelById(modelId: string): AvailableModel | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === modelId);
}
