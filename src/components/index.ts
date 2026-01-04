/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2026-01-03 12:21:11
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
/**
 * 组件统一导出
 */

// 通用组件
export * from './common';

// 主功能组件 - 智能表格生成
export { TableGeneratorPanel, TablePreview } from './TableGeneratorPanel';

// V2 统一助手面板（生成/修改/图表三合一）
export { UnifiedAssistantPanel } from './UnifiedAssistantPanel';

// V3 设置面板
export { SettingsPanel } from './SettingsPanel';

// 旧组件（保留以备兼容，但主功能已迁移到 TableGeneratorPanel）
export { NLPInput } from './NLPInput';
export { TemplateSelector } from './TemplateSelector';
export { AttendanceTable } from './AttendanceTable';
export { StatisticsPanel } from './StatisticsPanel';
