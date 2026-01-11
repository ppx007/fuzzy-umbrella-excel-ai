# 测试和用户体验调优方案

## 概述

建立全面的测试体系，确保新架构的稳定性和可靠性，同时通过用户体验调优提升整体产品品质。

---

## 1. 测试策略架构

### 1.1 测试金字塔

```typescript
// 测试金字塔架构
interface TestingPyramid {
  // 单元测试 (70%)
  UnitTests: {
    components: 'React组件测试';
    hooks: '自定义Hook测试';
    utils: '工具函数测试';
    services: '服务层测试';
    types: '类型定义测试';
  };
  
  // 集成测试 (20%)
  IntegrationTests: {
    workflows: '工作流集成测试';
    api: 'API集成测试';
    dataFlow: '数据流测试';
    stateManagement: '状态管理测试';
  };
  
  // 端到端测试 (10%)
  E2ETests: {
    userJourneys: '用户旅程测试';
    criticalPaths: '关键路径测试';
    crossBrowser: '跨浏览器测试';
    accessibility: '无障碍测试';
  };
}
```

### 1.2 测试覆盖目标

```typescript
// 测试覆盖目标
interface TestCoverageTargets {
  // 代码覆盖率
  codeCoverage: {
    statements: number; // > 80%
    branches: number; // > 75%
    functions: number; // > 85%
    lines: number; // > 80%
  };
  
  // 功能覆盖率
  functionalCoverage: {
    coreFeatures: number; // 100%
    userWorkflows: number; // > 95%
    errorHandling: number; // > 90%
    edgeCases: number; // > 85%
  };
  
  // 性能覆盖率
  performanceCoverage: {
    loadTime: boolean; // < 2s
    interactionTime: boolean; // < 100ms
    memoryUsage: boolean; // < 100MB
    animationFPS: boolean; // > 60fps
  };
}
```

---

## 2. 单元测试体系

### 2.1 组件测试框架

#### React组件测试工具

```typescript
// 组件测试工具库
class ComponentTestUtils {
  // 渲染组件的增强版本
  static renderWithProviders(
    component: React.ReactElement,
    options: RenderOptions = {}
  ) {
    const {
      initialState = {},
      store = createStore(initialState),
      theme = defaultTheme,
      ...renderOptions
    } = options;
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    );
    
    return render(component, { wrapper, ...renderOptions });
  }
  
  // 模拟用户交互
  static async userInteraction(
    element: HTMLElement,
    type: 'click' | 'type' | 'select' | 'drag',
    options: any = {}
  ) {
    switch (type) {
      case 'click':
        await userEvent.click(element);
        break;
      case 'type':
        await userEvent.type(element, options.text);
        break;
      case 'select':
        await userEvent.selectOptions(element, options.value);
        break;
      case 'drag':
        await userEvent.pointer([{ keys: '[MouseLeft]', target: element }]);
        break;
    }
  }
  
  // 等待异步操作
  static async waitForAsync() {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }
  
  // 检查元素可见性
  static isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }
  
  // 检查元素可访问性
  static checkAccessibility(element: HTMLElement) {
    // 检查ARIA属性
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    
    return {
      hasRole: Boolean(role),
      hasLabel: Boolean(ariaLabel),
      hasDescription: Boolean(ariaDescribedBy),
      isFocusable: element.tabIndex >= 0,
      isKeyboardAccessible: element.tagName === 'BUTTON' || 
                           element.tagName === 'A' || 
                           element.tabIndex >= 0
    };
  }
}
```

#### 核心组件测试

```typescript
// 工作区标签页组件测试
describe('WorkspaceTabs', () => {
  const mockWorkspaces = [
    { id: 'data', name: '数据工作台', icon: '📊', component: DataWorkspace },
    { id: 'chart', name: '图表工作台', icon: '📈', component: ChartWorkspace },
    { id: 'file', name: '文件工作台', icon: '📁', component: FileWorkspace },
    { id: 'assistant', name: 'AI助手', icon: '🤖', component: AssistantWorkspace },
    { id: 'config', name: '配置中心', icon: '⚙️', component: ConfigWorkspace }
  ];
  
  beforeEach(() => {
    // 模拟localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });
  
  it('应该渲染所有工作区标签', () => {
    renderWithProviders(
      <WorkspaceTabs 
        workspaces={mockWorkspaces}
        activeWorkspace="data"
        onWorkspaceChange={vi.fn()}
      />
    );
    
    mockWorkspaces.forEach(workspace => {
      expect(screen.getByText(workspace.name)).toBeInTheDocument();
      expect(screen.getByText(workspace.icon)).toBeInTheDocument();
    });
  });
  
  it('应该高亮当前活动的工作区', () => {
    renderWithProviders(
      <WorkspaceTabs 
        workspaces={mockWorkspaces}
        activeWorkspace="chart"
        onWorkspaceChange={vi.fn()}
      />
    );
    
    const activeTab = screen.getByText('图表工作台').closest('[role="tab"]');
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(activeTab).toHaveClass('active');
  });
  
  it('应该响应标签切换', async () => {
    const handleChange = vi.fn();
    
    renderWithProviders(
      <WorkspaceTabs 
        workspaces={mockWorkspaces}
        activeWorkspace="data"
        onWorkspaceChange={handleChange}
      />
    );
    
    const chartTab = screen.getByText('图表工作台');
    await ComponentTestUtils.userInteraction(chartTab, 'click');
    
    expect(handleChange).toHaveBeenCalledWith('chart');
  });
  
  it('应该支持键盘导航', async () => {
    renderWithProviders(
      <WorkspaceTabs 
        workspaces={mockWorkspaces}
        activeWorkspace="data"
        onWorkspaceChange={vi.fn()}
      />
    );
    
    const firstTab = screen.getByText('数据工作台');
    firstTab.focus();
    
    // 测试右箭头键导航
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByText('图表工作台')).toHaveFocus();
    
    // 测试Enter键激活
    await userEvent.keyboard('{Enter}');
    // 验证onWorkspaceChange被调用
  });
  
  it('应该支持拖拽重新排序', async () => {
    renderWithProviders(
      <WorkspaceTabs 
        workspaces={mockWorkspaces}
        activeWorkspace="data"
        onWorkspaceChange={vi.fn()}
        onReorder={vi.fn()}
        draggable={true}
      />
    );
    
    const dataTab = screen.getByText('数据工作台');
    const chartTab = screen.getByText('图表工作台');
    
    // 模拟拖拽操作
    await ComponentTestUtils.userInteraction(dataTab, 'drag', {
      target: chartTab
    });
    
    // 验证重新排序回调被调用
  });
  
  it('应该正确处理关闭标签', async () => {
    const closableWorkspaces = mockWorkspaces.map(w => ({
      ...w,
      closable: w.id !== 'data' // 数据工作台不可关闭
    }));
    
    renderWithProviders(
      <WorkspaceTabs 
        workspaces={closableWorkspaces}
        activeWorkspace="chart"
        onWorkspaceChange={vi.fn()}
        onClose={vi.fn()}
        closable={true}
      />
    );
    
    const chartTab = screen.getByText('图表工作台');
    const closeButton = within(chartTab).getByRole('button', { name: /关闭/i });
    
    await ComponentTestUtils.userInteraction(closeButton, 'click');
    
    // 验证关闭回调被调用
  });
  
  it('应该保持状态持久化', () => {
    const mockGetItem = vi.mocked(localStorage.getItem);
    mockGetItem.mockReturnValue('chart');
    
    renderWithProviders(
      <WorkspaceTabs 
        workspaces={mockWorkspaces}
        activeWorkspace="data"
        onWorkspaceChange={vi.fn()}
        persistState={true}
      />
    );
    
    // 验证从localStorage加载状态
    expect(mockGetItem).toHaveBeenCalledWith('workspace-active-tab');
  });
  
  it('应该正确处理无障碍访问', () => {
    renderWithProviders(
      <WorkspaceTabs 
        workspaces={mockWorkspaces}
        activeWorkspace="data"
        onWorkspaceChange={vi.fn()}
      />
    );
    
    const tabList = screen.getByRole('tablist');
    expect(tabList).toHaveAttribute('aria-label', '工作区标签');
    
    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute('tabindex', index === 0 ? '0' : '-1');
      expect(tab).toHaveAttribute('aria-selected', index === 0 ? 'true' : 'false');
    });
  });
});
```

### 2.2 Hook测试

```typescript
// 自定义Hook测试
describe('useWorkspaceManager', () => {
  it('应该正确管理工作区状态', () => {
    const { result } = renderHook(() => useWorkspaceManager());
    
    expect(result.current.activeWorkspace).toBe('data');
    expect(result.current.workspaces).toHaveLength(5);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
  
  it('应该正确切换工作区', () => {
    const { result } = renderHook(() => useWorkspaceManager());
    
    act(() => {
      result.current.switchWorkspace('chart');
    });
    
    expect(result.current.activeWorkspace).toBe('chart');
  });
  
  it('应该正确处理工作区历史', () => {
    const { result } = renderHook(() => useWorkspaceManager());
    
    // 切换工作区
    act(() => {
      result.current.switchWorkspace('chart');
      result.current.switchWorkspace('file');
    });
    
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    
    // 撤销操作
    act(() => {
      result.current.undo();
    });
    
    expect(result.current.activeWorkspace).toBe('chart');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);
  });
  
  it('应该正确处理工作区关闭', () => {
    const { result } = renderHook(() => useWorkspaceManager());
    
    act(() => {
      result.current.closeWorkspace('chart');
    });
    
    expect(result.current.workspaces).toHaveLength(4);
    expect(result.current.workspaces.find(w => w.id === 'chart')).toBeUndefined();
  });
});

describe('usePerformanceMonitor', () => {
  it('应该正确监控组件性能', () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));
    
    expect(result.current.metrics).toBeDefined();
    expect(typeof result.current.measureRender).toBe('function');
    expect(typeof result.current.measureAsync).toBe('function');
  });
  
  it('应该正确记录渲染时间', () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));
    
    const startTime = result.current.measureRender('test-render');
    expect(startTime).toBeGreaterThan(0);
    
    // 模拟一些工作
    const endTime = performance.now();
    expect(endTime - startTime).toBeGreaterThanOrEqual(0);
  });
});
```

### 2.3 服务层测试

```typescript
// 服务层测试
describe('TableGenerationService', () => {
  let service: TableGenerationService;
  
  beforeEach(() => {
    service = new TableGenerationService();
    // 模拟fetch
    global.fetch = vi.fn();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('应该正确生成表格', async () => {
    const mockResponse = {
      choices: [{
        delta: {
          content: JSON.stringify({
            table: {
              title: '测试表格',
              columns: [
                { key: 'name', title: '姓名', type: 'text' },
                { key: 'age', title: '年龄', type: 'number' }
              ],
              rows: [
                { name: '张三', age: 25 },
                { name: '李四', age: 30 }
              ]
            }
          })
        }
      }]
    };
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: ' + JSON.stringify(mockResponse.choices[0])) })
            .mockResolvedValueOnce({ done: true })
        })
      }
    } as any);
    
    const result = await service.generateTable({
      prompt: '创建一个测试表格',
      options: { rowCount: 2 }
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.tableName).toBe('测试表格');
    expect(result.data?.columns).toHaveLength(2);
    expect(result.data?.rows).toHaveLength(2);
  });
  
  it('应该正确处理API错误', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    } as any);
    
    const result = await service.generateTable({
      prompt: '创建一个测试表格'
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('API密钥无效');
  });
  
  it('应该正确处理网络超时', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network timeout'));
    
    const result = await service.generateTable({
      prompt: '创建一个测试表格'
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('超时');
  });
});

describe('UnifiedConfigStore', () => {
  let store: UnifiedConfigStore;
  
  beforeEach(() => {
    store = UnifiedConfigStore.getInstance();
    // 清理localStorage
    localStorage.clear();
  });
  
  it('应该正确管理配置', () => {
    const initialConfig = store.getConfig();
    expect(initialConfig).toBeDefined();
    
    store.updateConfig({
      api: {
        activePreset: 'test-preset',
        presets: [],
        fallbackSettings: {
          baseUrl: 'https://test.com',
          apiKey: 'test-key',
          model: 'test-model',
          timeout: 60
        }
      }
    });
    
    const updatedConfig = store.getConfig();
    expect(updatedConfig.api.activePreset).toBe('test-preset');
    expect(updatedConfig.api.fallbackSettings.baseUrl).toBe('https://test.com');
  });
  
  it('应该正确处理配置订阅', () => {
    const subscriber = vi.fn();
    const unsubscribe = store.subscribe(subscriber);
    
    store.updateConfig({
      api: {
        activePreset: 'new-preset',
        presets: [],
        fallbackSettings: {
          baseUrl: 'https://new.com',
          apiKey: 'new-key',
          model: 'new-model',
          timeout: 60
        }
      }
    });
    
    expect(subscriber).toHaveBeenCalled();
    unsubscribe();
  });
  
  it('应该正确导出和导入配置', () => {
    store.updateConfig({
      api: {
        activePreset: 'export-test',
        presets: [],
        fallbackSettings: {
          baseUrl: 'https://export.com',
          apiKey: 'export-key',
          model: 'export-model',
          timeout: 60
        }
      }
    });
    
    const exportedConfig = store.exportConfig();
    expect(exportedConfig).toContain('export-test');
    
    store.resetToDefaults();
    const resetConfig = store.getConfig();
    expect(resetConfig.api.activePreset).toBe('');
    
    const success = store.importConfig(exportedConfig);
    expect(success).toBe(true);
    
    const importedConfig = store.getConfig();
    expect(importedConfig.api.activePreset).toBe('export-test');
  });
});
```

---

## 3. 集成测试

### 3.1 工作流集成测试

```typescript
// 工作流集成测试
describe('数据分析师工作流', () => {
  it('应该完成完整的数据分析流程', async () => {
    // 1. 启动应用
    renderWithProviders(<App />);
    
    // 2. 验证默认工作区
    expect(screen.getByText('数据工作台')).toBeInTheDocument();
    expect(screen.getByText('AI助手')).toBeInTheDocument();
    
    // 3. 切换到数据工作台
    await ComponentTestUtils.userInteraction(
      screen.getByText('数据工作台'),
      'click'
    );
    
    // 4. 上传文件
    const fileInput = screen.getByLabelText(/上传文件/i);
    const mockFile = new File(['test data'], 'test.csv', { type: 'text/csv' });
    await ComponentTestUtils.userInteraction(fileInput, 'type', {
      text: ''
    });
    
    // 5. 验证文件上传成功
    await waitFor(() => {
      expect(screen.getByText(/已上传.*test.csv/i)).toBeInTheDocument();
    });
    
    // 6. 切换到AI助手工作台
    await ComponentTestUtils.userInteraction(
      screen.getByText('AI助手'),
      'click'
    );
    
    // 7. 发送分析请求
    const input = screen.getByPlaceholderText(/描述您想创建的表格/i);
    await ComponentTestUtils.userInteraction(input, 'type', {
      text: '分析上传的数据并创建销售报表'
    });
    
    const sendButton = screen.getByRole('button', { name: /发送/i });
    await ComponentTestUtils.userInteraction(sendButton, 'click');
    
    // 8. 验证AI响应
    await waitFor(() => {
      expect(screen.getByText(/正在分析数据并生成图表/i)).toBeInTheDocument();
    });
    
    // 9. 验证表格生成
    await waitFor(() => {
      expect(screen.getByText(/已创建.*销售报表/i)).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // 10. 切换到图表工作台验证图表
    await ComponentTestUtils.userInteraction(
      screen.getByText('图表工作台'),
      'click'
    );
    
    await waitFor(() => {
      expect(screen.getByText(/图表.*已创建/i)).toBeInTheDocument();
    });
  });
  
  it('应该处理错误情况', async () => {
    // 模拟API错误
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    
    renderWithProviders(<App />);
    
    // 切换到AI助手
    await ComponentTestUtils.userInteraction(
      screen.getByText('AI助手'),
      'click'
    );
    
    // 发送请求
    const input = screen.getByPlaceholderText(/描述您想创建的表格/i);
    await ComponentTestUtils.userInteraction(input, 'type', {
      text: '创建测试表格'
    });
    
    const sendButton = screen.getByRole('button', { name: /发送/i });
    await ComponentTestUtils.userInteraction(sendButton, 'click');
    
    // 验证错误处理
    await waitFor(() => {
      expect(screen.getByText(/抱歉，处理时出现错误/i)).toBeInTheDocument();
    });
    
    // 验证重试按钮
    const retryButton = screen.getByRole('button', { name: /重试/i });
    expect(retryButton).toBeInTheDocument();
  });
});

describe('配置管理工作流', () => {
  it('应该完成API预设管理流程', async () => {
    renderWithProviders(<App />);
    
    // 1. 打开设置
    const settingsButton = screen.getByTitle(/设置/i);
    await ComponentTestUtils.userInteraction(settingsButton, 'click');
    
    // 2. 切换到API预设管理
    await ComponentTestUtils.userInteraction(
      screen.getByText('API预设管理'),
      'click'
    );
    
    // 3. 创建新预设
    const createButton = screen.getByText(/新建预设/i);
    await ComponentTestUtils.userInteraction(createButton, 'click');
    
    // 4. 填写预设信息
    const nameInput = screen.getByLabelText(/预设名称/i);
    await ComponentTestUtils.userInteraction(nameInput, 'type', {
      text: '测试预设'
    });
    
    const providerSelect = screen.getByLabelText(/提供商/i);
    await ComponentTestUtils.userInteraction(providerSelect, 'select', {
      value: 'openai'
    });
    
    const apiKeyInput = screen.getByLabelText(/API密钥/i);
    await ComponentTestUtils.userInteraction(apiKeyInput, 'type', {
      text: 'test-api-key'
    });
    
    // 5. 保存预设
    const saveButton = screen.getByText(/保存/i);
    await ComponentTestUtils.userInteraction(saveButton, 'click');
    
    // 6. 验证预设创建成功
    await waitFor(() => {
      expect(screen.getByText('测试预设')).toBeInTheDocument();
    });
    
    // 7. 切换预设
    const switchButton = screen.getByTitle(/切换到此预设/i);
    await ComponentTestUtils.userInteraction(switchButton, 'click');
    
    // 8. 验证切换成功
    await waitFor(() => {
      expect(screen.getByText(/当前使用/i)).toBeInTheDocument();
    });
  });
});
```

### 3.2 状态管理集成测试

```typescript
// 状态管理集成测试
describe('工作区状态管理', () => {
  it('应该正确同步工作区状态', async () => {
    const TestComponent = () => {
      const { activeWorkspace, workspaces } = useWorkspaceManager();
      const { activePreset } = useApiPresets();
      
      return (
        <div>
          <div data-testid="active-workspace">{activeWorkspace}</div>
          <div data-testid="workspace-count">{workspaces.length}</div>
          <div data-testid="active-preset">{activePreset?.name || 'none'}</div>
        </div>
      );
    };
    
    renderWithProviders(<TestComponent />);
    
    // 验证初始状态
    expect(screen.getByTestId('active-workspace')).toHaveTextContent('data');
    expect(screen.getByTestId('workspace-count')).toHaveTextContent('5');
    
    // 切换工作区
    const { result } = renderHook(() => useWorkspaceManager());
    act(() => {
      result.current.switchWorkspace('chart');
    });
    
    // 验证状态同步
    await waitFor(() => {
      expect(screen.getByTestId('active-workspace')).toHaveTextContent('chart');
    });
  });
  
  it('应该正确处理状态冲突', async () => {
    const ConflictComponent = () => {
      const [workspace, setWorkspace] = useState('data');
      const { activeWorkspace } = useWorkspaceManager();
      
      useEffect(() => {
        // 模拟外部状态变更
        setTimeout(() => {
          setWorkspace('chart');
        }, 100);
      }, []);
      
      return (
        <div>
          <div data-testid="local-workspace">{workspace}</div>
          <div data-testid="global-workspace">{activeWorkspace}</div>
        </div>
      );
    };
    
    renderWithProviders(<ConflictComponent />);
    
    // 验证初始状态一致
    expect(screen.getByTestId('local-workspace')).toHaveTextContent('data');
    expect(screen.getByTestId('global-workspace')).toHaveTextContent('data');
    
    // 等待状态变更
    await waitFor(() => {
      expect(screen.getByTestId('local-workspace')).toHaveTextContent('chart');
    });
    
    // 验证全局状态也更新
    expect(screen.getByTestId('global-workspace')).toHaveTextContent('chart');
  });
});
```

---

## 4. 性能测试

### 4.1 性能基准测试

```typescript
// 性能测试套件
describe('性能基准测试', () => {
  const performanceThresholds = {
    componentRender: 16, // 60fps = 16ms per frame
    apiResponse: 2000, // 2 seconds
    memoryUsage: 100 * 1024 * 1024, // 100MB
    animationFrameRate: 60
  };
  
  it('组件渲染性能应该在阈值内', async () => {
    const TestComponent = () => {
      const [items, setItems] = useState(Array.from({ length: 1000 }, (_, i) => i));
      
      return (
        <div>
          {items.map(item => (
            <div key={item} className="test-item">
              Item {item}
            </div>
          ))}
        </div>
      );
    };
    
    const startTime = performance.now();
    
    renderWithProviders(<TestComponent />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(performanceThresholds.componentRender);
  });
  
  it('大量数据渲染性能测试', async () => {
    const LargeDataComponent = () => {
      const data = useMemo(() => 
        Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random()
        }))
      , []);
      
      return (
        <VirtualizedList
          height={600}
          itemCount={data.length}
          itemSize={50}
        >
          {({ index, style }) => (
            <div style={style} className="list-item">
              {data[index].name}
            </div>
          )}
        </VirtualizedList>
      );
    };
    
    const startTime = performance.now();
    
    renderWithProviders(<LargeDataComponent />);
    
    // 等待虚拟化列表渲染完成
    await waitFor(() => {
      expect(screen.getByText('Item 0')).toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(50); // 虚拟化应该很快
  });
  
  it('内存使用应该在阈值内', async () => {
    if (!('memory' in performance)) {
      console.warn('Memory API not available, skipping memory test');
      return;
    }
    
    const initialMemory = (performance as any).memory.usedJSHeapSize;
    
    // 渲染大量组件
    const MemoryTestComponent = () => {
      const [items, setItems] = useState([]);
      
      useEffect(() => {
        // 模拟内存增长
        const largeArray = Array.from({ length: 50000 }, (_, i) => ({
          id: i,
          data: new Array(100).fill(`data-${i}`)
        }));
        setItems(largeArray);
      }, []);
      
      return (
        <div>
          {items.map(item => (
            <div key={item.id} className="memory-item">
              {item.data[0]}
            </div>
          ))}
        </div>
      );
    };
    
    renderWithProviders(<MemoryTestComponent />);
    
    // 等待组件渲染
    await waitFor(() => {
      expect(screen.getByText(/data-0/)).toBeInTheDocument();
    });
    
    // 强制垃圾回收（如果支持）
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
    
    // 等待一段时间让内存稳定
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const currentMemory = (performance as any).memory.usedJSHeapSize;
    const memoryIncrease = currentMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(performanceThresholds.memoryUsage);
  });
  
  it('动画性能测试', async () => {
    const AnimationTestComponent = () => {
      const [isAnimating, setIsAnimating] = useState(false);
      
      return (
        <div>
          <button 
            onClick={() => setIsAnimating(!isAnimating)}
            data-testid="animate-button"
          >
            Animate
          </button>
          <div 
            className={`animated-element ${isAnimating ? 'animating' : ''}`}
            data-testid="animated-element"
          >
            Test
          </div>
        </div>
      );
    };
    
    renderWithProviders(<AnimationTestComponent />);
    
    const animateButton = screen.getByTestId('animate-button');
    
    // 测量动画开始时间
    const startTime = performance.now();
    
    await ComponentTestUtils.userInteraction(animateButton, 'click');
    
    // 验证动画开始
    const animatedElement = screen.getByTestId('animated-element');
    expect(animatedElement).toHaveClass('animating');
    
    // 测量动画持续时间
    const animationDuration = performance.now() - startTime;
    
    // 动画应该立即开始（< 16ms）
    expect(animationDuration).toBeLessThan(16);
  });
});
```

### 4.2 负载测试

```typescript
// 负载测试
describe('负载测试', () => {
  it('应该处理并发用户操作', async () => {
    const ConcurrentTestComponent = () => {
      const [count, setCount] = useState(0);
      
      return (
        <div>
          <div data-testid="count">{count}</div>
          <button 
            onClick={() => setCount(c => c + 1)}
            data-testid="increment-button"
          >
            Increment
          </button>
        </div>
      );
    };
    
    renderWithProviders(<ConcurrentTestComponent />);
    
    const incrementButton = screen.getByTestId('increment-button');
    
    // 模拟并发点击
    const clickPromises = Array.from({ length: 100 }, () => 
      ComponentTestUtils.userInteraction(incrementButton, 'click')
    );
    
    await Promise.all(clickPromises);
    
    // 验证最终状态
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('100');
    });
  });
  
  it('应该处理大量API请求', async () => {
    const mockResponse = {
      choices: [{
        delta: {
          content: JSON.stringify({
            table: {
              title: '测试表格',
              columns: [{ key: 'test', title: '测试', type: 'text' }],
              rows: [{ test: 'data' }]
            }
          })
        }
      }]
    };
    
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ 
                done: false, 
                value: new TextEncoder().encode('data: ' + JSON.stringify(mockResponse.choices[0])) 
              })
              .mockResolvedValueOnce({ done: true })
          })
        }
      } as any)
    );
    
    const service = new TableGenerationService();
    
    // 并发发送多个请求
    const requests = Array.from({ length: 10 }, () =>
      service.generateTable({ prompt: '创建测试表格' })
    );
    
    const startTime = performance.now();
    const results = await Promise.all(requests);
    const endTime = performance.now();
    
    // 验证所有请求都成功
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
    
    // 验证总时间合理（应该比串行执行快）
    const totalTime = endTime - startTime;
    expect(totalTime).toBeLessThan(5000); // 5秒内完成
  });
});
```

---

## 5. 用户体验测试

### 5.1 可用性测试

```typescript
// 可用性测试
describe('可用性测试', () => {
  it('新用户应该能够完成基本任务', async () => {
    // 模拟新用户场景
    renderWithProviders(<App />, {
      userProfile: { isNewUser: true, experience: 'beginner' }
    });
    
    // 1. 验证欢迎界面
    expect(screen.getByText(/您好.*我是 Excel AI 助手/i)).toBeInTheDocument();
    
    // 2. 验证快捷操作提示
    expect(screen.getByText(/告诉我您想创建什么表格/i)).toBeInTheDocument();
    
    // 3. 验证快捷示例
    const quickExamples = screen.getAllByRole('button', { 
      name: /创建.*报表|员工.*表|财务.*表|生成.*图表|创建.*项目/i 
    });
    expect(quickExamples).toHaveLength(5);
    
    // 4. 测试点击快捷示例
    await ComponentTestUtils.userInteraction(quickExamples[0], 'click');
    
    // 5. 验证输入框被填充
    const input = screen.getByPlaceholderText(/描述您想创建的表格/i);
    expect(input).toHaveValue(/销售报表/);
    
    // 6. 验证发送按钮可用
    const sendButton = screen.getByRole('button', { name: /发送/i });
    expect(sendButton).not.toBeDisabled();
  });
  
  it('应该提供清晰的操作反馈', async () => {
    renderWithProviders(<App />);
    
    // 切换到AI助手
    await ComponentTestUtils.userInteraction(
      screen.getByText('AI助手'),
      'click'
    );
    
    // 发送请求
    const input = screen.getByPlaceholderText(/描述您想创建的表格/i);
    await ComponentTestUtils.userInteraction(input, 'type', {
      text: '创建测试表格'
    });
    
    const sendButton = screen.getByRole('button', { name: /发送/i });
    await ComponentTestUtils.userInteraction(sendButton, 'click');
    
    // 验证加载状态
    expect(screen.getByText(/正在生成表格/i)).toBeInTheDocument();
    expect(sendButton).toBeDisabled();
    
    // 验证处理状态指示器
    const loadingIndicator = screen.getByTestId('loading-indicator');
    expect(loadingIndicator).toBeInTheDocument();
    
    // 等待完成
    await waitFor(() => {
      expect(screen.getByText(/已创建.*测试表格/i)).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // 验证发送按钮恢复可用
    expect(sendButton).not.toBeDisabled();
  });
  
  it('应该提供有意义的错误信息', async () => {
    // 模拟API错误
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
    
    renderWithProviders(<App />);
    
    // 切换到AI助手
    await ComponentTestUtils.userInteraction(
      screen.getByText('AI助手'),
      'click'
    );
    
    // 发送请求
    const input = screen.getByPlaceholderText(/描述您想创建的表格/i);
    await ComponentTestUtils.userInteraction(input, 'type', {
      text: '创建测试表格'
    });
    
    const sendButton = screen.getByRole('button', { name: /发送/i });
    await ComponentTestUtils.userInteraction(sendButton, 'click');
    
    // 验证错误信息
    await waitFor(() => {
      expect(screen.getByText(/抱歉，处理时出现错误/i)).toBeInTheDocument();
    });
    
    // 验证错误信息具体且有用
    const errorMessage = screen.getByText(/抱歉，处理时出现错误/i);
    expect(errorMessage.parentElement).toHaveTextContent(/Network error|网络错误/i);
    
    // 验证重试选项
    const retryButton = screen.getByRole('button', { name: /重试/i });
    expect(retryButton).toBeInTheDocument();
  });
  
  it('应该支持键盘导航', async () => {
    renderWithProviders(<App />);
    
    // 验证Tab导航
    const firstFocusable = screen.getByTitle(/API Presets/i);
    firstFocusable.focus();
    expect(firstFocusable).toHaveFocus();
    
    // 测试Tab键导航
    await userEvent.keyboard('{Tab}');
    const secondFocusable = screen.getByTitle(/设置/i);
    expect(secondFocusable).toHaveFocus();
    
    // 测试Enter键激活
    await userEvent.keyboard('{Enter}');
    
    // 验证设置面板打开
    await waitFor(() => {
      expect(screen.getByText(/系统设置/i)).toBeInTheDocument();
    });
    
    // 测试Escape键关闭
    await userEvent.keyboard('{Escape}');
    
    // 验证设置面板关闭
    await waitFor(() => {
      expect(screen.queryByText(/系统设置/i)).not.toBeInTheDocument();
    });
  });
});
```

### 5.2 无障碍测试

```typescript
// 无障碍测试
describe('无障碍测试', () => {
  it('应该符合WCAG 2.1 AA标准', async () => {
    renderWithProviders(<App />);
    
    // 检查颜色对比度
    const checkColorContrast = (element: HTMLElement) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // 这里应该使用实际的对比度检查工具
      // 简化示例
      expect(color).not.toBe(backgroundColor);
    };
    
    // 检查主要文本元素
    const textElements = screen.getAllByText(/Excel AI 助手/i);
    textElements.forEach(checkColorContrast);
    
    // 检查按钮对比度
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      expect(styles.color).not.toBe(styles.backgroundColor);
    });
  });
  
  it('应该支持屏幕阅读器', async () => {
    renderWithProviders(<App />);
    
    // 检查ARIA标签
    const tabList = screen.getByRole('tablist');
    expect(tabList).toHaveAttribute('aria-label', '工作区标签');
    
    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute('aria-selected', index === 0 ? 'true' : 'false');
      expect(tab).toHaveAttribute('tabindex', index === 0 ? '0' : '-1');
    });
    
    // 检查输入框标签
    const input = screen.getByPlaceholderText(/描述您想创建的表格/i);
    expect(input).toHaveAttribute('aria-label');
    expect(input).toHaveAttribute('aria-describedby');
    
    // 检查状态指示器
    const loadingIndicator = screen.queryByTestId('loading-indicator');
    if (loadingIndicator) {
      expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
      expect(loadingIndicator).toHaveAttribute('aria-label');
    }
  });
  
  it('应该支持键盘导航', async () => {
    renderWithProviders(<App />);
    
    // 测试Tab顺序
    const focusableElements = screen.getAllByRole('button');
    let currentIndex = 0;
    
    // 验证Tab键可以遍历所有可聚焦元素
    for (let i = 0; i < focusableElements.length; i++) {
      if (i === 0) {
        focusableElements[i].focus();
      } else {
        await userEvent.keyboard('{Tab}');
        expect(focusableElements[i]).toHaveFocus();
      }
    }
    
    // 测试Shift+Tab反向遍历
    for (let i = focusableElements.length - 1; i >= 0; i--) {
      await userEvent.keyboard('{Shift+Tab}');
      expect(focusableElements[i]).toHaveFocus();
    }
  });
  
  it('应该提供视觉焦点指示', async () => {
    renderWithProviders(<App />);
    
    const button = screen.getByTitle(/API Presets/i);
    
    // 聚焦按钮
    button.focus();
    
    // 验证焦点样式
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    
    // 检查焦点环
    const styles = window.getComputedStyle(button);
    expect(styles.outline).toBeTruthy();
    expect(styles.outlineOffset).toBe('2px');
  });
});
```

---

## 6. 自动化测试流程

### 6.1 测试脚本

```typescript
// package.json 测试脚本
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:run": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:performance": "node scripts/performance-test.js",
    "test:accessibility": "node scripts/accessibility-test.js",
    "test:visual": "node scripts/visual-test.js",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e && npm run test:performance"
  }
}
```

### 6.2 持续集成配置

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:performance
      
  accessibility-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:accessibility
```

---

## 7. 测试数据管理

### 7.1 测试数据工厂

```typescript
// 测试数据工厂
class TestDataFactory {
  // 生成模拟表格数据
  static createTableData(options: {
    rowCount?: number;
    columnCount?: number;
    includeStyles?: boolean;
  } = {}): StyledTableData {
    const {
      rowCount = 5,
      columnCount = 3,
      includeStyles = false
    } = options;
    
    const columns = Array.from({ length: columnCount }, (_, i) => ({
      key: `column${i + 1}`,
      title: `列${i + 1}`,
      type: i === 0 ? 'text' : i === 1 ? 'number' : 'date',
      width: 120,
      format: i === 1 ? '#,##0.00' : undefined
    }));
    
    const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
      const row: Record<string, any> = {};
      columns.forEach((col, colIndex) => {
        switch (col.type) {
          case 'text':
            row[col.key] = `数据${rowIndex + 1}-${colIndex + 1}`;
            break;
          case 'number':
            row[col.key] = Math.floor(Math.random() * 1000);
            break;
          case 'date':
            row[col.key] = new Date(2024, 0, rowIndex + 1).toISOString();
            break;
        }
      });
      return row;
    });
    
    const tableData: StyledTableData = {
      tableName: `测试表格${Date.now()}`,
      columns,
      rows,
      metadata: {
        createdAt: new Date().toISOString(),
        source: 'test'
      }
    };
    
    if (includeStyles) {
      tableData.style = {
        colorTheme: 'professional',
        excelTableStyle: 'TableStyleMedium2',
        header: {
          backgroundColor: '#4472C4',
          fontColor: '#FFFFFF',
          bold: true,
          align: 'center'
        }
      };
    }
    
    return tableData;
  }
  
  // 生成模拟API预设
  static createApiPreset(overrides: Partial<ApiPreset> = {}): ApiPreset {
    return {
      id: `preset-${Date.now()}`,
      name: '测试预设',
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'test-api-key',
      model: 'gpt-4',
      description: '测试用的API预设',
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customHeaders: {},
      timeout: 180000,
      maxRetries: 3,
      useProxy: true,
      providerConfig: {},
      ...overrides
    };
  }
  
  // 生成模拟用户配置
  static createUserConfig(overrides: Partial<UnifiedConfig> = {}): UnifiedConfig {
    return {
      api: {
        activePreset: 'test-preset',
        presets: [this.createApiPreset()],
        fallbackSettings: {
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'test-key',
          model: 'gpt-4',
          timeout: 60
        }
      },
      ui: {
        theme: {
          mode: 'auto',
          gradient: 'cyber-blue',
          glassOpacity: 0.1,
          animationSpeed: 'normal',
          customColors: {}
        },
        layout: {
          sidebarWidth: 250,
          tabBarPosition: 'top',
          compactMode: false,
          showTooltips: true,
          autoHidePanels: false
        },
        shortcuts: {},
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          screenReader: false
        }
      },
      workspace: {
        defaultWorkspace: 'data',
        autoSave: true,
        maxHistoryEntries: 50,
        collaboration: {
          enabled: false,
          showCursors: true,
          showSelections: true
        }
      },
      features: {
        tableGeneration: {
          enabled: true,
          autoStyle: true,
          defaultRowCount: 5
        },
        chartGeneration: {
          enabled: true,
          autoRecommend: true,
          defaultType: 'column'
        },
        fileProcessing: {
          enabled: true,
          maxFileSize: 100 * 1024 * 1024,
          supportedFormats: ['.csv', '.xlsx', '.json']
        },
        aiAssistant: {
          enabled: true,
          streaming: true,
          suggestions: true
        }
      },
      advanced: {
        debugMode: false,
        performanceMode: false,
        telemetry: {
          enabled: false,
          anonymize: true
        },
        experimental: {
          enabled: false,
          features: []
        }
      },
      ...overrides
    };
  }
}
```

### 7.2 测试环境配置

```typescript
// 测试环境配置
export const testConfig = {
  // API配置
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 5000,
    retries: 3
  },
  
  // 测试数据
  testData: {
    tableSizes: {
      small: { rows: 10, columns: 3 },
      medium: { rows: 100, columns: 10 },
      large: { rows: 1000, columns: 20 }
    },
    
    fileTypes: [
      { extension: '.csv', mimeType: 'text/csv', size: 1024 },
      { extension: '.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 2048 },
      { extension: '.json', mimeType: 'application/json', size: 512 }
    ]
  },
  
  // 性能阈值
  performance: {
    renderTime: 16, // 60fps
    apiResponseTime: 2000,
    memoryUsage: 100 * 1024 * 1024, // 100MB
    animationFrameRate: 60
  },
  
  // 浏览器配置
  browsers: [
    { name: 'chromium', version: 'latest' },
    { name: 'firefox', version: 'latest' },
    { name: 'webkit', version: 'latest' }
  ],
  
  // 视口配置
  viewports: [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' }
  ]
};
```

---

## 8. 实现计划

### 8.1 开发阶段

#### 阶段一：基础测试框架 (1周)
- [ ] 完善单元测试覆盖
- [ ] 建立组件测试规范
- [ ] 实现测试工具库
- [ ] 配置测试环境

#### 阶段二：集成测试 (1周)
- [ ] 实现工作流测试
- [ ] 建立状态管理测试
- [ ] 添加API集成测试
- [ ] 实现端到端测试

#### 阶段三：性能测试 (3天)
- [ ] 建立性能基准
- [ ] 实现负载测试
- [ ] 添加内存监控
- [ ] 性能回归测试

#### 阶段四：用户体验测试 (3天)
- [ ] 可用性测试
- [ ] 无障碍测试
- [ ] 跨浏览器测试
- [ ] 响应式测试

#### 阶段五：自动化流程 (2天)
- [ ] CI/CD集成
- [ ] 测试报告生成
- [ ] 质量门禁
- [ ] 持续监控

### 8.2 测试策略

#### 核心原则
- **测试左移** - 在开发早期就开始测试
- **测试自动化** - 减少手动测试工作量
- **测试数据管理** - 确保测试数据的可重复性
- **测试环境隔离** - 避免测试间的相互影响

#### 质量标准
- **代码覆盖率** > 80%
- **关键路径覆盖率** 100%
- **性能回归** < 5%
- **用户体验评分** > 4.5/5

---

## 9. 成功指标

### 9.1 测试质量指标
- **测试覆盖率** 达到85%以上
- **缺陷发现率** 在开发阶段达到90%
- **回归缺陷率** 降低到5%以下
- **测试执行时间** 控制在30分钟内

### 9.2 用户体验指标
- **用户满意度** 达到95%
- **任务完成率** 达到98%
- **错误率** 降低到2%以下
- **学习成本** 新用户10分钟内上手

这个测试和用户体验调优方案将确保新架构的稳定性和可靠性，同时提供卓越的用户体验。