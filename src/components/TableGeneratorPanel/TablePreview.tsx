/**
 * 表格预览组件
 * 用于预览 AI 生成的表格结构和数据
 */

import React from 'react';
import { GenericTableData, ExtendedColumnType } from '@/types/common';
import { Button } from '../common';

/**
 * 表格预览属性
 */
interface TablePreviewProps {
  /** 表格数据 */
  table: GenericTableData;
  /** 是否正在写入 Excel */
  isWriting?: boolean;
  /** 写入 Excel 回调 */
  onWriteToExcel?: () => void;
  /** 重新生成回调 */
  onRegenerate?: () => void;
}

/**
 * 获取列类型的显示名称
 */
const getColumnTypeLabel = (type: ExtendedColumnType): string => {
  const typeLabels: Record<ExtendedColumnType, string> = {
    text: '文本',
    number: '数字',
    date: '日期',
    time: '时间',
    datetime: '日期时间',
    currency: '货币',
    percentage: '百分比',
    boolean: '布尔',
    email: '邮箱',
    phone: '电话',
    url: '链接',
    formula: '公式',
  };
  return typeLabels[type] || type;
};

/**
 * 获取列类型的颜色样式
 */
const getColumnTypeColor = (type: ExtendedColumnType): string => {
  const typeColors: Record<ExtendedColumnType, string> = {
    text: 'bg-gray-100 text-gray-700',
    number: 'bg-blue-100 text-blue-700',
    date: 'bg-green-100 text-green-700',
    time: 'bg-green-100 text-green-700',
    datetime: 'bg-green-100 text-green-700',
    currency: 'bg-yellow-100 text-yellow-700',
    percentage: 'bg-purple-100 text-purple-700',
    boolean: 'bg-pink-100 text-pink-700',
    email: 'bg-indigo-100 text-indigo-700',
    phone: 'bg-indigo-100 text-indigo-700',
    url: 'bg-cyan-100 text-cyan-700',
    formula: 'bg-orange-100 text-orange-700',
  };
  return typeColors[type] || 'bg-gray-100 text-gray-700';
};

/**
 * 格式化单元格值
 */
const formatCellValue = (value: unknown, type: ExtendedColumnType): string => {
  if (value === null || value === undefined) {
    return '-';
  }

  switch (type) {
    case 'boolean':
      return value ? '是' : '否';
    case 'percentage':
      if (typeof value === 'number') {
        return `${(value * 100).toFixed(1)}%`;
      }
      return String(value);
    case 'currency':
      if (typeof value === 'number') {
        return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
      }
      return String(value);
    case 'date':
    case 'time':
    case 'datetime':
      if (value instanceof Date) {
        return value.toLocaleDateString('zh-CN');
      }
      return String(value);
    default:
      return String(value);
  }
};

/**
 * 表格预览组件
 */
export const TablePreview: React.FC<TablePreviewProps> = ({
  table,
  isWriting,
  onWriteToExcel,
  onRegenerate,
}) => {
  const { tableName, columns, rows, metadata } = table;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 表格头部信息 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{tableName}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {columns.length} 列 · {rows.length} 行数据
              {metadata?.createdAt && (
                <span className="ml-2">
                  · 生成于 {new Date(metadata.createdAt).toLocaleTimeString('zh-CN')}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">AI 生成</span>
          </div>
        </div>
      </div>

      {/* 列定义 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">列定义</h4>
        <div className="flex flex-wrap gap-2">
          {columns.map((column, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-md"
            >
              <span className="text-sm font-medium text-gray-800">{column.name}</span>
              <span className={`px-1.5 py-0.5 text-xs rounded ${getColumnTypeColor(column.type)}`}>
                {getColumnTypeLabel(column.type)}
              </span>
              {column.required && (
                <span className="text-red-500 text-xs" title="必填">
                  *
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 数据预览表格 */}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  #
                </th>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-400 text-xs">{rowIndex + 1}</td>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {formatCellValue(row[column.name], column.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 无数据提示 */}
      {rows.length === 0 && (
        <div className="px-4 py-8 text-center text-gray-500">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">表格结构已生成，暂无示例数据</p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {metadata?.prompt && (
            <span title={metadata.prompt}>
              原始描述:{' '}
              {metadata.prompt.length > 50
                ? `${metadata.prompt.substring(0, 50)}...`
                : metadata.prompt}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {onRegenerate && (
            <Button variant="outline" size="small" onClick={onRegenerate}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              重新生成
            </Button>
          )}
          {onWriteToExcel && (
            <Button size="small" onClick={onWriteToExcel} loading={isWriting} disabled={isWriting}>
              {isWriting ? (
                '写入中...'
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  写入 Excel
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TablePreview;
