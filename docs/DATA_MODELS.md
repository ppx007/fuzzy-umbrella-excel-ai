# 数据模型文档

## 1. 核心数据模型

### 1.1 员工信息 (Employee)

```typescript
interface Employee {
  /** 员工唯一标识 */
  id: string;
  
  /** 员工姓名 */
  name: string;
  
  /** 所属部门（可选） */
  department?: string;
  
  /** 职位（可选） */
  position?: string;
  
  /** 工号（可选） */
  employeeNo?: string;
  
  /** 入职日期（可选） */
  hireDate?: Date;
  
  /** 自定义字段 */
  customFields?: Record<string, any>;
}
```

### 1.2 考勤记录 (AttendanceRecord)

```typescript
interface AttendanceRecord {
  /** 记录唯一标识 */
  id: string;
  
  /** 关联员工ID */
  employeeId: string;
  
  /** 考勤日期 */
  date: Date;
  
  /** 上班打卡时间 */
  checkIn?: Date;
  
  /** 下班打卡时间 */
  checkOut?: Date;
  
  /** 考勤状态 */
  status: AttendanceStatus;
  
  /** 工作时长（小时） */
  workHours?: number;
  
  /** 加班时长（小时） */
  overtime?: number;
  
  /** 迟到时长（分钟） */
  lateMinutes?: number;
  
  /** 早退时长（分钟） */
  earlyLeaveMinutes?: number;
  
  /** 请假类型 */
  leaveType?: LeaveType;
  
  /** 备注 */
  notes?: string;
}

/** 考勤状态枚举 */
enum AttendanceStatus {
  /** 正常出勤 */
  PRESENT = 'present',
  
  /** 缺勤 */
  ABSENT = 'absent',
  
  /** 迟到 */
  LATE = 'late',
  
  /** 早退 */
  EARLY_LEAVE = 'early_leave',
  
  /** 迟到且早退 */
  LATE_AND_EARLY = 'late_and_early',
  
  /** 请假 */
  LEAVE = 'leave',
  
  /** 出差 */
  BUSINESS_TRIP = 'business_trip',
  
  /** 节假日 */
  HOLIDAY = 'holiday',
  
  /** 周末 */
  WEEKEND = 'weekend',
  
  /** 调休 */
  COMPENSATORY = 'compensatory',
}

/** 请假类型枚举 */
enum LeaveType {
  /** 事假 */
  PERSONAL = 'personal',
  
  /** 病假 */
  SICK = 'sick',
  
  /** 年假 */
  ANNUAL = 'annual',
  
  /** 婚假 */
  MARRIAGE = 'marriage',
  
  /** 产假 */
  MATERNITY = 'maternity',
  
  /** 陪产假 */
  PATERNITY = 'paternity',
  
  /** 丧假 */
  BEREAVEMENT = 'bereavement',
  
  /** 其他 */
  OTHER = 'other',
}
```

### 1.3 考勤表 (AttendanceSheet)

```typescript
interface AttendanceSheet {
  /** 考勤表唯一标识 */
  id: string;
  
  /** 考勤表标题 */
  title: string;
  
  /** 模板类型 */
  type: TemplateType;
  
  /** 日期范围 */
  dateRange: DateRange;
  
  /** 员工列表 */
  employees: Employee[];
  
  /** 考勤记录 */
  records: AttendanceRecord[];
  
  /** 统计数据 */
  statistics?: AttendanceStatistics;
  
  /** 元数据 */
  metadata: {
    /** 创建时间 */
    createdAt: Date;
    
    /** 更新时间 */
    updatedAt: Date;
    
    /** 创建者 */
    createdBy?: string;
    
    /** 使用的模板ID */
    templateId?: string;
    
    /** 数据来源 */
    source: 'manual' | 'import' | 'nlp';
  };
}

interface DateRange {
  start: Date;
  end: Date;
}
```

### 1.4 统计数据 (AttendanceStatistics)

```typescript
interface AttendanceStatistics {
  /** 总天数 */
  totalDays: number;
  
  /** 工作日数 */
  workDays: number;
  
  /** 节假日数 */
  holidays: number;
  
  /** 周末数 */
  weekends: number;
  
  /** 按员工统计 */
  byEmployee: Map<string, EmployeeStatistics>;
  
  /** 汇总统计 */
  summary: SummaryStatistics;
}

interface EmployeeStatistics {
  /** 员工ID */
  employeeId: string;
  
  /** 员工姓名 */
  employeeName: string;
  
  /** 出勤天数 */
  presentDays: number;
  
  /** 缺勤天数 */
  absentDays: number;
  
  /** 迟到次数 */
  lateTimes: number;
  
  /** 早退次数 */
  earlyLeaveTimes: number;
  
  /** 请假天数 */
  leaveDays: number;
  
  /** 出差天数 */
  businessTripDays: number;
  
  /** 总工时 */
  totalWorkHours: number;
  
  /** 总加班时长 */
  totalOvertimeHours: number;
  
  /** 出勤率 */
  attendanceRate: number;
  
  /** 按请假类型统计 */
  leaveByType?: Map<LeaveType, number>;
}

interface SummaryStatistics {
  /** 总出勤人次 */
  totalPresent: number;
  
  /** 总缺勤人次 */
  totalAbsent: number;
  
  /** 总迟到人次 */
  totalLate: number;
  
  /** 总早退人次 */
  totalEarlyLeave: number;
  
  /** 总请假人次 */
  totalLeave: number;
  
  /** 总加班时长 */
  totalOvertimeHours: number;
  
  /** 平均出勤率 */
  averageAttendanceRate: number;
  
  /** 全勤人数 */
  fullAttendanceCount: number;
}
```

---

## 2. 模板数据模型

### 2.1 考勤表模板 (AttendanceTemplate)

```typescript
interface AttendanceTemplate {
  /** 模板唯一标识 */
  id: string;
  
  /** 模板名称 */
  name: string;
  
  /** 模板类型 */
  type: TemplateType;
  
  /** 模板描述 */
  description: string;
  
  /** 模板图标 */
  icon?: string;
  
  /** 是否为预设模板 */
  isPreset: boolean;
  
  /** 结构定义 */
  structure: TemplateStructure;
  
  /** 样式定义 */
  styles: TemplateStyles;
  
  /** 公式定义（Excel专用） */
  formulas?: FormulaDefinition[];
  
  /** 条件格式 */
  conditionalFormats?: ConditionalFormat[];
  
  /** 图表配置 */
  charts?: ChartDefinition[];
  
  /** 元数据 */
  metadata: {
    version: string;
    createdAt: Date;
    updatedAt: Date;
    author?: string;
  };
}

/** 模板类型枚举 */
enum TemplateType {
  /** 简单日报 */
  DAILY_SIMPLE = 'daily_simple',
  
  /** 详细日报 */
  DAILY_DETAILED = 'daily_detailed',
  
  /** 标准周报 */
  WEEKLY_STANDARD = 'weekly_standard',
  
  /** 弹性工时周报 */
  WEEKLY_FLEX = 'weekly_flex',
  
  /** 标准月报 */
  MONTHLY_STANDARD = 'monthly_standard',
  
  /** 月度汇总 */
  MONTHLY_SUMMARY = 'monthly_summary',
  
  /** 部门考勤表 */
  DEPARTMENT = 'department',
  
  /** 自定义 */
  CUSTOM = 'custom',
}
```

### 2.2 模板结构 (TemplateStructure)

```typescript
interface TemplateStructure {
  /** 表头定义 */
  headers: HeaderDefinition[];
  
  /** 行定义 */
  rows: RowDefinition;
  
  /** 表尾定义（可选） */
  footer?: FooterDefinition;
  
  /** 布局配置 */
  layout: LayoutConfig;
}

interface HeaderDefinition {
  /** 列标识 */
  key: string;
  
  /** 显示标题 */
  title: string;
  
  /** 列类型 */
  type: ColumnType;
  
  /** 列宽 */
  width?: number | 'auto';
  
  /** 是否固定列 */
  frozen?: boolean;
  
  /** 数据格式 */
  format?: string;
  
  /** 是否可见 */
  visible?: boolean;
  
  /** 子列（用于合并表头） */
  children?: HeaderDefinition[];
}

enum ColumnType {
  /** 序号 */
  INDEX = 'index',
  
  /** 员工姓名 */
  EMPLOYEE_NAME = 'employee_name',
  
  /** 日期 */
  DATE = 'date',
  
  /** 考勤状态 */
  STATUS = 'status',
  
  /** 上班时间 */
  CHECK_IN = 'check_in',
  
  /** 下班时间 */
  CHECK_OUT = 'check_out',
  
  /** 工时 */
  WORK_HOURS = 'work_hours',
  
  /** 加班时长 */
  OVERTIME = 'overtime',
  
  /** 统计数值 */
  STATISTIC = 'statistic',
  
  /** 备注 */
  NOTES = 'notes',
  
  /** 自定义 */
  CUSTOM = 'custom',
}

interface RowDefinition {
  /** 行类型 */
  type: 'employee' | 'date' | 'custom';
  
  /** 行高 */
  height?: number;
  
  /** 是否显示斑马纹 */
  striped?: boolean;
  
  /** 行数据映射 */
  dataMapping: DataMapping[];
}

interface DataMapping {
  /** 目标列key */
  columnKey: string;
  
  /** 数据字段路径 */
  field: string;
  
  /** 数据转换函数名 */
  transform?: string;
  
  /** 默认值 */
  defaultValue?: any;
}

interface FooterDefinition {
  /** 是否显示汇总行 */
  showSummary: boolean;
  
  /** 汇总列配置 */
  summaryColumns: SummaryColumn[];
  
  /** 额外行 */
  additionalRows?: AdditionalRow[];
}

interface SummaryColumn {
  /** 列key */
  columnKey: string;
  
  /** 汇总类型 */
  aggregation: 'sum' | 'average' | 'count' | 'min' | 'max' | 'custom';
  
  /** 自定义公式 */
  customFormula?: string;
  
  /** 显示标签 */
  label?: string;
}

interface LayoutConfig {
  /** 起始行 */
  startRow: number;
  
  /** 起始列 */
  startColumn: number;
  
  /** 标题行数 */
  titleRows?: number;
  
  /** 表头行数 */
  headerRows: number;
  
  /** 是否自动调整列宽 */
  autoFitColumns?: boolean;
  
  /** 是否冻结表头 */
  freezeHeader?: boolean;
  
  /** 冻结列数 */
  freezeColumns?: number;
}
```

### 2.3 模板样式 (TemplateStyles)

```typescript
interface TemplateStyles {
  /** 标题样式 */
  titleStyle?: CellStyle;
  
  /** 表头样式 */
  headerStyle: CellStyle;
  
  /** 数据行样式 */
  dataStyle: CellStyle;
  
  /** 交替行样式 */
  alternateRowStyle?: CellStyle;
  
  /** 汇总行样式 */
  summaryStyle?: CellStyle;
  
  /** 边框样式 */
  borderStyle?: BorderStyle;
  
  /** 状态样式映射 */
  statusStyles?: Map<AttendanceStatus, CellStyle>;
}

interface CellStyle {
  /** 字体 */
  font?: FontStyle;
  
  /** 填充 */
  fill?: FillStyle;
  
  /** 对齐 */
  alignment?: AlignmentStyle;
  
  /** 边框 */
  border?: BorderStyle;
  
  /** 数字格式 */
  numberFormat?: string;
}

interface FontStyle {
  name?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
}

interface FillStyle {
  type: 'solid' | 'pattern' | 'gradient';
  color?: string;
  backgroundColor?: string;
  pattern?: string;
}

interface AlignmentStyle {
  horizontal?: 'left' | 'center' | 'right' | 'justify';
  vertical?: 'top' | 'middle' | 'bottom';
  wrapText?: boolean;
  textRotation?: number;
}

interface BorderStyle {
  top?: BorderLine;
  bottom?: BorderLine;
  left?: BorderLine;
  right?: BorderLine;
}

interface BorderLine {
  style: 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted' | 'double';
  color?: string;
}
```

### 2.4 公式定义 (FormulaDefinition)

```typescript
interface FormulaDefinition {
  /** 公式标识 */
  id: string;
  
  /** 公式名称 */
  name: string;
  
  /** 应用位置 */
  target: FormulaTarget;
  
  /** 公式模板 */
  formula: string;
  
  /** 公式参数 */
  params?: FormulaParam[];
}

interface FormulaTarget {
  /** 目标类型 */
  type: 'column' | 'row' | 'cell' | 'range';
  
  /** 列key（当type为column时） */
  columnKey?: string;
  
  /** 行索引（当type为row时） */
  rowIndex?: number;
  
  /** 单元格地址（当type为cell时） */
  cellAddress?: string;
  
  /** 范围（当type为range时） */
  range?: string;
}

interface FormulaParam {
  name: string;
  type: 'column' | 'range' | 'value';
  value: string;
}
```

### 2.5 条件格式 (ConditionalFormat)

```typescript
interface ConditionalFormat {
  /** 条件格式标识 */
  id: string;
  
  /** 应用范围 */
  range: string | 'data' | 'column';
  
  /** 列key（当range为column时） */
  columnKey?: string;
  
  /** 规则类型 */
  ruleType: ConditionalRuleType;
  
  /** 规则配置 */
  rule: ConditionalRule;
  
  /** 应用样式 */
  style: CellStyle;
  
  /** 优先级 */
  priority?: number;
}

enum ConditionalRuleType {
  /** 单元格值 */
  CELL_VALUE = 'cell_value',
  
  /** 包含文本 */
  CONTAINS_TEXT = 'contains_text',
  
  /** 日期 */
  DATE = 'date',
  
  /** 公式 */
  FORMULA = 'formula',
  
  /** 数据条 */
  DATA_BAR = 'data_bar',
  
  /** 色阶 */
  COLOR_SCALE = 'color_scale',
  
  /** 图标集 */
  ICON_SET = 'icon_set',
}

interface ConditionalRule {
  /** 操作符 */
  operator?: 'equal' | 'notEqual' | 'greaterThan' | 'lessThan' | 'between' | 'contains';
  
  /** 值 */
  value?: any;
  
  /** 第二个值（用于between） */
  value2?: any;
  
  /** 公式（用于formula类型） */
  formula?: string;
}
```

---

## 3. NLP数据模型

### 3.1 NLP处理结果 (NLPResult)

```typescript
interface NLPResult {
  /** 识别的意图 */
  intent: AttendanceIntent;
  
  /** 置信度 (0-1) */
  confidence: number;
  
  /** 提取的实体 */
  entities: ExtractedEntities;
  
  /** 原始输入 */
  rawInput: string;
  
  /** 处理方式 */
  processedBy: 'local' | 'api' | 'hybrid';
  
  /** 处理耗时（毫秒） */
  processingTime: number;
  
  /** 是否需要确认 */
  needsConfirmation: boolean;
  
  /** 确认问题（如果需要确认） */
  confirmationQuestions?: string[];
}

/** 意图枚举 */
enum AttendanceIntent {
  /** 创建日考勤表 */
  CREATE_DAILY = 'create_daily',
  
  /** 创建周考勤表 */
  CREATE_WEEKLY = 'create_weekly',
  
  /** 创建月考勤表 */
  CREATE_MONTHLY = 'create_monthly',
  
  /** 创建汇总表 */
  CREATE_SUMMARY = 'create_summary',
  
  /** 导入数据 */
  IMPORT_DATA = 'import_data',
  
  /** 生成图表 */
  GENERATE_CHART = 'generate_chart',
  
  /** 修改模板 */
  MODIFY_TEMPLATE = 'modify_template',
  
  /** 添加员工 */
  ADD_EMPLOYEE = 'add_employee',
  
  /** 查询统计 */
  QUERY_STATISTICS = 'query_statistics',
  
  /** 未知意图 */
  UNKNOWN = 'unknown',
}

interface ExtractedEntities {
  /** 日期范围 */
  dateRange?: DateRange;
  
  /** 具体日期 */
  specificDate?: Date;
  
  /** 员工列表 */
  employees?: string[];
  
  /** 部门 */
  department?: string;
  
  /** 需要的列 */
  columns?: ColumnType[];
  
  /** 需要的统计项 */
  statistics?: StatisticType[];
  
  /** 输出格式 */
  outputFormat?: 'excel' | 'word';
  
  /** 图表类型 */
  chartType?: ChartType;
  
  /** 模板类型 */
  templateType?: TemplateType;
  
  /** 其他自定义实体 */
  custom?: Record<string, any>;
}

enum StatisticType {
  ATTENDANCE_RATE = 'attendance_rate',
  LATE_COUNT = 'late_count',
  EARLY_LEAVE_COUNT = 'early_leave_count',
  ABSENT_COUNT = 'absent_count',
  OVERTIME_HOURS = 'overtime_hours',
  WORK_HOURS = 'work_hours',
  LEAVE_DAYS = 'leave_days',
}
```

### 3.2 规则定义

```typescript
/** 意图识别规则 */
interface IntentRule {
  /** 规则ID */
  id: string;
  
  /** 匹配模式 */
  patterns: RegExp[];
  
  /** 关键词 */
  keywords: string[];
  
  /** 对应意图 */
  intent: AttendanceIntent;
  
  /** 优先级 */
  priority: number;
  
  /** 置信度加成 */
  confidenceBoost: number;
}

/** 实体提取规则 */
interface EntityRule {
  /** 规则ID */
  id: string;
  
  /** 实体类型 */
  type: EntityType;
  
  /** 匹配模式 */
  patterns: RegExp[];
  
  /** 提取函数 */
  extractor: (match: RegExpMatchArray, context: string) => any;
  
  /** 验证函数 */
  validator?: (value: any) => boolean;
  
  /** 标准化函数 */
  normalizer?: (value: any) => any;
}

enum EntityType {
  DATE_RANGE = 'date_range',
  SPECIFIC_DATE = 'specific_date',
  EMPLOYEE_LIST = 'employee_list',
  DEPARTMENT = 'department',
  COLUMN_LIST = 'column_list',
  STATISTIC_LIST = 'statistic_list',
  OUTPUT_FORMAT = 'output_format',
  CHART_TYPE = 'chart_type',
  TEMPLATE_TYPE = 'template_type',
  NUMBER = 'number',
}
```

---

## 4. 文件导入数据模型

### 4.1 导入配置 (ImportConfig)

```typescript
interface ImportConfig {
  /** 文件类型 */
  fileType: ImportFileType;
  
  /** 是否有表头 */
  hasHeader: boolean;
  
  /** 表头行号（从0开始） */
  headerRow?: number;
  
  /** 数据起始行 */
  dataStartRow?: number;
  
  /** 列映射 */
  columnMapping: ColumnMapping[];
  
  /** 日期格式 */
  dateFormat: string;
  
  /** 时间格式 */
  timeFormat?: string;
  
  /** 文件编码（CSV专用） */
  encoding?: string;
  
  /** 分隔符（CSV专用） */
  delimiter?: string;
  
  /** 工作表名称（Excel专用） */
  sheetName?: string;
}

enum ImportFileType {
  CSV = 'csv',
  XLSX = 'xlsx',
  XLS = 'xls',
}

interface ColumnMapping {
  /** 源列（列号或列名） */
  sourceColumn: number | string;
  
  /** 目标字段 */
  targetField: keyof AttendanceRecord | keyof Employee;
  
  /** 字段类型 */
  fieldType: 'employee' | 'record';
  
  /** 是否必填 */
  required?: boolean;
  
  /** 转换函数名 */
  transform?: string;
  
  /** 默认值 */
  defaultValue?: any;
  
  /** 验证规则 */
  validation?: ValidationRule;
}

interface ValidationRule {
  type: 'required' | 'format' | 'range' | 'enum' | 'custom';
  value?: any;
  message?: string;
}
```

### 4.2 导入结果 (ImportResult)

```typescript
interface ImportResult {
  /** 是否成功 */
  success: boolean;
  
  /** 导入的员工 */
  employees: Employee[];
  
  /** 导入的记录 */
  records: AttendanceRecord[];
  
  /** 错误信息 */
  errors: ImportError[];
  
  /** 警告信息 */
  warnings: ImportWarning[];
  
  /** 统计信息 */
  stats: {
    totalRows: number;
    successRows: number;
    errorRows: number;
    skippedRows: number;
  };
}

interface ImportError {
  row: number;
  column?: string;
  field?: string;
  value?: any;
  message: string;
  code: string;
}

interface ImportWarning {
  row: number;
  column?: string;
  message: string;
  code: string;
}
```

---

## 5. 图表数据模型

### 5.1 图表配置 (ChartConfig)

```typescript
interface ChartConfig {
  /** 图表类型 */
  type: ChartType;
  
  /** 图表标题 */
  title: string;
  
  /** 数据源 */
  dataSource: ChartDataSource;
  
  /** 位置配置 */
  position: ChartPosition;
  
  /** 尺寸配置 */
  size?: ChartSize;
  
  /** 显示选项 */
  options: ChartOptions;
  
  /** 颜色配置 */
  colors?: string[];
}

enum ChartType {
  /** 饼图 - 出勤率 */
  PIE_ATTENDANCE = 'pie_attendance',
  
  /** 柱状图 - 出勤统计 */
  BAR_ATTENDANCE = 'bar_attendance',
  
  /** 柱状图 - 员工对比 */
  BAR_EMPLOYEE = 'bar_employee',
  
  /** 折线图 - 趋势 */
  LINE_TREND = 'line_trend',
  
  /** 堆叠柱状图 */
  STACKED_BAR = 'stacked_bar',
  
  /** 组合图 */
  COMBO = 'combo',
}

interface ChartDataSource {
  /** 数据类型 */
  type: 'range' | 'computed';
  
  /** 数据范围（Excel地址） */
  range?: string;
  
  /** 计算数据 */
  data?: ChartData;
  
  /** 系列方向 */
  seriesBy?: 'rows' | 'columns';
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
}

interface ChartPosition {
  /** 上边距 */
  top: number;
  
  /** 左边距 */
  left: number;
  
  /** 锚定单元格 */
  anchorCell?: string;
}

interface ChartSize {
  width: number;
  height: number;
}

interface ChartOptions {
  /** 显示图例 */
  showLegend?: boolean;
  
  /** 图例位置 */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  
  /** 显示数据标签 */
  showDataLabels?: boolean;
  
  /** 显示网格线 */
  showGridLines?: boolean;
  
  /** 显示标题 */
  showTitle?: boolean;
  
  /** 动画效果 */
  animation?: boolean;
}
```

---

## 6. 配置数据模型

### 6.1 应用配置 (AppConfig)

```typescript
interface AppConfig {
  /** NLP配置 */
  nlp: NLPConfig;
  
  /** 默认设置 */
  defaults: DefaultSettings;
  
  /** UI偏好 */
  ui: UIPreferences;
  
  /** 存储配置 */
  storage: StorageConfig;
}

interface NLPConfig {
  /** 处理模式 */
  mode: 'local' | 'api' | 'hybrid';
  
  /** API配置 */
  api?: {
    provider: 'openai' | 'azure' | 'custom';
    apiKey?: string;
    endpoint?: string;
    model?: string;
  };
  
  /** 置信度阈值 */
  confidenceThreshold: number;
  
  /** 是否启用确认 */
  enableConfirmation: boolean;
}

interface DefaultSettings {
  /** 默认模板 */
  templateType: TemplateType;
  
  /** 默认输出格式 */
  outputFormat: 'excel' | 'word';
  
  /** 默认日期格式 */
  dateFormat: string;
  
  /** 默认时间格式 */
  timeFormat: string;
  
  /** 工作日设置 */
  workDays: number[];  // 0-6, 0=周日
  
  /** 标准工作时间 */
  workHours: {
    start: string;  // "09:00"
    end: string;    // "18:00"
  };
  
  /** 迟到阈值（分钟） */
  lateThreshold: number;
  
  /** 早退阈值（分钟） */
  earlyLeaveThreshold: number;
}

interface UIPreferences {
  /** 主题 */
  theme: 'light' | 'dark' | 'system';
  
  /** 语言 */
  language: 'zh-CN' | 'en-US';
  
  /** 紧凑模式 */
  compactMode: boolean;
  
  /** 显示提示 */
  showTips: boolean;
}

interface StorageConfig {
  /** 存储类型 */
  type: 'local' | 'roaming';
  
  /** 自动保存 */
  autoSave: boolean;
  
  /** 保存间隔（