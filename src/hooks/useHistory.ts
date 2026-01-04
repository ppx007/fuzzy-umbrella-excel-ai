/**
 * 历史管理 Hook - 支持撤销/重做功能
 * 最多保存50条历史记录
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
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
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
  const updateCanUndoRedo = useCallback((entries: HistoryEntry[], currentIndex: number) => {
    return {
      canUndo: currentIndex >= 0,
      canRedo: currentIndex < entries.length - 1,
    };
  }, []);

  /**
   * 添加历史记录
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
        // 如果当前不在最新位置，删除后面的历史记录
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
   * 返回要恢复的表格快照
   */
  const undo = useCallback((): TableSnapshot | null => {
    let snapshotToRestore: TableSnapshot | null = null;

    setState(prev => {
      if (!prev.canUndo || prev.currentIndex < 0) {
        return prev;
      }

      const currentEntry = prev.entries[prev.currentIndex];
      snapshotToRestore = currentEntry.beforeState;

      const newIndex = prev.currentIndex - 1;
      const { canUndo, canRedo } = updateCanUndoRedo(prev.entries, newIndex);

      return {
        ...prev,
        currentIndex: newIndex,
        canUndo,
        canRedo,
      };
    });

    return snapshotToRestore;
  }, [updateCanUndoRedo]);

  /**
   * 重做操作
   * 返回要恢复的表格快照
   */
  const redo = useCallback((): TableSnapshot | null => {
    let snapshotToRestore: TableSnapshot | null = null;

    setState(prev => {
      if (!prev.canRedo || prev.currentIndex >= prev.entries.length - 1) {
        return prev;
      }

      const newIndex = prev.currentIndex + 1;
      const entryToRedo = prev.entries[newIndex];
      snapshotToRestore = entryToRedo.afterState;

      const { canUndo, canRedo } = updateCanUndoRedo(prev.entries, newIndex);

      return {
        ...prev,
        currentIndex: newIndex,
        canUndo,
        canRedo,
      };
    });

    return snapshotToRestore;
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
    (entryId: string): TableSnapshot | null => {
      let snapshotToRestore: TableSnapshot | null = null;

      setState(prev => {
        const targetIndex = prev.entries.findIndex(e => e.id === entryId);
        if (targetIndex < 0) {
          return prev;
        }

        const targetEntry = prev.entries[targetIndex];
        snapshotToRestore = targetEntry.afterState;

        const { canUndo, canRedo } = updateCanUndoRedo(prev.entries, targetIndex);

        return {
          ...prev,
          currentIndex: targetIndex,
          canUndo,
          canRedo,
        };
      });

      return snapshotToRestore;
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
