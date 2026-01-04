/**
 * 统一助手面板组件
 * 集成生成、修改、图表三种模式
 * 支持流式响应、连续对话、撤销重做
 * V3增强：智能位置选择、样式模式选择、设置集成
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Loading } from '@/components/common';
import { useStreamingAI } from '@/hooks/useStreamingAI';
import { useHistory } from '@/hooks/useHistory';
import { useConversation } from '@/hooks/useConversation';
import { useSettings } from '@/hooks/useSettings';
import { excelAdapter } from '@/adapters/excel-adapter';
import { tableGenerationService } from '@/services/table-generation-service';
import { tableModificationService } from '@/services/table-modification-service';
import { chartGenerationService } from '@/services/chart-generation-service';
import type {
  AssistantMode,
  ReadTableData,
  StyledTableData,
  ColorThemeName,
  InsertPositionMode,
  StyleMode,
} from '@/types/common';

/**
 * 模式配置
 */
const MODE_CONFIG: Record<AssistantMode, { label: string; icon: string; placeholder: string }> = {
  generate: {
    label: '生成表格',
    icon: '📊',
    placeholder: '描述你想创建的表格，例如：创建一个销售数据表，包含产品名称、数量、单价、总价...',
  },
  modify: {
    label: '修改表格',
    icon: '✏️',
    placeholder: '描述你想如何修改表格，例如：添加一列"折扣率"，删除第3行...',
  },
  chart: {
    label: '创建图表',
    icon: '📈',
    placeholder: '描述你想创建的图表，例如：根据销售数据创建一个柱状图...',
  },
};

/**
 * 统一助手面板组件
 */
export const UnifiedAssistantPanel: React.FC = () => {
  // 状态
  const [mode, setMode] = useState<AssistantMode>('generate');
  const [input, setInput] = useState('');
  const [selectedTable, setSelectedTable] = useState<ReadTableData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // V3: 位置和样式状态
  const [positionMode, setPositionMode] = useState<InsertPositionMode>('auto');
  const [manualPosition, setManualPosition] = useState<string>('');
  const [styleMode, setStyleMode] = useState<StyleMode>('template');
  const [showPositionOptions, setShowPositionOptions] = useState(false);

  // Hooks
  const streaming = useStreamingAI();
  const history = useHistory();
  const conversation = useConversation();
  const { settings, updateSetting } = useSettings();

  // 从设置中获取默认值
  const theme = settings.style.defaultTheme;

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation.currentConversation?.messages, scrollToBottom]);

  /**
   * 检测并加载当前选中的表格
   */
  const detectTable = useCallback(async () => {
    try {
      const detection = await excelAdapter.detectTableRange();
      if (detection.detected && detection.address) {
        const tableData = await excelAdapter.readTableData(detection.address);
        if (tableData) {
          setSelectedTable(tableData);
          conversation.setActiveTable(tableData.address, tableData.sheetName);
          return tableData;
        }
      }
      setSelectedTable(null);
      return null;
    } catch (err) {
      console.error('[UnifiedAssistantPanel] 检测表格失败:', err);
      return null;
    }
  }, [conversation]);

  /**
   * V3: 获取插入位置
   */
  const getInsertPosition = useCallback(async (): Promise<string> => {
    try {
      const resolved = await excelAdapter.resolveInsertPosition({
        mode: positionMode,
        manualAddress: manualPosition || undefined,
        newSheetName: `表格_${Date.now()}`,
      });
      return resolved.address;
    } catch (err) {
      console.error('[UnifiedAssistantPanel] 获取插入位置失败:', err);
      return 'A1';
    }
  }, [positionMode, manualPosition]);

  /**
   * V3: 获取当前选区作为手动位置
   */
  const captureCurrentSelection = useCallback(async () => {
    try {
      const address = await excelAdapter.getSelectedCellAddress();
      setManualPosition(address);
      setPositionMode('manual');
    } catch (err) {
      console.error('[UnifiedAssistantPanel] 获取选区失败:', err);
    }
  }, []);

  /**
   * 处理生成模式
   */
  const handleGenerate = useCallback(async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setError(null);

    // 添加用户消息
    conversation.addMessage('user', input);

    try {
      // 添加助手消息（流式）
      const assistantMsg = conversation.addMessage('assistant', '', undefined, true);

      // V3: 获取插入位置
      const insertPosition = await getInsertPosition();

      // 生成表格
      const result = await tableGenerationService.generateTable({
        prompt: input,
        options: { includeExampleData: true, rowCount: 5 },
      });

      if (result.success && result.data) {
        // 添加助手消息
        if (assistantMsg) {
          conversation.updateStreamingMessage(
            assistantMsg.id,
            `已创建表格 "${result.data.tableName}"，包含 ${result.data.columns.length} 列，${result.data.rows.length} 行数据。\n位置: ${insertPosition}`,
            true
          );
        }

        // V3: 使用指定位置写入表格
        await excelAdapter.writeStyledTable(result.data, {
          createTable: settings.table.defaultCreateAsTable,
          startAddress: insertPosition,
        });

        // 添加到历史
        history.pushHistory(
          'create',
          `创建表格: ${result.data.tableName}`,
          null,
          result.data,
          insertPosition,
          'Sheet1'
        );
      } else {
        if (assistantMsg) {
          conversation.updateStreamingMessage(
            assistantMsg.id,
            result.error || '生成表格失败',
            true
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败');
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  }, [input, settings, conversation, history, getInsertPosition]);

  /**
   * 处理修改模式
   */
  const handleModify = useCallback(async () => {
    if (!input.trim()) return;

    // 先检测表格
    let tableData = selectedTable;
    if (!tableData) {
      tableData = await detectTable();
      if (!tableData) {
        setError('请先选择要修改的表格区域');
        return;
      }
    }

    setIsProcessing(true);
    setError(null);

    // 添加用户消息
    conversation.addMessage('user', input);

    try {
      // 保存修改前的状态
      const beforeState: StyledTableData = {
        tableName: tableData.tableName || 'Table',
        columns: tableData.columns.map(c => ({ name: c.name, type: c.type })),
        rows: [...tableData.rows],
      };

      // 请求修改
      const result = await tableModificationService.requestModification({
        prompt: input,
        currentTable: tableData,
        sheetName: tableData.sheetName,
      });

      if (result.success && result.operations) {
        // 应用修改
        const modifiedData = tableModificationService.applyOperations(tableData, result.operations);

        // 写入 Excel
        await excelAdapter.updateTableData(tableData.address, modifiedData, tableData.sheetName);

        // 添加助手消息
        conversation.addMessage('assistant', result.explanation || '表格已修改完成', {
          type: 'modify',
          tableAddress: tableData.address,
          success: true,
        });

        // 添加到历史
        history.pushHistory(
          'modify',
          result.explanation || '修改表格',
          beforeState,
          modifiedData,
          tableData.address,
          tableData.sheetName
        );

        // 刷新表格数据
        await detectTable();
      } else {
        conversation.addMessage('assistant', result.error || '修改失败', {
          type: 'modify',
          success: false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改失败');
      conversation.addMessage('assistant', '处理请求时发生错误');
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  }, [input, selectedTable, detectTable, conversation, history]);

  /**
   * 处理图表模式
   */
  const handleChart = useCallback(async () => {
    if (!input.trim()) return;

    // 先检测表格
    let tableData = selectedTable;
    if (!tableData) {
      tableData = await detectTable();
    }

    setIsProcessing(true);
    setError(null);

    // 添加用户消息
    conversation.addMessage('user', input);

    try {
      // 生成图表配置
      const result = await chartGenerationService.generateChart(
        { prompt: input, stylePreference: { theme } },
        tableData || undefined
      );

      if (result.success && result.chartConfig) {
        // 创建图表
        const chartName = await excelAdapter.createChartV2(
          result.chartConfig.dataSource.dataRange,
          result.chartConfig.type,
          {
            title: result.chartConfig.title,
            showLegend: result.chartConfig.showLegend,
            legendPosition: result.chartConfig.legendPosition,
            showDataLabels: result.chartConfig.showDataLabels,
          }
        );

        conversation.addMessage(
          'assistant',
          `图表 "${result.chartConfig.title || chartName}" 已创建成功！`,
          { type: 'chart', success: true }
        );
      } else {
        conversation.addMessage('assistant', result.error || '创建图表失败', {
          type: 'chart',
          success: false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建图表失败');
      conversation.addMessage('assistant', '处理请求时发生错误');
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  }, [input, selectedTable, detectTable, theme, conversation]);

  /**
   * 提交处理
   */
  const handleSubmit = useCallback(() => {
    switch (mode) {
      case 'generate':
        handleGenerate();
        break;
      case 'modify':
        handleModify();
        break;
      case 'chart':
        handleChart();
        break;
    }
  }, [mode, handleGenerate, handleModify, handleChart]);

  /**
   * 撤销
   */
  const handleUndo = useCallback(async () => {
    const snapshot = history.undo();
    if (snapshot) {
      try {
        await excelAdapter.updateTableData(snapshot.address, snapshot.data, snapshot.sheetName);
        await detectTable();
      } catch (err) {
        console.error('[UnifiedAssistantPanel] 撤销失败:', err);
      }
    }
  }, [history, detectTable]);

  /**
   * 重做
   */
  const handleRedo = useCallback(async () => {
    const snapshot = history.redo();
    if (snapshot) {
      try {
        await excelAdapter.updateTableData(snapshot.address, snapshot.data, snapshot.sheetName);
        await detectTable();
      } catch (err) {
        console.error('[UnifiedAssistantPanel] 重做失败:', err);
      }
    }
  }, [history, detectTable]);

  /**
   * 新对话
   */
  const handleNewConversation = useCallback(() => {
    conversation.startNewConversation();
    setInput('');
    setError(null);
  }, [conversation]);

  /**
   * 键盘事件
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-3 bg-white border-b">
        {/* 模式切换 */}
        <div className="flex gap-1">
          {(Object.keys(MODE_CONFIG) as AssistantMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === m
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {MODE_CONFIG[m].icon} {MODE_CONFIG[m].label}
            </button>
          ))}
        </div>

        {/* 撤销/重做/新对话 */}
        <div className="flex gap-1">
          <button
            onClick={handleUndo}
            disabled={!history.canUndo}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"
            title="撤销"
          >
            ↩️
          </button>
          <button
            onClick={handleRedo}
            disabled={!history.canRedo}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"
            title="重做"
          >
            ↪️
          </button>
          <button
            onClick={handleNewConversation}
            className="p-2 rounded hover:bg-gray-100"
            title="新对话"
          >
            ➕
          </button>
        </div>
      </div>

      {/* V3: 生成模式的位置选择选项 */}
      {mode === 'generate' && (
        <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">📍 插入位置:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPositionMode('auto')}
                  className={`px-2 py-1 text-xs rounded ${
                    positionMode === 'auto'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border'
                  }`}
                  title="自动检测空白区域"
                >
                  🎯 智能
                </button>
                <button
                  onClick={() => {
                    setPositionMode('manual');
                    captureCurrentSelection();
                  }}
                  className={`px-2 py-1 text-xs rounded ${
                    positionMode === 'manual'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border'
                  }`}
                  title="使用当前选区"
                >
                  📌 手动
                </button>
                <button
                  onClick={() => setPositionMode('newSheet')}
                  className={`px-2 py-1 text-xs rounded ${
                    positionMode === 'newSheet'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border'
                  }`}
                  title="创建新工作表"
                >
                  📄 新工作表
                </button>
              </div>
            </div>

            {/* 手动位置输入 */}
            {positionMode === 'manual' && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={manualPosition}
                  onChange={e => setManualPosition(e.target.value.toUpperCase())}
                  placeholder="如: A1"
                  className="w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={captureCurrentSelection}
                  className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                  title="获取当前选区"
                >
                  🎯
                </button>
              </div>
            )}
          </div>

          {/* 样式模式选择 */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-medium text-gray-700">🎨 样式:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setStyleMode('template')}
                className={`px-2 py-1 text-xs rounded ${
                  styleMode === 'template'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border'
                }`}
              >
                📋 模板
              </button>
              <button
                onClick={() => setStyleMode('ai')}
                className={`px-2 py-1 text-xs rounded ${
                  styleMode === 'ai'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border'
                }`}
              >
                🤖 AI生成
              </button>
              <button
                onClick={() => setStyleMode('none')}
                className={`px-2 py-1 text-xs rounded ${
                  styleMode === 'none'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border'
                }`}
              >
                📝 无样式
              </button>
            </div>

            {/* 模板选择 */}
            {styleMode === 'template' && (
              <select
                value={theme}
                onChange={e =>
                  updateSetting('style', 'defaultTheme', e.target.value as ColorThemeName)
                }
                className="text-xs px-2 py-1 border rounded bg-white"
              >
                <option value="professional">专业蓝</option>
                <option value="energetic">活力橙</option>
                <option value="nature">自然绿</option>
                <option value="elegant">优雅紫</option>
                <option value="fresh">清新蓝</option>
                <option value="dark">深色</option>
              </select>
            )}
          </div>
        </div>
      )}

      {/* 选中的表格信息 */}
      {mode !== 'generate' && (
        <div className="px-3 py-2 bg-blue-50 border-b text-sm">
          {selectedTable ? (
            <div className="flex items-center justify-between">
              <span>
                📋 已选择: {selectedTable.tableName || selectedTable.address}
                <span className="text-gray-500 ml-2">
                  ({selectedTable.totalRows}行 × {selectedTable.totalColumns}列)
                </span>
              </span>
              <button onClick={detectTable} className="text-blue-500 hover:underline">
                刷新
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-gray-500">
              <span>未选择表格，请在 Excel 中选择数据区域</span>
              <button onClick={detectTable} className="text-blue-500 hover:underline">
                检测选区
              </button>
            </div>
          )}
        </div>
      )}

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {conversation.currentConversation?.messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg ${
                msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              {msg.tableOperation && (
                <div
                  className={`mt-2 text-xs ${
                    msg.tableOperation.success ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {msg.tableOperation.success ? '✓ 操作成功' : '✗ 操作失败'}
                </div>
              )}
              {msg.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-3 bg-white border-t">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={MODE_CONFIG[mode].placeholder}
            rows={2}
            className="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />
          <div className="flex flex-col gap-1">
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || !input.trim()}
              className="px-4"
            >
              {isProcessing ? <Loading size="small" /> : '发送'}
            </Button>
          </div>
        </div>

        {/* 历史统计和位置信息 */}
        <div className="mt-2 text-xs text-gray-400 flex justify-between">
          <span>
            {conversation.stats.messageCount > 0
              ? `${conversation.stats.messageCount} 条消息`
              : '开始新对话'}
            {mode === 'generate' && positionMode === 'manual' && manualPosition && (
              <span className="ml-2 text-blue-500">→ {manualPosition}</span>
            )}
          </span>
          <span>
            历史记录: {history.stats.totalEntries} / {history.stats.maxEntries}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAssistantPanel;
