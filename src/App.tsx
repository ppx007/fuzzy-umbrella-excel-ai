/**
 * 主应用组件
 * 现代艺术风格界面 - 多标签页架构
 */

import React, { useState, useEffect } from 'react';
import { Loading } from './components/common';
import { useOffice } from './hooks';
import { AppLayout } from './components/layout';
import './styles/modern-artistic.css';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isOfficeReady, hostApp } = useOffice();

  // 初始化
  useEffect(() => {
    const init = async () => {
      // 模拟初始化过程
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsInitialized(true);
    };
    init();
  }, []);

  // 加载状态
  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>
        
        <div className="text-center relative z-10">
          <div className="text-6xl mb-6 animate-float">🎨</div>
          <h2 className="text-2xl font-bold text-white mb-4">现代艺术风格面板</h2>
          <div className="flex items-center justify-center gap-2 text-white/80">
            <Loading size="medium" />
            <span>正在启动...</span>
          </div>
          <div className="mt-4 text-white/60 text-sm">
            {isOfficeReady ? `已连接 ${hostApp}` : '独立模式'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      {/* 现代艺术风格主界面 */}
      <AppLayout />
    </div>
  );
};

export default App;
