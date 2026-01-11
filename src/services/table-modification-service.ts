/**
 * 表格修改服务
 * 使用 AI 解析自然语言指令，生成表格修改操作
 */

import { config } from '@/config';
import type {
  ReadTableData,
  TableModificationRequest,
  TableModificationResponse,
  ModificationOperation,
  ConversationMessage,
  StyledTableData,
  TableStyleConfig,
  ExtendedColumnType,
} from '@/types/common';

/**
 * 清理模型名称，移除可能的前缀
 * 例如: "假流式/gemini-2.5-flash" -> "gemini-2.5-flash"
 */
function cleanModelName(model: string): string {
  if (!model) return model;
  // 移除任何非字母数字开头的前缀（如 "假流式/"）
  const cleaned = model.replace(/^[^a-zA-Z0-9]+\//, '');
  if (cleaned !== model) {
    console.log('[TableModificationService] 模型名称已清理:', model, '->', cleaned);
  }
  return cleaned;
}

/**
 * 默认表格样式配置
 * 当原表格没有样式信息时使用
 */
const DEFAULT_TABLE_STYLE: TableStyleConfig = {
  colorTheme: 'professional',
  excelTableStyle: 'TableStyleMedium2',
  header: {
    backgroundColor: '#4472C4',
    fontColor: '#FFFFFF',
    bold: true,
    fontSize: 11,
    align: 'center',
  },
  body: {
    alternateRowColor: true,
    alternateColor: '#D6DCE4',
  },
  border: {
    style: 'thin',
    color: '#8EA9DB',
    showOuter: true,
    showInner: true,
  },
};

/**
 * 构建表格修改 Prompt
 */
function buildModificationPrompt(
  userPrompt: string,
  currentTable: ReadTableData,
  conversationHistory?: ConversationMessage[]
): string {
  // 将表格数据转换为描述
  const tableDescription = `
当前表格信息：
- 表格名称：${currentTable.tableName || '未命名'}
- 工作表：${currentTable.sheetName}
- 地址：${currentTable.address}
- 列定义：${JSON.stringify(currentTable.columns.map(c => ({ name: c.name, type: c.type })))}
- 数据行数：${currentTable.totalRows}
- 示例数据（前3行）：
${JSON.stringify(currentTable.rows.slice(0, 3), null, 2)}
`;

  // 构建对话历史
  let historyContext = '';
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-6);
    historyContext = `
对话历史：
${recentHistory.map(m => `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`).join('\n')}
`;
  }

  return `你是Excel表格修改助手。你的唯一任务是根据用户请求生成表格修改操作的JSON。

【重要规则】
1. 你只能输出JSON，禁止输出任何解释、说明、注释
2. 禁止使用markdown代码块（禁止\`\`\`json）
3. JSON必须以{开始，以}结束
4. 禁止在JSON前后添加任何文字

${tableDescription}

${historyContext}

用户请求：${userPrompt}

【JSON格式】
{
"success": true,
"operations": [
  {
    "action": "操作类型",
    "target": "操作目标",
    "params": {},
    "description": "操作描述"
  }
],
"previewData": {
  "tableName": "表格名称",
  "columns": [{"name":"列名","type":"类型"}],
  "rows": [{"列名":值}]
},
"explanation": "简短说明"
}

【操作类型】
addColumn, removeColumn, renameColumn, addRow, removeRow, updateCell, updateRange, applyFormula, sort, filter

【addColumn操作参数】
- name: 新列名
- type: 新列类型
- defaultValue: 默认值（可选）
- referenceColumn: 参考列名（用于相对位置）
- position: 插入位置 ("before" 或 "after")

【applyFormula操作参数】
- formula: Excel公式（如 "=SUM(A2:B2)"）
- target: 应用公式的目标单元格或范围

【previewData规则】
previewData必须包含完整的修改后数据（所有行、所有列），这是关键！

【重要：数据清洗】
确保生成的 JSON 中不包含任何非法控制字符（如 \x00-\x1F），只使用标准的 UTF-8 字符。

你的响应必须是纯JSON，不能包含任何其他内容。`;
}

/**
 * 使用平衡括号算法提取 JSON
 */
function extractBalancedJson(text: string): string | null {
  const startIndex = text.indexOf('{');
  if (startIndex === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\' && inString) {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return text.substring(startIndex, i + 1);
        }
      }
    }
  }

  return null;
}

/**
 * 尝试修复和解析 JSON
 */
function tryParseJson(jsonString: string): unknown {
  // 首先尝试直接解析
  try {
    return JSON.parse(jsonString);
  } catch {
    // 继续尝试修复
  }

  console.warn('[TableModificationService] JSON 解析失败，尝试修复...');

  // 修复1: 移除尾部逗号
  let fixed = jsonString.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(fixed);
  } catch {
    // 继续尝试
  }

  // 修复2: 移除控制字符
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, ' ');

  try {
    return JSON.parse(fixed);
  } catch {
    // 继续尝试
  }

  // 修复3: 修复单引号
  fixed = fixed.replace(/'/g, '"');

  try {
    return JSON.parse(fixed);
  } catch {
    return null;
  }
}

/**
 * 解析 AI 响应
 */
function parseModificationResponse(response: string): TableModificationResponse {
  console.log('[TableModificationService] 开始解析响应，长度:', response.length);
  console.log('[TableModificationService] 原始响应前200字符:', response.substring(0, 200));

  try {
    let jsonStr = response.trim();

    // 方法1: 尝试匹配 markdown 代码块
    const markdownMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      const content = markdownMatch[1].trim();
      if (content.startsWith('{') && content.endsWith('}')) {
        jsonStr = content;
        console.log('[TableModificationService] 从 markdown 代码块提取 JSON');
      }
    }

    // 方法2: 使用平衡括号匹配提取 JSON
    if (!jsonStr.startsWith('{')) {
      const balancedJson = extractBalancedJson(response);
      if (balancedJson) {
        jsonStr = balancedJson;
        console.log('[TableModificationService] 使用平衡括号匹配提取 JSON');
      }
    }

    // 方法3: 简单正则匹配（后备方案）
    if (!jsonStr.startsWith('{')) {
      const simpleMatch = response.match(/\{[\s\S]*\}/);
      if (simpleMatch) {
        jsonStr = simpleMatch[0];
        console.log('[TableModificationService] 使用简单正则提取 JSON');
      }
    }

    // 检查是否有有效的 JSON
    if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
      console.error('[TableModificationService] 响应不是有效的 JSON 格式');
      console.log('[TableModificationService] 响应内容:', response.substring(0, 500));
      return {
        success: false,
        error: 'AI 返回了非 JSON 格式的响应，请重试',
      };
    }

    // 移除可能导致 JSON 解析失败或 Excel 写入失败的控制字符
    // 保留 \n (0x0A) 和 \r (0x0D) 和 \t (0x09)，移除其他 0x00-0x1F
    jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    // 使用增强的 JSON 解析
    const parsed = tryParseJson(jsonStr);

    if (!parsed) {
      console.error('[TableModificationService] JSON 解析失败');
      return {
        success: false,
        error: 'AI 返回了无效的 JSON 数据，无法解析',
      };
    }

    const result = parsed as {
      success?: boolean;
      operations?: ModificationOperation[];
      previewData?: unknown;
      explanation?: string;
    };

    // 验证必要字段
    if (!result.operations && !result.previewData) {
      console.error('[TableModificationService] 响应缺少必要字段');
      return {
        success: false,
        error: 'AI 响应格式不正确，缺少操作数据',
      };
    }

    console.log('[TableModificationService] 解析成功，操作数:', result.operations?.length || 0);

    // 清理 previewData 中的非法数据
    let cleanedPreviewData = result.previewData as TableModificationResponse['previewData'];
    if (cleanedPreviewData) {
      cleanedPreviewData = sanitizePreviewData(cleanedPreviewData);
    }

    return {
      success: result.success ?? true,
      operations: result.operations || [],
      previewData: cleanedPreviewData,
      explanation: result.explanation,
    };
  } catch (error) {
    console.error('[TableModificationService] JSON 解析失败:', error);
    console.log('[TableModificationService] 原始响应:', response.substring(0, 500));
    return {
      success: false,
      error: 'AI 响应解析失败，请重试',
    };
  }
}

/**
 * 清理 previewData 中可能导致 Excel 错误的数据
 */
function sanitizePreviewData(
  data: TableModificationResponse['previewData']
): TableModificationResponse['previewData'] {
  if (!data) return data;

  // 清理表格名称
  let tableName = data.tableName || 'Table';
  tableName = tableName
    .replace(/[^\w\u4e00-\u9fa5]/g, '_')
    .replace(/^(\d)/, '_$1')
    .substring(0, 255);

  // 清理列名
  const columns = (data.columns || []).map((col, index) => {
    let title = col.title || (col as any).name;
    if (!title || typeof title !== 'string') {
      title = `Column${index + 1}`;
    }
    title = title.replace(/[\x00-\x1F\x7F]/g, '').trim();
    if (!title) {
      title = `Column${index + 1}`;
    }
    return { ...col, title };
  });

  // 确保列名唯一
  const usedNames = new Set<string>();
  const uniqueColumns = columns.map(col => {
    let uniqueName = col.title;
    let counter = 1;
    while (usedNames.has(uniqueName)) {
      uniqueName = `${col.title}_${counter}`;
      counter++;
    }
    usedNames.add(uniqueName);
    return { ...col, title: uniqueName };
  });

  // 清理数据行
  const rows = (data.rows || []).map(row => {
    const cleanedRow: Record<string, unknown> = {};
    for (const col of uniqueColumns) {
      let value = row[col.title] || row[col.key];

      // 处理 undefined 和 null
      if (value === undefined || value === null) {
        value = '';
      }

      // 处理对象类型
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }

      // 处理字符串，移除控制字符
      if (typeof value === 'string') {
        value = value.replace(/[\x00-\x1F\x7F]/g, '');
      }

      cleanedRow[col.title] = value;
    }
    return cleanedRow;
  });

  return {
    ...data,
    tableName,
    columns: uniqueColumns,
    rows,
  };
}

/**
 * 服务配置接口
 */
interface ServiceConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

/**
 * 表格修改服务类
 */
export class TableModificationService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = config.openai.apiKey;
    this.baseUrl = config.openai.baseUrl;
    this.model = cleanModelName(config.openai.model);
  }

  /**
   * 更新配置
   */
  updateConfig(cfg: ServiceConfig): void {
    if (cfg.apiKey) this.apiKey = cfg.apiKey;
    if (cfg.baseUrl) this.baseUrl = cfg.baseUrl;
    if (cfg.model) this.model = cleanModelName(cfg.model);
  }

  /**
   * 请求表格修改（使用流式模式和自动重试机制）
   */
  async requestModification(
    request: TableModificationRequest,
    maxRetries: number = 3
  ): Promise<TableModificationResponse> {
    const { prompt, currentTable, conversationHistory } = request;

    const systemPrompt = buildModificationPrompt(prompt, currentTable, conversationHistory);

    const requestUrl = `${this.baseUrl}/chat/completions`;
    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 8192,
      stream: true, // 启用流式模式避免 Cloudflare 超时
    };

    console.log('[TableModificationService] 发送请求到:', requestUrl);
    console.log('[TableModificationService] 使用模型:', this.model);
    console.log('[TableModificationService] 流式模式: 已启用');
    console.log('[TableModificationService] 最大重试次数:', maxRetries);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 180秒超时

      try {
        console.log(`[TableModificationService] 尝试第 ${attempt}/${maxRetries} 次请求...`);

        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          let errorMessage = response.statusText;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch {
            if (errorText) {
              errorMessage = errorText.substring(0, 200);
            }
          }

          // 524 错误可以重试
          if (response.status === 524) {
            lastError = new Error(`API请求超时 (524)，第 ${attempt} 次尝试失败`);
            console.warn(`[TableModificationService] ${lastError.message}，将重试...`);
            if (attempt < maxRetries) {
              const delay = attempt * 2000;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            return {
              success: false,
              error: 'API多次请求超时 (524)，服务器响应太慢，请稍后重试',
            };
          }

          // 401 不重试
          if (response.status === 401) {
            return {
              success: false,
              error: 'API密钥无效或已过期，请在设置中检查API密钥',
            };
          }

          // 429 可以重试
          if (response.status === 429) {
            lastError = new Error('请求过于频繁');
            if (attempt < maxRetries) {
              const delay = attempt * 3000;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            return {
              success: false,
              error: '请求过于频繁，请稍后重试',
            };
          }

          // 502, 503, 504 可以重试
          if ([502, 503, 504].includes(response.status)) {
            lastError = new Error(`服务器暂时不可用 (${response.status})`);
            if (attempt < maxRetries) {
              const delay = attempt * 2000;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            return {
              success: false,
              error: `服务器暂时不可用 (${response.status})，请稍后重试`,
            };
          }

          return {
            success: false,
            error: `API请求失败: ${response.status} - ${errorMessage}`,
          };
        }

        // 处理流式响应
        const content = await this.processStreamResponse(response);

        if (!content) {
          return {
            success: false,
            error: 'AI 返回了空响应',
          };
        }

        console.log(`[TableModificationService] 第 ${attempt} 次请求成功！`);
        console.log('[TableModificationService] 响应长度:', content.length, '字符');

        return parseModificationResponse(content);
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = new Error(`请求超时（180秒），第 ${attempt} 次尝试失败`);
            console.warn(`[TableModificationService] ${lastError.message}`);
            if (attempt < maxRetries) {
              continue;
            }
            return {
              success: false,
              error: '请求多次超时（180秒），请检查网络连接或稍后重试',
            };
          }

          lastError = error;
        }

        console.error('[TableModificationService] 请求失败:', error);

        if (attempt < maxRetries) {
          console.warn(`[TableModificationService] 将进行第 ${attempt + 1} 次重试...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || '请求失败，请稍后重试',
    };
  }

  /**
   * 处理流式响应，将 SSE 数据聚合为完整内容
   */
  private async processStreamResponse(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    try {
      console.log('[TableModificationService] 开始接收流式响应...');
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // 解码数据块
        buffer += decoder.decode(value, { stream: true });

        // 按行分割处理
        const lines = buffer.split('\n');
        // 保留最后一个可能不完整的行
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6); // 移除 'data: ' 前缀

          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              fullContent += content;
              chunkCount++;
            }
          } catch {
            // 忽略 JSON 解析错误（可能是不完整的数据）
          }
        }
      }

      console.log(`[TableModificationService] 流式响应完成，共 ${chunkCount} 个数据块`);
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  /**
   * 应用修改操作到表格数据
   * @param tableData 原始表格数据
   * @param operations 修改操作列表
   * @param preserveStyle 是否保留样式（默认 true）
   */
  applyOperations(
    tableData: ReadTableData,
    operations: ModificationOperation[],
    preserveStyle: boolean = true
  ): StyledTableData {
    // 深拷贝数据
    let columns = [...tableData.columns.map(c => ({ ...c }))];
    let rows = tableData.rows.map(r => ({ ...r }));

    for (const op of operations) {
      switch (op.action) {
        case 'addColumn':
          this.applyAddColumn(columns, rows, op);
          break;
        case 'removeColumn':
          this.applyRemoveColumn(columns, rows, op);
          break;
        case 'renameColumn':
          this.applyRenameColumn(columns, rows, op);
          break;
        case 'addRow':
          this.applyAddRow(rows, op);
          break;
        case 'removeRow':
          this.applyRemoveRow(rows, op);
          break;
        case 'updateCell':
          this.applyUpdateCell(rows, columns, op);
          break;
        case 'applyFormula':
          // applyFormula 操作由 Excel 适配器处理，这里只需确保列存在
          this.ensureColumnExistsForFormula(columns, rows, op);
          break;
        case 'sort':
          this.applySort(rows, op);
          break;
        // 其他操作...
      }
    }

    // 构建结果，包含样式信息
    const result: StyledTableData = {
      tableName: tableData.tableName || 'ModifiedTable',
      columns: columns.map(c => ({
        key: c.name,
        title: c.name,
        type: c.type,
      })),
      rows,
    };

    // 保留样式
    if (preserveStyle) {
      result.style = DEFAULT_TABLE_STYLE;
    }

    return result;
  }

  /**
   * 将 previewData 转换为带样式的 StyledTableData
   * @param previewData AI 返回的预览数据
   * @param originalTableName 原始表格名称（可选）
   */
  convertPreviewDataToStyledData(
    previewData: NonNullable<TableModificationResponse['previewData']>,
    originalTableName?: string
  ): StyledTableData {
    return {
      tableName: previewData.tableName || originalTableName || 'ModifiedTable',
      columns: previewData.columns,
      rows: previewData.rows,
      style: DEFAULT_TABLE_STYLE,
    };
  }

  private applyAddColumn(
    columns: ReadTableData['columns'],
    rows: Record<string, unknown>[],
    op: ModificationOperation
  ): void {
    const { name, type, defaultValue, referenceColumn, position } = op.params as {
      name: string;
      type: string;
      defaultValue?: unknown;
      referenceColumn?: string;
      position?: 'before' | 'after' | number;
    };

    // 处理相对位置插入
    let insertIndex = columns.length;
    if (referenceColumn) {
      const refIndex = columns.findIndex(c => (c as any).title === referenceColumn || c.name === referenceColumn);
      if (refIndex !== -1) {
        insertIndex = position === 'before' ? refIndex : refIndex + 1;
      }
    } else if (typeof position === 'number') {
      // 兼容旧的数字索引方式
      insertIndex = position;
    }

    const newCol = {
      name: name,
      type: (type as any) || 'text',
      index: insertIndex,
    } as any;

    columns.splice(insertIndex, 0, newCol);

    // 为每行添加新列
    rows.forEach(row => {
      row[name] = defaultValue ?? '';
    });
  }

  private applyRemoveColumn(
    columns: ReadTableData['columns'],
    rows: Record<string, unknown>[],
    op: ModificationOperation
  ): void {
    const colName = op.target;
    const colIndex = columns.findIndex(c => (c as any).title === colName || c.name === colName);
    if (colIndex !== -1) {
      columns.splice(colIndex, 1);
      rows.forEach(row => {
        delete row[colName];
      });
    }
  }

  private applyRenameColumn(
    columns: ReadTableData['columns'],
    rows: Record<string, unknown>[],
    op: ModificationOperation
  ): void {
    const oldName = op.target;
    const { newName } = op.params as { newName: string };

    const col = columns.find(c => (c as any).title === oldName || c.name === oldName);
    if (col) {
      col.name = newName;
      rows.forEach(row => {
        row[newName] = row[oldName];
        delete row[oldName];
      });
    }
  }

  private applyAddRow(rows: Record<string, unknown>[], op: ModificationOperation): void {
    const { data, position } = op.params as {
      data: Record<string, unknown>;
      position?: number;
    };

    if (position !== undefined && position < rows.length) {
      rows.splice(position, 0, data);
    } else {
      rows.push(data);
    }
  }

  private applyRemoveRow(rows: Record<string, unknown>[], op: ModificationOperation): void {
    const { condition } = op.params as {
      condition?: { column: string; operator: string; value: unknown };
    };

    if (condition) {
      // 根据条件删除
      const { column, operator, value } = condition;
      for (let i = rows.length - 1; i >= 0; i--) {
        const rowValue = rows[i][column];
        let shouldRemove = false;

        switch (operator) {
          case '=':
          case '==':
            shouldRemove = rowValue === value;
            break;
          case '!=':
            shouldRemove = rowValue !== value;
            break;
          case '>':
            shouldRemove = (rowValue as number) > (value as number);
            break;
          case '<':
            shouldRemove = (rowValue as number) < (value as number);
            break;
          case 'contains':
            shouldRemove = String(rowValue).includes(String(value));
            break;
        }

        if (shouldRemove) {
          rows.splice(i, 1);
        }
      }
    } else {
      // 根据目标删除（假设目标是行索引）
      const rowIndex = parseInt(op.target, 10);
      if (!isNaN(rowIndex) && rowIndex >= 0 && rowIndex < rows.length) {
        rows.splice(rowIndex, 1);
      }
    }
  }

  private applyUpdateCell(
    rows: Record<string, unknown>[],
    columns: ReadTableData['columns'],
    op: ModificationOperation
  ): void {
    const { value } = op.params as { value: unknown };

    // 目标格式：A2 或 列名:行号
    const target = op.target;

    // 尝试解析列名:行号格式
    if (target.includes(':')) {
      const [colName, rowStr] = target.split(':');
      const rowIndex = parseInt(rowStr, 10) - 1; // 转为0索引
      if (rowIndex >= 0 && rowIndex < rows.length) {
        rows[rowIndex][colName] = value;
      }
    } else {
      // 尝试解析 Excel 地址格式（如 A2）
      const match = target.match(/^([A-Z]+)(\d+)$/i);
      if (match) {
        const colLetter = match[1].toUpperCase();
        const rowNum = parseInt(match[2], 10) - 2; // 减2因为第1行是表头

        // 将列字母转换为索引
        let colIndex = 0;
        for (let i = 0; i < colLetter.length; i++) {
          colIndex = colIndex * 26 + (colLetter.charCodeAt(i) - 64);
        }
        colIndex -= 1; // 转为0索引

        if (rowNum >= 0 && rowNum < rows.length && colIndex < columns.length) {
          const colName = columns[colIndex].name;
          rows[rowNum][colName] = value;
        }
      }
    }
  }

  /**
   * 确保公式列存在（为applyFormula操作准备）
   */
  private ensureColumnExistsForFormula(
    columns: ReadTableData['columns'],
    rows: Record<string, unknown>[],
    op: ModificationOperation
  ): void {
    const { target } = op.params as { target: string };
    // target格式: "列名" 或 "列名:行号" 或 "A1"
    let colName = target;

    // 如果是 "列名:行号" 格式，提取列名
    if (target.includes(':')) {
      colName = target.split(':')[0];
    } else if (/^[A-Z]+\d+$/i.test(target)) {
      // 如果是 Excel 地址格式 (如 A1)，需要转换为列名
      // 这里简化处理，实际应用中可能需要更复杂的转换
      const match = target.match(/^([A-Z]+)/i);
      if (match) {
        // 这里我们假设列名就是目标列名，实际应用中需要根据列索引查找列名
        // 为简化，我们直接使用目标地址作为列名占位符
        colName = target;
      }
    }

    // 检查列是否已存在
    if (!columns.some(c => (c as any).title === colName || c.name === colName)) {
      // 添加新列
      const newCol = {
        name: colName,
        type: 'formula' as ExtendedColumnType,
        index: columns.length,
      } as any;
      columns.push(newCol);

      // 为每行添加空值占位
      rows.forEach(row => {
        row[colName] = '';
      });
    }
  }

  private applySort(rows: Record<string, unknown>[], op: ModificationOperation): void {
    const colName = op.target;
    const { order } = op.params as { order: 'asc' | 'desc' };

    rows.sort((a, b) => {
      const aVal = a[colName];
      const bVal = b[colName];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison: number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }
}

/**
 * 默认实例
 */
export const tableModificationService = new TableModificationService();

/**
 * 便捷函数
 */
export async function modifyTable(
  request: TableModificationRequest
): Promise<TableModificationResponse> {
  return tableModificationService.requestModification(request);
}
