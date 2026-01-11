/**
 * 统一助手面板组件
 * V4: 简化设计 - 聚焦对话体验
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Loading } from '@/components/common';
import { FileUpload } from '@/components/FileUpload';
import { useHistory } from '@/hooks/useHistory';
import { useConversation } from '@/hooks/useConversation';
import { useSettings } from '@/hooks/useSettings';
import { excelAdapter } from '@/adapters/excel-adapter';
import { tableGenerationService } from '@/services/table-generation-service';
import { tableModificationService } from '@/services/table-modification-service';
import { chartGenerationService } from '@/services/chart-generation-service';
import { fileParserService } from '@/services/file-parser-service';
import type { UploadedFile } from '@/services/file-parser-service';
import { normalizeBaseUrl } from '@/config';
import type { ReadTableData, StyledTableData, InsertPositionMode } from '@/types/common';

/**
 * 快捷操作示例
 */
const QUICK_EXAMPLES = [
  { icon: '📊', text: '创建销售报表', prompt: '创建一个包含产品、数量、单价、总金额的销售数据表' },
  { icon: '📅', text: '员工考勤表', prompt: '创建一个本周的员工考勤记录表' },
  { icon: '💰', text: '财务预算表', prompt: '创建一个年度部门预算对比表' },
  { icon: '📈', text: '生成图表', prompt: '根据选中的数据创建柱状图' },
  {
    icon: '📋',
    text: '创建项目表',
    prompt: '创建一个包含任务名称、负责人、截止日期、状态的项目进度表',
  },
];

/**
 * 统一助手面板组件
 */
export const UnifiedAssistantPanel: React.FC = () => {
  // 状态
  const [input, setInput] = useState('');
  const [selectedTable, setSelectedTable] = useState<ReadTableData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // 位置模式
  const [positionMode, setPositionMode] = useState<InsertPositionMode>('auto');
  const [manualPosition, setManualPosition] = useState<string>('');

  // 文件上传
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  // Hooks
  const history = useHistory();
  const conversation = useConversation();
  const { settings } = useSettings();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastDetectedAddressRef = useRef<string | null>(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation.currentConversation?.messages, scrollToBottom]);

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 同步设置到服务（自动将外部 URL 转换为代理路径）
  useEffect(() => {
    if (settings.ai.baseUrl && settings.ai.apiKey) {
      // 将外部 URL 转换为代理路径以避免 CORS 问题
      const proxyBaseUrl = normalizeBaseUrl(settings.ai.baseUrl);
      console.log('[UnifiedAssistantPanel] 同步设置到服务:', {
        原始URL: settings.ai.baseUrl,
        代理URL: proxyBaseUrl,
        model: settings.ai.model,
      });

      tableGenerationService.updateConfig({
        baseUrl: proxyBaseUrl,
        apiKey: settings.ai.apiKey,
        model: settings.ai.model,
      });
      tableModificationService.updateConfig({
        baseUrl: proxyBaseUrl,
        apiKey: settings.ai.apiKey,
        model: settings.ai.model,
      });
      chartGenerationService.updateConfig({
        baseUrl: proxyBaseUrl,
        apiKey: settings.ai.apiKey,
        model: settings.ai.model,
      });
    }
  }, [settings.ai.baseUrl, settings.ai.apiKey, settings.ai.model]);

  /**
   * 检测并加载当前选中的表格（增强版）
   * @param silent 是否静默检测（不显示错误）
   * @param forceRefresh 是否强制刷新（忽略缓存）
   */
  const detectTable = useCallback(
    async (silent = false, forceRefresh = false): Promise<ReadTableData | null> => {
      // 防止重复检测
      if (isDetecting) {
        return selectedTable;
      }

      try {
        setIsDetecting(true);

        // 方法1: 检测用户选区或当前表格
        const detection = await excelAdapter.detectTableRange();
        if (detection.detected && detection.address) {
          // 如果地址没变且不强制刷新，直接返回缓存
          if (
            !forceRefresh &&
            detection.address === lastDetectedAddressRef.current &&
            selectedTable
          ) {
            return selectedTable;
          }

          const tableData = await excelAdapter.readTableData(detection.address);
          if (tableData && tableData.rows.length > 0) {
            console.log('[UnifiedAssistantPanel] 检测到表格:', {
              地址: tableData.address,
              表名: tableData.tableName,
              行数: tableData.rows.length,
            });
            setSelectedTable(tableData);
            lastDetectedAddressRef.current = tableData.address;
            conversation.setActiveTable(tableData.address, tableData.sheetName);
            return tableData;
          }
        }

        // 方法2: 如果没有检测到选区，尝试获取工作表中的第一个表格
        try {
          const tables = await excelAdapter.getTableList();
          if (tables.length > 0) {
            const firstTable = tables[0];
            // 提取纯地址（去除工作表前缀）
            let address = firstTable.address;
            if (address.includes('!')) {
              address = address.split('!')[1];
            }

            // 如果地址没变且不强制刷新，直接返回缓存
            if (!forceRefresh && address === lastDetectedAddressRef.current && selectedTable) {
              return selectedTable;
            }

            const tableData = await excelAdapter.readTableData(address);
            if (tableData) {
              console.log('[UnifiedAssistantPanel] 自动选择第一个表格:', firstTable.name);
              setSelectedTable(tableData);
              lastDetectedAddressRef.current = tableData.address;
              conversation.setActiveTable(tableData.address, tableData.sheetName);
              return tableData;
            }
          }
        } catch (tableListError) {
          console.log('[UnifiedAssistantPanel] 获取表格列表失败:', tableListError);
        }

        setSelectedTable(null);
        lastDetectedAddressRef.current = null;
        return null;
      } catch (err) {
        if (!silent) {
          console.error('[UnifiedAssistantPanel] 检测表格失败:', err);
        }
        return null;
      } finally {
        setIsDetecting(false);
      }
    },
    [conversation, isDetecting, selectedTable]
  );

  /**
   * 组件加载时自动检测表格（仅一次）
   */
  useEffect(() => {
    // 延迟自动检测，等待 Excel 环境完全加载
    const timer = setTimeout(() => {
      detectTable(true);
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅在组件挂载时执行一次

  /**
   * 按钮点击时手动检测表格（强制刷新）
   */
  const handleDetectTable = useCallback(() => {
    detectTable(false, true);
  }, [detectTable]);

  /**
   * 输入框获得焦点时检测表格（静默，不强制刷新）
   */
  const handleInputFocus = useCallback(() => {
    // 仅在没有选中表格时才检测
    if (!selectedTable) {
      detectTable(true, false);
    }
  }, [detectTable, selectedTable]);

  /**
   * 获取插入位置
   */
  const getInsertPosition = useCallback(async (): Promise<{
    sheetName?: string;
    startCell: string;
  }> => {
    try {
      const resolved = await excelAdapter.resolveInsertPosition({
        mode: positionMode,
        manualAddress: manualPosition || undefined,
        newSheetName: `表格_${Date.now()}`,
      });
      return resolved;
    } catch (err) {
      console.error('[UnifiedAssistantPanel] 获取插入位置失败:', err);
      return { startCell: 'A1' };
    }
  }, [positionMode, manualPosition]);

  /**
   * 处理文件上传
   */
  const handleFileUploaded = useCallback(
    (file: UploadedFile) => {
      setUploadedFile(file);
      if (file.parsedData) {
        conversation.addMessage(
          'assistant',
          `📄 已上传文件「${file.name}」\n` +
            `📊 包含 ${file.parsedData.totalRows} 行数据，${file.parsedData.columns.length} 列\n` +
            `📋 列: ${file.parsedData.columns.map(c => c.title).join(', ')}\n\n` +
            `请告诉我您想如何处理这些数据，例如：\n` +
            `• "将这些数据填入表格"\n` +
            `• "根据这些数据创建销售报表"\n` +
            `• "分析这些数据并生成图表"`
        );
      }
    },
    [conversation]
  );

  /**
   * 处理文件移除
   */
  const handleFileRemoved = useCallback(() => {
    setUploadedFile(null);
  }, []);

  /**
   * 智能分析用户意图并处理
   */
  const processUserInput = useCallback(
    async (userInput: string) => {
      if (!userInput.trim()) return;

      setIsProcessing(true);
      setError(null);

      // 添加用户消息
      conversation.addMessage('user', userInput);

      try {
        // 智能判断意图
        const lowerInput = userInput.toLowerCase();
        const isModify =
          lowerInput.includes('修改') ||
          lowerInput.includes('添加') ||
          lowerInput.includes('删除') ||
          lowerInput.includes('更新') ||
          lowerInput.includes('改成') ||
          lowerInput.includes('换成');
        // 图表相关关键词 - 包含各种图表类型
        const chartKeywords = [
          '图表',
          '图',
          '可视化',
          '绘制',
          '画',
          // 常见图表类型
          '柱状图',
          '条形图',
          '折线图',
          '饼图',
          '环形图',
          '面积图',
          '散点图',
          '气泡图',
          '雷达图',
          '漏斗图',
          '仪表图',
          // 高级图表类型
          '旭日图',
          '树图',
          '矩形树图',
          '热力图',
          '桑基图',
          '词云',
          '地图',
          '瀑布图',
          '组合图',
          '双轴图',
          // 英文关键词
          'chart',
          'graph',
          'plot',
          'bar',
          'line',
          'pie',
          'scatter',
          'sunburst',
          'treemap',
          'heatmap',
          'radar',
        ];
        const isChart = chartKeywords.some(keyword => lowerInput.includes(keyword));

        // 检查是否有上传的文件
        const hasUploadedFile = uploadedFile?.status === 'success' && uploadedFile.parsedData;

        // 判断是否要使用上传的文件数据
        const useFileData =
          hasUploadedFile &&
          (lowerInput.includes('填入') ||
            lowerInput.includes('导入') ||
            lowerInput.includes('这些数据') ||
            lowerInput.includes('上传的') ||
            lowerInput.includes('文件') ||
            lowerInput.includes('数据'));

        if (isChart) {
          await handleChart(userInput);
        } else if (isModify && selectedTable) {
          await handleModify(userInput);
        } else if (useFileData && uploadedFile?.parsedData) {
          // 基于上传文件生成/处理表格
          await handleGenerateFromFile(userInput, uploadedFile.parsedData);
        } else {
          await handleGenerate(userInput);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '处理失败';
        setError(errorMessage);
        conversation.addMessage('assistant', `抱歉，处理时出现错误：${errorMessage}`, {
          isError: true,
          originalPrompt: userInput,
        });
      } finally {
        setIsProcessing(false);
        setInput('');
      }
    },
    [conversation, selectedTable, uploadedFile]
  );

  /**
   * 从用户输入中提取行数
   */
  const extractRowCount = useCallback(
    (input: string): number => {
      // 匹配 "X行" 或 "X条" 或 "X个" 等
      const match = input.match(/(\d+)\s*(行|条|个|项|条数据|行数据)/);
      if (match) {
        const count = parseInt(match[1], 10);
        // 限制在合理范围内
        return Math.min(Math.max(count, 1), 100);
      }
      return settings.table.defaultRowCount || 5;
    },
    [settings.table.defaultRowCount]
  );

  /**
   * 计算表格的完整地址范围
   * @param startCell 起始单元格 (如 "A1")
   * @param columns 列数
   * @param rows 行数 (包括表头)
   */
  const calculateTableRange = useCallback(
    (startCell: string, columns: number, rows: number): string => {
      // 解析起始单元格
      const colMatch = startCell.match(/[A-Z]+/i);
      const rowMatch = startCell.match(/\d+/);
      if (!colMatch || !rowMatch) return startCell;

      const startCol = colMatch[0].toUpperCase();
      const startRow = parseInt(rowMatch[0], 10);

      // 计算起始列号
      let colNum = 0;
      for (let i = 0; i < startCol.length; i++) {
        colNum = colNum * 26 + (startCol.charCodeAt(i) - 64);
      }
      const endColNum = colNum + columns - 1;

      // 转换结束列号为字母
      let endCol = '';
      let remaining = endColNum;
      while (remaining > 0) {
        remaining--;
        endCol = String.fromCharCode((remaining % 26) + 65) + endCol;
        remaining = Math.floor(remaining / 26);
      }

      const endRow = startRow + rows - 1;

      return `${startCell}:${endCol}${endRow}`;
    },
    []
  );

  /**
   * 处理基于文件生成表格
   */
  const handleGenerateFromFile = useCallback(
    async (prompt: string, fileData: NonNullable<UploadedFile['parsedData']>) => {
      const assistantMsg = conversation.addMessage(
        'assistant',
        '正在根据上传的文件数据生成表格...',
        {
          isStreaming: true,
        }
      );
      const insertPos = await getInsertPosition();

      // 准备文件数据描述
      const fileContext = fileParserService.formatForAIPrompt(fileData, 20);

      // 获取对话历史用于上下文
      const conversationHistory = conversation.currentConversation?.messages || [];

      // 构建增强的提示词
      const enhancedPrompt = `用户上传了一个文件，请根据以下文件内容和用户需求生成表格。

【上传的文件数据】
${fileContext}

【用户需求】
${prompt}

请基于文件中的数据生成表格。如果用户没有特别说明，直接使用文件中的数据创建表格。`;

      const result = await tableGenerationService.generateTable(
        {
          prompt: enhancedPrompt,
          options: {
            includeExampleData: true,
            rowCount: Math.min(fileData.rows.length, 100),
          },
        },
        conversationHistory.length
      );

      if (result.success && result.data) {
        // 如果 AI 没有使用文件数据，则直接使用文件数据
        let tableData = result.data;

        // 检查 AI 返回的数据是否基于文件
        const aiUsedFileData = fileData.columns.some(fc =>
          tableData.columns.some(tc => tc.title === fc.title)
        );

        if (!aiUsedFileData && fileData.rows.length > 0) {
          // AI 没有使用文件数据，直接用文件数据创建表格
          console.log('[UnifiedAssistantPanel] AI 未使用文件数据，直接使用文件数据');
          tableData = {
            tableName: fileData.fileName.replace(/\.[^.]+$/, ''),
            columns: fileData.columns,
            rows: fileData.rows as Record<string, unknown>[],
            metadata: {
              createdAt: new Date().toISOString(),
              source: 'import',
              prompt,
            },
          };
        }

        // 计算表格的完整范围地址
        const totalRows = tableData.rows.length + 1;
        const totalCols = tableData.columns.length;
        const tableRangeAddress = calculateTableRange(insertPos.startCell, totalCols, totalRows);
        const sheetName = insertPos.sheetName || (await excelAdapter.getActiveSheetName());

        if (assistantMsg) {
          conversation.updateStreamingMessage(
            assistantMsg.id,
            `✅ 已从文件创建表格「${tableData.tableName}」\n📊 ${tableData.columns.length} 列 × ${tableData.rows.length} 行\n📍 位置: ${sheetName}!${tableRangeAddress}`,
            true
          );
        }

        await excelAdapter.writeStyledTable(tableData, {
          createTable: settings.table.autoCreateTable,
          startCell: insertPos.startCell,
          sheetName: insertPos.sheetName,
        });

        history.pushHistory(
          'create',
          `从文件创建表格: ${tableData.tableName}`,
          null,
          tableData,
          tableRangeAddress,
          sheetName
        );

        // 清除上传的文件
        setUploadedFile(null);
      } else {
        if (assistantMsg) {
          conversation.removeMessage(assistantMsg.id);
        }
        conversation.addMessage('assistant', `❌ ${result.error || '生成失败'}`, {
          isError: true,
          originalPrompt: prompt,
        });
      }
    },
    [conversation, getInsertPosition, settings, history, calculateTableRange]
  );

  /**
   * 处理生成表格
   */
  const handleGenerate = useCallback(
    async (prompt: string) => {
      const assistantMsg = conversation.addMessage('assistant', '正在生成表格...', {
        isStreaming: true,
      });
      const insertPos = await getInsertPosition();

      // 从用户输入中提取行数
      const rowCount = extractRowCount(prompt);

      // 获取对话历史用于上下文
      const conversationHistory = conversation.currentConversation?.messages || [];

      const result = await tableGenerationService.generateTable(
        {
          prompt,
          options: { includeExampleData: true, rowCount },
        },
        conversationHistory.length
      );

      if (result.success && result.data) {
        // 计算表格的完整范围地址（用于历史记录和撤销）
        const totalRows = result.data.rows.length + 1; // +1 for header
        const totalCols = result.data.columns.length;
        const tableRangeAddress = calculateTableRange(insertPos.startCell, totalCols, totalRows);
        const sheetName = insertPos.sheetName || (await excelAdapter.getActiveSheetName());

        if (assistantMsg) {
          conversation.updateStreamingMessage(
            assistantMsg.id,
            `✅ 已创建「${result.data.tableName}」\n📊 ${result.data.columns.length} 列 × ${result.data.rows.length} 行\n📍 位置: ${sheetName}!${tableRangeAddress}`,
            true
          );
        }

        await excelAdapter.writeStyledTable(result.data, {
          createTable: settings.table.autoCreateTable,
          startCell: insertPos.startCell,
          sheetName: insertPos.sheetName,
        });

        // 使用完整的表格范围地址记录历史
        history.pushHistory(
          'create',
          `创建表格: ${result.data.tableName}`,
          null,
          result.data,
          tableRangeAddress, // 使用完整范围地址，而不仅仅是起始单元格
          sheetName
        );

        console.log('[UnifiedAssistantPanel] 表格创建成功，已记录历史:', {
          tableName: result.data.tableName,
          address: tableRangeAddress,
          sheetName,
        });
      } else {
        if (assistantMsg) {
          // 更新消息为错误状态
          conversation.updateStreamingMessage(
            assistantMsg.id,
            `❌ ${result.error || '生成失败'}`,
            true
          );
          // 并且标记为错误，以便显示重试按钮
          conversation.addMessage('assistant', `❌ ${result.error || '生成失败'}`, {
            isError: true,
            originalPrompt: prompt,
          });
          // 由于 addMessage 会创建新消息，我们需要删除旧的流式消息
          conversation.removeMessage(assistantMsg.id);
        }
      }
    },
    [
      conversation,
      conversation.currentConversation,
      getInsertPosition,
      settings,
      history,
      extractRowCount,
      calculateTableRange,
    ]
  );

  /**
   * 处理修改表格（增强版 - 自动选区）
   */
  const handleModify = useCallback(
    async (prompt: string) => {
      // 步骤1: 始终尝试重新检测表格（确保获取最新选区）
      // 注意：这里不显示"正在检测"的消息，因为如果已经选中了表格，这个消息会显得多余
      // 只有在检测失败时才显示提示

      let tableData = selectedTable;

      // 如果当前没有选中的表格，或者需要强制刷新，则重新检测
      if (!tableData) {
        tableData = await detectTable(true, true);
      } else {
        // 即使有选中的表格，也尝试刷新一下以确保数据最新（例如用户刚刚在 Excel 中修改了数据）
        // 但这里使用静默模式，不清除当前状态
        const freshData = await detectTable(true, true);
        if (freshData) {
          tableData = freshData;
        }
      }

      if (!tableData) {
        // 如果仍然没有表格，提示用户
        conversation.addMessage(
          'assistant',
          `⚠️ 未检测到表格。请确保：
1. 工作表中存在表格数据
2. 或者选中包含数据的单元格区域

您也可以先创建一个表格，然后再进行修改。`
        );
        return;
      }

      // 显示检测到的表格信息
      const assistantMsg = conversation.addMessage(
        'assistant',
        `📋 已检测到表格「${tableData.tableName || tableData.address}」(${tableData.totalRows}行×${tableData.totalColumns}列)，正在处理修改请求...`,
        { isStreaming: true }
      );

      const beforeState: StyledTableData = {
        tableName: tableData.tableName || 'Table',
        columns: tableData.columns.map(c => ({ key: c.name, title: c.name, type: c.type })),
        rows: [...tableData.rows],
      };

      // 获取对话历史用于上下文
      const conversationHistory = conversation.currentConversation?.messages || [];

      try {
        const result = await tableModificationService.requestModification({
          prompt,
          currentTable: tableData,
          sheetName: tableData.sheetName,
          conversationHistory,
        });

        if (result.success && result.operations) {
          // 使用 previewData（如果有）或 applyOperations 处理后的数据
          let modifiedData: StyledTableData;
          if (result.previewData) {
            // AI 直接返回了完整的修改后数据，使用转换方法确保包含样式
            modifiedData = tableModificationService.convertPreviewDataToStyledData(
              result.previewData,
              tableData.tableName
            );
          } else {
            // 使用操作指令逐步应用（已包含默认样式）
            modifiedData = tableModificationService.applyOperations(tableData, result.operations);
          }

          await excelAdapter.updateTableData(tableData.address, modifiedData, tableData.sheetName);

          if (assistantMsg) {
            conversation.updateStreamingMessage(
              assistantMsg.id,
              `✅ ${result.explanation || '表格已成功修改'}`,
              true
            );
          }

          history.pushHistory(
            'modify',
            result.explanation || '修改表格',
            beforeState,
            modifiedData,
            tableData.address,
            tableData.sheetName
          );

          // 刷新表格状态（强制刷新）
          await detectTable(true, true);
        } else {
          if (assistantMsg) {
            conversation.removeMessage(assistantMsg.id);
          }
          conversation.addMessage('assistant', `❌ ${result.error || '修改失败，请重试'}`, {
            isError: true,
            originalPrompt: prompt,
          });
        }
      } catch (err) {
        console.error('[UnifiedAssistantPanel] 修改表格失败:', err);
        if (assistantMsg) {
          conversation.removeMessage(assistantMsg.id);
        }
        conversation.addMessage(
          'assistant',
          `❌ 修改表格时出错: ${err instanceof Error ? err.message : '未知错误'}`,
          { isError: true, originalPrompt: prompt }
        );
      }
    },
    [detectTable, conversation, history, selectedTable]
  );

  /**
   * 处理创建图表
   */
  const handleChart = useCallback(
    async (prompt: string) => {
      // 添加处理中消息
      const assistantMsg = conversation.addMessage('assistant', '正在分析数据并生成图表...', {
        isStreaming: true,
      });

      try {
        // 1. 检测表格数据（强制刷新）
        let tableData = selectedTable;
        if (!tableData) {
          tableData = await detectTable(true, true);
        }

        if (!tableData) {
          if (assistantMsg) {
            conversation.removeMessage(assistantMsg.id);
          }
          conversation.addMessage(
            'assistant',
            `⚠️ 未检测到表格数据。请确保：
1. 工作表中存在表格数据
2. 或者选中包含数据的单元格区域

您需要先创建一个表格，然后再生成图表。`,
            { isError: true, originalPrompt: prompt }
          );
          return;
        }

        // 检查是否是修改图表的请求
        const isModifyChart =
          prompt.toLowerCase().includes('修改') ||
          prompt.toLowerCase().includes('改成') ||
          prompt.toLowerCase().includes('换成') ||
          prompt.toLowerCase().includes('更新') ||
          prompt.toLowerCase().includes('调整');

        let result;

        let existingChart = null;

        if (isModifyChart) {
          // 获取当前工作表中的图表信息
          const existingCharts = await excelAdapter.getChartList(tableData.sheetName);

          if (existingCharts.length > 0) {
            // 选择第一个图表作为修改目标，或者根据用户提示选择
            existingChart = existingCharts[0];
            conversation.addMessage(
              'assistant',
              `📊 检测到现有图表「${existingChart.name}」，正在根据您的要求修改...`
            );
          }

          // 使用修改图表服务
          result = await chartGenerationService.generateChart(
            { prompt, stylePreference: { theme: settings.style.defaultTheme } },
            tableData,
            3,
            true,
            existingChart
          );
        } else {
          // 创建新图表
          result = await chartGenerationService.generateChart(
            { prompt, stylePreference: { theme: settings.style.defaultTheme } },
            tableData
          );
        }

        if (result.success && result.chartConfig) {
          // 3. 使用实际的表格地址（而不是 AI 猜测的地址）
          // AI 可能返回错误的 dataRange，我们优先使用检测到的实际表格地址
          const actualDataRange = tableData.address;

          console.log('[UnifiedAssistantPanel] 图表配置:', {
            aiDataRange: result.chartConfig.dataSource.dataRange,
            actualDataRange: actualDataRange,
            tableInfo: {
              name: tableData.tableName,
              rows: tableData.totalRows,
              cols: tableData.totalColumns,
            },
            isModify: isModifyChart,
            chartType: result.chartConfig.type,
          });

          // 4. 创建或修改图表
          let chartName: string;

          if (isModifyChart && existingChart) {
            // 修改现有图表 - 先删除旧图表，再创建新图表
            await excelAdapter.deleteChart(existingChart.name, tableData.sheetName);
            chartName = await excelAdapter.createChartV2(actualDataRange, result.chartConfig.type, {
              title: result.chartConfig.title,
              showLegend: result.chartConfig.showLegend,
              legendPosition: result.chartConfig.legendPosition,
              showDataLabels: result.chartConfig.showDataLabels,
              sheetName: tableData.sheetName,
            });
          } else {
            // 创建新图表
            chartName = await excelAdapter.createChartV2(
              actualDataRange, // 使用实际表格地址
              result.chartConfig.type,
              {
                title: result.chartConfig.title,
                showLegend: result.chartConfig.showLegend,
                legendPosition: result.chartConfig.legendPosition,
                showDataLabels: result.chartConfig.showDataLabels,
                sheetName: tableData.sheetName,
              }
            );
          }

          if (assistantMsg) {
            const actionText = isModifyChart ? '修改' : '创建';
            const descriptionText = (result.chartConfig as any).description
              ? `\n💡 ${(result.chartConfig as any).description}`
              : '';
            conversation.updateStreamingMessage(
              assistantMsg.id,
              `✅ 图表「${result.chartConfig.title || chartName}」已${actionText}\n📊 类型: ${chartGenerationService.getChartTypeName(result.chartConfig.type)}\n📍 数据范围: ${tableData.sheetName}!${actualDataRange}${descriptionText}`,
              true
            );
          }
        } else {
          if (assistantMsg) {
            conversation.removeMessage(assistantMsg.id);
          }
          conversation.addMessage('assistant', `❌ ${result.error || '创建图表失败'}`, {
            isError: true,
            originalPrompt: prompt,
          });
        }
      } catch (err) {
        console.error('[UnifiedAssistantPanel] 创建图表失败:', err);
        if (assistantMsg) {
          conversation.removeMessage(assistantMsg.id);
        }
        conversation.addMessage(
          'assistant',
          `❌ 创建图表时出错: ${err instanceof Error ? err.message : '未知错误'}`,
          { isError: true, originalPrompt: prompt }
        );
      }
    },
    [selectedTable, detectTable, settings, conversation]
  );

  /**
   * 提交处理
   */
  const handleSubmit = useCallback(() => {
    processUserInput(input);
  }, [input, processUserInput]);

  /**
   * 重试操作
   */
  const handleRetry = useCallback(
    (originalPrompt?: string) => {
      if (originalPrompt) {
        processUserInput(originalPrompt);
      }
    },
    [processUserInput]
  );

  /**
   * 快捷示例点击
   */
  const handleQuickExample = useCallback((prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  }, []);

  /**
   * 撤销操作
   */
  const handleUndo = useCallback(async () => {
    const undoResult = history.undo();

    if (!undoResult || !undoResult.success) {
      conversation.addMessage('assistant', '⚠️ 没有可撤销的操作');
      return;
    }

    try {
      console.log('[UnifiedAssistantPanel] 执行撤销:', {
        operationType: undoResult.operationType,
        hasRestoreData: !!undoResult.restoreData,
        address: undoResult.address,
        description: undoResult.description,
      });

      if (undoResult.restoreData === null) {
        // 撤销创建操作 = 清空表格区域
        // 因为创建操作的 beforeState 为 null（创建之前没有数据）
        try {
          await excelAdapter.clearRange(undoResult.address, undoResult.sheetName);
          conversation.addMessage(
            'assistant',
            `↩️ 已撤销「${undoResult.description}」（已清空表格区域）`
          );
        } catch (clearErr) {
          console.error('[UnifiedAssistantPanel] 清空区域失败:', clearErr);
          conversation.addMessage('assistant', '⚠️ 撤销创建操作需要手动删除表格');
        }
      } else {
        // 撤销修改操作 = 恢复之前的数据
        await excelAdapter.updateTableData(
          undoResult.address,
          undoResult.restoreData,
          undoResult.sheetName
        );
        conversation.addMessage('assistant', `↩️ 已撤销「${undoResult.description}」`);
      }

      // 刷新表格状态（强制刷新）
      await detectTable(true, true);
    } catch (err) {
      console.error('[UnifiedAssistantPanel] 撤销失败:', err);
      conversation.addMessage(
        'assistant',
        `❌ 撤销失败: ${err instanceof Error ? err.message : '未知错误'}。请尝试使用 Excel 的撤销功能 (Ctrl+Z)`
      );
    }
  }, [history, detectTable, conversation]);

  /**
   * 重做操作
   */
  const handleRedo = useCallback(async () => {
    const redoResult = history.redo();

    if (!redoResult || !redoResult.success) {
      conversation.addMessage('assistant', '⚠️ 没有可重做的操作');
      return;
    }

    try {
      console.log('[UnifiedAssistantPanel] 执行重做:', {
        operationType: redoResult.operationType,
        address: redoResult.address,
        description: redoResult.description,
      });

      // 重做操作 = 应用 afterState 的数据
      await excelAdapter.updateTableData(
        redoResult.address,
        redoResult.applyData,
        redoResult.sheetName
      );
      conversation.addMessage('assistant', `↪️ 已重做「${redoResult.description}」`);

      // 刷新表格状态（强制刷新）
      await detectTable(true, true);
    } catch (err) {
      console.error('[UnifiedAssistantPanel] 重做失败:', err);
      conversation.addMessage(
        'assistant',
        `❌ 重做失败: ${err instanceof Error ? err.message : '未知错误'}`
      );
    }
  }, [history, detectTable, conversation]);

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

  const messages = conversation.currentConversation?.messages || [];
  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          /* 欢迎界面 */
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">您好！我是 Excel AI 助手</h2>
              <p className="text-gray-500 mb-6">
                告诉我您想创建什么表格，或者选中数据后让我帮您修改或生成图表
              </p>

              {/* 快捷操作 */}
              <div className="grid grid-cols-2 gap-2">
                {QUICK_EXAMPLES.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickExample(example.prompt)}
                    className="flex items-center gap-2 p-3 text-left text-sm bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-lg">{example.icon}</span>
                    <span className="text-gray-700">{example.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 消息列表 */
          <div className="p-4 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-blue-400 animate-pulse rounded" />
                  )}
                  {msg.isError && (
                    <div className="mt-2">
                      <button
                        onClick={() => handleRetry(msg.originalPrompt)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                      >
                        🔄 重试
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 上传的文件提示 */}
      {uploadedFile?.status === 'success' && uploadedFile.parsedData && (
        <div className="mx-4 mb-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg text-sm flex items-center justify-between">
          <span className="text-green-700">
            📄 已上传: <strong>{uploadedFile.name}</strong>
            <span className="text-green-500 ml-1">
              ({uploadedFile.parsedData.totalRows} 行 × {uploadedFile.parsedData.columns.length} 列)
            </span>
          </span>
          <button
            onClick={handleFileRemoved}
            className="text-green-500 hover:text-green-700 text-xs"
          >
            移除
          </button>
        </div>
      )}

      {/* 选中表格提示 */}
      {selectedTable && (
        <div className="mx-4 mb-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm flex items-center justify-between">
          <span className="text-blue-700">
            📋 已选择: <strong>{selectedTable.tableName || selectedTable.address}</strong>
            <span className="text-blue-500 ml-1">
              ({selectedTable.totalRows}×{selectedTable.totalColumns})
            </span>
          </span>
          <button onClick={handleDetectTable} className="text-blue-500 hover:text-blue-700 text-xs">
            刷新
          </button>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            ✕
          </button>
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-4 bg-white border-t border-gray-100">
        {/* 选项展开区 */}
        {showOptions && (
          <div className="mb-3 p-3 bg-gray-50 rounded-xl space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-500">插入位置:</span>
              <div className="flex gap-1">
                {(['auto', 'manual', 'newSheet'] as InsertPositionMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPositionMode(mode)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      positionMode === mode
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {mode === 'auto' ? '🎯 智能' : mode === 'manual' ? '📌 指定' : '📄 新表'}
                  </button>
                ))}
              </div>
              {positionMode === 'manual' && (
                <input
                  type="text"
                  value={manualPosition}
                  onChange={e => setManualPosition(e.target.value.toUpperCase())}
                  placeholder="如 A1"
                  className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>
        )}

        {/* 主输入区域 - 统一的圆角容器 */}
        <div className="flex items-stretch gap-3">
          {/* 文件上传按钮 */}
          <FileUpload
            onFileUploaded={handleFileUploaded}
            onFileRemoved={handleFileRemoved}
            currentFile={uploadedFile}
            disabled={isProcessing}
            compact={true}
          />

          {/* 输入框容器 */}
          <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              placeholder={
                uploadedFile?.status === 'success'
                  ? '描述如何处理上传的文件数据...'
                  : '描述您想创建的表格，或者询问任何问题...'
              }
              rows={1}
              className="flex-1 px-4 py-3 bg-transparent resize-none focus:outline-none text-sm text-gray-800 placeholder-gray-400"
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={isProcessing}
            />

            {/* 输入框内右侧按钮组 */}
            <div className="flex items-center gap-1 pr-2">
              {/* 选项按钮 */}
              <button
                onClick={() => setShowOptions(!showOptions)}
                className={`p-2 rounded-lg transition-colors ${
                  showOptions ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-400'
                }`}
                title="更多选项"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* 发送按钮 */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !input.trim()}
            className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isProcessing ? (
              <Loading size="small" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <button
              onClick={handleUndo}
              disabled={!history.canUndo}
              className="flex items-center gap-1 hover:text-gray-600 disabled:opacity-30 transition-colors"
              title="撤销上一步操作"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              撤销
            </button>
            <button
              onClick={handleRedo}
              disabled={!history.canRedo}
              className="flex items-center gap-1 hover:text-gray-600 disabled:opacity-30 transition-colors"
              title="重做上一步操作"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                />
              </svg>
              重做
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => {
                conversation.startNewConversation();
                setInput('');
              }}
              className="flex items-center gap-1 hover:text-gray-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              新对话
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleDetectTable}
              className="flex items-center gap-1 hover:text-gray-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              检测选区
            </button>
          </div>
          <span className="text-gray-300">Enter 发送 · Shift+Enter 换行</span>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAssistantPanel;
