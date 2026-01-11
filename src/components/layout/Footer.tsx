import React, { useState, useEffect } from 'react';
import { useTabStore } from '../../stores/tabStore';
import { cn } from '../../utils/cn';
import AnimatedIcon from '../ui/AnimatedIcon';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  const { tabs, activeTabId } = useTabStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionStatus] = useState<'online' | 'offline' | 'connecting'>('online');
  const [progress, setProgress] = useState(0);

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 模拟进度更新
  useEffect(() => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (activeTab?.isLoading) {
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressTimer);
            return 100;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      return () => clearInterval(progressTimer);
    } else {
      setProgress(0);
    }
  }, [activeTabId, tabs]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'online':
        return 'text-green-400';
      case 'offline':
        return 'text-red-400';
      case 'connecting':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'online':
        return '在线';
      case 'offline':
        return '离线';
      case 'connecting':
        return '连接中';
      default:
        return '未知';
    }
  };

  return (
    <footer className={cn(
      'bg-white/5 backdrop-blur-xl border-t border-white/10 px-6 py-2 flex items-center justify-between text-sm relative z-10',
      className
    )}>
      {/* 左侧 - 状态信息 */}
      <div className="flex items-center gap-4">
        {/* 连接状态 */}
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full animate-pulse',
            connectionStatus === 'online' ? 'bg-green-400' :
            connectionStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
          )} />
          <span className={cn('text-white/80', getStatusColor())}>
            {getStatusText()}
          </span>
        </div>

        {/* 进度条 */}
        {progress > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-white/60 text-xs">{Math.round(progress)}%</span>
          </div>
        )}

        {/* 活跃标签页信息 */}
        {activeTabId && (
          <div className="flex items-center gap-2 text-white/60">
            <AnimatedIcon icon="📄" size="sm" />
            <span>工作台: {tabs.find(tab => tab.id === activeTabId)?.title}</span>
          </div>
        )}
      </div>

      {/* 中间 - 快捷信息 */}
      <div className="flex items-center gap-6 text-white/60">
        <div className="flex items-center gap-2">
          <AnimatedIcon icon="📊" size="sm" />
          <span>表格: 0</span>
        </div>
        <div className="flex items-center gap-2">
          <AnimatedIcon icon="📈" size="sm" />
          <span>图表: 0</span>
        </div>
        <div className="flex items-center gap-2">
          <AnimatedIcon icon="📁" size="sm" />
          <span>文件: 0</span>
        </div>
      </div>

      {/* 右侧 - 时间信息 */}
      <div className="flex items-center gap-4 text-white/60">
        <div className="text-right">
          <div className="text-white font-mono text-sm">
            {formatTime(currentTime)}
          </div>
          <div className="text-xs">
            {formatDate(currentTime)}
          </div>
        </div>
        
        {/* 系统信息 */}
        <div className="flex items-center gap-2">
          <button
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="系统信息"
          >
            <AnimatedIcon icon="ℹ️" size="sm" />
          </button>
          
          <button
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="设置"
          >
            <AnimatedIcon icon="⚙️" size="sm" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;