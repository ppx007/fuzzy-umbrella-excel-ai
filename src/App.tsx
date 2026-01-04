/**
 * 主应用组件
 * V2: 统一智能表格助手
 */

import React, { useState, useEffect } from 'react';
import { Card, Loading, TableGeneratorPanel, UnifiedAssistantPanel } from './components';
import { useOffice } from './hooks';

type TabType = 'assistant' | 'generator' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('assistant');
  const [isInitialized, setIsInitialized] = useState(false);

  const { isOfficeReady, hostApp } = useOffice();

  // 初始化
  useEffect(() => {
    const init = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsInitialized(true);
    };
    init();
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading size="large" text="正在初始化..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 头部 */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-lg font-bold flex items-center gap-2">
                <span className="text-xl">🤖</span>
                智能表格助手 V2
              </h1>
              <p className="text-xs text-blue-100 mt-0.5">
                {isOfficeReady ? `✅ 已连接 ${hostApp}` : '🔄 独立模式'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 标签页导航 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-4">
            {[
              { id: 'assistant', label: '🤖 AI 助手', desc: '对话式生成/修改/图表' },
              { id: 'generator', label: '📋 经典模式', desc: '模板式表格生成' },
              { id: 'settings', label: '⚙️ 设置', desc: '配置选项' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  py-3 px-2 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                title={tab.desc}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'assistant' && (
          <div className="h-full">
            <UnifiedAssistantPanel />
          </div>
        )}

        {activeTab === 'generator' && (
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <TableGeneratorPanel />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <Card title="⚙️ 应用设置">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Office 连接状态</h4>
                  <p className="text-sm text-gray-600">
                    {isOfficeReady
                      ? `✅ 已连接到 Microsoft ${hostApp}`
                      : '🔄 未连接到 Office 应用，当前为独立运行模式'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">V2 新功能</h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>🤖 AI 助手模式：对话式生成和修改表格</li>
                    <li>✏️ 导入现有表格并用自然语言修改</li>
                    <li>📈 自然语言创建图表</li>
                    <li>↩️ 撤销/重做支持（最多50步）</li>
                    <li>💬 连续对话，保持上下文</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">版本信息</h4>
                  <p className="text-sm text-gray-600">v2.1.0 - AI 助手增强版</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* 底部 - 仅在非助手模式显示 */}
      {activeTab !== 'assistant' && (
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <p className="text-center text-xs text-gray-500">
              © 2024 智能表格助手 V2 - Office Add-in | Powered by AI
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
