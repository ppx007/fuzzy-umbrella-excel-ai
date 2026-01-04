/**
 * 样式选择器组件
 * 允许用户选择表格颜色主题
 */

import React from 'react';
import { ColorThemeName, COLOR_THEMES } from '@/types/common';

/**
 * 样式选择器属性
 */
interface StyleSelectorProps {
  /** 当前选中的主题 */
  selectedTheme: ColorThemeName;
  /** 主题变更回调 */
  onThemeChange: (theme: ColorThemeName) => void;
  /** 是否启用条件格式 */
  enableConditionalFormat: boolean;
  /** 条件格式开关回调 */
  onConditionalFormatChange: (enabled: boolean) => void;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 主题预览色块组件
 */
const ThemePreviewBlock: React.FC<{
  theme: ColorThemeName;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({ theme, selected, onClick, disabled }) => {
  const themeConfig = COLOR_THEMES[theme];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-3 rounded-lg border-2 transition-all text-left
        ${
          selected
            ? 'border-blue-500 ring-2 ring-blue-200'
            : 'border-gray-200 hover:border-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
      `}
      title={themeConfig.name}
    >
      {/* 颜色预览条 */}
      <div className="flex gap-1 mb-2">
        <div
          className="w-6 h-6 rounded-sm border border-gray-200"
          style={{ backgroundColor: themeConfig.primary }}
          title="主色"
        />
        <div
          className="w-6 h-6 rounded-sm border border-gray-200"
          style={{ backgroundColor: themeConfig.secondary }}
          title="辅助色"
        />
        <div
          className="w-6 h-6 rounded-sm border border-gray-200"
          style={{ backgroundColor: themeConfig.accent }}
          title="强调色"
        />
      </div>

      {/* 主题名称 */}
      <span className="text-sm font-medium text-gray-700">{themeConfig.name}</span>

      {/* 选中指示器 */}
      {selected && (
        <div className="absolute top-1 right-1">
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  );
};

/**
 * 迷你表格预览组件
 */
const MiniTablePreview: React.FC<{ theme: ColorThemeName }> = ({ theme }) => {
  const themeConfig = COLOR_THEMES[theme];

  return (
    <div className="mt-3 border rounded overflow-hidden" style={{ fontSize: '10px' }}>
      {/* 表头 */}
      <div
        className="flex"
        style={{
          backgroundColor: themeConfig.primary,
          color: themeConfig.headerText,
        }}
      >
        <div className="flex-1 px-2 py-1 border-r border-white/20">列A</div>
        <div className="flex-1 px-2 py-1 border-r border-white/20">列B</div>
        <div className="flex-1 px-2 py-1">列C</div>
      </div>

      {/* 数据行 */}
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="flex border-t"
          style={{
            backgroundColor: i % 2 === 1 ? themeConfig.secondary : themeConfig.background,
            color: themeConfig.text,
          }}
        >
          <div className="flex-1 px-2 py-1 border-r border-gray-200">数据</div>
          <div className="flex-1 px-2 py-1 border-r border-gray-200">数据</div>
          <div className="flex-1 px-2 py-1">数据</div>
        </div>
      ))}
    </div>
  );
};

/**
 * 样式选择器组件
 */
export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedTheme,
  onThemeChange,
  enableConditionalFormat,
  onConditionalFormatChange,
  disabled = false,
}) => {
  const themes: ColorThemeName[] = [
    'professional',
    'fresh',
    'nature',
    'energetic',
    'elegant',
    'dark',
  ];

  return (
    <div className="space-y-4">
      {/* 主题网格 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">🎨 选择颜色主题</label>
        <div className="grid grid-cols-3 gap-2">
          {themes.map(theme => (
            <ThemePreviewBlock
              key={theme}
              theme={theme}
              selected={selectedTheme === theme}
              onClick={() => onThemeChange(theme)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* 预览 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">预览效果</label>
        <MiniTablePreview theme={selectedTheme} />
      </div>

      {/* 条件格式开关 */}
      <div className="pt-2 border-t">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={enableConditionalFormat}
              onChange={e => onConditionalFormatChange(e.target.checked)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-disabled:opacity-50 transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">智能条件格式</span>
            <p className="text-xs text-gray-500">自动为数值和状态列添加可视化效果</p>
          </div>
        </label>
      </div>

      {/* 条件格式说明 */}
      {enableConditionalFormat && (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg space-y-1">
          <p className="font-medium text-gray-600">将自动应用以下效果：</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>销售额、金额 → 数据条显示</li>
            <li>完成率、进度 → 颜色阶梯（红→黄→绿）</li>
            <li>状态列 → 根据值着色（完成=绿，进行中=黄，未完成=红）</li>
            <li>评分、排名 → 星级图标</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default StyleSelector;
