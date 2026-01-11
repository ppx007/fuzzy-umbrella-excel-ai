import React, { useState } from 'react';
import { useTabActions } from '../../stores/tabStore';
import { TabType } from '../../types/tab.types';
import { cn } from '../../utils/cn';
import AnimatedIcon from '../ui/AnimatedIcon';
import GlassPanel from '../ui/GlassPanel';

interface SidebarProps {
  className?: string;
}

interface ToolItem {
  id: string;
  label: string;
  icon: string;
  type: TabType;
  description: string;
  color: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const actions = useTabActions();

  const tools: ToolItem[] = [
    {
      id: 'data-workspace',
      label: '数据工作台',
      icon: '📊',
      type: TabType.DATA_WORKSPACE,
      description: '表格生成、修改、数据处理',
      color: 'from-blue-500 to-purple-600',
    },
    {
      id: 'chart-center',
      label: '可视化中心',
      icon: '📈',
      type: TabType.CHART_CENTER,
      description: '图表生成、修改、统计分析',
      color: 'from-pink-500 to-red-500',
    },
    {
      id: 'file-manager',
      label: '文件管理',
      icon: '📁',
      type: TabType.FILE_MANAGER,
      description: '文件上传、导入、导出',
      color: 'from-cyan-400 to-blue-500',
    },
    {
      id: 'ai-assistant',
      label: 'AI助手',
      icon: '🤖',
      type: TabType.AI_ASSISTANT,
      description: '统一对话界面、智能建议',
      color: 'from-emerald-400 to-teal-500',
    },
    {
      id: 'settings',
      label: '系统设置',
      icon: '⚙️',
      type: TabType.SETTINGS,
      description: '配置管理、API预设',
      color: 'from-orange-400 to-yellow-500',
    },
  ];

  const quickActions = [
    {
      id: 'history',
      label: '历史记录',
      icon: '📋',
      description: '查看操作历史',
    },
    {
      id: 'templates',
      label: '模板库',
      icon: '📚',
      description: '常用模板',
    },
    {
      id: 'export',
      label: '导出',
      icon: '💾',
      description: '导出数据',
    },
    {
      id: 'help',
      label: '帮助',
      icon: '❓',
      description: '使用帮助',
    },
  ];

  const handleToolClick = (tool: ToolItem) => {
    actions.addTab({
      title: tool.label,
      icon: tool.icon,
      type: tool.type,
      isActive: false,
      isModified: false,
      isLoading: false,
      hasError: false,
      closable: true,
      pinned: false,
    });
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    // TODO: 实现快速操作
    console.log('Quick action:', action.id);
  };

  return (
    <aside className={cn(
      'bg-white/5 backdrop-blur-xl border-r border-white/10 transition-all duration-300 relative z-10',
      isCollapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* 折叠按钮 */}
      <button
        className="absolute -right-3 top-6 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors z-20"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <AnimatedIcon 
          icon={isCollapsed ? '▶' : '◀'} 
          size="sm" 
          color="white"
        />
      </button>

      <div className="p-4 h-full flex flex-col">
        {/* 工具区域 */}
        <div className="mb-6">
          {!isCollapsed && (
            <h3 className="text-sm font-semibold text-white/80 mb-3 px-2">工作台工具</h3>
          )}
          <div className="space-y-2">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="group cursor-pointer"
                onClick={() => handleToolClick(tool)}
              >
                <GlassPanel
                  variant="light"
                  hover={false}
                  className={cn(
                    'p-3 transition-all duration-300 hover:scale-105',
                    isCollapsed ? 'justify-center' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    'flex items-center gap-3',
                    isCollapsed ? 'justify-center' : 'justify-start'
                  )}>
                    <div className={cn(
                      'w-8 h-8 rounded-lg bg-gradient-to-r flex items-center justify-center text-white text-sm',
                      tool.color
                    )}>
                      {tool.icon}
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {tool.label}
                        </div>
                        <div className="text-xs text-white/60 truncate">
                          {tool.description}
                        </div>
                      </div>
                    )}
                  </div>
                </GlassPanel>
              </div>
            ))}
          </div>
        </div>

        {/* 快速操作 */}
        <div className="mb-6">
          {!isCollapsed && (
            <h3 className="text-sm font-semibold text-white/80 mb-3 px-2">快速操作</h3>
          )}
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                className={cn(
                  'w-full p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-left group',
                  isCollapsed && 'px-0 justify-center'
                )}
                onClick={() => handleQuickAction(action)}
                title={isCollapsed ? action.label : ''}
              >
                <div className={cn(
                  'flex items-center gap-2',
                  isCollapsed ? 'justify-center' : 'justify-start'
                )}>
                  <AnimatedIcon 
                    icon={action.icon} 
                    size="sm" 
                    color="white"
                    className="group-hover:scale-110 transition-transform"
                  />
                  {!isCollapsed && (
                    <span className="text-sm text-white">{action.label}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 状态信息 */}
        <div className="mt-auto">
          {!isCollapsed ? (
            <GlassPanel variant="light" className="p-3">
              <div className="text-xs text-white/60 space-y-1">
                <div className="flex justify-between">
                  <span>活跃工作台</span>
                  <span className="text-white">1</span>
                </div>
                <div className="flex justify-between">
                  <span>总工作台</span>
                  <span className="text-white">5</span>
                </div>
                <div className="flex justify-between">
                  <span>状态</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400">正常</span>
                  </div>
                </div>
              </div>
            </GlassPanel>
          ) : (
            <div className="flex justify-center">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;