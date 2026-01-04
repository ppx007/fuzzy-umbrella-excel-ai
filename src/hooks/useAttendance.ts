/**
 * 考勤数据管理Hook
 */

import { useState, useCallback } from 'react';
import { useAttendanceStore } from '@/store';
import {
  AttendanceRecord,
  AttendanceSheet,
  AttendanceStatistics,
  Employee,
  DateRange,
} from '@/types';
import { SheetGenerator, GenerateResult } from '@/core/generator';
import { DataProcessor, ColumnMapping, ImportResult } from '@/core/data';

interface UseAttendanceReturn {
  // 数据
  employees: Employee[];
  records: AttendanceRecord[];
  currentSheet: AttendanceSheet | null;
  statistics: AttendanceStatistics | null;

  // 状态
  isLoading: boolean;
  error: string | null;

  // 员工操作
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;

  // 记录操作
  addRecord: (record: AttendanceRecord) => void;
  updateRecord: (id: string, data: Partial<AttendanceRecord>) => void;
  removeRecord: (id: string) => void;

  // 表格操作
  generateSheet: (dateRange: DateRange) => Promise<GenerateResult | null>;
  setCurrentSheet: (sheet: AttendanceSheet | null) => void;

  // 数据导入
  importFromCSV: (csvContent: string, mapping: ColumnMapping) => ImportResult;
  importFromArray: (data: unknown[][], mapping: ColumnMapping) => ImportResult;

  // 统计
  calculateStatistics: () => Promise<AttendanceStatistics | null>;

  // 清除
  clearAll: () => void;
}

export function useAttendance(): UseAttendanceReturn {
  const store = useAttendanceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<AttendanceStatistics | null>(null);

  const generator = new SheetGenerator();
  const dataProcessor = new DataProcessor();

  // 生成考勤表
  const generateSheet = useCallback(
    async (dateRange: DateRange): Promise<GenerateResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = generator.generate(dateRange, store.employees, store.records, {
          includeStatistics: true,
        });

        store.setCurrentSheet(result.sheet);
        setStatistics(result.sheet.statistics || null);

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : '生成考勤表失败');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [store, generator]
  );

  // 从CSV导入
  const importFromCSV = useCallback(
    (csvContent: string, mapping: ColumnMapping): ImportResult => {
      setIsLoading(true);
      setError(null);

      try {
        const result = dataProcessor.importFromCSV(csvContent, mapping);
        result.records.forEach(record => store.addRecord(record));
        result.employees.forEach(emp => {
          if (!store.employees.find(e => e.id === emp.id)) {
            store.addEmployee(emp);
          }
        });
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : '导入失败');
        return {
          records: [],
          employees: [],
          errors: [{ row: 0, message: err instanceof Error ? err.message : '导入失败' }],
          warnings: [],
          stats: { total: 0, success: 0, failed: 1 },
        };
      } finally {
        setIsLoading(false);
      }
    },
    [store, dataProcessor]
  );

  // 从数组导入
  const importFromArray = useCallback(
    (data: unknown[][], mapping: ColumnMapping): ImportResult => {
      setIsLoading(true);
      setError(null);

      try {
        const result = dataProcessor.importFromArray(data, mapping);
        result.records.forEach(record => store.addRecord(record));
        result.employees.forEach(emp => {
          if (!store.employees.find(e => e.id === emp.id)) {
            store.addEmployee(emp);
          }
        });
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : '导入失败');
        return {
          records: [],
          employees: [],
          errors: [{ row: 0, message: err instanceof Error ? err.message : '导入失败' }],
          warnings: [],
          stats: { total: 0, success: 0, failed: 1 },
        };
      } finally {
        setIsLoading(false);
      }
    },
    [store, dataProcessor]
  );

  // 计算统计
  const calculateStatistics = useCallback(async (): Promise<AttendanceStatistics | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // 使用当前月份作为默认日期范围
      const now = new Date();
      const dateRange: DateRange = {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };

      const result = generator.generate(dateRange, store.employees, store.records, {
        includeStatistics: true,
      });

      const stats = result.sheet.statistics || null;
      setStatistics(stats);
      return stats;
    } catch (err) {
      setError(err instanceof Error ? err.message : '计算统计失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [store.employees, store.records, generator]);

  // 清除所有数据
  const clearAll = useCallback(() => {
    store.clearAll();
    setStatistics(null);
    setError(null);
  }, [store]);

  return {
    // 数据
    employees: store.employees,
    records: store.records,
    currentSheet: store.currentSheet,
    statistics,

    // 状态
    isLoading,
    error,

    // 员工操作
    addEmployee: store.addEmployee,
    updateEmployee: store.updateEmployee,
    removeEmployee: store.removeEmployee,

    // 记录操作
    addRecord: store.addRecord,
    updateRecord: store.updateRecord,
    removeRecord: store.removeRecord,

    // 表格操作
    generateSheet,
    setCurrentSheet: store.setCurrentSheet,

    // 数据导入
    importFromCSV,
    importFromArray,

    // 统计
    calculateStatistics,

    // 清除
    clearAll,
  };
}

export default useAttendance;
