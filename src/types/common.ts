/**
 * 通用类型定义
 */

// ============================================
// V3 新增：位置管理类型
// ============================================

/**
 * 表格插入位置模式
 */
export type InsertPositionMode = 'auto' | 'manual' | 'newSheet';

/**
 * 位置配置
 */
export interface InsertPositionConfig {
  /** 位置模式 */
  mode: InsertPositionMode;
  /** 手动模式下的起始单元格地址 */
  manualAddress?: string;
  /** 新工作表模式下的工作表名称 */
  newSheetName?: string;
}

/**
 * 样式模式
 */
export type StyleMode = 'template' | 'ai' | 'none';

// ============================================
// V3 新增：应用设置类型
// ============================================

/**
 * AI 配置
 */
export interface AISettings {
  /** API 端点 */
  baseUrl: string;
  /** API 密钥 */
  apiKey: string;
  /** 模型名称 */
  model: string;
  /** 请求超时（秒） */
  timeout: number;
}

/**
 * 表格默认设置
 */
export interface TableDefaultSettings {
  /** 默认位置模式 */
  positionMode: InsertPositionMode;
  /** 默认生成行数 */
  defaultRowCount: number;
  /** 是否自动创建表格对象 */
  autoCreateTable: boolean;
  /** 是否自动调整列宽 */
  autoFitColumns: boolean;
}

/**
 * 样式偏好设置
 */
export interface StylePreferenceSettings {
  /** 默认颜色主题 */
  defaultTheme: ColorThemeName;
  /** 样式模式 */
  styleMode: StyleMode;
  /** 是否启用条件格式 */
  enableConditionalFormat: boolean;
}

/**
 * 高级设置
 */
export interface AdvancedSettings {
  /** 最大历史记录条数 */
  maxHistoryEntries: number;
  /** 是否启用流式响应 */
  enableStreaming: boolean;
  /** 是否启用调试模式 */
  debugMode: boolean;
}

/**
 * 完整应用设置
 */
export interface AppSettings {
  /** AI 配置 */
  ai: AISettings;
  /** 表格默认值 */
  table: TableDefaultSettings;
  /** 样式偏好 */
  style: StylePreferenceSettings;
  /** 高级选项 */
  advanced: AdvancedSettings;
}

/**
 * 设置页面分类
 */
export type SettingsCategory = 'ai' | 'table' | 'style' | 'advanced' | 'about';

/**
 * 日期范围
 */
export interface DateRange {
  /** 开始日期 */
  start: Date;
  /** 结束日期 */
  end: Date;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息列表 */
  errors: string[];
  /** 警告信息列表 */
  warnings?: string[];
}

/**
 * API响应
 */
export interface ApiResponse<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 错误代码 */
  code?: string;
  /** 时间戳 */
  timestamp?: number;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  /** 数据列表 */
  items: T[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 键值对
 */
export interface KeyValue<T = string> {
  key: string;
  value: T;
}

/**
 * 选项
 */
export interface Option<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

/**
 * 树节点
 */
export interface TreeNode<T = unknown> {
  id: string;
  label: string;
  data?: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

/**
 * 操作结果
 */
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: Error;
}

/**
 * 加载状态
 */
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * 异步状态
 */
export interface AsyncState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  state: LoadingState;
}

/**
 * 可选的深度部分类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 非空类型
 */
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * 可空类型
 */
export type Nullable<T> = T | null;

/**
 * 可选类型
 */
export type Optional<T> = T | undefined;

/**
 * ID类型
 */
export type ID = string | number;

/**
 * 时间戳类型
 */
export type Timestamp = number;

/**
 * 回调函数类型
 */
export type Callback<T = void> = (result: T) => void;

/**
 * 异步回调函数类型
 */
export type AsyncCallback<T = void> = (result: T) => Promise<void>;

/**
 * 比较函数类型
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * 过滤函数类型
 */
export type Predicate<T> = (item: T) => boolean;

/**
 * 映射函数类型
 */
export type Mapper<T, R> = (item: T) => R;

/**
 * AI生成的表格列定义
 */
export interface TableColumn {
  key: string;
  title: string;
  type: 'string' | 'number' | 'date' | 'time' | 'status';
}

// ============================================
// 通用表格生成相关类型定义
// ============================================

/**
 * 扩展的列类型
 */
export type ExtendedColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'currency'
  | 'percentage'
  | 'boolean'
  | 'email'
  | 'phone'
  | 'url'
  | 'formula';

/**
 * 通用表格列定义
 */
export interface GenericTableColumn {
  /** 列键名（英文，用于数据映射） */
  key: string;
  /** 列标题（显示名称） */
  title: string;
  /** 数据类型 */
  type: ExtendedColumnType;
  /** 列宽度（可选） */
  width?: number;
  /** 格式化模式（如日期格式、货币符号等） */
  format?: string;
  /** 是否必填 */
  required?: boolean;
  /** 默认值 */
  defaultValue?: unknown;
  /** 验证规则 */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

/**
 * 通用表格数据
 */
export interface GenericTableData {
  /** 表格名称 */
  tableName: string;
  /** 列定义 */
  columns: GenericTableColumn[];
  /** 数据行 */
  rows: Record<string, unknown>[];
  /** 元数据 */
  metadata?: {
    /** 创建时间 */
    createdAt: string;
    /** 来源 */
    source: 'ai' | 'manual' | 'import';
    /** 原始提示词 */
    prompt?: string;
  };
}

/**
 * AI 表格生成请求
 */
export interface TableGenerationRequest {
  /** 用户的自然语言输入 */
  prompt: string;
  /** 生成选项 */
  options?: {
    /** 是否包含示例数据 */
    includeExampleData?: boolean;
    /** 示例数据行数 */
    rowCount?: number;
    /** 语言偏好 */
    language?: 'zh' | 'en';
  };
}

/**
 * AI 表格生成响应
 */
export interface TableGenerationResponse {
  /** 是否成功 */
  success: boolean;
  /** 生成的表格数据 */
  data?: GenericTableData;
  /** 错误信息 */
  error?: string;
}

// ============================================
// 表格样式相关类型定义
// ============================================

/**
 * Excel 内置表格样式名称
 */
export type ExcelTableStyleName =
  // Light 系列 - 浅色主题
  | 'TableStyleLight1'
  | 'TableStyleLight2'
  | 'TableStyleLight3'
  | 'TableStyleLight4'
  | 'TableStyleLight5'
  | 'TableStyleLight6'
  | 'TableStyleLight7'
  | 'TableStyleLight8'
  | 'TableStyleLight9'
  | 'TableStyleLight10'
  | 'TableStyleLight11'
  | 'TableStyleLight12'
  | 'TableStyleLight13'
  | 'TableStyleLight14'
  // Medium 系列 - 中等主题
  | 'TableStyleMedium1'
  | 'TableStyleMedium2'
  | 'TableStyleMedium3'
  | 'TableStyleMedium4'
  | 'TableStyleMedium5'
  | 'TableStyleMedium6'
  | 'TableStyleMedium7'
  | 'TableStyleMedium8'
  | 'TableStyleMedium9'
  | 'TableStyleMedium10'
  | 'TableStyleMedium11'
  | 'TableStyleMedium12'
  | 'TableStyleMedium13'
  | 'TableStyleMedium14'
  // Dark 系列 - 深色主题
  | 'TableStyleDark1'
  | 'TableStyleDark2'
  | 'TableStyleDark3'
  | 'TableStyleDark4'
  | 'TableStyleDark5'
  | 'TableStyleDark6'
  | 'TableStyleDark7'
  | 'TableStyleDark8'
  | 'TableStyleDark9'
  | 'TableStyleDark10'
  | 'TableStyleDark11';

/**
 * 颜色主题名称
 */
export type ColorThemeName =
  | 'professional' // 专业商务（蓝色）
  | 'energetic' // 活力橙
  | 'nature' // 自然绿
  | 'elegant' // 优雅紫
  | 'dark' // 深色主题
  | 'fresh'; // 清新蓝

/**
 * 颜色主题配置
 */
export interface ColorTheme {
  /** 主题名称 */
  name: string;
  /** 主色 - 用于表头 */
  primary: string;
  /** 辅助色 - 用于交替行 */
  secondary: string;
  /** 强调色 - 用于重要数据 */
  accent: string;
  /** 文字颜色 */
  text: string;
  /** 表头文字颜色 */
  headerText: string;
  /** 背景颜色 */
  background: string;
  /** 对应的 Excel 表格样式 */
  excelTableStyle: ExcelTableStyleName;
}

/**
 * 预定义颜色主题
 */
export const COLOR_THEMES: Record<ColorThemeName, ColorTheme> = {
  professional: {
    name: '专业商务',
    primary: '#4472C4',
    secondary: '#D6DCE5',
    accent: '#ED7D31',
    text: '#000000',
    headerText: '#FFFFFF',
    background: '#FFFFFF',
    excelTableStyle: 'TableStyleMedium2',
  },
  energetic: {
    name: '活力橙',
    primary: '#ED7D31',
    secondary: '#FCE4D6',
    accent: '#4472C4',
    text: '#000000',
    headerText: '#FFFFFF',
    background: '#FFFFFF',
    excelTableStyle: 'TableStyleMedium3',
  },
  nature: {
    name: '自然绿',
    primary: '#70AD47',
    secondary: '#E2EFDA',
    accent: '#5B9BD5',
    text: '#000000',
    headerText: '#FFFFFF',
    background: '#FFFFFF',
    excelTableStyle: 'TableStyleMedium7',
  },
  elegant: {
    name: '优雅紫',
    primary: '#7030A0',
    secondary: '#E4DFEC',
    accent: '#FF00FF',
    text: '#000000',
    headerText: '#FFFFFF',
    background: '#FFFFFF',
    excelTableStyle: 'TableStyleMedium4',
  },
  dark: {
    name: '深色主题',
    primary: '#333333',
    secondary: '#555555',
    accent: '#FFCC00',
    text: '#FFFFFF',
    headerText: '#FFFFFF',
    background: '#1A1A1A',
    excelTableStyle: 'TableStyleDark1',
  },
  fresh: {
    name: '清新蓝',
    primary: '#5B9BD5',
    secondary: '#DEEBF7',
    accent: '#A5A5A5',
    text: '#000000',
    headerText: '#FFFFFF',
    background: '#FFFFFF',
    excelTableStyle: 'TableStyleLight2',
  },
};

/**
 * 条件格式规则类型
 */
export type ConditionalFormatType = 'colorScale' | 'dataBar' | 'iconSet' | 'cellValue';

/**
 * 颜色阶梯配置
 */
export interface ColorScaleConfig {
  type: 'colorScale';
  minColor: string;
  midColor?: string;
  maxColor: string;
}

/**
 * 数据条配置
 */
export interface DataBarConfig {
  type: 'dataBar';
  color: string;
  showValue?: boolean;
}

/**
 * 图标集配置
 */
export interface IconSetConfig {
  type: 'iconSet';
  iconType: 'arrows' | 'circles' | 'flags' | 'stars' | 'ratings';
}

/**
 * 单元格值条件配置
 */
export interface CellValueConfig {
  type: 'cellValue';
  operator: 'greaterThan' | 'lessThan' | 'equal' | 'notEqual' | 'between' | 'contains';
  values: (string | number)[];
  format: {
    backgroundColor?: string;
    fontColor?: string;
    bold?: boolean;
  };
}

/**
 * 条件格式规则
 */
export interface ConditionalFormatRule {
  /** 应用的列名 */
  columnName: string;
  /** 规则配置 */
  config: ColorScaleConfig | DataBarConfig | IconSetConfig | CellValueConfig;
}

/**
 * 表格样式配置
 */
export interface TableStyleConfig {
  /** 使用 Excel 内置样式名称 */
  excelTableStyle?: ExcelTableStyleName;

  /** 颜色主题 */
  colorTheme?: ColorThemeName;

  /** 表头样式 */
  header?: {
    backgroundColor?: string;
    fontColor?: string;
    fontSize?: number;
    bold?: boolean;
    align?: 'left' | 'center' | 'right';
  };

  /** 数据行样式 */
  body?: {
    fontSize?: number;
    alternateRowColor?: boolean;
    alternateColor?: string;
  };

  /** 边框样式 */
  border?: {
    style?: 'thin' | 'medium' | 'thick' | 'none';
    color?: string;
    showInner?: boolean;
    showOuter?: boolean;
  };

  /** 条件格式规则 */
  conditionalFormats?: ConditionalFormatRule[];
}

/**
 * 带样式的表格数据（扩展 GenericTableData）
 */
export interface StyledTableData extends GenericTableData {
  /** 样式配置 */
  style?: TableStyleConfig;
}

/**
 * 带样式的表格生成请求（扩展 TableGenerationRequest）
 */
export interface StyledTableGenerationRequest extends TableGenerationRequest {
  /** 样式偏好 */
  stylePreference?: {
    /** 风格关键词：专业、活泼、简约、优雅、深色等 */
    keywords?: string[];
    /** 指定颜色主题 */
    theme?: ColorThemeName;
    /** 是否启用条件格式 */
    enableConditionalFormat?: boolean;
  };
}

/**
 * 带样式的表格生成响应
 */
export interface StyledTableGenerationResponse {
  /** 是否成功 */
  success: boolean;
  /** 生成的带样式表格数据 */
  data?: StyledTableData;
  /** 错误信息 */
  error?: string;
}

/**
 * 状态值颜色映射
 */
export const STATUS_COLOR_MAP: Record<string, { background: string; text: string }> = {
  // 正面状态 - 绿色
  正常: { background: '#C6EFCE', text: '#006100' },
  完成: { background: '#C6EFCE', text: '#006100' },
  已完成: { background: '#C6EFCE', text: '#006100' },
  已通过: { background: '#C6EFCE', text: '#006100' },
  已批准: { background: '#C6EFCE', text: '#006100' },
  充足: { background: '#C6EFCE', text: '#006100' },
  成功: { background: '#C6EFCE', text: '#006100' },

  // 中性状态 - 黄色
  进行中: { background: '#FFEB9C', text: '#9C5700' },
  待处理: { background: '#FFEB9C', text: '#9C5700' },
  待审批: { background: '#FFEB9C', text: '#9C5700' },
  处理中: { background: '#FFEB9C', text: '#9C5700' },
  未开始: { background: '#FFEB9C', text: '#9C5700' },

  // 负面状态 - 红色
  未完成: { background: '#FFC7CE', text: '#9C0006' },
  已拒绝: { background: '#FFC7CE', text: '#9C0006' },
  未通过: { background: '#FFC7CE', text: '#9C0006' },
  失败: { background: '#FFC7CE', text: '#9C0006' },
  缺货: { background: '#FFC7CE', text: '#9C0006' },
  不足: { background: '#FFC7CE', text: '#9C0006' },
  迟到: { background: '#FFC7CE', text: '#9C0006' },
  早退: { background: '#FFC7CE', text: '#9C0006' },
  缺勤: { background: '#FFC7CE', text: '#9C0006' },
  旷工: { background: '#FFC7CE', text: '#9C0006' },
};

// ============================================
// V2 增强功能：历史管理相关类型
// ============================================

/**
 * 操作类型
 */
export type OperationType = 'create' | 'modify' | 'delete' | 'style' | 'chart';

/**
 * 历史记录条目
 */
export interface HistoryEntry {
  /** 唯一标识 */
  id: string;
  /** 操作类型 */
  type: OperationType;
  /** 操作描述 */
  description: string;
  /** 操作时间戳 */
  timestamp: number;
  /** 操作前的状态快照（用于撤销） */
  beforeState: TableSnapshot | null;
  /** 操作后的状态快照（用于重做） */
  afterState: TableSnapshot;
  /** 关联的表格地址 */
  tableAddress: string;
  /** 工作表名称 */
  sheetName: string;
}

/**
 * 表格快照（用于撤销/重做）
 */
export interface TableSnapshot {
  /** 表格数据 */
  data: StyledTableData;
  /** 表格在 Excel 中的地址范围 */
  address: string;
  /** 工作表名称 */
  sheetName: string;
  /** 快照时间 */
  capturedAt: number;
}

/**
 * 历史状态
 */
export interface HistoryState {
  /** 历史记录列表 */
  entries: HistoryEntry[];
  /** 当前指针位置（用于撤销/重做导航） */
  currentIndex: number;
  /** 最大历史记录数量 */
  maxEntries: number;
  /** 是否可以撤销 */
  canUndo: boolean;
  /** 是否可以重做 */
  canRedo: boolean;
}

// ============================================
// V2 增强功能：对话管理相关类型
// ============================================

/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 对话消息
 */
export interface ConversationMessage {
  /** 唯一标识 */
  id: string;
  /** 角色 */
  role: MessageRole;
  /** 消息内容 */
  content: string;
  /** 时间戳 */
  timestamp: number;
  /** 关联的表格操作（如果有） */
  tableOperation?: {
    type: OperationType;
    tableAddress?: string;
    success: boolean;
  };
  /** 是否正在流式输出 */
  isStreaming?: boolean;
  /** 是否是错误消息 */
  isError?: boolean;
  /** 导致该消息的原始用户输入（用于重试） */
  originalPrompt?: string;
}

/**
 * 对话上下文
 */
export interface ConversationContext {
  /** 对话 ID */
  conversationId: string;
  /** 消息列表 */
  messages: ConversationMessage[];
  /** 当前活动的表格地址 */
  activeTableAddress?: string;
  /** 当前活动的工作表 */
  activeSheetName?: string;
  /** 对话创建时间 */
  createdAt: number;
  /** 最后更新时间 */
  updatedAt: number;
  /** 对话标题（从第一条用户消息提取） */
  title?: string;
}

/**
 * 对话状态
 */
export interface ConversationState {
  /** 当前对话上下文 */
  currentConversation: ConversationContext | null;
  /** 历史对话列表（可选，用于对话历史功能） */
  conversationHistory?: ConversationContext[];
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}

// ============================================
// V2 增强功能：图表相关类型
// ============================================

/**
 * 图表类型
 */
export type ChartType =
  | 'column' // 柱状图
  | 'bar' // 条形图
  | 'line' // 折线图
  | 'pie' // 饼图
  | 'doughnut' // 环形图
  | 'area' // 面积图
  | 'scatter' // 散点图
  | 'radar' // 雷达图
  | 'combo' // 组合图
  | 'sunburst' // 旭日图（Excel不支持，需要替代）
  | 'treemap' // 树图（Excel不支持，需要替代）
  | 'heatmap'; // 热力图（Excel不支持，需要替代）

/**
 * 图表位置
 */
export interface ChartPosition {
  /** 起始单元格地址（如 "A1"） */
  startCell: string;
  /** 宽度（像素） */
  width: number;
  /** 高度（像素） */
  height: number;
}

/**
 * 图表数据源
 */
export interface ChartDataSource {
  /** 数据范围地址（如 "A1:D10"） */
  dataRange: string;
  /** 是否包含表头 */
  hasHeaders: boolean;
  /** X 轴列索引或名称 */
  xAxis?: string | number;
  /** Y 轴列索引或名称列表 */
  yAxes?: (string | number)[];
}

/**
 * 图表配置
 */
export interface ChartConfig {
  /** 图表类型 */
  type: ChartType;
  /** 图表标题 */
  title?: string;
  /** 数据源 */
  dataSource: ChartDataSource;
  /** 图表位置（可选，默认自动放置） */
  position?: ChartPosition;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 图例位置 */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** 是否显示数据标签 */
  showDataLabels?: boolean;
  /** 颜色主题 */
  colorTheme?: ColorThemeName;
  /** 自定义颜色列表 */
  colors?: string[];
}

/**
 * 图表生成请求
 */
export interface ChartGenerationRequest {
  /** 用户的自然语言输入 */
  prompt: string;
  /** 目标表格地址（如果有特定表格） */
  tableAddress?: string;
  /** 工作表名称 */
  sheetName?: string;
  /** 样式偏好 */
  stylePreference?: {
    theme?: ColorThemeName;
  };
}

/**
 * 图表生成响应
 */
export interface ChartGenerationResponse {
  /** 是否成功 */
  success: boolean;
  /** 生成的图表配置 */
  chartConfig?: ChartConfig;
  /** 错误信息 */
  error?: string;
}

// ============================================
// V2 增强功能：表格读取和修改相关类型
// ============================================

/**
 * 表格读取选项
 */
export interface TableReadOptions {
  /** 是否包含样式信息 */
  includeStyles?: boolean;
  /** 是否包含公式（而非计算值） */
  includeFormulas?: boolean;
  /** 是否包含条件格式 */
  includeConditionalFormats?: boolean;
  /** 最大读取行数（防止读取过大的表格） */
  maxRows?: number;
}

/**
 * 单元格样式信息
 */
export interface CellStyleInfo {
  /** 背景色 */
  backgroundColor?: string;
  /** 字体颜色 */
  fontColor?: string;
  /** 字体大小 */
  fontSize?: number;
  /** 是否加粗 */
  bold?: boolean;
  /** 是否斜体 */
  italic?: boolean;
  /** 水平对齐 */
  horizontalAlign?: 'left' | 'center' | 'right';
  /** 数字格式 */
  numberFormat?: string;
}

/**
 * 读取的表格数据
 */
export interface ReadTableData {
  /** 表格名称（如果是 Excel 表格对象） */
  tableName?: string;
  /** 数据范围地址 */
  address: string;
  /** 工作表名称 */
  sheetName: string;
  /** 列信息 */
  columns: {
    name: string;
    type: ExtendedColumnType;
    index: number;
  }[];
  /** 数据行 */
  rows: Record<string, unknown>[];
  /** 单元格样式（如果请求了样式信息） */
  cellStyles?: Record<string, CellStyleInfo>;
  /** 表格样式名称 */
  tableStyleName?: string;
  /** 总行数 */
  totalRows: number;
  /** 总列数 */
  totalColumns: number;
}

/**
 * 修改操作类型
 */
export type ModificationAction =
  | 'addColumn' // 添加列
  | 'removeColumn' // 删除列
  | 'renameColumn' // 重命名列
  | 'addRow' // 添加行
  | 'removeRow' // 删除行
  | 'updateCell' // 更新单元格
  | 'updateRange' // 更新范围
  | 'applyFormula' // 应用公式
  | 'applyStyle' // 应用样式
  | 'sort' // 排序
  | 'filter' // 筛选
  | 'merge' // 合并单元格
  | 'split'; // 拆分单元格

/**
 * 原子操作类型（增量更新专用）
 */
export type AtomicOperationType =
  | 'updateCell' // 更新单个单元格
  | 'updateRange' // 更新范围（多个单元格）
  | 'batchUpdate' // 批量更新（优化：多个不连续单元格）
  | 'insertRow' // 插入行（保留格式）
  | 'insertColumn' // 插入列（保留格式）
  | 'deleteRow' // 删除行
  | 'deleteColumn' // 删除列
  | 'setFormula' // 设置公式
  | 'batchFormula' // 批量设置公式
  | 'sortRange' // 排序（不改变样式）
  | 'filterRange' // 筛选
  | 'fillDown' // 向下填充（复制公式/值）
  | 'fillRight'; // 向右填充

/**
 * 单元格更新项（用于批量更新）
 */
export interface CellUpdate {
  /** 单元格地址，如 "B3" */
  address: string;
  /** 新值 */
  value: unknown;
}

/**
 * 原子操作指令
 */
export interface AtomicOperation {
  /** 操作类型 */
  type: AtomicOperationType;
  /** 目标地址（单元格如 "B3"，范围如 "B2:D5"） */
  target: string;
  /** 操作参数 */
  params: {
    /** 新值（用于 updateCell） */
    value?: unknown;
    /** 多个值（用于 updateRange，按行优先顺序） */
    values?: unknown[][];
    /** 批量单元格更新（用于 batchUpdate） */
    cells?: CellUpdate[];
    /** 公式（用于 setFormula） */
    formula?: string;
    /** 批量公式（用于 batchFormula） */
    formulas?: { address: string; formula: string }[];
    /** 插入位置（用于 insertRow/insertColumn） */
    position?: 'before' | 'after';
    /** 插入数量 */
    count?: number;
    /** 排序方向 */
    sortOrder?: 'asc' | 'desc';
    /** 排序列（用于 sortRange） */
    sortColumn?: string;
    /** 填充源范围（用于 fillDown/fillRight） */
    sourceRange?: string;
  };
  /** 操作描述（用于日志和 UI 显示） */
  description?: string;
}

/**
 * 增量更新请求
 */
export interface IncrementalUpdateRequest {
  /** 表格地址范围 */
  tableAddress: string;
  /** 工作表名称 */
  sheetName: string;
  /** 操作指令列表 */
  operations: AtomicOperation[];
}

/**
 * 增量更新结果
 */
export interface IncrementalUpdateResult {
  success: boolean;
  /** 成功执行的操作数 */
  appliedCount: number;
  /** 失败的操作（如果有） */
  failedOperations?: {
    operation: AtomicOperation;
    error: string;
  }[];
}

/**
 * 表格修改请求
 */
export interface TableModificationRequest {
  /** 用户的自然语言输入 */
  prompt: string;
  /** 目标表格数据（当前表格状态） */
  currentTable: ReadTableData;
  /** 对话历史（用于上下文理解） */
  conversationHistory?: ConversationMessage[];
  /** 工作表名称 */
  sheetName: string;
}

/**
 * 单个修改操作
 */
export interface ModificationOperation {
  /** 操作类型 */
  action: ModificationAction;
  /** 操作目标（列名、行号、单元格地址等） */
  target: string;
  /** 操作参数 */
  params: Record<string, unknown>;
  /** 操作描述 */
  description: string;
}

/**
 * 表格修改响应
 */
export interface TableModificationResponse {
  /** 是否成功 */
  success: boolean;
  /** 修改操作列表 */
  operations?: ModificationOperation[];
  /** 修改后的预期表格数据（预览用） */
  previewData?: GenericTableData;
  /** AI 的解释说明 */
  explanation?: string;
  /** 错误信息 */
  error?: string;
}

// ============================================
// V2 增强功能：统一助手模式
// ============================================

/**
 * 助手工作模式
 */
export type AssistantMode = 'generate' | 'modify' | 'chart';

/**
 * 统一助手状态
 */
export interface UnifiedAssistantState {
  /** 当前模式 */
  mode: AssistantMode;
  /** 对话状态 */
  conversation: ConversationState;
  /** 历史状态 */
  history: HistoryState;
  /** 当前选中的表格 */
  selectedTable: ReadTableData | null;
  /** 是否正在处理 */
  isProcessing: boolean;
  /** 流式输出状态 */
  streamState: {
    isStreaming: boolean;
    content: string;
  };
}

/**
 * 范围选择模式
 */
export type RangeSelectionMode = 'auto' | 'manual';

/**
 * 范围检测结果
 */
export interface RangeDetectionResult {
  /** 是否检测到表格 */
  detected: boolean;
  /** 检测到的范围地址 */
  address?: string;
  /** 是否是 Excel 表格对象 */
  isTable?: boolean;
  /** 表格名称（如果是表格对象） */
  tableName?: string;
  /** 检测方法 */
  method: 'selection' | 'usedRange' | 'table' | 'none';
}

/**
 * 原子操作执行结果
 */
export interface AtomicOperationResult {
  /** 是否成功 */
  success: boolean;
  /** 执行的操作 */
  operation: AtomicOperation;
  /** 操作前的原始值（用于撤销） */
  originalValues?: unknown[][];
  /** 错误信息 */
  error?: string;
}
