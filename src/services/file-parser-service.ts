/**
 * 文件解析服务
 * 支持 CSV, JSON, Excel (.xlsx) 文件的解析
 */

import type { GenericTableColumn, ExtendedColumnType } from '@/types/common';

/**
 * 解析后的文件数据
 */
export interface ParsedFileData {
  /** 文件名 */
  fileName: string;
  /** 文件类型 */
  fileType: 'csv' | 'json' | 'xlsx' | 'unknown';
  /** 列定义 */
  columns: GenericTableColumn[];
  /** 数据行 */
  rows: Record<string, unknown>[];
  /** 原始文本预览（前1000字符） */
  preview: string;
  /** 总行数 */
  totalRows: number;
  /** 解析警告 */
  warnings?: string[];
}

/**
 * 上传的文件信息
 */
export interface UploadedFile {
  /** 文件对象 */
  file: File;
  /** 文件名 */
  name: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件类型 */
  type: string;
  /** 解析后的数据 */
  parsedData?: ParsedFileData;
  /** 解析状态 */
  status: 'pending' | 'parsing' | 'success' | 'error';
  /** 错误信息 */
  error?: string;
}

/**
 * 文件解析服务类
 */
class FileParserService {
  /** 最大文件大小（5MB） */
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  /** 最大行数限制 */
  private readonly MAX_ROWS = 1000;
  /** 支持的文件类型 */
  private readonly SUPPORTED_TYPES = ['.csv', '.json', '.xlsx', '.xls'];

  /**
   * 从标题生成键名
   */
  private generateKeyFromTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50);
  }

  /**
   * 验证文件
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // 检查文件大小
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `文件过大，最大支持 ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // 检查文件类型
    const ext = this.getFileExtension(file.name);
    if (!this.SUPPORTED_TYPES.includes(ext)) {
      return {
        valid: false,
        error: `不支持的文件类型。支持: ${this.SUPPORTED_TYPES.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.slice(lastDot).toLowerCase() : '';
  }

  /**
   * 解析文件
   */
  async parseFile(file: File): Promise<ParsedFileData> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const ext = this.getFileExtension(file.name);

    switch (ext) {
      case '.csv':
        return this.parseCSV(file);
      case '.json':
        return this.parseJSON(file);
      case '.xlsx':
      case '.xls':
        return this.parseExcel(file);
      default:
        throw new Error(`不支持的文件类型: ${ext}`);
    }
  }

  /**
   * 解析 CSV 文件
   */
  private async parseCSV(file: File): Promise<ParsedFileData> {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const warnings: string[] = [];

    if (lines.length === 0) {
      throw new Error('CSV 文件为空');
    }

    // 检测分隔符
    const delimiter = this.detectCSVDelimiter(lines[0]);

    // 解析表头
    const headers = this.parseCSVLine(lines[0], delimiter);
    if (headers.length === 0) {
      throw new Error('无法解析 CSV 表头');
    }

    // 解析数据行
    const rows: Record<string, unknown>[] = [];
    for (let i = 1; i < Math.min(lines.length, this.MAX_ROWS + 1); i++) {
      const values = this.parseCSVLine(lines[i], delimiter);
      const row: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] ?? '';
      });
      rows.push(row);
    }

    if (lines.length > this.MAX_ROWS + 1) {
      warnings.push(`文件包含 ${lines.length - 1} 行数据，仅解析前 ${this.MAX_ROWS} 行`);
    }

    // 推断列类型
    const columns = this.inferColumns(headers, rows);

    return {
      fileName: file.name,
      fileType: 'csv',
      columns,
      rows,
      preview: text.slice(0, 1000),
      totalRows: rows.length,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * 检测 CSV 分隔符
   */
  private detectCSVDelimiter(firstLine: string): string {
    const delimiters = [',', ';', '\t', '|'];
    let maxCount = 0;
    let detected = ',';

    for (const d of delimiters) {
      const count = (firstLine.match(new RegExp(d === '|' ? '\\|' : d, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        detected = d;
      }
    }

    return detected;
  }

  /**
   * 解析 CSV 行（处理引号）
   */
  private parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === delimiter) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    result.push(current.trim());

    return result;
  }

  /**
   * 解析 JSON 文件
   */
  private async parseJSON(file: File): Promise<ParsedFileData> {
    const text = await file.text();
    const warnings: string[] = [];

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('JSON 格式无效');
    }

    // 支持数组或带 data 属性的对象
    let rows: Record<string, unknown>[];
    if (Array.isArray(data)) {
      rows = data.filter(item => item && typeof item === 'object') as Record<string, unknown>[];
    } else if (
      data &&
      typeof data === 'object' &&
      'data' in data &&
      Array.isArray((data as { data: unknown }).data)
    ) {
      rows = (data as { data: unknown[] }).data.filter(
        item => item && typeof item === 'object'
      ) as Record<string, unknown>[];
    } else if (data && typeof data === 'object') {
      // 单个对象转为数组
      rows = [data as Record<string, unknown>];
    } else {
      throw new Error('JSON 数据格式不支持，需要数组或对象');
    }

    if (rows.length === 0) {
      throw new Error('JSON 数据为空');
    }

    // 限制行数
    if (rows.length > this.MAX_ROWS) {
      warnings.push(`JSON 包含 ${rows.length} 条数据，仅解析前 ${this.MAX_ROWS} 条`);
      rows = rows.slice(0, this.MAX_ROWS);
    }

    // 提取所有列名
    const headerSet = new Set<string>();
    rows.forEach(row => {
      Object.keys(row).forEach(key => headerSet.add(key));
    });
    const headers = Array.from(headerSet);

    // 推断列类型
    const columns = this.inferColumns(headers, rows);

    return {
      fileName: file.name,
      fileType: 'json',
      columns,
      rows,
      preview: text.slice(0, 1000),
      totalRows: rows.length,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * 解析 Excel 文件
   * 注意：这里使用简化的方式，在浏览器环境中需要 SheetJS 库
   */
  private async parseExcel(file: File): Promise<ParsedFileData> {
    // 动态导入 SheetJS（如果可用）
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const XLSX = await import('xlsx');

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      // 获取第一个工作表
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // 转换为 JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error('Excel 文件为空或格式不正确');
      }

      const rows = jsonData.slice(0, this.MAX_ROWS) as Record<string, unknown>[];
      const warnings: string[] = [];

      if (jsonData.length > this.MAX_ROWS) {
        warnings.push(`Excel 包含 ${jsonData.length} 行数据，仅解析前 ${this.MAX_ROWS} 行`);
      }

      // 提取列名
      const headers = Object.keys(rows[0] || {});
      const columns = this.inferColumns(headers, rows);

      return {
        fileName: file.name,
        fileType: 'xlsx',
        columns,
        rows,
        preview: `[Excel 文件] 工作表: ${firstSheetName}, ${rows.length} 行, ${columns.length} 列`,
        totalRows: rows.length,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (err) {
      // 如果 SheetJS 不可用，提供提示
      console.error('[FileParserService] 解析 Excel 失败:', err);
      throw new Error('暂不支持 Excel 文件解析，请转换为 CSV 或 JSON 格式后上传');
    }
  }

  /**
   * 推断列类型
   */
  private inferColumns(headers: string[], rows: Record<string, unknown>[]): GenericTableColumn[] {
    return headers.map(header => {
      const values = rows
        .map(row => row[header])
        .filter(v => v !== '' && v !== null && v !== undefined);
      const type = this.inferColumnType(header, values);
      return {
        key: this.generateKeyFromTitle(header),
        title: header,
        type,
      } as GenericTableColumn;
    });
  }

  /**
   * 推断单列类型
   */
  private inferColumnType(header: string, values: unknown[]): ExtendedColumnType {
    if (values.length === 0) return 'text';

    const headerLower = header.toLowerCase();

    // 基于列名推断
    if (/日期|date|时间|time/.test(headerLower)) {
      if (/时间|time/.test(headerLower) && !/日期|date/.test(headerLower)) {
        return 'time';
      }
      return 'date';
    }
    if (/金额|价格|费用|cost|price|amount|salary|工资/.test(headerLower)) {
      return 'currency';
    }
    if (/百分比|比例|percent|rate|ratio/.test(headerLower)) {
      return 'percentage';
    }
    if (/邮箱|email/.test(headerLower)) {
      return 'email';
    }
    if (/电话|手机|phone|mobile|tel/.test(headerLower)) {
      return 'phone';
    }
    if (/网址|链接|url|link|website/.test(headerLower)) {
      return 'url';
    }

    // 基于值类型推断
    const sampleValues = values.slice(0, 10);

    // 检查是否全是数字
    const allNumbers = sampleValues.every(v => {
      if (typeof v === 'number') return true;
      if (typeof v === 'string') {
        const cleaned = v.replace(/[,，￥$%]/g, '');
        return !isNaN(Number(cleaned)) && cleaned.trim() !== '';
      }
      return false;
    });
    if (allNumbers) return 'number';

    // 检查是否是日期格式
    const allDates = sampleValues.every(v => {
      if (typeof v !== 'string') return false;
      return /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(v) || /^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(v);
    });
    if (allDates) return 'date';

    // 检查是否是布尔值
    const allBooleans = sampleValues.every(v => {
      if (typeof v === 'boolean') return true;
      if (typeof v === 'string') {
        return ['是', '否', 'true', 'false', 'yes', 'no', '1', '0'].includes(v.toLowerCase());
      }
      return false;
    });
    if (allBooleans) return 'boolean';

    return 'text';
  }

  /**
   * 将解析的数据转换为文本描述（用于 AI 提示词）
   */
  formatForAIPrompt(data: ParsedFileData, maxRows = 10): string {
    const lines: string[] = [];

    lines.push(`文件名: ${data.fileName}`);
    lines.push(`数据类型: ${data.fileType.toUpperCase()}`);
    lines.push(`总行数: ${data.totalRows}`);
    lines.push(`列信息:`);

    data.columns.forEach(col => {
      lines.push(`  - ${col.title} (${col.type})`);
    });

    lines.push('');
    lines.push(`数据预览 (前${Math.min(maxRows, data.rows.length)}行):`);

    // 表头
    const headers = data.columns.map(c => c.title);
    lines.push('| ' + headers.join(' | ') + ' |');
    lines.push('| ' + headers.map(() => '---').join(' | ') + ' |');

    // 数据行
    data.rows.slice(0, maxRows).forEach(row => {
      const values = headers.map(h => String(row[h] ?? ''));
      lines.push('| ' + values.join(' | ') + ' |');
    });

    if (data.rows.length > maxRows) {
      lines.push(`... 还有 ${data.rows.length - maxRows} 行数据`);
    }

    return lines.join('\n');
  }
}

export const fileParserService = new FileParserService();
export default fileParserService;
