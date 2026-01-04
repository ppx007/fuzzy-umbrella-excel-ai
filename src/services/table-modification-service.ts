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
  GenericTableData,
  ConversationMessage,
  StyledTableData,
} from '@/types/common';

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

  return `你是一个 Excel 表格助手。用户想要修改一个现有的表格。

${tableDescription}

${historyContext}

用户请求：${userPrompt}

请分析用户的请求，生成修改操作列表。返回 JSON 格式：

\`\`\`json
{
  "success": true,
  "operations": [
    {
      "action": "操作类型",
      "target": "操作目标（列名/行号/单元格地址）",
      "params": { "具体参数" },
      "description": "操作描述"
    }
  ],
  "previewData": {
    "tableName": "表格名称",
    "columns": [...],
    "rows": [...]
  },
  "explanation": "对用户的解释说明"
}
\`\`\`

支持的操作类型（action）：
- addColumn: 添加列 (params: { name, type, defaultValue?, position? })
- removeColumn: 删除列 (params: {})
- renameColumn: 重命名列 (params: { newName })
- addRow: 添加行 (params: { data, position? })
- removeRow: 删除行 (params: { condition? })
- updateCell: 更新单元格 (target: 单元格地址, params: { value })
- updateRange: 更新范围 (target: 范围地址, params: { values[][] })
- applyFormula: 应用公式 (target: 目标列, params: { formula })
- applyStyle: 应用样式 (target: 目标, params: { style配置 })
- sort: 排序 (target: 排序列, params: { order: 'asc'|'desc' })
- filter: 筛选 (target: 筛选列, params: { condition })

注意事项：
1. 操作应该是可执行的、具体的
2. previewData 应该反映修改后的预期结果
3. 保持原有数据的完整性
4. 给出清晰的解释说明

只返回 JSON，不要有其他内容。`;
}

/**
 * 解析 AI 响应
 */
function parseModificationResponse(response: string): TableModificationResponse {
  try {
    // 提取 JSON
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;

    const parsed = JSON.parse(jsonStr.trim());

    return {
      success: parsed.success ?? true,
      operations: parsed.operations || [],
      previewData: parsed.previewData,
      explanation: parsed.explanation,
    };
  } catch (error) {
    console.error('[TableModificationService] 解析响应失败:', error);
    return {
      success: false,
      error: '无法解析 AI 响应',
    };
  }
}

/**
 * 表格修改服务类
 */
export class TableModificationService {
  private appConfig = config;

  /**
   * 请求表格修改
   */
  async requestModification(request: TableModificationRequest): Promise<TableModificationResponse> {
    const { prompt, currentTable, conversationHistory, sheetName } = request;

    const systemPrompt = buildModificationPrompt(prompt, currentTable, conversationHistory);

    try {
      const response = await fetch(this.appConfig.openai.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.appConfig.openai.apiKey}`,
        },
        body: JSON.stringify({
          model: this.appConfig.openai.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      return parseModificationResponse(content);
    } catch (error) {
      console.error('[TableModificationService] 请求失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 应用修改操作到表格数据
   */
  applyOperations(tableData: ReadTableData, operations: ModificationOperation[]): StyledTableData {
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
        case 'sort':
          this.applySort(rows, op);
          break;
        // 其他操作...
      }
    }

    return {
      tableName: tableData.tableName || 'ModifiedTable',
      columns: columns.map(c => ({
        name: c.name,
        type: c.type,
      })),
      rows,
    };
  }

  private applyAddColumn(
    columns: ReadTableData['columns'],
    rows: Record<string, unknown>[],
    op: ModificationOperation
  ): void {
    const { name, type, defaultValue, position } = op.params as {
      name: string;
      type: string;
      defaultValue?: unknown;
      position?: number;
    };

    const newCol = {
      name,
      type: (type as any) || 'text',
      index: position ?? columns.length,
    };

    if (position !== undefined && position < columns.length) {
      columns.splice(position, 0, newCol);
    } else {
      columns.push(newCol);
    }

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
    const colIndex = columns.findIndex(c => c.name === colName);
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

    const col = columns.find(c => c.name === oldName);
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
