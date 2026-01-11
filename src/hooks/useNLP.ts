/**
 * NLP处理Hook
 */

import { useState, useCallback, useMemo } from 'react';
import { NLPProcessor } from '@/core/nlp';
import { NLPResult, AttendanceIntent } from '@/types';
import { GeneratedTable } from '@/services';

interface UseNLPReturn {
  process: (input: string) => Promise<NLPResult | null>;
  processWithAI: (
    input: string
  ) => Promise<{ result: NLPResult | null; table?: GeneratedTable; error?: string }>;
  result: NLPResult | null;
  isProcessing: boolean;
  error: string | null;
  intentDescription: string;
  suggestions: string[];
  reset: () => void;
}

const intentDescriptions: Record<AttendanceIntent, string> = {
  [AttendanceIntent.CREATE_DAILY]: '创建日报表',
  [AttendanceIntent.CREATE_WEEKLY]: '创建周报表',
  [AttendanceIntent.CREATE_MONTHLY]: '创建月报表',
  [AttendanceIntent.CREATE_SUMMARY]: '创建汇总表',
  [AttendanceIntent.IMPORT_DATA]: '导入数据',
  [AttendanceIntent.GENERATE_CHART]: '生成图表',
  [AttendanceIntent.EXPORT_DATA]: '导出数据',
  [AttendanceIntent.QUERY_EMPLOYEE]: '查询员工',
  [AttendanceIntent.QUERY_STATISTICS]: '查询统计',
  [AttendanceIntent.MODIFY_TEMPLATE]: '修改模板',
  [AttendanceIntent.QUERY_ATTENDANCE]: '查询考勤',
  [AttendanceIntent.EXPORT_REPORT]: '导出报表',
  [AttendanceIntent.CREATE_GENERIC_TABLE]: '创建表格',
  [AttendanceIntent.MODIFY_TABLE]: '修改表格',
  [AttendanceIntent.MODIFY_CHART]: '修改图表',
  [AttendanceIntent.UNKNOWN]: '未知意图',
};

const defaultSuggestions = [
  '生成本月考勤表',
  '统计本周出勤率',
  '查询张三的考勤记录',
  '导出部门考勤报表',
  '生成日报表',
];

export function useNLP(): UseNLPReturn {
  const [result, setResult] = useState<NLPResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processor = useMemo(() => new NLPProcessor(), []);

  const process = useCallback(
    async (input: string): Promise<NLPResult | null> => {
      if (!input.trim()) {
        setError('请输入内容');
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const nlpResult = processor.process(input);
        setResult(nlpResult);
        return nlpResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '处理失败';
        setError(errorMessage);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [processor]
  );

  const processWithAI = useCallback(
    async (input: string) => {
      if (!input.trim()) {
        setError('请输入内容');
        return { result: null };
      }

      setIsProcessing(true);
      setError(null);

      try {
        const { result: nlpResult, table, error: aiError } = await processor.processWithAI(input);
        setResult(nlpResult);
        if (aiError) setError(aiError);
        return { result: nlpResult, table, error: aiError };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '处理失败';
        setError(errorMessage);
        return { result: null, error: errorMessage };
      } finally {
        setIsProcessing(false);
      }
    },
    [processor]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  const intentDescription = useMemo(() => {
    if (!result) return '';
    return intentDescriptions[result.intent] || '未知意图';
  }, [result]);

  const suggestions = useMemo(() => {
    if (result) {
      // 根据识别的意图提供相关建议
      switch (result.intent) {
        case AttendanceIntent.CREATE_DAILY:
        case AttendanceIntent.CREATE_WEEKLY:
        case AttendanceIntent.CREATE_MONTHLY:
          return ['生成日报表', '生成周报表', '生成月报表'];
        case AttendanceIntent.QUERY_ATTENDANCE:
        case AttendanceIntent.QUERY_EMPLOYEE:
          return ['查询今日考勤', '查询本周考勤', '查询指定员工'];
        case AttendanceIntent.QUERY_STATISTICS:
          return ['统计出勤率', '统计迟到次数', '统计加班时长'];
        case AttendanceIntent.EXPORT_REPORT:
        case AttendanceIntent.EXPORT_DATA:
          return ['导出Excel', '导出Word报告', '导出PDF'];
        case AttendanceIntent.GENERATE_CHART:
          return ['生成饼图', '生成柱状图', '生成趋势图'];
        default:
          return defaultSuggestions;
      }
    }
    return defaultSuggestions;
  }, [result]);

  return {
    process,
    processWithAI,
    result,
    isProcessing,
    error,
    intentDescription,
    suggestions,
    reset,
  };
}

export default useNLP;
