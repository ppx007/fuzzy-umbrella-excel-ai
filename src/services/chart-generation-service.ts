/**
 * 图表生成服务
 * 使用 AI 解析自然语言指令，生成图表配置
 */

import { config } from '@/config';
import type {
  ChartGenerationRequest,
  ChartGenerationResponse,
  ChartConfig,
  ChartType,
  ReadTableData,
  ColorThemeName,
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
    console.log('[ChartGenerationService] 模型名称已清理:', model, '->', cleaned);
  }
  return cleaned;
}

/**
 * 构建图表生成 Prompt
 */
function buildChartPrompt(
  userPrompt: string,
  tableData?: ReadTableData,
  isModification: boolean = false,
  existingChart?: any
): string {
  let tableContext = '';
  if (tableData) {
    // 分析表格数据结构
    const numericColumns = tableData.columns.filter(
      c => c.type === 'number' || c.type === 'currency' || c.type === 'percentage'
    );
    const dateColumns = tableData.columns.filter(c => c.type === 'date');
    const textColumns = tableData.columns.filter(c => c.type === 'text');

    // 分析数据特征
    const hasHierarchy = textColumns.length >= 2 && numericColumns.length >= 1;
    const hasTimeSeries = dateColumns.length >= 1 && numericColumns.length >= 1;
    const hasCorrelation = numericColumns.length >= 2;
    const hasSingleValue = numericColumns.length === 1;

    tableContext = `
当前表格信息：
- 表格名称：${tableData.tableName || '未命名'}
- 地址：${tableData.address}
- 列定义：${JSON.stringify(tableData.columns.map(c => ({ name: c.name, type: c.type })))}
- 数据行数：${tableData.totalRows}
- 数据结构分析：
  * 数值列：${numericColumns.map(c => c.name).join(', ')}
  * 日期列：${dateColumns.map(c => c.name).join(', ')}
  * 文本列：${textColumns.map(c => c.name).join(', ')}
- 数据特征：
  * ${hasHierarchy ? '✓ 适合层级展示（旭日图/树图）' : '✗ 不适合层级展示'}
  * ${hasTimeSeries ? '✓ 适合趋势分析（折线图/面积图）' : '✗ 不适合趋势分析'}
  * ${hasCorrelation ? '✓ 适合相关性分析（散点图/热力图）' : '✗ 不适合相关性分析'}
  * ${hasSingleValue ? '✓ 适合占比展示（饼图/环形图）' : '✗ 不适合占比展示'}
- 示例数据（前5行）：
${JSON.stringify(tableData.rows.slice(0, 5), null, 2)}
`;
  }

  let existingChartContext = '';
  if (existingChart && isModification) {
    existingChartContext = `
当前图表信息：
- 图表类型：${existingChart.type || '未知'}
- 图表标题：${existingChart.title || '无标题'}
- 数据范围：${existingChart.dataSource?.dataRange || '未知'}
`;
  }

  const action = isModification ? '修改' : '创建';
  return `你是一个专业的 Excel 数据可视化专家。用户想要${action}一个图表。

${tableContext}
${existingChartContext}

用户请求：${userPrompt}

请深入分析用户的请求和数据特点，生成最优的图表配置。返回 JSON 格式：

\`\`\`json
{
"success": true,
"chartConfig": {
  "type": "图表类型",
  "title": "图表标题",
  "description": "图表说明（为什么选这个类型）",
  "dataSource": {
    "dataRange": "数据范围地址（如 A1:D10）",
    "hasHeaders": true,
    "xAxis": "X轴列名或索引（可选）",
    "yAxes": ["Y轴列名列表（可选）"],
    "series": ["系列列名列表（可选）"]
  },
  "showLegend": true,
  "legendPosition": "right",
  "showDataLabels": false,
  "colorTheme": "professional",
  "options": {
    "additionalProps": "其他图表特定选项"
  }
}
}
\`\`\`

支持的图表类型（type）及适用场景：

**比较类图表：**
- column: 柱状图（适合比较不同类别的数值，类别较多时）
- bar: 条形图（横向柱状图，适合标签较长或类别很多时）

**趋势类图表：**
- line: 折线图（适合显示时间趋势变化）
- area: 面积图（填充的折线图，强调累积效果）

**占比类图表：**
- pie: 饼图（适合显示各部分占总体的比例，类别不超过8个）
- doughnut: 环形图（类似饼图，中间有空洞，可显示多系列）

**关系类图表：**
- scatter: 散点图（适合显示两个数值变量的相关性）
- radar: 雷达图（适合多维度对比，如能力评估）

**组合类图表：**
- combo: 组合图（混合柱状图和折线图，适合对比和趋势）

**层级类图表：**
- sunburst: 旭日图（适合展示多层级的占比关系，如组织架构、产品分类）
- treemap: 树图（适合展示层级数据的相对大小，如文件大小、预算分配）

**矩阵类图表：**
- heatmap: 热力图（适合展示矩阵数据的密度或强度，如相关性、地理分布）

**图表选择指南：**
1. 有日期/时间列 + 数值列 → 优先考虑 line/area
2. 有层级关系（多列分类）→ 优先考虑 sunburst/treemap
3. 两个数值列的相关性 → 优先考虑 scatter/heatmap
4. 单数值列的占比 → 优先考虑 pie/doughnut
5. 多维度对比 → 优先考虑 radar
6. 类别比较 → 优先考虑 column/bar

**修改图表的特殊指令：**
- 如果用户说"改成"、"修改为"、"换成"等词语，表示要修改现有图表
- 如果用户说"添加数据标签"、"显示数值"等，设置 showDataLabels: true
- 如果用户说"隐藏图例"、"不要图例"等，设置 showLegend: false
- 如果用户说"改变颜色"、"换主题"等，更新 colorTheme
- 如果用户说"改标题"、"重命名"等，更新 title

图例位置（legendPosition）：top, bottom, left, right

注意事项：
1. 深入分析数据特点，选择最合适的图表类型，不要默认使用柱状图
2. dataRange 应该包含表头行
3. 给图表起一个描述性的标题，反映数据内容和图表类型
4. 在 description 字段中说明为什么选择这个图表类型
5. 确保生成的 JSON 中不包含任何非法控制字符（如 \x00-\x1F），只使用标准的 UTF-8 字符
6. 如果是修改请求，只修改用户明确提到的属性，保持其他属性不变

只返回 JSON，不要有其他内容。`;
}

/**
 * 解析 AI 响应
 */
function parseChartResponse(response: string): ChartGenerationResponse {
  try {
    // 提取 JSON
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    let jsonStr = jsonMatch ? jsonMatch[1] : response;

    // 移除可能导致 JSON 解析失败或 Excel 写入失败的控制字符
    // 保留 \n (0x0A) 和 \r (0x0D) 和 \t (0x09)，移除其他 0x00-0x1F
    jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    const parsed = JSON.parse(jsonStr.trim());

    console.log('[ChartGenerationService] AI 原始响应解析结果:', JSON.stringify(parsed, null, 2));

    if (!parsed.chartConfig) {
      console.error('[ChartGenerationService] 响应中缺少 chartConfig 字段');
      // 如果 AI 返回了具体的错误消息，优先使用它
      if (parsed.message) {
        return {
          success: false,
          error: parsed.message,
        };
      }
      return {
        success: false,
        error: '无效的图表配置',
      };
    }

    // 验证图表类型并处理不支持的类型
    const validTypes: ChartType[] = [
      'column',
      'bar',
      'line',
      'pie',
      'doughnut',
      'area',
      'scatter',
      'radar',
      'combo',
      'sunburst',
      'treemap',
      'heatmap',
    ];

    if (!validTypes.includes(parsed.chartConfig.type)) {
      parsed.chartConfig.type = 'column';
    }

    // 处理 Excel 不支持的图表类型
    // 注意：Sunburst 和 Treemap 在现代 Excel (2016+) 中是原生支持的
    const unsupportedTypes = ['heatmap'];
    if (unsupportedTypes.includes(parsed.chartConfig.type)) {
      const originalType = parsed.chartConfig.type;
      const replacement = getExcelCompatibleChartType(parsed.chartConfig.type);

      // 更新图表类型
      parsed.chartConfig.type = replacement.type;

      // 更新标题以说明替代方案
      const originalTitle = parsed.chartConfig.title || '图表';
      if (!originalTitle.includes('(替代')) {
        parsed.chartConfig.title = `${originalTitle} - ${replacement.description}`;
      }

      console.log(
        `[ChartGenerationService] 图表类型 "${originalType}" 被替换为 "${replacement.type}"`
      );
    }

    return {
      success: true,
      chartConfig: parsed.chartConfig,
    };
  } catch (error) {
    console.error('[ChartGenerationService] 解析响应失败:', error);
    return {
      success: false,
      error: '无法解析 AI 响应',
    };
  }
}

/**
 * 获取 Excel 兼容的图表类型
 * Excel 原生支持旭日图、树图和热力图
 */
function getExcelCompatibleChartType(type: ChartType): { type: ChartType; description: string } {
  switch (type) {
    case 'sunburst':
      return { type: 'sunburst', description: '旭日图' };
    case 'treemap':
      return { type: 'treemap', description: '树图' };
    case 'heatmap':
      // 热力图不是 Excel 原生图表类型，回退到柱状图
      return { type: 'column', description: '热力图(使用柱状图替代)' };
    default:
      return { type: type, description: '' };
  }
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
 * 图表生成服务类
 */
export class ChartGenerationService {
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
   * 请求生成图表（使用流式模式和自动重试机制）
   */
  async generateChart(
    request: ChartGenerationRequest,
    tableData?: ReadTableData,
    maxRetries: number = 3,
    isModification: boolean = false,
    existingChart?: any
  ): Promise<ChartGenerationResponse> {
    const { prompt, stylePreference } = request;

    const systemPrompt = buildChartPrompt(prompt, tableData, isModification, existingChart);
    const requestUrl = `${this.baseUrl}/chat/completions`;
    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      stream: true, // 启用流式模式避免 Cloudflare 超时
    };

    console.log('[ChartGenerationService] 发送请求到:', requestUrl);
    console.log('[ChartGenerationService] 使用模型:', this.model);
    console.log('[ChartGenerationService] 流式模式: 已启用');
    console.log('[ChartGenerationService] 最大重试次数:', maxRetries);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 180秒超时

      try {
        console.log(`[ChartGenerationService] 尝试第 ${attempt}/${maxRetries} 次请求...`);

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
            console.warn(`[ChartGenerationService] ${lastError.message}，将重试...`);
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

        console.log(`[ChartGenerationService] 第 ${attempt} 次请求成功！`);
        console.log('[ChartGenerationService] 响应长度:', content.length, '字符');

        const result = parseChartResponse(content);

        // 应用用户的样式偏好
        if (result.success && result.chartConfig && stylePreference?.theme) {
          result.chartConfig.colorTheme = stylePreference.theme;
        }

        return result;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = new Error(`请求超时（180秒），第 ${attempt} 次尝试失败`);
            console.warn(`[ChartGenerationService] ${lastError.message}`);
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

        console.error('[ChartGenerationService] 请求失败:', error);

        if (attempt < maxRetries) {
          console.warn(`[ChartGenerationService] 将进行第 ${attempt + 1} 次重试...`);
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
      console.log('[ChartGenerationService] 开始接收流式响应...');
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

      console.log(`[ChartGenerationService] 流式响应完成，共 ${chunkCount} 个数据块`);
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  /**
   * 根据表格数据自动推荐图表类型
   */
  recommendChartType(tableData: ReadTableData): ChartType {
    const columns = tableData.columns;
    const rows = tableData.rows;

    // 计算数值列数量
    const numericColumns = columns.filter(
      c => c.type === 'number' || c.type === 'currency' || c.type === 'percentage'
    ).length;

    // 计算行数
    const rowCount = rows.length;

    // 检查是否有日期列
    const hasDateColumn = columns.some(c => c.type === 'date');

    // 推荐逻辑
    if (hasDateColumn && numericColumns >= 1) {
      // 有日期列，适合折线图显示趋势
      return 'line';
    }

    if (numericColumns === 1 && rowCount <= 8) {
      // 单个数值列且类别少，适合饼图
      return 'pie';
    }

    if (numericColumns >= 2 && rowCount <= 10) {
      // 多个数值列，适合雷达图或组合图
      return numericColumns <= 3 ? 'bar' : 'radar';
    }

    if (rowCount > 10) {
      // 数据量大，适合柱状图或折线图
      return numericColumns >= 2 ? 'line' : 'column';
    }

    // 默认柱状图
    return 'column';
  }

  /**
   * 生成默认图表配置
   */
  createDefaultConfig(
    tableData: ReadTableData,
    chartType?: ChartType,
    theme?: ColorThemeName
  ): ChartConfig {
    const type = chartType || this.recommendChartType(tableData);
    const columns = tableData.columns;

    // 找到第一个文本列作为 X 轴
    const xAxisCol = columns.find(c => c.type === 'text') || columns[0];

    // 找到所有数值列作为 Y 轴
    const yAxisCols = columns
      .filter(c => c.type === 'number' || c.type === 'currency' || c.type === 'percentage')
      .map(c => c.name);

    // 构建数据范围
    const dataRange = tableData.address;

    return {
      type,
      title: `${tableData.tableName || '数据'} - ${this.getChartTypeName(type)}`,
      dataSource: {
        dataRange,
        hasHeaders: true,
        xAxis: xAxisCol.name,
        yAxes: yAxisCols.length > 0 ? yAxisCols : [columns[1]?.name || columns[0].name],
      },
      showLegend: yAxisCols.length > 1,
      legendPosition: 'right',
      showDataLabels: type === 'pie' || type === 'doughnut',
      colorTheme: theme || 'professional',
    };
  }

  /**
   * 获取图表类型的中文名称
   */
  getChartTypeName(type: ChartType): string {
    const names: Record<ChartType, string> = {
      column: '柱状图',
      bar: '条形图',
      line: '折线图',
      pie: '饼图',
      doughnut: '环形图',
      area: '面积图',
      scatter: '散点图',
      radar: '雷达图',
      combo: '组合图',
      sunburst: '旭日图',
      treemap: '树图',
      heatmap: '热力图',
    };
    return names[type] || type;
  }

  /**
   * 获取所有可用图表类型
   */
  getAvailableChartTypes(): { type: ChartType; name: string; description: string }[] {
    return [
      { type: 'column', name: '柱状图', description: '比较不同类别的数值大小' },
      { type: 'bar', name: '条形图', description: '横向柱状图，适合长标签' },
      { type: 'line', name: '折线图', description: '显示数据趋势变化' },
      { type: 'pie', name: '饼图', description: '显示各部分占总体的比例' },
      { type: 'doughnut', name: '环形图', description: '类似饼图，中间有空洞' },
      { type: 'area', name: '面积图', description: '填充的折线图' },
      { type: 'scatter', name: '散点图', description: '显示两个变量的关系' },
      { type: 'radar', name: '雷达图', description: '多维度对比' },
      { type: 'combo', name: '组合图', description: '混合柱状图和折线图' },
      {
        type: 'sunburst',
        name: '旭日图',
        description: '层级数据展示',
      },
      { type: 'treemap', name: '树图', description: '层级数据展示' },
      {
        type: 'heatmap',
        name: '热力图',
        description: '矩阵数据展示（Excel不支持，将使用替代方案）',
      },
    ];
  }
}

/**
 * 默认实例
 */
export const chartGenerationService = new ChartGenerationService();

/**
 * 便捷函数
 */
export async function generateChart(
  request: ChartGenerationRequest,
  tableData?: ReadTableData
): Promise<ChartGenerationResponse> {
  return chartGenerationService.generateChart(request, tableData);
}

/**
 * 修改图表配置
 */
export async function modifyChart(
  request: ChartGenerationRequest,
  tableData?: ReadTableData,
  existingChart?: any
): Promise<ChartGenerationResponse> {
  // 对于修改操作，我们使用相同的生成逻辑，但提示词会有所不同
  return chartGenerationService.generateChart(request, tableData, 3, true, existingChart);
}
