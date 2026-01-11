import React, { useState } from 'react';
import { TabItem as TabItemType } from '../../types/tab.types';
import { useTabActions } from '../../stores/tabStore';
import { cn } from '../../utils/cn';
import AnimatedIcon from './AnimatedIcon';

interface TabItemProps {
  tab: TabItemType;
  isDragging?: boolean;
  dragPosition?: 'before' | 'after' | null;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
}

const TabItem: React.FC<TabItemProps> = ({
  tab,
  isDragging = false,
  dragPosition = null,
  onContextMenu,
  onDoubleClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const actions = useTabActions();

  const handleClick = () => {
    if (!tab.isActive) {
      actions.switchTab(tab.id);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tab.closable) {
      actions.closeTab(tab.id);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { // 中键
      e.preventDefault();
      handleClose(e);
    }
  };

  const getTabIcon = () => {
    const iconMap = {
      'data-workspace': '📊',
      'chart-center': '📈',
      'file-manager': '📁',
      'ai-assistant': '🤖',
      'settings': '⚙️',
      'custom': '📄',
    };
    return iconMap[tab.type] || '📄';
  };

  return (
    <div
      className={cn(
        'relative flex items-center px-4 py-2 mr-1 rounded-t-lg transition-all duration-300 cursor-pointer group min-w-[120px] max-w-[200px]',
        tab.isActive
          ? 'bg-white/15 border border-blue-400/30 shadow-lg shadow-blue-400/20'
          : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/20',
        isDragging && 'opacity-50 rotate-2 z-50 shadow-2xl',
        dragPosition === 'before' && 'before:absolute before:left-0 before:top-0 before:w-1 before:h-full before:bg-blue-400 before:rounded-l',
        dragPosition === 'after' && 'after:absolute after:right-0 after:top-0 after:w-1 after:h-full after:bg-blue-400 after:rounded-r'
      )}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!tab.pinned}
    >
      {/* 修改指示器 */}
      {tab.isModified && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
      )}

      {/* 加载指示器 */}
      {tab.isLoading && (
        <div className="absolute -top-1 -right-1 w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
      )}

      {/* 错误指示器 */}
      {tab.hasError && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full flex items-center justify-center">
          <span className="text-xs text-white">!</span>
        </div>
      )}

      {/* 固定图标 */}
      {tab.pinned && (
        <AnimatedIcon
          icon="📌"
          size="sm"
          color="accent"
          className="mr-1"
        />
      )}

      {/* 标签页图标 */}
      <AnimatedIcon
        icon={getTabIcon()}
        size="sm"
        color={tab.isActive ? 'primary' : 'white'}
        className="mr-2"
      />

      {/* 标签页标题 */}
      <span
        className={cn(
          'flex-1 text-sm font-medium truncate',
          tab.isActive ? 'text-white' : 'text-white/80'
        )}
        title={tab.title}
      >
        {tab.title}
      </span>

      {/* 关闭按钮 */}
      {tab.closable && (
        <button
          className={cn(
            'ml-2 w-4 h-4 rounded flex items-center justify-center transition-all duration-200',
            'hover:bg-white/20 active:bg-white/30',
            isHovered || tab.isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
          )}
          onClick={handleClose}
        >
          <AnimatedIcon
            icon="✕"
            size="sm"
            color="white"
          />
        </button>
      )}

      {/* 错误提示 */}
      {tab.hasError && tab.errorMessage && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-500/90 text-white text-xs rounded shadow-lg z-50 max-w-xs">
          {tab.errorMessage}
        </div>
      )}
    </div>
  );
};

export default TabItem;