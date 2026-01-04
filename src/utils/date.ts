/**
 * 日期工具函数
 */

import {
  format,
  parse,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isWeekend,
  isSameDay,
  isWithinInterval,
  eachDayOfInterval,
  getDay,
  setDefaultOptions,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DateRange } from '@/types';

// 设置默认语言为中文
setDefaultOptions({ locale: zhCN });

/** 默认日期格式 */
export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
/** 默认时间格式 */
export const DEFAULT_TIME_FORMAT = 'HH:mm';
/** 默认日期时间格式 */
export const DEFAULT_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';

/**
 * 格式化日期
 */
export function formatDate(date: Date | string | number, formatStr: string = DEFAULT_DATE_FORMAT): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, formatStr);
}

/**
 * 格式化时间
 */
export function formatTime(date: Date | string | number, formatStr: string = DEFAULT_TIME_FORMAT): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, formatStr);
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date | string | number, formatStr: string = DEFAULT_DATETIME_FORMAT): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, formatStr);
}

/**
 * 解析日期字符串
 */
export function parseDate(dateStr: string, formatStr: string = DEFAULT_DATE_FORMAT): Date | null {
  try {
    return parse(dateStr, formatStr, new Date());
  } catch {
    return null;
  }
}

/**
 * 获取今天的日期范围
 */
export function getTodayRange(): DateRange {
  const today = new Date();
  return {
    start: startOfDay(today),
    end: endOfDay(today),
  };
}

/**
 * 获取本周的日期范围
 */
export function getThisWeekRange(): DateRange {
  const today = new Date();
  return {
    start: startOfWeek(today, { weekStartsOn: 1 }), // 周一开始
    end: endOfWeek(today, { weekStartsOn: 1 }),
  };
}

/**
 * 获取本月的日期范围
 */
export function getThisMonthRange(): DateRange {
  const today = new Date();
  return {
    start: startOfMonth(today),
    end: endOfMonth(today),
  };
}

/**
 * 获取上月的日期范围
 */
export function getLastMonthRange(): DateRange {
  const lastMonth = addMonths(new Date(), -1);
  return {
    start: startOfMonth(lastMonth),
    end: endOfMonth(lastMonth),
  };
}

/**
 * 获取指定月份的日期范围
 */
export function getMonthRange(year: number, month: number): DateRange {
  const date = new Date(year, month - 1, 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

/**
 * 获取指定周的日期范围
 */
export function getWeekRange(date: Date): DateRange {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

/**
 * 获取日期范围内的所有日期
 */
export function getDatesInRange(range: DateRange): Date[] {
  return eachDayOfInterval({ start: range.start, end: range.end });
}

/**
 * 计算两个日期之间的天数
 */
export function getDaysBetween(start: Date, end: Date): number {
  return differenceInDays(end, start);
}

/**
 * 计算两个时间之间的小时数
 */
export function getHoursBetween(start: Date, end: Date): number {
  return differenceInHours(end, start);
}

/**
 * 计算两个时间之间的分钟数
 */
export function getMinutesBetween(start: Date, end: Date): number {
  return differenceInMinutes(end, start);
}

/**
 * 判断是否为周末
 */
export function isWeekendDay(date: Date): boolean {
  return isWeekend(date);
}

/**
 * 判断是否为工作日
 */
export function isWorkday(date: Date, holidays: Date[] = []): boolean {
  if (isWeekend(date)) return false;
  return !holidays.some(holiday => isSameDay(date, holiday));
}

/**
 * 获取日期范围内的工作日数量
 */
export function getWorkdaysCount(range: DateRange, holidays: Date[] = []): number {
  const dates = getDatesInRange(range);
  return dates.filter(date => isWorkday(date, holidays)).length;
}

/**
 * 获取日期范围内的周末数量
 */
export function getWeekendsCount(range: DateRange): number {
  const dates = getDatesInRange(range);
  return dates.filter(date => isWeekend(date)).length;
}

/**
 * 判断日期是否在范围内
 */
export function isDateInRange(date: Date, range: DateRange): boolean {
  return isWithinInterval(date, { start: range.start, end: range.end });
}

/**
 * 获取星期几（中文）
 */
export function getWeekdayName(date: Date): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[getDay(date)];
}

/**
 * 获取星期几（数字，周一为1）
 */
export function getWeekdayNumber(date: Date): number {
  const day = getDay(date);
  return day === 0 ? 7 : day;
}

/**
 * 添加天数
 */
export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

/**
 * 添加周数
 */
export function addWeeksToDate(date: Date, weeks: number): Date {
  return addWeeks(date, weeks);
}

/**
 * 添加月数
 */
export function addMonthsToDate(date: Date, months: number): Date {
  return addMonths(date, months);
}

/**
 * 判断两个日期是否为同一天
 */
export function isSameDayDate(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

/**
 * 获取月份名称
 */
export function getMonthName(month: number): string {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', 
                  '七月', '八月', '九月', '十月', '十一月', '十二月'];
  return months[month - 1] || '';
}

/**
 * 解析中文日期描述
 */
export function parseChineseDateDescription(text: string): DateRange | null {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // 今天
  if (/今天|今日/.test(text)) {
    return getTodayRange();
  }

  // 本周
  if (/本周|这周/.test(text)) {
    return getThisWeekRange();
  }

  // 上周
  if (/上周/.test(text)) {
    const lastWeek = addWeeks(today, -1);
    return getWeekRange(lastWeek);
  }

  // 本月
  if (/本月|这个月/.test(text)) {
    return getThisMonthRange();
  }

  // 上月/上个月
  if (/上月|上个月/.test(text)) {
    return getLastMonthRange();
  }

  // 指定年月：2024年1月
  const yearMonthMatch = text.match(/(\d{4})年(\d{1,2})月/);
  if (yearMonthMatch) {
    const year = parseInt(yearMonthMatch[1]);
    const month = parseInt(yearMonthMatch[2]);
    return getMonthRange(year, month);
  }

  // 指定月份：1月、一月
  const monthMatch = text.match(/(\d{1,2})月/) || text.match(/(一|二|三|四|五|六|七|八|九|十|十一|十二)月/);
  if (monthMatch) {
    let month: number;
    if (/\d/.test(monthMatch[1])) {
      month = parseInt(monthMatch[1]);
    } else {
      const chineseMonths: Record<string, number> = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
        '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '十二': 12
      };
      month = chineseMonths[monthMatch[1]] || currentMonth;
    }
    // 如果指定的月份大于当前月份，则认为是去年
    const year = month > currentMonth ? currentYear - 1 : currentYear;
    return getMonthRange(year, month);
  }

  // 日期范围：1月1日到1月31日
  const rangeMatch = text.match(/(\d{1,2})月(\d{1,2})日?[到至-](\d{1,2})月(\d{1,2})日?/);
  if (rangeMatch) {
    const startMonth = parseInt(rangeMatch[1]);
    const startDay = parseInt(rangeMatch[2]);
    const endMonth = parseInt(rangeMatch[3]);
    const endDay = parseInt(rangeMatch[4]);
    
    return {
      start: new Date(currentYear, startMonth - 1, startDay),
      end: new Date(currentYear, endMonth - 1, endDay),
    };
  }

  // 同月日期范围：1月1日到31日
  const sameMonthRangeMatch = text.match(/(\d{1,2})月(\d{1,2})日?[到至-](\d{1,2})日?/);
  if (sameMonthRangeMatch) {
    const month = parseInt(sameMonthRangeMatch[1]);
    const startDay = parseInt(sameMonthRangeMatch[2]);
    const endDay = parseInt(sameMonthRangeMatch[3]);
    
    return {
      start: new Date(currentYear, month - 1, startDay),
      end: new Date(currentYear, month - 1, endDay),
    };
  }

  return null;
}

/**
 * 计算工作时长（小时）
 */
export function calculateWorkHours(checkIn: Date, checkOut: Date, lunchBreak: number = 1): number {
  const totalHours = getHoursBetween(checkIn, checkOut);
  return Math.max(0, totalHours - lunchBreak);
}

/**
 * 判断是否迟到
 */
export function isLate(checkIn: Date, standardTime: string, threshold: number = 0): boolean {
  const [hours, minutes] = standardTime.split(':').map(Number);
  const standard = new Date(checkIn);
  standard.setHours(hours, minutes, 0, 0);
  
  const diff = getMinutesBetween(standard, checkIn);
  return diff > threshold;
}

/**
 * 判断是否早退
 */
export function isEarlyLeave(checkOut: Date, standardTime: string, threshold: number = 0): boolean {
  const [hours, minutes] = standardTime.split(':').map(Number);
  const standard = new Date(checkOut);
  standard.setHours(hours, minutes, 0, 0);
  
  const diff = getMinutesBetween(checkOut, standard);
  return diff > threshold;
}

/**
 * 计算迟到分钟数
 */
export function calculateLateMinutes(checkIn: Date, standardTime: string): number {
  const [hours, minutes] = standardTime.split(':').map(Number);
  const standard = new Date(checkIn);
  standard.setHours(hours, minutes, 0, 0);
  
  const diff = getMinutesBetween(standard, checkIn);
  return Math.max(0, diff);
}

/**
 * 计算早退分钟数
 */
export function calculateEarlyLeaveMinutes(checkOut: Date, standardTime: string): number {
  const [hours, minutes] = standardTime.split(':').map(Number);
  const standard = new Date(checkOut);
  standard.setHours(hours, minutes, 0, 0);
  
  const diff = getMinutesBetween(checkOut, standard);
  return Math.max(0, diff);
}