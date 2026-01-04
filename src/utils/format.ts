/**
 * 格式化工具函数
 */

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 格式化小时数
 */
export function formatHours(hours: number, showUnit: boolean = true): string {
  const formatted = hours.toFixed(1);
  return showUnit ? `${formatted}h` : formatted;
}

/**
 * 格式化分钟数
 */
export function formatMinutes(minutes: number, showUnit: boolean = true): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return showUnit ? `${hours}小时` : `${hours}:00`;
    }
    return showUnit ? `${hours}小时${mins}分钟` : `${hours}:${mins.toString().padStart(2, '0')}`;
  }
  return showUnit ? `${minutes}分钟` : `0:${minutes.toString().padStart(2, '0')}`;
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * 格式化持续时间
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天${hours % 24}小时`;
  }
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  }
  return `${seconds}秒`;
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 首字母大写
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * 转换为驼峰命名
 */
export function toCamelCase(text: string): string {
  return text
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^(.)/, (char) => char.toLowerCase());
}

/**
 * 转换为短横线命名
 */
export function toKebabCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * 转换为下划线命名
 */
export function toSnakeCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * 格式化员工姓名列表
 */
export function formatEmployeeList(names: string[], maxShow: number = 3): string {
  if (names.length === 0) return '';
  if (names.length <= maxShow) return names.join('、');
  return `${names.slice(0, maxShow).join('、')}等${names.length}人`;
}

/**
 * 格式化日期范围显示
 */
export function formatDateRangeDisplay(start: Date, end: Date): string {
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth() + 1;
  const endMonth = end.getMonth() + 1;
  const startDay = start.getDate();
  const endDay = end.getDate();

  // 同一天
  if (startYear === endYear && startMonth === endMonth && startDay === endDay) {
    return `${startYear}年${startMonth}月${startDay}日`;
  }

  // 同一月
  if (startYear === endYear && startMonth === endMonth) {
    return `${startYear}年${startMonth}月${startDay}日-${endDay}日`;
  }

  // 同一年
  if (startYear === endYear) {
    return `${startYear}年${startMonth}月${startDay}日-${endMonth}月${endDay}日`;
  }

  // 不同年
  return `${startYear}年${startMonth}月${startDay}日-${endYear}年${endMonth}月${endDay}日`;
}

/**
 * 格式化考勤统计显示
 */
export function formatAttendanceStats(stats: {
  present?: number;
  absent?: number;
  late?: number;
  earlyLeave?: number;
  leave?: number;
}): string {
  const parts: string[] = [];
  
  if (stats.present !== undefined) parts.push(`出勤${stats.present}天`);
  if (stats.absent !== undefined && stats.absent > 0) parts.push(`缺勤${stats.absent}天`);
  if (stats.late !== undefined && stats.late > 0) parts.push(`迟到${stats.late}次`);
  if (stats.earlyLeave !== undefined && stats.earlyLeave > 0) parts.push(`早退${stats.earlyLeave}次`);
  if (stats.leave !== undefined && stats.leave > 0) parts.push(`请假${stats.leave}天`);
  
  return parts.join('，');
}

/**
 * 生成Excel列字母
 */
export function getExcelColumnLetter(columnNumber: number): string {
  let letter = '';
  let num = columnNumber;
  
  while (num > 0) {
    const remainder = (num - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    num = Math.floor((num - 1) / 26);
  }
  
  return letter;
}

/**
 * 解析Excel列字母为数字
 */
export function parseExcelColumnLetter(letter: string): number {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 64);
  }
  return result;
}

/**
 * 生成Excel单元格地址
 */
export function getExcelCellAddress(row: number, column: number): string {
  return `${getExcelColumnLetter(column)}${row}`;
}

/**
 * 生成Excel范围地址
 */
export function getExcelRangeAddress(
  startRow: number,
  startColumn: number,
  endRow: number,
  endColumn: number
): string {
  return `${getExcelCellAddress(startRow, startColumn)}:${getExcelCellAddress(endRow, endColumn)}`;
}

/**
 * 解析Excel单元格地址
 */
export function parseExcelCellAddress(address: string): { row: number; column: number } | null {
  const match = address.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  
  return {
    column: parseExcelColumnLetter(match[1].toUpperCase()),
    row: parseInt(match[2]),
  };
}

/**
 * 颜色转换：HEX to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * 颜色转换：RGB to HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * 生成随机颜色
 */
export function generateRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * 生成渐变色数组
 */
export function generateGradientColors(startColor: string, endColor: string, steps: number): string[] {
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);
  
  if (!start || !end) return [];
  
  const colors: string[] = [];
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    colors.push(rgbToHex(r, g, b));
  }
  
  return colors;
}