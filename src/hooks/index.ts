/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2026-01-11 10:07:23
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
/**
 * Hooks 统一导出
 */

// 核心功能 Hook - 智能表格生成
export * from './useTableGeneration';

// 流式 AI Hook
export * from './useStreamingAI';

// Office 集成
export * from './useOffice';

// 历史管理 Hook
export * from './useHistory';

// 对话管理 Hook
export * from './useConversation';

// 旧 Hooks（保留以备兼容）
export * from './useAttendance';
export * from './useAIAttendance';
export * from './useNLP';
export * from './useTemplate';

// V3 新增：设置管理
export * from './useSettings';

// V4 新增：模型管理
export * from './useModels';

// V5 新增：API预设管理
export * from './useApiPresets';
