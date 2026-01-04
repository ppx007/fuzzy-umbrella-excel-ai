/**
 * AI驱动的考勤数据管理Hook
 */

import { useState, useCallback } from 'react';
import { useAttendanceStore } from '@/store';
import { GeneratedTable, aiService, transformAITable } from '@/services';
import { excelAdapter } from '@/adapters';

interface UseAIAttendanceReturn {
  generateTableFromAI: (input: string) => Promise<void>;
  writeToExcel: (table: GeneratedTable) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
  generatedTable: GeneratedTable | null;
}

export function useAIAttendance(): UseAIAttendanceReturn {
  const store = useAttendanceStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTable, setGeneratedTable] = useState<GeneratedTable | null>(null);

  const generateTableFromAI = useCallback(
    async (input: string) => {
      setIsGenerating(true);
      setError(null);
      setGeneratedTable(null);

      console.log('[AI] 开始生成表格，输入:', input);
      console.log('[AI] API配置:', {
        available: aiService.isAvailable(),
      });

      try {
        const response = await aiService.generateTable(input);
        console.log('[AI] API响应:', response);

        if (response.success && response.data) {
          console.log('[AI] 生成成功，数据:', response.data);
          setGeneratedTable(response.data);

          // 将AI生成的数据转换为应用内部格式
          const { employees, records } = transformAITable(response.data);
          console.log('[AI] 转换后的数据:', { employees, records });

          // 更新Zustand store
          store.clearAll(); // 清空旧数据
          employees.forEach(emp => store.addEmployee(emp));
          records.forEach(rec => store.addRecord(rec));

          // 不再自动写入Excel
        } else {
          const errorMsg = response.error || 'AI生成表格失败';
          console.error('[AI] 生成失败:', errorMsg);
          if (response.rawResponse) {
            console.log('[AI] 原始响应:', response.rawResponse);
          }
          throw new Error(errorMsg);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '处理失败';
        console.error('[AI] 错误:', errorMsg, err);
        setError(errorMsg);
      } finally {
        setIsGenerating(false);
      }
    },
    [store]
  );

  return {
    generateTableFromAI,
    writeToExcel, // 导出写入函数
    isGenerating,
    error,
    generatedTable,
  };
}

// transformAITable 函数已移至 services/ai-service.ts

/**
 * 将AI生成的表格写入Excel
 */
async function writeToExcel(table: GeneratedTable) {
  const isAvailable = await excelAdapter.isAvailable();
  if (!isAvailable) {
    console.log('[Excel] Excel适配器不可用，跳过写入');
    return;
  }

  const headers = [table.columns.map(c => c.title)];
  const rows = table.rows.map(row => table.columns.map(col => row[col.key]));

  await excelAdapter.writeData(headers, { sheetName: table.title, startCell: 'A1' });
  await excelAdapter.writeData(rows, { sheetName: table.title, startCell: `A2` });
}

export default useAIAttendance;
