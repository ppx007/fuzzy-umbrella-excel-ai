# Excel 表格增量更新重构方案

## 问题分析

### 当前问题

用户反馈：**修改表格时原样式会丢失**

### 根本原因

当前架构采用**全量覆写模式**：

1. AI 返回修改后的完整表格数据（`previewData`）
2. [`ExcelAdapter.updateTableData()`](../src/adapters/excel-adapter.ts:1407) 先清除原有范围，再写入新数据
3. 写入时使用默认样式（`DEFAULT_TABLE_STYLE`），而非保留原有样式

```mermaid
flowchart LR
    A[用户指令] --> B[AI 生成完整表格]
    B --> C[清除原区域]
    C --> D[写入新数据+默认样式]
    D --> E[原样式丢失!]
```

---

## 解决方案：基于操作指令的增量更新

### 核心思路

从**全量覆写**改为**原子操作**：

- AI 返回精确的操作指令（如 `updateCell`、`addRow`）
- ExcelAdapter 直接在 Excel 对象上执行这些操作
- **不清除、不重写** → 保留原有样式

```mermaid
flowchart LR
    A[用户指令] --> B[AI 生成操作指令]
    B --> C[ExcelAdapter.executeOperations]
    C --> D[直接修改单元格/行/列]
    D --> E[原样式保留!]
```

---

## 详细设计

### 1. 新增类型定义

**文件**: `src/types/common.ts`

```typescript
/**
 * 原子操作类型（增量更新专用）
 */
export type AtomicOperationType =
  | 'updateCell' // 更新单个单元格
  | 'updateRange' // 更新范围（多个单元格）
  | 'batchUpdate' // 批量更新（优化：多个不连续单元格）
  | 'insertRow' // 插入行（保留格式）
  | 'insertColumn' // 插入列（保留格式）
  | 'deleteRow' // 删除行
  | 'deleteColumn' // 删除列
  | 'setFormula' // 设置公式
  | 'batchFormula' // 批量设置公式
  | 'sortRange' // 排序（不改变样式）
  | 'filterRange' // 筛选
  | 'fillDown' // 向下填充（复制公式/值）
  | 'fillRight'; // 向右填充

/**
 * 单元格更新项（用于批量更新）
 */
export interface CellUpdate {
  address: string;
  value: unknown;
}

/**
 * 原子操作指令
 */
export interface AtomicOperation {
  type: AtomicOperationType;
  target: string;
  params: {
    value?: unknown;
    values?: unknown[][];
    cells?: CellUpdate[];
    formula?: string;
    formulas?: { address: string; formula: string }[];
    position?: 'before' | 'after';
    count?: number;
    sortOrder?: 'asc' | 'desc';
    sortColumn?: string;
    sourceRange?: string;
  };
  description?: string;
}

/**
 * 增量更新请求
 */
export interface IncrementalUpdateRequest {
  tableAddress: string;
  sheetName: string;
  operations: AtomicOperation[];
}

/**
 * 增量更新结果
 */
export interface IncrementalUpdateResult {
  success: boolean;
  appliedCount: number;
  failedOperations?: {
    operation: AtomicOperation;
    error: string;
  }[];
}
```

### 2. ExcelAdapter 新增方法

**文件**: `src/adapters/excel-adapter.ts`

核心方法：

- `executeOperations()` - 执行增量更新操作
- `optimizeOperations()` - 合并优化操作序列
- `tryMergeToRange()` - 尝试将多个单元格更新合并为范围更新
- `execUpdateCell()` - 更新单个单元格
- `execUpdateRange()` - 更新范围
- `execBatchUpdate()` - 批量更新不连续单元格
- `execInsertRow()` - 插入行
- `execInsertColumn()` - 插入列
- `execDeleteRow()` - 删除行
- `execDeleteColumn()` - 删除列
- `execSetFormula()` - 设置公式
- `execBatchFormula()` - 批量设置公式
- `execSortRange()` - 排序
- `execFillDown()` - 向下填充
- `execFillRight()` - 向右填充

### 3. TableModificationService Prompt 优化

**文件**: `src/services/table-modification-service.ts`

关键改动：

- 强制 AI 返回操作指令而非完整表格
- 新增批量操作类型示例
- 优化 JSON 格式说明

### 4. 前端调用逻辑更新

**文件**: `src/components/UnifiedAssistantPanel/UnifiedAssistantPanel.tsx`

关键改动：

- `handleModify()` 使用 `executeOperations()` 替代 `updateTableData()`
- 操作类型映射
- 错误处理优化

---

## 批量操作优化策略

### 性能优化原则

1. **减少 API 调用次数**
   - 多个 `updateCell` 合并为 `batchUpdate` 或 `updateRange`
   - 使用单次 `context.sync()` 完成所有操作

2. **智能合并策略**

   ```
   输入: [updateCell(A1), updateCell(A2), updateCell(A3), updateCell(B1)]

   分析:
   - A1, A2, A3 形成连续列 → 合并为 updateRange(A1:A3)
   - B1 单独 → 保持 updateCell(B1)

   输出: [updateRange(A1:A3), updateCell(B1)]
   ```

3. **矩形区域检测**

   ```
   输入: [updateCell(A1), updateCell(A2), updateCell(B1), updateCell(B2)]

   分析: 形成 2x2 矩形

   输出: [updateRange(A1:B2)]
   ```

### 优化算法

```typescript
optimizeOperations(operations: AtomicOperation[]): AtomicOperation[] {
  // 1. 收集所有 updateCell 操作
  // 2. 按位置分组
  // 3. 检测连续区域
  // 4. 合并为 updateRange 或 batchUpdate
  // 5. 保持其他操作顺序不变
}
```

### 性能对比

| 场景                 | 优化前         | 优化后        | 提升 |
| -------------------- | -------------- | ------------- | ---- |
| 更新 10 个连续单元格 | 10 次 API 调用 | 1 次 API 调用 | 90%  |
| 更新 5x5 矩形区域    | 25 次 API 调用 | 1 次 API 调用 | 96%  |
| 更新 10 个分散单元格 | 10 次 API 调用 | 1 次批量调用  | 90%  |

---

## 实施步骤

### Phase 1: 类型定义和 ExcelAdapter 扩展

1. 在 `src/types/common.ts` 中添加新类型
2. 在 `src/adapters/excel-adapter.ts` 中实现 `executeOperations` 方法及所有原子操作

### Phase 2: AI Prompt 优化

1. 修改 `TableModificationService.buildModificationPrompt`
2. 更新 `parseModificationResponse` 以处理新格式

### Phase 3: 前端集成

1. 修改 `UnifiedAssistantPanel.handleModify` 使用新 API
2. 调整历史记录逻辑

### Phase 4: 测试验证

1. 测试场景：
   - 修改单元格值（验证背景色、字体颜色保留）
   - 添加行/列（验证格式继承）
   - 删除行/列
   - 设置公式
   - 排序（验证条件格式保留）
   - 批量修改多个单元格

---

## 回退方案

如果新方案出现问题，可以保留原有的 `updateTableData` 方法作为后备：

```typescript
if (result.operations && result.operations.length > 0) {
  // 尝试增量更新
  const updateResult = await excelAdapter.executeOperations(...);
  if (!updateResult.success && result.previewData) {
    // 回退到全量更新
    console.warn('[Fallback] 增量更新失败，回退到全量更新');
    const modifiedData = tableModificationService.convertPreviewDataToStyledData(result.previewData);
    await excelAdapter.updateTableData(tableData.address, modifiedData, tableData.sheetName);
  }
}
```

---

## 预期效果

| 场景       | 之前               | 之后                             |
| ---------- | ------------------ | -------------------------------- |
| 修改单元格 | 整表重写，样式丢失 | 只更新目标单元格，样式保留       |
| 添加行     | 整表重写，样式丢失 | 插入行并继承相邻行样式           |
| 删除列     | 整表重写，样式丢失 | 直接删除，其他列样式保留         |
| 排序       | 样式与数据分离     | Excel 内置排序，样式跟随数据移动 |
| 批量修改   | N 次 API 调用      | 1 次优化后的批量调用             |

---

## 文件修改清单

| 文件                                                             | 修改类型 | 说明                              |
| ---------------------------------------------------------------- | -------- | --------------------------------- |
| `src/types/common.ts`                                            | 新增     | 添加原子操作类型定义              |
| `src/adapters/excel-adapter.ts`                                  | 修改     | 新增 executeOperations 及相关方法 |
| `src/services/table-modification-service.ts`                     | 修改     | 优化 Prompt，调整响应解析         |
| `src/components/UnifiedAssistantPanel/UnifiedAssistantPanel.tsx` | 修改     | 使用新的增量更新 API              |
