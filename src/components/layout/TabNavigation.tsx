import React from 'react';
import { useTabStore, useTabActions } from '../../stores/tabStore';
import { TabType } from '../../types/tab.types';
import { cn } from '../../utils/cn';
import TabBar from '../ui/TabBar';

interface TabNavigationProps {
  className?: string;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ className }) => {
  const { tabs } = useTabStore();
  const actions = useTabActions();

  // 如果没有标签页，显示快速启动按钮
  if (tabs.length === 0) {
    return (
      <div className={cn('bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4', className)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">现代艺术风格面板</h1>
            <p className="text-white/60 text-sm">选择您要开始的工作台</p>
          </div>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:transform hover:-translate-y-0.5"
              onClick={() => {
                actions.addTab({
                  title: '数据工作台',
                  icon: '📊',
                  type: TabType.DATA_WORKSPACE,
                  isActive: false,
                  isModified: false,
                  isLoading: false,
                  hasError: false,
                  closable: true,
                  pinned: false,
                });
              }}
            >
              📊 数据工作台
            </button>
            <button
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-300 hover:transform hover:-translate-y-0.5"
              onClick={() => {
                actions.addTab({
                  title: '可视化中心',
                  icon: '📈',
                  type: TabType.CHART_CENTER,
                  isActive: false,
                  isModified: false,
                  isLoading: false,
                  hasError: false,
                  closable: true,
                  pinned: false,
                });
              }}
            >
              📈 可视化中心
            </button>
            <button
              className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 hover:transform hover:-translate-y-0.5"
              onClick={() => {
                actions.addTab({
                  title: '文件管理',
                  icon: '📁',
                  type: TabType.FILE_MANAGER,
                  isActive: false,
                  isModified: false,
                  isLoading: false,
                  hasError: false,
                  closable: true,
                  pinned: false,
                });
              }}
            >
              📁 文件管理
            </button>
            <button
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-lg hover:from-emerald-500 hover:to-teal-600 transition-all duration-300 hover:transform hover:-translate-y-0.5"
              onClick={() => {
                actions.addTab({
                  title: 'AI助手',
                  icon: '🤖',
                  type: TabType.AI_ASSISTANT,
                  isActive: false,
                  isModified: false,
                  isLoading: false,
                  hasError: false,
                  closable: true,
                  pinned: false,
                });
              }}
            >
              🤖 AI助手
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      <TabBar />
    </div>
  );
};

export default TabNavigation;