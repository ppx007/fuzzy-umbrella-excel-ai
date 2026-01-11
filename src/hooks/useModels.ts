/**
 * 模型列表管理 Hook
 * 提供动态模型获取、缓存和刷新功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { modelService, DEFAULT_MODELS } from '@/services/model-service';
import type { ModelOption } from '@/services/model-service';

export interface UseModelsOptions {
  baseUrl: string;
  apiKey: string;
  autoFetch?: boolean; // 是否自动获取，默认 true
  debounceMs?: number; // 防抖延迟，默认 800ms
}

export interface UseModelsReturn {
  models: ModelOption[];
  isLoading: boolean;
  error: string | null;
  isFromCache: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

/**
 * 模型列表管理 Hook
 */
export function useModels({
  baseUrl,
  apiKey,
  autoFetch = true,
  debounceMs = 800,
}: UseModelsOptions): UseModelsReturn {
  const [models, setModels] = useState<ModelOption[]>(DEFAULT_MODELS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 用于追踪当前配置
  const configRef = useRef({ baseUrl, apiKey });

  // 防抖计时器
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 获取模型列表
  const fetchModels = useCallback(async () => {
    if (!baseUrl || !apiKey) {
      console.log('[useModels] API 未配置，使用默认模型列表');
      setModels(DEFAULT_MODELS);
      setError('API 未配置');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 更新服务配置
      modelService.updateConfig(baseUrl, apiKey);

      const result = await modelService.fetchModels();

      setModels(result.models);
      setIsFromCache(result.fromCache);
      setLastUpdated(new Date());

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取模型列表失败';
      setError(errorMessage);
      console.error('[useModels] 获取失败:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, apiKey]);

  // 刷新模型列表（强制忽略缓存）
  const refresh = useCallback(async () => {
    if (!baseUrl || !apiKey) {
      setError('API 未配置');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      modelService.updateConfig(baseUrl, apiKey);
      const result = await modelService.refreshModels();

      setModels(result.models);
      setIsFromCache(false);
      setLastUpdated(new Date());

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新模型列表失败';
      setError(errorMessage);
      console.error('[useModels] 刷新失败:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, apiKey]);

  // 清除缓存
  const clearCache = useCallback(() => {
    modelService.clearCache();
    setIsFromCache(false);
  }, []);

  // 当配置变化时重新获取（带防抖）
  useEffect(() => {
    const configChanged =
      configRef.current.baseUrl !== baseUrl || configRef.current.apiKey !== apiKey;

    if (configChanged) {
      // 如果 baseUrl 变化，清除旧缓存
      if (configRef.current.baseUrl !== baseUrl) {
        modelService.clearCache();
      }

      configRef.current = { baseUrl, apiKey };
    }

    // 清除之前的防抖计时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // 如果配置不完整，直接返回
    if (!baseUrl || !apiKey) {
      return;
    }

    // 设置防抖：等待用户停止输入后再获取
    if (autoFetch && configChanged) {
      debounceTimerRef.current = setTimeout(() => {
        fetchModels();
      }, debounceMs);
    } else if (autoFetch && !configChanged) {
      // 初始加载不需要防抖
      fetchModels();
    }

    // 清理函数
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [baseUrl, apiKey, autoFetch, debounceMs, fetchModels]);

  // 初始化时检查缓存
  useEffect(() => {
    if (!autoFetch) return;

    const cacheInfo = modelService.getCacheInfo();
    if (cacheInfo.exists && cacheInfo.timestamp) {
      setLastUpdated(new Date(cacheInfo.timestamp));
    }
  }, [autoFetch]);

  return {
    models,
    isLoading,
    error,
    isFromCache,
    lastUpdated,
    refresh,
    clearCache,
  };
}

export default useModels;
