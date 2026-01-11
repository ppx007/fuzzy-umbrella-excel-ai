// 标签页相关类型定义
export interface TabItem {
  id: string;
  title: string;
  icon: string;
  type: TabType;
  isActive: boolean;
  isModified: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  closable: boolean;
  pinned: boolean;
  lastAccessed: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export enum TabType {
  DATA_WORKSPACE = 'data-workspace',    // 数据工作台
  CHART_CENTER = 'chart-center',        // 可视化中心
  FILE_MANAGER = 'file-manager',        // 文件管理
  AI_ASSISTANT = 'ai-assistant',        // AI助手
  SETTINGS = 'settings',                // 系统设置
  CUSTOM = 'custom'                     // 自定义类型
}

export interface TabState {
  activeTabId: string | null;
  tabs: TabItem[];
  tabOrder: string[];
  pinnedTabs: string[];
  recentTabs: string[];
  maxTabs: number;
  autoSave: boolean;
}

export interface TabStore {
  // 状态
  activeTabId: string | null;
  tabs: TabItem[];
  tabOrder: string[];
  pinnedTabs: string[];
  recentTabs: string[];
  maxTabs: number;
  autoSave: boolean;
  
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
    
    // 标签页排序
    reorderTabs: (tabIds: string[]) => void;
    pinTab: (tabId: string) => void;
    unpinTab: (tabId: string) => void;
    
    // 状态管理
    setTabLoading: (tabId: string, loading: boolean) => void;
    setTabError: (tabId: string, error: string | null) => void;
    markTabModified: (tabId: string, modified: boolean) => void;
    
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
  };
}

export interface DragState {
  isDragging: boolean;
  draggedTabId: string | null;
  dropTargetId: string | null;
  dragPosition: 'before' | 'after' | 'inside' | null;
}

export enum TabEventType {
  TAB_ADDED = 'tab-added',
  TAB_REMOVED = 'tab-removed',
  TAB_SWITCHED = 'tab-switched',
  TAB_UPDATED = 'tab-updated',
  TAB_REORDERED = 'tab-reordered',
  TAB_PINNED = 'tab-pinned',
  TAB_UNPINNED = 'tab-unpinned',
  TAB_ERROR = 'tab-error',
  TAB_LOADING = 'tab-loading',
}

export interface TabEvent {
  type: TabEventType;
  tabId: string;
  timestamp: Date;
  data?: any;
}

export type TabEventListener = (event: TabEvent) => void;