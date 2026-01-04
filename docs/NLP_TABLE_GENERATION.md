# 自然语言生成表格功能设计文档

## 1. 功能概述

### 1.1 目标

实现类似 Kilo Code 的自然语言表格生成功能，允许用户通过自然语言描述来自动创建表格并填充到 Excel 中。

### 1.2 核心能力

- **自然语言解析**：理解用户输入的表格需求描述
- **智能结构推断**：自动推断表格列名、数据类型
- **示例数据生成**：可选支持用户描述的示例数据
- **Excel 集成**：将生成的表格写入 Excel 工作表

### 1.3 使用场景示例

```
用户输入: "创建一个包含姓名、年龄、职位三列的员工表格"
用户输入: "生成一个销售数据表，包含日期、产品、数量、单价、总额，并添加5条示例数据"
用户输入: "创建项目进度表，列包括任务名称、负责人、开始日期、结束日期、完成状态"
```

---

## 2. 现有架构分析

### 2.1 现有组件概览

| 组件            | 路径                                   | 职责                       | 复用价值                           |
| --------------- | -------------------------------------- | -------------------------- | ---------------------------------- |
| AIService       | `src/services/ai-service.ts`           | OpenAI API 调用、JSON 解析 | ⭐⭐⭐ 高 - 已有完整的表格生成逻辑 |
| NLPProcessor    | `src/core/nlp/processor.ts`            | 本地 NLP 处理、意图识别    | ⭐⭐ 中 - 可扩展新意图             |
| ExcelAdapter    | `src/adapters/excel-adapter.ts`        | Excel 读写操作             | ⭐⭐⭐ 高 - 直接复用               |
| useNLP          | `src/hooks/useNLP.ts`                  | NLP 处理 Hook              | ⭐⭐ 中 - 可扩展                   |
| useAIAttendance | `src/hooks/useAIAttendance.ts`         | AI 考勤表生成              | ⭐⭐⭐ 高 - 参考模式               |
| NLPInput        | `src/components/NLPInput/NLPInput.tsx` | 自然语言输入 UI            | ⭐⭐⭐ 高 - 可复用                 |

### 2.2 现有数据流

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          现有考勤表生成流程                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  用户输入 ──► NLPInput ──► useNLP.processWithAI() ──► NLPProcessor     │
│                                      │                                  │
│                                      ▼                                  │
│                              AIService.generateTable()                  │
│                                      │                                  │
│                                      ▼                                  │
│                              GeneratedTable (JSON)                      │
│                                      │                                  │
│                                      ▼                                  │
│                          useAIAttendance.writeToExcel()                 │
│                                      │                                  │
│                                      ▼                                  │
│                              ExcelAdapter.writeData()                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 现有类型定义

```typescript
// src/types/common.ts
interface TableColumn {
  key: string;
  title: string;
  type: 'string' | 'number' | 'date' | 'time' | 'status';
}

// src/services/ai-service.ts
interface GeneratedTable {
  title: string;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  summary?: string;
}
```

### 2.4 现有限制

1. **意图绑定**：当前 AI 服务的 SYSTEM_PROMPT 专注于考勤表场景
2. **数据转换**：`transformAITable()` 函数专门处理考勤数据结构
3. **类型限制**：`TableColumn.type` 仅支持 5 种类型

---

## 3. 架构设计

### 3.1 设计原则

1. **最小侵入**：尽量复用现有组件，减少对现有代码的修改
2. **关注点分离**：通用表格生成与考勤表生成逻辑分离
3. **可扩展性**：支持未来添加更多表格类型和数据类型
4. **向后兼容**：保持现有考勤功能正常工作

### 3.2 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           自然语言表格生成架构                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌──────────────────┐     ┌─────────────────────────┐  │
│  │   UI 层     │     │    Hook 层        │     │      服务层              │  │
│  ├─────────────┤     ├──────────────────┤     ├─────────────────────────┤  │
│  │             │     │                  │     │                         │  │
│  │ NLPInput    │────►│ useTableGen      │────►│ TableGenerationService  │  │
│  │ (复用)      │     │ (新增)           │     │ (新增)                  │  │
│  │             │     │                  │     │                         │  │
│  │ TableGen    │     │ useNLP           │     │ AIService               │  │
│  │ Preview     │◄────│ (扩展)           │     │ (扩展)                  │  │
│  │ (新增)      │     │                  │     │                         │  │
│  │             │     │                  │     │                         │  │
│  └─────────────┘     └──────────────────┘     └─────────────────────────┘  │
│         │                    │                          │                  │
│         │                    │                          │                  │
│         ▼                    ▼                          ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         适配器层                                      │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │                                                                     │  │
│  │  ExcelAdapter (复用) ◄─── writeGeneratedTable() (新增方法)          │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 数据流设计

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          通用表格生成数据流                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. 用户输入                                                                │
│     "创建一个包含姓名、年龄、职位三列的员工表格"                              │
│                              │                                             │
│                              ▼                                             │
│  2. 意图识别 (NLPProcessor)                                                 │
│     ┌─────────────────────────────────────────┐                           │
│     │ intent: CREATE_GENERIC_TABLE            │                           │
│     │ entities: {                             │                           │
│     │   tableType: 'employee',                │                           │
│     │   columns: ['姓名', '年龄', '职位'],     │                           │
│     │   sampleDataCount: 0                    │                           │
│     │ }                                       │                           │
│     └─────────────────────────────────────────┘                           │
│                              │                                             │
│                              ▼                                             │
│  3. AI 表格生成 (TableGenerationService)                                   │
│     ┌─────────────────────────────────────────┐                           │
│     │ 构建 Prompt ──► 调用 OpenAI API         │                           │
│     │              ──► 解析 JSON 响应          │                           │
│     └─────────────────────────────────────────┘                           │
│                              │                                             │
│                              ▼                                             │
│  4. 生成结果 (GenericTable)                                                │
│     ┌─────────────────────────────────────────┐                           │
│     │ {                                       │                           │
│     │   title: "员工表格",                     │                           │
│     │   columns: [                            │                           │
│     │     {key: "name", title: "姓名", ...},  │                           │
│     │     {key: "age", title: "年龄", ...},   │                           │
│     │     {key: "position", title: "职位",...}│                           │
│     │   ],                                    │                           │
│     │   rows: []                              │                           │
│     │ }                                       │                           │
│     └─────────────────────────────────────────┘                           │
│                              │                                             │
│                              ▼                                             │
│  5. 用户预览与编辑 (TableGenPreview)                                       │
│     ┌─────────────────────────────────────────┐                           │
│     │ - 显示表格预览                           │                           │
│     │ - 允许列选择/排序                        │                           │
│     │ - 支持二次修改指令                       │                           │
│     └─────────────────────────────────────────┘                           │
│                              │                                             │
│                              ▼                                             │
│  6. 写入 Excel (ExcelAdapter)                                              │
│     ┌─────────────────────────────────────────┐                           │
│     │ - 创建/选择工作表                        │                           │
│     │ - 写入表头和数据                         │                           │
│     │ - 应用格式和样式                         │                           │
│     └─────────────────────────────────────────┘                           │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 接口设计

### 4.1 新增类型定义

```typescript
// src/types/table-generation.ts

/**
 * 通用表格列类型（扩展现有 TableColumn）
 */
export type GenericColumnType =
  | 'string'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'boolean'
  | 'currency'
  | 'percentage'
  | 'email'
  | 'phone'
  | 'url'
  | 'status'
  | 'custom';

/**
 * 通用表格列定义
 */
export interface GenericTableColumn {
  /** 列键名（英文，用于数据映射） */
  key: string;
  /** 列标题（显示名称） */
  title: string;
  /** 数据类型 */
  type: GenericColumnType;
  /** 列宽度（可选） */
  width?: number;
  /** 是否必填 */
  required?: boolean;
  /** 默认值 */
  defaultValue?: unknown;
  /** 格式化模式（如日期格式、货币符号等） */
  format?: string;
  /** 验证规则 */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[]; // 枚举选项
  };
}

/**
 * 通用表格定义
 */
export interface GenericTable {
  /** 表格标题 */
  title: string;
  /** 表格描述 */
  description?: string;
  /** 列定义 */
  columns: GenericTableColumn[];
  /** 数据行 */
  rows: Record<string, unknown>[];
  /** 元数据 */
  metadata?: {
    createdAt: Date;
    source: 'ai' | 'template' | 'import';
    prompt?: string;
  };
}

/**
 * 表格生成请求
 */
export interface TableGenerationRequest {
  /** 用户原始输入 */
  userInput: string;
  /** 期望的列（可选，用于引导 AI） */
  suggestedColumns?: string[];
  /** 期望的示例数据行数 */
  sampleDataCount?: number;
  /** 表格类型提示 */
  tableTypeHint?: string;
  /** 语言偏好 */
  language?: 'zh' | 'en';
}

/**
 * 表格生成响应
 */
export interface TableGenerationResponse {
  /** 是否成功 */
  success: boolean;
  /** 生成的表格 */
  table?: GenericTable;
  /** 错误信息 */
  error?: string;
  /** AI 原始响应（调试用） */
  rawResponse?: string;
  /** 处理耗时（毫秒） */
  processingTime?: number;
}

/**
 * 表格修改请求
 */
export interface TableModificationRequest {
  /** 原始表格 */
  originalTable: GenericTable;
  /** 修改指令 */
  instruction: string;
}

/**
 * 表格生成意图（扩展 AttendanceIntent）
 */
export enum TableGenerationIntent {
  /** 创建通用表格 */
  CREATE_GENERIC_TABLE = 'CREATE_GENERIC_TABLE',
  /** 修改现有表格 */
  MODIFY_TABLE = 'MODIFY_TABLE',
  /** 添加表格数据 */
  ADD_TABLE_DATA = 'ADD_TABLE_DATA',
  /** 删除表格列 */
  REMOVE_TABLE_COLUMN = 'REMOVE_TABLE_COLUMN',
  /** 重命名表格列 */
  RENAME_TABLE_COLUMN = 'RENAME_TABLE_COLUMN',
}

/**
 * 表格生成实体
 */
export interface TableGenerationEntities {
  /** 表格类型/名称 */
  tableName?: string;
  /** 提取的列名列表 */
  columnNames?: string[];
  /** 示例数据数量 */
  sampleDataCount?: number;
  /** 修改目标列 */
  targetColumn?: string;
  /** 新列名 */
  newColumnName?: string;
}
```

### 4.2 服务层接口

```typescript
// src/services/table-generation-service.ts

import {
  TableGenerationRequest,
  TableGenerationResponse,
  TableModificationRequest,
  GenericTable,
} from '@/types/table-generation';

/**
 * 表格生成服务配置
 */
export interface TableGenerationServiceConfig {
  /** AI 服务配置 */
  aiConfig?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  };
  /** 默认语言 */
  defaultLanguage?: 'zh' | 'en';
  /** 最大重试次数 */
  maxRetries?: number;
}

/**
 * 表格生成服务接口
 */
export interface ITableGenerationService {
  /**
   * 根据自然语言生成表格
   */
  generateTable(request: TableGenerationRequest): Promise<TableGenerationResponse>;

  /**
   * 修改现有表格
   */
  modifyTable(request: TableModificationRequest): Promise<TableGenerationResponse>;

  /**
   * 为表格生成示例数据
   */
  generateSampleData(table: GenericTable, count: number): Promise<TableGenerationResponse>;

  /**
   * 验证表格结构
   */
  validateTable(table: GenericTable): { valid: boolean; errors: string[] };

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean;
}
```

### 4.3 Hook 接口

```typescript
// src/hooks/useTableGeneration.ts

import {
  GenericTable,
  TableGenerationRequest,
  TableGenerationResponse,
} from '@/types/table-generation';

/**
 * 表格生成 Hook 返回值
 */
export interface UseTableGenerationReturn {
  /** 生成表格 */
  generateTable: (input: string) => Promise<void>;

  /** 修改表格 */
  modifyTable: (instruction: string) => Promise<void>;

  /** 生成示例数据 */
  generateSampleData: (count: number) => Promise<void>;

  /** 写入 Excel */
  writeToExcel: (options?: WriteToExcelOptions) => Promise<void>;

  /** 当前生成的表格 */
  generatedTable: GenericTable | null;

  /** 是否正在生成 */
  isGenerating: boolean;

  /** 是否正在写入 */
  isWriting: boolean;

  /** 错误信息 */
  error: string | null;

  /** 重置状态 */
  reset: () => void;

  /** 更新表格（手动编辑） */
  updateTable: (table: GenericTable) => void;
}

/**
 * 写入 Excel 选项
 */
export interface WriteToExcelOptions {
  /** 工作表名称 */
  sheetName?: string;
  /** 起始单元格 */
  startCell?: string;
  /** 是否创建 Excel 表格对象 */
  createTable?: boolean;
  /** 选择的列（默认全部） */
  selectedColumns?: string[];
  /** 是否应用样式 */
  applyStyles?: boolean;
}
```

### 4.4 Excel 适配器扩展

```typescript
// src/adapters/excel-adapter.ts (扩展)

import { GenericTable, GenericTableColumn } from '@/types/table-generation';

/**
 * 通用表格写入选项
 */
export interface WriteGenericTableOptions {
  /** 工作表名称 */
  sheetName?: string;
  /** 起始单元格 */
  startCell?: string;
  /** 是否创建 Excel 表格对象 */
  createTable?: boolean;
  /** 表格名称 */
  tableName?: string;
  /** 选择的列键名（默认全部） */
  selectedColumnKeys?: string[];
  /** 是否应用自动格式 */
  autoFormat?: boolean;
  /** 表头样式 */
  headerStyle?: CellStyle;
  /** 数据样式 */
  dataStyle?: CellStyle;
}

// ExcelAdapter 类扩展方法
export class ExcelAdapter {
  // ... 现有方法 ...

  /**
   * 写入通用表格
   */
  async writeGenericTable(table: GenericTable, options?: WriteGenericTableOptions): Promise<void>;

  /**
   * 根据列类型应用格式
   */
  private applyColumnFormat(range: Excel.Range, column: GenericTableColumn): void;

  /**
   * 获取列的 Excel 数字格式
   */
  private getNumberFormat(type: GenericColumnType): string;
}
```

---

## 5. 文件清单

### 5.1 新增文件

| 文件路径                                             | 描述                 |
| ---------------------------------------------------- | -------------------- |
| `src/types/table-generation.ts`                      | 表格生成相关类型定义 |
| `src/services/table-generation-service.ts`           | 表格生成服务实现     |
| `src/hooks/useTableGeneration.ts`                    | 表格生成 Hook        |
| `src/components/TableGenPreview/TableGenPreview.tsx` | 表格预览组件         |
| `src/components/TableGenPreview/index.ts`            | 组件导出             |
| `src/core/nlp/rules/table-generation.ts`             | 表格生成意图规则     |

### 5.2 需要修改的文件

| 文件路径                        | 修改内容                           |
| ------------------------------- | ---------------------------------- |
| `src/types/index.ts`            | 导出新类型                         |
| `src/types/nlp.ts`              | 添加 `CREATE_GENERIC_TABLE` 等意图 |
| `src/services/index.ts`         | 导出新服务                         |
| `src/services/ai-service.ts`    | 添加通用表格生成 Prompt            |
| `src/hooks/index.ts`            | 导出新 Hook                        |
| `src/components/index.ts`       | 导出新组件                         |
| `src/core/nlp/processor.ts`     | 集成表格生成意图识别               |
| `src/core/nlp/rules/intents.ts` | 添加表格生成意图规则               |
| `src/adapters/excel-adapter.ts` | 添加 `writeGenericTable` 方法      |
| `src/App.tsx`                   | 集成表格生成功能 UI                |

---

## 6. 实现步骤建议

### 阶段一：基础设施（预计 2-3 小时）

1. **创建类型定义**
   - 创建 `src/types/table-generation.ts`
   - 更新 `src/types/index.ts` 导出
   - 扩展 `src/types/nlp.ts` 添加新意图

2. **扩展 AI 服务**
   - 在 `ai-service.ts` 中添加通用表格生成 Prompt
   - 添加 `generateGenericTable()` 方法
   - 复用现有的 JSON 解析和错误处理逻辑

### 阶段二：核心服务（预计 3-4 小时）

3. **实现表格生成服务**
   - 创建 `src/services/table-generation-service.ts`
   - 实现 `generateTable()`、`modifyTable()`、`generateSampleData()` 方法
   - 添加表格验证逻辑

4. **扩展 NLP 处理器**
   - 在 `src/core/nlp/rules/` 添加表格生成规则
   - 更新 `processor.ts` 支持新意图识别
   - 添加列名提取逻辑

### 阶段三：Excel 集成（预计 2-3 小时）

5. **扩展 Excel 适配器**
   - 添加 `writeGenericTable()` 方法
   - 实现列类型到 Excel 格式的映射
   - 支持选择性列导出

### 阶段四：UI 集成（预计 3-4 小时）

6. **创建 Hook**
   - 实现 `useTableGeneration` Hook
   - 管理生成状态、错误处理
   - 集成 Excel 写入

7. **创建预览组件**
   - 实现 `TableGenPreview` 组件
   - 支持列选择、排序
   - 支持二次修改输入

8. **更新主应用**
   - 在 `App.tsx` 中集成新功能
   - 添加通用表格生成入口
   - 复用现有的模态框和 UI 组件

### 阶段五：测试与优化（预计 2-3 小时）

9. **单元测试**
   - 测试类型推断逻辑
   - 测试 NLP 意图识别
   - 测试 Excel 写入

10. **集成测试**
    - 端到端流程测试
    - 错误场景测试
    - 性能优化

---

## 7. AI Prompt 设计

### 7.1 通用表格生成 Prompt

```typescript
const GENERIC_TABLE_SYSTEM_PROMPT = `你是一个智能表格生成引擎。根据用户的自然语言描述，生成一个结构化的表格定义。

**规则:**
1. 必须返回一个完整的、语法正确的JSON对象。
2. 绝对不能在JSON之外包含任何解释、注释或Markdown代码块。
3. 返回的JSON对象必须严格遵循以下结构：
   {
     "title": "表格标题",
     "description": "表格描述（可选）",
     "columns": [
       {
         "key": "英文键名",
         "title": "中文列标题",
         "type": "string|number|date|time|datetime|boolean|currency|percentage|email|phone|url|status",
         "width": 数字（可选）,
         "required": true/false（可选）,
         "format": "格式字符串（可选）"
       }
     ],
     "rows": [
       {"key1": "value1", "key2": "value2", ...}
     ]
   }

4. 智能推断列的数据类型：
   - 姓名、名称、标题 → string
   - 年龄、数量、金额 → number
   - 日期、时间 → date/time/datetime
   - 邮箱 → email
   - 电话 → phone
   - 状态、进度 → status
   - 价格、费用 → currency
   - 比例、占比 → percentage

5. 如果用户要求示例数据，生成合理且多样化的数据。
6. 列的key使用英文驼峰命名，title使用用户指定的中文名称。

**你的输出必须从 { 开始，到 } 结束。**`;
```

### 7.2 表格修改 Prompt

```typescript
const TABLE_MODIFICATION_PROMPT = `你是一个表格修改引擎。根据用户的指令修改现有表格。

当前表格结构：
{currentTable}

用户指令：{instruction}

**规则:**
1. 理解用户的修改意图（添加列、删除列、重命名、添加数据等）
2. 保持未修改部分不变
3. 返回完整的修改后表格JSON
4. 遵循与生成时相同的JSON结构

**你的输出必须从 { 开始，到 } 结束。**`;
```

---

## 8. 与现有功能的关系

### 8.1 复用策略

```
┌─────────────────────────────────────────────────────────────────────┐
│                        功能复用关系图                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐                    ┌─────────────────┐        │
│  │  考勤表生成      │                    │  通用表格生成    │        │
│  │  (现有功能)      │                    │  (新功能)        │        │
│  └────────┬────────┘                    └────────┬────────┘        │
│           │                                      │                 │
│           │         ┌──────────────────┐         │                 │
│           └────────►│   共享基础设施    │◄────────┘                 │
│                     ├──────────────────┤                           │
│                     │ • AIService      │                           │
│                     │ • ExcelAdapter   │                           │
│                     │ • NLPInput       │                           │
│                     │ • Modal          │                           │
│                     │ • Button/Card    │                           │
│                     └──────────────────┘                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 向后兼容

- 现有的 `useAIAttendance` Hook 保持不变
- 现有的考勤相关类型和逻辑不受影响
- `GeneratedTable` 类型可以视为 `GenericTable` 的子集
- 用户可以选择使用专门的考勤功能或通用表格功能

---

## 9. 未来扩展

### 9.1 潜在增强功能

- **模板保存**：将生成的表格结构保存为可复用模板
- **数据导入**：支持从 CSV/JSON 导入数据到生成的表格
- **公式支持**：在列定义中支持 Excel 公式
- **条件格式**：根据数据值自动应用条件格式
- **多表关联**：支持生成多个关联表格

### 9.2 AI 能力增强

- **上下文记忆**：记住用户偏好和历史表格
