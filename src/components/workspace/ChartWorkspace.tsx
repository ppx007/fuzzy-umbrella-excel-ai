import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import GlassPanel from '../ui/GlassPanel';
import GradientButton from '../ui/GradientButton';
import AnimatedIcon from '../ui/AnimatedIcon';

interface ChartWorkspaceProps {
  tabId: string;
  className?: string;
}

const ChartWorkspace: React.FC<ChartWorkspaceProps> = ({ tabId: _, className }) => {
  const [activeView, setActiveView] = useState<'generator' | 'gallery' | 'templates'>('generator');

  const chartTypes = [
    {
      id: 'bar',
      name: '柱状图',
      icon: '📊',
      description: '适用于分类数据比较',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'line',
      name: '折线图',
      icon: '📈',
      description: '适用于趋势数据展示',
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'pie',
      name: '饼图',
      icon: '🥧',
      description: '适用于占比数据展示',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'scatter',
      name: '散点图',
      icon: '⚫',
      description: '适用于相关性分析',
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'area',
      name: '面积图',
      icon: '📉',
      description: '适用于累积数据展示',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      id: 'radar',
      name: '雷达图',
      icon: '🕸️',
      description: '适用于多维数据对比',
      color: 'from-teal-500 to-cyan-500',
    },
  ];

  const templates = [
    {
      id: 'sales-dashboard',
      name: '销售仪表板',
      description: '包含销售趋势、地区分布、产品占比',
      charts: ['line', 'bar', 'pie'],
      icon: '💼',
    },
    {
      id: 'financial-report',
      name: '财务报告',
      description: '收入、支出、利润分析图表',
      charts: ['area', 'bar', 'pie'],
      icon: '💰',
    },
    {
      id: 'marketing-analytics',
      name: '营销分析',
      description: '渠道效果、转化率、用户画像',
      charts: ['radar', 'scatter', 'bar'],
      icon: '📢',
    },
  ];

  const views = [
    {
      id: 'generator' as const,
      label: '图表生成',
      icon: '🎨',
      description: '创建新的图表',
    },
    {
      id: 'gallery' as const,
      label: '图表库',
      icon: '🖼️',
      description: '浏览图表模板',
    },
    {
      id: 'templates' as const,
      label: '模板中心',
      icon: '📚',
      description: '使用预设模板',
    },
  ];

  return (
    <div className={cn('h-full flex flex-col p-6', className)}>
      {/* 工作台标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">📈</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">可视化中心</h1>
            <p className="text-white/60">智能图表生成与数据分析平台</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 图表类型选择 */}
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">选择图表类型</h3>
                <div className="grid grid-cols-2 gap-3">
                  {chartTypes.map((chart) => (
                    <button
                      key={chart.id}
                      className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-left group"
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg bg-gradient-to-r flex items-center justify-center text-white text-sm mb-2',
                        chart.color
                      )}>
                        {chart.icon}
                      </div>
                      <div className="text-white font-medium text-sm mb-1">{chart.name}</div>
                      <div className="text-white/60 text-xs">{chart.description}</div>
                    </button>
                  ))}
                </div>
              </GlassPanel>

              {/* 数据源选择 */}
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">数据源</h3>
                <div className="space-y-3">
                  <button className="w-full p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-left">
                    <div className="flex items-center gap-3">
                      <AnimatedIcon icon="📊" size="md" />
                      <div>
                        <div className="text-white font-medium">选择表格数据</div>
                        <div className="text-white/60 text-sm">从当前工作表选择数据</div>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-left">
                    <div className="flex items-center gap-3">
                      <AnimatedIcon icon="📁" size="md" />
                      <div>
                        <div className="text-white font-medium">上传文件</div>
                        <div className="text-white/60 text-sm">CSV, Excel 文件</div>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-left">
                    <div className="flex items-center gap-3">
                      <AnimatedIcon icon="🤖" size="md" />
                      <div>
                        <div className="text-white font-medium">AI 生成数据</div>
                        <div className="text-white/60 text-sm">让AI创建示例数据</div>
                      </div>
                    </div>
                  </button>
                </div>
              </GlassPanel>
            </div>

            {/* 图表配置 */}
            <div className="mt-6">
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">图表配置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">图表标题</label>
                    <input
                      type="text"
                      placeholder="输入图表标题"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">X轴标签</label>
                    <input
                      type="text"
                      placeholder="X轴标签"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Y轴标签</label>
                    <input
                      type="text"
                      placeholder="Y轴标签"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">颜色主题</label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="default">默认</option>
                      <option value="blue">蓝色</option>
                      <option value="green">绿色</option>
                      <option value="purple">紫色</option>
                      <option value="orange">橙色</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <GradientButton variant="primary">
                    <AnimatedIcon icon="🎨" size="sm" />
                    生成图表
                  </GradientButton>
                  <GradientButton variant="secondary">
                    <AnimatedIcon icon="👁️" size="sm" />
                    预览
                  </GradientButton>
                </div>
              </GlassPanel>
            </div>
          </div>
        )}

        {activeView === 'gallery' && (
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <GlassPanel key={item} className="p-6 hover:scale-105 transition-transform duration-300">
                  <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-4 flex items-center justify-center">
                    <AnimatedIcon icon="📊" size="xl" className="text-white/60" />
                  </div>
                  <h4 className="text-white font-medium mb-2">图表示例 {item}</h4>
                  <p className="text-white/60 text-sm mb-4">这是一个示例图表的描述</p>
                  <div className="flex gap-2">
                    <GradientButton size="sm" variant="primary">
                      使用
                    </GradientButton>
                    <GradientButton size="sm" variant="secondary">
                      编辑
                    </GradientButton>
                  </div>
                </GlassPanel>
              ))}
            </div>
          </div>
        )}

        {activeView === 'templates' && (
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <GlassPanel key={template.id} className="p-6 hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl">{template.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{template.name}</h4>
                      <p className="text-white/60 text-sm">{template.description}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-white/80 text-sm mb-2">包含图表:</div>
                    <div className="flex gap-2">
                      {template.charts.map((chartId) => {
                        const chart = chartTypes.find(c => c.id === chartId);
                        return chart ? (
                          <div key={chartId} className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded text-white/80 text-xs">
                            <span>{chart.icon}</span>
                            <span>{chart.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                  
                  <GradientButton 
                    variant="primary" 
                    className="w-full"
                    onClick={() => {
                      // TODO: 实现模板应用
                    }}
                  >
                    使用模板
                  </GradientButton>
                </GlassPanel>
              ))}
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
                onClick={() => {
                  // TODO: 实现快速图表生成
                }}
              >
                <AnimatedIcon icon="⚡" size="sm" />
                快速生成
              </GradientButton>
              <GradientButton
                variant="success"
                size="sm"
                onClick={() => {
                  // TODO: 实现导出功能
                }}
              >
                <AnimatedIcon icon="💾" size="sm" />
                导出图表
              </GradientButton>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <AnimatedIcon icon="🎨" size="sm" />
            <span>可视化</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartWorkspace;