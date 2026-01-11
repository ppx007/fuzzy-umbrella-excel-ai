/*
 * @Author: px007 q13547983465@163.com
 * @LastEditTime: 2026-01-03 13:10:53
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
/**
 * 类型定义统一导出
 */

// 通用类型 - 先导出，因为其他模块依赖它
export * from './common';

// 考勤类型
export * from './attendance';

// 模板类型
export * from './template';

// NLP类型 - 排除与 common 冲突的类型
export {
  AttendanceIntent,
  EntityType,
  ChartType as NlpChartType,
  StatisticType,
  type ExtractedEntities,
  type ExtractedEntity,
  type NLPResult,
  type IntentRule,
  type EntityRule,
  type ProcessingContext,
  type Token,
  type TokenizerConfig,
} from './nlp';

// Office类型 - 排除与 common 冲突的类型
export {
  type OfficeHostType,
  type DocumentInfo,
  type TableConfig,
  type TableReference,
  type ChartConfig as OfficeChartConfig,
  type ChartReference,
  type StyleConfig,
  type DataValidationConfig,
  type PivotTableConfig,
  type OfficeAdapter,
  type ExcelChartType,
  type ExcelTableStyle,
  type WordTableStyle,
  type WordInsertLocation,
  type OfficeReadyState,
  type RangeAddress,
  type CellAddress,
} from './office';
