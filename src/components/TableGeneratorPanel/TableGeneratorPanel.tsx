/**
 * 表格生成面板组件
 * 允许用户通过自然语言输入来生成 Excel 表格
 * 支持颜色主题选择和智能条件格式
 */

import React, { useState, useCallback } from 'react';
import { useTableGeneration, StylePreference } from '@/hooks/useTableGeneration';
import { Button, Card, Loading } from '../common';
import { TablePreview } from './TablePreview';
import { StyleSelector } from './StyleSelector';
import { TableGenerationRequest, ColorThemeName } from '@/types/common';

/**
 * 场景模板定义
 */
interface SceneTemplate {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  description: string;
}

/**
 * 预设的场景模板
 */
const sceneTemplates: SceneTemplate[] = [
  {
    id: 'attendance',
    name: '考勤表',
    icon: '📅',
    prompt: '创建一个员工考勤表，包含姓名、部门、日期、上班时间、下班时间、工作时长、状态',
    description: '员工每日打卡记录',
  },
  {
    id: 'sales',
    name: '销售报表',
    icon: '📊',
    prompt: '创建一个销售数据表，包含日期、产品名称、数量、单价、总额、销售员、客户',
    description: '产品销售数据统计',
  },
  {
    id: 'inventory',
    name: '库存表',
    icon: '📦',
    prompt: '创建一个产品库存表，包含产品名称、SKU编码、数量、单价、库存位置、最后更新日期',
    description: '仓库库存管理',
  },
  {
    id: 'contacts',
    name: '客户联系表',
    icon: '👥',
    prompt: '创建一个客户联系表，包含客户姓名、公司名称、电话、邮箱、地址、备注',
    description: '客户信息管理',
  },
  {
    id: 'project',
    name: '项目进度表',
    icon: '📋',
    prompt: '创建一个项目进度跟踪表，包含项目名称、负责人、开始日期、截止日期、完成率、状态',
    description: '项目任务追踪',
  },
  {
    id: 'expense',
    name: '费用报销表',
    icon: '💰',
    prompt: '创建一个费用报销表，包含日期、费用类型、金额、报销人、审批状态、备注',
    description: '员工费用报销记录',
  },
];

/**
 * 表格生成面板组件
 */
export const TableGeneratorPanel: React.FC = () => {
  // 使用表格生成 Hook
  const {
    isLoading,
    isWriting,
    error,
    generatedTable,
    generateStyledTable,
    writeStyledToExcel,
    clearTable,
    clearError,
  } = useTableGeneration();

  // 本地状态
  const [prompt, setPrompt] = useState('');
  const [includeExampleData, setIncludeExampleData] = useState(true);
  const [rowCount, setRowCount] = useState(5);
  const [writeSuccess, setWriteSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // 样式相关状态
  const [selectedTheme, setSelectedTheme] = useState<ColorThemeName>('professional');
  const [enableConditionalFormat, setEnableConditionalFormat] = useState(true);
  const [showStyleOptions, setShowStyleOptions] = useState(false);

  /**
   * 处理生成表格（带样式）
   */
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    const options: TableGenerationRequest['options'] = {
      includeExampleData,
      rowCount: includeExampleData ? rowCount : undefined,
      language: 'zh',
    };

    const stylePreference: StylePreference = {
      theme: selectedTheme,
      enableConditionalFormat,
    };

    await generateStyledTable(prompt, options, stylePreference);
  }, [
    prompt,
    includeExampleData,
    rowCount,
    selectedTheme,
    enableConditionalFormat,
    generateStyledTable,
  ]);

  /**
   * 处理键盘事件
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  /**
   * 处理重新生成
   */
  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  /**
   * 处理写入 Excel（带样式）
   */
  const handleWriteToExcel = useCallback(async () => {
    setWriteSuccess(false);
    await writeStyledToExcel();
    // 检查 hook 中是否有错误
    if (!error) {
      setWriteSuccess(true);
      setTimeout(() => setWriteSuccess(false), 3000); // 3秒后隐藏成功提示
    }
  }, [writeStyledToExcel, error]);

  /**
   * 处理清除
   */
  const handleClear = useCallback(() => {
    clearTable();
    clearError();
    setPrompt('');
    setWriteSuccess(false);
  }, [clearTable, clearError]);

  /**
   * 处理模板选择
   */
  const handleTemplateSelect = useCallback((template: SceneTemplate) => {
    setPrompt(template.prompt);
    setSelectedTemplate(template.id);
  }, []);

  return (
    <div className="space-y-4">
      {/* 场景模板选择 */}
      <Card title="📋 选择场景模板" className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sceneTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              disabled={isLoading}
              className={`
                p-3 rounded-lg border-2 text-left transition-all
                ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{template.icon}</span>
                <span className="font-medium text-gray-900">{template.name}</span>
              </div>
              <p className="text-xs text-gray-500">{template.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* 自定义输入 */}
      <Card title="✏️ 自定义描述" className="mb-4">
        <div className="space-y-4">
          {/* 输入区域 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              描述您想创建的表格（可选择上方模板或自由输入）
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={e => {
                  setPrompt(e.target.value);
                  setSelectedTemplate(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="请描述您想创建的表格，例如：创建一个员工信息表，包含姓名、部门、入职日期..."
                rows={3}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* 生成选项 */}
          <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeExampleData}
                onChange={e => setIncludeExampleData(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">生成示例数据</span>
            </label>

            {includeExampleData && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">行数：</label>
                <select
                  value={rowCount}
                  onChange={e => setRowCount(Number(e.target.value))}
                  disabled={isLoading}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={3}>3 行</option>
                  <option value={5}>5 行</option>
                  <option value={10}>10 行</option>
                  <option value={20}>20 行</option>
                </select>
              </div>
            )}

            {/* 样式选项切换按钮 */}
            <button
              onClick={() => setShowStyleOptions(!showStyleOptions)}
              disabled={isLoading}
              className={`
                flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors
                ${
                  showStyleOptions
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span>🎨</span>
              <span>样式选项</span>
              <svg
                className={`w-4 h-4 transition-transform ${showStyleOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* 样式选择器（可折叠） */}
          {showStyleOptions && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <StyleSelector
                selectedTheme={selectedTheme}
                onThemeChange={setSelectedTheme}
                enableConditionalFormat={enableConditionalFormat}
                onConditionalFormatChange={setEnableConditionalFormat}
                disabled={isLoading}
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button onClick={handleGenerate} loading={isLoading} disabled={!prompt.trim()}>
              {isLoading ? '生成中...' : '🚀 生成表格'}
            </Button>
            {(generatedTable || error) && (
              <Button variant="outline" onClick={handleClear} disabled={isLoading}>
                清除
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 加载状态 */}
      {isLoading && (
        <Card>
          <div className="flex items-center justify-center py-8">
            <Loading size="medium" text="AI 正在生成表格，请稍候..." />
          </div>
        </Card>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">生成失败</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 写入成功提示 */}
      {writeSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-sm text-green-800">✅ 成功写入 Excel！</p>
          </div>
        </div>
      )}

      {/* 表格预览 */}
      {generatedTable && !isLoading && (
        <Card title="📊 预览与导出">
          <TablePreview
            table={generatedTable}
            isWriting={isWriting}
            onWriteToExcel={handleWriteToExcel}
            onRegenerate={handleRegenerate}
          />
        </Card>
      )}
    </div>
  );
};

export default TableGeneratorPanel;
