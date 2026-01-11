/**
 * 模型列表服务
 * 从 OpenAI 兼容 API 获取可用模型列表并缓存
 */

import { normalizeBaseUrl } from '@/config';

export interface ModelInfo {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

export interface ModelOption {
  value: string;
  label: string;
}

export interface CachedModels {
  models: ModelOption[];
  timestamp: number;
  baseUrl: string;
}

// 默认模型列表（作为后备）
const DEFAULT_MODELS: ModelOption[] = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
];

const CACHE_KEY = 'excel-addin-models-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时
const REQUEST_TIMEOUT = 10000; // 10秒超时

/**
 * 模型服务类
 */
export class ModelService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = '', apiKey: string = '') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * 更新配置（自动转换外部 URL 为代理路径）
   */
  updateConfig(baseUrl: string, apiKey: string): void {
    // 转换为代理 URL 以避免 CORS 问题
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.apiKey = apiKey;
    console.log('[ModelService] 配置已更新:', {
      原始URL: baseUrl,
      代理URL: this.baseUrl,
    });
  }

  /**
   * 从缓存获取模型列表
   */
  getCachedModels(): ModelOption[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedModels = JSON.parse(cached);
      const now = Date.now();

      // 检查缓存是否过期或 baseUrl 是否变化
      if (now - data.timestamp > CACHE_DURATION || data.baseUrl !== this.baseUrl) {
        console.log('[ModelService] 缓存已过期或 baseUrl 已变化');
        return null;
      }

      console.log('[ModelService] 使用缓存的模型列表');
      return data.models;
    } catch (error) {
      console.warn('[ModelService] 读取缓存失败:', error);
      return null;
    }
  }

  /**
   * 保存模型列表到缓存
   */
  private saveToCacheInternal(models: ModelOption[]): void {
    try {
      const cacheData: CachedModels = {
        models,
        timestamp: Date.now(),
        baseUrl: this.baseUrl,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('[ModelService] 模型列表已缓存');
    } catch (error) {
      console.warn('[ModelService] 保存缓存失败:', error);
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('[ModelService] 缓存已清除');
    } catch (error) {
      console.warn('[ModelService] 清除缓存失败:', error);
    }
  }

  /**
   * 从 API 获取模型列表
   */
  async fetchModels(): Promise<{ models: ModelOption[]; fromCache: boolean; error?: string }> {
    // 首先检查缓存
    const cachedModels = this.getCachedModels();
    if (cachedModels && cachedModels.length > 0) {
      return { models: cachedModels, fromCache: true };
    }

    // 检查配置是否完整
    if (!this.baseUrl || !this.apiKey) {
      console.log('[ModelService] API 未配置，使用默认模型列表');
      return { models: DEFAULT_MODELS, fromCache: false, error: 'API 未配置' };
    }

    try {
      // 创建带超时的 fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API 请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data: ModelsResponse = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('API 返回格式无效');
      }

      // 转换为 ModelOption 格式
      const models: ModelOption[] = data.data
        .filter((model: ModelInfo) => model.id) // 过滤无效模型
        .map((model: ModelInfo) => ({
          value: model.id,
          label: this.formatModelLabel(model.id, model.owned_by),
        }))
        .sort((a: ModelOption, b: ModelOption) => a.label.localeCompare(b.label));

      // 保存到缓存
      if (models.length > 0) {
        this.saveToCacheInternal(models);
      }

      console.log(`[ModelService] 成功获取 ${models.length} 个模型`);
      return { models, fromCache: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取模型列表失败';
      console.error('[ModelService] 获取模型列表失败:', errorMessage);

      // 如果有缓存（即使过期），也可以使用
      const expiredCache = this.getExpiredCache();
      if (expiredCache) {
        console.log('[ModelService] 使用过期缓存');
        return { models: expiredCache, fromCache: true, error: errorMessage };
      }

      // 返回默认列表
      return { models: DEFAULT_MODELS, fromCache: false, error: errorMessage };
    }
  }

  /**
   * 强制刷新模型列表（忽略缓存）
   */
  async refreshModels(): Promise<{ models: ModelOption[]; error?: string }> {
    this.clearCache();
    const result = await this.fetchModels();
    return { models: result.models, error: result.error };
  }

  /**
   * 获取过期缓存（用于失败回退）
   */
  private getExpiredCache(): ModelOption[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedModels = JSON.parse(cached);
      return data.models;
    } catch {
      return null;
    }
  }

  /**
   * 格式化模型标签
   */
  private formatModelLabel(modelId: string, _ownedBy?: string): string {
    // 常见模型的友好名称映射
    const labelMap: Record<string, string> = {
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4-turbo-preview': 'GPT-4 Turbo Preview',
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K',
      'claude-3-opus': 'Claude 3 Opus',
      'claude-3-sonnet': 'Claude 3 Sonnet',
      'claude-3-haiku': 'Claude 3 Haiku',
      'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
      'claude-3-5-haiku': 'Claude 3.5 Haiku',
    };

    // 检查完全匹配
    if (labelMap[modelId]) {
      return labelMap[modelId];
    }

    // 检查部分匹配（处理带版本号的模型）
    for (const [key, label] of Object.entries(labelMap)) {
      if (modelId.startsWith(key)) {
        const suffix = modelId.slice(key.length);
        return suffix ? `${label} ${suffix}` : label;
      }
    }

    // 默认：将模型 ID 美化显示
    return modelId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * 获取默认模型列表
   */
  getDefaultModels(): ModelOption[] {
    return [...DEFAULT_MODELS];
  }

  /**
   * 获取缓存信息
   */
  getCacheInfo(): { exists: boolean; timestamp?: number; count?: number } {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return { exists: false };

      const data: CachedModels = JSON.parse(cached);
      return {
        exists: true,
        timestamp: data.timestamp,
        count: data.models.length,
      };
    } catch {
      return { exists: false };
    }
  }
}

// 导出单例实例
export const modelService = new ModelService();

// 导出默认模型列表
export { DEFAULT_MODELS };
