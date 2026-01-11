import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import GlassPanel from '../ui/GlassPanel';
import GradientButton from '../ui/GradientButton';
import AnimatedIcon from '../ui/AnimatedIcon';
import { FileUpload } from '../FileUpload';

interface FileWorkspaceProps {
  tabId: string;
  className?: string;
}

const FileWorkspace: React.FC<FileWorkspaceProps> = ({ tabId: _, className }) => {
  const [activeView, setActiveView] = useState<'upload' | 'manage' | 'process'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const views = [
    {
      id: 'upload' as const,
      label: '文件上传',
      icon: '📤',
      description: '上传和处理文件',
    },
    {
      id: 'manage' as const,
      label: '文件管理',
      icon: '📁',
      description: '管理已上传文件',
    },
    {
      id: 'process' as const,
      label: '数据处理',
      icon: '⚙️',
      description: '处理和分析数据',
    },
  ];

  const supportedFormats = [
    {
      type: 'Excel',
      extensions: ['.xlsx', '.xls'],
      icon: '📊',
      description: 'Microsoft Excel 文件',
      color: 'from-green-500 to-emerald-500',
    },
    {
      type: 'CSV',
      extensions: ['.csv'],
      icon: '📄',
      description: '逗号分隔值文件',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      type: 'JSON',
      extensions: ['.json'],
      icon: '🗂️',
      description: 'JSON 数据文件',
      color: 'from-purple-500 to-pink-500',
    },
    {
      type: 'Text',
      extensions: ['.txt', '.log'],
      icon: '📝',
      description: '文本文件',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const handleFileUploaded = (file: any) => {
    setUploadedFiles(prev => [...prev, file]);
  };

  const handleFileRemoved = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className={cn('h-full flex flex-col p-6', className)}>
      {/* 工作台标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">📁</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">文件管理</h1>
            <p className="text-white/60">文件上传、导入与数据处理中心</p>
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
        {activeView === 'upload' && (
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 文件上传区域 */}
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">上传文件</h3>
                <FileUpload
                  onFileUploaded={handleFileUploaded}
                  onFileRemoved={() => handleFileRemoved('')}
                  currentFile={null}
                  disabled={false}
                  compact={false}
                />
              </GlassPanel>

              {/* 支持的文件格式 */}
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">支持格式</h3>
                <div className="space-y-3">
                  {supportedFormats.map((format) => (
                    <div
                      key={format.type}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg bg-gradient-to-r flex items-center justify-center text-white',
                        format.color
                      )}>
                        {format.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{format.type}</div>
                        <div className="text-white/60 text-sm">{format.description}</div>
                        <div className="text-white/40 text-xs mt-1">
                          {format.extensions.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>

            {/* 上传说明 */}
            <div className="mt-6">
              <GlassPanel className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">上传说明</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-medium mb-2">📋 文件要求</h4>
                    <ul className="text-white/60 text-sm space-y-1">
                      <li>• 文件大小不超过 10MB</li>
                      <li>• 确保文件格式正确</li>
                      <li>• 数据格式规范，便于解析</li>
                      <li>• 建议使用 UTF-8 编码</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">🔧 处理功能</h4>
                    <ul className="text-white/60 text-sm space-y-1">
                      <li>• 自动识别数据类型</li>
                      <li>• 数据清洗和验证</li>
                      <li>• 格式转换和标准化</li>
                      <li>• 智能数据解析</li>
                    </ul>
                  </div>
                </div>
              </GlassPanel>
            </div>
          </div>
        )}

        {activeView === 'manage' && (
          <div className="h-full overflow-y-auto">
            {uploadedFiles.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <GlassPanel className="p-8 text-center max-w-md">
                  <AnimatedIcon icon="📁" size="xl" className="mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">暂无文件</h3>
                  <p className="text-white/60 mb-4">
                    您还没有上传任何文件
                  </p>
                  <GradientButton
                    variant="primary"
                    onClick={() => setActiveView('upload')}
                  >
                    去上传文件
                  </GradientButton>
                </GlassPanel>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploadedFiles.map((file, index) => (
                  <GlassPanel key={index} className="p-6 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">📄</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{file.name}</h4>
                        <p className="text-white/60 text-sm">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-white/80 text-sm mb-2">文件信息:</div>
                      <div className="text-white/60 text-xs space-y-1">
                        <div>类型: {file.type}</div>
                        <div>状态: {file.status || '已上传'}</div>
                        {file.parsedData && (
                          <div>数据: {file.parsedData.totalRows} 行 × {file.parsedData.columns.length} 列</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <GradientButton 
                        size="sm" 
                        variant="primary"
                        onClick={() => {
                          // TODO: 实现文件处理
                        }}
                      >
                        处理
                      </GradientButton>
                      <GradientButton 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleFileRemoved(file.id)}
                      >
                        删除
                      </GradientButton>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'process' && (
          <div className="h-full overflow-y-auto">
            {uploadedFiles.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <GlassPanel className="p-8 text-center max-w-md">
                  <AnimatedIcon icon="⚙️" size="xl" className="mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">数据处理</h3>
                  <p className="text-white/60 mb-4">
                    请先上传文件再进行数据处理
                  </p>
                  <GradientButton
                    variant="primary"
                    onClick={() => setActiveView('upload')}
                  >
                    去上传文件
                  </GradientButton>
                </GlassPanel>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 处理选项 */}
                <GlassPanel className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">数据处理选项</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-left">
                      <AnimatedIcon icon="🧹" size="md" className="mb-2" />
                      <div className="text-white font-medium text-sm">数据清洗</div>
                      <div className="text-white/60 text-xs">去除重复和错误数据</div>
                    </button>
                    
                    <button className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-left">
                      <AnimatedIcon icon="🔄" size="md" className="mb-2" />
                      <div className="text-white font-medium text-sm">格式转换</div>
                      <div className="text-white/60 text-xs">转换数据格式</div>
                    </button>
                    
                    <button className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-left">
                      <AnimatedIcon icon="📊" size="md" className="mb-2" />
                      <div className="text-white font-medium text-sm">统计分析</div>
                      <div className="text-white/60 text-xs">生成统计报告</div>
                    </button>
                    
                    <button className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-left">
                      <AnimatedIcon icon="🎯" size="md" className="mb-2" />
                      <div className="text-white font-medium text-sm">智能分析</div>
                      <div className="text-white/60 text-xs">AI 驱动的数据分析</div>
                    </button>
                  </div>
                </GlassPanel>

                {/* 处理历史 */}
                <GlassPanel className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">处理历史</h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                          <AnimatedIcon icon="✅" size="sm" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">数据清洗完成</div>
                          <div className="text-white/60 text-xs">处理了 1,234 条记录</div>
                        </div>
                        <div className="text-white/40 text-xs">2 分钟前</div>
                      </div>
                    ))}
                  </div>
                </GlassPanel>
              </div>
            )}
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
                onClick={() => setActiveView('upload')}
              >
                <AnimatedIcon icon="📤" size="sm" />
                上传文件
              </GradientButton>
              <GradientButton
                variant="success"
                size="sm"
                onClick={() => {
                  // TODO: 实现批量处理
                }}
              >
                <AnimatedIcon icon="⚡" size="sm" />
                批量处理
              </GradientButton>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <AnimatedIcon icon="📁" size="sm" />
            <span>{uploadedFiles.length} 个文件</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileWorkspace;