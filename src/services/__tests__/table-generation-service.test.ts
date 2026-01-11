/**
 * 表格生成服务单元测试
 * 测试新的 key/title 数据结构和验证机制
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableGenerationService } from '../table-generation-service';
import type { TableGenerationRequest, StyledTableGenerationRequest } from '@/types/common';

// Mock fetch
global.fetch = vi.fn();

// Mock config
vi.mock('@/config', () => ({
  config: {
    openai: {
      apiKey: 'test-api-key',
      baseUrl: 'https://api.openai.com',
      model: 'gpt-4',
    },
  },
}));

describe('TableGenerationService', () => {
  let service: TableGenerationService;

  beforeEach(() => {
    service = new TableGenerationService();
    vi.clearAllMocks();
  });

  describe('generateTable', () => {
    it('应该成功生成基础表格', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"{\\"table\\":{\\"title\\":\\"员工表\\",\\"columns\\":[{\\"key\\":\\"name\\",\\"title\\":\\"姓名\\",\\"type\\":\\"text\\"},{\\"key\\":\\"age\\",\\"title\\":\\"年龄\\",\\"type\\":\\"number\\"}],\\"rows\\":[{\\"name\\":\\"张三\\",\\"age\\":25},{\\"name\\":\\"李四\\",\\"age\\":30}]}}"}}'
                ),
              })
              .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn(),
          }),
        },
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const request: TableGenerationRequest = {
        prompt: '创建一个员工表格',
        options: { rowCount: 2, language: 'zh' },
      };

      const result = await service.generateTable(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.tableName).toBe('员工表');
      expect(result.data!.columns).toHaveLength(2);
      expect(result.data!.rows).toHaveLength(2);
      
      // 验证key-title对应关系
      expect(result.data!.columns[0].key).toBe('name');
      expect(result.data!.columns[0].title).toBe('姓名');
      expect(result.data!.columns[1].key).toBe('age');
      expect(result.data!.columns[1].title).toBe('年龄');
      
      // 验证数据行使用正确的key
      expect(result.data!.rows[0]).toHaveProperty('name');
      expect(result.data!.rows[0]).toHaveProperty('age');
      expect(result.data!.rows[0].name).toBe('张三');
      expect(result.data!.rows[0].age).toBe(25);
    });

    it('应该处理AI返回的无效JSON', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"无效的JSON内容"}}'
                ),
              })
              .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn(),
          }),
        },
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const request: TableGenerationRequest = {
        prompt: '创建一个表格',
      };

      const result = await service.generateTable(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI 返回了非 JSON 格式的响应');
    });

    it('应该验证表格数据结构', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"{\\"table\\":{\\"title\\":\\"\\",\\"columns\\":[],\\"rows\\":[]}}"}}'
                ),
              })
              .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn(),
          }),
        },
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const request: TableGenerationRequest = {
        prompt: '创建一个表格',
      };

      const result = await service.generateTable(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('数据格式不正确');
    });

    it('应该处理网络错误并重试', async () => {
      // 第一次请求失败
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        // 第二次请求成功
        .mockResolvedValueOnce({
          ok: true,
          body: {
            getReader: () => ({
              read: vi
                .fn()
                .mockResolvedValueOnce({
                  done: false,
                  value: new TextEncoder().encode(
                    'data: {"choices":[{"delta":{"content":"{\\"table\\":{\\"title\\":\\"测试表\\",\\"columns\\":[{\\"key\\":\\"test\\",\\"title\\":\\"测试\\",\\"type\\":\\"text\\"}],\\"rows\\":[{\\"test\\":\\"值\\"}]}}"}}'
                  ),
                })
                .mockResolvedValueOnce({ done: true, value: undefined }),
              releaseLock: vi.fn(),
            }),
          },
        });

      const request: TableGenerationRequest = {
        prompt: '创建一个表格',
      };

      const result = await service.generateTable(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('应该处理API密钥无效错误', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: vi.fn().mockResolvedValue(''),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const request: TableGenerationRequest = {
        prompt: '创建一个表格',
      };

      const result = await service.generateTable(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API密钥无效或已过期');
      expect(global.fetch).toHaveBeenCalledTimes(1); // 不重试401错误
    });

    it('应该处理请求超时错误', async () => {
      const mockResponse = {
        ok: false,
        status: 524,
        statusText: 'Timeout',
        text: vi.fn().mockResolvedValue(''),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const request: TableGenerationRequest = {
        prompt: '创建一个表格',
      };

      const result = await service.generateTable(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API多次请求超时');
      expect(global.fetch).toHaveBeenCalledTimes(3); // 最大重试次数
    });
  });

  describe('generateStyledTable', () => {
    it('应该成功生成带样式的表格', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"{\\"table\\":{\\"title\\":\\"销售报表\\",\\"columns\\":[{\\"key\\":\\"product\\",\\"title\\":\\"产品\\",\\"type\\":\\"text\\"},{\\"key\\":\\"sales\\",\\"title\\":\\"销售额\\",\\"type\\":\\"currency\\"}],\\"rows\\":[{\\"product\\":\\"产品A\\",\\"sales\\":1000}]},\\"style\\":{\\"colorTheme\\":\\"professional\\",\\"header\\":{\\"backgroundColor\\":\\"#4472C4\\",\\"fontColor\\":\\"#FFFFFF\\"}}}}"}}'
                ),
              })
              .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn(),
          }),
        },
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const request: StyledTableGenerationRequest = {
        prompt: '创建一个销售报表',
        stylePreference: {
          theme: 'professional',
          enableConditionalFormat: true,
        },
      };

      const result = await service.generateStyledTable(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.tableName).toBe('销售报表');
      expect(result.data!.style).toBeDefined();
      expect(result.data!.style!.colorTheme).toBe('professional');
    });

    it('应该处理没有样式信息的响应', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"{\\"table\\":{\\"title\\":\\"基础表\\",\\"columns\\":[{\\"key\\":\\"test\\",\\"title\\":\\"测试\\",\\"type\\":\\"text\\"}],\\"rows\\":[{\\"test\\":\\"值\\"}]}}"}}'
                ),
              })
              .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn(),
          }),
        },
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const request: StyledTableGenerationRequest = {
        prompt: '创建一个基础表格',
      };

      const result = await service.generateStyledTable(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // 没有样式信息时，style字段可能不存在
      expect(result.data!.style).toBeUndefined();
    });
  });

  describe('数据验证和清理', () => {
    it('应该清理重复的列key', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"{\\"table\\":{\\"title\\":\\"重复列测试\\",\\"columns\\":[{\\"key\\":\\"name\\",\\"title\\":\\"姓名\\",\\"type\\":\\"text\\"},{\\"key\\":\\"name\\",\\"title\\":\\"名称\\",\\"type\\":\\"text\\"}],\\"rows\\":[{\\"name\\":\\"张三\\"}]}}"}}'
                ),
              })
              .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn(),
          }),
        },
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const request: TableGenerationRequest = {
        prompt: '创建一个表格',
      };

      const result = await service.generateTable(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // 重复的key应该被重命名
      const keys = result.data!.columns.map(col => col.key);
      expect(keys).toContain('name');
      expect(keys).toContain('name_1');
    });

    it('应该清理数据中的控制字符', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"{\\"table\\":{\\"title\\":\\"控制字符测试\\",\\"columns\\":[{\\"key\\":\\"text\\",\\"title\\":\\"文本\\",\\"type\\":\\"text\\"}],\\"rows\\":[{\\"text\\":\\"包含\\t\\n\\r字符的文本\\"}]}}"}}'
                ),
              })
              .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn(),
          }),
        },
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const request: TableGenerationRequest = {
        prompt: '创建一个表格',
      };

      const result = await service.generateTable(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // 控制字符应该被清理
      expect(result.data!.rows[0].text).toBe('包含字符的文本');
    });

    it('应该处理缺失的列数据', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"{\\"table\\":{\\"title\\":\\"缺失数据测试\\",\\"columns\\":[{\\"key\\":\\"name\\",\\"title\\":\\"姓名\\",\\"type\\":\\"text\\"},{\\"key\\":\\"age\\",\\"title\\":\\"年龄\\",\\"type\\":\\"number\\",\\"defaultValue\\":0}],\\"rows\\":[{\\"name\\":\\"张三\\"}]}}"}}'
                ),
              })
              .mockResolvedValueOnce({ done: true, value: undefined }),
            releaseLock: vi.fn(),
          }),
        },
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const request: TableGenerationRequest = {
        prompt: '创建一个表格',
      };

      const result = await service.generateTable(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // 缺失的列应该使用默认值
      expect(result.data!.rows[0].name).toBe('张三');
      expect(result.data!.rows[0].age).toBe(0); // 使用默认值
    });
  });

  describe('服务配置', () => {
    it('应该正确检查服务可用性', () => {
      expect(service.isAvailable()).toBe(true);

      // 测试没有API密钥的情况
      const serviceNoKey = new TableGenerationService();
      (serviceNoKey as any).apiKey = '';
      expect(serviceNoKey.isAvailable()).toBe(false);

      // 测试没有基础URL的情况
      const serviceNoUrl = new TableGenerationService();
      (serviceNoUrl as any).baseUrl = '';
      expect(serviceNoUrl.isAvailable()).toBe(false);
    });

    it('应该支持更新配置', () => {
      service.updateConfig({
        apiKey: 'new-api-key',
        baseUrl: 'https://new-api.com',
        model: 'new-model',
      });

      expect((service as any).apiKey).toBe('new-api-key');
      expect((service as any).baseUrl).toBe('https://new-api.com');
      expect((service as any).model).toBe('new-model');
    });

    it('应该清理模型名称前缀', () => {
      service.updateConfig({
        model: '假流式/gpt-4',
      });

      expect((service as any).model).toBe('gpt-4');
    });
  });
});