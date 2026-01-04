/**
 * 对话管理 Hook - 支持连续对话上下文
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  ConversationMessage,
  ConversationContext,
  ConversationState,
  MessageRole,
  OperationType,
} from '@/types/common';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 从消息中提取标题（取前20个字符）
 */
function extractTitle(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 20) {
    return trimmed;
  }
  return trimmed.slice(0, 20) + '...';
}

/**
 * 对话管理 Hook
 */
export function useConversation() {
  const [state, setState] = useState<ConversationState>({
    currentConversation: null,
    conversationHistory: [],
    isLoading: false,
    error: null,
  });

  /**
   * 开始新对话
   */
  const startNewConversation = useCallback(
    (activeTableAddress?: string, activeSheetName?: string): ConversationContext => {
      const now = Date.now();
      const newConversation: ConversationContext = {
        conversationId: generateId(),
        messages: [],
        activeTableAddress,
        activeSheetName,
        createdAt: now,
        updatedAt: now,
      };

      setState(prev => {
        // 保存当前对话到历史
        const history = prev.currentConversation
          ? [...(prev.conversationHistory || []), prev.currentConversation]
          : prev.conversationHistory || [];

        return {
          ...prev,
          currentConversation: newConversation,
          conversationHistory: history,
          error: null,
        };
      });

      return newConversation;
    },
    []
  );

  /**
   * 添加消息到当前对话
   */
  const addMessage = useCallback(
    (
      role: MessageRole,
      content: string,
      tableOperation?: {
        type: OperationType;
        tableAddress?: string;
        success: boolean;
      },
      isStreaming: boolean = false
    ): ConversationMessage | null => {
      const message: ConversationMessage = {
        id: generateId(),
        role,
        content,
        timestamp: Date.now(),
        tableOperation,
        isStreaming,
      };

      setState(prev => {
        if (!prev.currentConversation) {
          // 自动创建新对话
          const now = Date.now();
          const newConversation: ConversationContext = {
            conversationId: generateId(),
            messages: [message],
            createdAt: now,
            updatedAt: now,
            title: role === 'user' ? extractTitle(content) : undefined,
          };
          return {
            ...prev,
            currentConversation: newConversation,
            error: null,
          };
        }

        const updatedMessages = [...prev.currentConversation.messages, message];
        const updatedConversation: ConversationContext = {
          ...prev.currentConversation,
          messages: updatedMessages,
          updatedAt: Date.now(),
          // 如果是第一条用户消息，设置标题
          title:
            prev.currentConversation.title || (role === 'user' ? extractTitle(content) : undefined),
        };

        return {
          ...prev,
          currentConversation: updatedConversation,
          error: null,
        };
      });

      return message;
    },
    []
  );

  /**
   * 更新流式消息内容
   */
  const updateStreamingMessage = useCallback(
    (messageId: string, content: string, isComplete: boolean = false) => {
      setState(prev => {
        if (!prev.currentConversation) {
          return prev;
        }

        const updatedMessages = prev.currentConversation.messages.map(msg =>
          msg.id === messageId ? { ...msg, content, isStreaming: !isComplete } : msg
        );

        return {
          ...prev,
          currentConversation: {
            ...prev.currentConversation,
            messages: updatedMessages,
            updatedAt: Date.now(),
          },
        };
      });
    },
    []
  );

  /**
   * 设置活动表格
   */
  const setActiveTable = useCallback((tableAddress: string, sheetName: string) => {
    setState(prev => {
      if (!prev.currentConversation) {
        return prev;
      }

      return {
        ...prev,
        currentConversation: {
          ...prev.currentConversation,
          activeTableAddress: tableAddress,
          activeSheetName: sheetName,
          updatedAt: Date.now(),
        },
      };
    });
  }, []);

  /**
   * 设置加载状态
   */
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading,
    }));
  }, []);

  /**
   * 设置错误
   */
  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false,
    }));
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * 获取用于 AI 的消息历史（格式化为 API 需要的格式）
   */
  const getMessagesForAI = useCallback(
    (
      maxMessages: number = 10
    ): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> => {
      if (!state.currentConversation) {
        return [];
      }

      // 只取最近的消息，避免上下文过长
      const recentMessages = state.currentConversation.messages.slice(-maxMessages);

      return recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
    },
    [state.currentConversation]
  );

  /**
   * 删除最后一条消息（用于重试）
   */
  const removeLastMessage = useCallback(() => {
    setState(prev => {
      if (!prev.currentConversation || prev.currentConversation.messages.length === 0) {
        return prev;
      }

      const updatedMessages = prev.currentConversation.messages.slice(0, -1);

      return {
        ...prev,
        currentConversation: {
          ...prev.currentConversation,
          messages: updatedMessages,
          updatedAt: Date.now(),
        },
      };
    });
  }, []);

  /**
   * 清空当前对话
   */
  const clearCurrentConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentConversation: null,
      error: null,
    }));
  }, []);

  /**
   * 恢复历史对话
   */
  const restoreConversation = useCallback((conversationId: string) => {
    setState(prev => {
      const found = prev.conversationHistory?.find(c => c.conversationId === conversationId);
      if (!found) {
        return prev;
      }

      // 将当前对话保存到历史，恢复目标对话
      const newHistory = (prev.conversationHistory || []).filter(
        c => c.conversationId !== conversationId
      );

      if (prev.currentConversation) {
        newHistory.push(prev.currentConversation);
      }

      return {
        ...prev,
        currentConversation: found,
        conversationHistory: newHistory,
        error: null,
      };
    });
  }, []);

  /**
   * 删除历史对话
   */
  const deleteConversation = useCallback((conversationId: string) => {
    setState(prev => ({
      ...prev,
      conversationHistory: (prev.conversationHistory || []).filter(
        c => c.conversationId !== conversationId
      ),
    }));
  }, []);

  /**
   * 对话统计信息
   */
  const stats = useMemo(
    () => ({
      messageCount: state.currentConversation?.messages.length || 0,
      userMessageCount:
        state.currentConversation?.messages.filter(m => m.role === 'user').length || 0,
      assistantMessageCount:
        state.currentConversation?.messages.filter(m => m.role === 'assistant').length || 0,
      hasActiveTable: !!state.currentConversation?.activeTableAddress,
      conversationHistoryCount: state.conversationHistory?.length || 0,
    }),
    [state.currentConversation, state.conversationHistory]
  );

  /**
   * 格式化消息时间
   */
  const formatMessageTime = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return '刚刚';
    }
    if (diffMins < 60) {
      return `${diffMins}分钟前`;
    }
    if (diffMins < 1440) {
      // 24小时内
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  return {
    // 状态
    currentConversation: state.currentConversation,
    conversationHistory: state.conversationHistory,
    isLoading: state.isLoading,
    error: state.error,
    stats,

    // 对话管理
    startNewConversation,
    clearCurrentConversation,
    restoreConversation,
    deleteConversation,

    // 消息管理
    addMessage,
    updateStreamingMessage,
    removeLastMessage,
    getMessagesForAI,

    // 表格关联
    setActiveTable,

    // 状态管理
    setLoading,
    setError,
    clearError,

    // 工具方法
    formatMessageTime,
  };
}

export type UseConversationReturn = ReturnType<typeof useConversation>;
