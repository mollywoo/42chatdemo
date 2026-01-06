// 应用配置常量

export const APP_CONFIG = {
  name: '活水智聊',
  nameEn: '42chat',
  description: '一个可以在多个 AI 模型间无缝对话的环境',
  version: '1.0.0',
  author: '活水AI实验室',
} as const;

export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',

  // Main app routes
  HOME: '/',
  CHAT: '/chat',
  SETTINGS: '/settings',
  SETTINGS_MODELS: '/settings/models',

  // API routes
  API_AUTH: '/api/auth',
  API_CHAT: '/api/chat',
  API_CONVERSATIONS: '/api/conversations',
  API_MODELS: '/api/models',
  API_EXPORT: '/api/export',
} as const;

export const SESSION_CONFIG = {
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // 1 day
} as const;

export const RATE_LIMIT = {
  chatRequests: {
    max: 50,
    windowMs: 60 * 1000, // 1 minute
  },
  apiRequests: {
    max: 100,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

export const UI_CONFIG = {
  maxConversationsInSidebar: 50,
  messagesPerPage: 50,
  streamingDelay: 20, // ms
} as const;
