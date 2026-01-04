/**
 * 考勤表生成器
 * 负责根据模板和数据生成考勤表
 */

import {
  AttendanceSheet,
  AttendanceRecord,
  AttendanceStatistics,
  Employee,
  AttendanceStatus,
  DateRange,
} from '@/types';
import { TemplateType, AttendanceTemplate } from '@/types';
import { templateEngine, TemplateContext, RenderResult } from '../template';

/**
 * 生成选项
 */
export interface GenerateOptions {
  /** 模板类型 */
  templateType?: TemplateType;
  /** 自定义模板ID */
  customTemplateId?: string;
  /** 标题 */
  title?: string;
  /** 是否包含统计 */
  includeStatistics?: boolean;
  /** 是否包含图表 */
  includeCharts?: boolean;
  /** 部门筛选 */
  department?: string;
  /** 员工筛选 */
  employeeIds?: string[];
}

/**
 * 生成结果
 */
export interface GenerateResult {
  /** 渲染结果 */
  renderResult: RenderResult;
  /** 考勤表数据 */
  sheet: AttendanceSheet;
  /** 使用的模板 */
  template: AttendanceTemplate;
}

/**
 * 考勤表生成器类
 */
export class SheetGenerator {
  /**
   * 生成日报
   */
  generateDaily(
    date: Date,
    employees: Employee[],
    records: AttendanceRecord[],
    options: GenerateOptions = {}
  ): GenerateResult {
    const dateRange: DateRange = {
      start: new Date(date.setHours(0, 0, 0, 0)),
      end: new Date(date.setHours(23, 59, 59, 999)),
    };

    return this.generate(dateRange, employees, records, {
      ...options,
      templateType: options.templateType || TemplateType.DAILY_SIMPLE,
      title: options.title || `${this.formatDate(date)} 考勤日报`,
    });
  }

  /**
   * 生成周报
   */
  generateWeekly(
    weekStart: Date,
    employees: Employee[],
    records: AttendanceRecord[],
    options: GenerateOptions = {}
  ): GenerateResult {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const dateRange: DateRange = {
      start: new Date(weekStart.setHours(0, 0, 0, 0)),
      end: new Date(weekEnd.setHours(23, 59, 59, 999)),
    };

    return this.generate(dateRange, employees, records, {
      ...options,
      templateType: options.templateType || TemplateType.WEEKLY_SUMMARY,
      title:
        options.title ||
        `${this.formatDate(dateRange.start)} - ${this.formatDate(dateRange.end)} 考勤周报`,
    });
  }

  /**
   * 生成月报
   */
  generateMonthly(
    year: number,
    month: number,
    employees: Employee[],
    records: AttendanceRecord[],
    options: GenerateOptions = {}
  ): GenerateResult {
    const dateRange: DateRange = {
      start: new Date(year, month - 1, 1),
      end: new Date(year, month, 0, 23, 59, 59, 999),
    };

    return this.generate(dateRange, employees, records, {
      ...options,
      templateType: options.templateType || TemplateType.MONTHLY_SUMMARY,
      title: options.title || `${year}年${month}月 考勤月报`,
    });
  }

  /**
   * 生成考勤表
   */
  generate(
    dateRange: DateRange,
    employees: Employee[],
    records: AttendanceRecord[],
    options: GenerateOptions = {}
  ): GenerateResult {
    // 获取模板
    const template = this.getTemplate(options);

    // 筛选数据
    const filteredEmployees = this.filterEmployees(employees, options);
    const filteredRecords = this.filterRecords(records, dateRange, filteredEmployees);

    // 计算统计
    const statistics =
      options.includeStatistics !== false
        ? this.calculateStatistics(filteredRecords, dateRange)
        : undefined;

    // 构建考勤表
    const sheet: AttendanceSheet = {
      id: this.generateId(),
      name: options.title || '考勤表',
      dateRange,
      employees: filteredEmployees,
      records: filteredRecords,
      statistics,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 构建渲染上下文
    const context: TemplateContext = {
      title: options.title,
      dateRange,
      department: options.department,
      employees: filteredEmployees.map(e => ({
        id: e.id,
        name: e.name,
        employeeNo: e.employeeNo,
        department: e.department,
      })),
      records: filteredRecords.map(r => ({
        employeeId: r.employeeId,
        date: r.date,
        checkInTime: r.checkInTime ? this.formatTime(r.checkInTime) : undefined,
        checkOutTime: r.checkOutTime ? this.formatTime(r.checkOutTime) : undefined,
        workHours: r.workHours,
        overtimeHours: r.overtimeHours,
        status: this.getStatusText(r.status),
        notes: r.notes,
      })),
      statistics: statistics
        ? {
            totalWorkDays: statistics.totalWorkDays,
            actualWorkDays: statistics.actualWorkDays,
            attendanceRate: statistics.attendanceRate,
            lateCount: statistics.lateCount,
            earlyLeaveCount: statistics.earlyLeaveCount,
            absentCount: statistics.absentCount,
            leaveDays: statistics.leaveDays,
            overtimeHours: statistics.overtimeHours,
            totalWorkHours: statistics.totalWorkHours,
          }
        : undefined,
    };

    // 渲染模板
    const renderResult = templateEngine.render(template, context);

    return {
      renderResult,
      sheet,
      template,
    };
  }

  /**
   * 获取模板
   */
  private getTemplate(options: GenerateOptions): AttendanceTemplate {
    if (options.customTemplateId) {
      const customTemplate = templateEngine.getCustomTemplate(options.customTemplateId);
      if (customTemplate) {
        return customTemplate;
      }
    }

    const templateType = options.templateType || TemplateType.DAILY_SIMPLE;
    const template = templateEngine.getTemplate(templateType);

    if (!template) {
      throw new Error(`模板不存在: ${templateType}`);
    }

    return template;
  }

  /**
   * 筛选员工
   */
  private filterEmployees(employees: Employee[], options: GenerateOptions): Employee[] {
    let filtered = [...employees];

    // 按部门筛选
    if (options.department) {
      filtered = filtered.filter(e => e.department === options.department);
    }

    // 按员工ID筛选
    if (options.employeeIds && options.employeeIds.length > 0) {
      const idSet = new Set(options.employeeIds);
      filtered = filtered.filter(e => idSet.has(e.id));
    }

    return filtered;
  }

  /**
   * 筛选记录
   */
  private filterRecords(
    records: AttendanceRecord[],
    dateRange: DateRange,
    employees: Employee[]
  ): AttendanceRecord[] {
    const employeeIds = new Set(employees.map(e => e.id));

    return records.filter(record => {
      // 检查员工
      if (!employeeIds.has(record.employeeId)) {
        return false;
      }

      // 检查日期范围
      const recordDate = new Date(record.date);
      if (recordDate < dateRange.start || recordDate > dateRange.end) {
        return false;
      }

      return true;
    });
  }

  /**
   * 计算统计信息
   */
  private calculateStatistics(
    records: AttendanceRecord[],
    dateRange: DateRange
  ): AttendanceStatistics {
    const totalWorkDays = this.calculateWorkDays(dateRange);

    let normalCount = 0;
    let lateCount = 0;
    let earlyLeaveCount = 0;
    let absentCount = 0;
    let leaveDays = 0;
    let totalWorkHours = 0;
    let overtimeHours = 0;

    for (const record of records) {
      switch (record.status) {
        case AttendanceStatus.NORMAL:
          normalCount++;
          break;
        case AttendanceStatus.LATE:
          lateCount++;
          normalCount++; // 迟到也算出勤
          break;
        case AttendanceStatus.EARLY_LEAVE:
          earlyLeaveCount++;
          normalCount++; // 早退也算出勤
          break;
        case AttendanceStatus.ABSENT:
          absentCount++;
          break;
        case AttendanceStatus.LEAVE:
          leaveDays++;
          break;
        case AttendanceStatus.OVERTIME:
          normalCount++;
          break;
      }

      if (record.workHours) {
        totalWorkHours += record.workHours;
      }
      if (record.overtimeHours) {
        overtimeHours += record.overtimeHours;
      }
    }

    const actualWorkDays = normalCount;
    const attendanceRate = totalWorkDays > 0 ? (actualWorkDays / totalWorkDays) * 100 : 0;
    const averageDailyHours = actualWorkDays > 0 ? totalWorkHours / actualWorkDays : 0;

    return {
      totalWorkDays,
      actualWorkDays,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      lateCount,
      earlyLeaveCount,
      absentCount,
      leaveDays,
      overtimeHours,
      totalWorkHours,
      averageDailyHours: Math.round(averageDailyHours * 100) / 100,
    };
  }

  /**
   * 计算工作日数量
   */
  private calculateWorkDays(dateRange: DateRange): number {
    let count = 0;
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      const dayOfWeek = current.getDay();
      // 排除周六周日
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * 获取状态文本
   */
  private getStatusText(status: AttendanceStatus): string {
    const statusTexts: Record<AttendanceStatus, string> = {
      [AttendanceStatus.NORMAL]: '正常',
      [AttendanceStatus.LATE]: '迟到',
      [AttendanceStatus.EARLY_LEAVE]: '早退',
      [AttendanceStatus.ABSENT]: '缺勤',
      [AttendanceStatus.LEAVE]: '请假',
      [AttendanceStatus.OVERTIME]: '加班',
      [AttendanceStatus.OUT]: '外出',
      [AttendanceStatus.BUSINESS_TRIP]: '出差',
      [AttendanceStatus.REST_DAY]: '休息',
      [AttendanceStatus.HOLIDAY]: '节假日',
    };

    return statusTexts[status] || '未知';
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 格式化时间
   */
  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 默认生成器实例
 */
export const sheetGenerator = new SheetGenerator();
