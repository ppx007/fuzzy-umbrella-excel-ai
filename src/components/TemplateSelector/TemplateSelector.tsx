/**
 * 模板选择器组件
 */

import React from 'react';
import { Card, Select } from '../common';
import { useTemplate } from '@/hooks';
import { TemplateType } from '@/types';

interface TemplateSelectorProps {
  onSelect?: (templateType: TemplateType) => void;
  selectedType?: TemplateType;
}

const templateOptions = [
  { value: TemplateType.DAILY_SIMPLE, label: '日报简单版' },
  { value: TemplateType.DAILY_DETAILED, label: '日报详细版' },
  { value: TemplateType.WEEKLY_SUMMARY, label: '周报汇总' },
  { value: TemplateType.MONTHLY_SUMMARY, label: '月报汇总' },
  { value: TemplateType.MONTHLY_DETAILED, label: '月报详细' },
  { value: TemplateType.CUSTOM, label: '自定义模板' },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelect,
  selectedType,
}) => {
  const { 
    currentTemplate, 
    selectTemplate, 
    availableTemplates,
    isLoading 
  } = useTemplate();

  const handleSelect = (value: string) => {
    const templateType = value as TemplateType;
    selectTemplate(templateType);
    onSelect?.(templateType);
  };

  return (
    <Card title="模板选择" className="mb-4">
      <div className="space-y-4">
        <Select
          label="选择模板类型"
          options={templateOptions}
          value={selectedType || currentTemplate?.type || ''}
          onChange={handleSelect}
          placeholder="请选择模板"
        />

        {currentTemplate && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              模板预览
            </h4>
            <div className="text-sm text-gray-600">
              <p><strong>名称：</strong>{currentTemplate.name}</p>
              <p><strong>描述：</strong>{currentTemplate.description || '无'}</p>
              <p><strong>列数：</strong>{currentTemplate.headers?.length || 0}</p>
            </div>
          </div>
        )}

        {availableTemplates.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              可用模板
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {availableTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template.type)}
                  className={`
                    p-3 text-left rounded-lg border transition-colors
                    ${currentTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                    }
                  `}
                >
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {template.description || template.type}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center text-gray-500 text-sm">
            加载中...
          </div>
        )}
      </div>
    </Card>
  );
};

export default TemplateSelector;