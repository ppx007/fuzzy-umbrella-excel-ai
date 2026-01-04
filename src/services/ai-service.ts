/**
 * AI服务模块
 * 使用OpenAI兼容API根据自然语言生成表格数据
 */

export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

// TableColumn is now imported from @/types

export interface GeneratedTable {
  title: string;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  summary?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  success: boolean;
  data?: GeneratedTable;
  error?: string;
  rawResponse?: string;
}

import { config as appConfig } from '@/config';
import { TableColumn, Employee, AttendanceRecord, AttendanceStatus } from '@/types';

const DEFAULT_CONFIG: AIConfig = {
  apiKey: appConfig.openai.apiKey,
  baseUrl: appConfig.openai.baseUrl,
  model: appConfig.openai.model,
};

const SYSTEM_PROMPT = `你是一个严格的JSON生成引擎。你的唯一任务是根据用户输入生成一个表格的JSON表示。

**规则:**
1.  **必须**返回一个完整的、语法正确的JSON对象。
2.  **绝对不能**在JSON之外包含任何解释、注释、介绍或Markdown代码块（如 \`\`\`json）。
3.  返回的JSON对象**必须**严格遵循以下结构：
    {
      "title": "string",
      "columns": [{"key": "string", "title": "string", "type": "string|number|date|time|status"}],
      "rows": [{}],
      "summary": "string"
    }
4.  根据用户需求智能推断列和行。对于考勤表，常见列包括：employeeName, date, checkInTime, checkOutTime, workHours, status, notes。
5.  生成的数据要合理且符合实际情况。

**你的输出必须从 { 开始，到 } 结束，中间是完整的JSON内容。**`;

/**
 * AI服务类
 */
export class AIService {
  private config: AIConfig;

  constructor(config: Partial<AIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 检查API是否可用
   */
  isAvailable(): boolean {
    return Boolean(this.config.apiKey && this.config.baseUrl);
  }

  /**
   * 发送聊天请求
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('AI服务未配置，请检查API密钥和端点');
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * 根据自然语言生成表格
   */
  async generateTable(userInput: string): Promise<AIResponse> {
    let rawResponse = '';
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ];

      rawResponse = await this.chat(messages);

      // 增强的JSON提取逻辑：贪婪匹配从第一个 { 到最后一个 } 的所有内容
      const jsonMatch = rawResponse.match(/(\{[\s\S]*\})/);
      if (!jsonMatch || jsonMatch.length === 0) {
        throw new Error('无法从响应中提取有效的JSON对象');
      }

      const jsonString = jsonMatch[0];
      let tableData: GeneratedTable;
      // 检查JSON是否看起来完整
      if (!jsonString.trim().startsWith('{') || !jsonString.trim().endsWith('}')) {
        throw new Error('AI返回的数据不是一个完整的JSON对象');
      }
      try {
        tableData = JSON.parse(jsonString) as GeneratedTable;
      } catch (e) {
        console.warn('[AI] JSON解析失败，尝试修复...');
        try {
          // 尝试修复常见的尾随逗号问题
          const repairedJson = jsonString.replace(/,\s*([}\]])/g, '$1');
          tableData = JSON.parse(repairedJson) as GeneratedTable;
          console.log('[AI] JSON修复成功!');
        } catch (repairError) {
          console.error('[AI] JSON修复失败:', repairError);
          throw new Error('AI返回了无效的JSON数据，即使修复后也无法解析。');
        }
      }

      // 验证必要字段
      if (!tableData.title || !tableData.columns || !tableData.rows) {
        throw new Error('生成的数据格式不完整');
      }

      return {
        success: true,
        data: tableData,
        rawResponse,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成表格失败',
        rawResponse: rawResponse || '无原始响应',
      };
    }
  }

  /**
   * 增强现有表格数据
   */
  async enhanceTable(table: GeneratedTable, instruction: string): Promise<AIResponse> {
    const enhancePrompt = `当前表格数据：
${JSON.stringify(table, null, 2)}

用户指令：${instruction}

请根据用户指令修改表格，返回完整的新表格JSON。`;
    let rawResponse = '';
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: enhancePrompt },
      ];

      rawResponse = await this.chat(messages);

      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从响应中提取JSON数据');
      }

      const tableData = JSON.parse(jsonMatch[0]) as GeneratedTable;

      return {
        success: true,
        data: tableData,
        rawResponse,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '增强表格失败',
        rawResponse: rawResponse || '无原始响应',
      };
    }
  }
}

/**
 * 默认AI服务实例
 */
export const aiService = new AIService();

/**
 * 便捷函数：根据自然语言生成表格
 */
export async function generateTableFromNaturalLanguage(input: string): Promise<AIResponse> {
  return aiService.generateTable(input);
}

/**
 * 将AI生成的表格数据转换为内部数据结构
 */
export function transformAITable(table: GeneratedTable): {
  employees: Employee[];
  records: AttendanceRecord[];
} {
  const employees: Employee[] = [];
  const records: AttendanceRecord[] = [];
  const employeeMap = new Map<string, Employee>();

  table.rows.forEach((row, index) => {
    // 获取员工姓名，支持多种字段名
    const employeeName = String(
      row.employeeName || row.name || row['姓名'] || row['员工姓名'] || `员工${index + 1}`
    );
    let employee = employeeMap.get(employeeName);

    if (!employee) {
      employee = {
        id: `emp_${Date.now()}_${employees.length}`,
        name: employeeName,
        department: String(row.department || row['部门'] || '未分配'),
      };
      employees.push(employee);
      employeeMap.set(employeeName, employee);
    }

    // 解析日期
    const dateValue = row.date || row['日期'];
    let parsedDate = new Date();
    if (dateValue) {
      parsedDate = new Date(String(dateValue));
    }

    // 解析上班时间
    const checkInValue = row.checkInTime || row['上班时间'];
    let checkInTime: Date | undefined;
    if (checkInValue) {
      checkInTime = new Date(`1970-01-01T${String(checkInValue)}`);
    }

    // 解析下班时间
    const checkOutValue = row.checkOutTime || row['下班时间'];
    let checkOutTime: Date | undefined;
    if (checkOutValue) {
      checkOutTime = new Date(`1970-01-01T${String(checkOutValue)}`);
    }

    // 解析状态
    const statusValue = row.status || row['状态'];
    let status: AttendanceStatus = AttendanceStatus.NORMAL;
    if (statusValue) {
      const statusStr = String(statusValue);
      if (statusStr.includes('迟到')) status = AttendanceStatus.LATE;
      else if (statusStr.includes('早退')) status = AttendanceStatus.EARLY_LEAVE;
      else if (statusStr.includes('缺勤') || statusStr.includes('旷工'))
        status = AttendanceStatus.ABSENT;
      else if (statusStr.includes('请假')) status = AttendanceStatus.LEAVE;
      else if (statusStr.includes('加班')) status = AttendanceStatus.OVERTIME;
      else if (statusStr.includes('外出')) status = AttendanceStatus.OUT;
      else if (statusStr.includes('出差')) status = AttendanceStatus.BUSINESS_TRIP;
    }

    const record: AttendanceRecord = {
      id: `rec_${Date.now()}_${records.length}`,
      employeeId: employee.id,
      employeeName: employee.name,
      date: parsedDate,
      checkInTime,
      checkOutTime,
      workHours: Number(row.workHours || row['工作时长']) || undefined,
      overtimeHours: Number(row.overtimeHours || row['加班时长']) || undefined,
      status,
      notes: String(row.notes || row['备注'] || ''),
    };
    records.push(record);
  });

  return { employees, records };
}
