/**
 * API Key 加密模块
 * 使用 AES-256-GCM 加密算法保护敏感数据
 *
 * 安全说明：
 * - 使用 256 位密钥 (AES-256)
 * - GCM 模式提供认证加密 (AEAD)
 * - 每次加密使用随机 IV，防止重放攻击
 * - 加密结果格式: iv:authTag:ciphertext (Base64 编码)
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// 加密算法配置
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM 推荐 12 字节 IV
const AUTH_TAG_LENGTH = 16; // GCM 认证标签长度
const KEY_LENGTH = 32; // 256 位密钥

/**
 * 从环境变量获取加密密钥
 * 使用 scrypt 派生函数从 BETTER_AUTH_SECRET 派生加密密钥
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET environment variable is required for encryption');
  }

  // 使用 scrypt 从 secret 派生 256 位密钥
  // salt 使用固定值确保同一 secret 派生相同密钥
  const salt = 'api-key-encryption-salt-v1';
  return scryptSync(secret, salt, KEY_LENGTH);
}

/**
 * 加密 API Key
 * @param plaintext - 明文 API Key
 * @returns 加密后的字符串 (格式: iv:authTag:ciphertext)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // 组合格式: iv:authTag:ciphertext (都是 Base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * 解密 API Key
 * @param encryptedData - 加密的字符串
 * @returns 解密后的明文 API Key
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty string');
  }

  // 检查是否是加密格式 (包含两个冒号分隔符)
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    // 可能是未加密的旧数据，直接返回
    // 这支持向后兼容，但会在日志中警告
    console.warn('[Encryption] Data appears to be unencrypted (legacy format)');
    return encryptedData;
  }

  const [ivBase64, authTagBase64, ciphertext] = parts;

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // 解密失败，可能是旧数据或密钥变更
    console.error('[Encryption] Decryption failed:', error);
    throw new Error('Failed to decrypt API key. The key may be corrupted or the encryption secret may have changed.');
  }
}

/**
 * 检查数据是否已加密
 * @param data - 待检查的数据
 * @returns 是否为加密格式
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;

  const parts = data.split(':');
  if (parts.length !== 3) return false;

  // 验证各部分是否为有效的 Base64
  try {
    const [ivBase64, authTagBase64] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    // 验证长度
    return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

/**
 * 安全地获取 API Key（自动处理加密/未加密数据）
 * @param storedValue - 数据库中存储的值
 * @returns 解密后的 API Key
 */
export function getApiKey(storedValue: string): string {
  if (!storedValue) {
    throw new Error('No API key provided');
  }

  if (isEncrypted(storedValue)) {
    return decrypt(storedValue);
  }

  // 未加密数据（旧格式），直接返回但警告
  console.warn('[Encryption] Using unencrypted API key - please run migration');
  return storedValue;
}

/**
 * 掩码显示 API Key（用于 UI 展示）
 * @param apiKey - 完整的 API Key
 * @returns 掩码后的显示字符串
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '********';
  }

  // 显示前4位和后4位
  const prefix = apiKey.slice(0, 4);
  const suffix = apiKey.slice(-4);
  const masked = '*'.repeat(Math.min(apiKey.length - 8, 20));

  return `${prefix}${masked}${suffix}`;
}
