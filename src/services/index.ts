/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2026-01-03 11:20:00
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
/**
 * 服务模块导出
 */

export * from './ai-service';
export * from './table-generation-service';

// 流式 AI 服务
export {
  AIStreamService,
  aiStreamService,
  streamChat,
  streamMultiTurnChat,
} from './ai-stream-service';
export type { StreamConfig, StreamCallbacks, ChatMessage, StreamState } from './ai-stream-service';

// 表格修改服务
export {
  TableModificationService,
  tableModificationService,
  modifyTable,
} from './table-modification-service';

// 图表生成服务
export {
  ChartGenerationService,
  chartGenerationService,
  generateChart,
} from './chart-generation-service';
