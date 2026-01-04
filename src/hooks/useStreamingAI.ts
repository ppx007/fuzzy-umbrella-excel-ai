/**
 * 流式 AI Hook
 * 提供流式 AI 请求的状态管理和操作方法
 */

import { useState, useCallback, useRef } from 'react';
import { AIStreamService, StreamCallbacks, ChatMessage } from '@/services/ai-stream-service';
import { config as appConfig } from '@/config';

/**
 * 流式 AI Hook 配置
 */
export interface UseStreamingAIConfig {
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 温度参数 */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
}

/**
 * 流式 AI Hook 返回类型
 */
export interface UseStreamingAIReturn {
  /** 是否正在流式传输 */
  isStreaming: boolean;
  /** 当前已接收的内容（实时更新） */
  streamContent: string;
  /** 完整响应（流式完成后） */
  fullResponse: string | null;
  /** 错误信息 */
  error: string | null;
  /** 是否已完成 */
  isComplete: boolean;

  /** 发送单轮对话 */
  streamSingle: (systemPrompt: string, userPrompt: string) => Promise<string | null>;
  /** 发送多轮对话 */
  streamMulti: (
    systemPrompt: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    newMessage: string
  ) => Promise<string | null>;
  /** 发送自定义消息列表 */
  streamMessages: (messages: ChatMessage[]) => Promise<string | null>;
  /** 取消当前请求 */
  cancel: () => void;
  /** 重置状态 */
  reset: () => void;
  /** 清除错误 */
  clearError: () => void;
}

/**
 * 流式 AI Hook
 * @param config 配置项
 * @returns Hook 返回值
 */
export function useStreamingAI(config: UseStreamingAIConfig = {}): UseStreamingAIReturn {
  // 状态
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [fullResponse, setFullResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // 服务实例引用
  const serviceRef = useRef<AIStreamService | null>(null);

  // 获取或创建服务实例
  const getService = useCallback(() => {
    if (!serviceRef.current) {
      serviceRef.current = new AIStreamService({
        apiKey: appConfig.openai.apiKey,
        baseUrl: appConfig.openai.baseUrl,
        model: appConfig.openai.model,
        timeout: config.timeout || 60000,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    }
    return serviceRef.current;
  }, [config.timeout, config.temperature, config.maxTokens]);

  // 创建回调
  const createCallbacks = useCallback((): StreamCallbacks => {
    return {
      onStart: () => {
        setIsStreaming(true);
        setStreamContent('');
        setFullResponse(null);
        setError(null);
        setIsComplete(false);
      },
      onChunk: (_chunk, accumulated) => {
        setStreamContent(accumulated);
      },
      onComplete: full => {
        setFullResponse(full);
        setIsComplete(true);
        setIsStreaming(false);
      },
      onError: err => {
        setError(err.message);
        setIsStreaming(false);
      },
    };
  }, []);

  /**
   * 发送单轮对话
   */
  const streamSingle = useCallback(
    async (systemPrompt: string, userPrompt: string): Promise<string | null> => {
      try {
        const service = getService();
        const result = await service.streamSingleChat(systemPrompt, userPrompt, createCallbacks());
        return result;
      } catch (err) {
        // 错误已在回调中处理
        return null;
      }
    },
    [getService, createCallbacks]
  );

  /**
   * 发送多轮对话
   */
  const streamMulti = useCallback(
    async (
      systemPrompt: string,
      history: Array<{ role: 'user' | 'assistant'; content: string }>,
      newMessage: string
    ): Promise<string | null> => {
      try {
        const service = getService();
        const result = await service.streamMultiChat(
          systemPrompt,
          history,
          newMessage,
          createCallbacks()
        );
        return result;
      } catch (err) {
        // 错误已在回调中处理
        return null;
      }
    },
    [getService, createCallbacks]
  );

  /**
   * 发送自定义消息列表
   */
  const streamMessages = useCallback(
    async (messages: ChatMessage[]): Promise<string | null> => {
      try {
        const service = getService();
        const result = await service.streamChat(messages, createCallbacks());
        return result;
      } catch (err) {
        // 错误已在回调中处理
        return null;
      }
    },
    [getService, createCallbacks]
  );

  /**
   * 取消当前请求
   */
  const cancel = useCallback(() => {
    serviceRef.current?.abort();
    setIsStreaming(false);
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    cancel();
    setStreamContent('');
    setFullResponse(null);
    setError(null);
    setIsComplete(false);
  }, [cancel]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isStreaming,
    streamContent,
    fullResponse,
    error,
    isComplete,
    streamSingle,
    streamMulti,
    streamMessages,
    cancel,
    reset,
    clearError,
  };
}

export default useStreamingAI;
