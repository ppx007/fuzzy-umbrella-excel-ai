/**
 * 模板相关类型定义
 */

/**
 * 模板类型枚举
 */
export enum TemplateType {
  /** 日报简单版 */
  DAILY_SIMPLE = 'DAILY_SIMPLE',
  /** 日报详细版 */
  DAILY_DETAILED = 'DAILY_DETAILED',
  /** 周报汇总 */
  WEEKLY_SUMMARY = 'WEEKLY_SUMMARY',
  /** 月报汇总 */
  MONTHLY_SUMMARY = 'MONTHLY_SUMMARY',
  /** 月报详细 */
  MONTHLY_DETAILED = 'MONTHLY_DETAILED',
  /** 自定义模板 */
  CUSTOM = 'CUSTOM',
}

/**
 * 列类型枚举
 */
export enum ColumnType {
  /** 序号 */
  INDEX = 'INDEX',
  /** 员工姓名 */
  NAME = 'NAME',
  /** 员工姓名(别名) */
  EMPLOYEE_NAME = 'EMPLOYEE_NAME',
  /** 员工工号 */
  EMPLOYEE_NO = 'EMPLOYEE_NO',
  /** 部门 */
  DEPARTMENT = 'DEPARTMENT',
  /** 日期 */
  DATE = 'DATE',
  /** 签到时间 */
  CHECK_IN = 'CHECK_IN',
  /** 签退时间 */
  CHECK_OUT = 'CHECK_OUT',
  /** 工作时长 */
  WORK_HOURS = 'WORK_HOURS',
  /** 加班时长 */
  OVERTIME = 'OVERTIME',
  /** 状态 */
  STATUS = 'STATUS',
  /** 备注 */
  NOTES = 'NOTES',
  /** 出勤率 */
  ATTENDANCE_RATE = 'ATTENDANCE_RATE',
  /** 迟到次数 */
  LATE_COUNT = 'LATE_COUNT',
  /** 早退次数 */
  EARLY_LEAVE_COUNT = 'EARLY_LEAVE_COUNT',
  /** 缺勤次数 */
  ABSENT_COUNT = 'ABSENT_COUNT',
  /** 请假天数 */
  LEAVE_DAYS = 'LEAVE_DAYS',
}

/**
 * 表头定义
 */
export interface HeaderDefinition {
  /** 标题 */
  title: string;
  /** 字段名 */
  field: string;
  /** 列宽 */
  width?: number;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 格式化函数名 */
  formatter?: string;
  /** 子表头 */
  children?: HeaderDefinition[];
}

/**
 * 边框样式
 */
export interface BorderStyle {
  /** 边框类型 */
  style?: 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted';
  /** 边框颜色 */
  color?: string;
}

/**
 * 单元格样式
 */
export interface CellStyle {
  /** 背景色 */
  backgroundColor?: string;
  /** 字体颜色 */
  fontColor?: string;
  /** 字体大小 */
  fontSize?: number;
  /** 字体粗细 */
  fontWeight?: 'normal' | 'bold';
  /** 字体样式 */
  fontStyle?: 'normal' | 'italic';
  /** 水平对齐 */
  align?: 'left' | 'center' | 'right';
  /** 垂直对齐 */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** 边框 */
  border?: BorderStyle;
  /** 数字格式 */
  numberFormat?: string;
  /** 自动换行 */
  wrapText?: boolean;
}

/**
 * 模板样式
 */
export interface TemplateStyles {
  /** 表头样式 */
  header?: CellStyle;
  /** 数据行样式 */
  body?: CellStyle;
  /** 标题样式 */
  title?: CellStyle;
  /** 副标题样式 */
  subtitle?: CellStyle;
  /** 汇总行样式 */
  summary?: CellStyle;
  /** 交替行样式 */
  alternateRow?: CellStyle;
}

/**
 * 考勤模板
 */
export interface AttendanceTemplate {
  /** 模板ID */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板类型 */
  type: TemplateType;
  /** 模板描述 */
  description?: string;
  /** 表头定义 */
  headers: HeaderDefinition[];
  /** 列类型 */
  columns: ColumnType[];
  /** 样式配置 */
  styles?: TemplateStyles;
  /** 是否为默认模板 */
  isDefault?: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 模板配置
 */
export interface TemplateConfig {
  /** 默认模板类型 */
  defaultType: TemplateType;
  /** 是否显示序号列 */
  showIndex: boolean;
  /** 是否显示统计行 */
  showSummary: boolean;
  /** 日期格式 */
  dateFormat: string;
  /** 时间格式 */
  timeFormat: string;
  /** 数字精度 */
  numberPrecision: number;
}

/**
 * 模板变量
 */
export interface TemplateVariable {
  /** 变量名 */
  name: string;
  /** 变量类型 */
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  /** 默认值 */
  defaultValue?: unknown;
  /** 描述 */
  description?: string;
}

/**
 * 模板元数据
 */
export interface TemplateMetadata {
  /** 作者 */
  author?: string;
  /** 版本 */
  version?: string;
  /** 标签 */
  tags?: string[];
  /** 预览图URL */
  previewUrl?: string;
}