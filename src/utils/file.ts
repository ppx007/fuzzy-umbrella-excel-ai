/**
 * 文件处理工具函数
 */

/**
 * 读取文件为文本
 */
export function readFileAsText(file: File, encoding: string = 'UTF-8'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file, encoding);
  });
}

/**
 * 读取文件为ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 读取文件为DataURL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * 获取文件名（不含扩展名）
 */
export function getFileNameWithoutExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
}

/**
 * 检查文件类型
 */
export function isFileType(file: File, types: string[]): boolean {
  const ext = getFileExtension(file.name);
  return types.map(t => t.toLowerCase().replace('.', '')).includes(ext);
}

/**
 * 检查是否为CSV文件
 */
export function isCSVFile(file: File): boolean {
  return isFileType(file, ['csv']);
}

/**
 * 检查是否为Excel文件
 */
export function isExcelFile(file: File): boolean {
  return isFileType(file, ['xlsx', 'xls']);
}

/**
 * 下载文件
 */
export function downloadFile(content: Blob | string, filename: string, mimeType?: string): void {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' })
    : content;
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 下载JSON文件
 */
export function downloadJSON(data: unknown, filename: string): void {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, filename, 'application/json');
}

/**
 * 下载CSV文件
 */
export function downloadCSV(data: string[][], filename: string): void {
  const content = data.map(row => 
    row.map(cell => {
      // 如果单元格包含逗号、引号或换行符，需要用引号包裹
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')
  ).join('\n');
  
  // 添加BOM以支持Excel正确识别UTF-8
  const bom = '\uFEFF';
  downloadFile(bom + content, filename, 'text/csv;charset=utf-8');
}

/**
 * 解析CSV内容
 */
export function parseCSV(content: string, delimiter: string = ','): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // 转义的引号
          currentCell += '"';
          i++;
        } else {
          // 结束引号
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentCell);
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentCell += char;
      }
    }
  }
  
  // 处理最后一行
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }
  
  return rows;
}

/**
 * 生成CSV内容
 */
export function generateCSV(data: unknown[][], headers?: string[]): string {
  const rows: string[][] = [];
  
  if (headers) {
    rows.push(headers);
  }
  
  for (const row of data) {
    rows.push(row.map(cell => {
      if (cell === null || cell === undefined) return '';
      return String(cell);
    }));
  }
  
  return rows.map(row => 
    row.map(cell => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  ).join('\n');
}

/**
 * 创建文件选择器
 */
export function createFileInput(
  accept: string,
  multiple: boolean = false
): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    
    input.onchange = () => {
      resolve(input.files);
    };
    
    input.oncancel = () => {
      resolve(null);
    };
    
    input.click();
  });
}

/**
 * 选择CSV文件
 */
export function selectCSVFile(): Promise<File | null> {
  return createFileInput('.csv').then(files => files?.[0] || null);
}

/**
 * 选择Excel文件
 */
export function selectExcelFile(): Promise<File | null> {
  return createFileInput('.xlsx,.xls').then(files => files?.[0] || null);
}

/**
 * 选择考勤数据文件
 */
export function selectAttendanceFile(): Promise<File | null> {
  return createFileInput('.csv,.xlsx,.xls').then(files => files?.[0] || null);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * 检测文件编码
 */
export function detectEncoding(buffer: ArrayBuffer): string {
  const arr = new Uint8Array(buffer);
  
  // 检测BOM
  if (arr[0] === 0xEF && arr[1] === 0xBB && arr[2] === 0xBF) {
    return 'UTF-8';
  }
  if (arr[0] === 0xFF && arr[1] === 0xFE) {
    return 'UTF-16LE';
  }
  if (arr[0] === 0xFE && arr[1] === 0xFF) {
    return 'UTF-16BE';
  }
  
  // 默认返回UTF-8
  return 'UTF-8';
}

/**
 * 将ArrayBuffer转换为字符串
 */
export function arrayBufferToString(buffer: ArrayBuffer, encoding: string = 'UTF-8'): string {
  const decoder = new TextDecoder(encoding);
  return decoder.decode(buffer);
}

/**
 * 将字符串转换为ArrayBuffer
 */
export function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}