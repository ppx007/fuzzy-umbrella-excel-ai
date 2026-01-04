# 开发指南

## 1. 开发环境搭建

### 1.1 前置要求

- **Node.js**: v18.0.0 或更高版本
- **npm**: v9.0.0 或更高版本（或使用 pnpm/yarn）
- **Microsoft Office**: Office 2016 或更高版本（用于测试）
- **VS Code**: 推荐使用，并安装以下扩展：
  - ESLint
  - Prettier
  - TypeScript Vue Plugin
  - Office Add-in Debugger

### 1.2 项目初始化

```bash
# 克隆项目
git clone <repository-url>
cd attendance-office-addin

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 启动开发服务器
npm run dev
```

### 1.3 Office Add-in 开发证书

Office Add-in 需要 HTTPS，首次开发需要安装开发证书：

```bash
# 安装 office-addin-dev-certs
npm install -g office-addin-dev-certs

# 生成并安装证书
npx office-addin-dev-certs install
```

### 1.4 在 Office 中加载插件

#### Excel 桌面版
```bash
# 自动打开 Excel 并加载插件
npm run start:excel
```

#### Word 桌面版
```bash
# 自动打开 Word 并加载插件
npm run start:word
```

#### 手动加载
1. 打开 Excel/Word
2. 插入 → 我的加载项 → 上传我的加载项
3. 选择项目根目录下的 `manifest.xml`

---

## 2. 项目脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "start:excel": "office-addin-debugging start manifest.xml excel",
    "start:word": "office-addin-debugging start manifest.xml word",
    "stop": "office-addin-debugging stop manifest.xml",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx,css}",
    "type-check": "tsc --noEmit",
    "validate": "npm run lint && npm run type-check && npm run test"
  }
}
```

---

## 3. 代码规范

### 3.1 目录命名
- 使用 **kebab-case**（小写字母，连字符分隔）
- 例如：`input-panel/`, `excel-adapter/`

### 3.2 文件命名
- React 组件：**PascalCase** + `.tsx`
  - 例如：`InputPanel.tsx`, `AttendanceTable.tsx`
- 工具/服务：**camelCase** + `.ts`
  - 例如：`dateUtils.ts`, `importService.ts`
- 类型定义：**camelCase** + `.ts`
  - 例如：`attendance.ts`, `template.ts`
- 样式文件：与组件同名 + `.styles.ts` 或 `.css`
  - 例如：`InputPanel.styles.ts`

### 3.3 代码风格

#### TypeScript
```typescript
// 使用 interface 定义对象类型
interface Employee {
  id: string;
  name: string;
  department?: string;
}

// 使用 type 定义联合类型或工具类型
type AttendanceStatus = 'present' | 'absent' | 'late';

// 使用 enum 定义枚举（需要运行时值时）
enum TemplateType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

// 函数使用明确的返回类型
function calculateWorkHours(checkIn: Date, checkOut: Date): number {
  // ...
}

// 异步函数
async function fetchData(): Promise<AttendanceRecord[]> {
  // ...
}
```

#### React 组件
```tsx
// 函数组件 + TypeScript
interface InputPanelProps {
  onSubmit: (input: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  onSubmit,
  placeholder = '请输入...',
  disabled = false,
}) => {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      onSubmit(value);
      setValue('');
    }
  }, [value, onSubmit]);

  return (
    <div className="input-panel">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button onClick={handleSubmit} disabled={disabled}>
        生成
      </button>
    </div>
  );
};
```

### 3.4 注释规范

```typescript
/**
 * 计算员工的出勤统计数据
 * 
 * @param records - 考勤记录列表
 * @param dateRange - 统计日期范围
 * @returns 员工统计数据
 * 
 * @example
 * ```ts
 * const stats = calculateStatistics(records, { start: new Date(), end: new Date() });
 * console.log(stats.attendanceRate);
 * ```
 */
function calculateStatistics(
  records: AttendanceRecord[],
  dateRange: DateRange
): EmployeeStatistics {
  // 实现...
}

// 单行注释用于解释复杂逻辑
// 计算工作日数量（排除周末和节假日）
const workDays = calculateWorkDays(dateRange);
```

---

## 4. 核心模块开发指南

### 4.1 NLP 模块开发

#### 添加新的意图规则

```typescript
// src/core/nlp/rules/intents.ts

export const intentRules: IntentRule[] = [
  // 现有规则...
  
  // 添加新规则
  {
    id: 'create_quarterly',
    patterns: [
      /季度考勤/,
      /季报/,
      /(第[一二三四]|[1-4])季度/,
    ],
    keywords: ['季度', '季报', 'Q1', 'Q2', 'Q3', 'Q4'],
    intent: AttendanceIntent.CREATE_QUARTERLY,
    priority: 10,
    confidenceBoost: 0.2,
  },
];
```

#### 添加新的实体提取规则

```typescript
// src/core/nlp/rules/entities.ts

export const entityRules: EntityRule[] = [
  // 现有规则...
  
  // 添加部门提取规则
  {
    id: 'department',
    type: EntityType.DEPARTMENT,
    patterns: [
      /(\S+)部门/,
      /(\S+)组/,
      /(\S+)团队/,
    ],
    extractor: (match) => match[1],
    validator: (value) => value.length > 0 && value.length < 20,
    normalizer: (value) => value.trim(),
  },
];
```

### 4.2 模板模块开发

#### 创建新模板

```typescript
// src/core/templates/presets/quarterly.ts

import { AttendanceTemplate, TemplateType } from '@/types/template';

export const quarterlyTemplate: AttendanceTemplate = {
  id: 'quarterly_standard',
  name: '季度考勤表',
  type: TemplateType.QUARTERLY,
  description: '按季度统计的考勤汇总表',
  isPreset: true,
  
  structure: {
    headers: [
      { key: 'name', title: '姓名', type: ColumnType.EMPLOYEE_NAME, width: 80 },
      { key: 'month1', title: '第一月', type: ColumnType.STATISTIC, width: 60 },
      { key: 'month2', title: '第二月', type: ColumnType.STATISTIC, width: 60 },
      { key: 'month3', title: '第三月', type: ColumnType.STATISTIC, width: 60 },
      { key: 'total', title: '合计', type: ColumnType.STATISTIC, width: 60 },
      { key: 'rate', title: '出勤率', type: ColumnType.STATISTIC, width: 70 },
    ],
    rows: {
      type: 'employee',
      height: 25,
      striped: true,
      dataMapping: [
        { columnKey: 'name', field: 'employee.name' },
        { columnKey: 'month1', field: 'statistics.month1' },
        { columnKey: 'month2', field: 'statistics.month2' },
        { columnKey: 'month3', field: 'statistics.month3' },
        { columnKey: 'total', field: 'statistics.total' },
        { columnKey: 'rate', field: 'statistics.rate', transform: 'percentage' },
      ],
    },
    layout: {
      startRow: 1,
      startColumn: 1,
      headerRows: 1,
      freezeHeader: true,
      freezeColumns: 1,
    },
  },
  
  styles: {
    headerStyle: {
      font: { bold: true, size: 11 },
      fill: { type: 'solid', color: '#4472C4' },
      alignment: { horizontal: 'center', vertical: 'middle' },
    },
    dataStyle: {
      font: { size: 10 },
      alignment: { horizontal: 'center', vertical: 'middle' },
    },
  },
  
  metadata: {
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};
```

### 4.3 Office 适配器开发

#### Excel 适配器扩展

```typescript
// src/adapters/excel-adapter.ts

export class ExcelAdapter implements OfficeAdapter {
  // 现有方法...
  
  /**
   * 创建数据透视表
   */
  async createPivotTable(config: PivotTableConfig): Promise<void> {
    return Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const sourceRange = sheet.getRange(config.sourceRange);
      
      // 创建新工作表用于透视表
      const pivotSheet = context.workbook.worksheets.add('透视表');
      
      // 创建透视表
      const pivotTable = pivotSheet.pivotTables.add(
        'AttendancePivot',
        sourceRange,
        pivotSheet.getRange('A3')
      );
      
      // 配置行字段
      config.rowFields.forEach(field => {
        pivotTable.rowHierarchies.add(pivotTable.hierarchies.getItem(field));
      });
      
      // 配置值字段
      config.valueFields.forEach(field => {
        const dataField = pivotTable.dataHierarchies.add(
          pivotTable.hierarchies.getItem(field.name)
        );
        dataField.summarizeBy = field.summarizeBy;
      });
      
      await context.sync();
    });
  }
  
  /**
   * 添加数据验证
   */
  async addDataValidation(
    range: string,
    validation: DataValidationConfig
  ): Promise<void> {
    return Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const targetRange = sheet.getRange(range);
      
      targetRange.dataValidation.rule = {
        list: {
          inCellDropDown: true,
          source: validation.options.join(','),
        },
      };
      
      if (validation.errorMessage) {
        targetRange.dataValidation.errorAlert = {
          showAlert: true,
          style: 'Stop',
          message: validation.errorMessage,
        };
      }
      
      await context.sync();
    });
  }
}
```

### 4.4 服务层开发

#### 导入服务扩展

```typescript
// src/services/import-service.ts

export class ImportService {
  // 现有方法...
  
  /**
   * 智能列映射
   * 根据列名自动推断映射关系
   */
  autoMapColumns(headers: string[]): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];
    
    const fieldPatterns: Record<string, RegExp[]> = {
      'employee.name': [/姓名/, /员工/, /name/i],
      'date': [/日期/, /date/i, /时间/],
      'checkIn': [/上班/, /签到/, /check.?in/i],
      'checkOut': [/下班/, /签退/, /check.?out/i],
      'status': [/状态/, /status/i],
      'notes': [/备注/, /说明/, /note/i, /remark/i],
    };
    
    headers.forEach((header, index) => {
      for (const [field, patterns] of Object.entries(fieldPatterns)) {
        if (patterns.some(pattern => pattern.test(header))) {
          mappings.push({
            sourceColumn: index,
            targetField: field as any,
            fieldType: field.startsWith('employee') ? 'employee' : 'record',
          });
          break;
        }
      }
    });
    
    return mappings;
  }
  
  /**
   * 验证导入数据
   */
  validateImportData(
    data: any[][],
    mappings: ColumnMapping[]
  ): ValidationResult {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    
    // 检查必填字段
    const requiredFields = ['employee.name', 'date'];
    const mappedFields = mappings.map(m => m.targetField);
    
    requiredFields.forEach(field => {
      if (!mappedFields.includes(field as any)) {
        errors.push({
          row: 0,
          field,
          message: `缺少必填字段: ${field}`,
          code: 'MISSING_REQUIRED_FIELD',
        });
      }
    });
    
    // 验证每行数据
    data.forEach((row, rowIndex) => {
      mappings.forEach(mapping => {
        const value = row[mapping.sourceColumn as number];
        
        // 验证日期格式
        if (mapping.targetField === 'date' && value) {
          const date = this.parseDate(value);
          if (!date) {
            errors.push({
              row: rowIndex + 1,
              column: String(mapping.sourceColumn),
              value,
              message: '无效的日期格式',
              code: 'INVALID_DATE',
            });
          }
        }
        
        // 验证时间格式
        if (['checkIn', 'checkOut'].includes(mapping.targetField) && value) {
          const time = this.parseTime(value);
          if (!time) {
            warnings.push({
              row: rowIndex + 1,
              column: String(mapping.sourceColumn),
              message: '无法解析时间，将使用原始值',
              code: 'UNPARSEABLE_TIME',
            });
          }
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
```

---

## 5. 测试指南

### 5.1 单元测试

```typescript
// tests/unit/nlp/processor.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { NLPProcessor } from '@/core/nlp/processor';
import { AttendanceIntent } from '@/types/nlp';

describe('NLPProcessor', () => {
  let processor: NLPProcessor;
  
  beforeEach(() => {
    processor = new NLPProcessor({ mode: 'local' });
  });
  
  describe('意图识别', () => {
    it('应该识别创建月报的意图', async () => {
      const result = await processor.process('生成2024年1月的考勤表');
      
      expect(result.intent).toBe(AttendanceIntent.CREATE_MONTHLY);
      expect(result.confidence).toBeGreaterThan(0.7);
    });
    
    it('应该识别创建周报的意图', async () => {
      const result = await processor.process('做一个本周的考勤周报');
      
      expect(result.intent).toBe(AttendanceIntent.CREATE_WEEKLY);
    });
    
    it('应该提取日期范围', async () => {
      const result = await processor.process('生成1月1日到1月31日的考勤表');
      
      expect(result.entities.dateRange).toBeDefined();
      expect(result.entities.dateRange?.start.getMonth()).toBe(0);
      expect(result.entities.dateRange?.end.getDate()).toBe(31);
    });
    
    it('应该提取员工列表', async () => {
      const result = await processor.process(
        '创建考勤表，包含张三、李四、王五'
      );
      
      expect(result.entities.employees).toEqual(['张三', '李四', '王五']);
    });
  });
  
  describe('置信度评估', () => {
    it('明确的输入应该有高置信度', async () => {
      const result = await processor.process('生成2024年1月月度考勤表');
      
      expect(result.confidence).toBeGreaterThan(0.8);
    });
    
    it('模糊的输入应该有低置信度', async () => {
      const result = await processor.process('做个表');
      
      expect(result.confidence).toBeLessThan(0.5);
    });
  });
});
```

### 5.2 集成测试

```typescript
// tests/integration/nlp-to-generator.test.ts

import { describe, it, expect } from 'vitest';
import { NLPProcessor } from '@/core/nlp/processor';
import { AttendanceGenerator } from '@/core/generator/attendance-generator';
import { TemplateEngine } from '@/core/templates/engine';

describe('NLP到生成器集成测试', () => {
  it('应该从自然语言生成完整的考勤表', async () => {
    const processor = new NLPProcessor({ mode: 'local' });
    const templateEngine = new TemplateEngine();
    const generator = new AttendanceGenerator(templateEngine);
    
    // 处理自然语言
    const nlpResult = await processor.process(
      '生成2024年1月的考勤表，包含张三和李四'
    );
    
    // 生成考勤表
    const sheet = await generator.generateFromNLP(nlpResult);
    
    // 验证结果
    expect(sheet).toBeDefined();
    expect(sheet.employees).toHaveLength(2);
    expect(sheet.dateRange.start.getMonth()).toBe(0);
    expect(sheet.dateRange.end.getMonth()).toBe(0);
  });
});
```

### 5.3 Mock Office.js

```typescript
// tests/mocks/office-mock.ts

export const mockExcelContext = {
  workbook: {
    worksheets: {
      getActiveWorksheet: () => ({
        getRange: (address: string) => ({
          values: [],
          load: () => Promise.resolve(),
        }),
        tables: {
          add: () => ({
            id: 'mock-table-id',
            name: 'MockTable',
            style: '',
          }),
        },
        charts: {
          add: () => ({
            id: 'mock-chart-id',
            title: { text: '' },
            setPosition: () => {},
          }),
        },
      }),
    },
  },
  sync: () => Promise.resolve(),
};

// 模拟 Excel.run
export const mockExcelRun = (callback: (context: any) => Promise<any>) => {
  return callback(mockExcelContext);
};

// 在测试中使用
vi.mock('@microsoft/office-js', () => ({
  Excel: {
    run: mockExcelRun,
  },
}));
```

---

## 6. 调试技巧

### 6.1 浏览器开发者工具

1. 在 Office 中加载插件后，按 F12 打开开发者工具
2. 在 Console 中查看日志
3. 在 Network 中查看 API 请求
4. 在 Sources 中设置断点

### 6.2 VS Code 调试

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Office Add-in (Edge)",
      "type": "msedge",
      "request": "attach",
      "port": 9229,
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true
    }
  ]
}
```

### 6.3 日志工具

```typescript
// src/utils/logger.ts

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  private level: number;
  
  constructor(level: keyof typeof LOG_LEVELS = 'INFO') {
    this.level = LOG_LEVELS[level];
  }
  
  debug(message: string, ...args: any[]) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
  
  info(message: string, ...args: any[]) {
    if (this.level <= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
  
  warn(message: string, ...args: any[]) {
    if (this.level <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }
  
  error(message: string, ...args: any[]) {
    if (this.level <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export const logger = new Logger(
  import.meta.env.DEV ? 'DEBUG' : 'WARN'
);
```

---

## 7. 发布流程

### 7.1 构建生产版本

```bash
# 构建
npm run build

# 验证构建结果
npm run preview
```

### 7.2 更新版本号

```bash
# 更新 package.json 和 manifest.xml 中的版本号
npm version patch  # 或 minor / major
```

### 7.3 发布到 Office 商店

1. 登录 [Partner Center](https://partner.microsoft.com/)
2. 创建新的 Office Add-in 提交
3. 上传构建产物和 manifest.xml
4. 填写商店信息（描述、截图等）
5. 提交审核

### 7.4 企业内部部署

```bash
# 生成部署包
npm run build

# 部署到内部服务器
# 将 dist 目录部署到 HTTPS 服务器
# 分发 manifest.xml 给用户
```

---

## 8. 常见问题排查

### 问题：插件无法加载

**可能原因：**
1. HTTPS 证书问题
2. manifest.xml 配置错误
3. 端口被占用

**解决方案：**
```bash
# 重新安装证书
npx office-addin-dev-certs install --force

# 验证 manifest
npx office-addin-manifest validate manifest.xml

# 检查端口
netstat -ano | findstr :3000
```

### 问题：Office.js API 调用失败

**可能原因：**
1. API 不支持当前 Office 版本
2. 未正确等待 Office.onReady

**解决方案：**
```typescript
// 确保在 Office 准备好后再调用 API
Office.onReady((info) => {
  if (info.host === Office.HostType.Excel) {
    // Excel 特定初始化
  }
});
```

### 问题：热更新不生效

**解决方案：**
1. 清除 Office 缓存
2. 重新加载插件
3. 检查 Vite 配置