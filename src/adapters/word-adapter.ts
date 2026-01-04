/**
 * Word适配器
 * 封装Office.js Word API
 */

import { CellStyle } from '@/types';
import { RenderResult } from '@/core/template';

/**
 * Word适配器配置
 */
export interface WordAdapterConfig {
  /** 默认字体 */
  defaultFont?: string;
  /** 默认字号 */
  defaultFontSize?: number;
}

/**
 * 文档写入选项
 */
export interface WriteDocumentOptions {
  /** 插入位置 */
  insertLocation?: 'start' | 'end' | 'replace';
  /** 是否添加分页符 */
  addPageBreak?: boolean;
}

/**
 * Word表格写入选项
 */
export interface WordTableOptions {
  /** 插入位置 */
  insertLocation?: 'start' | 'end';
  /** 是否应用样式 */
  applyStyles?: boolean;
  /** 表格标题 */
  title?: string;
}

/**
 * Word适配器类
 */
export class WordAdapter {
  private defaultFont: string;
  private defaultFontSize: number;

  constructor(config: WordAdapterConfig = {}) {
    this.defaultFont = config.defaultFont || '微软雅黑';
    this.defaultFontSize = config.defaultFontSize || 11;
  }

  /**
   * 检查Word是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      return (
        typeof Office !== 'undefined' &&
        typeof Word !== 'undefined' &&
        Office.context?.host === Office.HostType.Word
      );
    } catch {
      return false;
    }
  }

  /**
   * 写入渲染结果到Word
   */
  async writeRenderResult(result: RenderResult, options: WordTableOptions = {}): Promise<void> {
    await Word.run(async (context: Word.RequestContext) => {
      const body = context.document.body;

      // 插入标题
      if (options.title) {
        const titlePara = body.insertParagraph(
          options.title,
          this.mapInsertLocation(options.insertLocation || 'end')
        );
        titlePara.font.size = 16;
        titlePara.font.bold = true;
        titlePara.paragraphFormat.alignment = Word.Alignment.centered;
      }

      // 计算表格尺寸
      const rowCount = result.headers.length + result.rows.length;
      const colCount =
        result.rows[0]?.length || result.headers[result.headers.length - 1]?.length || 1;

      // 创建表格
      const table = body.insertTable(
        rowCount,
        colCount,
        this.mapInsertLocation(options.insertLocation || 'end')
      );

      // 填充表头
      let rowIndex = 0;
      for (const headerRow of result.headers) {
        for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
          const cell = table.rows.items[rowIndex].cells.items[colIndex];
          cell.value = String(headerRow[colIndex] || '');

          // 应用表头样式
          if (options.applyStyles !== false && result.styles.has('header')) {
            this.applyCellStyle(cell, result.styles.get('header')!);
          }
        }
        rowIndex++;
      }

      // 填充数据行
      for (const dataRow of result.rows) {
        for (let colIndex = 0; colIndex < dataRow.length; colIndex++) {
          const cell = table.rows.items[rowIndex].cells.items[colIndex];
          cell.value = String(dataRow[colIndex] ?? '');

          // 应用数据样式
          if (options.applyStyles !== false && result.styles.has('body')) {
            this.applyCellStyle(cell, result.styles.get('body')!);
          }
        }
        rowIndex++;
      }

      await context.sync();
    });
  }

  /**
   * 写入表格数据
   */
  async writeTable(data: string[][], options: WordTableOptions = {}): Promise<void> {
    await Word.run(async (context: Word.RequestContext) => {
      const body = context.document.body;

      // 插入标题
      if (options.title) {
        const titlePara = body.insertParagraph(
          options.title,
          this.mapInsertLocation(options.insertLocation || 'end')
        );
        titlePara.font.size = 16;
        titlePara.font.bold = true;
        titlePara.paragraphFormat.alignment = Word.Alignment.centered;
      }

      if (data.length === 0) {
        await context.sync();
        return;
      }

      const rowCount = data.length;
      const colCount = data[0].length;

      // 创建表格
      const table = body.insertTable(
        rowCount,
        colCount,
        this.mapInsertLocation(options.insertLocation || 'end'),
        data
      );

      // 设置第一行为表头
      table.headerRowCount = 1;

      await context.sync();
    });
  }

  /**
   * 写入文本
   */
  async writeText(text: string, options: WriteDocumentOptions = {}): Promise<void> {
    await Word.run(async (context: Word.RequestContext) => {
      const body = context.document.body;

      body.insertText(text, this.mapInsertLocation(options.insertLocation || 'end'));

      await context.sync();
    });
  }

  /**
   * 写入段落
   */
  async writeParagraph(
    text: string,
    options: WriteDocumentOptions & {
      fontSize?: number;
      bold?: boolean;
      italic?: boolean;
      alignment?: 'left' | 'center' | 'right';
    } = {}
  ): Promise<void> {
    await Word.run(async (context: Word.RequestContext) => {
      const body = context.document.body;

      const paragraph = body.insertParagraph(
        text,
        this.mapInsertLocation(options.insertLocation || 'end')
      );

      if (options.fontSize) {
        paragraph.font.size = options.fontSize;
      }

      if (options.bold) {
        paragraph.font.bold = true;
      }

      if (options.italic) {
        paragraph.font.italic = true;
      }

      if (options.alignment) {
        paragraph.paragraphFormat.alignment = this.mapAlignment(options.alignment);
      }

      await context.sync();
    });
  }

  /**
   * 插入分页符
   */
  async insertPageBreak(): Promise<void> {
    await Word.run(async (context: Word.RequestContext) => {
      const body = context.document.body;
      const paragraph = body.insertParagraph('', Word.InsertLocation.end);
      paragraph.insertBreak(Word.BreakType.page, Word.InsertLocation.after);
      await context.sync();
    });
  }

  /**
   * 获取文档文本
   */
  async getDocumentText(): Promise<string> {
    let text = '';

    await Word.run(async (context: Word.RequestContext) => {
      const body = context.document.body;
      body.load('text');
      await context.sync();
      text = body.text;
    });

    return text;
  }

  /**
   * 清除文档内容
   */
  async clearDocument(): Promise<void> {
    await Word.run(async (context: Word.RequestContext) => {
      const body = context.document.body;
      body.clear();
      await context.sync();
    });
  }

  /**
   * 保存文档
   */
  async saveDocument(): Promise<void> {
    await Word.run(async (context: Word.RequestContext) => {
      context.document.save();
      await context.sync();
    });
  }

  /**
   * 获取默认字体
   */
  getDefaultFont(): string {
    return this.defaultFont;
  }

  /**
   * 获取默认字号
   */
  getDefaultFontSize(): number {
    return this.defaultFontSize;
  }

  /**
   * 应用单元格样式
   */
  private applyCellStyle(cell: Word.TableCell, style: CellStyle): void {
    if (style.fontColor) {
      cell.body.font.color = style.fontColor;
    }

    if (style.fontSize) {
      cell.body.font.size = style.fontSize;
    }

    if (style.fontWeight === 'bold') {
      cell.body.font.bold = true;
    }

    if (style.fontStyle === 'italic') {
      cell.body.font.italic = true;
    }
  }

  /**
   * 映射插入位置
   */
  private mapInsertLocation(location: string): Word.InsertLocation {
    const locationMap: Record<string, Word.InsertLocation> = {
      start: Word.InsertLocation.start,
      end: Word.InsertLocation.end,
      replace: Word.InsertLocation.replace,
    };
    return locationMap[location] || Word.InsertLocation.end;
  }

  /**
   * 映射对齐方式
   */
  private mapAlignment(alignment: string): Word.Alignment {
    const alignmentMap: Record<string, Word.Alignment> = {
      left: Word.Alignment.left,
      center: Word.Alignment.centered,
      right: Word.Alignment.right,
    };
    return alignmentMap[alignment] || Word.Alignment.left;
  }
}

/**
 * 默认Word适配器实例
 */
export const wordAdapter = new WordAdapter();
