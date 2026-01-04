/**
 * NLP相关类型定义
 */

import { DateRange } from './common';
import { TemplateType, ColumnType } from './template';

/**
 * 考勤意图枚举
 */
export enum AttendanceIntent {
  CREATE_DAILY = 'CREATE_DAILY',
  CREATE_WEEKLY = 'CREATE_WEEKLY',
  CREATE_MONTHLY = 'CREATE_MONTHLY',
  CREATE_SUMMARY = 'CREATE_SUMMARY',
  IMPORT_DATA = 'IMPORT_DATA',
  GENERATE_CHART = 'GENERATE_CHART',
  EXPORT_DATA = 'EXPORT_DATA',
  QUERY_EMPLOYEE = 'QUERY_EMPLOYEE',
  QUERY_STATISTICS = 'QUERY_STATISTICS',
  MODIFY_TEMPLATE = 'MODIFY_TEMPLATE',
  QUERY_ATTENDANCE = 'QUERY_ATTENDANCE',
  EXPORT_REPORT = 'EXPORT_REPORT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 实体类型枚举
 */
export enum EntityType {
  DATE = 'DATE',
  DATE_RANGE = 'DATE_RANGE',
  EMPLOYEE = 'EMPLOYEE',
  EMPLOYEE_LIST = 'EMPLOYEE_LIST',
  DEPARTMENT = 'DEPARTMENT',
  ATTENDANCE_TYPE = 'ATTENDANCE_TYPE',
  CHART_TYPE = 'CHART_TYPE',
  STATISTIC_LIST = 'STATISTIC_LIST',
  COLUMN_LIST = 'COLUMN_LIST',
  TIME = 'TIME',
  NUMBER = 'NUMBER',
}

/**
 * 图表类型枚举
 */
export enum ChartType {
  PIE_ATTENDANCE = 'PIE_ATTENDANCE',
  BAR_ATTENDANCE = 'BAR_ATTENDANCE',
  BAR_EMPLOYEE = 'BAR_EMPLOYEE',
  LINE_TREND = 'LINE_TREND',
}

/**
 * 统计类型枚举
 */
export enum StatisticType {
  ATTENDANCE_RATE = 'ATTENDANCE_RATE',
  LATE_COUNT = 'LATE_COUNT',
  EARLY_LEAVE_COUNT = 'EARLY_LEAVE_COUNT',
  ABSENT_COUNT = 'ABSENT_COUNT',
  LEAVE_DAYS = 'LEAVE_DAYS',
  OVERTIME_HOURS = 'OVERTIME_HOURS',
  WORK_HOURS = 'WORK_HOURS',
}

/**
 * 提取的实体集合
 */
export interface ExtractedEntities {
  dateRange?: DateRange;
  employees?: string[];
  department?: string;
  chartType?: ChartType;
  statistics?: StatisticType[];
  columns?: ColumnType[];
  outputFormat?: 'excel' | 'word';
  templateType?: TemplateType;
}

/**
 * 提取的单个实体
 */
export interface ExtractedEntity {
  type: EntityType;
  value: string;
  normalizedValue?: string | number | Date | DateRange;
  position: {
    start: number;
    end: number;
  };
  confidence: number;
}

/**
 * NLP处理结果
 */
export interface NLPResult {
  // 原始输入
  rawInput: string;
  originalInput?: string;
  normalizedInput?: string;
  
  // 识别的意图
  intent: AttendanceIntent;
  
  // 意图置信度
  confidence: number;
  
  // 提取的实体
  entities: ExtractedEntities;
  
  // 处理后的参数
  parameters: {
    dateRange?: DateRange;
    employees?: string[];
    departments?: string[];
    chartType?: 'pie' | 'bar' | 'line';
    templateType?: string;
    [key: string]: unknown;
  };
  
  // 处理建议
  suggestions?: string[];
  
  // 是否需要更多信息
  needsMoreInfo?: boolean;
  
  // 缺失的必要信息
  missingInfo?: string[];
  
  // 匹配的规则ID
  matchedRuleId?: string;
}

/**
 * 意图识别规则
 */
export interface IntentRule {
  id: string;
  intent: AttendanceIntent;
  patterns: RegExp[];
  keywords?: string[];
  requiredKeywords?: string[];
  excludeKeywords?: string[];
  priority: number;
  baseConfidence: number;
}

/**
 * 实体提取规则
 */
export interface EntityRule {
  id: string;
  type: EntityType;
  patterns: RegExp[];
  extractor: (match: RegExpMatchArray, context: string) => unknown;
  validator?: (value: unknown) => boolean;
  normalizer?: (value: string) => unknown;
}

/**
 * 处理上下文
 */
export interface ProcessingContext {
  // 当前日期
  currentDate?: Date;
  
  // 可用员工列表
  availableEmployees?: string[];
  
  // 可用部门列表
  availableDepartments?: string[];
  
  // 历史查询
  queryHistory?: NLPResult[];
  
  // 上次日期范围（用于上下文推断）
  lastDateRange?: DateRange;
  
  // 上次员工列表（用于上下文推断）
  lastEmployees?: string[];
  
  // 上次部门（用于上下文推断）
  lastDepartment?: string;
  
  // 上次意图
  lastIntent?: AttendanceIntent;
  
  // 用户偏好
  userPreferences?: {
    defaultDateRange?: 'day' | 'week' | 'month';
    defaultChartType?: 'pie' | 'bar' | 'line';
  };
}

/**
 * 分词结果
 * 注意：与 tokenizer.ts 中的 Token 保持一致
 */
export interface Token {
  /** 词语 */
  word: string;
  /** 词性 */
  pos?: string;
  /** 起始位置 */
  start: number;
  /** 结束位置 */
  end: number;
}

/**
 * 分词器配置
 */
export interface TokenizerConfig {
  // 是否进行词性标注
  enablePOS?: boolean;
  
  // 自定义词典
  customDictionary?: Map<string, string>;
  
  // 停用词列表
  stopWords?: string[];
}