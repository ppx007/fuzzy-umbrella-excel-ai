/**
 * 应用设置管理 Hook
 * 使用 localStorage 持久化存储
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  AppSettings,
  AISettings,
  TableDefaultSettings,
  StylePreferenceSettings,
  AdvancedSettings,
  SettingsCategory,
} from '@/types/common';

/**
 * 默认设置
 */
const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4',
    timeout: 60,
  },
  table: {
    positionMode: 'auto',
    defaultRowCount: 5,
    autoCreateTable: true,
    autoFitColumns: true,
  },
  style: {
    defaultTheme: 'professional',
    styleMode: 'ai',
    enableConditionalFormat: true,
  },
  advanced: {
    maxHistoryEntries: 50,
    enableStreaming: true,
    debugMode: false,
  },
};

const STORAGE_KEY = 'excel-addin-settings';

/**
 * 从 localStorage 加载设置
 */
function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 合并默认设置，确保新增的设置项有默认值
      return {
        ai: { ...DEFAULT_SETTINGS.ai, ...parsed.ai },
        table: { ...DEFAULT_SETTINGS.table, ...parsed.table },
        style: { ...DEFAULT_SETTINGS.style, ...parsed.style },
        advanced: { ...DEFAULT_SETTINGS.advanced, ...parsed.advanced },
      };
    }
  } catch (error) {
    console.warn('[useSettings] 加载设置失败:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * 保存设置到 localStorage
 */
function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[useSettings] 保存设置失败:', error);
  }
}

/**
 * 设置管理 Hook
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('ai');
  const [isDirty, setIsDirty] = useState(false);

  // 初始化时从环境变量加载 AI 配置
  useEffect(() => {
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    // 支持两个变量名: VITE_OPENAI_API_BASE 和 VITE_OPENAI_BASE_URL
    const envBaseUrl = import.meta.env.VITE_OPENAI_API_BASE || import.meta.env.VITE_OPENAI_BASE_URL;
    const envModel = import.meta.env.VITE_OPENAI_MODEL;

    console.log('[useSettings] 环境变量:', {
      envApiKey: envApiKey?.substring(0, 6),
      envBaseUrl,
      envModel,
    });

    // 如果有环境变量中配置了模型，优先使用环境变量的模型
    // 这样可以避免 localStorage 中保存的无效模型导致的问题
    if (envApiKey || envBaseUrl || envModel) {
      setSettings(prev => {
        // 检测 localStorage 中的模型是否是"search"类型（可能不稳定）
        const storedModelIsSearch = prev.ai.model?.includes('-search');

        // 如果环境变量指定了模型，且 localStorage 中的模型是 search 类型，则使用环境变量的模型
        const shouldUseEnvModel = envModel && storedModelIsSearch;

        const needsUpdate =
          (envApiKey && !prev.ai.apiKey) ||
          (envBaseUrl && !prev.ai.baseUrl) ||
          (envModel && !prev.ai.model) ||
          shouldUseEnvModel;

        if (!needsUpdate) return prev;

        console.log('[useSettings] 更新设置:', {
          shouldUseEnvModel,
          storedModel: prev.ai.model,
          envModel,
        });

        return {
          ...prev,
          ai: {
            ...prev.ai,
            apiKey: prev.ai.apiKey || envApiKey || '',
            baseUrl: prev.ai.baseUrl || envBaseUrl || DEFAULT_SETTINGS.ai.baseUrl,
            // 如果 localStorage 中是 search 模型且环境变量指定了模型，使用环境变量的
            model: shouldUseEnvModel
              ? envModel
              : prev.ai.model || envModel || DEFAULT_SETTINGS.ai.model,
          },
        };
      });
    }
  }, []);

  /**
   * 更新 AI 设置
   */
  const updateAISettings = useCallback((updates: Partial<AISettings>) => {
    setSettings(prev => ({
      ...prev,
      ai: { ...prev.ai, ...updates },
    }));
    setIsDirty(true);
  }, []);

  /**
   * 更新表格默认设置
   */
  const updateTableSettings = useCallback((updates: Partial<TableDefaultSettings>) => {
    setSettings(prev => ({
      ...prev,
      table: { ...prev.table, ...updates },
    }));
    setIsDirty(true);
  }, []);

  /**
   * 更新样式偏好
   */
  const updateStyleSettings = useCallback((updates: Partial<StylePreferenceSettings>) => {
    setSettings(prev => ({
      ...prev,
      style: { ...prev.style, ...updates },
    }));
    setIsDirty(true);
  }, []);

  /**
   * 更新高级设置
   */
  const updateAdvancedSettings = useCallback((updates: Partial<AdvancedSettings>) => {
    setSettings(prev => ({
      ...prev,
      advanced: { ...prev.advanced, ...updates },
    }));
    setIsDirty(true);
  }, []);

  /**
   * 保存所有设置
   */
  const save = useCallback(() => {
    saveSettings(settings);
    setIsDirty(false);
  }, [settings]);

  /**
   * 重置为默认设置
   */
  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setIsDirty(false);
  }, []);

  /**
   * 重置单个分类
   */
  const resetCategory = useCallback((category: SettingsCategory) => {
    if (category === 'about') return;

    setSettings(prev => ({
      ...prev,
      [category]: DEFAULT_SETTINGS[category as keyof Omit<AppSettings, 'about'>],
    }));
    setIsDirty(true);
  }, []);

  /**
   * 导出设置为 JSON
   */
  const exportSettings = useCallback(() => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'excel-addin-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [settings]);

  /**
   * 导入设置
   */
  const importSettings = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      const merged: AppSettings = {
        ai: { ...DEFAULT_SETTINGS.ai, ...imported.ai },
        table: { ...DEFAULT_SETTINGS.table, ...imported.table },
        style: { ...DEFAULT_SETTINGS.style, ...imported.style },
        advanced: { ...DEFAULT_SETTINGS.advanced, ...imported.advanced },
      };
      setSettings(merged);
      saveSettings(merged);
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error('[useSettings] 导入设置失败:', error);
      return false;
    }
  }, []);

  // 自动保存（当设置变化且标记为脏时）
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        save();
      }, 500); // 防抖500ms
      return () => clearTimeout(timer);
    }
  }, [isDirty, save]);

  return {
    // 当前设置
    settings,

    // 分类导航
    activeCategory,
    setActiveCategory,

    // 状态
    isDirty,

    // 更新方法
    updateAISettings,
    updateTableSettings,
    updateStyleSettings,
    updateAdvancedSettings,

    // 操作方法
    save,
    reset,
    resetCategory,
    exportSettings,
    importSettings,

    // 便捷访问
    ai: settings.ai,
    table: settings.table,
    style: settings.style,
    advanced: settings.advanced,
  };
}

export default useSettings;
