/**
 * 自然语言输入组件
 */

import React, { useState, useCallback } from 'react';
import { Button, Card } from '../common';
import { useNLP } from '@/hooks';

interface NLPInputProps {
  onProcess?: (input: string) => void;
  placeholder?: string;
}

export const NLPInput: React.FC<NLPInputProps> = ({
  onProcess,
  placeholder = '请输入您的需求，例如：生成本月考勤表、统计张三的出勤率...',
}) => {
  const [input, setInput] = useState('');
  const { process, result, isProcessing, error, intentDescription, suggestions } = useNLP();

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;

    // 本地处理用于显示意图和实体
    await process(input);

    // 触发外部处理
    if (onProcess) {
      onProcess(input);
    }
  }, [input, process, onProcess]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  return (
    <Card title="智能输入" className="mb-4">
      <div className="space-y-4">
        {/* 输入区域 */}
        <div className="relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <Button
            onClick={handleSubmit}
            loading={isProcessing}
            disabled={!input.trim()}
            className="absolute bottom-3 right-3"
            size="small"
          >
            分析
          </Button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 分析结果 */}
        {result && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-blue-800">识别意图：</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                {intentDescription}
              </span>
              <span className="text-sm text-gray-500">
                (置信度: {(result.confidence * 100).toFixed(0)}%)
              </span>
            </div>

            {result.entities && (
              <div className="mt-2">
                <span className="text-sm font-medium text-blue-800">提取实体：</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {result.entities.dateRange && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      日期: {result.entities.dateRange.start.toLocaleDateString()} -{' '}
                      {result.entities.dateRange.end.toLocaleDateString()}
                    </span>
                  )}
                  {result.entities.employees && result.entities.employees.length > 0 && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                      员工: {result.entities.employees.join(', ')}
                    </span>
                  )}
                  {result.entities.department && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                      部门: {result.entities.department}
                    </span>
                  )}
                  {result.entities.templateType && (
                    <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">
                      模板: {result.entities.templateType}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 建议 */}
        {suggestions.length > 0 && (
          <div>
            <span className="text-sm text-gray-500">快捷输入：</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NLPInput;
