/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2026-01-03 14:28:46
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
/**
 * 应用配置
 * 从环境变量中读取配置
 */

/**
 * 需要通过代理访问的 API 域名列表
 * 这些域名会自动转换为代理路径 /api
 */
const PROXIED_DOMAINS = ['cat.beijixingxing.com'];

/**
 * 将外部 URL 转换为代理路径
 * 例如: https://cat.beijixingxing.com/v1 -> /api/v1
 * 如果不匹配代理域名列表，则返回原始 URL
 */
function convertToProxyUrl(url: string | undefined): string {
  if (!url) {
    return '/api/v1';
  }

  // 如果已经是相对路径，直接返回
  if (url.startsWith('/')) {
    return url;
  }

  // 尝试解析 URL
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // 检查是否需要通过代理
    if (PROXIED_DOMAINS.some(domain => hostname.includes(domain))) {
      // 提取路径部分，添加 /api 前缀
      const path = parsedUrl.pathname;
      const proxyPath = '/api' + path;
      console.log('[Config] URL 已转换为代理路径:', url, '->', proxyPath);
      return proxyPath;
    }

    // 不需要代理，返回原始 URL
    return url;
  } catch {
    // URL 解析失败，可能是相对路径
    console.warn('[Config] 无法解析 URL:', url);
    return url;
  }
}

/**
 * 将用户输入的 baseUrl 转换为可用的 API 路径
 * 用于设置面板保存时和服务配置更新时
 */
export function normalizeBaseUrl(inputUrl: string): string {
  return convertToProxyUrl(inputUrl);
}

/**
 * 获取原始 baseUrl（用于显示在设置面板等）
 */
export function getOriginalBaseUrl(): string {
  return import.meta.env.VITE_OPENAI_API_BASE || import.meta.env.VITE_OPENAI_BASE_URL || '';
}

export const config = {
  // OpenAI API配置
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    // 自动将外部 URL 转换为代理路径以避免 CORS 问题
    baseUrl: convertToProxyUrl(
      import.meta.env.VITE_OPENAI_API_BASE || import.meta.env.VITE_OPENAI_BASE_URL
    ),
    // 保存原始 URL（用于设置面板显示）
    originalBaseUrl: getOriginalBaseUrl(),
    model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo',
  },

  // NLP模式: local | api | hybrid
  nlpMode: (import.meta.env.VITE_NLP_MODE as 'local' | 'api' | 'hybrid') || 'local',

  // 置信度阈值
  confidenceThreshold: parseFloat(import.meta.env.VITE_CONFIDENCE_THRESHOLD || '0.7'),

  // 调试模式
  debug: import.meta.env.VITE_DEBUG === 'true',
};
