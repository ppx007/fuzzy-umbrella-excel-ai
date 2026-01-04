/**
 * 通用表格生成服务
 * 使用 AI 根据自然语言生成表格结构和数据
 * 支持智能样式推断和条件格式
 */

import { config as appConfig } from '@/config';
import {
  TableGenerationRequest,
  TableGenerationResponse,
  GenericTableData,
  GenericTableColumn,
  ExtendedColumnType,
  StyledTableData,
  StyledTableGenerationRequest,
  StyledTableGenerationResponse,
  TableStyleConfig,
  ColorThemeName,
  COLOR_THEMES,
  ConditionalFormatRule,
} from '@/types/common';

/**
 * 表格生成服务配置
 */
export interface TableGenerationServiceConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

/**
 * 通用表格生成的系统提示词
 */
const GENERIC_TABLE_SYSTEM_PROMPT = `你是一个智能表格生成引擎。根据用户的自然语言描述，生成一个结构化的表格定义。

**规则:**
1. 必须返回一个完整的、语法正确的JSON对象。
2. 绝对不能在JSON之外包含任何解释、注释或Markdown代码块（如 \`\`\`json）。
3. 返回的JSON对象必须严格遵循以下结构：
   {
     "tableName": "表格名称",
     "columns": [
       {
         "name": "列名称（中文显示名）",
         "type": "text|number|date|time|datetime|currency|percentage|boolean|email|phone|url|formula",
         "width": 数字（可选，默认100）,
         "format": "格式字符串（可选）",
         "required": true/false（可选，默认false）
       }
     ],
     "rows": [
       {"列名1": "值1", "列名2": "值2", ...}
     ]
   }

4. 智能推断列的数据类型：
   - 姓名、名称、标题、描述、备注 → text
   - 年龄、数量、数目、个数、次数 → number
   - 日期、生日 → date
   - 时间、时刻 → time
   - 日期时间、创建时间、更新时间 → datetime
   - 邮箱、电子邮件 → email
   - 电话、手机、联系方式 → phone
   - 网址、链接、URL → url
   - 价格、费用、金额、成本、收入 → currency
   - 比例、占比、百分比、完成率 → percentage
   - 是否、状态（是/否类型） → boolean
   - 公式、计算 → formula

5. 如果用户要求示例数据，生成合理且多样化的数据。
6. 列名使用用户指定的中文名称。
7. 如果用户没有明确指定表格名称，根据内容智能推断一个合适的名称。

**你的输出必须从 { 开始，到 } 结束。**`;

/**
 * 带样式的表格生成系统提示词
 */
const STYLED_TABLE_SYSTEM_PROMPT = `你是一个智能表格生成引擎。根据用户的自然语言描述，生成一个带样式配置的结构化表格定义。

**规则:**
1. 必须返回一个完整的、语法正确的JSON对象。
2. 绝对不能在JSON之外包含任何解释、注释或Markdown代码块（如 \`\`\`json）。
3. 返回的JSON对象必须严格遵循以下结构：
   {
     "tableName": "表格名称",
     "columns": [
       {
         "name": "列名称（中文显示名）",
         "type": "text|number|date|time|datetime|currency|percentage|boolean|email|phone|url|formula|status",
         "width": 数字（可选，默认100）,
         "format": "格式字符串（可选）",
         "required": true/false（可选，默认false）
       }
     ],
     "rows": [
       {"列名1": "值1", "列名2": "值2", ...}
     ],
     "style": {
       "colorTheme": "professional|energetic|nature|elegant|dark|fresh",
       "conditionalFormats": [
         {
           "columnName": "要应用条件格式的列名",
           "config": {
             "type": "colorScale|dataBar|iconSet|cellValue",
             // colorScale: {"minColor": "#绿色", "maxColor": "#红色"}
             // dataBar: {"color": "#蓝色", "showValue": true}
             // iconSet: {"iconType": "arrows|circles|flags|stars|ratings"}
             // cellValue: {"operator": "greaterThan|lessThan|equal|contains", "values": [...], "format": {"backgroundColor": "#颜色", "fontColor": "#颜色", "bold": true}}
           }
         }
       ]
     }
   }

4. 智能推断列的数据类型：
   - 姓名、名称、标题、描述、备注 → text
   - 年龄、数量、数目、个数、次数 → number
   - 日期、生日 → date
   - 时间、时刻 → time
   - 日期时间、创建时间、更新时间 → datetime
   - 邮箱、电子邮件 → email
   - 电话、手机、联系方式 → phone
   - 网址、链接、URL → url
   - 价格、费用、金额、成本、收入 → currency
   - 比例、占比、百分比、完成率 → percentage
   - 是否、状态（是/否类型） → boolean
   - 公式、计算 → formula
   - 状态、进度状态（如：完成/进行中/未开始） → status

5. **智能样式推断规则**:
   - 从用户描述中识别风格关键词：
     * "专业"、"商务"、"正式" → colorTheme: "professional"
     * "活力"、"活泼"、"橙色"、"热情" → colorTheme: "energetic"
     * "自然"、"环保"、"绿色"、"健康" → colorTheme: "nature"
     * "优雅"、"紫色"、"高贵" → colorTheme: "elegant"
     * "深色"、"暗色"、"夜间"、"酷" → colorTheme: "dark"
     * "清新"、"简洁"、"蓝色"、"浅色" → colorTheme: "fresh"
   - 如果没有明确风格描述，默认使用 "professional"

6. **智能条件格式推断**:
   - 对于数值型列（number、currency、percentage）：
     * 如果是"销售额"、"收入"、"利润" → 使用 dataBar 显示进度
     * 如果是"完成率"、"进度" → 使用 colorScale（红到绿）
     * 如果是"排名"、"得分" → 使用 iconSet (stars)
   - 对于状态型列（包含"状态"、"结果"等关键词）：
     * 自动添加 cellValue 条件格式，根据常见状态值着色
   - 对于百分比列：
     * 默认使用 dataBar 或 colorScale

7. 如果用户要求示例数据，生成合理且多样化的数据。
8. 列名使用用户指定的中文名称。
9. 如果用户没有明确指定表格名称，根据内容智能推断一个合适的名称。

**你的输出必须从 { 开始，到 } 结束。**`;

/**
 * 样式关键词映射表
 */
const STYLE_KEYWORD_MAP: Record<string, ColorThemeName> = {
  // 专业商务
  专业: 'professional',
  商务: 'professional',
  正式: 'professional',
  企业: 'professional',
  办公: 'professional',
  // 活力橙
  活力: 'energetic',
  活泼: 'energetic',
  橙色: 'energetic',
  热情: 'energetic',
  温暖: 'energetic',
  // 自然绿
  自然: 'nature',
  环保: 'nature',
  绿色: 'nature',
  健康: 'nature',
  生态: 'nature',
  // 优雅紫
  优雅: 'elegant',
  紫色: 'elegant',
  高贵: 'elegant',
  典雅: 'elegant',
  // 深色
  深色: 'dark',
  暗色: 'dark',
  夜间: 'dark',
  酷: 'dark',
  黑色: 'dark',
  // 清新
  清新: 'fresh',
  简洁: 'fresh',
  蓝色: 'fresh',
  浅色: 'fresh',
  简约: 'fresh',
};

/**
 * 表格生成服务类
 */
export class TableGenerationService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: TableGenerationServiceConfig = {}) {
    this.apiKey = config.apiKey || appConfig.openai.apiKey;
    this.baseUrl = config.baseUrl || appConfig.openai.baseUrl;
    this.model = config.model || appConfig.openai.model;
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return Boolean(this.apiKey && this.baseUrl);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<TableGenerationServiceConfig>): void {
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.model) this.model = config.model;
  }

  /**
   * 根据自然语言生成表格（无样式）
   */
  async generateTable(request: TableGenerationRequest): Promise<TableGenerationResponse> {
    // 验证服务是否可用
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'AI服务未配置，请检查API密钥和端点',
      };
    }

    // 验证输入
    if (!request.prompt || request.prompt.trim().length === 0) {
      return {
        success: false,
        error: '请输入表格描述',
      };
    }

    try {
      // 构建用户提示词
      const userPrompt = this.buildUserPrompt(request);

      // 调用 AI API
      const rawResponse = await this.callAI(userPrompt);

      // 解析响应
      const tableData = this.parseResponse(rawResponse, request.prompt);

      // 验证表格数据
      const validationResult = this.validateTableData(tableData);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `生成的表格数据无效: ${validationResult.errors.join(', ')}`,
        };
      }

      return {
        success: true,
        data: tableData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成表格失败',
      };
    }
  }

  /**
   * 根据自然语言生成带样式的表格
   */
  async generateStyledTable(
    request: StyledTableGenerationRequest
  ): Promise<StyledTableGenerationResponse> {
    // 验证服务是否可用
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'AI服务未配置，请检查API密钥和端点',
      };
    }

    // 验证输入
    if (!request.prompt || request.prompt.trim().length === 0) {
      return {
        success: false,
        error: '请输入表格描述',
      };
    }

    try {
      // 从用户描述中推断样式偏好
      const inferredTheme = this.inferStyleFromPrompt(request.prompt, request.stylePreference);

      // 构建用户提示词（包含样式信息）
      const userPrompt = this.buildStyledUserPrompt(request, inferredTheme);

      // 调用 AI API（使用带样式的提示词）
      const rawResponse = await this.callStyledAI(userPrompt);

      // 解析响应
      const tableData = this.parseStyledResponse(rawResponse, request.prompt, inferredTheme);

      // 验证表格数据
      const validationResult = this.validateTableData(tableData);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `生成的表格数据无效: ${validationResult.errors.join(', ')}`,
        };
      }

      return {
        success: true,
        data: tableData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成表格失败',
      };
    }
  }

  /**
   * 从用户描述中推断样式主题
   */
  private inferStyleFromPrompt(
    prompt: string,
    stylePreference?: StyledTableGenerationRequest['stylePreference']
  ): ColorThemeName {
    // 如果用户明确指定了主题，直接使用
    if (stylePreference?.theme) {
      return stylePreference.theme;
    }

    // 如果有关键词偏好，检查是否匹配
    if (stylePreference?.keywords) {
      for (const keyword of stylePreference.keywords) {
        const mappedTheme = STYLE_KEYWORD_MAP[keyword];
        if (mappedTheme) {
          return mappedTheme;
        }
      }
    }

    // 从 prompt 中提取关键词
    for (const [keyword, theme] of Object.entries(STYLE_KEYWORD_MAP)) {
      if (prompt.includes(keyword)) {
        return theme;
      }
    }

    // 默认使用专业主题
    return 'professional';
  }

  /**
   * 构建带样式的用户提示词
   */
  private buildStyledUserPrompt(
    request: StyledTableGenerationRequest,
    theme: ColorThemeName
  ): string {
    const { prompt, options, stylePreference } = request;
    const parts: string[] = [prompt];

    if (options?.includeExampleData) {
      const rowCount = options.rowCount || 5;
      parts.push(`请生成 ${rowCount} 条示例数据。`);
    }

    if (options?.language === 'en') {
      parts.push('请使用英文列名和数据。');
    } else {
      parts.push('请使用中文列名和数据。');
    }

    // 添加样式指示
    const themeName = COLOR_THEMES[theme]?.name || '专业商务';
    parts.push(`请使用"${themeName}"风格的配色主题（colorTheme: "${theme}"）。`);

    // 如果启用条件格式
    if (stylePreference?.enableConditionalFormat !== false) {
      parts.push('请根据列的数据类型智能添加条件格式（如数据条、颜色阶梯、图标集等）。');
    }

    return parts.join(' ');
  }

  /**
   * 调用 AI API（带样式）
   */
  private async callStyledAI(userPrompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: STYLED_TABLE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('AI 返回了空响应');
    }

    return content;
  }

  /**
   * 解析带样式的 AI 响应
   */
  private parseStyledResponse(
    rawResponse: string,
    originalPrompt: string,
    inferredTheme: ColorThemeName
  ): StyledTableData {
    // 提取 JSON 内容
    const jsonMatch = rawResponse.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      throw new Error('无法从响应中提取有效的JSON对象');
    }

    const jsonString = jsonMatch[0];

    // 检查 JSON 是否完整
    if (!jsonString.trim().startsWith('{') || !jsonString.trim().endsWith('}')) {
      throw new Error('AI返回的数据不是一个完整的JSON对象');
    }

    interface ParsedStyleData {
      tableName?: string;
      columns?: Array<{
        name: string;
        type?: string;
        width?: number;
        format?: string;
        required?: boolean;
        defaultValue?: unknown;
        validation?: {
          min?: number;
          max?: number;
          pattern?: string;
          options?: string[];
        };
      }>;
      rows?: Record<string, unknown>[];
      style?: {
        colorTheme?: string;
        conditionalFormats?: Array<{
          columnName: string;
          config: {
            type: string;
            [key: string]: unknown;
          };
        }>;
      };
    }

    let parsedData: ParsedStyleData;

    try {
      parsedData = JSON.parse(jsonString);
    } catch {
      // 尝试修复常见的 JSON 问题
      console.warn('[TableGenerationService] JSON解析失败，尝试修复...');
      try {
        const repairedJson = jsonString.replace(/,\s*([}\]])/g, '$1');
        parsedData = JSON.parse(repairedJson);
        console.log('[TableGenerationService] JSON修复成功!');
      } catch {
        throw new Error('AI返回了无效的JSON数据，无法解析');
      }
    }

    // 构建样式配置
    const styleConfig = this.buildStyleConfig(
      parsedData.style,
      inferredTheme,
      parsedData.columns || []
    );

    // 转换为 StyledTableData 格式
    const tableData: StyledTableData = {
      tableName: parsedData.tableName || '未命名表格',
      columns: this.normalizeColumns(parsedData.columns || []),
      rows: parsedData.rows || [],
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'ai',
        prompt: originalPrompt,
      },
      style: styleConfig,
    };

    return tableData;
  }

  /**
   * 构建样式配置
   */
  private buildStyleConfig(
    aiStyle:
      | {
          colorTheme?: string;
          conditionalFormats?: Array<{
            columnName: string;
            config: { type: string; [key: string]: unknown };
          }>;
        }
      | undefined,
    inferredTheme: ColorThemeName,
    columns: Array<{ name: string; type?: string }>
  ): TableStyleConfig {
    // 使用 AI 返回的主题或推断的主题
    const themeName = (aiStyle?.colorTheme as ColorThemeName) || inferredTheme;
    const theme = COLOR_THEMES[themeName] || COLOR_THEMES.professional;

    const config: TableStyleConfig = {
      colorTheme: themeName,
      excelTableStyle: theme.excelTableStyle,
      header: {
        backgroundColor: theme.primary,
        fontColor: theme.headerText,
        bold: true,
        align: 'center',
      },
      body: {
        alternateRowColor: true,
        alternateColor: theme.secondary,
      },
      border: {
        style: 'thin',
        color: '#D0D0D0',
        showInner: true,
        showOuter: true,
      },
    };

    // 处理 AI 返回的条件格式
    if (aiStyle?.conditionalFormats && aiStyle.conditionalFormats.length > 0) {
      config.conditionalFormats = this.normalizeConditionalFormats(aiStyle.conditionalFormats);
    } else {
      // 自动推断条件格式
      config.conditionalFormats = this.inferConditionalFormats(columns);
    }

    return config;
  }

  /**
   * 标准化条件格式规则
   */
  private normalizeConditionalFormats(
    formats: Array<{ columnName: string; config: { type: string; [key: string]: unknown } }>
  ): ConditionalFormatRule[] {
    return formats.map(f => {
      // 确保 config 有正确的 type
      if (!['colorScale', 'dataBar', 'iconSet', 'cellValue'].includes(f.config.type)) {
        return {
          columnName: f.columnName,
          config: {
            type: 'dataBar' as const,
            color: '#4472C4',
            showValue: true,
          },
        };
      }

      // 根据类型构建正确的配置
      switch (f.config.type) {
        case 'colorScale':
          return {
            columnName: f.columnName,
            config: {
              type: 'colorScale' as const,
              minColor: (f.config.minColor as string) || '#F8696B',
              midColor: f.config.midColor as string | undefined,
              maxColor: (f.config.maxColor as string) || '#63BE7B',
            },
          };
        case 'dataBar':
          return {
            columnName: f.columnName,
            config: {
              type: 'dataBar' as const,
              color: (f.config.color as string) || '#4472C4',
              showValue: (f.config.showValue as boolean) ?? true,
            },
          };
        case 'iconSet':
          return {
            columnName: f.columnName,
            config: {
              type: 'iconSet' as const,
              iconType:
                (f.config.iconType as 'arrows' | 'circles' | 'flags' | 'stars' | 'ratings') ||
                'arrows',
            },
          };
        case 'cellValue':
          return {
            columnName: f.columnName,
            config: {
              type: 'cellValue' as const,
              operator:
                (f.config.operator as
                  | 'greaterThan'
                  | 'lessThan'
                  | 'equal'
                  | 'notEqual'
                  | 'between'
                  | 'contains') || 'contains',
              values: (f.config.values as (string | number)[]) || [],
              format: (f.config.format as {
                backgroundColor?: string;
                fontColor?: string;
                bold?: boolean;
              }) || {
                backgroundColor: '#C6EFCE',
                fontColor: '#006100',
              },
            },
          };
        default:
          return {
            columnName: f.columnName,
            config: {
              type: 'dataBar' as const,
              color: '#4472C4',
              showValue: true,
            },
          };
      }
    });
  }

  /**
   * 根据列类型自动推断条件格式
   */
  private inferConditionalFormats(
    columns: Array<{ name: string; type?: string }>
  ): ConditionalFormatRule[] {
    const rules: ConditionalFormatRule[] = [];

    for (const col of columns) {
      const name = col.name.toLowerCase();
      const type = col.type?.toLowerCase();

      // 对数值型列添加数据条
      if (type === 'number' || type === 'currency') {
        if (name.includes('销售') || name.includes('收入') || name.includes('金额')) {
          rules.push({
            columnName: col.name,
            config: {
              type: 'dataBar',
              color: '#4472C4',
              showValue: true,
            },
          });
        } else if (name.includes('排名') || name.includes('得分') || name.includes('评分')) {
          rules.push({
            columnName: col.name,
            config: {
              type: 'iconSet',
              iconType: 'stars',
            },
          });
        }
      }

      // 对百分比列添加颜色阶梯
      if (type === 'percentage' || name.includes('完成率') || name.includes('进度')) {
        rules.push({
          columnName: col.name,
          config: {
            type: 'colorScale',
            minColor: '#F8696B',
            midColor: '#FFEB84',
            maxColor: '#63BE7B',
          },
        });
      }

      // 对状态列添加单元格值条件格式（这将在 Excel 适配器中处理）
      if (type === 'status' || name.includes('状态') || name.includes('结果')) {
        rules.push({
          columnName: col.name,
          config: {
            type: 'cellValue',
            operator: 'contains',
            values: ['完成', '正常', '通过'],
            format: {
              backgroundColor: '#C6EFCE',
              fontColor: '#006100',
              bold: false,
            },
          },
        });
      }
    }

    return rules;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(request: TableGenerationRequest): string {
    const { prompt, options } = request;
    const parts: string[] = [prompt];

    if (options?.includeExampleData) {
      const rowCount = options.rowCount || 5;
      parts.push(`请生成 ${rowCount} 条示例数据。`);
    }

    if (options?.language === 'en') {
      parts.push('请使用英文列名和数据。');
    } else {
      parts.push('请使用中文列名和数据。');
    }

    return parts.join(' ');
  }

  /**
   * 调用 AI API
   */
  private async callAI(userPrompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: GENERIC_TABLE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('AI 返回了空响应');
    }

    return content;
  }

  /**
   * 解析 AI 响应
   */
  private parseResponse(rawResponse: string, originalPrompt: string): GenericTableData {
    // 提取 JSON 内容
    const jsonMatch = rawResponse.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      throw new Error('无法从响应中提取有效的JSON对象');
    }

    const jsonString = jsonMatch[0];

    // 检查 JSON 是否完整
    if (!jsonString.trim().startsWith('{') || !jsonString.trim().endsWith('}')) {
      throw new Error('AI返回的数据不是一个完整的JSON对象');
    }

    let parsedData: {
      tableName?: string;
      columns?: Array<{
        name: string;
        type?: string;
        width?: number;
        format?: string;
        required?: boolean;
        defaultValue?: unknown;
        validation?: {
          min?: number;
          max?: number;
          pattern?: string;
          options?: string[];
        };
      }>;
      rows?: Record<string, unknown>[];
    };

    try {
      parsedData = JSON.parse(jsonString);
    } catch {
      // 尝试修复常见的 JSON 问题
      console.warn('[TableGenerationService] JSON解析失败，尝试修复...');
      try {
        const repairedJson = jsonString.replace(/,\s*([}\]])/g, '$1');
        parsedData = JSON.parse(repairedJson);
        console.log('[TableGenerationService] JSON修复成功!');
      } catch {
        throw new Error('AI返回了无效的JSON数据，无法解析');
      }
    }

    // 转换为 GenericTableData 格式
    const tableData: GenericTableData = {
      tableName: parsedData.tableName || '未命名表格',
      columns: this.normalizeColumns(parsedData.columns || []),
      rows: parsedData.rows || [],
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'ai',
        prompt: originalPrompt,
      },
    };

    return tableData;
  }

  /**
   * 标准化列定义
   */
  private normalizeColumns(
    columns: Array<{
      name: string;
      type?: string;
      width?: number;
      format?: string;
      required?: boolean;
      defaultValue?: unknown;
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        options?: string[];
      };
    }>
  ): GenericTableColumn[] {
    return columns.map(col => ({
      name: col.name,
      type: this.normalizeColumnType(col.type),
      width: col.width || 100,
      format: col.format,
      required: col.required || false,
      defaultValue: col.defaultValue,
      validation: col.validation,
    }));
  }

  /**
   * 标准化列类型
   */
  private normalizeColumnType(type?: string): ExtendedColumnType {
    const validTypes: ExtendedColumnType[] = [
      'text',
      'number',
      'date',
      'time',
      'datetime',
      'currency',
      'percentage',
      'boolean',
      'email',
      'phone',
      'url',
      'formula',
    ];

    if (type && validTypes.includes(type as ExtendedColumnType)) {
      return type as ExtendedColumnType;
    }

    // 类型映射
    const typeMapping: Record<string, ExtendedColumnType> = {
      string: 'text',
      str: 'text',
      int: 'number',
      integer: 'number',
      float: 'number',
      double: 'number',
      decimal: 'number',
      bool: 'boolean',
      money: 'currency',
      percent: 'percentage',
      link: 'url',
      tel: 'phone',
      mobile: 'phone',
      mail: 'email',
    };

    if (type && typeMapping[type.toLowerCase()]) {
      return typeMapping[type.toLowerCase()];
    }

    // 默认为 text
    return 'text';
  }

  /**
   * 验证表格数据
   */
  private validateTableData(data: GenericTableData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.tableName || data.tableName.trim().length === 0) {
      errors.push('表格名称不能为空');
    }

    if (!data.columns || data.columns.length === 0) {
      errors.push('表格必须至少有一列');
    }

    if (data.columns) {
      data.columns.forEach((col, index) => {
        if (!col.name || col.name.trim().length === 0) {
          errors.push(`第 ${index + 1} 列的名称不能为空`);
        }
      });

      // 检查列名是否重复
      const columnNames = data.columns.map(col => col.name);
      const duplicates = columnNames.filter((name, index) => columnNames.indexOf(name) !== index);
      if (duplicates.length > 0) {
        errors.push(`存在重复的列名: ${[...new Set(duplicates)].join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 默认表格生成服务实例
 */
export const tableGenerationService = new TableGenerationService();

/**
 * 便捷函数：根据自然语言生成表格（无样式）
 */
export async function generateTableFromPrompt(
  prompt: string,
  options?: TableGenerationRequest['options']
): Promise<TableGenerationResponse> {
  return tableGenerationService.generateTable({ prompt, options });
}

/**
 * 便捷函数：根据自然语言生成带样式的表格
 */
export async function generateStyledTableFromPrompt(
  prompt: string,
  options?: TableGenerationRequest['options'],
  stylePreference?: StyledTableGenerationRequest['stylePreference']
): Promise<StyledTableGenerationResponse> {
  return tableGenerationService.generateStyledTable({ prompt, options, stylePreference });
}
