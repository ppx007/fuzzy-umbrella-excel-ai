/**
 * Excel适配器
 * 封装Office.js Excel API
 * 支持表格样式和条件格式
 * V2：支持智能选区检测和表格读取
 */

import {
  CellStyle,
  GenericTableData,
  ExtendedColumnType,
  StyledTableData,
  ConditionalFormatRule,
  ColorScaleConfig,
  DataBarConfig,
  IconSetConfig,
  CellValueConfig,
  COLOR_THEMES,
  STATUS_COLOR_MAP,
  ReadTableData,
  TableReadOptions,
  RangeDetectionResult,
  CellStyleInfo,
} from '@/types';
import { RenderResult } from '@/core/template';
import { ChartConfig } from '@/core/generator';

/**
 * Excel适配器配置
 */
export interface ExcelAdapterConfig {
  /** 默认工作表名称 */
  defaultSheetName?: string;
  /** 是否自动调整列宽 */
  autoFitColumns?: boolean;
  /** 是否自动调整行高 */
  autoFitRows?: boolean;
}

/**
 * 表格写入选项
 */
export interface WriteTableOptions {
  /** 工作表名称 */
  sheetName?: string;
  /** 起始单元格 */
  startCell?: string;
  /** 是否创建表格对象 */
  createTable?: boolean;
  /** 表格名称 */
  tableName?: string;
  /** 是否应用样式 */
  applyStyles?: boolean;
  /** 是否应用条件格式 */
  applyConditionalFormats?: boolean;
}

/**
 * 图表创建选项
 */
export interface CreateChartOptions {
  /** 工作表名称 */
  sheetName?: string;
  /** 图表位置 */
  position?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

/**
 * Excel适配器类
 */
export class ExcelAdapter {
  private config: ExcelAdapterConfig;

  constructor(config: ExcelAdapterConfig = {}) {
    this.config = {
      defaultSheetName: 'Sheet1',
      autoFitColumns: true,
      autoFitRows: false,
      ...config,
    };
  }

  /**
   * 检查Excel是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      return (
        typeof Office !== 'undefined' &&
        typeof Excel !== 'undefined' &&
        Office.context?.host === Office.HostType.Excel
      );
    } catch {
      return false;
    }
  }

  /**
   * 写入渲染结果到Excel
   */
  async writeRenderResult(result: RenderResult, options: WriteTableOptions = {}): Promise<void> {
    await Excel.run(async (context: Excel.RequestContext) => {
      const sheetName = options.sheetName || this.config.defaultSheetName;
      let sheet: Excel.Worksheet;

      // 获取或创建工作表
      const sheets = context.workbook.worksheets;
      sheets.load('items/name');
      await context.sync();

      const sheetExists = sheets.items.some(s => s.name === sheetName);
      if (!sheetExists) {
        sheet = sheets.add(sheetName);
      } else {
        sheet = sheets.getItem(sheetName!);
      }

      sheet.activate();

      const startCell = options.startCell || 'A1';
      const startRow = this.getCellRow(startCell);
      const startCol = this.getCellCol(startCell);

      let currentRow = startRow;

      // 写入表头
      for (const headerRow of result.headers) {
        const range = sheet.getRangeByIndexes(currentRow - 1, startCol - 1, 1, headerRow.length);
        range.values = [headerRow];

        // 应用表头样式
        if (options.applyStyles !== false && result.styles.has('header')) {
          this.applyStyle(range, result.styles.get('header')!);
        }

        // 应用标题样式（第一行）
        if (currentRow === startRow && result.styles.has('title')) {
          this.applyStyle(range, result.styles.get('title')!);
        }

        currentRow++;
      }

      // 写入数据行
      if (result.rows.length > 0) {
        const dataRange = sheet.getRangeByIndexes(
          currentRow - 1,
          startCol - 1,
          result.rows.length,
          result.rows[0].length
        );
        dataRange.values = result.rows as unknown[][];

        // 应用数据样式
        if (options.applyStyles !== false && result.styles.has('body')) {
          this.applyStyle(dataRange, result.styles.get('body')!);
        }
      }

      // 应用合并单元格
      for (const merge of result.merges) {
        const mergeRange = sheet.getRangeByIndexes(
          merge.startRow + startRow - 1,
          merge.startCol + startCol - 1,
          merge.endRow - merge.startRow + 1,
          merge.endCol - merge.startCol + 1
        );
        mergeRange.merge();
      }

      // 设置列宽
      if (result.columnWidths.length > 0) {
        for (let i = 0; i < result.columnWidths.length; i++) {
          const col = sheet.getRangeByIndexes(0, startCol - 1 + i, 1, 1).getEntireColumn();
          col.format.columnWidth = result.columnWidths[i];
        }
      }

      // 自动调整列宽
      if (this.config.autoFitColumns) {
        const usedRange = sheet.getUsedRange();
        usedRange.format.autofitColumns();
      }

      // 创建表格对象
      if (options.createTable) {
        const totalRows = result.headers.length + result.rows.length;
        const totalCols =
          result.rows[0]?.length || result.headers[result.headers.length - 1]?.length || 1;

        const tableRange = sheet.getRangeByIndexes(
          startRow - 1,
          startCol - 1,
          totalRows,
          totalCols
        );

        const tableName = options.tableName || `Table_${Date.now()}`;
        sheet.tables.add(tableRange, true).name = tableName;
      }

      await context.sync();
    });
  }

  /**
   * 将通用表格数据写入 Excel
   * @param tableData - GenericTableData 对象
   * @param options - 写入选项
   */
  async writeGenericTable(
    tableData: GenericTableData,
    options: WriteTableOptions = {}
  ): Promise<void> {
    await Excel.run(async (context: Excel.RequestContext) => {
      const sheetName = options.sheetName || this.config.defaultSheetName;
      let sheet: Excel.Worksheet;

      const sheets = context.workbook.worksheets;
      sheets.load('items/name');
      await context.sync();

      const sheetExists = sheets.items.some(s => s.name === sheetName);
      if (!sheetExists) {
        sheet = sheets.add(sheetName);
      } else {
        sheet = sheets.getItem(sheetName!);
      }

      sheet.activate();

      const startCell = options.startCell || 'A1';
      const startRow = this.getCellRow(startCell);
      const startCol = this.getCellCol(startCell);

      // 1. 写入表头
      const headers = tableData.columns.map(c => c.name);
      const headerRange = sheet.getRangeByIndexes(startRow - 1, startCol - 1, 1, headers.length);
      headerRange.values = [headers];
      headerRange.format.font.bold = true;

      // 2. 写入数据行
      if (tableData.rows.length > 0) {
        const data = tableData.rows.map(row =>
          tableData.columns.map(col => {
            const value = row[col.name];
            // 处理日期对象
            if (col.type === 'date' || col.type === 'datetime') {
              if (typeof value === 'string' && !isNaN(Date.parse(value))) {
                return new Date(value).toISOString();
              }
            }
            return value;
          })
        );

        const dataRange = sheet.getRangeByIndexes(
          startRow,
          startCol - 1,
          data.length,
          headers.length
        );
        dataRange.values = data as (string | number | boolean)[][];

        // 3. 根据列类型设置格式
        tableData.columns.forEach((column, index) => {
          const colRange = sheet.getRangeByIndexes(
            startRow,
            startCol - 1 + index,
            tableData.rows.length,
            1
          );
          const format = this.getNumberFormatForType(column.type, column.format);
          if (format) {
            // @ts-ignore
            colRange.numberFormat = [[format]];
          }
        });
      }

      const fullRange = sheet.getRangeByIndexes(
        startRow - 1,
        startCol - 1,
        tableData.rows.length + 1,
        headers.length
      );

      // 4. 自动调整列宽
      if (this.config.autoFitColumns) {
        fullRange.format.autofitColumns();
      }

      // 5. 创建表格样式
      if (options.createTable) {
        const tableName = options.tableName || tableData.tableName || `Table_${Date.now()}`;
        const table = sheet.tables.add(fullRange, true);
        table.name = tableName;
        // @ts-ignore
        table.showTotalsRow = false;
      }

      await context.sync();
    });
  }

  /**
   * 将带样式的表格数据写入 Excel
   * @param tableData - StyledTableData 对象（包含样式配置）
   * @param options - 写入选项
   */
  async writeStyledTable(
    tableData: StyledTableData,
    options: WriteTableOptions = {}
  ): Promise<void> {
    await Excel.run(async (context: Excel.RequestContext) => {
      const sheetName = options.sheetName || this.config.defaultSheetName;
      let sheet: Excel.Worksheet;

      const sheets = context.workbook.worksheets;
      sheets.load('items/name');
      await context.sync();

      const sheetExists = sheets.items.some(s => s.name === sheetName);
      if (!sheetExists) {
        sheet = sheets.add(sheetName);
      } else {
        sheet = sheets.getItem(sheetName!);
      }

      sheet.activate();

      const startCell = options.startCell || 'A1';
      const startRow = this.getCellRow(startCell);
      const startCol = this.getCellCol(startCell);

      const styleConfig = tableData.style;

      // 1. 写入表头
      const headers = tableData.columns.map(c => c.name);
      const headerRange = sheet.getRangeByIndexes(startRow - 1, startCol - 1, 1, headers.length);
      headerRange.values = [headers];

      // 应用表头样式
      if (styleConfig?.header) {
        if (styleConfig.header.backgroundColor) {
          headerRange.format.fill.color = styleConfig.header.backgroundColor;
        }
        if (styleConfig.header.fontColor) {
          headerRange.format.font.color = styleConfig.header.fontColor;
        }
        if (styleConfig.header.bold) {
          headerRange.format.font.bold = true;
        }
        if (styleConfig.header.fontSize) {
          headerRange.format.font.size = styleConfig.header.fontSize;
        }
        if (styleConfig.header.align) {
          headerRange.format.horizontalAlignment = this.mapHorizontalAlignment(
            styleConfig.header.align
          );
        }
      } else {
        headerRange.format.font.bold = true;
      }

      // 2. 写入数据行
      if (tableData.rows.length > 0) {
        const data = tableData.rows.map(row =>
          tableData.columns.map(col => {
            const value = row[col.name];
            if (col.type === 'date' || col.type === 'datetime') {
              if (typeof value === 'string' && !isNaN(Date.parse(value))) {
                return new Date(value).toISOString();
              }
            }
            return value;
          })
        );

        const dataRange = sheet.getRangeByIndexes(
          startRow,
          startCol - 1,
          data.length,
          headers.length
        );
        dataRange.values = data as (string | number | boolean)[][];

        // 应用交替行颜色
        if (styleConfig?.body?.alternateRowColor && styleConfig.body.alternateColor) {
          for (let i = 0; i < data.length; i++) {
            if (i % 2 === 1) {
              const rowRange = sheet.getRangeByIndexes(
                startRow + i,
                startCol - 1,
                1,
                headers.length
              );
              rowRange.format.fill.color = styleConfig.body.alternateColor;
            }
          }
        }

        // 3. 根据列类型设置格式
        tableData.columns.forEach((column, index) => {
          const colRange = sheet.getRangeByIndexes(
            startRow,
            startCol - 1 + index,
            tableData.rows.length,
            1
          );
          const format = this.getNumberFormatForType(column.type, column.format);
          if (format) {
            // @ts-ignore
            colRange.numberFormat = [[format]];
          }
        });
      }

      // 4. 应用边框样式
      const fullRange = sheet.getRangeByIndexes(
        startRow - 1,
        startCol - 1,
        tableData.rows.length + 1,
        headers.length
      );

      if (styleConfig?.border) {
        const borderStyle = this.mapBorderStyle(styleConfig.border.style);
        const borderColor = styleConfig.border.color || '#D0D0D0';

        if (styleConfig.border.showOuter !== false) {
          fullRange.format.borders.getItem(Excel.BorderIndex.edgeTop).style = borderStyle;
          fullRange.format.borders.getItem(Excel.BorderIndex.edgeTop).color = borderColor;
          fullRange.format.borders.getItem(Excel.BorderIndex.edgeBottom).style = borderStyle;
          fullRange.format.borders.getItem(Excel.BorderIndex.edgeBottom).color = borderColor;
          fullRange.format.borders.getItem(Excel.BorderIndex.edgeLeft).style = borderStyle;
          fullRange.format.borders.getItem(Excel.BorderIndex.edgeLeft).color = borderColor;
          fullRange.format.borders.getItem(Excel.BorderIndex.edgeRight).style = borderStyle;
          fullRange.format.borders.getItem(Excel.BorderIndex.edgeRight).color = borderColor;
        }

        if (styleConfig.border.showInner !== false) {
          fullRange.format.borders.getItem(Excel.BorderIndex.insideHorizontal).style = borderStyle;
          fullRange.format.borders.getItem(Excel.BorderIndex.insideHorizontal).color = borderColor;
          fullRange.format.borders.getItem(Excel.BorderIndex.insideVertical).style = borderStyle;
          fullRange.format.borders.getItem(Excel.BorderIndex.insideVertical).color = borderColor;
        }
      }

      // 5. 自动调整列宽
      if (this.config.autoFitColumns) {
        fullRange.format.autofitColumns();
      }

      // 6. 创建 Excel 表格并应用内置样式
      if (options.createTable !== false) {
        const tableName =
          options.tableName ||
          tableData.tableName?.replace(/[^a-zA-Z0-9_]/g, '_') ||
          `Table_${Date.now()}`;
        const table = sheet.tables.add(fullRange, true);
        table.name = tableName;

        // 应用 Excel 内置表格样式
        // @ts-ignore - table.style 在 Excel API 1.1+ 中可用
        if (styleConfig?.excelTableStyle) {
          // @ts-ignore
          table.style = styleConfig.excelTableStyle;
        } else if (styleConfig?.colorTheme) {
          const theme = COLOR_THEMES[styleConfig.colorTheme];
          if (theme) {
            // @ts-ignore
            table.style = theme.excelTableStyle;
          }
        }

        // @ts-ignore
        table.showTotalsRow = false;
      }

      await context.sync();

      // 7. 应用条件格式（需要单独的 sync）
      if (options.applyConditionalFormats !== false && styleConfig?.conditionalFormats) {
        await this.applyConditionalFormats(
          sheet,
          tableData,
          styleConfig.conditionalFormats,
          startRow,
          startCol
        );
        await context.sync();
      }
    });
  }

  /**
   * 应用条件格式
   */
  private async applyConditionalFormats(
    sheet: Excel.Worksheet,
    tableData: StyledTableData,
    rules: ConditionalFormatRule[],
    startRow: number,
    startCol: number
  ): Promise<void> {
    for (const rule of rules) {
      // 查找列索引
      const colIndex = tableData.columns.findIndex(c => c.name === rule.columnName);
      if (colIndex === -1) continue;

      // 获取列的数据范围（不包括表头）
      const colRange = sheet.getRangeByIndexes(
        startRow,
        startCol - 1 + colIndex,
        tableData.rows.length,
        1
      );

      switch (rule.config.type) {
        case 'colorScale':
          this.applyColorScaleFormat(colRange, rule.config as ColorScaleConfig);
          break;
        case 'dataBar':
          this.applyDataBarFormat(colRange, rule.config as DataBarConfig);
          break;
        case 'iconSet':
          this.applyIconSetFormat(colRange, rule.config as IconSetConfig);
          break;
        case 'cellValue':
          this.applyCellValueFormat(
            colRange,
            rule.config as CellValueConfig,
            tableData.rows,
            colIndex,
            tableData.columns[colIndex].name
          );
          break;
      }
    }

    // 自动应用状态列的颜色
    this.applyStatusColumnColors(sheet, tableData, startRow, startCol);
  }

  /**
   * 应用颜色阶梯条件格式
   * 注意：条件格式 API 在 Excel 2016+ 中可用
   */
  private applyColorScaleFormat(range: Excel.Range, config: ColorScaleConfig): void {
    try {
      // @ts-ignore - conditionalFormats 在较新的 Excel API 中可用
      const conditionalFormat = range.conditionalFormats.add('ColorScale');
      // @ts-ignore
      const colorScale = conditionalFormat.colorScale;

      // @ts-ignore
      colorScale.criteria = {
        minimum: {
          type: 'LowestValue',
          color: config.minColor,
        },
        maximum: {
          type: 'HighestValue',
          color: config.maxColor,
        },
      };

      if (config.midColor) {
        // @ts-ignore
        colorScale.criteria.midpoint = {
          type: 'Percentile',
          formula: '50',
          color: config.midColor,
        };
      }
    } catch (error) {
      console.warn('[ExcelAdapter] 无法应用颜色阶梯条件格式:', error);
    }
  }

  /**
   * 应用数据条条件格式
   */
  private applyDataBarFormat(range: Excel.Range, config: DataBarConfig): void {
    try {
      // @ts-ignore - conditionalFormats 在较新的 Excel API 中可用
      const conditionalFormat = range.conditionalFormats.add('DataBar');
      // @ts-ignore
      const dataBar = conditionalFormat.dataBar;

      // @ts-ignore
      dataBar.barDirection = 'LeftToRight';

      // 设置正值颜色
      // @ts-ignore
      dataBar.positiveFormat.fillColor = config.color;
      // @ts-ignore
      dataBar.positiveFormat.borderColor = config.color;

      // 设置是否显示值
      if (config.showValue === false) {
        // @ts-ignore
        dataBar.showDataBarOnly = true;
      }

      // 设置最小值和最大值
      // @ts-ignore
      dataBar.lowerBoundRule = {
        type: 'LowestValue',
      };
      // @ts-ignore
      dataBar.upperBoundRule = {
        type: 'HighestValue',
      };
    } catch (error) {
      console.warn('[ExcelAdapter] 无法应用数据条条件格式:', error);
    }
  }

  /**
   * 应用图标集条件格式
   */
  private applyIconSetFormat(range: Excel.Range, config: IconSetConfig): void {
    try {
      // @ts-ignore - conditionalFormats 在较新的 Excel API 中可用
      const conditionalFormat = range.conditionalFormats.add('IconSet');
      // @ts-ignore
      const iconSet = conditionalFormat.iconSet;

      // 映射图标类型
      const iconStyleMap: Record<string, string> = {
        arrows: 'ThreeArrows',
        circles: 'ThreeTrafficLights1',
        flags: 'ThreeFlags',
        stars: 'ThreeStars',
        ratings: 'FiveRating',
      };

      // @ts-ignore
      iconSet.style = iconStyleMap[config.iconType] || 'ThreeArrows';

      // 设置条件（三分位）
      // @ts-ignore
      iconSet.criteria = [
        {
          type: 'Percent',
          formula: '67',
        },
        {
          type: 'Percent',
          formula: '33',
        },
        {
          type: 'Percent',
          formula: '0',
        },
      ];
    } catch (error) {
      console.warn('[ExcelAdapter] 无法应用图标集条件格式:', error);
    }
  }

  /**
   * 应用单元格值条件格式
   */
  private applyCellValueFormat(
    _range: Excel.Range,
    _config: CellValueConfig,
    _rows: Record<string, unknown>[],
    _colIndex: number,
    _colName: string
  ): void {
    // 单元格值条件格式在 Excel API 中比较复杂
    // 这里我们使用状态列颜色映射来处理
    // 实际的条件格式将在 applyStatusColumnColors 中应用
  }

  /**
   * 自动应用状态列的颜色
   */
  private applyStatusColumnColors(
    sheet: Excel.Worksheet,
    tableData: StyledTableData,
    startRow: number,
    startCol: number
  ): void {
    // 查找状态类型的列
    tableData.columns.forEach((col, colIndex) => {
      const isStatusColumn =
        col.type === 'text' &&
        (col.name.includes('状态') || col.name.includes('结果') || col.name.includes('进度'));

      if (isStatusColumn) {
        // 遍历每一行，根据值设置颜色
        tableData.rows.forEach((row, rowIndex) => {
          const value = String(row[col.name] || '');
          const colorConfig = STATUS_COLOR_MAP[value];

          if (colorConfig) {
            const cellRange = sheet.getRangeByIndexes(
              startRow + rowIndex,
              startCol - 1 + colIndex,
              1,
              1
            );
            cellRange.format.fill.color = colorConfig.background;
            cellRange.format.font.color = colorConfig.text;
          }
        });
      }
    });
  }

  /**
   * 写入二维数组数据
   */
  async writeData(data: unknown[][], options: WriteTableOptions = {}): Promise<void> {
    await Excel.run(async (context: Excel.RequestContext) => {
      const sheetName = options.sheetName || this.config.defaultSheetName;
      let sheet: Excel.Worksheet;

      const sheets = context.workbook.worksheets;
      sheets.load('items/name');
      await context.sync();

      const sheetExists = sheets.items.some(s => s.name === sheetName);
      if (!sheetExists) {
        sheet = sheets.add(sheetName);
      } else {
        sheet = sheets.getItem(sheetName!);
      }

      sheet.activate();

      const startCell = options.startCell || 'A1';
      const startRow = this.getCellRow(startCell);
      const startCol = this.getCellCol(startCell);

      if (data.length > 0) {
        const range = sheet.getRangeByIndexes(
          startRow - 1,
          startCol - 1,
          data.length,
          data[0].length
        );
        range.values = data;
      }

      if (this.config.autoFitColumns) {
        const usedRange = sheet.getUsedRange();
        usedRange.format.autofitColumns();
      }

      await context.sync();
    });
  }

  /**
   * 读取数据
   */
  async readData(sheetName?: string, range?: string): Promise<unknown[][]> {
    let data: unknown[][] = [];

    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = sheetName
        ? context.workbook.worksheets.getItem(sheetName)
        : context.workbook.worksheets.getActiveWorksheet();

      const targetRange = range ? sheet.getRange(range) : sheet.getUsedRange();

      targetRange.load('values');
      await context.sync();

      data = targetRange.values;
    });

    return data;
  }

  /**
   * 创建图表
   */
  async createChart(
    config: ChartConfig,
    dataRange: string,
    options: CreateChartOptions = {}
  ): Promise<void> {
    await Excel.run(async (context: Excel.RequestContext) => {
      const sheetName = options.sheetName || this.config.defaultSheetName;
      const sheet = context.workbook.worksheets.getItem(sheetName!);

      const chartType = this.mapChartType(config.type);
      const range = sheet.getRange(dataRange);

      const chart = sheet.charts.add(chartType, range, Excel.ChartSeriesBy.auto);

      // 设置标题
      chart.title.text = config.title;

      // 设置位置
      if (options.position) {
        chart.left = options.position.left;
        chart.top = options.position.top;
        chart.width = options.position.width;
        chart.height = options.position.height;
      }

      // 设置图例
      if (config.options?.legend) {
        chart.legend.visible = config.options.legend.display !== false;
        if (config.options.legend.position) {
          chart.legend.position = this.mapLegendPosition(config.options.legend.position);
        }
      }

      await context.sync();
    });
  }

  /**
   * 创建新工作表
   */
  async createSheet(name: string): Promise<void> {
    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = context.workbook.worksheets.add(name);
      sheet.activate();
      await context.sync();
    });
  }

  /**
   * 删除工作表
   */
  async deleteSheet(name: string): Promise<void> {
    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = context.workbook.worksheets.getItem(name);
      sheet.delete();
      await context.sync();
    });
  }

  /**
   * 获取所有工作表名称
   */
  async getSheetNames(): Promise<string[]> {
    const names: string[] = [];

    await Excel.run(async (context: Excel.RequestContext) => {
      const sheets = context.workbook.worksheets;
      sheets.load('items/name');
      await context.sync();

      for (const sheet of sheets.items) {
        names.push(sheet.name);
      }
    });

    return names;
  }

  /**
   * 获取当前工作表名称
   */
  async getActiveSheetName(): Promise<string> {
    let name = '';

    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      sheet.load('name');
      await context.sync();
      name = sheet.name;
    });

    return name;
  }

  /**
   * 清除工作表内容
   */
  async clearSheet(sheetName?: string): Promise<void> {
    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = sheetName
        ? context.workbook.worksheets.getItem(sheetName)
        : context.workbook.worksheets.getActiveWorksheet();

      sheet.getUsedRange().clear();
      await context.sync();
    });
  }

  /**
   * 应用样式到范围
   */
  private applyStyle(range: Excel.Range, style: CellStyle): void {
    if (style.backgroundColor) {
      range.format.fill.color = style.backgroundColor;
    }

    if (style.fontColor) {
      range.format.font.color = style.fontColor;
    }

    if (style.fontSize) {
      range.format.font.size = style.fontSize;
    }

    if (style.fontWeight === 'bold') {
      range.format.font.bold = true;
    }

    if (style.fontStyle === 'italic') {
      range.format.font.italic = true;
    }

    if (style.align) {
      range.format.horizontalAlignment = this.mapHorizontalAlignment(style.align);
    }

    if (style.verticalAlign) {
      range.format.verticalAlignment = this.mapVerticalAlignment(style.verticalAlign);
    }

    if (style.wrapText) {
      range.format.wrapText = true;
    }

    if (style.border) {
      const borderStyle = this.mapBorderStyle(style.border.style);
      range.format.borders.getItem(Excel.BorderIndex.edgeTop).style = borderStyle;
      range.format.borders.getItem(Excel.BorderIndex.edgeBottom).style = borderStyle;
      range.format.borders.getItem(Excel.BorderIndex.edgeLeft).style = borderStyle;
      range.format.borders.getItem(Excel.BorderIndex.edgeRight).style = borderStyle;

      if (style.border.color) {
        range.format.borders.getItem(Excel.BorderIndex.edgeTop).color = style.border.color;
        range.format.borders.getItem(Excel.BorderIndex.edgeBottom).color = style.border.color;
        range.format.borders.getItem(Excel.BorderIndex.edgeLeft).color = style.border.color;
        range.format.borders.getItem(Excel.BorderIndex.edgeRight).color = style.border.color;
      }
    }
  }

  /**
   * 获取单元格行号
   */
  private getCellRow(cell: string): number {
    const match = cell.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  }

  /**
   * 获取单元格列号
   */
  private getCellCol(cell: string): number {
    const match = cell.match(/[A-Z]+/i);
    if (!match) return 1;

    let col = 0;
    for (let i = 0; i < match[0].length; i++) {
      col = col * 26 + (match[0].charCodeAt(i) - 64);
    }
    return col;
  }

  /**
   * 映射图表类型
   */
  private mapChartType(type: string): Excel.ChartType {
    const typeMap: Record<string, Excel.ChartType> = {
      pie: Excel.ChartType.pie,
      bar: Excel.ChartType.columnClustered,
      line: Excel.ChartType.line,
      doughnut: Excel.ChartType.doughnut,
    };
    return typeMap[type] || Excel.ChartType.columnClustered;
  }

  /**
   * 映射图例位置
   */
  private mapLegendPosition(position: string): Excel.ChartLegendPosition {
    const positionMap: Record<string, Excel.ChartLegendPosition> = {
      top: Excel.ChartLegendPosition.top,
      bottom: Excel.ChartLegendPosition.bottom,
      left: Excel.ChartLegendPosition.left,
      right: Excel.ChartLegendPosition.right,
    };
    return positionMap[position] || Excel.ChartLegendPosition.right;
  }

  /**
   * 映射水平对齐
   */
  private mapHorizontalAlignment(align: string): Excel.HorizontalAlignment {
    const alignMap: Record<string, Excel.HorizontalAlignment> = {
      left: Excel.HorizontalAlignment.left,
      center: Excel.HorizontalAlignment.center,
      right: Excel.HorizontalAlignment.right,
    };
    return alignMap[align] || Excel.HorizontalAlignment.general;
  }

  /**
   * 映射垂直对齐
   */
  private mapVerticalAlignment(align: string): Excel.VerticalAlignment {
    const alignMap: Record<string, Excel.VerticalAlignment> = {
      top: Excel.VerticalAlignment.top,
      middle: Excel.VerticalAlignment.center,
      bottom: Excel.VerticalAlignment.bottom,
    };
    return alignMap[align] || Excel.VerticalAlignment.center;
  }

  /**
   * 映射边框样式
   */
  private mapBorderStyle(style?: string): Excel.BorderLineStyle {
    const styleMap: Record<string, Excel.BorderLineStyle> = {
      thin: Excel.BorderLineStyle.thin,
      medium: Excel.BorderLineStyle.medium,
      thick: Excel.BorderLineStyle.thick,
      dashed: Excel.BorderLineStyle.dash,
      dotted: Excel.BorderLineStyle.dot,
    };
    return styleMap[style || 'thin'] || Excel.BorderLineStyle.thin;
  }
  /**
   * 根据列类型获取数字格式
   */
  private getNumberFormatForType(type: ExtendedColumnType, customFormat?: string): string | null {
    if (customFormat) {
      return customFormat;
    }
    switch (type) {
      case 'currency':
        return '¥#,##0.00';
      case 'percentage':
        return '0.00%';
      case 'date':
        return 'yyyy-mm-dd';
      case 'datetime':
        return 'yyyy-mm-dd hh:mm:ss';
      case 'number':
        return 'General'; // Excel会根据数值自动判断
      default:
        return null;
    }
  }

  // ============================================
  // V2 新增功能：智能选区检测
  // ============================================

  /**
   * 智能检测当前选区或表格
   * 优先级：用户选区 > 表格对象 > 已使用范围
   */
  async detectTableRange(): Promise<RangeDetectionResult> {
    let result: RangeDetectionResult = {
      detected: false,
      method: 'none',
    };

    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      // @ts-ignore - getSelectedRange 在 Excel API 中可用
      const selection = context.workbook.getSelectedRange();

      // 加载选区信息
      // @ts-ignore
      selection.load('address, cellCount, rowCount, columnCount');
      sheet.load('name');
      await context.sync();

      // 1. 检查用户是否选择了多个单元格
      // @ts-ignore
      if (selection.cellCount > 1) {
        result = {
          detected: true,
          // @ts-ignore
          address: selection.address,
          method: 'selection',
        };
        return;
      }

      // 2. 检查选区是否在表格内
      try {
        const tables = sheet.tables;
        // @ts-ignore
        tables.load('items');
        await context.sync();

        for (const table of tables.items) {
          // @ts-ignore - getRange 在 Excel API 中可用
          const tableRange = table.getRange();
          tableRange.load('address');
          await context.sync();

          // 检查选区是否与表格相交
          // @ts-ignore
          const intersection = selection.getIntersectionOrNullObject(tableRange);
          intersection.load('isNullObject');
          await context.sync();

          // @ts-ignore
          if (!intersection.isNullObject) {
            result = {
              detected: true,
              address: tableRange.address,
              isTable: true,
              tableName: table.name,
              method: 'table',
            };
            return;
          }
        }
      } catch (e) {
        // 没有表格或其他错误，继续
      }

      // 3. 使用已使用范围作为后备
      try {
        // @ts-ignore - getUsedRangeOrNullObject 在 Excel API 中可用
        const usedRange = sheet.getUsedRangeOrNullObject();
        // @ts-ignore
        usedRange.load('address, isNullObject, cellCount');
        await context.sync();

        // @ts-ignore
        if (!usedRange.isNullObject && usedRange.cellCount > 0) {
          result = {
            detected: true,
            // @ts-ignore
            address: usedRange.address,
            method: 'usedRange',
          };
        }
      } catch (e) {
        // 工作表为空
      }
    });

    return result;
  }

  /**
   * 获取当前选区地址
   */
  async getSelectedRange(): Promise<string | null> {
    let address: string | null = null;

    await Excel.run(async (context: Excel.RequestContext) => {
      // @ts-ignore - getSelectedRange 在 Excel API 中可用
      const selection = context.workbook.getSelectedRange();
      selection.load('address');
      await context.sync();
      address = selection.address;
    });

    return address;
  }

  // ============================================
  // V2 新增功能：表格数据读取
  // ============================================

  /**
   * 读取表格数据（支持选区、表格对象或指定范围）
   */
  async readTableData(
    rangeAddress?: string,
    options: TableReadOptions = {}
  ): Promise<ReadTableData | null> {
    let result: ReadTableData | null = null;

    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      sheet.load('name');

      let targetRange: Excel.Range;

      if (rangeAddress) {
        // 使用指定范围
        targetRange = sheet.getRange(rangeAddress);
      } else {
        // 智能检测
        const detection = await this.detectTableRange();
        if (!detection.detected || !detection.address) {
          return;
        }

        // 提取不带工作表名的地址
        const pureAddress = detection.address.includes('!')
          ? detection.address.split('!')[1]
          : detection.address;
        targetRange = sheet.getRange(pureAddress);
      }

      // 加载范围数据
      // @ts-ignore
      targetRange.load('values, address, rowCount, columnCount');

      // 可选：加载样式信息
      if (options.includeStyles) {
        // @ts-ignore
        targetRange.load('format/fill/color, format/font/color, format/font/bold');
      }

      await context.sync();

      const values = targetRange.values;
      if (!values || values.length === 0) {
        return;
      }

      // 限制最大行数
      const maxRows = options.maxRows || 1000;
      const limitedValues = values.slice(0, maxRows + 1); // +1 for header

      // 第一行作为表头
      const headers = limitedValues[0] as unknown[];
      const dataRows = limitedValues.slice(1);

      // 推断列类型
      const columns = headers.map((header, index) => ({
        name: String(header || `Column${index + 1}`),
        type: this.inferColumnType(dataRows, index),
        index,
      }));

      // 转换数据行
      const rows = dataRows.map(row =>
        columns.reduce(
          (obj, col) => {
            obj[col.name] = row[col.index];
            return obj;
          },
          {} as Record<string, unknown>
        )
      );

      // 提取不带工作表前缀的地址
      let pureAddress = targetRange.address;
      if (pureAddress.includes('!')) {
        pureAddress = pureAddress.split('!')[1];
      }

      result = {
        address: pureAddress,
        sheetName: sheet.name,
        columns,
        rows,
        totalRows: targetRange.rowCount - 1, // 减去表头
        totalColumns: targetRange.columnCount,
      };

      // 检查是否是表格对象
      try {
        const tables = sheet.tables;
        // @ts-ignore
        tables.load('items');
        await context.sync();

        for (const table of tables.items) {
          // @ts-ignore - getRange 在 Excel API 中可用
          const tableRange = table.getRange();
          tableRange.load('address');
          await context.sync();

          if (tableRange.address === targetRange.address) {
            result.tableName = table.name;
            // @ts-ignore
            if (table.style) {
              // @ts-ignore
              result.tableStyleName = table.style;
            }
            break;
          }
        }
      } catch (e) {
        // 忽略表格检测错误
      }
    });

    return result;
  }

  /**
   * 推断列类型
   */
  private inferColumnType(rows: unknown[][], colIndex: number): ExtendedColumnType {
    const sampleSize = Math.min(rows.length, 10);
    let numberCount = 0;
    let dateCount = 0;
    let percentCount = 0;
    let currencyCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      const value = rows[i][colIndex];
      if (value === null || value === undefined || value === '') continue;

      const strValue = String(value);

      // 检查百分比
      if (strValue.includes('%') || (typeof value === 'number' && value >= 0 && value <= 1)) {
        percentCount++;
        continue;
      }

      // 检查货币
      if (strValue.match(/^[¥$€£]/) || strValue.match(/[¥$€£]$/)) {
        currencyCount++;
        continue;
      }

      // 检查数字
      if (typeof value === 'number') {
        numberCount++;
        continue;
      }

      // 检查日期
      if (!isNaN(Date.parse(strValue))) {
        dateCount++;
      }
    }

    const threshold = sampleSize * 0.5;

    if (percentCount >= threshold) return 'percentage';
    if (currencyCount >= threshold) return 'currency';
    if (numberCount >= threshold) return 'number';
    if (dateCount >= threshold) return 'date';

    return 'text';
  }

  /**
   * 更新表格数据（用于撤销/重做）
   */
  async updateTableData(address: string, data: StyledTableData, sheetName?: string): Promise<void> {
    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = sheetName
        ? context.workbook.worksheets.getItem(sheetName)
        : context.workbook.worksheets.getActiveWorksheet();

      // 清除原有范围
      const targetRange = sheet.getRange(address);
      targetRange.clear();
      await context.sync();

      // 写入新数据
      await this.writeStyledTable(data, {
        sheetName: sheetName || undefined,
        startCell: address.split(':')[0], // 取起始单元格
        createTable: !!data.tableName,
        tableName: data.tableName,
      });
    });
  }

  /**
   * 删除表格
   */
  async deleteTable(tableName: string, sheetName?: string): Promise<void> {
    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = sheetName
        ? context.workbook.worksheets.getItem(sheetName)
        : context.workbook.worksheets.getActiveWorksheet();

      const table = sheet.tables.getItem(tableName);
      // @ts-ignore - getRange 在 Excel API 中可用
      const range = table.getRange();
      table.delete();
      range.clear();
      await context.sync();
    });
  }

  /**
   * 获取表格列表
   */
  async getTableList(sheetName?: string): Promise<{ name: string; address: string }[]> {
    const tables: { name: string; address: string }[] = [];

    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = sheetName
        ? context.workbook.worksheets.getItem(sheetName)
        : context.workbook.worksheets.getActiveWorksheet();

      const sheetTables = sheet.tables;
      // @ts-ignore
      sheetTables.load('items');
      await context.sync();

      for (const table of sheetTables.items) {
        // @ts-ignore - getRange 在 Excel API 中可用
        const range = table.getRange();
        range.load('address');
        await context.sync();

        tables.push({
          name: table.name,
          address: range.address,
        });
      }
    });

    return tables;
  }

  // ============================================
  // V2 新增功能：图表操作扩展
  // ============================================

  /**
   * 创建图表（V2 增强版）
   */
  async createChartV2(
    dataRange: string,
    chartType: string,
    options: {
      title?: string;
      sheetName?: string;
      position?: { left: number; top: number; width: number; height: number };
      showLegend?: boolean;
      legendPosition?: 'top' | 'bottom' | 'left' | 'right';
      showDataLabels?: boolean;
    } = {}
  ): Promise<string> {
    let chartName = '';

    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = options.sheetName
        ? context.workbook.worksheets.getItem(options.sheetName)
        : context.workbook.worksheets.getActiveWorksheet();

      const range = sheet.getRange(dataRange);
      const excelChartType = this.mapChartType(chartType);

      const chart = sheet.charts.add(excelChartType, range, Excel.ChartSeriesBy.auto);

      // 设置标题
      if (options.title) {
        chart.title.text = options.title;
        chart.title.visible = true;
      }

      // 设置位置
      if (options.position) {
        chart.left = options.position.left;
        chart.top = options.position.top;
        chart.width = options.position.width;
        chart.height = options.position.height;
      } else {
        // 默认位置：表格右侧
        chart.left = 400;
        chart.top = 10;
        chart.width = 450;
        chart.height = 300;
      }

      // 设置图例
      if (options.showLegend !== false) {
        chart.legend.visible = true;
        if (options.legendPosition) {
          chart.legend.position = this.mapLegendPosition(options.legendPosition);
        }
      } else {
        chart.legend.visible = false;
      }

      // 设置数据标签
      // @ts-ignore - dataLabels 在较新 API 中可用
      if (options.showDataLabels && chart.series) {
        // @ts-ignore
        chart.series.items.forEach(series => {
          // @ts-ignore
          if (series.dataLabels) {
            // @ts-ignore
            series.dataLabels.showValue = true;
          }
        });
      }

      chart.load('name');
      await context.sync();
      chartName = chart.name;
    });

    return chartName;
  }

  /**
   * 获取图表列表
   */
  async getChartList(sheetName?: string): Promise<{ name: string; type: string }[]> {
    const charts: { name: string; type: string }[] = [];

    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = sheetName
        ? context.workbook.worksheets.getItem(sheetName)
        : context.workbook.worksheets.getActiveWorksheet();

      const sheetCharts = sheet.charts;
      // @ts-ignore
      sheetCharts.load('items');
      await context.sync();

      for (const chart of sheetCharts.items) {
        charts.push({
          name: chart.name,
          // @ts-ignore - chartType 在 Excel API 中可用
          type: String(chart.chartType || 'unknown'),
        });
      }
    });

    return charts;
  }

  /**
   * 删除图表
   */
  async deleteChart(chartName: string, sheetName?: string): Promise<void> {
    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = sheetName
        ? context.workbook.worksheets.getItem(sheetName)
        : context.workbook.worksheets.getActiveWorksheet();

      const chart = sheet.charts.getItem(chartName);
      chart.delete();
      await context.sync();
    });
  }

  // ============================================
  // V3 新增功能：智能位置管理
  // ============================================

  /**
   * 查找下一个可用的起始位置（避免与现有数据重叠）
   * 策略：在已使用范围的下方留出2行空白后开始
   */
  async findNextAvailablePosition(sheetName?: string): Promise<string> {
    let nextCell = 'A1';

    await Excel.run(async (context: Excel.RequestContext) => {
      const sheet = sheetName
        ? context.workbook.worksheets.getItem(sheetName)
        : context.workbook.worksheets.getActiveWorksheet();

      // 获取已使用范围
      // @ts-ignore - getUsedRangeOrNullObject 在 Excel API 中可用
      const usedRange = sheet.getUsedRangeOrNullObject();
      // @ts-ignore
      usedRange.load('rowCount, isNullObject, address');
      await context.sync();

      // @ts-ignore
      if (!usedRange.isNullObject && usedRange.rowCount > 0) {
        // 在已使用范围下方留2行空白
        // @ts-ignore
        const nextRow = usedRange.rowCount + 3;
        nextCell = `A${nextRow}`;
      }
    });

    return nextCell;
  }

  /**
   * 获取用户当前选中的单元格地址（用于手动选择位置）
   */
  async getSelectedCellAddress(): Promise<string> {
    let address = 'A1';

    await Excel.run(async (context: Excel.RequestContext) => {
      // @ts-ignore - getSelectedRange 在 Excel API 中可用
      const selection = context.workbook.getSelectedRange();
      selection.load('address');
      await context.sync();

      // 提取地址（可能包含工作表名前缀）
      let rawAddress = selection.address;
      if (rawAddress.includes('!')) {
        rawAddress = rawAddress.split('!')[1];
      }

      // 如果选择了多个单元格，只取左上角
      if (rawAddress.includes(':')) {
        rawAddress = rawAddress.split(':')[0];
      }

      address = rawAddress;
    });

    return address;
  }

  /**
   * 创建新工作表
   * @param name 可选的工作表名称，不提供则自动生成
   * @returns 新创建的工作表名称
   */
  async createNewSheetForTable(name?: string): Promise<string> {
    let sheetName = '';

    await Excel.run(async (context: Excel.RequestContext) => {
      const sheets = context.workbook.worksheets;
      sheets.load('items/name');
      await context.sync();

      // 如果提供了名称，检查是否已存在
      if (name) {
        const existingNames = sheets.items.map(s => s.name);
        if (existingNames.includes(name)) {
          // 添加数字后缀避免冲突
          let suffix = 1;
          while (existingNames.includes(`${name}${suffix}`)) {
            suffix++;
          }
          sheetName = `${name}${suffix}`;
        } else {
          sheetName = name;
        }
      } else {
        // 自动生成名称：Table_时间戳
        sheetName = `Table_${Date.now()}`;
      }

      // 创建新工作表
      const newSheet = sheets.add(sheetName);
      newSheet.activate();
      await context.sync();
    });

    return sheetName;
  }

  /**
   * 根据位置配置确定最终的写入位置
   */
  async resolveInsertPosition(config: {
    mode: 'auto' | 'manual' | 'newSheet';
    manualAddress?: string;
    newSheetName?: string;
  }): Promise<{ sheetName?: string; startCell: string }> {
    switch (config.mode) {
      case 'auto':
        // 智能检测当前工作表的可用位置
        const nextCell = await this.findNextAvailablePosition();
        return { startCell: nextCell };

      case 'manual':
        // 使用指定的地址，或获取当前选中的单元格
        if (config.manualAddress) {
          return { startCell: config.manualAddress };
        }
        const selectedCell = await this.getSelectedCellAddress();
        return { startCell: selectedCell };

      case 'newSheet':
        // 创建新工作表，从 A1 开始
        const newSheetName = await this.createNewSheetForTable(config.newSheetName);
        return { sheetName: newSheetName, startCell: 'A1' };

      default:
        return { startCell: 'A1' };
    }
  }
}

/**
 * 默认Excel适配器实例
 */
export const excelAdapter = new ExcelAdapter();
