import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import GlassPanel from '../ui/GlassPanel';
import GradientButton from '../ui/GradientButton';
import AnimatedIcon from '../ui/AnimatedIcon';
import { ApiPresetsPanel } from '../ApiPresetsPanel';
// import { SettingsPanel } from '../SettingsPanel';

interface SettingsWorkspaceProps {
  tabId: string;
  className?: string;
}

const SettingsWorkspace: React.FC<SettingsWorkspaceProps> = ({ className }) => {
  const [activeView, setActiveView] = useState<'api-presets' | 'general' | 'appearance' | 'advanced'>('api-presets');

  const views = [
    {
      id: 'api-presets' as const,
      label: 'API 预设',
      icon: '🔑',
      description: '管理API配置预设',
    },
    {
      id: 'general' as const,
      label: '常规设置',
      icon: '⚙️',
      description: '基本系统设置',
    },
    {
      id: 'appearance' as const,
      label: '外观设置',
      icon: '🎨',
      description: '界面外观配置',
    },
    {
      id: 'advanced' as const,
      label: '高级设置',
      icon: '🔧',
      description: '高级配置选项',
    },
  ];

  // const apiPresets = [
  //   {
  //     id: 'openai-gpt4',
  //     name: 'OpenAI GPT-4',
  //     description: 'OpenAI GPT-4 API 配置',
  //     provider: 'OpenAI',
  //     model: 'gpt-4',
  //     status: 'active',
  //     color: 'from-green-500 to-emerald-500',
  //   },
  //   {
  //     id: 'claude-3',
  //     name: 'Anthropic Claude',
  //     description: 'Claude 3 API 配置',
  //     provider: 'Anthropic',
  //     model: 'claude-3-sonnet',
  //     status: 'inactive',
  //     color: 'from-purple-500 to-pink-500',
  //   },
  //   {
  //     id: 'minimax',
  //     name: 'MiniMax',
  //     description: 'MiniMax API 配置',
  //     provider: 'MiniMax',
  //     model: 'abab6.5s-chat',
  //     status: 'active',
  //     color: 'from-blue-500 to-cyan-500',
  //   },
  // ];

  const systemInfo = {
    version: '2.1.0',
    build: '2024.01.11',
    lastUpdate: '2024-01-10',
    license: 'MIT',
    support: 'support@example.com',
  };

  return (
    <div className={cn('h-full flex flex-col p-6', className)}>
      {/* 工作台标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">⚙️</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">系统设置</h1>
            <p className="text-white/60">配置管理、API预设与系统设置</p>
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
        {activeView === 'api-presets' && (
          <div className="h-full">
            <GlassPanel className="h-full">
              <ApiPresetsPanel />
            </GlassPanel>
          </div>
        )}

        {activeView === 'general' && (
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 基本设置 */}
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">基本设置</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">默认语言</label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="zh-CN">简体中文</option>
                      <option value="en-US">English</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">时区</label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                      <option value="America/New_York">America/New_York (UTC-5)</option>
                      <option value="Europe/London">Europe/London (UTC+0)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">日期格式</label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="YYYY-MM-DD">2024-01-11</option>
                      <option value="MM/DD/YYYY">01/11/2024</option>
                      <option value="DD/MM/YYYY">11/01/2024</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">自动保存</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">启用通知</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                    </button>
                  </div>
                </div>
              </GlassPanel>

              {/* 数据设置 */}
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">数据设置</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">默认行数</label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="5">5 行</option>
                      <option value="10">10 行</option>
                      <option value="20">20 行</option>
                      <option value="50">50 行</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">数据验证</label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="strict">严格模式</option>
                      <option value="lenient">宽松模式</option>
                      <option value="disabled">禁用</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">自动创建表格</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">智能数据类型检测</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>
                </div>
              </GlassPanel>
            </div>

            {/* 操作按钮 */}
            <div className="mt-6">
              <GlassPanel className="p-6">
                <div className="flex gap-3">
                  <GradientButton variant="primary">
                    <AnimatedIcon icon="💾" size="sm" />
                    保存设置
                  </GradientButton>
                  <GradientButton variant="secondary">
                    <AnimatedIcon icon="🔄" size="sm" />
                    重置为默认
                  </GradientButton>
                  <GradientButton variant="secondary">
                    <AnimatedIcon icon="📤" size="sm" />
                    导出配置
                  </GradientButton>
                </div>
              </GlassPanel>
            </div>
          </div>
        )}

        {activeView === 'appearance' && (
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 主题设置 */}
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">主题设置</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-3">选择主题</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'modern-artistic', name: '现代艺术', preview: 'from-purple-500 to-pink-500' },
                        { id: 'dark-blue', name: '深蓝科技', preview: 'from-blue-600 to-indigo-600' },
                        { id: 'emerald', name: '翡翠绿', preview: 'from-emerald-500 to-teal-500' },
                        { id: 'sunset', name: '日落橙', preview: 'from-orange-500 to-red-500' },
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                        >
                          <div className={cn(
                            'w-full h-8 rounded mb-2 bg-gradient-to-r',
                            theme.preview
                          )} />
                          <div className="text-white text-sm">{theme.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">透明度</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      defaultValue="0.8"
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-white/60 text-xs mt-1">
                      <span>透明</span>
                      <span>80%</span>
                      <span>不透明</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">模糊强度</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="5"
                      defaultValue="20"
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-white/60 text-xs mt-1">
                      <span>无</span>
                      <span>20px</span>
                      <span>强</span>
                    </div>
                  </div>
                </div>
              </GlassPanel>

              {/* 字体设置 */}
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">字体设置</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">字体大小</label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="small">小</option>
                      <option value="medium" selected>中</option>
                      <option value="large">大</option>
                      <option value="extra-large">超大</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">字体族</label>
                    <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="system">系统默认</option>
                      <option value="sans">无衬线字体</option>
                      <option value="serif">衬线字体</option>
                      <option value="mono">等宽字体</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">启用动画</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">高对比度模式</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                    </button>
                  </div>
                </div>
              </GlassPanel>
            </div>
          </div>
        )}

        {activeView === 'advanced' && (
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 性能设置 */}
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">性能设置</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">最大并发请求</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      defaultValue="3"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">请求超时 (秒)</label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      defaultValue="60"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">启用缓存</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">调试模式</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                    </button>
                  </div>
                </div>
              </GlassPanel>

              {/* 系统信息 */}
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">系统信息</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/80 text-sm">版本号</span>
                    <span className="text-white">{systemInfo.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80 text-sm">构建号</span>
                    <span className="text-white">{systemInfo.build}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80 text-sm">最后更新</span>
                    <span className="text-white">{systemInfo.lastUpdate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80 text-sm">许可证</span>
                    <span className="text-white">{systemInfo.license}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80 text-sm">支持邮箱</span>
                    <span className="text-white">{systemInfo.support}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <GradientButton size="sm" variant="secondary">
                      <AnimatedIcon icon="🔄" size="sm" />
                      检查更新
                    </GradientButton>
                    <GradientButton size="sm" variant="secondary">
                      <AnimatedIcon icon="📋" size="sm" />
                      生成报告
                    </GradientButton>
                  </div>
                </div>
              </GlassPanel>
            </div>

            {/* 危险操作 */}
            <div className="mt-6">
              <GlassPanel className="p-6 border border-red-500/20">
                <h3 className="text-lg font-semibold text-red-400 mb-4">危险操作</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">清除所有数据</div>
                      <div className="text-white/60 text-sm">删除所有用户数据和设置</div>
                    </div>
                    <GradientButton variant="error" size="sm">
                      <AnimatedIcon icon="🗑️" size="sm" />
                      清除数据
                    </GradientButton>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">重置为出厂设置</div>
                      <div className="text-white/60 text-sm">将所有设置恢复为默认值</div>
                    </div>
                    <GradientButton variant="error" size="sm">
                      <AnimatedIcon icon="🔄" size="sm" />
                      重置
                    </GradientButton>
                  </div>
                </div>
              </GlassPanel>
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
                  // TODO: 实现导入配置
                }}
              >
                <AnimatedIcon icon="📥" size="sm" />
                导入配置
              </GradientButton>
              <GradientButton
                variant="success"
                size="sm"
                onClick={() => {
                  // TODO: 实现导出配置
                }}
              >
                <AnimatedIcon icon="📤" size="sm" />
                导出配置
              </GradientButton>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <AnimatedIcon icon="⚙️" size="sm" />
            <span>系统设置</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsWorkspace;