/**
 * 历史管理 Hook - 支持撤销/重做功能
 * 完全重构版本 - 修复撤销/重做逻辑
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  HistoryEntry,
  HistoryState,
  TableSnapshot,
  OperationType,
  StyledTableData,
} from '@/types/common';

/** 默认最大历史记录数 */
const DEFAULT_MAX_ENTRIES = 50;

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `history_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 创建表格快照
 */
function createSnapshot(data: StyledTableData, address: string, sheetName: string): TableSnapshot {
  return {
    data: JSON.parse(JSON.stringify(data)), // 深拷贝
    address,
    sheetName,
    capturedAt: Date.now(),
  };
}

/**
 * 撤销操作结果
 */
export interface UndoResult {
  /** 是否成功 */
  success: boolean;
  /** 操作类型 */
  operationType: OperationType;
  /** 需要恢复的数据（如果是修改操作，这是修改前的数据；如果是创建操作，这是 null） */
  restoreData: StyledTableData | null;
  /** 表格地址 */
  address: string;
  /** 工作表名称 */
  sheetName: string;
  /** 操作描述 */
  description: string;
}

/**
 * 重做操作结果
 */
export interface RedoResult {
  /** 是否成功 */
  success: boolean;
  /** 操作类型 */
  operationType: OperationType;
  /** 需要应用的数据 */
  applyData: StyledTableData;
  /** 表格地址 */
  address: string;
  /** 工作表名称 */
  sheetName: string;
  /** 操作描述 */
  description: string;
}

/**
 * 历史管理 Hook
 */
export function useHistory(maxEntries: number = DEFAULT_MAX_ENTRIES) {
  const [state, setState] = useState<HistoryState>({
    entries: [],
    currentIndex: -1,
    maxEntries,
    canUndo: false,
    canRedo: false,
  });

  /**
   * 计算是否可以撤销/重做
   */
  const updateCanUndoRedo = useCallback(
    (entries: HistoryEntry[], currentIndex: number): { canUndo: boolean; canRedo: boolean } => {
      return {
        canUndo: currentIndex >= 0 && entries.length > 0,
        canRedo: currentIndex < entries.length - 1,
      };
    },
    []
  );

  /**
   * 添加历史记录
   * @param type 操作类型
   * @param description 操作描述
   * @param beforeData 操作前的数据（创建操作为 null）
   * @param afterData 操作后的数据
   * @param tableAddress 表格地址
   * @param sheetName 工作表名称
   */
  const pushHistory = useCallback(
    (
      type: OperationType,
      description: string,
      beforeData: StyledTableData | null,
      afterData: StyledTableData,
      tableAddress: string,
      sheetName: string
    ) => {
      setState(prev => {
        // 如果当前不在最新位置，删除后面的历史记录（因为新的操作会覆盖重做栈）
        const newEntries = prev.entries.slice(0, prev.currentIndex + 1);

        const entry: HistoryEntry = {
          id: generateId(),
          type,
          description,
          timestamp: Date.now(),
          beforeState: beforeData ? createSnapshot(beforeData, tableAddress, sheetName) : null,
          afterState: createSnapshot(afterData, tableAddress, sheetName),
          tableAddress,
          sheetName,
        };

        newEntries.push(entry);

        // 如果超过最大数量，删除最旧的记录
        while (newEntries.length > prev.maxEntries) {
          newEntries.shift();
        }

        const newIndex = newEntries.length - 1;
        const { canUndo, canRedo } = updateCanUndoRedo(newEntries, newIndex);

        console.log('[useHistory] pushHistory:', {
          type,
          description,
          entriesCount: newEntries.length,
          currentIndex: newIndex,
          canUndo,
          canRedo,
        });

        return {
          ...prev,
          entries: newEntries,
          currentIndex: newIndex,
          canUndo,
          canRedo,
        };
      });
    },
    [updateCanUndoRedo]
  );

  /**
   * 撤销操作
   * 返回需要恢复的状态信息
   */
  const undo = useCallback((): UndoResult | null => {
    let result: UndoResult | null = null;

    setState(prev => {
      if (prev.currentIndex < 0 || prev.entries.length === 0) {
        console.log('[useHistory] undo: 没有可撤销的操作');
        return prev;
      }

      const currentEntry = prev.entries[prev.currentIndex];
      const newIndex = prev.currentIndex - 1;

      // 构建撤销结果
      result = {
        success: true,
        operationType: currentEntry.type,
        // 如果 beforeState 为 null，表示这是创建操作，撤销后应该删除/清空
        restoreData: currentEntry.beforeState?.data || null,
        address: currentEntry.tableAddress,
        sheetName: currentEntry.sheetName,
        description: currentEntry.description,
      };

      const { canUndo, canRedo } = updateCanUndoRedo(prev.entries, newIndex);

      console.log('[useHistory] undo:', {
        undoType: currentEntry.type,
        description: currentEntry.description,
        newIndex,
        hasRestoreData: !!result.restoreData,
        canUndo,
        canRedo,
      });

      return {
        ...prev,
        currentIndex: newIndex,
        canUndo,
        canRedo,
      };
    });

    return result;
  }, [updateCanUndoRedo]);

  /**
   * 重做操作
   * 返回需要应用的状态信息
   */
  const redo = useCallback((): RedoResult | null => {
    let result: RedoResult | null = null;

    setState(prev => {
      if (prev.currentIndex >= prev.entries.length - 1) {
        console.log('[useHistory] redo: 没有可重做的操作');
        return prev;
      }

      const newIndex = prev.currentIndex + 1;
      const entryToRedo = prev.entries[newIndex];

      // 构建重做结果
      result = {
        success: true,
        operationType: entryToRedo.type,
        applyData: entryToRedo.afterState.data,
        address: entryToRedo.tableAddress,
        sheetName: entryToRedo.sheetName,
        description: entryToRedo.description,
      };

      const { canUndo, canRedo } = updateCanUndoRedo(prev.entries, newIndex);

      console.log('[useHistory] redo:', {
        redoType: entryToRedo.type,
        description: entryToRedo.description,
        newIndex,
        canUndo,
        canRedo,
      });

      return {
        ...prev,
        currentIndex: newIndex,
        canUndo,
        canRedo,
      };
    });

    return result;
  }, [updateCanUndoRedo]);

  /**
   * 清空历史记录
   */
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      entries: [],
      currentIndex: -1,
      canUndo: false,
      canRedo: false,
    }));
    console.log('[useHistory] clearHistory: 历史记录已清空');
  }, []);

  /**
   * 获取当前历史条目
   */
  const getCurrentEntry = useCallback((): HistoryEntry | null => {
    if (state.currentIndex < 0 || state.currentIndex >= state.entries.length) {
      return null;
    }
    return state.entries[state.currentIndex];
  }, [state.currentIndex, state.entries]);

  /**
   * 获取历史记录列表（用于显示）
   */
  const getHistoryList = useCallback((): HistoryEntry[] => {
    return [...state.entries];
  }, [state.entries]);

  /**
   * 跳转到指定历史位置
   */
  const goToEntry = useCallback(
    (entryId: string): { entry: HistoryEntry; isForward: boolean } | null => {
      let result: { entry: HistoryEntry; isForward: boolean } | null = null;

      setState(prev => {
        const targetIndex = prev.entries.findIndex(e => e.id === entryId);
        if (targetIndex < 0) {
          return prev;
        }

        const targetEntry = prev.entries[targetIndex];
        const isForward = targetIndex > prev.currentIndex;

        result = { entry: targetEntry, isForward };

        const { canUndo, canRedo } = updateCanUndoRedo(prev.entries, targetIndex);

        return {
          ...prev,
          currentIndex: targetIndex,
          canUndo,
          canRedo,
        };
      });

      return result;
    },
    [updateCanUndoRedo]
  );

  /**
   * 格式化时间戳为可读时间
   */
  const formatTimestamp = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  /**
   * 获取操作类型的中文描述
   */
  const getOperationLabel = useCallback((type: OperationType): string => {
    const labels: Record<OperationType, string> = {
      create: '创建',
      modify: '修改',
      delete: '删除',
      style: '样式',
      chart: '图表',
    };
    return labels[type] || type;
  }, []);

  /**
   * 历史统计信息
   */
  const stats = useMemo(
    () => ({
      totalEntries: state.entries.length,
      currentPosition: state.currentIndex + 1,
      maxEntries: state.maxEntries,
      undoSteps: state.currentIndex + 1,
      redoSteps: state.entries.length - state.currentIndex - 1,
    }),
    [state.entries.length, state.currentIndex, state.maxEntries]
  );

  return {
    // 状态
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    historyLength: state.entries.length,
    currentIndex: state.currentIndex,
    stats,

    // 操作方法
    pushHistory,
    undo,
    redo,
    clearHistory,
    goToEntry,

    // 查询方法
    getCurrentEntry,
    getHistoryList,

    // 工具方法
    formatTimestamp,
    getOperationLabel,
  };
}

export type UseHistoryReturn = ReturnType<typeof useHistory>;
