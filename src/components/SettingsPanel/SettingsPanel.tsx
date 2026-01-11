/**
 * 设置面板组件
 * V4: 简化设计 - 紧凑卡片式布局
 * V4.1: 支持动态模型列表获取和缓存
 */

import React, { useState, useRef, useMemo } from 'react';
import { Button, Input, Select } from '@/components/common';
import { useSettings } from '@/hooks/useSettings';
import { useModels } from '@/hooks/useModels';
import type { InsertPositionMode, ColorThemeName, StyleMode } from '@/types/common';

/**
 * 颜色主题
 */
const THEMES: { value: ColorThemeName; label: string; color: string }[] = [
  { value: 'professional', label: '专业蓝', color: '#4472C4' },
  { value: 'energetic', label: '活力橙', color: '#ED7D31' },
  { value: 'nature', label: '自然绿', color: '#70AD47' },
  { value: 'elegant', label: '优雅紫', color: '#7030A0' },
  { value: 'fresh', label: '清新蓝', color: '#5B9BD5' },
  { value: 'dark', label: '深色', color: '#2F2F2F' },
];

export interface SettingsPanelProps {
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const settings = useSettings();
  const [showApiKey, setShowApiKey] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('ai');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  /**
   * 可折叠区块组件
   */
  const Section: React.FC<{
    id: string;
    icon: string;
    title: string;
    children: React.ReactNode;
  }> = ({ id, icon, title, children }) => (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => toggleSection(id)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2 font-medium text-gray-700">
          <span>{icon}</span>
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === id ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expandedSection === id && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );

  /**
   * 开关组件
   */
  const Toggle: React.FC<{
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-1">
      <div>
        <div className="text-sm text-gray-700">{label}</div>
        {description && <div className="text-xs text-gray-400">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  );

  /**
   * AI 配置区块组件
   */
  const AIConfigSection: React.FC = () => {
    // 使用动态模型列表
    const {
      models,
      isLoading: modelsLoading,
      error: modelsError,
      isFromCache,
      lastUpdated,
      refresh: refreshModels,
    } = useModels({
      baseUrl: settings.ai.baseUrl,
      apiKey: settings.ai.apiKey,
    });

    // 构建模型选项列表，添加"自定义"选项
    const modelOptions = useMemo(() => {
      const options = [...models];
      // 如果当前选择的模型不在列表中，添加为自定义选项
      if (settings.ai.model && !models.some(m => m.value === settings.ai.model)) {
        options.push({ value: settings.ai.model, label: `${settings.ai.model} (自定义)` });
      }
      return options;
    }, [models, settings.ai.model]);

    // 格式化缓存更新时间
    const formatLastUpdated = (date: Date | null) => {
      if (!date) return '';
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60));

      if (hours > 0) return `${hours}小时前`;
      if (minutes > 0) return `${minutes}分钟前`;
      return '刚刚';
    };

    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">API 端点</label>
          <Input
            value={settings.ai.baseUrl}
            onChange={e => settings.updateAISettings({ baseUrl: e.target.value })}
            placeholder="https://api.openai.com/v1"
            className="text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">API 密钥</label>
          <div className="flex gap-1">
            <Input
              type={showApiKey ? 'text' : 'password'}
              value={settings.ai.apiKey}
              onChange={e => settings.updateAISettings({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="flex-1 text-sm"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="px-2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-500">模型</label>
            <div className="flex items-center gap-2">
              {modelsLoading && <span className="text-xs text-blue-500">加载中...</span>}
              {isFromCache && lastUpdated && (
                <span className="text-xs text-gray-400">
                  缓存于 {formatLastUpdated(lastUpdated)}
                </span>
              )}
              <button
                onClick={refreshModels}
                disabled={modelsLoading}
                className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50 flex items-center gap-1"
                title="刷新模型列表"
              >
                <svg
                  className={`w-3 h-3 ${modelsLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                刷新
              </button>
            </div>
          </div>
          <Select
            value={settings.ai.model}
            onChange={value => settings.updateAISettings({ model: value })}
            options={modelOptions}
          />
          {modelsError && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ {modelsError}（使用{isFromCache ? '缓存' : '默认'}列表）
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h1 className="text-base font-semibold text-gray-800">设置</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {/* AI 配置 */}
        <Section id="ai" icon="🤖" title="AI 服务">
          <AIConfigSection />
        </Section>

        {/* 表格设置 */}
        <Section id="table" icon="📊" title="表格">
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">默认插入位置</label>
              <div className="flex gap-1">
                {(['auto', 'manual', 'newSheet'] as InsertPositionMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => settings.updateTableSettings({ positionMode: mode })}
                    className={`flex-1 py-1.5 text-xs rounded ${
                      settings.table.positionMode === mode
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mode === 'auto' ? '智能' : mode === 'manual' ? '手动' : '新表'}
                  </button>
                ))}
              </div>
            </div>
            <Toggle
              label="自动创建表格对象"
              description="转换为 Excel 表格"
              checked={settings.table.autoCreateTable}
              onChange={checked => settings.updateTableSettings({ autoCreateTable: checked })}
            />
            <Toggle
              label="自动调整列宽"
              checked={settings.table.autoFitColumns}
              onChange={checked => settings.updateTableSettings({ autoFitColumns: checked })}
            />
          </div>
        </Section>

        {/* 样式设置 */}
        <Section id="style" icon="🎨" title="样式">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">样式模式</label>
              <div className="flex gap-1">
                {(['template', 'ai', 'none'] as StyleMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => settings.updateStyleSettings({ styleMode: mode })}
                    className={`flex-1 py-1.5 text-xs rounded ${
                      settings.style.styleMode === mode
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mode === 'template' ? '模板' : mode === 'ai' ? 'AI' : '无样式'}
                  </button>
                ))}
              </div>
            </div>
            {settings.style.styleMode === 'template' && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">颜色主题</label>
                <div className="flex gap-1.5">
                  {THEMES.map(theme => (
                    <button
                      key={theme.value}
                      onClick={() => settings.updateStyleSettings({ defaultTheme: theme.value })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        settings.style.defaultTheme === theme.value
                          ? 'border-blue-500 scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: theme.color }}
                      title={theme.label}
                    />
                  ))}
                </div>
              </div>
            )}
            <Toggle
              label="启用条件格式"
              description="数据条、颜色阶梯等"
              checked={settings.style.enableConditionalFormat}
              onChange={checked =>
                settings.updateStyleSettings({ enableConditionalFormat: checked })
              }
            />
          </div>
        </Section>

        {/* 高级设置 */}
        <Section id="advanced" icon="⚙️" title="高级">
          <div className="space-y-2">
            <Toggle
              label="流式响应"
              description="实时显示生成过程"
              checked={settings.advanced.enableStreaming}
              onChange={checked => settings.updateAdvancedSettings({ enableStreaming: checked })}
            />
            <Toggle
              label="调试模式"
              checked={settings.advanced.debugMode}
              onChange={checked => settings.updateAdvancedSettings({ debugMode: checked })}
            />
            <div className="pt-2 flex gap-2">
              <Button
                variant="outline"
                onClick={settings.exportSettings}
                size="small"
                className="flex-1 text-xs"
              >
                导出
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                size="small"
                className="flex-1 text-xs"
              >
                导入
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
                      settings.importSettings(content);
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </div>
          </div>
        </Section>

        {/* 关于 */}
        <Section id="about" icon="ℹ️" title="关于">
          <div className="text-center py-2">
            <div className="text-2xl mb-1">📊</div>
            <div className="font-medium text-gray-800">Excel AI 助手</div>
            <div className="text-xs text-gray-400">v4.0.0</div>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>✅ 自然语言生成表格</div>
            <div>✅ 智能样式和图表</div>
            <div>✅ 撤销/重做支持</div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm('确定重置所有设置？')) settings.reset();
            }}
            size="small"
            className="w-full text-xs text-red-500 border-red-200 hover:bg-red-50 mt-2"
          >
            重置所有设置
          </Button>
        </Section>
      </div>

      {/* 底部 */}
      {settings.isDirty && (
        <div className="px-4 py-2 bg-blue-50 border-t text-xs text-blue-600 text-center">
          设置已自动保存
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
