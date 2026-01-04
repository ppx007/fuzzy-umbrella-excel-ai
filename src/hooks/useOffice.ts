/**
 * Office API操作Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { ExcelAdapter, WordAdapter } from '@/adapters';
import { RenderResult } from '@/core/template';
import { AttendanceRecord, CellStyle } from '@/types';

interface UseOfficeReturn {
  // 状态
  isOfficeReady: boolean;
  hostApp: 'Excel' | 'Word' | null;
  isLoading: boolean;
  error: string | null;
  
  // Excel操作
  writeToExcel: (data: RenderResult) => Promise<boolean>;
  readFromExcel: () => Promise<unknown[][] | null>;
  
  // Word操作
  writeToWord: (data: RenderResult) => Promise<boolean>;
  
  // 通用操作
  exportRecords: (records: AttendanceRecord[]) => Promise<boolean>;
}

export function useOffice(): UseOfficeReturn {
  const [isOfficeReady, setIsOfficeReady] = useState(false);
  const [hostApp, setHostApp] = useState<'Excel' | 'Word' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const excelAdapter = new ExcelAdapter();
  const wordAdapter = new WordAdapter();

  // 初始化Office
  useEffect(() => {
    const initOffice = async () => {
      try {
        // 检查Office.js是否可用
        if (typeof Office !== 'undefined' && Office.context) {
          await new Promise<void>((resolve) => {
            Office.onReady((info) => {
              if (info.host === Office.HostType.Excel) {
                setHostApp('Excel');
                setIsOfficeReady(true);
              } else if (info.host === Office.HostType.Word) {
                setHostApp('Word');
                setIsOfficeReady(true);
              }
              resolve();
            });
          });
        }
      } catch (err) {
        console.log('Office.js not available, running in standalone mode');
        setIsOfficeReady(false);
      }
    };

    initOffice();
  }, []);

  // 写入Excel
  const writeToExcel = useCallback(
    async (data: RenderResult): Promise<boolean> => {
      if (!isOfficeReady || hostApp !== 'Excel') {
        setError('Excel不可用');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await excelAdapter.writeRenderResult(data);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '写入Excel失败');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isOfficeReady, hostApp, excelAdapter]
  );

  // 从Excel读取
  const readFromExcel = useCallback(async (): Promise<unknown[][] | null> => {
    if (!isOfficeReady || hostApp !== 'Excel') {
      setError('Excel不可用');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await excelAdapter.readData();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取Excel失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isOfficeReady, hostApp, excelAdapter]);

  // 写入Word
  const writeToWord = useCallback(
    async (data: RenderResult): Promise<boolean> => {
      if (!isOfficeReady || hostApp !== 'Word') {
        setError('Word不可用');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await wordAdapter.writeRenderResult(data);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '写入Word失败');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isOfficeReady, hostApp, wordAdapter]
  );

  // 导出记录（通用方法）
  const exportRecords = useCallback(
    async (records: AttendanceRecord[]): Promise<boolean> => {
      if (records.length === 0) {
        setError('没有数据可导出');
        return false;
      }

      // 构建RenderResult
      const styles = new Map<string, CellStyle>();
      styles.set('header', {
        backgroundColor: '#4472C4',
        fontColor: '#FFFFFF',
        fontWeight: 'bold',
        align: 'center',
      });
      styles.set('body', {
        align: 'center',
      });

      const renderResult: RenderResult = {
        headers: [
          ['考勤记录'],
          ['员工姓名', '日期', '签到时间', '签退时间', '状态', '工时'],
        ],
        rows: records.map(r => [
          r.employeeName,
          r.date instanceof Date ? r.date.toLocaleDateString() : String(r.date),
          r.checkInTime instanceof Date ? r.checkInTime.toLocaleTimeString() : '-',
          r.checkOutTime instanceof Date ? r.checkOutTime.toLocaleTimeString() : '-',
          r.status,
          r.workHours?.toFixed(1) || '-',
        ]),
        styles,
        merges: [
          { startRow: 0, startCol: 0, endRow: 0, endCol: 5 },
        ],
        columnWidths: [100, 100, 100, 100, 80, 80],
        rowHeights: [30, 25, ...records.map(() => 22)],
      };

      if (hostApp === 'Excel') {
        return writeToExcel(renderResult);
      } else if (hostApp === 'Word') {
        return writeToWord(renderResult);
      } else {
        // 非Office环境，下载为CSV
        const csv = [
          '员工姓名,日期,签到时间,签退时间,状态,工时',
          ...records.map(r => 
            `${r.employeeName},${r.date},${r.checkInTime || ''},${r.checkOutTime || ''},${r.status},${r.workHours || ''}`
          )
        ].join('\n');
        
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        return true;
      }
    },
    [hostApp, writeToExcel, writeToWord]
  );

  return {
    isOfficeReady,
    hostApp,
    isLoading,
    error,
    writeToExcel,
    readFromExcel,
    writeToWord,
    exportRecords,
  };
}

export default useOffice;