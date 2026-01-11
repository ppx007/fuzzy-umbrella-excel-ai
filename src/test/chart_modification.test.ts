import { describe, it, expect, vi, beforeEach } from 'vitest';
import { excelAdapter } from '../adapters/excel-adapter';

// Mock Excel global object
const mockChart = {
  title: {
    text: '',
    visible: true,
  },
  legend: {
    visible: true,
    position: 'right',
  },
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  name: 'TestChart',
  load: vi.fn(),
  series: {
    load: vi.fn(),
    items: [],
  },
};

const mockSheet = {
  charts: {
    add: vi.fn(() => mockChart),
    getItem: vi.fn(() => mockChart),
    load: vi.fn(),
    items: [mockChart],
  },
  getRange: vi.fn(() => ({})),
};

const mockContext = {
  workbook: {
    worksheets: {
      getItem: vi.fn(() => mockSheet),
      getActiveWorksheet: vi.fn(() => mockSheet),
    },
  },
  sync: vi.fn(),
};

global.Excel = {
  run: vi.fn(async callback => {
    await callback(mockContext);
  }),
  // @ts-ignore
  ChartSeriesBy: {
    auto: 'Auto',
  },
  // @ts-ignore
  ChartLegendPosition: {
    right: 'Right',
  },
} as any;

// Mock Office global object
global.Office = {
  context: {
    host: 'Excel',
  },
  HostType: {
    Excel: 'Excel',
  },
} as any;

describe('Chart Modification (Sunburst/Treemap)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockChart.title.text = '';
    mockChart.legend.visible = true;
    mockChart.legend.position = 'right';
  });

  it('should handle "Not implemented" errors gracefully when creating/modifying Sunburst charts', async () => {
    // 1. Mock a "Not implemented" error when setting the legend
    const notImplementedError = new Error('RichApi.Error: Not implemented');
    const originalDescriptor = Object.getOwnPropertyDescriptor(mockChart.legend, 'position');

    // Use Object.defineProperty to simulate the error on property access
    Object.defineProperty(mockChart.legend, 'position', {
      set: vi.fn(() => {
        throw notImplementedError;
      }),
      get: vi.fn(() => 'right'),
      configurable: true,
    });

    // 2. Call createChartV2 with Sunburst type
    const chartName = await excelAdapter.createChartV2(
      'A1:B5', // dummy range
      'sunburst',
      {
        title: 'Sales Hierarchy',
        showLegend: true,
        legendPosition: 'right',
      }
    );

    // 3. Verify that the chart was still created successfully
    expect(chartName).toBe('TestChart');
    expect(Excel.run).toHaveBeenCalled();
    expect(mockSheet.charts.add).toHaveBeenCalledWith(
      'Sunburst', // The type should be correctly mapped
      expect.any(Object),
      'Auto'
    );

    // 4. Verify that the error was caught and logged
    // The console.warn should have been called due to the try-catch block
    expect(console.warn).toHaveBeenCalledWith(
      '[ExcelAdapter] 设置图表图例失败:',
      notImplementedError
    );

    // Restore original property descriptor
    if (originalDescriptor) {
      Object.defineProperty(mockChart.legend, 'position', originalDescriptor);
    }
  });

  it('should handle "Not implemented" errors gracefully when creating/modifying Treemap charts', async () => {
    // 1. Mock a "Not implemented" error when setting the title
    const notImplementedError = new Error('RichApi.Error: Not implemented');
    const originalDescriptor = Object.getOwnPropertyDescriptor(mockChart.title, 'text');

    Object.defineProperty(mockChart.title, 'text', {
      set: vi.fn(() => {
        throw notImplementedError;
      }),
      get: vi.fn(() => 'Sales Hierarchy'),
      configurable: true,
    });

    // 2. Call createChartV2 with Treemap type
    const chartName = await excelAdapter.createChartV2(
      'A1:C5', // dummy range
      'treemap',
      {
        title: 'Product Treemap',
      }
    );

    // 3. Verify that the chart was still created successfully
    expect(chartName).toBe('TestChart');
    expect(mockSheet.charts.add).toHaveBeenCalledWith(
      'Treemap', // The type should be correctly mapped
      expect.any(Object),
      'Auto'
    );

    // 4. Verify that the error was caught and logged
    expect(console.warn).toHaveBeenCalledWith(
      '[ExcelAdapter] 设置图表标题失败:',
      notImplementedError
    );

    // Restore original property descriptor
    if (originalDescriptor) {
      Object.defineProperty(mockChart.title, 'text', originalDescriptor);
    }
  });

  it('should create standard charts without errors', async () => {
    // 1. Call createChartV2 with a standard chart type (Column)
    const chartName = await excelAdapter.createChartV2('A1:B5', 'column', {
      title: 'Sales Report',
      showLegend: true,
      legendPosition: 'bottom',
    });

    // 2. Verify successful creation
    expect(chartName).toBe('TestChart');
    expect(mockSheet.charts.add).toHaveBeenCalledWith(
      'ColumnClustered',
      expect.any(Object),
      'Auto'
    );
    expect(mockChart.title.text).toBe('Sales Report');
    expect(mockChart.legend.position).toBe('Bottom');

    // 3. No warnings should have been logged
    expect(console.warn).not.toHaveBeenCalled();
  });
});
