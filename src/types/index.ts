/**
 * 类型定义统一导出
 */

// 通用类型 - 先导出，因为其他模块依赖它
export * from './common';

// 考勤类型
export * from './attendance';

// 模板类型
export * from './template';

// NLP类型
export * from './nlp';

// Office类型
export * from './office';