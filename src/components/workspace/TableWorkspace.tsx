import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import GlassPanel from '../ui/GlassPanel';
import GradientButton from '../ui/GradientButton';
import AnimatedIcon from '../ui/AnimatedIcon';
import { TableGeneratorPanel } from '../TableGeneratorPanel';

interface TableWorkspaceProps {
  tabId: string;
  className?: string;
}

const TableWorkspace: React.FC<TableWorkspaceProps> = ({ tabId: _, className }) => {
  const [activeView, setActiveView] = useState<'generator' | 'preview' | 'history'>('generator');

  const views = [
    {
      id: 'generator' as const,
      label: '表格生成',
      icon: '🚀',
      description: '通过AI生成表格',
    },
    {
      id: 'preview' as const,
      label: '表格预览',
      icon: '👁️',
      description: '预览生成的表格',
    },
    {
      id: 'history' as const,
      label: '历史记录',
      icon: '📋',
      description: '查看操作历史',
    },
  ];

  return (
    <div className={cn('h-full flex flex-col p-6', className)}>
      {/* 工作台标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">数据工作台</h1>
            <p className="text-white/60">智能表格生成与数据处理中心</p>
          </div>
        </div>
      </div>

      {/* 视图切换器 */}
      <div className="mb-6">
        <div className="flex gap-2">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300',
                activeView === view.id
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <AnimatedIcon icon={view.icon} size="sm" />
              <span className="font-medium">{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'generator' && (
          <div className="h-full overflow-y-auto">
            <GlassPanel className="h-full">
              <TableGeneratorPanel />
            </GlassPanel>
          </div>
        )}

        {activeView === 'preview' && (
          <div className="h-full flex items-center justify-center">
            <GlassPanel className="p-8 text-center max-w-md">
              <AnimatedIcon icon="👁️" size="xl" className="mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">表格预览</h3>
              <p className="text-white/60 mb-4">
                生成表格后在此处预览结果
              </p>
              <GradientButton
                variant="primary"
                onClick={() => setActiveView('generator')}
              >
                去生成表格
              </GradientButton>
            </GlassPanel>
          </div>
        )}

        {activeView === 'history' && (
          <div className="h-full flex items-center justify-center">
            <GlassPanel className="p-8 text-center max-w-md">
              <AnimatedIcon icon="📋" size="xl" className="mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">历史记录</h3>
              <p className="text-white/60 mb-4">
                查看您的表格生成历史
              </p>
              <GradientButton
                variant="secondary"
                onClick={() => {
                  // TODO: 实现历史记录功能
                }}
              >
                查看历史
              </GradientButton>
            </GlassPanel>
          </div>
        )}
      </div>

      {/* 快捷操作栏 */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm">快捷操作:</span>
            <div className="flex gap-2">
              <GradientButton
                variant="accent"
                size="sm"
                onClick={() => setActiveView('generator')}
              >
                <AnimatedIcon icon="➕" size="sm" />
                新建表格
              </GradientButton>
              <GradientButton
                variant="success"
                size="sm"
                onClick={() => {
                  // TODO: 实现导入功能
                }}
              >
                <AnimatedIcon icon="📥" size="sm" />
                导入数据
              </GradientButton>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <AnimatedIcon icon="⚡" size="sm" />
            <span>AI 驱动</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableWorkspace;