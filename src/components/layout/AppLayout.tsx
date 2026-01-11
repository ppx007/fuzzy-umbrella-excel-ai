import React from 'react';
import { useTabStore } from '../../stores/tabStore';
import { TabType } from '../../types/tab.types';
import { cn } from '../../utils/cn';
import TabNavigation from './TabNavigation';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { TableWorkspace, ChartWorkspace, FileWorkspace, AIWorkspace, SettingsWorkspace } from '../workspace';

interface AppLayoutProps {
  className?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ className }) => {
  const { activeTabId, tabs } = useTabStore();

  // 获取当前活动标签页
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // 渲染工作台内容
  const renderWorkspaceContent = () => {
    if (!activeTab) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-white/80 mb-2">欢迎使用现代艺术风格面板</h2>
            <p className="text-white/60">选择一个工作台开始您的数据分析之旅</p>
          </div>
        </div>
      );
    }

    switch (activeTab.type) {
      case TabType.DATA_WORKSPACE:
        return <TableWorkspace tabId={activeTab.id} />;
      case TabType.CHART_CENTER:
        return <ChartWorkspace tabId={activeTab.id} />;
      case TabType.FILE_MANAGER:
        return <FileWorkspace tabId={activeTab.id} />;
      case TabType.AI_ASSISTANT:
        return <AIWorkspace tabId={activeTab.id} />;
      case TabType.SETTINGS:
        return <SettingsWorkspace tabId={activeTab.id} />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-white/80 mb-2">{activeTab.title}</h3>
              <p className="text-white/60">此工作台正在开发中...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn(
      'h-screen w-screen flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden',
      className
    )}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* 顶部导航栏 */}
      <Header />

      {/* 标签页导航 */}
      <TabNavigation />

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 侧边工具栏 */}
        <Sidebar />

        {/* 主内容区 */}
        <main className="flex-1 relative">
          {renderWorkspaceContent()}
        </main>
      </div>

      {/* 底部状态栏 */}
      <Footer />
    </div>
  );
};

export default AppLayout;