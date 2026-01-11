/**
 * 实体提取规则
 */

import {
  EntityType,
  EntityRule,
  ExtractedEntities,
  NlpChartType as ChartType,
  StatisticType,
} from '@/types';
import { TemplateType, ColumnType } from '@/types';
import { DateRange } from '@/types';
import {
  datePatterns,
  employeePatterns,
  chartPatterns,
  statisticsPatterns,
  columnPatterns,
  // chineseToNumber is available but not currently used
} from './patterns';

/**
 * 实体提取规则列表
 */
export const entityRules: EntityRule[] = [
  // 日期范围提取
  {
    id: 'date_range',
    type: EntityType.DATE_RANGE,
    patterns: [datePatterns.dateRange, datePatterns.sameMonthRange, datePatterns.yearMonth],
    extractor: extractDateRange,
    validator: value => {
      const range = value as DateRange;
      return range.start <= range.end;
    },
  },

  // 员工列表提取
  {
    id: 'employee_list',
    type: EntityType.EMPLOYEE_LIST,
    patterns: [employeePatterns.employeeList],
    extractor: extractEmployeeList,
    validator: value => {
      const list = value as string[];
      return list.length > 0;
    },
  },

  // 部门提取
  {
    id: 'department',
    type: EntityType.DEPARTMENT,
    patterns: [employeePatterns.department],
    extractor: match => match[1],
    validator: value => {
      const dept = value as string;
      return dept.length > 0 && dept.length < 20;
    },
  },

  // 图表类型提取
  {
    id: 'chart_type',
    type: EntityType.CHART_TYPE,
    patterns: [chartPatterns.pie, chartPatterns.bar, chartPatterns.line],
    extractor: extractChartType,
  },

  // 统计类型提取
  {
    id: 'statistic_list',
    type: EntityType.STATISTIC_LIST,
    patterns: [
      statisticsPatterns.attendanceRate,
      statisticsPatterns.lateCount,
      statisticsPatterns.earlyLeaveCount,
      statisticsPatterns.absentCount,
      statisticsPatterns.leaveCount,
      statisticsPatterns.overtimeHours,
      statisticsPatterns.workHours,
    ],
    extractor: extractStatisticTypes,
  },

  // 列类型提取
  {
    id: 'column_list',
    type: EntityType.COLUMN_LIST,
    patterns: [
      columnPatterns.checkIn,
      columnPatterns.checkOut,
      columnPatterns.workHours,
      columnPatterns.overtime,
      columnPatterns.status,
      columnPatterns.notes,
    ],
    extractor: extractColumnTypes,
  },

  // 列名提取
  {
    id: 'column_names',
    type: EntityType.COLUMN_NAMES,
    patterns: [/[列栏][名称称]?\s*[:：]?\s*([^\n]+)/, /包含[列栏][名称称称]?\s*[:：]?\s*([^\n]+)/],
    extractor: extractColumnNames,
  },
];

/**
 * 提取日期范围
 */
function extractDateRange(_match: RegExpMatchArray, context: string): DateRange | null {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // 检查相对日期
  if (datePatterns.today.test(context)) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    return { start: today, end: endOfDay };
  }

  if (datePatterns.thisWeek.test(context)) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  }

  if (datePatterns.lastWeek.test(context)) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
    lastMonday.setHours(0, 0, 0, 0);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);
    return { start: lastMonday, end: lastSunday };
  }

  if (datePatterns.thisMonth.test(context)) {
    const start = new Date(currentYear, currentMonth - 1, 1);
    const end = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (datePatterns.lastMonth.test(context)) {
    const start = new Date(currentYear, currentMonth - 2, 1);
    const end = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  // 检查年月格式：2024年1月
  const yearMonthMatch = context.match(/(\d{4})年(\d{1,2})月/);
  if (yearMonthMatch) {
    const year = parseInt(yearMonthMatch[1]);
    const month = parseInt(yearMonthMatch[2]);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }

  // 检查单独月份：1月
  const monthMatch = context.match(/(\d{1,2})月/);
  if (monthMatch && !context.match(/\d{1,2}月\d{1,2}日/)) {
    const month = parseInt(monthMatch[1]);
    const year = month > currentMonth ? currentYear - 1 : currentYear;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }

  // 检查日期范围：1月1日到1月31日
  const rangeMatch = context.match(/(\d{1,2})月(\d{1,2})日?[到至\-~](\d{1,2})月(\d{1,2})日?/);
  if (rangeMatch) {
    const startMonth = parseInt(rangeMatch[1]);
    const startDay = parseInt(rangeMatch[2]);
    const endMonth = parseInt(rangeMatch[3]);
    const endDay = parseInt(rangeMatch[4]);

    const start = new Date(currentYear, startMonth - 1, startDay);
    const end = new Date(currentYear, endMonth - 1, endDay, 23, 59, 59, 999);
    return { start, end };
  }

  // 检查同月日期范围：1月1日到31日
  const sameMonthMatch = context.match(/(\d{1,2})月(\d{1,2})日?[到至\-~](\d{1,2})日?/);
  if (sameMonthMatch) {
    const month = parseInt(sameMonthMatch[1]);
    const startDay = parseInt(sameMonthMatch[2]);
    const endDay = parseInt(sameMonthMatch[3]);

    const start = new Date(currentYear, month - 1, startDay);
    const end = new Date(currentYear, month - 1, endDay, 23, 59, 59, 999);
    return { start, end };
  }

  return null;
}

/**
 * 提取员工列表
 */
function extractEmployeeList(_match: RegExpMatchArray, context: string): string[] {
  // 尝试从"包含xxx、xxx"格式提取
  const listMatch = context.match(/(?:包含|包括|有|员工[是为]?)[：:\s]*([^\n]+)/);
  if (listMatch) {
    const listStr = listMatch[1];
    // 分割员工名单
    const names = listStr.split(/[,，、\s]+/).filter(name => {
      // 过滤掉非姓名的词
      return name.length >= 2 && name.length <= 4 && /^[\u4e00-\u9fa5]+$/.test(name);
    });
    if (names.length > 0) {
      return names;
    }
  }

  // 尝试提取所有中文姓名
  const nameMatches = context.match(/[\u4e00-\u9fa5]{2,4}/g);
  if (nameMatches) {
    // 过滤掉常见的非姓名词汇
    const excludeWords = [
      '考勤',
      '生成',
      '创建',
      '月报',
      '周报',
      '日报',
      '汇总',
      '统计',
      '表格',
      '模板',
      '员工',
      '部门',
      '公司',
      '时间',
      '日期',
      '本月',
      '上月',
      '本周',
      '上周',
      '今天',
      '昨天',
      '包含',
      '包括',
      '需要',
    ];

    const names = nameMatches.filter(name => !excludeWords.includes(name));
    return names;
  }

  return [];
}

/**
 * 提取图表类型
 */
function extractChartType(_match: RegExpMatchArray, context: string): ChartType | null {
  if (chartPatterns.pie.test(context)) {
    return ChartType.PIE_ATTENDANCE;
  }
  if (chartPatterns.bar.test(context)) {
    if (/员工|对比/.test(context)) {
      return ChartType.BAR_EMPLOYEE;
    }
    return ChartType.BAR_ATTENDANCE;
  }
  if (chartPatterns.line.test(context) || /趋势/.test(context)) {
    return ChartType.LINE_TREND;
  }
  return null;
}

/**
 * 提取统计类型
 */
function extractStatisticTypes(_match: RegExpMatchArray, context: string): StatisticType[] {
  const types: StatisticType[] = [];

  if (statisticsPatterns.attendanceRate.test(context)) {
    types.push(StatisticType.ATTENDANCE_RATE);
  }
  if (statisticsPatterns.lateCount.test(context)) {
    types.push(StatisticType.LATE_COUNT);
  }
  if (statisticsPatterns.earlyLeaveCount.test(context)) {
    types.push(StatisticType.EARLY_LEAVE_COUNT);
  }
  if (statisticsPatterns.absentCount.test(context)) {
    types.push(StatisticType.ABSENT_COUNT);
  }
  if (statisticsPatterns.leaveCount.test(context)) {
    types.push(StatisticType.LEAVE_DAYS);
  }
  if (statisticsPatterns.overtimeHours.test(context)) {
    types.push(StatisticType.OVERTIME_HOURS);
  }
  if (statisticsPatterns.workHours.test(context)) {
    types.push(StatisticType.WORK_HOURS);
  }

  return types;
}

/**
 * 提取列类型
 */
function extractColumnTypes(_match: RegExpMatchArray, context: string): ColumnType[] {
  const types: ColumnType[] = [];

  if (columnPatterns.checkIn.test(context)) {
    types.push(ColumnType.CHECK_IN);
  }
  if (columnPatterns.checkOut.test(context)) {
    types.push(ColumnType.CHECK_OUT);
  }
  if (columnPatterns.workHours.test(context)) {
    types.push(ColumnType.WORK_HOURS);
  }
  if (columnPatterns.overtime.test(context)) {
    types.push(ColumnType.OVERTIME);
  }
  if (columnPatterns.status.test(context)) {
    types.push(ColumnType.STATUS);
  }
  if (columnPatterns.notes.test(context)) {
    types.push(ColumnType.NOTES);
  }

  return types;
}

/**
 * 提取列名
 */
function extractColumnNames(_match: RegExpMatchArray, context: string): string[] {
  // 尝试从"列名: xxx、xxx"格式提取
  const listMatch = context.match(/(?:列[名称称]?|栏[名称称]?)[：:\s]*([^\n]+)/);
  if (listMatch) {
    const listStr = listMatch[1];
    // 分割列名
    const names = listStr.split(/[,，、\s]+/).filter(name => {
      // 过滤掉空字符串
      return name.trim().length > 0;
    });
    if (names.length > 0) {
      return names.map(name => name.trim());
    }
  }

  // 尝试从"包含列名: xxx、xxx"格式提取
  const includeMatch = context.match(/包含[列栏][名称称称]?[：:\s]*([^\n]+)/);
  if (includeMatch) {
    const listStr = includeMatch[1];
    // 分割列名
    const names = listStr.split(/[,，、\s]+/).filter(name => {
      // 过滤掉空字符串
      return name.trim().length > 0;
    });
    if (names.length > 0) {
      return names.map(name => name.trim());
    }
  }

  return [];
}

/**
 * 从文本中提取所有实体
 */
export function extractEntities(input: string): ExtractedEntities {
  const entities: ExtractedEntities = {};

  // 提取日期范围
  const dateRange = extractDateRange([] as unknown as RegExpMatchArray, input);
  if (dateRange) {
    entities.dateRange = dateRange;
  }

  // 提取员工列表
  const employees = extractEmployeeList([] as unknown as RegExpMatchArray, input);
  if (employees.length > 0) {
    entities.employees = employees;
  }

  // 提取部门
  const deptMatch = input.match(employeePatterns.department);
  if (deptMatch) {
    entities.department = deptMatch[1];
  }

  // 提取图表类型
  const chartType = extractChartType([] as unknown as RegExpMatchArray, input);
  if (chartType) {
    entities.chartType = chartType;
  }

  // 提取统计类型
  const statistics = extractStatisticTypes([] as unknown as RegExpMatchArray, input);
  if (statistics.length > 0) {
    entities.statistics = statistics;
  }

  // 提取列类型
  const columns = extractColumnTypes([] as unknown as RegExpMatchArray, input);
  if (columns.length > 0) {
    entities.columns = columns;
  }

  // 提取列名
  const columnNames = extractColumnNames([] as unknown as RegExpMatchArray, input);
  if (columnNames.length > 0) {
    entities.columnNames = columnNames;
  }

  // 提取输出格式
  if (/word|文档/i.test(input)) {
    entities.outputFormat = 'word';
  } else if (/excel|表格/i.test(input)) {
    entities.outputFormat = 'excel';
  }

  // 提取模板类型
  if (/简单|简易/.test(input)) {
    entities.templateType = TemplateType.DAILY_SIMPLE;
  } else if (/详细|详情/.test(input)) {
    entities.templateType = TemplateType.DAILY_DETAILED;
  } else if (/汇总|统计/.test(input)) {
    entities.templateType = TemplateType.MONTHLY_SUMMARY;
  }

  return entities;
}
