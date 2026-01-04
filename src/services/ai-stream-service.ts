/**
 * 流式 AI 服务
 * 使用 Server-Sent Events (SSE) 实现流式输出
 * 支持 60 秒超时和实时进度回调
 */

import { config as appConfig } from '@/config';

/**
 * 流式请求配置
 */
export interface StreamConfig {
  /** API 密钥 */
  apiKey?: string;
  /** API 基础 URL */
  baseUrl?: string;
  /** 模型名称 */
  model?: string;
  /** 超时时间（毫秒），默认 60000 */
  timeout?: number;
  /** 温度参数 */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
}

/**
 * 流式回调
 */
export interface StreamCallbacks {
  /** 收到新内容块时调用 */
  onChunk?: (chunk: string, accumulated: string) => void;
  /** 完成时调用 */
  onComplete?: (fullResponse: string) => void;
  /** 错误时调用 */
  onError?: (error: Error) => void;
  /** 开始时调用 */
  onStart?: () => void;
}

/**
 * 消息格式
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 流式请求状态
 */
export interface StreamState {
  /** 是否正在流式传输 */
  isStreaming: boolean;
  /** 累积的响应内容 */
  content: string;
  /** 错误信息 */
  error: string | null;
  /** 是否已完成 */
  isComplete: boolean;
}

/**
 * 流式 AI 服务类
 */
export class AIStreamService {
  private config: Required<StreamConfig>;
  private abortController: AbortController | null = null;

  constructor(config: StreamConfig = {}) {
    this.config = {
      apiKey: config.apiKey || appConfig.openai.apiKey,
      baseUrl: config.baseUrl || appConfig.openai.baseUrl,
      model: config.model || appConfig.openai.model,
      timeout: config.timeout || 60000, // 默认 60 秒
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 8192,
    };
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return Boolean(this.config.apiKey && this.config.baseUrl);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<StreamConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * 取消当前请求
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * 发送流式请求
   * @param messages 消息列表
   * @param callbacks 回调函数
   * @returns 完整响应文本
   */
  async streamChat(messages: ChatMessage[], callbacks: StreamCallbacks = {}): Promise<string> {
    // 创建新的 AbortController
    this.abort(); // 先取消之前的请求
    this.abortController = new AbortController();

    const { onChunk, onComplete, onError, onStart } = callbacks;

    // 设置超时
    const timeoutId = setTimeout(() => {
      this.abort();
      const error = new Error(`请求超时 (${this.config.timeout / 1000}秒)`);
      onError?.(error);
    }, this.config.timeout);

    try {
      onStart?.();

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: true,
        }),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      // 处理 SSE 流
      const fullResponse = await this.processStream(response, onChunk);

      onComplete?.(fullResponse);
      return fullResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const abortError = new Error('请求已取消');
          onError?.(abortError);
          throw abortError;
        }
        onError?.(error);
        throw error;
      }

      const unknownError = new Error('未知错误');
      onError?.(unknownError);
      throw unknownError;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * 便捷方法：发送单轮对话
   */
  async streamSingleChat(
    systemPrompt: string,
    userPrompt: string,
    callbacks: StreamCallbacks = {}
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
    return this.streamChat(messages, callbacks);
  }

  /**
   * 便捷方法：发送多轮对话
   */
  async streamMultiChat(
    systemPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    newUserMessage: string,
    callbacks: StreamCallbacks = {}
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: newUserMessage },
    ];
    return this.streamChat(messages, callbacks);
  }

  /**
   * 处理 SSE 流
   */
  private async processStream(
    response: Response,
    onChunk?: (chunk: string, accumulated: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // 解码数据块
        buffer += decoder.decode(value, { stream: true });

        // 按行分割处理
        const lines = buffer.split('\n');
        // 保留最后一个可能不完整的行
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6); // 移除 'data: ' 前缀

          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              fullResponse += content;
              onChunk?.(content, fullResponse);
            }
          } catch {
            // 忽略 JSON 解析错误（可能是不完整的数据）
            console.debug('[AIStreamService] 跳过无效 JSON:', data);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  }
}

/**
 * 默认流式 AI 服务实例
 */
export const aiStreamService = new AIStreamService();

/**
 * 便捷函数：流式单轮对话
 */
export async function streamChat(
  systemPrompt: string,
  userPrompt: string,
  callbacks?: StreamCallbacks,
  config?: StreamConfig
): Promise<string> {
  const service = config ? new AIStreamService(config) : aiStreamService;
  return service.streamSingleChat(systemPrompt, userPrompt, callbacks);
}

/**
 * 便捷函数：流式多轮对话
 */
export async function streamMultiTurnChat(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  newMessage: string,
  callbacks?: StreamCallbacks,
  config?: StreamConfig
): Promise<string> {
  const service = config ? new AIStreamService(config) : aiStreamService;
  return service.streamMultiChat(systemPrompt, history, newMessage, callbacks);
}
