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
   * 发送流式请求（带自动重试机制）
   * @param messages 消息列表
   * @param callbacks 回调函数
   * @param maxRetries 最大重试次数（默认3次）
   * @returns 完整响应文本
   */
  async streamChat(
    messages: ChatMessage[],
    callbacks: StreamCallbacks = {},
    maxRetries: number = 3
  ): Promise<string> {
    const { onChunk, onComplete, onError, onStart } = callbacks;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // 创建新的 AbortController
      this.abort(); // 先取消之前的请求
      this.abortController = new AbortController();

      // 设置超时
      const timeoutId = setTimeout(() => {
        this.abort();
      }, this.config.timeout);

      try {
        if (attempt === 1) {
          onStart?.();
        } else {
          console.log(`[AIStreamService] 第 ${attempt}/${maxRetries} 次重试...`);
        }

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
          const errorText = await response.text().catch(() => '');
          let errorMessage = response.statusText;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch {
            if (errorText) {
              errorMessage = errorText.substring(0, 200);
            }
          }

          // 524 错误可以重试
          if (response.status === 524) {
            lastError = new Error(`API请求超时 (524)，第 ${attempt} 次尝试失败`);
            console.warn(`[AIStreamService] ${lastError.message}，将重试...`);
            if (attempt < maxRetries) {
              const delay = attempt * 2000;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            const finalError = new Error('API多次请求超时 (524)，服务器响应太慢，请稍后重试');
            onError?.(finalError);
            throw finalError;
          }

          // 401 错误不重试
          if (response.status === 401) {
            const authError = new Error('API密钥无效或已过期，请在设置中检查API密钥');
            onError?.(authError);
            throw authError;
          }

          // 429 错误可以重试
          if (response.status === 429) {
            lastError = new Error('请求过于频繁');
            if (attempt < maxRetries) {
              const delay = attempt * 3000;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            const rateLimitError = new Error('请求过于频繁，请稍后重试');
            onError?.(rateLimitError);
            throw rateLimitError;
          }

          // 502, 503, 504 错误可以重试
          if ([502, 503, 504].includes(response.status)) {
            lastError = new Error(`服务器暂时不可用 (${response.status})`);
            if (attempt < maxRetries) {
              const delay = attempt * 2000;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            const serverError = new Error(`服务器暂时不可用 (${response.status})，请稍后重试`);
            onError?.(serverError);
            throw serverError;
          }

          const apiError = new Error(`API请求失败: ${response.status} - ${errorMessage}`);
          onError?.(apiError);
          throw apiError;
        }

        // 处理 SSE 流
        const fullResponse = await this.processStream(response, onChunk);

        console.log(`[AIStreamService] 第 ${attempt} 次请求成功！`);
        onComplete?.(fullResponse);
        return fullResponse;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
          // 用户主动取消，不重试
          if (error.name === 'AbortError') {
            // 检查是否是超时导致的取消
            if (attempt < maxRetries) {
              lastError = new Error(`请求超时，第 ${attempt} 次尝试失败`);
              console.warn(`[AIStreamService] ${lastError.message}，将重试...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              continue;
            }
            const timeoutError = new Error('请求多次超时，请检查网络连接或稍后重试');
            onError?.(timeoutError);
            throw timeoutError;
          }

          // 如果是已经处理过的错误（包含特定关键词），直接抛出
          if (
            error.message.includes('API密钥') ||
            error.message.includes('多次') ||
            error.message.includes('请稍后重试')
          ) {
            throw error;
          }

          lastError = error;
        }

        // 其他错误，尝试重试
        if (attempt < maxRetries) {
          console.warn(`[AIStreamService] 请求失败，将进行第 ${attempt + 1} 次重试...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
      } finally {
        this.abortController = null;
      }
    }

    const finalError = lastError || new Error('请求失败，请稍后重试');
    onError?.(finalError);
    throw finalError;
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
