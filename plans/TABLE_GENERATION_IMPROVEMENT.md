<!--
 * @Author: ppx007 duxiaojie3@gmail.com
 * @LastEditTime: 2026-01-11 11:56:35
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
-->

# 表格生成逻辑改进方案

## 1. 问题分析

当前表格生成功能存在"数据混乱"问题，主要原因如下：

1.  **数据结构脆弱**：
    - 现有实现直接使用中文列名（`name`）作为 JSON 数据的键（Key）。
    - AI 模型在生成数据时，容易在行数据中使用与列定义略有不同的键名（例如列名定义为"销售金额"，行数据中使用"金额"），导致数据无法正确映射。
2.  **缺乏唯一标识**：
    - 缺少稳定的英文键名（`key`）作为内部映射标识。
3.  **API 约束不足**：
    - 未强制启用 JSON 模式，导致输出格式偶尔不稳定。

## 2. 改进目标

1.  **结构清晰**：分离"数据键"（Key）和"显示名"（Title）。
2.  **映射稳定**：确保行数据严格对应列定义。
3.  **类型准确**：增强数据类型推断和验证。

## 3. 详细设计

### 3.1 数据模型调整

将 `GenericTableColumn` 结构调整为：

```typescript
interface GenericTableColumn {
  key: string; // 唯一标识 (如 "user_name", "age")
  title: string; // 显示名称 (如 "用户姓名", "年龄")
  type: ExtendedColumnType;
  // ...
}
```

### 3.2 Prompt 优化

更新 System Prompt，要求 AI 生成如下结构：

```json
{
  "table": {
    "title": "员工列表",
    "columns": [
      { "key": "name", "title": "姓名", "type": "text" },
      { "key": "age", "title": "年龄", "type": "number" }
    ],
    "rows": [
      { "name": "张三", "age": 25 },
      { "name": "李四", "age": 30 }
    ]
  }
}
```

### 3.3 服务层逻辑更新 (`TableGenerationService`)

1.  **API 请求**：添加 `response_format: { type: "json_object" }` (针对支持的模型)。
2.  **Prompt 构建**：重写 `buildEnhancedSystemPrompt`，强调 `key` 和 `title` 的对应关系。
3.  **响应解析**：
    - 解析 `key` 和 `title`。
    - 验证 `rows` 中的键是否在 `columns` 的 `key` 列表中。
    - 自动清洗：丢弃未定义的键，补全缺失的键（使用 null/默认值）。

### 3.4 UI 适配 (`TablePreview`)

- 更新渲染逻辑：使用 `column.key` 从 `row` 中获取数据，使用 `column.title` 渲染表头。

## 4. 实施步骤

1.  **更新类型定义**：修改 `src/types/common.ts` 或相关类型文件。
2.  **重构服务层**：修改 `src/services/table-generation-service.ts`。
3.  **适配 UI 组件**：修改 `src/components/TableGeneratorPanel/TablePreview.tsx`。
4.  **测试验证**：验证生成的数据结构是否稳定，列名映射是否正确。
