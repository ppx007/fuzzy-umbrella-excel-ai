/**
 * 数据处理器
 * 负责考勤数据的导入、解析和转换
 */

import {
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  AttendanceImportData,
  DateRange,
} from '@/types';

/**
 * 导入结果
 */
export interface ImportResult {
  /** 成功导入的记录 */
  records: AttendanceRecord[];
  /** 识别的员工 */
  employees: Employee[];
  /** 错误信息 */
  errors: ImportError[];
  /** 警告信息 */
  warnings: string[];
  /** 统计信息 */
  stats: {
    total: number;
    success: number;
    failed: number;
  };
}

/**
 * 导入错误
 */
export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: unknown;
}

/**
 * 列映射配置
 */
export interface ColumnMapping {
  /** 员工姓名列 */
  name?: number | string;
  /** 员工工号列 */
  employeeNo?: number | string;
  /** 部门列 */
  department?: number | string;
  /** 日期列 */
  date?: number | string;
  /** 签到时间列 */
  checkInTime?: number | string;
  /** 签退时间列 */
  checkOutTime?: number | string;
  /** 状态列 */
  status?: number | string;
  /** 备注列 */
  notes?: number | string;
}

/**
 * 数据处理器类
 */
export class DataProcessor {
  private employeeMap: Map<string, Employee> = new Map();
  private employeeIdCounter = 1;

  /**
   * 从二维数组导入数据
   */
  importFromArray(
    data: unknown[][],
    mapping: ColumnMapping,
    hasHeader: boolean = true
  ): ImportResult {
    const records: AttendanceRecord[] = [];
    const errors: ImportError[] = [];
    const warnings: string[] = [];

    const startRow = hasHeader ? 1 : 0;

    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1;

      try {
        const importData = this.extractRowData(row, mapping);
        const record = this.parseRecord(importData, rowNum);

        if (record) {
          records.push(record);
        }
      } catch (error) {
        errors.push({
          row: rowNum,
          message: error instanceof Error ? error.message : '未知错误',
          data: row,
        });
      }
    }

    return {
      records,
      employees: Array.from(this.employeeMap.values()),
      errors,
      warnings,
      stats: {
        total: data.length - startRow,
        success: records.length,
        failed: errors.length,
      },
    };
  }

  /**
   * 从CSV文本导入数据
   */
  importFromCSV(csvText: string, mapping: ColumnMapping, hasHeader: boolean = true): ImportResult {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    const data: string[][] = lines.map(line => this.parseCSVLine(line));

    return this.importFromArray(data, mapping, hasHeader);
  }

  /**
   * 解析CSV行
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * 从行数据提取字段
   */
  private extractRowData(row: unknown[], mapping: ColumnMapping): AttendanceImportData {
    const getValue = (key: number | string | undefined): string => {
      if (key === undefined) return '';
      const index = typeof key === 'number' ? key : parseInt(key);
      const value = row[index];
      return value !== undefined && value !== null ? String(value).trim() : '';
    };

    return {
      employeeIdentifier: getValue(mapping.name) || getValue(mapping.employeeNo),
      date: getValue(mapping.date),
      checkInTime: getValue(mapping.checkInTime),
      checkOutTime: getValue(mapping.checkOutTime),
      status: getValue(mapping.status),
      notes: getValue(mapping.notes),
    };
  }

  /**
   * 解析记录
   */
  private parseRecord(data: AttendanceImportData, rowNum: number): AttendanceRecord | null {
    // 验证必填字段
    if (!data.employeeIdentifier) {
      throw new Error('员工标识不能为空');
    }

    if (!data.date) {
      throw new Error('日期不能为空');
    }

    // 获取或创建员工
    const employee = this.getOrCreateEmployee(data.employeeIdentifier);

    // 解析日期
    const date = this.parseDate(data.date);
    if (!date) {
      throw new Error(`无效的日期格式: ${data.date}`);
    }

    // 解析时间
    const checkInTime = data.checkInTime ? this.parseTime(data.checkInTime, date) : undefined;
    const checkOutTime = data.checkOutTime ? this.parseTime(data.checkOutTime, date) : undefined;

    // 转换 null 为 undefined
    const checkIn = checkInTime ?? undefined;
    const checkOut = checkOutTime ?? undefined;

    // 解析状态
    const status = this.parseStatus(data.status, checkIn, checkOut);

    // 计算工时
    const workHours = this.calculateWorkHours(checkIn, checkOut);

    return {
      id: `record_${Date.now()}_${rowNum}`,
      employeeId: employee.id,
      employeeName: employee.name,
      date,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      status,
      workHours,
      notes: data.notes,
    };
  }

  /**
   * 获取或创建员工
   */
  private getOrCreateEmployee(identifier: string): Employee {
    // 先尝试按姓名查找
    for (const employee of this.employeeMap.values()) {
      if (employee.name === identifier || employee.employeeNo === identifier) {
        return employee;
      }
    }

    // 创建新员工
    const employee: Employee = {
      id: `emp_${this.employeeIdCounter++}`,
      name: identifier,
    };

    this.employeeMap.set(employee.id, employee);
    return employee;
  }

  /**
   * 解析日期
   */
  private parseDate(dateStr: string): Date | null {
    // 尝试多种日期格式
    const formats = [
      // 2024-01-15
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // 2024/01/15
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
      // 01-15-2024
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      // 2024年1月15日
      /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/,
      // 1月15日
      /^(\d{1,2})月(\d{1,2})日?$/,
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (match.length === 4) {
          // 完整日期
          const year = parseInt(match[1]);
          const month = parseInt(match[2]);
          const day = parseInt(match[3]);

          if (year > 100) {
            return new Date(year, month - 1, day);
          } else {
            // MM-DD-YYYY 格式
            return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
          }
        } else if (match.length === 3) {
          // 只有月日
          const currentYear = new Date().getFullYear();
          const month = parseInt(match[1]);
          const day = parseInt(match[2]);
          return new Date(currentYear, month - 1, day);
        }
      }
    }

    // 尝试直接解析
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  }

  /**
   * 解析时间
   */
  private parseTime(timeStr: string, baseDate: Date): Date | null {
    // 尝试多种时间格式
    const formats = [
      // 09:30
      /^(\d{1,2}):(\d{2})$/,
      // 09:30:00
      /^(\d{1,2}):(\d{2}):(\d{2})$/,
      // 9点30分
      /^(\d{1,2})点(\d{1,2})分?$/,
    ];

    for (const format of formats) {
      const match = timeStr.match(format);
      if (match) {
        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = match[3] ? parseInt(match[3]) : 0;

        const date = new Date(baseDate);
        date.setHours(hours, minutes, seconds, 0);
        return date;
      }
    }

    return null;
  }

  /**
   * 解析状态
   */
  private parseStatus(
    statusStr: string | undefined,
    checkInTime: Date | undefined,
    checkOutTime: Date | undefined
  ): AttendanceStatus {
    if (statusStr) {
      const statusMap: Record<string, AttendanceStatus> = {
        正常: AttendanceStatus.NORMAL,
        出勤: AttendanceStatus.NORMAL,
        迟到: AttendanceStatus.LATE,
        早退: AttendanceStatus.EARLY_LEAVE,
        缺勤: AttendanceStatus.ABSENT,
        旷工: AttendanceStatus.ABSENT,
        请假: AttendanceStatus.LEAVE,
        事假: AttendanceStatus.LEAVE,
        病假: AttendanceStatus.LEAVE,
        年假: AttendanceStatus.LEAVE,
        加班: AttendanceStatus.OVERTIME,
        外出: AttendanceStatus.OUT,
        出差: AttendanceStatus.BUSINESS_TRIP,
        休息: AttendanceStatus.REST_DAY,
        节假日: AttendanceStatus.HOLIDAY,
      };

      const status = statusMap[statusStr];
      if (status) {
        return status;
      }
    }

    // 根据打卡时间推断状态
    if (!checkInTime && !checkOutTime) {
      return AttendanceStatus.ABSENT;
    }

    // 默认正常
    return AttendanceStatus.NORMAL;
  }

  /**
   * 计算工时
   */
  private calculateWorkHours(
    checkInTime: Date | undefined,
    checkOutTime: Date | undefined
  ): number | undefined {
    if (!checkInTime || !checkOutTime) {
      return undefined;
    }

    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const hours = diffMs / (1000 * 60 * 60);

    // 扣除午休时间（假设1小时）
    const adjustedHours = hours > 5 ? hours - 1 : hours;

    return Math.round(adjustedHours * 100) / 100;
  }

  /**
   * 自动检测列映射
   */
  detectColumnMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};

    const patterns: Record<keyof ColumnMapping, RegExp[]> = {
      name: [/姓名/, /名字/, /员工姓名/, /name/i],
      employeeNo: [/工号/, /员工号/, /编号/, /employee.*no/i, /id/i],
      department: [/部门/, /department/i, /dept/i],
      date: [/日期/, /date/i, /时间/],
      checkInTime: [/签到/, /上班/, /打卡/, /check.*in/i, /clock.*in/i],
      checkOutTime: [/签退/, /下班/, /check.*out/i, /clock.*out/i],
      status: [/状态/, /status/i, /考勤状态/],
      notes: [/备注/, /说明/, /notes/i, /remark/i],
    };

    headers.forEach((header, index) => {
      for (const [field, regexList] of Object.entries(patterns)) {
        for (const regex of regexList) {
          if (regex.test(header)) {
            (mapping as Record<string, number>)[field] = index;
            break;
          }
        }
      }
    });

    return mapping;
  }

  /**
   * 合并员工数据
   */
  mergeEmployees(existing: Employee[], imported: Employee[]): Employee[] {
    const merged = new Map<string, Employee>();

    // 添加现有员工
    for (const emp of existing) {
      merged.set(emp.id, emp);
    }

    // 合并导入的员工
    for (const imp of imported) {
      // 尝试按姓名或工号匹配
      let found = false;
      for (const [id, emp] of merged) {
        if (emp.name === imp.name || (emp.employeeNo && emp.employeeNo === imp.employeeNo)) {
          // 更新现有员工信息
          merged.set(id, { ...emp, ...imp, id: emp.id });
          found = true;
          break;
        }
      }

      if (!found) {
        merged.set(imp.id, imp);
      }
    }

    return Array.from(merged.values());
  }

  /**
   * 合并考勤记录
   */
  mergeRecords(existing: AttendanceRecord[], imported: AttendanceRecord[]): AttendanceRecord[] {
    const merged = new Map<string, AttendanceRecord>();

    // 生成唯一键
    const getKey = (record: AttendanceRecord): string => {
      const dateStr = record.date.toISOString().split('T')[0];
      return `${record.employeeId}_${dateStr}`;
    };

    // 添加现有记录
    for (const record of existing) {
      merged.set(getKey(record), record);
    }

    // 合并导入的记录（覆盖同一天的记录）
    for (const record of imported) {
      merged.set(getKey(record), record);
    }

    return Array.from(merged.values());
  }

  /**
   * 筛选记录
   */
  filterRecords(
    records: AttendanceRecord[],
    options: {
      dateRange?: DateRange;
      employeeIds?: string[];
      statuses?: AttendanceStatus[];
    }
  ): AttendanceRecord[] {
    return records.filter(record => {
      // 日期范围筛选
      if (options.dateRange) {
        const recordDate = new Date(record.date);
        if (recordDate < options.dateRange.start || recordDate > options.dateRange.end) {
          return false;
        }
      }

      // 员工筛选
      if (options.employeeIds && options.employeeIds.length > 0) {
        if (!options.employeeIds.includes(record.employeeId)) {
          return false;
        }
      }

      // 状态筛选
      if (options.statuses && options.statuses.length > 0) {
        if (!options.statuses.includes(record.status)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.employeeMap.clear();
    this.employeeIdCounter = 1;
  }
}

/**
 * 默认数据处理器实例
 */
export const dataProcessor = new DataProcessor();
