/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2026-01-02 19:43:20
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
/**
 * 模板管理Hook
 */

import { useState, useCallback, useMemo } from 'react';
import { TemplateEngine } from '@/core/template';
import { AttendanceTemplate, TemplateType } from '@/types';

interface UseTemplateReturn {
  currentTemplate: AttendanceTemplate | null;
  availableTemplates: AttendanceTemplate[];
  selectTemplate: (type: TemplateType) => void;
  loadTemplate: (id: string) => Promise<AttendanceTemplate | null>;
  isLoading: boolean;
  error: string | null;
}

export function useTemplate(): UseTemplateReturn {
  const [currentTemplate, setCurrentTemplate] = useState<AttendanceTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const engine = useMemo(() => new TemplateEngine(), []);

  const availableTemplates = useMemo(() => {
    return engine.getAllTemplates();
  }, [engine]);

  const selectTemplate = useCallback(
    (type: TemplateType) => {
      setIsLoading(true);
      setError(null);

      try {
        const template = engine.getTemplate(type);
        if (template) {
          setCurrentTemplate(template);
        } else {
          setError(`未找到类型为 ${type} 的模板`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载模板失败');
      } finally {
        setIsLoading(false);
      }
    },
    [engine]
  );

  const loadTemplate = useCallback(
    async (id: string): Promise<AttendanceTemplate | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Try to find template by ID from custom templates
        const template = engine.getCustomTemplate(id);
        if (template) {
          setCurrentTemplate(template);
          return template;
        } else {
          setError(`未找到ID为 ${id} 的模板`);
          return null;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载模板失败');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [engine]
  );

  return {
    currentTemplate,
    availableTemplates,
    selectTemplate,
    loadTemplate,
    isLoading,
    error,
  };
}

export default useTemplate;
