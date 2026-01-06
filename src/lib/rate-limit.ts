/**
 * 速率限制模块
 *
 * 使用内存存储实现简单的滑动窗口速率限制。
 * 适用于单实例部署，生产环境可扩展为 Redis 实现。
 *
 * 约束：C6 - API 调用限流
 */

import { RATE_LIMIT } from '@/constants/config';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 内存存储（适用于单实例，生产可替换为 Redis）
const rateLimitStore = new Map<string, RateLimitEntry>();

// 定期清理过期条目（每分钟）
const CLEANUP_INTERVAL = 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  // 允许进程正常退出
  cleanupTimer.unref();
}

startCleanup();

export interface RateLimitConfig {
  /** 时间窗口内最大请求数 */
  max: number;
  /** 时间窗口长度（毫秒） */
  windowMs: number;
}

export interface RateLimitResult {
  /** 是否允许请求 */
  success: boolean;
  /** 剩余请求数 */
  remaining: number;
  /** 重置时间戳（毫秒） */
  resetTime: number;
  /** 当前请求数 */
  current: number;
  /** 最大请求数 */
  limit: number;
}

/**
 * 检查速率限制
 * @param identifier - 唯一标识符（如 userId 或 IP）
 * @param config - 速率限制配置
 * @returns 速率限制检查结果
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // 如果条目不存在或已过期，创建新条目
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  // 增加计数
  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, config.max - entry.count);
  const success = entry.count <= config.max;

  return {
    success,
    remaining,
    resetTime: entry.resetTime,
    current: entry.count,
    limit: config.max,
  };
}

/**
 * 获取速率限制响应头
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };
}

/**
 * 创建速率限制错误响应
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: '请求过于频繁，请稍后再试',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        ...getRateLimitHeaders(result),
      },
    }
  );
}

// ============================================
// 预配置的速率限制器
// ============================================

/**
 * 聊天 API 速率限制
 * 每分钟最多 50 次请求
 */
export function checkChatRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(`chat:${userId}`, RATE_LIMIT.chatRequests);
}

/**
 * 通用 API 速率限制
 * 每分钟最多 100 次请求
 */
export function checkApiRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(`api:${userId}`, RATE_LIMIT.apiRequests);
}

/**
 * 认证 API 速率限制（更严格）
 * 每分钟最多 10 次请求
 */
export function checkAuthRateLimit(identifier: string): RateLimitResult {
  return checkRateLimit(`auth:${identifier}`, {
    max: 10,
    windowMs: 60 * 1000,
  });
}

/**
 * 模型测试 API 速率限制
 * 每分钟最多 5 次请求
 */
export function checkModelTestRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(`model-test:${userId}`, {
    max: 5,
    windowMs: 60 * 1000,
  });
}
