import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TabItem, TabState, TabType, TabEventType, TabEvent } from '../types/tab.types';

interface TabStore extends TabState {
  // 事件监听器
  eventListeners: Map<TabEventType, Set<(event: TabEvent) => void>>;
  
  // 动作
  actions: {
    // 标签页管理
    addTab: (tab: Omit<TabItem, 'id' | 'createdAt' | 'lastAccessed'>) => string;
    removeTab: (tabId: string) => void;
    updateTab: (tabId: string, updates: Partial<TabItem>) => void;
    switchTab: (tabId: string) => void;
    closeTab: (tabId: string) => void;
    closeAllTabs: () => void;
    closeOtherTabs: (tabId: string) => void;
    closeTabsToRight: (tabId: string) => void;
    
    // 标签页排序
    reorderTabs: (tabIds: string[]) => void;
    pinTab: (tabId: string) => void;
    unpinTab: (tabId: string) => void;
    
    // 状态管理
    setTabLoading: (tabId: string, loading: boolean) => void;
    setTabError: (tabId: string, error: string | null) => void;
    markTabModified: (tabId: string, modified: boolean) => void;
    
    // 事件管理
    addEventListener: (type: TabEventType, listener: (event: TabEvent) => void) => void;
    removeEventListener: (type: TabEventType, listener: (event: TabEvent) => void) => void;
    emitEvent: (event: TabEvent) => void;
    
    // 持久化
    saveState: () => void;
    loadState: () => void;
    resetState: () => void;
  };
  
  // 选择器
  selectors: {
    getActiveTab: () => TabItem | null;
    getTabById: (id: string) => TabItem | null;
    getTabsByType: (type: TabType) => TabItem[];
    getRecentTabs: (count?: number) => TabItem[];
    canAddTab: () => boolean;
    isTabModified: (tabId: string) => boolean;
    getTabIndex: (tabId: string) => number;
    getNextTab: (tabId: string) => TabItem | null;
    getPreviousTab: (tabId: string) => TabItem | null;
  };
}

// 生成唯一ID
const generateId = (): string => {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 触发事件
const emitTabEvent = (
  listeners: Map<TabEventType, Set<(event: TabEvent) => void>>,
  type: TabEventType,
  tabId: string,
  data?: any
) => {
  const eventListeners = listeners.get(type);
  if (eventListeners) {
    const event: TabEvent = {
      type,
      tabId,
      timestamp: new Date(),
      data,
    };
    eventListeners.forEach(listener => listener(event));
  }
};

// 创建标签页store
export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      activeTabId: null,
      tabs: [],
      tabOrder: [],
      pinnedTabs: [],
      recentTabs: [],
      maxTabs: 20,
      autoSave: true,
      eventListeners: new Map(),

      // 动作实现
      actions: {
        // 添加标签页
        addTab: (tabData) => {
          const id = generateId();
          const now = new Date();
          
          const newTab: TabItem = {
            ...tabData,
            id,
            createdAt: now,
            lastAccessed: now,
          };

          set((state) => {
            const newTabs = [...state.tabs, newTab];
            const newTabOrder = [...state.tabOrder, id];
            const newRecentTabs = [id, ...state.recentTabs.filter(tid => tid !== id)].slice(0, 10);
            
            // 触发事件
            emitTabEvent(state.eventListeners, TabEventType.TAB_ADDED, id, newTab);
            
            return {
              tabs: newTabs,
              tabOrder: newTabOrder,
              recentTabs: newRecentTabs,
              activeTabId: id,
            };
          });

          return id;
        },

        // 移除标签页
        removeTab: (tabId) => {
          const state = get();
          const tab = state.tabs.find(t => t.id === tabId);
          if (!tab) return;

          set((state) => {
            const newTabs = state.tabs.filter(t => t.id !== tabId);
            const newTabOrder = state.tabOrder.filter(id => id !== tabId);
            const newPinnedTabs = state.pinnedTabs.filter(id => id !== tabId);
            const newRecentTabs = state.recentTabs.filter(id => id !== tabId);
            
            // 如果删除的是当前活动标签页，切换到其他标签页
            let newActiveTabId = state.activeTabId;
            if (state.activeTabId === tabId) {
              const remainingTabs = newTabs.filter(t => !t.pinned);
              if (remainingTabs.length > 0) {
                const currentIndex = newTabOrder.indexOf(tabId);
                const nextIndex = currentIndex < newTabOrder.length - 1 ? currentIndex + 1 : currentIndex - 1;
                if (nextIndex >= 0) {
                  newActiveTabId = newTabOrder[nextIndex];
                }
              } else {
                newActiveTabId = null;
              }
            }
            
            // 触发事件
            emitTabEvent(state.eventListeners, TabEventType.TAB_REMOVED, tabId, tab);
            
            return {
              tabs: newTabs,
              tabOrder: newTabOrder,
              pinnedTabs: newPinnedTabs,
              recentTabs: newRecentTabs,
              activeTabId: newActiveTabId,
            };
          });
        },

        // 更新标签页
        updateTab: (tabId, updates) => {
          set((currentState) => {
            const newTabs = currentState.tabs.map(tab =>
              tab.id === tabId ? { ...tab, ...updates } : tab
            );
            
            // 触发事件
            emitTabEvent(currentState.eventListeners, TabEventType.TAB_UPDATED, tabId, updates);
            
            return { tabs: newTabs };
          });
        },

        // 切换标签页
        switchTab: (tabId) => {
          const state = get();
          const tab = state.tabs.find(t => t.id === tabId);
          if (!tab) return;

          set((state) => {
            const newTabs = state.tabs.map(tab => 
              tab.id === tabId 
                ? { ...tab, lastAccessed: new Date(), isActive: true }
                : { ...tab, isActive: false }
            );
            const newRecentTabs = [tabId, ...state.recentTabs.filter(tid => tid !== tabId)].slice(0, 10);
            
            // 触发事件
            emitTabEvent(state.eventListeners, TabEventType.TAB_SWITCHED, tabId);
            
            return {
              tabs: newTabs,
              activeTabId: tabId,
              recentTabs: newRecentTabs,
            };
          });
        },

        // 关闭标签页
        closeTab: (tabId) => {
          get().actions.removeTab(tabId);
        },

        // 关闭所有标签页
        closeAllTabs: () => {
          const state = get();
          state.tabs.forEach(tab => {
            emitTabEvent(state.eventListeners, TabEventType.TAB_REMOVED, tab.id, tab);
          });
          
          set({
            tabs: [],
            tabOrder: [],
            pinnedTabs: [],
            recentTabs: [],
            activeTabId: null,
          });
        },

        // 关闭其他标签页
        closeOtherTabs: (tabId) => {
          const state = get();
          const tab = state.tabs.find(t => t.id === tabId);
          if (!tab) return;

          set((state) => {
            const tabsToKeep = state.tabs.filter(t => t.id === tabId || t.pinned);
            const tabsToRemove = state.tabs.filter(t => t.id !== tabId && !t.pinned);
            
            tabsToRemove.forEach(tab => {
              emitTabEvent(state.eventListeners, TabEventType.TAB_REMOVED, tab.id, tab);
            });
            
            return {
              tabs: tabsToKeep,
              tabOrder: tabsToKeep.map(t => t.id),
              pinnedTabs: state.pinnedTabs,
              recentTabs: [tabId],
              activeTabId: tabId,
            };
          });
        },

        // 关闭右侧标签页
        closeTabsToRight: (tabId) => {
          const state = get();
          const tabIndex = state.tabOrder.indexOf(tabId);
          if (tabIndex === -1) return;

          set((state) => {
            const tabsToKeep = state.tabOrder.slice(0, tabIndex + 1);
            const tabsToRemove = state.tabOrder.slice(tabIndex + 1);
            const newTabs = state.tabs.filter(t => tabsToKeep.includes(t.id));
            
            tabsToRemove.forEach(tabId => {
              const tab = state.tabs.find(t => t.id === tabId);
              if (tab) {
                emitTabEvent(state.eventListeners, TabEventType.TAB_REMOVED, tabId, tab);
              }
            });
            
            return {
              tabs: newTabs,
              tabOrder: tabsToKeep,
              recentTabs: state.recentTabs.filter(id => tabsToKeep.includes(id)),
            };
          });
        },

        // 重新排序标签页
        reorderTabs: (tabIds) => {
          set((currentState) => {
            // 触发事件
            emitTabEvent(currentState.eventListeners, TabEventType.TAB_REORDERED, '', { tabIds });
            
            return { tabOrder: tabIds };
          });
        },

        // 固定标签页
        pinTab: (tabId) => {
          set((currentState) => {
            const newPinnedTabs = [...currentState.pinnedTabs, tabId];
            
            // 触发事件
            emitTabEvent(currentState.eventListeners, TabEventType.TAB_PINNED, tabId);
            
            return { pinnedTabs: newPinnedTabs };
          });
        },

        // 取消固定标签页
        unpinTab: (tabId) => {
          set((currentState) => {
            const newPinnedTabs = currentState.pinnedTabs.filter(id => id !== tabId);
            
            // 触发事件
            emitTabEvent(currentState.eventListeners, TabEventType.TAB_UNPINNED, tabId);
            
            return { pinnedTabs: newPinnedTabs };
          });
        },

        // 设置标签页加载状态
        setTabLoading: (tabId, loading) => {
          set((currentState) => {
            const newTabs = currentState.tabs.map(tab =>
              tab.id === tabId ? { ...tab, isLoading: loading } : tab
            );
            
            // 触发事件
            emitTabEvent(currentState.eventListeners, TabEventType.TAB_LOADING, tabId, { loading });
            
            return { tabs: newTabs };
          });
        },

        // 设置标签页错误状态
        setTabError: (tabId, error) => {
          set((currentState) => {
            const newTabs = currentState.tabs.map(tab =>
              tab.id === tabId ? { ...tab, hasError: !!error, errorMessage: error || undefined } : tab
            );
            
            // 触发事件
            emitTabEvent(currentState.eventListeners, TabEventType.TAB_ERROR, tabId, { error });
            
            return { tabs: newTabs };
          });
        },

        // 标记标签页已修改
        markTabModified: (tabId, modified) => {
          set((currentState) => {
            const newTabs = currentState.tabs.map(tab =>
              tab.id === tabId ? { ...tab, isModified: modified } : tab
            );
            
            return { tabs: newTabs };
          });
        },

        // 添加事件监听器
        addEventListener: (type, listener) => {
          set((state) => {
            const newListeners = new Map(state.eventListeners);
            if (!newListeners.has(type)) {
              newListeners.set(type, new Set());
            }
            newListeners.get(type)!.add(listener);
            return { eventListeners: newListeners };
          });
        },

        // 移除事件监听器
        removeEventListener: (type, listener) => {
          set((state) => {
            const newListeners = new Map(state.eventListeners);
            const typeListeners = newListeners.get(type);
            if (typeListeners) {
              typeListeners.delete(listener);
              if (typeListeners.size === 0) {
                newListeners.delete(type);
              }
            }
            return { eventListeners: newListeners };
          });
        },

        // 触发事件
        emitEvent: (event) => {
          const state = get();
          emitTabEvent(state.eventListeners, event.type, event.tabId, event.data);
        },

        // 保存状态
        saveState: () => {
          // Zustand persist middleware 会自动处理
        },

        // 加载状态
        loadState: () => {
          // Zustand persist middleware 会自动处理
        },

        // 重置状态
        resetState: () => {
          set({
            activeTabId: null,
            tabs: [],
            tabOrder: [],
            pinnedTabs: [],
            recentTabs: [],
            eventListeners: new Map(),
          });
        },
      },

      // 选择器实现
      selectors: {
        getActiveTab: () => {
          const state = get();
          return state.tabs.find(tab => tab.id === state.activeTabId) || null;
        },

        getTabById: (id) => {
          const state = get();
          return state.tabs.find(tab => tab.id === id) || null;
        },

        getTabsByType: (type) => {
          const state = get();
          return state.tabs.filter(tab => tab.type === type);
        },

        getRecentTabs: (count = 5) => {
          const state = get();
          return state.recentTabs
            .map(id => state.tabs.find(tab => tab.id === id))
            .filter((tab): tab is TabItem => tab !== undefined)
            .slice(0, count);
        },

        canAddTab: () => {
          const state = get();
          return state.tabs.length < state.maxTabs;
        },

        isTabModified: (tabId) => {
          const state = get();
          const tab = state.tabs.find(t => t.id === tabId);
          return tab?.isModified || false;
        },

        getTabIndex: (tabId) => {
          const state = get();
          return state.tabOrder.indexOf(tabId);
        },

        getNextTab: (tabId) => {
          const state = get();
          const currentIndex = state.tabOrder.indexOf(tabId);
          if (currentIndex === -1 || currentIndex >= state.tabOrder.length - 1) {
            return null;
          }
          const nextId = state.tabOrder[currentIndex + 1];
          return state.tabs.find(tab => tab.id === nextId) || null;
        },

        getPreviousTab: (tabId) => {
          const state = get();
          const currentIndex = state.tabOrder.indexOf(tabId);
          if (currentIndex <= 0) {
            return null;
          }
          const prevId = state.tabOrder[currentIndex - 1];
          return state.tabs.find(tab => tab.id === prevId) || null;
        },
      },
    }),
    {
      name: 'tab-navigation-storage',
      partialize: (state) => ({
        activeTabId: state.activeTabId,
        tabs: state.tabs,
        tabOrder: state.tabOrder,
        pinnedTabs: state.pinnedTabs,
        recentTabs: state.recentTabs,
        maxTabs: state.maxTabs,
        autoSave: state.autoSave,
      }),
    }
  )
);

// 导出便捷的hook
export const useTabActions = () => useTabStore((state) => state.actions);
export const useTabSelectors = () => useTabStore((state) => state.selectors);
export const useActiveTab = () => useTabStore((state) => state.selectors.getActiveTab());
export const useTabs = () => useTabStore((state) => state.tabs);
export const useActiveTabId = () => useTabStore((state) => state.activeTabId);