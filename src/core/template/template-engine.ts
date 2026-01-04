/**
 * 模板引擎
 * 负责模板的加载、解析和渲染
 */

import { AttendanceTemplate, TemplateType, CellStyle, ColumnType } from '@/types';

/**
 * 模板渲染上下文
 */
export interface TemplateContext {
  /** 标题 */
  title?: string;
  /** 日期范围 */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** 部门 */
  department?: string;
  /** 员工数据 */
  employees?: Array<{
    id: string;
    name: string;
    [key: string]: unknown;
  }>;
  /** 考勤数据 */
  records?: Array<{
    employeeId: string;
    date: Date;
    [key: string]: unknown;
  }>;
  /** 统计数据 */
  statistics?: Record<string, number>;
  /** 自定义数据 */
  customData?: Record<string, unknown>;
}

/**
 * 渲染结果
 */
export interface RenderResult {
  /** 表头行 */
  headers: string[][];
  /** 数据行 */
  rows: unknown[][];
  /** 样式映射 */
  styles: Map<string, CellStyle>;
  /** 合并单元格 */
  merges: Array<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  }>;
  /** 列宽 */
  columnWidths: number[];
  /** 行高 */
  rowHeights: number[];
}

/**
 * 模板引擎类
 */
export class TemplateEngine {
  private templates: Map<string, AttendanceTemplate> = new Map();
  private defaultTemplates: Map<TemplateType, AttendanceTemplate> = new Map();

  constructor() {
    this.initDefaultTemplates();
  }

  /**
   * 初始化默认模板
   */
  private initDefaultTemplates(): void {
    // 日报简单模板
    this.defaultTemplates.set(TemplateType.DAILY_SIMPLE, {
      id: 'daily-simple',
      name: '日考勤表(简单)',
      type: TemplateType.DAILY_SIMPLE,
      description: '简单的日考勤表，包含基本考勤信息',
      headers: [
        {
          title: '序号',
          field: 'index',
          width: 50,
          align: 'center',
        },
        {
          title: '姓名',
          field: 'name',
          width: 80,
          align: 'center',
        },
        {
          title: '部门',
          field: 'department',
          width: 100,
          align: 'center',
        },
        {
          title: '签到时间',
          field: 'checkInTime',
          width: 100,
          align: 'center',
        },
        {
          title: '签退时间',
          field: 'checkOutTime',
          width: 100,
          align: 'center',
        },
        {
          title: '状态',
          field: 'status',
          width: 80,
          align: 'center',
        },
      ],
      columns: [
        ColumnType.INDEX,
        ColumnType.NAME,
        ColumnType.DEPARTMENT,
        ColumnType.CHECK_IN,
        ColumnType.CHECK_OUT,
        ColumnType.STATUS,
      ],
      styles: {
        header: {
          backgroundColor: '#4472C4',
          fontColor: '#FFFFFF',
          fontSize: 12,
          fontWeight: 'bold',
          align: 'center',
          verticalAlign: 'middle',
          border: {
            style: 'thin',
            color: '#000000',
          },
        },
        body: {
          fontSize: 11,
          align: 'center',
          verticalAlign: 'middle',
          border: {
            style: 'thin',
            color: '#D9D9D9',
          },
        },
        title: {
          fontSize: 16,
          fontWeight: 'bold',
          align: 'center',
          verticalAlign: 'middle',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 日报详细模板
    this.defaultTemplates.set(TemplateType.DAILY_DETAILED, {
      id: 'daily-detailed',
      name: '日考勤表(详细)',
      type: TemplateType.DAILY_DETAILED,
      description: '详细的日考勤表，包含工时和备注',
      headers: [
        { title: '序号', field: 'index', width: 50, align: 'center' },
        { title: '工号', field: 'employeeNo', width: 80, align: 'center' },
        { title: '姓名', field: 'name', width: 80, align: 'center' },
        { title: '部门', field: 'department', width: 100, align: 'center' },
        { title: '签到时间', field: 'checkInTime', width: 100, align: 'center' },
        { title: '签退时间', field: 'checkOutTime', width: 100, align: 'center' },
        { title: '工作时长', field: 'workHours', width: 80, align: 'center' },
        { title: '加班时长', field: 'overtimeHours', width: 80, align: 'center' },
        { title: '状态', field: 'status', width: 80, align: 'center' },
        { title: '备注', field: 'notes', width: 150, align: 'left' },
      ],
      columns: [
        ColumnType.INDEX,
        ColumnType.EMPLOYEE_NO,
        ColumnType.NAME,
        ColumnType.DEPARTMENT,
        ColumnType.CHECK_IN,
        ColumnType.CHECK_OUT,
        ColumnType.WORK_HOURS,
        ColumnType.OVERTIME,
        ColumnType.STATUS,
        ColumnType.NOTES,
      ],
      styles: {
        header: {
          backgroundColor: '#4472C4',
          fontColor: '#FFFFFF',
          fontSize: 12,
          fontWeight: 'bold',
          align: 'center',
          verticalAlign: 'middle',
          border: { style: 'thin', color: '#000000' },
        },
        body: {
          fontSize: 11,
          align: 'center',
          verticalAlign: 'middle',
          border: { style: 'thin', color: '#D9D9D9' },
        },
        title: {
          fontSize: 16,
          fontWeight: 'bold',
          align: 'center',
          verticalAlign: 'middle',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 周报模板
    this.defaultTemplates.set(TemplateType.WEEKLY_SUMMARY, {
      id: 'weekly-summary',
      name: '周考勤汇总表',
      type: TemplateType.WEEKLY_SUMMARY,
      description: '按周汇总的考勤表',
      headers: [
        { title: '序号', field: 'index', width: 50, align: 'center' },
        { title: '姓名', field: 'name', width: 80, align: 'center' },
        { title: '部门', field: 'department', width: 100, align: 'center' },
        { title: '周一', field: 'day1', width: 60, align: 'center' },
        { title: '周二', field: 'day2', width: 60, align: 'center' },
        { title: '周三', field: 'day3', width: 60, align: 'center' },
        { title: '周四', field: 'day4', width: 60, align: 'center' },
        { title: '周五', field: 'day5', width: 60, align: 'center' },
        { title: '周六', field: 'day6', width: 60, align: 'center' },
        { title: '周日', field: 'day7', width: 60, align: 'center' },
        { title: '出勤天数', field: 'attendanceDays', width: 80, align: 'center' },
        { title: '出勤率', field: 'attendanceRate', width: 80, align: 'center' },
      ],
      columns: [
        ColumnType.INDEX,
        ColumnType.NAME,
        ColumnType.DEPARTMENT,
        ColumnType.DATE,
        ColumnType.DATE,
        ColumnType.DATE,
        ColumnType.DATE,
        ColumnType.DATE,
        ColumnType.DATE,
        ColumnType.DATE,
        ColumnType.WORK_HOURS,
        ColumnType.STATUS,
      ],
      styles: {
        header: {
          backgroundColor: '#70AD47',
          fontColor: '#FFFFFF',
          fontSize: 12,
          fontWeight: 'bold',
          align: 'center',
          verticalAlign: 'middle',
          border: { style: 'thin', color: '#000000' },
        },
        body: {
          fontSize: 11,
          align: 'center',
          verticalAlign: 'middle',
          border: { style: 'thin', color: '#D9D9D9' },
        },
        title: {
          fontSize: 16,
          fontWeight: 'bold',
          align: 'center',
          verticalAlign: 'middle',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 月报汇总模板
    this.defaultTemplates.set(TemplateType.MONTHLY_SUMMARY, {
      id: 'monthly-summary',
      name: '月度考勤汇总表',
      type: TemplateType.MONTHLY_SUMMARY,
      description: '按月汇总的考勤统计表',
      headers: [
        { title: '序号', field: 'index', width: 50, align: 'center' },
        { title: '工号', field: 'employeeNo', width: 80, align: 'center' },
        { title: '姓名', field: 'name', width: 80, align: 'center' },
        { title: '部门', field: 'department', width: 100, align: 'center' },
        { title: '应出勤', field: 'shouldAttend', width: 70, align: 'center' },
        { title: '实出勤', field: 'actualAttend', width: 70, align: 'center' },
        { title: '出勤率', field: 'attendanceRate', width: 70, align: 'center' },
        { title: '迟到', field: 'lateCount', width: 60, align: 'center' },
        { title: '早退', field: 'earlyLeaveCount', width: 60, align: 'center' },
        { title: '缺勤', field: 'absentCount', width: 60, align: 'center' },
        { title: '请假', field: 'leaveDays', width: 60, align: 'center' },
        { title: '加班(h)', field: 'overtimeHours', width: 70, align: 'center' },
        { title: '总工时(h)', field: 'totalWorkHours', width: 80, align: 'center' },
      ],
      columns: [
        ColumnType.INDEX,
        ColumnType.EMPLOYEE_NO,
        ColumnType.NAME,
        ColumnType.DEPARTMENT,
        ColumnType.WORK_HOURS,
        ColumnType.WORK_HOURS,
        ColumnType.STATUS,
        ColumnType.STATUS,
        ColumnType.STATUS,
        ColumnType.STATUS,
        ColumnType.STATUS,
        ColumnType.OVERTIME,
        ColumnType.WORK_HOURS,
      ],
      styles: {
        header: {
          backgroundColor: '#ED7D31',
          fontColor: '#FFFFFF',
          fontSize: 12,
          fontWeight: 'bold',
          align: 'center',
          verticalAlign: 'middle',
          border: { style: 'thin', color: '#000000' },
        },
        body: {
          fontSize: 11,
          align: 'center',
          verticalAlign: 'middle',
          border: { style: 'thin', color: '#D9D9D9' },
        },
        title: {
          fontSize: 16,
          fontWeight: 'bold',
          align: 'center',
          verticalAlign: 'middle',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 月报详细模板
    this.defaultTemplates.set(TemplateType.MONTHLY_DETAILED, {
      id: 'monthly-detailed',
      name: '月度考勤明细表',
      type: TemplateType.MONTHLY_DETAILED,
      description: '按月显示每日考勤明细',
      headers: [
        { title: '姓名', field: 'name', width: 80, align: 'center' },
        // 日期列会动态生成
      ],
      columns: [ColumnType.NAME],
      styles: {
        header: {
          backgroundColor: '#5B9BD5',
          fontColor: '#FFFFFF',
          fontSize: 11,
          fontWeight: 'bold',
          align: 'center',
          verticalAlign: 'middle',
          border: { style: 'thin', color: '#000000' },
        },
        body: {
          fontSize: 10,
          align: 'center',
          verticalAlign: 'middle',
          border: { style: 'thin', color: '#D9D9D9' },
        },
        title: {
          fontSize: 16,
          fontWeight: 'bold',
          align: 'center',
          verticalAlign: 'middle',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * 获取模板
   */
  getTemplate(type: TemplateType): AttendanceTemplate | undefined {
    return this.defaultTemplates.get(type);
  }

  /**
   * 获取自定义模板
   */
  getCustomTemplate(id: string): AttendanceTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * 注册自定义模板
   */
  registerTemplate(template: AttendanceTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): AttendanceTemplate[] {
    return [...Array.from(this.defaultTemplates.values()), ...Array.from(this.templates.values())];
  }

  /**
   * 渲染模板
   */
  render(template: AttendanceTemplate, context: TemplateContext): RenderResult {
    const headers = this.renderHeaders(template, context);
    const rows = this.renderRows(template, context);
    const styles = this.buildStyleMap(template);
    const merges = this.calculateMerges(template, context);
    const columnWidths = template.headers.map(h => h.width || 100);
    const rowHeights = this.calculateRowHeights(rows.length);

    return {
      headers,
      rows,
      styles,
      merges,
      columnWidths,
      rowHeights,
    };
  }

  /**
   * 渲染表头
   */
  private renderHeaders(template: AttendanceTemplate, context: TemplateContext): string[][] {
    const headers: string[][] = [];

    // 标题行
    if (context.title) {
      headers.push([context.title]);
    }

    // 副标题行（日期范围等）
    if (context.dateRange) {
      const dateStr = `${this.formatDate(context.dateRange.start)} 至 ${this.formatDate(context.dateRange.end)}`;
      headers.push([dateStr]);
    }

    // 列标题行
    const columnTitles = template.headers.map(h => h.title);
    headers.push(columnTitles);

    return headers;
  }

  /**
   * 渲染数据行
   */
  private renderRows(template: AttendanceTemplate, context: TemplateContext): unknown[][] {
    const rows: unknown[][] = [];

    if (!context.employees || !context.records) {
      return rows;
    }

    // 按员工分组记录
    const recordsByEmployee = new Map<string, typeof context.records>();
    for (const record of context.records) {
      const existing = recordsByEmployee.get(record.employeeId) || [];
      existing.push(record);
      recordsByEmployee.set(record.employeeId, existing);
    }

    // 生成每行数据
    context.employees.forEach((employee, index) => {
      const employeeRecords = recordsByEmployee.get(employee.id) || [];
      const row = this.renderEmployeeRow(template, employee, employeeRecords, index + 1);
      rows.push(row);
    });

    return rows;
  }

  /**
   * 渲染员工行
   */
  private renderEmployeeRow(
    template: AttendanceTemplate,
    employee: { id: string; name: string; [key: string]: unknown },
    records: Array<{ employeeId: string; date: Date; [key: string]: unknown }>,
    index: number
  ): unknown[] {
    const row: unknown[] = [];

    for (const header of template.headers) {
      const value = this.getCellValue(header.field, employee, records, index);
      row.push(value);
    }

    return row;
  }

  /**
   * 获取单元格值
   */
  private getCellValue(
    field: string,
    employee: { id: string; name: string; [key: string]: unknown },
    records: Array<{ employeeId: string; date: Date; [key: string]: unknown }>,
    index: number
  ): unknown {
    switch (field) {
      case 'index':
        return index;
      case 'name':
        return employee.name;
      case 'employeeNo':
        return employee.employeeNo || '';
      case 'department':
        return employee.department || '';
      case 'checkInTime':
        return records[0]?.checkInTime || '';
      case 'checkOutTime':
        return records[0]?.checkOutTime || '';
      case 'workHours':
        return records[0]?.workHours || 0;
      case 'overtimeHours':
        return records[0]?.overtimeHours || 0;
      case 'status':
        return records[0]?.status || '';
      case 'notes':
        return records[0]?.notes || '';
      default:
        return employee[field] || '';
    }
  }

  /**
   * 构建样式映射
   */
  private buildStyleMap(template: AttendanceTemplate): Map<string, CellStyle> {
    const styles = new Map<string, CellStyle>();

    if (template.styles) {
      if (template.styles.header) {
        styles.set('header', template.styles.header);
      }
      if (template.styles.body) {
        styles.set('body', template.styles.body);
      }
      if (template.styles.title) {
        styles.set('title', template.styles.title);
      }
    }

    return styles;
  }

  /**
   * 计算合并单元格
   */
  private calculateMerges(
    template: AttendanceTemplate,
    context: TemplateContext
  ): Array<{ startRow: number; startCol: number; endRow: number; endCol: number }> {
    const merges: Array<{ startRow: number; startCol: number; endRow: number; endCol: number }> =
      [];
    const colCount = template.headers.length;

    // 标题行合并
    if (context.title) {
      merges.push({
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: colCount - 1,
      });
    }

    // 日期范围行合并
    if (context.dateRange) {
      const row = context.title ? 1 : 0;
      merges.push({
        startRow: row,
        startCol: 0,
        endRow: row,
        endCol: colCount - 1,
      });
    }

    return merges;
  }

  /**
   * 计算行高
   */
  private calculateRowHeights(dataRowCount: number): number[] {
    const heights: number[] = [];

    // 标题行高度
    heights.push(30);

    // 副标题行高度
    heights.push(25);

    // 表头行高度
    heights.push(25);

    // 数据行高度
    for (let i = 0; i < dataRowCount; i++) {
      heights.push(22);
    }

    return heights;
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
   * 克隆模板
   */
  cloneTemplate(template: AttendanceTemplate, newId: string, newName: string): AttendanceTemplate {
    return {
      ...template,
      id: newId,
      name: newName,
      headers: template.headers.map(h => ({ ...h })),
      columns: [...template.columns],
      styles: template.styles
        ? {
            header: template.styles.header ? { ...template.styles.header } : undefined,
            body: template.styles.body ? { ...template.styles.body } : undefined,
            title: template.styles.title ? { ...template.styles.title } : undefined,
          }
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * 默认模板引擎实例
 */
export const templateEngine = new TemplateEngine();
