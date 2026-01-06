// 对话相关类型定义
import type { Message, Conversation } from '@/db/schema';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage extends Message {
  // 扩展字段（如需要）
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  messageCount?: number;
}

export interface CreateConversationInput {
  title?: string;
  modelId?: string;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
  modelId?: string;
}
