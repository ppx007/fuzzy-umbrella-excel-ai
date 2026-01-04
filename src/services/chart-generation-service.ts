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
 * 构建图表生成 Prompt
 */
function buildChartPrompt(userPrompt: string, tableData?: ReadTableData): string {
  let tableContext = '';
  if (tableData) {
    tableContext = `
当前表格信息：
- 表格名称：${tableData.tableName || '未命名'}
- 地址：${tableData.address}
- 列定义：${JSON.stringify(tableData.columns.map(c => ({ name: c.name, type: c.type })))}
- 数据行数：${tableData.totalRows}
- 示例数据（前5行）：
${JSON.stringify(tableData.rows.slice(0, 5), null, 2)}
`;
  }

  return `你是一个 Excel 图表助手。用户想要创建一个图表。

${tableContext}

用户请求：${userPrompt}

请分析用户的请求，生成图表配置。返回 JSON 格式：

\`\`\`json
{
  "success": true,
  "chartConfig": {
    "type": "图表类型",
    "title": "图表标题",
    "dataSource": {
      "dataRange": "数据范围地址（如 A1:D10）",
      "hasHeaders": true,
      "xAxis": "X轴列名或索引",
      "yAxes": ["Y轴列名列表"]
    },
    "showLegend": true,
    "legendPosition": "right",
    "showDataLabels": false,
    "colorTheme": "professional"
  }
}
\`\`\`

支持的图表类型（type）：
- column: 柱状图（适合比较不同类别的数值）
- bar: 条形图（横向柱状图，适合标签较长的情况）
- line: 折线图（适合显示趋势变化）
- pie: 饼图（适合显示占比）
- doughnut: 环形图（类似饼图，中间有空洞）
- area: 面积图（填充的折线图）
- scatter: 散点图（适合显示两个变量的关系）
- radar: 雷达图（适合多维度比较）
- combo: 组合图（混合柱状图和折线图）

支持的颜色主题（colorTheme）：
- professional: 专业商务（蓝色）
- energetic: 活力橙
- nature: 自然绿
- elegant: 优雅紫
- dark: 深色主题
- fresh: 清新蓝

图例位置（legendPosition）：top, bottom, left, right

注意事项：
1. 根据数据特点选择合适的图表类型
2. dataRange 应该包含表头行
3. 如果用户没有指定表格，使用合理的默认值
4. 给图表起一个描述性的标题

只返回 JSON，不要有其他内容。`;
}

/**
 * 解析 AI 响应
 */
function parseChartResponse(response: string): ChartGenerationResponse {
  try {
    // 提取 JSON
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;

    const parsed = JSON.parse(jsonStr.trim());

    if (!parsed.chartConfig) {
      return {
        success: false,
        error: '无效的图表配置',
      };
    }

    // 验证图表类型
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
    ];
    if (!validTypes.includes(parsed.chartConfig.type)) {
      parsed.chartConfig.type = 'column';
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
 * 图表生成服务类
 */
export class ChartGenerationService {
  private appConfig = config;

  /**
   * 请求生成图表
   */
  async generateChart(
    request: ChartGenerationRequest,
    tableData?: ReadTableData
  ): Promise<ChartGenerationResponse> {
    const { prompt, stylePreference } = request;

    const systemPrompt = buildChartPrompt(prompt, tableData);

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
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      const result = parseChartResponse(content);

      // 应用用户的样式偏好
      if (result.success && result.chartConfig && stylePreference?.theme) {
        result.chartConfig.colorTheme = stylePreference.theme;
      }

      return result;
    } catch (error) {
      console.error('[ChartGenerationService] 请求失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
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
