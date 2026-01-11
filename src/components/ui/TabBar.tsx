import React, { useState, useRef, useEffect } from 'react';
import { useTabStore, useTabActions } from '../../stores/tabStore';
import { TabItem as TabItemType, DragState } from '../../types/tab.types';
import { cn } from '../../utils/cn';
import TabItem from './TabItem';
import AnimatedIcon from './AnimatedIcon';

interface TabBarProps {
  className?: string;
}

const TabBar: React.FC<TabBarProps> = ({ className }) => {
  const { tabs, tabOrder, activeTabId, pinnedTabs } = useTabStore();
  const actions = useTabActions();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedTabId: null,
    dropTargetId: null,
    dragPosition: null,
  });
  const [contextMenu, setContextMenu] = useState<{
    tab: TabItemType;
    position: { x: number; y: number };
  } | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  // 排序标签页：固定的在前，然后按顺序
  const sortedTabs = React.useMemo(() => {
    const pinned = tabs.filter(tab => pinnedTabs.includes(tab.id));
    const unpinned = tabs.filter(tab => !pinnedTabs.includes(tab.id));
    
    const orderedUnpinned = unpinned.sort((a, b) => {
      const aIndex = tabOrder.indexOf(a.id);
      const bIndex = tabOrder.indexOf(b.id);
      return aIndex - bIndex;
    });

    return [...pinned, ...orderedUnpinned];
  }, [tabs, tabOrder, pinnedTabs]);

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Tab':
            e.preventDefault();
            if (e.shiftKey) {
              actions.switchTab(getPreviousTabId() || '');
            } else {
              actions.switchTab(getNextTabId() || '');
            }
            break;
          case 'w':
            e.preventDefault();
            if (activeTabId) {
              actions.closeTab(activeTabId);
            }
            break;
          case 't':
            e.preventDefault();
            // 创建新标签页的逻辑
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, actions, sortedTabs]);

  const getNextTabId = () => {
    if (!activeTabId) return sortedTabs[0]?.id;
    const currentIndex = sortedTabs.findIndex(tab => tab.id === activeTabId);
    const nextIndex = (currentIndex + 1) % sortedTabs.length;
    return sortedTabs[nextIndex]?.id;
  };

  const getPreviousTabId = () => {
    if (!activeTabId) return sortedTabs[sortedTabs.length - 1]?.id;
    const currentIndex = sortedTabs.findIndex(tab => tab.id === activeTabId);
    const prevIndex = currentIndex === 0 ? sortedTabs.length - 1 : currentIndex - 1;
    return sortedTabs[prevIndex]?.id;
  };

  // 拖拽处理
  // const handleDragStart = (e: React.DragEvent, tabId: string) => {
  //   const tab = tabs.find(t => t.id === tabId);
  //   if (tab?.pinned) return; // 固定标签页不能拖拽

  //   setDragState({
  //     isDragging: true,
  //     draggedTabId: tabId,
  //     dropTargetId: null,
  //     dragPosition: null,
  //   });
  //   e.dataTransfer.effectAllowed = 'move';
  // };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragState.isDragging || dragState.draggedTabId === targetId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = x < rect.width / 2 ? 'before' : 'after';

    setDragState(prev => ({
      ...prev,
      dropTargetId: targetId,
      dragPosition: position,
    }));
  };

  const handleDragLeave = () => {
    setDragState(prev => ({
      ...prev,
      dropTargetId: null,
      dragPosition: null,
    }));
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragState.isDragging || !dragState.draggedTabId || dragState.draggedTabId === targetId) {
      setDragState({
        isDragging: false,
        draggedTabId: null,
        dropTargetId: null,
        dragPosition: null,
      });
      return;
    }

    // 重新排序逻辑
    const newOrder = [...tabOrder];
    const draggedIndex = newOrder.indexOf(dragState.draggedTabId);
    const targetIndex = newOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    newOrder.splice(draggedIndex, 1);
    const insertIndex = dragState.dragPosition === 'after' ? targetIndex + 1 : targetIndex;
    newOrder.splice(insertIndex, 0, dragState.draggedTabId);

    actions.reorderTabs(newOrder);

    setDragState({
      isDragging: false,
      draggedTabId: null,
      dropTargetId: null,
      dragPosition: null,
    });
  };

  // const handleDragEnd = () => {
  //   setDragState({
  //     isDragging: false,
  //     draggedTabId: null,
  //     dropTargetId: null,
  //     dragPosition: null,
  //   });
  // };

  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent, tab: TabItemType) => {
    e.preventDefault();
    setContextMenu({
      tab,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;
    const { tab } = contextMenu;

    switch (action) {
      case 'close':
        actions.closeTab(tab.id);
        break;
      case 'close-others':
        actions.closeOtherTabs(tab.id);
        break;
      case 'close-right':
        actions.closeTabsToRight(tab.id);
        break;
      case 'pin':
        actions.pinTab(tab.id);
        break;
      case 'unpin':
        actions.unpinTab(tab.id);
        break;
    }
    setContextMenu(null);
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  if (sortedTabs.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      {/* 标签页栏 */}
      <div
        ref={tabBarRef}
        className="flex items-center bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border-b border-white/10 px-4 h-12 overflow-hidden"
      >
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {sortedTabs.map((tab) => (
            <div
              key={tab.id}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDrop={(e) => handleDrop(e, tab.id)}
              onDragLeave={handleDragLeave}
            >
              <TabItem
                tab={tab}
                isDragging={dragState.draggedTabId === tab.id}
                dragPosition={
                  dragState.dropTargetId === tab.id && dragState.dragPosition !== 'inside'
                    ? dragState.dragPosition
                    : null
                }
                onContextMenu={(e) => handleContextMenu(e, tab)}
                onDoubleClick={() => {
                  // TODO: 实现重命名功能
                }}
              />
            </div>
          ))}
        </div>

        {/* 滚动按钮 */}
        {sortedTabs.length > 5 && (
          <>
            <button className="ml-2 p-1 rounded hover:bg-white/10 transition-colors">
              <AnimatedIcon icon="◀" size="sm" />
            </button>
            <button className="p-1 rounded hover:bg-white/10 transition-colors">
              <AnimatedIcon icon="▶" size="sm" />
            </button>
          </>
        )}

        {/* 新建标签页按钮 */}
        <button
          className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"
          onClick={() => {
            // TODO: 实现新建标签页功能
          }}
        >
          <AnimatedIcon icon="+" size="sm" />
        </button>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl z-50 py-1 min-w-[160px]"
          style={{
            left: contextMenu.position.x,
            top: contextMenu.position.y,
          }}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
            onClick={() => handleContextMenuAction('close')}
          >
            <AnimatedIcon icon="✕" size="sm" />
            关闭
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
            onClick={() => handleContextMenuAction('close-others')}
          >
            <AnimatedIcon icon="🚫" size="sm" />
            关闭其他
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
            onClick={() => handleContextMenuAction('close-right')}
          >
            <AnimatedIcon icon="➡️" size="sm" />
            关闭右侧
          </button>
          <div className="border-t border-white/10 my-1" />
          <button
            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
            onClick={() => handleContextMenuAction(contextMenu.tab.pinned ? 'unpin' : 'pin')}
          >
            <AnimatedIcon icon={contextMenu.tab.pinned ? '📌' : '📍'} size="sm" />
            {contextMenu.tab.pinned ? '取消固定' : '固定'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TabBar;