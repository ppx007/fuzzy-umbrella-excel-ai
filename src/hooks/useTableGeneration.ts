/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2026-01-03 10:40:39
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
/**
 * 表格生成 Hook
 * 提供表格生成的状态管理和操作方法
 * 支持带样式的表格生成
 */

import { useState, useCallback } from 'react';
import {
  TableGenerationRequest,
  GenericTableData,
  StyledTableData,
  StyledTableGenerationRequest,
  ColorThemeName,
} from '@/types/common';
import { tableGenerationService } from '@/services';
import { excelAdapter } from '@/adapters';

/**
 * 样式偏好配置
 */
export interface StylePreference {
  /** 颜色主题 */
  theme: ColorThemeName;
  /** 是否启用条件格式 */
  enableConditionalFormat: boolean;
}

/**
 * useTableGeneration Hook 返回类型
 */
interface UseTableGenerationReturn {
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否正在写入 Excel */
  isWriting: boolean;
  /** 错误信息 */
  error: string | null;
  /** 生成的表格数据 */
  generatedTable: GenericTableData | null;
  /** 生成的带样式表格数据 */
  styledTable: StyledTableData | null;

  /** 生成表格（无样式） */
  generateTable: (prompt: string, options?: TableGenerationRequest['options']) => Promise<void>;
  /** 生成带样式的表格 */
  generateStyledTable: (
    prompt: string,
    options?: TableGenerationRequest['options'],
    stylePreference?: StylePreference
  ) => Promise<void>;
  /** 写入 Excel */
  writeToExcel: () => Promise<void>;
  /** 写入带样式的表格到 Excel */
  writeStyledToExcel: () => Promise<void>;
  /** 清除表格 */
  clearTable: () => void;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * 表格生成 Hook
 * @returns 表格生成状态和操作方法
 */
export function useTableGeneration(): UseTableGenerationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTable, setGeneratedTable] = useState<GenericTableData | null>(null);
  const [styledTable, setStyledTable] = useState<StyledTableData | null>(null);

  /**
   * 生成表格
   * @param prompt 用户输入的自然语言描述
   * @param options 生成选项
   */
  const generateTable = useCallback(
    async (prompt: string, options?: TableGenerationRequest['options']) => {
      // 清除之前的错误
      setError(null);
      setIsLoading(true);

      try {
        const response = await tableGenerationService.generateTable({
          prompt,
          options,
        });

        if (response.success && response.data) {
          setGeneratedTable(response.data);
        } else {
          setError(response.error || '生成表格失败，请重试');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '生成表格时发生未知错误';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 生成带样式的表格
   * @param prompt 用户输入的自然语言描述
   * @param options 生成选项
   * @param stylePreference 样式偏好
   */
  const generateStyledTable = useCallback(
    async (
      prompt: string,
      options?: TableGenerationRequest['options'],
      stylePreference?: StylePreference
    ) => {
      // 清除之前的错误和表格
      setError(null);
      setIsLoading(true);
      setGeneratedTable(null);

      try {
        const request: StyledTableGenerationRequest = {
          prompt,
          options,
          stylePreference: stylePreference
            ? {
                theme: stylePreference.theme,
                enableConditionalFormat: stylePreference.enableConditionalFormat,
              }
            : undefined,
        };

        const response = await tableGenerationService.generateStyledTable(request);

        if (response.success && response.data) {
          setStyledTable(response.data);
          // 同时设置 generatedTable 以保持兼容性
          setGeneratedTable(response.data);
        } else {
          setError(response.error || '生成表格失败，请重试');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '生成表格时发生未知错误';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 将生成的表格写入 Excel（无样式）
   */
  const writeToExcel = useCallback(async () => {
    if (!generatedTable) {
      setError('没有可写入的表格数据');
      return;
    }

    setError(null);
    setIsWriting(true);

    try {
      await excelAdapter.writeGenericTable(generatedTable, {
        createTable: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '写入 Excel 时发生未知错误';
      setError(errorMessage);
    } finally {
      setIsWriting(false);
    }
  }, [generatedTable]);

  /**
   * 将带样式的表格写入 Excel
   */
  const writeStyledToExcel = useCallback(async () => {
    if (!styledTable) {
      setError('没有可写入的表格数据');
      return;
    }

    setError(null);
    setIsWriting(true);

    try {
      await excelAdapter.writeStyledTable(styledTable, {
        createTable: true,
        applyConditionalFormats: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '写入 Excel 时发生未知错误';
      setError(errorMessage);
    } finally {
      setIsWriting(false);
    }
  }, [styledTable]);

  /**
   * 清除生成的表格
   */
  const clearTable = useCallback(() => {
    setGeneratedTable(null);
    setStyledTable(null);
  }, []);

  /**
   * 清除错误信息
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    isWriting,
    error,
    generatedTable,
    styledTable,
    generateTable,
    generateStyledTable,
    writeToExcel,
    writeStyledToExcel,
    clearTable,
    clearError,
  };
}

export default useTableGeneration;
