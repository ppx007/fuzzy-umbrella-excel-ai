/**
 * 设置面板组件
 * 分类显示所有可配置项
 */

import React, { useState, useRef } from 'react';
import { Button, Input, Select } from '@/components/common';
import { useSettings } from '@/hooks/useSettings';
import type {
  SettingsCategory,
  InsertPositionMode,
  ColorThemeName,
  StyleMode,
} from '@/types/common';

/**
 * 设置分类配置
 */
const CATEGORY_CONFIG: Record<
  SettingsCategory,
  { label: string; icon: string; description: string }
> = {
  ai: {
    label: 'AI 配置',
    icon: '🤖',
    description: '配置 AI 服务连接参数',
  },
  table: {
    label: '表格默认值',
    icon: '📊',
    description: '设置表格生成的默认行为',
  },
  style: {
    label: '样式偏好',
    icon: '🎨',
    description: '配置默认样式和主题',
  },
  advanced: {
    label: '高级选项',
    icon: '⚙️',
    description: '高级功能和调试选项',
  },
  about: {
    label: '关于',
    icon: 'ℹ️',
    description: '版本信息和帮助',
  },
};

/**
 * 位置模式选项
 */
const POSITION_MODE_OPTIONS: { value: InsertPositionMode; label: string }[] = [
  { value: 'auto', label: '智能检测（推荐）' },
  { value: 'manual', label: '手动选择位置' },
  { value: 'newSheet', label: '创建新工作表' },
];

/**
 * 颜色主题选项
 */
const THEME_OPTIONS: { value: ColorThemeName; label: string }[] = [
  { value: 'professional', label: '专业蓝' },
  { value: 'energetic', label: '活力橙' },
  { value: 'nature', label: '自然绿' },
  { value: 'elegant', label: '优雅紫' },
  { value: 'fresh', label: '清新蓝' },
  { value: 'dark', label: '深色模式' },
];

/**
 * 样式模式选项
 */
const STYLE_MODE_OPTIONS: { value: StyleMode; label: string }[] = [
  { value: 'ai', label: 'AI 智能推断' },
  { value: 'template', label: '使用模板' },
  { value: 'none', label: '无样式（纯数据）' },
];

/**
 * 模型选项
 */
const MODEL_OPTIONS = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'custom', label: '自定义模型' },
];

export interface SettingsPanelProps {
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const settings = useSettings();
  const [showApiKey, setShowApiKey] = useState(false);
  const [customModel, setCustomModel] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 渲染 AI 配置部分
   */
  const renderAISection = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">API 端点</label>
        <Input
          value={settings.ai.baseUrl}
          onChange={e => settings.updateAISettings({ baseUrl: e.target.value })}
          placeholder="https://api.openai.com/v1"
        />
        <p className="mt-1 text-xs text-gray-500">OpenAI 兼容的 API 端点地址</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">API 密钥</label>
        <div className="flex gap-2">
          <Input
            type={showApiKey ? 'text' : 'password'}
            value={settings.ai.apiKey}
            onChange={e => settings.updateAISettings({ apiKey: e.target.value })}
            placeholder="sk-..."
            className="flex-1"
          />
          <Button variant="outline" onClick={() => setShowApiKey(!showApiKey)}>
            {showApiKey ? '🙈' : '👁️'}
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">模型</label>
        <Select
          value={
            MODEL_OPTIONS.some(o => o.value === settings.ai.model) ? settings.ai.model : 'custom'
          }
          onChange={value => {
            if (value === 'custom') {
              setCustomModel(settings.ai.model);
            } else {
              settings.updateAISettings({ model: value });
            }
          }}
          options={MODEL_OPTIONS}
        />
        {(!MODEL_OPTIONS.some(o => o.value === settings.ai.model) ||
          settings.ai.model === 'custom') && (
          <Input
            value={customModel || settings.ai.model}
            onChange={e => {
              setCustomModel(e.target.value);
              settings.updateAISettings({ model: e.target.value });
            }}
            placeholder="输入自定义模型名称"
            className="mt-2"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">请求超时（秒）</label>
        <Input
          type="number"
          value={settings.ai.timeout}
          onChange={e => settings.updateAISettings({ timeout: parseInt(e.target.value) || 60 })}
          min={10}
          max={300}
        />
      </div>
    </div>
  );

  /**
   * 渲染表格默认值部分
   */
  const renderTableSection = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">默认插入位置</label>
        <Select
          value={settings.table.positionMode}
          onChange={value =>
            settings.updateTableSettings({ positionMode: value as InsertPositionMode })
          }
          options={POSITION_MODE_OPTIONS}
        />
        <p className="mt-1 text-xs text-gray-500">
          {settings.table.positionMode === 'auto' && '自动在已有数据下方找到空白位置'}
          {settings.table.positionMode === 'manual' && '使用当前 Excel 中选中的单元格作为起始位置'}
          {settings.table.positionMode === 'newSheet' && '每次生成表格时创建新的工作表'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">默认生成行数</label>
        <Input
          type="number"
          value={settings.table.defaultRowCount}
          onChange={e =>
            settings.updateTableSettings({ defaultRowCount: parseInt(e.target.value) || 5 })
          }
          min={1}
          max={100}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">自动创建表格对象</span>
          <p className="text-xs text-gray-500">生成后自动转换为 Excel 表格对象</p>
        </div>
        <input
          type="checkbox"
          checked={settings.table.autoCreateTable}
          onChange={e => settings.updateTableSettings({ autoCreateTable: e.target.checked })}
          className="h-4 w-4 text-blue-600 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">自动调整列宽</span>
          <p className="text-xs text-gray-500">根据内容自动调整列宽</p>
        </div>
        <input
          type="checkbox"
          checked={settings.table.autoFitColumns}
          onChange={e => settings.updateTableSettings({ autoFitColumns: e.target.checked })}
          className="h-4 w-4 text-blue-600 rounded"
        />
      </div>
    </div>
  );

  /**
   * 渲染样式偏好部分
   */
  const renderStyleSection = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">样式模式</label>
        <Select
          value={settings.style.styleMode}
          onChange={value => settings.updateStyleSettings({ styleMode: value as StyleMode })}
          options={STYLE_MODE_OPTIONS}
        />
        <p className="mt-1 text-xs text-gray-500">
          {settings.style.styleMode === 'ai' && 'AI 根据表格内容智能推断最合适的样式'}
          {settings.style.styleMode === 'template' && '使用预设的模板主题'}
          {settings.style.styleMode === 'none' && '只生成数据，不应用任何样式'}
        </p>
      </div>

      {settings.style.styleMode === 'template' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">默认颜色主题</label>
          <Select
            value={settings.style.defaultTheme}
            onChange={value =>
              settings.updateStyleSettings({ defaultTheme: value as ColorThemeName })
            }
            options={THEME_OPTIONS}
          />
          <div className="mt-2 flex gap-1">
            {THEME_OPTIONS.map(theme => (
              <button
                key={theme.value}
                onClick={() => settings.updateStyleSettings({ defaultTheme: theme.value })}
                className={`w-6 h-6 rounded border-2 ${
                  settings.style.defaultTheme === theme.value
                    ? 'border-blue-500'
                    : 'border-transparent'
                }`}
                style={{
                  backgroundColor:
                    theme.value === 'professional'
                      ? '#4472C4'
                      : theme.value === 'energetic'
                        ? '#ED7D31'
                        : theme.value === 'nature'
                          ? '#70AD47'
                          : theme.value === 'elegant'
                            ? '#7030A0'
                            : theme.value === 'fresh'
                              ? '#5B9BD5'
                              : '#2F2F2F',
                }}
                title={theme.label}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">启用条件格式</span>
          <p className="text-xs text-gray-500">自动添加数据条、颜色阶梯等</p>
        </div>
        <input
          type="checkbox"
          checked={settings.style.enableConditionalFormat}
          onChange={e =>
            settings.updateStyleSettings({ enableConditionalFormat: e.target.checked })
          }
          className="h-4 w-4 text-blue-600 rounded"
        />
      </div>
    </div>
  );

  /**
   * 渲染高级选项部分
   */
  const renderAdvancedSection = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">最大历史记录条数</label>
        <Input
          type="number"
          value={settings.advanced.maxHistoryEntries}
          onChange={e =>
            settings.updateAdvancedSettings({ maxHistoryEntries: parseInt(e.target.value) || 50 })
          }
          min={10}
          max={200}
        />
        <p className="mt-1 text-xs text-gray-500">可撤销/重做的最大操作数</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">启用流式响应</span>
          <p className="text-xs text-gray-500">实时显示 AI 生成过程</p>
        </div>
        <input
          type="checkbox"
          checked={settings.advanced.enableStreaming}
          onChange={e => settings.updateAdvancedSettings({ enableStreaming: e.target.checked })}
          className="h-4 w-4 text-blue-600 rounded"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">调试模式</span>
          <p className="text-xs text-gray-500">显示详细日志信息</p>
        </div>
        <input
          type="checkbox"
          checked={settings.advanced.debugMode}
          onChange={e => settings.updateAdvancedSettings({ debugMode: e.target.checked })}
          className="h-4 w-4 text-blue-600 rounded"
        />
      </div>

      <hr className="my-4" />

      <div className="space-y-2">
        <Button variant="outline" onClick={settings.exportSettings} className="w-full">
          📤 导出设置
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
          📥 导入设置
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = event => {
                const content = event.target?.result as string;
                if (settings.importSettings(content)) {
                  alert('设置导入成功！');
                } else {
                  alert('导入失败，请检查文件格式');
                }
              };
              reader.readAsText(file);
            }
          }}
        />
      </div>
    </div>
  );

  /**
   * 渲染关于部分
   */
  const renderAboutSection = () => (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="text-4xl mb-2">📊</div>
        <h2 className="text-xl font-bold text-gray-800">Excel AI 助手</h2>
        <p className="text-sm text-gray-500">智能表格生成与管理工具</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">版本</span>
          <span className="font-mono">3.0.0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">构建时间</span>
          <span className="font-mono text-xs">{new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-gray-800">功能特性</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✅ 自然语言生成表格</li>
          <li>✅ 智能样式推断</li>
          <li>✅ 表格修改与增强</li>
          <li>✅ 图表自动生成</li>
          <li>✅ 撤销/重做支持</li>
          <li>✅ 流式响应</li>
          <li>✅ 智能位置检测</li>
        </ul>
      </div>

      <hr className="my-4" />

      <Button
        variant="secondary"
        onClick={settings.reset}
        className="w-full bg-red-500 hover:bg-red-600"
      >
        🔄 重置所有设置
      </Button>
    </div>
  );

  /**
   * 渲染当前分类内容
   */
  const renderCategoryContent = () => {
    switch (settings.activeCategory) {
      case 'ai':
        return renderAISection();
      case 'table':
        return renderTableSection();
      case 'style':
        return renderStyleSection();
      case 'advanced':
        return renderAdvancedSection();
      case 'about':
        return renderAboutSection();
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-lg font-bold text-gray-800">⚙️ 设置</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧菜单 */}
        <div className="w-40 border-r bg-gray-50 overflow-y-auto">
          {(Object.keys(CATEGORY_CONFIG) as SettingsCategory[]).map(category => (
            <button
              key={category}
              onClick={() => settings.setActiveCategory(category)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                settings.activeCategory === category
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{CATEGORY_CONFIG[category].icon}</span>
              {CATEGORY_CONFIG[category].label}
            </button>
          ))}
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-800">
              {CATEGORY_CONFIG[settings.activeCategory].icon}{' '}
              {CATEGORY_CONFIG[settings.activeCategory].label}
            </h2>
            <p className="text-sm text-gray-500">
              {CATEGORY_CONFIG[settings.activeCategory].description}
            </p>
          </div>

          {renderCategoryContent()}

          {/* 重置当前分类按钮 */}
          {settings.activeCategory !== 'about' && (
            <div className="mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('确定要重置此分类的设置吗？')) {
                    settings.resetCategory(settings.activeCategory);
                  }
                }}
                className="text-sm"
              >
                重置此分类
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 底部保存提示 */}
      {settings.isDirty && (
        <div className="px-4 py-2 bg-yellow-50 border-t text-sm text-yellow-700 flex items-center justify-between">
          <span>设置已更改，将自动保存</span>
          <Button size="small" onClick={settings.save}>
            立即保存
          </Button>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
