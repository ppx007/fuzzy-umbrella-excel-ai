import React from 'react';
import { useTabStore, useTabActions } from '../../stores/tabStore';
import { cn } from '../../utils/cn';
import AnimatedIcon from '../ui/AnimatedIcon';
import GradientButton from '../ui/GradientButton';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const { tabs, activeTabId } = useTabStore();
  const actions = useTabActions();

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <header className={cn(
      'bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between relative z-10',
      className
    )}>
      {/* 左侧 - Logo和标题 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🎨</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">现代艺术面板</h1>
            <p className="text-xs text-white/60">数据分析师工作台</p>
          </div>
        </div>
      </div>

      {/* 中间 - 当前标签页信息 */}
      <div className="flex-1 flex items-center justify-center">
        {activeTab ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
            <AnimatedIcon icon={activeTab.icon} size="sm" />
            <span className="text-white font-medium">{activeTab.title}</span>
            {activeTab.isModified && (
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            )}
            {activeTab.isLoading && (
              <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        ) : (
          <div className="text-white/60 text-sm">选择一个工作台开始</div>
        )}
      </div>

      {/* 右侧 - 操作按钮 */}
      <div className="flex items-center gap-3">
        {/* 快速操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="新建工作台"
            onClick={() => {
              // TODO: 显示工作台选择菜单
            }}
          >
            <AnimatedIcon icon="➕" size="sm" />
          </button>
          
          <button
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="历史记录"
            onClick={() => {
              // TODO: 显示历史记录
            }}
          >
            <AnimatedIcon icon="📋" size="sm" />
          </button>
          
          <button
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="帮助"
            onClick={() => {
              // TODO: 显示帮助信息
            }}
          >
            <AnimatedIcon icon="❓" size="sm" />
          </button>
        </div>

        {/* 设置按钮 */}
        <GradientButton
          variant="accent"
          size="sm"
          onClick={() => {
            actions.addTab({
              title: '系统设置',
              icon: '⚙️',
              type: 'settings' as any,
              isActive: false,
              isModified: false,
              isLoading: false,
              hasError: false,
              closable: true,
              pinned: false,
            });
          }}
        >
          <AnimatedIcon icon="⚙️" size="sm" />
          设置
        </GradientButton>

        {/* 用户菜单 */}
        <div className="relative">
          <button className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all">
            <span className="text-white text-sm font-medium">U</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;