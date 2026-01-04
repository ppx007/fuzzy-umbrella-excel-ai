/**
 * 考勤相关类型定义
 */

import { DateRange } from './common';

/**
 * 员工信息
 */
export interface Employee {
  /** 员工ID */
  id: string;
  /** 员工姓名 */
  name: string;
  /** 员工工号 */
  employeeNo?: string;
  /** 所属部门 */
  department?: string;
  /** 职位 */
  position?: string;
  /** 入职日期 */
  hireDate?: Date;
  /** 联系电话 */
  phone?: string;
  /** 邮箱 */
  email?: string;
}

/**
 * 考勤状态枚举
 */
export enum AttendanceStatus {
  /** 正常 */
  NORMAL = 'NORMAL',
  /** 迟到 */
  LATE = 'LATE',
  /** 早退 */
  EARLY_LEAVE = 'EARLY_LEAVE',
  /** 缺勤 */
  ABSENT = 'ABSENT',
  /** 请假 */
  LEAVE = 'LEAVE',
  /** 加班 */
  OVERTIME = 'OVERTIME',
  /** 外出 */
  OUT = 'OUT',
  /** 出差 */
  BUSINESS_TRIP = 'BUSINESS_TRIP',
  /** 休息日 */
  REST_DAY = 'REST_DAY',
  /** 节假日 */
  HOLIDAY = 'HOLIDAY',
}

/**
 * 请假类型枚举
 */
export enum LeaveType {
  /** 事假 */
  PERSONAL = 'PERSONAL',
  /** 病假 */
  SICK = 'SICK',
  /** 年假 */
  ANNUAL = 'ANNUAL',
  /** 婚假 */
  MARRIAGE = 'MARRIAGE',
  /** 产假 */
  MATERNITY = 'MATERNITY',
  /** 陪产假 */
  PATERNITY = 'PATERNITY',
  /** 丧假 */
  BEREAVEMENT = 'BEREAVEMENT',
  /** 调休 */
  COMPENSATORY = 'COMPENSATORY',
  /** 其他 */
  OTHER = 'OTHER',
}

/**
 * 考勤记录
 */
export interface AttendanceRecord {
  /** 记录ID */
  id: string;
  /** 员工ID */
  employeeId: string;
  /** 员工姓名 */
  employeeName: string;
  /** 日期 */
  date: Date;
  /** 签到时间 */
  checkInTime?: Date;
  /** 签退时间 */
  checkOutTime?: Date;
  /** 考勤状态 */
  status: AttendanceStatus;
  /** 请假类型 */
  leaveType?: LeaveType;
  /** 工作时长(小时) */
  workHours?: number;
  /** 加班时长(小时) */
  overtimeHours?: number;
  /** 迟到分钟数 */
  lateMinutes?: number;
  /** 早退分钟数 */
  earlyLeaveMinutes?: number;
  /** 备注 */
  notes?: string;
}

/**
 * 考勤表
 */
export interface AttendanceSheet {
  /** 表ID */
  id: string;
  /** 表名称 */
  name: string;
  /** 日期范围 */
  dateRange: DateRange;
  /** 员工列表 */
  employees: Employee[];
  /** 考勤记录 */
  records: AttendanceRecord[];
  /** 统计信息 */
  statistics?: AttendanceStatistics;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 考勤统计
 */
export interface AttendanceStatistics {
  /** 总工作日 */
  totalWorkDays: number;
  /** 实际出勤天数 */
  actualWorkDays: number;
  /** 出勤率 */
  attendanceRate: number;
  /** 迟到次数 */
  lateCount: number;
  /** 早退次数 */
  earlyLeaveCount: number;
  /** 缺勤次数 */
  absentCount: number;
  /** 请假天数 */
  leaveDays: number;
  /** 加班时长(小时) */
  overtimeHours: number;
  /** 总工作时长(小时) */
  totalWorkHours: number;
  /** 平均每日工作时长(小时) */
  averageDailyHours: number;
}

/**
 * 员工考勤汇总
 */
export interface EmployeeAttendanceSummary {
  /** 员工信息 */
  employee: Employee;
  /** 统计信息 */
  statistics: AttendanceStatistics;
  /** 日期范围 */
  dateRange: DateRange;
}

/**
 * 部门考勤汇总
 */
export interface DepartmentAttendanceSummary {
  /** 部门名称 */
  department: string;
  /** 员工数量 */
  employeeCount: number;
  /** 统计信息 */
  statistics: AttendanceStatistics;
  /** 日期范围 */
  dateRange: DateRange;
}

/**
 * 考勤配置
 */
export interface AttendanceConfig {
  /** 上班时间 */
  workStartTime: string;
  /** 下班时间 */
  workEndTime: string;
  /** 迟到容忍分钟数 */
  lateTolerance: number;
  /** 早退容忍分钟数 */
  earlyLeaveTolerance: number;
  /** 工作日 (0-6, 0为周日) */
  workDays: number[];
  /** 节假日列表 */
  holidays: Date[];
  /** 调休工作日列表 */
  workdayAdjustments: Date[];
}

/**
 * 考勤导入数据
 */
export interface AttendanceImportData {
  /** 员工姓名或工号 */
  employeeIdentifier: string;
  /** 日期 */
  date: string;
  /** 签到时间 */
  checkInTime?: string;
  /** 签退时间 */
  checkOutTime?: string;
  /** 状态 */
  status?: string;
  /** 备注 */
  notes?: string;
}

/**
 * 考勤导出选项
 */
export interface AttendanceExportOptions {
  /** 导出格式 */
  format: 'excel' | 'word' | 'pdf' | 'csv';
  /** 包含统计 */
  includeStatistics: boolean;
  /** 包含图表 */
  includeCharts: boolean;
  /** 日期范围 */
  dateRange: DateRange;
  /** 员工筛选 */
  employeeIds?: string[];
  /** 部门筛选 */
  departments?: string[];
}