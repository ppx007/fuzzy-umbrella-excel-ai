/**
 * NLP处理器
 * 整合分词、意图识别、实体提取
 */

import { NLPResult, AttendanceIntent, ExtractedEntities, ProcessingContext } from '@/types';
import { tokenizer, Token } from './tokenizer';
import { recognizeIntent } from './rules/intents';
import { extractEntities } from './rules/entities';
import { aiService, GeneratedTable } from '@/services';
import { config as appConfig } from '@/config';

/**
 * NLP处理器配置
 */
export interface NLPProcessorConfig {
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 最小置信度阈值 */
  minConfidence?: number;
  /** 是否使用上下文 */
  useContext?: boolean;
}

/**
 * 处理结果详情
 */
export interface ProcessingDetails {
  /** 分词结果 */
  tokens: Token[];
  /** 关键词 */
  keywords: string[];
  /** 匹配的规则ID */
  matchedRuleId?: string;
  /** 处理时间(ms) */
  processingTime: number;
}

/**
 * NLP处理器类
 */
export class NLPProcessor {
  private config: NLPProcessorConfig;
  private context: ProcessingContext | null = null;
  private nlpMode: 'local' | 'api' | 'hybrid';

  constructor(config: NLPProcessorConfig = {}) {
    this.config = {
      debug: appConfig.debug,
      minConfidence: appConfig.confidenceThreshold,
      useContext: true,
      ...config,
    };
    this.nlpMode = appConfig.nlpMode;
  }

  /**
   * 处理用户输入
   */
  process(input: string, context?: ProcessingContext): NLPResult {
    const startTime = Date.now();

    // 设置上下文
    if (context) {
      this.context = context;
    }

    // 预处理输入
    const normalizedInput = this.normalizeInput(input);

    // 分词
    const tokens = tokenizer.tokenize(normalizedInput);
    const keywords = tokenizer.getKeywords(normalizedInput);

    // 意图识别
    const intentResult = recognizeIntent(normalizedInput);

    // 实体提取
    const entities = extractEntities(normalizedInput);

    // 结合上下文补充信息
    if (this.config.useContext && this.context) {
      this.enrichWithContext(entities);
    }

    // 构建参数
    const parameters = this.buildParameters(entities);

    // 构建结果
    const result: NLPResult = {
      rawInput: input,
      originalInput: input,
      normalizedInput,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      entities,
      parameters,
      matchedRuleId: intentResult.matchedRule?.id,
    };

    // 调试信息
    if (this.config.debug) {
      const processingTime = Date.now() - startTime;
      console.log('[NLP Debug]', {
        input,
        normalizedInput,
        tokens: tokens.map(t => `${t.word}/${t.pos}`).join(' '),
        keywords,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        entities,
        processingTime: `${processingTime}ms`,
      });
    }

    return result;
  }

  /**
   * 处理并返回详细信息
   */
  processWithDetails(input: string): { result: NLPResult; details: ProcessingDetails } {
    const startTime = Date.now();

    const normalizedInput = this.normalizeInput(input);
    const tokens = tokenizer.tokenize(normalizedInput);
    const keywords = tokenizer.getKeywords(normalizedInput);
    const intentResult = recognizeIntent(normalizedInput);
    const entities = extractEntities(normalizedInput);

    if (this.config.useContext && this.context) {
      this.enrichWithContext(entities);
    }

    const processingTime = Date.now() - startTime;
    const parameters = this.buildParameters(entities);

    const result: NLPResult = {
      rawInput: input,
      originalInput: input,
      normalizedInput,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      entities,
      parameters,
      matchedRuleId: intentResult.matchedRule?.id,
    };

    const details: ProcessingDetails = {
      tokens,
      keywords,
      matchedRuleId: intentResult.matchedRule?.id,
      processingTime,
    };

    return { result, details };
  }

  /**
   * 构建参数对象
   */
  private buildParameters(entities: ExtractedEntities): NLPResult['parameters'] {
    const parameters: NLPResult['parameters'] = {};

    if (entities.dateRange) {
      parameters.dateRange = entities.dateRange;
    }

    if (entities.employees) {
      parameters.employees = entities.employees;
    }

    if (entities.department) {
      parameters.departments = [entities.department];
    }

    if (entities.chartType) {
      // 转换图表类型
      const chartTypeMap: Record<string, 'pie' | 'bar' | 'line'> = {
        PIE_ATTENDANCE: 'pie',
        BAR_ATTENDANCE: 'bar',
        BAR_EMPLOYEE: 'bar',
        LINE_TREND: 'line',
      };
      parameters.chartType = chartTypeMap[entities.chartType] || 'bar';
    }

    if (entities.templateType) {
      parameters.templateType = entities.templateType;
    }

    return parameters;
  }

  /**
   * 输入预处理
   */
  private normalizeInput(input: string): string {
    let normalized = input.trim();

    // 全角转半角
    normalized = normalized.replace(/[\uff01-\uff5e]/g, char => {
      return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
    });

    // 统一空白字符
    normalized = normalized.replace(/\s+/g, ' ');

    // 移除多余标点
    normalized = normalized.replace(/[。！？，、；：]+$/g, '');

    // 数字标准化
    normalized = this.normalizeNumbers(normalized);

    return normalized;
  }

  /**
   * 数字标准化
   */
  private normalizeNumbers(input: string): string {
    const chineseNums: Record<string, string> = {
      零: '0',
      一: '1',
      二: '2',
      三: '3',
      四: '4',
      五: '5',
      六: '6',
      七: '7',
      八: '8',
      九: '9',
      十: '10',
      两: '2',
    };

    let result = input;

    // 处理"十几"的情况
    result = result.replace(/十([一二三四五六七八九])/g, (_, digit) => {
      return `1${chineseNums[digit]}`;
    });

    // 处理"几十"的情况
    result = result.replace(/([一二三四五六七八九])十/g, (_, digit) => {
      return `${chineseNums[digit]}0`;
    });

    // 处理单独的"十"
    result = result.replace(/十/g, '10');

    // 处理其他中文数字
    for (const [cn, num] of Object.entries(chineseNums)) {
      result = result.replace(new RegExp(cn, 'g'), num);
    }

    return result;
  }

  /**
   * 使用上下文补充实体信息
   */
  private enrichWithContext(entities: ExtractedEntities): void {
    if (!this.context) return;

    // 如果没有日期范围，使用上下文中的
    if (!entities.dateRange && this.context.lastDateRange) {
      entities.dateRange = this.context.lastDateRange;
    }

    // 如果没有员工列表，使用上下文中的
    if (!entities.employees && this.context.lastEmployees) {
      entities.employees = this.context.lastEmployees;
    }

    // 如果没有部门，使用上下文中的
    if (!entities.department && this.context.lastDepartment) {
      entities.department = this.context.lastDepartment;
    }
  }

  /**
   * 设置上下文
   */
  setContext(context: ProcessingContext): void {
    this.context = context;
  }

  /**
   * 更新上下文
   */
  updateContext(result: NLPResult): void {
    if (!this.context) {
      this.context = {};
    }

    if (result.entities.dateRange) {
      this.context.lastDateRange = result.entities.dateRange;
    }
    if (result.entities.employees) {
      this.context.lastEmployees = result.entities.employees;
    }
    if (result.entities.department) {
      this.context.lastDepartment = result.entities.department;
    }

    this.context.lastIntent = result.intent;
  }

  /**
   * 清除上下文
   */
  clearContext(): void {
    this.context = null;
  }

  /**
   * 获取意图建议
   */
  getSuggestions(partialInput: string): string[] {
    const suggestions: string[] = [];
    const normalized = this.normalizeInput(partialInput);

    // 基于当前输入提供建议
    if (/生成|创建|制作/.test(normalized)) {
      if (!/考勤/.test(normalized)) {
        suggestions.push('生成考勤表');
        suggestions.push('生成月度考勤汇总');
      } else if (!/月|周|日/.test(normalized)) {
        suggestions.push(`${normalized}月报`);
        suggestions.push(`${normalized}周报`);
        suggestions.push(`${normalized}日报`);
      }
    }

    if (/导入/.test(normalized) && !/数据|文件/.test(normalized)) {
      suggestions.push('导入考勤数据');
      suggestions.push('导入Excel文件');
    }

    if (/统计|汇总/.test(normalized)) {
      suggestions.push('统计本月出勤率');
      suggestions.push('汇总部门考勤');
    }

    if (/图表|图/.test(normalized)) {
      suggestions.push('生成出勤率饼图');
      suggestions.push('生成考勤趋势图');
    }

    return suggestions.slice(0, 5);
  }

  /**
   * 验证意图是否可执行
   */
  validateIntent(result: NLPResult): { valid: boolean; missingEntities: string[] } {
    const missingEntities: string[] = [];

    switch (result.intent) {
      case AttendanceIntent.CREATE_DAILY:
      case AttendanceIntent.CREATE_WEEKLY:
      case AttendanceIntent.CREATE_MONTHLY:
        if (!result.entities.dateRange) {
          missingEntities.push('日期范围');
        }
        break;

      case AttendanceIntent.CREATE_SUMMARY:
        if (!result.entities.dateRange) {
          missingEntities.push('日期范围');
        }
        break;

      case AttendanceIntent.GENERATE_CHART:
        if (!result.entities.chartType) {
          missingEntities.push('图表类型');
        }
        break;

      case AttendanceIntent.QUERY_EMPLOYEE:
        if (!result.entities.employees && !result.entities.department) {
          missingEntities.push('员工或部门');
        }
        break;
    }

    return {
      valid: missingEntities.length === 0,
      missingEntities,
    };
  }

  /**
   * 使用AI处理用户输入
   */
  async processWithAI(input: string): Promise<{
    result: NLPResult;
    table?: GeneratedTable;
    error?: string;
  }> {
    const localResult = this.process(input);

    if (this.nlpMode === 'local') {
      return { result: localResult };
    }

    if (!aiService.isAvailable()) {
      return { result: localResult, error: 'AI服务未配置' };
    }

    try {
      const aiResponse = await aiService.generateTable(input);
      if (aiResponse.success && aiResponse.data) {
        // 将AI结果与本地NLP结果结合
        const finalResult: NLPResult = {
          ...localResult,
          intent:
            localResult.intent === AttendanceIntent.UNKNOWN
              ? AttendanceIntent.CREATE_SUMMARY // 默认为创建汇总表
              : localResult.intent,
          confidence: 1.0, // AI生成，置信度高
          parameters: {
            ...localResult.parameters,
            source: 'ai',
          },
        };
        return { result: finalResult, table: aiResponse.data };
      } else {
        return { result: localResult, error: aiResponse.error };
      }
    } catch (error) {
      return {
        result: localResult,
        error: error instanceof Error ? error.message : 'AI处理失败',
      };
    }
  }
}

/**
 * 默认NLP处理器实例
 */
export const nlpProcessor = new NLPProcessor();

/**
 * 便捷处理函数
 */
export function processNaturalLanguage(input: string): NLPResult {
  return nlpProcessor.process(input);
}
