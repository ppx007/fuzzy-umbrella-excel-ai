import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import GlassPanel from '../ui/GlassPanel';
import GradientButton from '../ui/GradientButton';
import AnimatedIcon from '../ui/AnimatedIcon';
import { UnifiedAssistantPanel } from '../UnifiedAssistantPanel';

interface AIWorkspaceProps {
  tabId: string;
  className?: string;
}

const AIWorkspace: React.FC<AIWorkspaceProps> = ({ tabId: _, className }) => {
  const [activeView, setActiveView] = useState<'chat' | 'templates' | 'history'>('chat');

  const views = [
    {
      id: 'chat' as const,
      label: 'AI 对话',
      icon: '💬',
      description: '与AI助手对话',
    },
    {
      id: 'templates' as const,
      label: '智能模板',
      icon: '📋',
      description: '常用对话模板',
    },
    {
      id: 'history' as const,
      label: '对话历史',
      icon: '📚',
      description: '查看历史对话',
    },
  ];

  const quickTemplates = [
    {
      id: 'table-generation',
      title: '表格生成',
      description: '快速生成各种类型的表格',
      icon: '📊',
      prompt: '请帮我创建一个...',
      category: '表格',
    },
    {
      id: 'data-analysis',
      title: '数据分析',
      description: '分析数据并生成报告',
      icon: '📈',
      prompt: '请分析这些数据...',
      category: '分析',
    },
    {
      id: 'chart-creation',
      title: '图表创建',
      description: '根据数据创建图表',
      icon: '📉',
      prompt: '请为这些数据创建图表...',
      category: '可视化',
    },
    {
      id: 'data-cleaning',
      title: '数据清洗',
      description: '清理和整理数据',
      icon: '🧹',
      prompt: '请帮我清洗这些数据...',
      category: '处理',
    },
    {
      id: 'formula-help',
      title: '公式帮助',
      description: 'Excel 公式编写帮助',
      icon: '🧮',
      prompt: '请帮我写一个Excel公式...',
      category: '公式',
    },
    {
      id: 'automation',
      title: '自动化建议',
      description: '工作流程自动化建议',
      icon: '⚡',
      prompt: '请帮我优化工作流程...',
      category: '自动化',
    },
  ];

  const categories = ['全部', '表格', '分析', '可视化', '处理', '公式', '自动化'];

  const [selectedCategory, setSelectedCategory] = useState('全部');

  const filteredTemplates = selectedCategory === '全部' 
    ? quickTemplates 
    : quickTemplates.filter(template => template.category === selectedCategory);

  return (
    <div className={cn('h-full flex flex-col p-6', className)}>
      {/* 工作台标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI助手</h1>
            <p className="text-white/60">智能对话与数据分析助手</p>
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
        {activeView === 'chat' && (
          <div className="h-full">
            <GlassPanel className="h-full">
              <UnifiedAssistantPanel />
            </GlassPanel>
          </div>
        )}

        {activeView === 'templates' && (
          <div className="h-full overflow-y-auto">
            {/* 分类筛选 */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-all duration-300',
                      selectedCategory === category
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 模板网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <GlassPanel 
                  key={template.id} 
                  className="p-6 hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onClick={() => {
                    // TODO: 将模板应用到对话中
                    setActiveView('chat');
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl">{template.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{template.title}</h4>
                      <span className="text-white/60 text-xs bg-white/10 px-2 py-1 rounded">
                        {template.category}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-white/60 text-sm mb-4">{template.description}</p>
                  
                  <div className="bg-white/5 rounded-lg p-3 mb-4">
                    <div className="text-white/80 text-sm font-mono">{template.prompt}</div>
                  </div>
                  
                  <GradientButton 
                    variant="primary" 
                    size="sm"
                    className="w-full"
                  >
                    <AnimatedIcon icon="🚀" size="sm" />
                    使用模板
                  </GradientButton>
                </GlassPanel>
              ))}
            </div>
          </div>
        )}

        {activeView === 'history' && (
          <div className="h-full overflow-y-auto">
            <div className="space-y-4">
              {/* 搜索和筛选 */}
              <GlassPanel className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="搜索对话历史..."
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <GradientButton variant="secondary">
                    <AnimatedIcon icon="🔍" size="sm" />
                    搜索
                  </GradientButton>
                </div>
              </GlassPanel>

              {/* 对话历史列表 */}
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <GlassPanel key={item} className="p-4 hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AnimatedIcon icon="💬" size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-medium truncate">对话会话 {item}</h4>
                          <span className="text-white/40 text-xs">2 小时前</span>
                        </div>
                        <p className="text-white/60 text-sm mb-2 line-clamp-2">
                          用户: 请帮我创建一个销售报表...
                        </p>
                        <p className="text-white/60 text-sm line-clamp-2">
                          AI: 我来帮您创建一个专业的销售报表...
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-white/40 text-xs">
                          <span className="flex items-center gap-1">
                            <AnimatedIcon icon="💬" size="sm" />
                            12 条消息
                          </span>
                          <span className="flex items-center gap-1">
                            <AnimatedIcon icon="⏱️" size="sm" />
                            5 分钟
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <GradientButton size="sm" variant="secondary">
                          继续
                        </GradientButton>
                        <GradientButton size="sm" variant="secondary">
                          删除
                        </GradientButton>
                      </div>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            </div>
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
                onClick={() => setActiveView('chat')}
              >
                <AnimatedIcon icon="💬" size="sm" />
                新对话
              </GradientButton>
              <GradientButton
                variant="success"
                size="sm"
                onClick={() => {
                  // TODO: 实现导出对话
                }}
              >
                <AnimatedIcon icon="📤" size="sm" />
                导出
              </GradientButton>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <AnimatedIcon icon="🤖" size="sm" />
            <span>AI 驱动</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWorkspace;