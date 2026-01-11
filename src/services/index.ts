/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2026-01-06 16:46:40
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

// 模型服务
export { ModelService, modelService, DEFAULT_MODELS } from './model-service';
export type { ModelInfo, ModelOption, CachedModels } from './model-service';

// 文件解析服务
export { fileParserService } from './file-parser-service';
export type { ParsedFileData, UploadedFile } from './file-parser-service';

// API预设管理服务
export { apiPresetService } from './api-preset-service';
export type {
  ApiPreset,
  ApiProvider,
  CreateApiPresetRequest,
  UpdateApiPresetRequest,
  ApiPresetResponse,
  ApiPresetListResponse,
} from '@/types/api-preset';
