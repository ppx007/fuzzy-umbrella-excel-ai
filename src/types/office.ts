/**
 * Office相关类型定义
 */

import { CellStyle } from './template';

/** Office应用类型 */
export type OfficeHostType = 'Excel' | 'Word' | 'Unknown';

/** 文档信息 */
export interface DocumentInfo {
  /** 文档名称 */
  name?: string;
  /** 文档路径 */
  path?: string;
  /** Office应用类型 */
  host: OfficeHostType;
  /** 是否只读 */
  isReadOnly?: boolean;
}

/** 表格配置 */
export interface TableConfig {
  /** 表格名称 */
  name?: string;
  /** 数据范围 */
  range?: string;
  /** 表格数据 */
  data: unknown[][];
  /** 是否有表头 */
  hasHeaders: boolean;
  /** 表格样式 */
  style?: string;
  /** 起始单元格 */
  startCell?: string;
}

/** 表格引用 */
export interface TableReference {
  /** 表格ID */
  id: string;
  /** 表格名称 */
  name?: string;
  /** 数据范围 */
  range?: string;
}

/** 图表配置 */
export interface ChartConfig {
  /** 图表类型 */
  type: string;
  /** 图表标题 */
  title: string;
  /** 数据范围 */
  dataRange: string;
  /** 系列方向 */
  seriesBy: 'rows' | 'columns';
  /** 位置配置 */
  position: {
    top: number;
    left: number;
  };
  /** 尺寸配置 */
  size?: {
    width: number;
    height: number;
  };
  /** 显示选项 */
  options?: {
    showLegend?: boolean;
    showDataLabels?: boolean;
    colors?: string[];
  };
}

/** 图表引用 */
export interface ChartReference {
  /** 图表ID */
  id: string;
  /** 图表名称 */
  name?: string;
}

/** 样式配置 */
export interface StyleConfig {
  /** 范围 */
  range: string;
  /** 样式 */
  style: CellStyle;
}

/** 数据验证配置 */
export interface DataValidationConfig {
  /** 验证类型 */
  type: 'list' | 'number' | 'date' | 'text';
  /** 选项列表 */
  options?: string[];
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 错误消息 */
  errorMessage?: string;
  /** 是否允许空值 */
  allowBlank?: boolean;
}

/** 透视表配置 */
export interface PivotTableConfig {
  /** 数据源范围 */
  sourceRange: string;
  /** 行字段 */
  rowFields: string[];
  /** 列字段 */
  columnFields?: string[];
  /** 值字段 */
  valueFields: Array<{
    name: string;
    summarizeBy: 'sum' | 'count' | 'average' | 'max' | 'min';
  }>;
  /** 目标位置 */
  targetCell?: string;
}

/** Office适配器接口 */
export interface OfficeAdapter {
  /** 获取文档信息 */
  getDocumentInfo(): Promise<DocumentInfo>;
  
  /** 创建表格 */
  createTable(config: TableConfig): Promise<TableReference>;
  
  /** 更新表格数据 */
  updateTable(ref: TableReference, data: unknown[][]): Promise<void>;
  
  /** 应用样式 */
  applyStyles(configs: StyleConfig[]): Promise<void>;
  
  /** 创建图表（Excel专用） */
  createChart?(config: ChartConfig): Promise<ChartReference>;
  
  /** 添加数据验证（Excel专用） */
  addDataValidation?(range: string, config: DataValidationConfig): Promise<void>;
  
  /** 创建透视表（Excel专用） */
  createPivotTable?(config: PivotTableConfig): Promise<void>;
  
  /** 导出为PDF */
  exportToPDF?(): Promise<Blob>;
  
  /** 获取选中范围 */
  getSelectedRange?(): Promise<string>;
  
  /** 设置单元格值 */
  setCellValue?(cell: string, value: unknown): Promise<void>;
  
  /** 获取单元格值 */
  getCellValue?(cell: string): Promise<unknown>;
}

/** Excel图表类型 */
export type ExcelChartType = 
  | 'ColumnClustered'
  | 'ColumnStacked'
  | 'BarClustered'
  | 'BarStacked'
  | 'Line'
  | 'LineMarkers'
  | 'Pie'
  | 'Doughnut'
  | 'Area'
  | 'XYScatter';

/** Excel表格样式 */
export type ExcelTableStyle = 
  | 'TableStyleLight1'
  | 'TableStyleLight9'
  | 'TableStyleMedium2'
  | 'TableStyleMedium9'
  | 'TableStyleDark1';

/** Word表格样式 */
export type WordTableStyle = 
  | 'GridTable1Light'
  | 'GridTable4'
  | 'GridTable5Dark'
  | 'ListTable3';

/** Word插入位置 */
export type WordInsertLocation = 
  | 'Before'
  | 'After'
  | 'Start'
  | 'End'
  | 'Replace';

/** Office初始化状态 */
export interface OfficeReadyState {
  /** 是否已初始化 */
  isReady: boolean;
  /** 宿主应用类型 */
  host: OfficeHostType;
  /** 平台 */
  platform?: string;
  /** 错误信息 */
  error?: string;
}

/** 范围地址工具类型 */
export interface RangeAddress {
  /** 工作表名称 */
  sheetName?: string;
  /** 起始行 */
  startRow: number;
  /** 起始列 */
  startColumn: number;
  /** 结束行 */
  endRow: number;
  /** 结束列 */
  endColumn: number;
}

/** 单元格地址 */
export interface CellAddress {
  /** 行号（从1开始） */
  row: number;
  /** 列号（从1开始） */
  column: number;
  /** 列字母 */
  columnLetter: string;
  /** 完整地址 */
  address: string;
}