/**
 * UI状态管理
 * 管理界面状态、主题、通知等
 */

import { create } from 'zustand';
import { TemplateType } from '@/types';

/**
 * 通知类型
 */
type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * 通知对象
 */
interface Notification {
  type: NotificationType;
  message: string;
  visible: boolean;
}

/**
 * 面板类型
 */
type PanelType = 'input' | 'template' | 'preview' | 'chart' | 'settings';

/**
 * 主题模式
 */
type ThemeMode = 'light' | 'dark' | 'system';

/**
 * 语言
 */
type Language = 'zh-CN' | 'en-US';

/**
 * UI状态接口
 */
interface UIState {
  // 侧边栏状态
  sidebarExpanded: boolean;
  
  // 当前活动面板
  activePanel: PanelType;
  
  // 对话框状态
  showImportDialog: boolean;
  showExportDialog: boolean;
  showSettingsDialog: boolean;
  showHelpDialog: boolean;
  
  // 模板选择
  selectedTemplateType: TemplateType | null;
  
  // 主题
  themeMode: ThemeMode;
  
  // 语言
  language: Language;
  
  // 通知
  notification: Notification | null;
  
  // 加载状态
  isProcessing: boolean;
  processingMessage: string;
}

/**
 * UI操作接口
 */
interface UIActions {
  // 侧边栏操作
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  
  // 面板操作
  setActivePanel: (panel: PanelType) => void;
  
  // 对话框操作
  setShowImportDialog: (show: boolean) => void;
  setShowExportDialog: (show: boolean) => void;
  setShowSettingsDialog: (show: boolean) => void;
  setShowHelpDialog: (show: boolean) => void;
  
  // 模板操作
  setSelectedTemplateType: (type: TemplateType | null) => void;
  
  // 主题操作
  setThemeMode: (mode: ThemeMode) => void;
  
  // 语言操作
  setLanguage: (lang: Language) => void;
  
  // 通知操作
  showNotification: (type: NotificationType, message: string) => void;
  hideNotification: () => void;
  
  // 加载状态操作
  setProcessing: (isProcessing: boolean, message?: string) => void;
  
  // 重置
  resetUI: () => void;
}

/**
 * 初始状态
 */
const initialState: UIState = {
  sidebarExpanded: true,
  activePanel: 'input',
  showImportDialog: false,
  showExportDialog: false,
  showSettingsDialog: false,
  showHelpDialog: false,
  selectedTemplateType: null,
  themeMode: 'system',
  language: 'zh-CN',
  notification: null,
  isProcessing: false,
  processingMessage: '',
};

/**
 * UI Store
 */
export const useUIStore = create<UIState & UIActions>((set) => ({
  ...initialState,
  
  toggleSidebar: () => set((state: UIState) => ({ 
    sidebarExpanded: !state.sidebarExpanded 
  })),
  
  setSidebarExpanded: (expanded: boolean) => set({ sidebarExpanded: expanded }),
  
  setActivePanel: (panel: PanelType) => set({ activePanel: panel }),
  
  setShowImportDialog: (show: boolean) => set({ showImportDialog: show }),
  
  setShowExportDialog: (show: boolean) => set({ showExportDialog: show }),
  
  setShowSettingsDialog: (show: boolean) => set({ showSettingsDialog: show }),
  
  setShowHelpDialog: (show: boolean) => set({ showHelpDialog: show }),
  
  setSelectedTemplateType: (type: TemplateType | null) => set({ selectedTemplateType: type }),
  
  setThemeMode: (mode: ThemeMode) => set({ themeMode: mode }),
  
  setLanguage: (lang: Language) => set({ language: lang }),
  
  showNotification: (type: NotificationType, message: string) => set({
    notification: { type, message, visible: true }
  }),
  
  hideNotification: () => set({ notification: null }),
  
  setProcessing: (isProcessing: boolean, message: string = '') => set({
    isProcessing,
    processingMessage: message,
  }),
  
  resetUI: () => set(initialState),
}));

// 导出类型
export type { UIState, UIActions, PanelType, ThemeMode, Language, NotificationType, Notification };